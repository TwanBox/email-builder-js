/**
 * The location line of a mail, and the choice between that line and the meeting button
 * (tele-mailing-backend docs/specs/brand-variables.md §3.10). The same rules as
 * tele-mailing-backend src/utils/meeting-button.ts, which applies them when a mail is sent: keep the
 * two the same.
 *
 * A location line is a line of a Text block that ends on the location variable and holds no other
 * variable (`Locatie: {{LOCATIE_AFSPRAAK}}`, in any wording). A mail with a meeting button - a
 * Button block marked `props.meetingButton` - shows that button or its location line, never both.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TBlocks = Record<string, any>;

// Must match LOCATIE_AFSPRAAK in standardVariables.ts.
const LOCATION_VARIABLE = '{{\\s*(LOCATIE_AFSPRAAK|LOCATION_APPOINTMENT)\\s*}}';
const EXACT_LOCATION = new RegExp(`^\\s*${LOCATION_VARIABLE}\\s*$`);
// What may follow the variable is what closes a sentence or a markdown emphasis; a word after it
// makes the line somebody's sentence.
const LOCATION_LINE = new RegExp(`^[^{}]*${LOCATION_VARIABLE}[\\s.!*_]*$`);

const linesOf = (text: string) => text.split(/\r?\n/);
const isBlank = (line: string | undefined) => line !== undefined && line.trim() === '';

/** The location variable a button's URL is, when it is exactly that. */
export function locationVariableOf(url: unknown): string | null {
  return typeof url === 'string' ? EXACT_LOCATION.exec(url)?.[1] ?? null : null;
}

/** How often a block uses the location variable, anywhere in its data. */
export function countLocations(value: unknown): number {
  if (typeof value === 'string') {
    return value.includes('{{') ? (value.match(new RegExp(LOCATION_VARIABLE, 'g')) ?? []).length : 0;
  }
  if (Array.isArray(value)) return value.reduce((sum: number, child) => sum + countLocations(child), 0);
  if (value && typeof value === 'object') {
    return Object.values(value).reduce((sum: number, child) => sum + countLocations(child), 0);
  }
  return 0;
}

/** The lines of a text that are a location line: their index and the name of the variable they use. */
export function locationLines(text: unknown): Array<{ index: number; variable: string }> {
  if (typeof text !== 'string' || !text.includes('{{')) return [];
  return linesOf(text).flatMap((line, index) => {
    const match = LOCATION_LINE.exec(line);
    return match ? [{ index, variable: match[1] }] : [];
  });
}

/**
 * The text without its location lines. The blank line a location line leaves behind goes with it;
 * every other line, and its spacing, is exactly as it was.
 */
export function withoutLocationLines(text: string): string {
  const remove = locationLines(text).map((line) => line.index);
  if (remove.length === 0) return text;
  const out = linesOf(text);
  for (const index of remove.sort((a, b) => b - a)) {
    out.splice(index, 1);
    if (isBlank(out[index - 1]) && (index >= out.length || isBlank(out[index]))) {
      out.splice(index - 1, 1);
    } else if (index === 0 && isBlank(out[0])) {
      out.splice(0, 1);
    }
  }
  return out.join(text.includes('\r\n') ? '\r\n' : '\n');
}

const idsOf = (value: unknown): string[] => (Array.isArray(value) ? value.filter((id) => typeof id === 'string') : []);

export type TChildList = { column: number | null; ids: string[] };

/** The lists of children a block renders. A two-column container does not render its third column. */
export function childLists(block: TBlocks[string]): TChildList[] {
  const data = block?.data ?? {};
  switch (block?.type) {
    case 'EmailLayout':
      return [{ column: null, ids: idsOf(data.childrenIds) }];
    case 'Container':
      return [{ column: null, ids: idsOf(data.props?.childrenIds) }];
    case 'ColumnsContainer': {
      const columns = Array.isArray(data.props?.columns) ? data.props.columns : [];
      return columns
        .slice(0, data.props?.columnsCount === 3 ? 3 : 2)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((column: any, index: number) => ({ column: index, ids: idsOf(column?.childrenIds) }));
    }
    default:
      return [];
  }
}

export type TPosition = { parentId: string; column: number | null; index: number };

/** Every block the mail renders, with where it sits. A block left behind in the JSON is not in it. */
export function renderedBlocks(document: TBlocks): Map<string, TPosition | null> {
  const positions = new Map<string, TPosition | null>();
  const visit = (id: string, position: TPosition | null) => {
    if (positions.has(id) || !document[id]) return;
    positions.set(id, position);
    for (const list of childLists(document[id])) {
      list.ids.forEach((childId, index) => visit(childId, { parentId: id, column: list.column, index }));
    }
  };
  visit('root', null);
  return positions;
}

/** The marked meeting buttons a mail renders. */
export function meetingButtons(document: TBlocks): string[] {
  return [...renderedBlocks(document).keys()].filter(
    (id) => document[id]?.type === 'Button' && document[id]?.data?.props?.meetingButton === true
  );
}

/**
 * A copy of `document` that shows the meeting button or the location line, never both. `document`
 * has its tokens filled in (the button's `visible` is a boolean). A button that shows takes the
 * location line out of the texts; one that is off, or may not show (`allowed`), is switched off and
 * the line stays. A mail without a marked meeting button comes back as it is.
 */
export function chooseMeetingButton<T extends TBlocks>(document: T, allowed: boolean): T {
  if (!document?.root) return document;
  const buttons = meetingButtons(document);
  if (buttons.length === 0) return document;

  const withProps = (id: string, props: Record<string, unknown>) => ({
    ...document[id],
    data: { ...document[id].data, props: { ...document[id].data?.props, ...props } },
  });
  const next: TBlocks = { ...document };

  if (allowed && buttons.some((id) => document[id].data.props.visible !== false)) {
    for (const id of renderedBlocks(document).keys()) {
      const text = document[id]?.type === 'Text' ? document[id]?.data?.props?.text : null;
      if (typeof text !== 'string') continue;
      const rest = withoutLocationLines(text);
      if (rest === text) continue;
      // A text that was nothing but the location line leaves no empty block behind.
      next[id] = rest.trim() === '' ? withProps(id, { visible: false }) : withProps(id, { text: rest });
    }
  } else {
    for (const id of buttons) next[id] = withProps(id, { visible: false });
  }
  return next as T;
}
