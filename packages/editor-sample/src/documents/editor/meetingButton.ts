import {
  BRAND_TOKENS,
  BUTTON_TEXT_TOKEN,
  buttonToken,
  buttonTokenOf,
  buttonValue,
  meetingButtonAllowed,
  TBrand,
  TBrandSource,
  TButtonToken,
  TMeetingLanguage,
  tokenText,
} from './brandTokens';
import { childLists, countLocations, locationLines, locationVariableOf, renderedBlocks, TPosition } from './locationLine';

/**
 * The meeting button of a mail in the editor: what the mail holds today, and switching the button
 * (tele-mailing-backend docs/specs/brand-variables.md §3.10). A mail under the setting holds both a
 * location line and a Button block marked `props.meetingButton`; `props.visible` says whether the
 * button shows, as a boolean of its own or as the token of the campaign or organisation it follows.
 * A button that is off is not in the canvas, so it is switched in the Styles tab.
 *
 * Reading a mail follows analyzeMeeting, and adding what is missing follows linkMeetingInConfig, in
 * tele-mailing-backend src/utils/meeting-button.ts.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TBlocks = Record<string, any>;

// A button block that is added here. Neither is a setting: they are the same in every mail.
const BUTTON_FONT_SIZE = 16;
const BUTTON_PADDING = { top: 8, bottom: 8, left: 24, right: 24 };
// The colours of a new button while its campaign or organisation has no button colours of its own.
const PLAIN_BUTTON_COLOR = '#000000';
const PLAIN_BUTTON_TEXT_COLOR = '#FFFFFF';
// A button that is added for a mail that follows no setting (tele-mailing did not say who it is for).
const OWN_BUTTON_SIZE = 'medium';
const OWN_BUTTON_FORMAT = 'pill';
// The Text block a new location line gets, when the mail has no text above its button to add it to.
const LINE_TEXT_STYLE = { padding: { top: 8, bottom: 8, left: 24, right: 24 }, fontSize: 16, fontWeight: 'normal' };

// Must match LOCATION_LABELS in tele-mailing-backend src/utils/meeting-button.ts.
const LOCATION_LABELS: Record<TMeetingLanguage, string> = {
  nl: 'Locatie:',
  en: 'Location:',
  de: 'Ort:',
  fr: 'Lieu :',
  es: 'Ubicación:',
};

export type TMeetingState =
  // Neither a location line nor a meeting button: there is nothing to switch.
  | { kind: 'none' }
  // The location is used in a way the switch cannot handle: in a sentence, in an Html block, a
  // button next to a line, more than one of either.
  | { kind: 'unmanaged' }
  // One location line and no button.
  | { kind: 'line'; textId: string; position: TPosition; variable: string }
  // One button to the meeting. `marked` when it is under the setting already; `token` when its
  // switch follows a setting; `shown` is what the switch says (not whether the campaign may show it).
  | { kind: 'button'; buttonId: string; position: TPosition; variable: string; marked: boolean; token: TButtonToken | null; shown: boolean };

export function meetingState(document: TBlocks, brand: TBrand): TMeetingState {
  if (document?.root?.type !== 'EmailLayout') return { kind: 'none' };
  const positions = renderedBlocks(document);
  const buttons: Array<{ id: string; variable: string }> = [];
  const lines: Array<{ id: string; variable: string }> = [];
  let elsewhere = false;

  for (const id of positions.keys()) {
    const block = document[id];
    const props = block?.data?.props ?? {};
    const uses = countLocations(block?.data);
    if (uses === 0) continue;

    let accounted = 0;
    const variable = block.type === 'Button' ? locationVariableOf(props.url) : null;
    if (variable) {
      buttons.push({ id, variable });
      accounted = 1;
    } else if (block.type === 'Text') {
      for (const line of locationLines(props.text)) {
        lines.push({ id, variable: line.variable });
        accounted++;
      }
    }
    if (uses > accounted) elsewhere = true;
  }

  if (elsewhere || buttons.length > 1 || lines.length > 1) return { kind: 'unmanaged' };
  if (buttons.length === 0 && lines.length === 0) return { kind: 'none' };
  if (buttons.length === 0) {
    const position = positions.get(lines[0].id);
    return position ? { kind: 'line', textId: lines[0].id, position, variable: lines[0].variable } : { kind: 'unmanaged' };
  }

  const { id, variable } = buttons[0];
  const props = document[id].data.props;
  const position = positions.get(id);
  const marked = props.meetingButton === true;
  if (!position || (!marked && lines.length > 0)) return { kind: 'unmanaged' };
  const token = buttonTokenOf(props.visible);
  return { kind: 'button', buttonId: id, position, variable, marked, token, shown: token ? buttonValue(token, brand) !== false : props.visible !== false };
}

/** Whether the mail shows its meeting button: one that is on, in a campaign that may show one. */
export function meetingButtonShown(document: TBlocks, brand: TBrand): boolean {
  if (!meetingButtonAllowed(brand)) return false;
  const state = meetingState(document, brand);
  return state.kind === 'button' && state.marked && state.shown;
}

