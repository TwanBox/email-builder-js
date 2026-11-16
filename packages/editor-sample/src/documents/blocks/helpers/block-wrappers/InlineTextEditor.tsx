import React, { useEffect, useRef, useState } from 'react';

import { useCurrentBlockId } from '../../../editor/EditorBlock';
import { setDocument, useDocument, useSelectedBlockId } from '../../../editor/EditorContext';

export const INLINE_TEXT_EDITED = 'inline-text-edited';

// Blocks with these are only changed through the inspector's content field: turning them back into
// Markdown after typing could change them.
const NOT_INLINE = 'ul,ol,table,h1,h2,h3,h4,h5,h6,blockquote,pre,img,hr';
const BLOCK_TAGS = new Set(['P', 'DIV']);

/** Moves spaces outside a Markdown mark: "** bold **" would not be bold. */
function mark(marker: string, inner: string): string {
  const match = /^(\s*)([\s\S]*?)(\s*)$/.exec(inner);
  if (!match || !match[2]) return inner;
  return `${match[1]}${marker}${match[2]}${marker}${match[3]}`;
}

function inlineMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return (node.nodeValue ?? '').replace(/ /g, ' ');
  if (node.nodeType !== Node.ELEMENT_NODE) return '';
  const element = node as HTMLElement;
  const inner = () => Array.from(element.childNodes).map(inlineMarkdown).join('');
  switch (element.tagName) {
    case 'BR':
      return '\n';
    case 'STRONG':
    case 'B':
      return mark('**', inner());
    case 'EM':
    case 'I':
      return mark('*', inner());
    case 'DEL':
    case 'S':
      return mark('~~', inner());
    case 'CODE':
      return mark('`', inner());
    case 'A': {
      const href = element.getAttribute('href');
      const text = inner();
      return href ? `[${text}](${href})` : text;
    }
    default:
      return inner();
  }
}

