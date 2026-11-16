import { create } from 'zustand';

import { renderToStaticMarkup } from '@usewaypoint/email-builder';

import getConfiguration from '../../getConfiguration';
import { stripHtmlToText } from '../../utils/stripHtmlToText';

import { EMPTY_BRAND, parseBrand, renderable, TBrand, TCampaignSettings } from './brandTokens';
import { TEditorConfiguration } from './core';

type TValue = {
  document: TEditorConfiguration;
  // False while the builder is embedded and still waits for its mail: `document` is a placeholder
  // until then, and anything said about it would be about the wrong mail.
  templateLoaded: boolean;

  selectedBlockId: string | null;
  selectedSidebarTab: 'block-configuration' | 'styles' | 'default-variables';
  selectedMainTab: 'editor' | 'preview' | 'json' | 'html';
  selectedScreenSize: 'desktop' | 'mobile';

  inspectorDrawerOpen: boolean;
  samplesDrawerOpen: boolean;

  textOnly: boolean;
  textBody: string;

  brand: TBrand;
  // The campaign's settings (logo layout, branding bars, meeting button) that were changed here,
  // through a field linked to them. They go to tele-mailing with every CONFIG_UPDATED, which saves
  // them on the campaign with the mail. A new end client logo goes along the same way.
  campaignChanges: Partial<TCampaignSettings> & { endClientLogoUrl?: string };

  // Whether the end client logo can be replaced here: tele-mailing says so for a mail with a campaign.
  canEditLogo: boolean;
  // A new end client logo on its way: tele-mailing converts and stores it, and answers.
  logoUpload: { busy: boolean; error: TLogoError | null };
};

/** Why a new logo did not come through, as tele-mailing says it. */
export type TLogoError = 'tooLarge' | 'unreadable' | 'notFetched' | 'failed';
const LOGO_ERRORS: TLogoError[] = ['tooLarge', 'unreadable', 'notFetched', 'failed'];

const editorStateStore = create<TValue>(() => ({
  document: getConfiguration(window.location.hash),
  // Opened on its own, the builder edits the document it starts with.
  templateLoaded: window.parent === window,
  selectedBlockId: null,
  selectedSidebarTab: 'styles',
  selectedMainTab: 'editor',
  selectedScreenSize: 'desktop',

  inspectorDrawerOpen: true,
  samplesDrawerOpen: true,

  textOnly: false,
  textBody: '',

  brand: EMPTY_BRAND,
  campaignChanges: {},

  canEditLogo: false,
  logoUpload: { busy: false, error: null },
}));

// Listen for LOAD_TEMPLATE messages from the parent window.
// Registered at module-eval (before React mounts) so it fires even when
// the parent sends the message synchronously after iframe load.
window.addEventListener('message', (event: MessageEvent) => {
  if (event.data?.type === 'LOAD_TEMPLATE') {
    const { config, textOnly, textBody, brand } = event.data.payload ?? {};

    if (config && typeof config === 'object' && config.root) {
      editorStateStore.setState({
        document: config as TEditorConfiguration,
        templateLoaded: true,
        selectedBlockId: null,
        selectedSidebarTab: 'styles',
      });
    }
    if (typeof textOnly === 'boolean') {
      editorStateStore.setState({ textOnly });
    }
    if (typeof textBody === 'string') {
      editorStateStore.setState({ textBody });
    }
    // The campaign's and organisation's logo and colours, for previewing brand tokens.
    // A load is a fresh start: after a save tele-mailing sends the saved values back.
    editorStateStore.setState({
      brand: parseBrand(brand),
      campaignChanges: {},
      canEditLogo: event.data.payload?.canEditLogo === true,
      logoUpload: { busy: false, error: null },
    });
  }

  // The answer to requestEndClientLogo: the new logo stored, with the logo settings that fit it.
  if (event.data?.type === 'LOGO_READY') {
    applyEndClientLogo(event.data.payload?.url, event.data.payload?.layout);
  }
  if (event.data?.type === 'LOGO_FAILED') {
    const error = event.data.payload?.error;
    editorStateStore.setState({ logoUpload: { busy: false, error: LOGO_ERRORS.includes(error) ? error : 'failed' } });
  }
});