function insertAt<T extends TBlocks>(document: T, position: TPosition, at: number, id: string): T {
  const parent = document[position.parentId];
  const ids = [...(childLists(parent).find((list) => list.column === position.column)?.ids ?? [])];
  ids.splice(at, 0, id);
  let next;
  if (parent.type === 'EmailLayout') {
    next = { ...parent, data: { ...parent.data, childrenIds: ids } };
  } else if (parent.type === 'Container') {
    next = { ...parent, data: { ...parent.data, props: { ...parent.data?.props, childrenIds: ids } } };
  } else {
    const columns = [...(parent.data?.props?.columns ?? [])];
    columns[position.column ?? 0] = { ...(columns[position.column ?? 0] ?? {}), childrenIds: ids };
    next = { ...parent, data: { ...parent.data, props: { ...parent.data?.props, columns } } };
  }
  return { ...document, [position.parentId]: next };
}

function newIds(document: TBlocks) {
  let next = Date.now();
  const made = new Set<string>();
  return () => {
    while (`block-${next}` in document || made.has(`block-${next}`)) next++;
    made.add(`block-${next}`);
    return `block-${next++}`;
  };
}

/**
 * `document` with its meeting button set to `visible`: a boolean, or the token it follows.
 *
 * A mail with a location line gets the button under that text: its size and style follow the
 * campaign's or organisation's setting, its text the campaign's language, its colours the button
 * colours that are set. A mail with a button that is not under the setting yet is marked, and gets a
 * location line under the text above it, which shows whenever the button may not. Returns the same
 * object when there is nothing to switch.
 */
export function withMeetingButton<T extends TBlocks>(document: T, visible: boolean | string, brand: TBrand): T {
  const state = meetingState(document, brand);
  if (state.kind === 'none' || state.kind === 'unmanaged') return document;
  const newId = newIds(document);

  if (state.kind === 'line') {
    const source: TBrandSource | null = brand.audience;
    const color = (kind: 'button' | 'buttonText', field: 'buttonColor' | 'buttonTextColor', plain: string) =>
      source && brand[source][field] ? tokenText(BRAND_TOKENS.find((token) => token.kind === kind && token.source === source)!, brand) : plain;
    const id = newId();
    const next = {
      ...document,
      [id]: {
        type: 'Button',
        data: {
          style: { fontSize: BUTTON_FONT_SIZE, padding: { ...BUTTON_PADDING } },
          props: {
            text: tokenText(BUTTON_TEXT_TOKEN, brand),
            url: `{{${state.variable}}}`,
            size: source ? tokenText(buttonToken('size', source), brand) : OWN_BUTTON_SIZE,
            buttonStyle: source ? tokenText(buttonToken('format', source), brand) : OWN_BUTTON_FORMAT,
            buttonBackgroundColor: color('button', 'buttonColor', PLAIN_BUTTON_COLOR),
            buttonTextColor: color('buttonText', 'buttonTextColor', PLAIN_BUTTON_TEXT_COLOR),
            meetingButton: true,
            visible,
          },
        },
      },
    };
    return insertAt(next, state.position, state.position.index + 1, id);
  }

  const block = document[state.buttonId];
  let next: TBlocks = {
    ...document,
    [state.buttonId]: { ...block, data: { ...block.data, props: { ...block.data.props, meetingButton: true, visible } } },
  };
  if (state.marked) return next as T;

  // The line that shows when the button may not: at the end of the text above the button.
  const line = `${LOCATION_LABELS[brand.campaignLanguage]} {{${state.variable}}}`;
  const siblings = childLists(next[state.position.parentId]).find((list) => list.column === state.position.column)?.ids ?? [];
  const above = siblings
    .slice(0, state.position.index)
    .reverse()
    .find((id) => next[id]?.type === 'Text' && typeof next[id]?.data?.props?.text === 'string');
  if (above) {
    const text: string = next[above].data.props.text;
    const gap = text.trim() === '' ? '' : text.endsWith('\n\n') ? '' : text.endsWith('\n') ? '\n' : '\n\n';
    next[above] = { ...next[above], data: { ...next[above].data, props: { ...next[above].data.props, text: `${text}${gap}${line}` } } };
    return next as T;
  }
  const id = newId();
  next = { ...next, [id]: { type: 'Text', data: { style: JSON.parse(JSON.stringify(LINE_TEXT_STYLE)), props: { text: line, markdown: true } } } };
  return insertAt(next, state.position, state.position.index, id) as T;
}
