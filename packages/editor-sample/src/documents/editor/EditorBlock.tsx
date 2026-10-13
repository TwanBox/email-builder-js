import React, { createContext, useContext, useMemo } from 'react';

import { resolveBrandTokens } from './brandTokens';
import { withoutLocationLines } from './locationLine';
import { meetingButtonShown } from './meetingButton';
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
  // A mail that shows its meeting button does not show its location line; the document keeps the line.
  const hideLocationLine = useMemo(() => block?.type === 'Text' && meetingButtonShown(document, brand), [block, document, brand]);
  if (!block) {
    throw new Error('Could not find block');
  }
  // The canvas shows brand tokens with the campaign's real logo and colours; the document keeps the tokens.
  let shown = resolveBrandTokens(block, brand);
  if (hideLocationLine && shown.type === 'Text' && typeof shown.data.props?.text === 'string') {
    const text = withoutLocationLines(shown.data.props.text);
    if (text !== shown.data.props.text) shown = { ...shown, data: { ...shown.data, props: { ...shown.data.props, text } } };
  }
  return (
    <EditorBlockContext.Provider value={id}>
      <CoreEditorBlock {...shown} />
    </EditorBlockContext.Provider>
  );
}
