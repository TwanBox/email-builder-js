import React, { createContext, useContext } from 'react';

import { resolveBrandTokens } from './brandTokens';
import { EditorBlock as CoreEditorBlock } from './core';
import { useBrand, useDocument } from './EditorContext';

const EditorBlockContext = createContext<string | null>(null);
export const useCurrentBlockId = () => useContext(EditorBlockContext)!;

type EditorBlockProps = {
  id: string;
};

/**
 *
 * @param id - Block id
 * @returns EditorBlock component that loads data from the EditorDocumentContext
 */
export default function EditorBlock({ id }: EditorBlockProps) {
  const document = useDocument();
  const brand = useBrand();
  const block = document[id];
  if (!block) {
    throw new Error('Could not find block');
  }
  // The canvas shows brand tokens with the campaign's real logo and colours; the document keeps the tokens.
  return (
    <EditorBlockContext.Provider value={id}>
      <CoreEditorBlock {...resolveBrandTokens(block, brand)} />
    </EditorBlockContext.Provider>
  );
}
