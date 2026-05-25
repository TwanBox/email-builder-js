import { create } from 'zustand';

import { renderToStaticMarkup } from '@usewaypoint/email-builder';

import getConfiguration from '../../getConfiguration';
import { stripHtmlToText } from '../../utils/stripHtmlToText';

import { TEditorConfiguration } from './core';

type TValue = {
  document: TEditorConfiguration;

  selectedBlockId: string | null;
  selectedSidebarTab: 'block-configuration' | 'styles' | 'default-variables';
  selectedMainTab: 'editor' | 'preview' | 'json' | 'html';
  selectedScreenSize: 'desktop' | 'mobile';

  inspectorDrawerOpen: boolean;
  samplesDrawerOpen: boolean;

  textOnly: boolean;
  textBody: string;
};

const editorStateStore = create<TValue>(() => ({
  document: getConfiguration(window.location.hash),
  selectedBlockId: null,
  selectedSidebarTab: 'styles',
  selectedMainTab: 'editor',
  selectedScreenSize: 'desktop',

  inspectorDrawerOpen: true,
  samplesDrawerOpen: true,

  textOnly: false,
  textBody: '',
}));

// Listen for LOAD_TEMPLATE messages from the parent window
window.addEventListener('message', (event: MessageEvent) => {
  if (event.data?.type === 'LOAD_TEMPLATE') {
    const { textOnly, textBody } = event.data.payload ?? {};
    if (typeof textOnly === 'boolean') {
      editorStateStore.setState({ textOnly });
    }
    if (typeof textBody === 'string') {
      editorStateStore.setState({ textBody });
    }
  }
});

export function useDocument() {
  return editorStateStore((s) => s.document);
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

  const newConfig = editorStateStore.getState().document;
  const { textOnly, textBody } = editorStateStore.getState();

  if (window.parent) {
    window.parent.postMessage(
      {
        type: "CONFIG_UPDATED",
        payload: { document: newConfig, textOnly, textBody }
      },
      "*"
    );
  }

  return newConfig;
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
    const html = renderToStaticMarkup(state.document, { rootBlockId: 'root' });
    textBody = stripHtmlToText(html);
  }

  editorStateStore.setState({ textOnly, textBody });

  const document = editorStateStore.getState().document;

  if (window.parent) {
    window.parent.postMessage(
      {
        type: "CONFIG_UPDATED",
        payload: { document, textOnly, textBody }
      },
      "*"
    );
  }
}

export function setTextBodyAndNotify(textBody: string) {
  editorStateStore.setState({ textBody });

  const { document, textOnly } = editorStateStore.getState();

  if (window.parent) {
    window.parent.postMessage(
      {
        type: "CONFIG_UPDATED",
        payload: { document, textOnly, textBody }
      },
      "*"
    );
  }
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