/**
 * A new end client logo: a file dropped, chosen or pasted, or the address of an image dragged from a
 * website. tele-mailing converts it to PNG and stores it as the wizard does, and answers with
 * LOGO_READY or LOGO_FAILED.
 */
export async function requestEndClientLogo(input: { file: File } | { url: string }) {
  if (!window.parent || window.parent === window) return;
  editorStateStore.setState({ logoUpload: { busy: true, error: null } });
  if ('file' in input) {
    // A copy in memory, not the file on disk: Chrome lets only this frame upload a chosen or dropped
    // file, and tele-mailing (another site in production) would get net::ERR_ACCESS_DENIED.
    let file: File;
    try {
      file = new File([await input.file.arrayBuffer()], input.file.name, { type: input.file.type });
    } catch {
      editorStateStore.setState({ logoUpload: { busy: false, error: 'unreadable' } });
      return;
    }
    window.parent.postMessage({ type: 'LOGO_FILE', payload: { file } }, '*');
    return;
  }
  window.parent.postMessage({ type: 'LOGO_URL', payload: { url: input.url } }, '*');
}

/**
 * The new end client logo in the canvas, with the logo settings that fit it (width, padding, the
 * brand colour behind it, the branding bar above it), as campaign changes: saved on the campaign
 * with the mail, like a linked field.
 */
function applyEndClientLogo(url: unknown, layout: unknown) {
  const { brand, campaignChanges } = editorStateStore.getState();
  // Read like a LOAD_TEMPLATE brand: only an https address and values in range come through.
  const parsed = parseBrand({ endClient: { ...(layout && typeof layout === 'object' ? layout : {}), logoUrl: url } }).endClient;
  if (!parsed.logoUrl) {
    editorStateStore.setState({ logoUpload: { busy: false, error: 'failed' } });
    return;
  }
  const values = {
    logoWidth: parsed.logoWidth,
    logoPaddingTop: parsed.logoPaddingTop,
    logoPaddingBottom: parsed.logoPaddingBottom,
    logoBackground: parsed.logoBackground,
    headerBrandingBar: parsed.headerBrandingBar,
  };
  editorStateStore.setState({
    brand: { ...brand, endClient: { ...brand.endClient, logoUrl: parsed.logoUrl, ...values } },
    campaignChanges: { ...campaignChanges, endClientLogoUrl: parsed.logoUrl, ...values },
    logoUpload: { busy: false, error: null },
  });
  notifyParent();
}

// Tell tele-mailing what there is to save: the template, the text version and any campaign setting
// that was changed through a linked field.
function notifyParent() {
  const { document, textOnly, textBody, campaignChanges } = editorStateStore.getState();
  if (!window.parent) return;
  window.parent.postMessage(
    {
      type: 'CONFIG_UPDATED',
      payload: {
        document,
        textOnly,
        textBody,
        ...(Object.keys(campaignChanges).length > 0 && { campaign: campaignChanges }),
      },
    },
    '*'
  );
}

// Tell the parent we're ready so it can push LOAD_TEMPLATE without racing
// the iframe `load` event.
if (window.parent && window.parent !== window) {
  window.parent.postMessage({ type: 'BUILDER_READY' }, '*');
}

export function useDocument() {
  return editorStateStore((s) => s.document);
}

export function useCanEditLogo() {
  return editorStateStore((s) => s.canEditLogo);
}

export function useLogoUpload() {
  return editorStateStore((s) => s.logoUpload);
}

export function useBrand() {
  return editorStateStore((s) => s.brand);
}

/** Whether `useDocument` is the mail that is being edited, and no longer the placeholder from before it arrived. */
export function useTemplateLoaded() {
  return editorStateStore((s) => s.templateLoaded);
}

export function useSelectedBlockId() {
  return editorStateStore((s) => s.selectedBlockId);
}

