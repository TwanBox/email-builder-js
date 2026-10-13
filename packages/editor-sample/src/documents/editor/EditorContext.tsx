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
  // them on the campaign with the mail.
  campaignChanges: Partial<TCampaignSettings>;
};

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
    editorStateStore.setState({ brand: parseBrand(brand), campaignChanges: {} });
  }
});

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
