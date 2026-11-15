import { useEffect, useState } from 'react';

import { INLINE_TEXT_EDITED } from './InlineTextEditor';

/** Goes up when the text was edited in the canvas, so the inspector's content field can show it. */
export default function useInlineEditRevision(): number {
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const bump = () => setRevision((n) => n + 1);
    window.addEventListener(INLINE_TEXT_EDITED, bump);
    return () => window.removeEventListener(INLINE_TEXT_EDITED, bump);
  }, []);
  return revision;
}