export function useSelectedScreenSize() {
  return editorStateStore((s) => s.selectedScreenSize);
}

export function useSelectedMainTab() {
  return editorStateStore((s) => s.selectedMainTab);
}

export function setSelectedMainTab(selectedMainTab: TValue['selectedMainTab']) {
  return editorStateStore.setState({ selectedMainTab });
}

export function useSelectedSidebarTab() {
  return editorStateStore((s) => s.selectedSidebarTab);
}

export function useInspectorDrawerOpen() {
  return editorStateStore((s) => s.inspectorDrawerOpen);
}

export function useSamplesDrawerOpen() {
  return editorStateStore((s) => s.samplesDrawerOpen);
}

export function setSelectedBlockId(selectedBlockId: TValue['selectedBlockId']) {
  const selectedSidebarTab = selectedBlockId === null ? 'styles' : 'block-configuration';
  const options: Partial<TValue> = {};
  if (selectedBlockId !== null) {
    options.inspectorDrawerOpen = true;
  }
  return editorStateStore.setState({
    selectedBlockId,
    selectedSidebarTab,
    ...options,
  });
}

export function setSidebarTab(selectedSidebarTab: TValue['selectedSidebarTab']) {
  return editorStateStore.setState({ selectedSidebarTab });
}

export function resetDocument(document: TValue['document']) {
  return editorStateStore.setState({
    document,
    selectedSidebarTab: 'styles',
    selectedBlockId: null,
  });
}

export function setDocument(document: TValue['document']) {
  const originalDocument = editorStateStore.getState().document;

  editorStateStore.setState({
    document: {
      ...originalDocument,
      ...document,
    },
  });

  notifyParent();

  return editorStateStore.getState().document;
}

/**
 * Change a setting of the campaign from a field that is linked to it. The template keeps its token;
 * every block linked to the setting follows in the canvas, and the mails of the campaign that are
 * linked to it follow once tele-mailing has saved it.
 */
export function setCampaignLayoutValue<K extends keyof TCampaignSettings>(field: K, value: TCampaignSettings[K]) {
  const { brand, campaignChanges } = editorStateStore.getState();
  editorStateStore.setState({
    brand: { ...brand, endClient: { ...brand.endClient, [field]: value } },
    campaignChanges: { ...campaignChanges, [field]: value },
  });
  notifyParent();
}

/**
 * The mail a text version is made from: without the blocks that are switched off, and with its
 * location line in place of the meeting button, which plain text cannot show.
 */
export function textVersionSource(document: TEditorConfiguration, brand: TBrand): TEditorConfiguration {
  return renderable(document, brand, { meetingButton: false });
}

export function useTextOnly() {
  return editorStateStore((s) => s.textOnly);
}

export function useTextBody() {
  return editorStateStore((s) => s.textBody);
}

export function setTextOnlyAndNotify(textOnly: boolean) {
  const state = editorStateStore.getState();

  // Auto-populate textBody from the rendered HTML when enabling text-only for the first time
  let textBody = state.textBody;
  if (textOnly && !textBody) {
    const html = renderToStaticMarkup(textVersionSource(state.document, state.brand), { rootBlockId: 'root' });
    textBody = stripHtmlToText(html);
  }

  editorStateStore.setState({ textOnly, textBody });

  notifyParent();
}

export function setTextBodyAndNotify(textBody: string) {
  editorStateStore.setState({ textBody });

  notifyParent();
}

export function toggleInspectorDrawerOpen() {
  const inspectorDrawerOpen = !editorStateStore.getState().inspectorDrawerOpen;
  return editorStateStore.setState({ inspectorDrawerOpen });
}

export function toggleSamplesDrawerOpen() {
  const samplesDrawerOpen = !editorStateStore.getState().samplesDrawerOpen;
  return editorStateStore.setState({ samplesDrawerOpen });
}

export function setSelectedScreenSize(selectedScreenSize: TValue['selectedScreenSize']) {
  return editorStateStore.setState({ selectedScreenSize });
}