const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** One Markdown line as it shows: bold, italic, strikethrough, code and links; the rest as text. */
function inlineHtml(line: string): string {
  return escapeHtml(line)
    .replace(/\[([^\]]*)\]\(([^)\s]+)\)/g, (_m, text, href) => `<a href="${href}" target="_blank">${text}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
}

/**
 * The text for editing, line by line as in the inspector's field: a line of text is a line, an
 * empty line (the space between two paragraphs) a line of its own that can be typed in. The empty
 * line is 1em high and the first and last line keep a paragraph's 1em margin, so the block keeps the
 * height it had as rendered Markdown and nothing moves.
 */
function editableHtml(source: string): string {
  const lines = source.split('\n');
  return lines
    .map((line, index) => {
      const edge = `${index === 0 ? 'margin-top:1em;' : ''}${index === lines.length - 1 ? 'margin-bottom:1em;' : ''}`;
      return line.trim() === ''
        ? `<div style="${edge}line-height:1em"><br></div>`
        : `<div style="${edge}">${inlineHtml(line)}</div>`;
    })
    .join('');
}

/**
 * An empty line stays 1em high and one that got text the normal line height; only the first line has
 * the top margin and only the last the bottom margin (Enter copies a line's style to the new one).
 */
function fitEmptyLines(root: HTMLElement) {
  const lines = Array.from(root.children) as HTMLElement[];
  lines.forEach((line, index) => {
    line.style.marginTop = index === 0 ? '1em' : '0';
    line.style.marginBottom = index === lines.length - 1 ? '1em' : '0';
    line.style.lineHeight = line.textContent === '' ? '1em' : '';
  });
}

/** The lines as typed, back as Markdown: every line a line, an empty line an empty line. */
export function toMarkdown(root: HTMLElement): string {
  const lines: string[] = [];
  let current: string | null = null;
  for (const child of Array.from(root.childNodes)) {
    const element = child as HTMLElement;
    if (child.nodeType === Node.ELEMENT_NODE && BLOCK_TAGS.has(element.tagName)) {
      if (current !== null) lines.push(current);
      current = null;
      lines.push(element.textContent === '' ? '' : inlineMarkdown(element).replace(/\n$/, ''));
    } else {
      current = (current ?? '') + inlineMarkdown(child);
    }
  }
  if (current !== null) lines.push(current);
  return lines.join('\n').replace(/\n+$/, '');
}

/** A heading or plain text as typed; a heading on one line. */
function plainText(element: HTMLElement, singleLine: boolean): string {
  const text = element.innerText.replace(/\n$/, '');
  return singleLine ? text.replace(/\s*\n\s*/g, ' ') : text;
}

/**
 * Text typed straight into the canvas: a selected Text or Heading block can be clicked again and
 * changed where it stands, besides the "content" field of the inspector. It keeps its look: bold
 * stays bold, links stay links, and the space between paragraphs becomes an empty line of the same
 * height that can be typed in, as in the inspector's field (see editableHtml).
 *
 * Only what was typed in is saved, when leaving the block: a Markdown text is written back as
 * Markdown, a heading or plain text as its text. A block with lists, tables and the like is left to
 * the inspector. Enter makes a new line in a text (an empty line between two lines makes them two
 * paragraphs, as in the inspector's field) and finishes a heading; Escape puts the text back as it
 * was; pasted text comes in without its formatting.
 */
export default function InlineTextEditor({ children, singleLine = false }: { children: JSX.Element; singleLine?: boolean }) {
  const blockId = useCurrentBlockId();
  const selected = useSelectedBlockId() === blockId;
  const block = useDocument()[blockId] as { type: string; data: { props?: { text?: string | null; markdown?: boolean } } } | undefined;
  const source = block?.data?.props?.text ?? '';
  const markdown = block?.data?.props?.markdown === true && !singleLine;
  const host = useRef<HTMLDivElement>(null);
  // A new key draws the block again from its props once editing is over (and after Escape).
  const [version, setVersion] = useState(0);
  const editing = useRef(false);

  useEffect(() => {
    const element = host.current?.firstElementChild as HTMLElement | null;
    if (!element) return;
    if (!selected) {
      if (editing.current) {
        editing.current = false;
        setVersion((n) => n + 1);
      }
      return;
    }
    if (markdown && element.querySelector(NOT_INLINE)) return;

    editing.current = true;
    let typed = false;
    if (markdown) {
      element.innerHTML = editableHtml(source);
      element.contentEditable = 'true';
    } else {
      try {
        element.contentEditable = 'plaintext-only';
      } catch {
        element.contentEditable = 'true';
      }
    }
    element.style.outline = 'none';
    element.style.cursor = 'text';

    const onInput = () => {
      typed = true;
      if (markdown) fitEmptyLines(element);
    };
    const onBlur = () => {
      if (!typed || !block) return;
      typed = false;
      const next = markdown ? toMarkdown(element) : plainText(element, singleLine);
      if (next === source) return;
      setDocument({ [blockId]: { ...block, data: { ...block.data, props: { ...block.data.props, text: next } } } as never });
      // The inspector's content field keeps what it last showed; this tells it to show the new text.
      window.dispatchEvent(new CustomEvent(INLINE_TEXT_EDITED, { detail: blockId }));
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        typed = false;
        element.blur();
        setVersion((n) => n + 1);
      } else if (event.key === 'Enter' && singleLine) {
        event.preventDefault();
        element.blur();
      }
    };
    const onPaste = (event: ClipboardEvent) => {
      event.preventDefault();
      document.execCommand('insertText', false, event.clipboardData?.getData('text/plain') ?? '');
    };
    element.addEventListener('input', onInput);
    element.addEventListener('blur', onBlur);
    element.addEventListener('keydown', onKeyDown);
    element.addEventListener('paste', onPaste);
    return () => {
      element.removeEventListener('input', onInput);
      element.removeEventListener('blur', onBlur);
      element.removeEventListener('keydown', onKeyDown);
      element.removeEventListener('paste', onPaste);
    };
    // Set up once per selection (and drawing); the text itself is read when leaving the block.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, version]);

  return (
    <div ref={host} key={version}>
      {children}
    </div>
  );
}
