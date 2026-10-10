import {
  BRAND_TOKENS,
  layoutTokenOf,
  layoutValue,
  TBrand,
  TBrandSource,
  TLayoutToken,
  tokenText,
} from './brandTokens';

/**
 * Branding bars: the coloured strip above and below a mail. A bar is a Container marked with
 * `props.brandingBar`; `props.visible` says whether it shows, as a boolean of its own or as the layout
 * token of the campaign or organisation it follows (tele-mailing-backend
 * docs/specs/brand-variables.md §3.9). A bar that is off is not in the canvas, so it is switched in
 * the Styles tab.
 */

export type TBarRole = 'header' | 'footer';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TBlocks = Record<string, any>;

// The bar the mails have had so far, for a mail that has no other bar to copy.
const BAR_PADDING = { top: 8, bottom: 8, left: 80, right: 80 };
const BAR_SPACER_HEIGHT = 4;

const idsOf = (value: unknown): string[] => (Array.isArray(value) ? value.filter((id) => typeof id === 'string') : []);

function childIds(block: TBlocks[string]): string[] {
  const data = block?.data ?? {};
  switch (block?.type) {
    case 'EmailLayout':
      return idsOf(data.childrenIds);
    case 'Container':
      return idsOf(data.props?.childrenIds);
    case 'ColumnsContainer':
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (Array.isArray(data.props?.columns) ? data.props.columns : []).flatMap((column: any) => idsOf(column?.childrenIds));
    default:
      return [];
  }
}

/** The bars of this role that are part of the mail; a block left behind in the JSON does not count. */
export function findBars(document: TBlocks, role: TBarRole): string[] {
  const found: string[] = [];
  const seen = new Set<string>();
  const visit = (id: string) => {
    const block = document[id];
    if (!block || seen.has(id)) return;
    seen.add(id);
    if (block.type === 'Container' && block.data?.props?.brandingBar === role) found.push(id);
    childIds(block).forEach(visit);
  };
  visit('root');
  return found;
}

export type TBarState = {
  // The layout token the bar holds, when it follows a setting.
  token: TLayoutToken | null;
  shown: boolean;
};

export function barState(document: TBlocks, role: TBarRole, brand: TBrand): TBarState {
  const [id] = findBars(document, role);
  if (!id) {
    return { token: null, shown: false };
  }
  const visible = document[id].data?.props?.visible;
  const token = layoutTokenOf(visible);
  return { token, shown: token ? layoutValue(token, brand) !== false : visible !== false };
}

// The container that holds the mail's text: the bottom bar goes straight after it. Same rule as
// mainContainer in tele-mailing-backend src/utils/link-settings.ts.
function mainContainer(document: TBlocks): string | null {
  const candidates = idsOf(document.root?.data?.childrenIds)
    .filter((id) => document[id]?.type === 'Container')
    .map((id) => ({ id, children: idsOf(document[id]?.data?.props?.childrenIds) }))
    .filter(({ children }) => children.some((childId) => document[childId]?.type === 'Text'));
  if (candidates.length === 0) return null;
  const most = Math.max(...candidates.map(({ children }) => children.length));
  const top = candidates.filter(({ children }) => children.length === most);
  return top.length === 1 ? top[0].id : null;
}

/**
 * `document` with the bar set to `visible`: a boolean, or the layout token it follows. A mail
 * without the bar gets one - styled like its other bar when it has one, in the brand colour
 * otherwise - unless the bar is only being switched off. Returns the same object when nothing changes.
 */
export function withBarVisible<T extends TBlocks>(document: T, role: TBarRole, visible: boolean | string, brand: TBrand): T {
  const bars = findBars(document, role);
  if (bars.length > 0) {
    const next: TBlocks = { ...document };
    for (const id of bars) {
      const block = document[id];
      next[id] = { ...block, data: { ...block.data, props: { ...block.data?.props, visible } } };
    }
    return next as T;
  }
  if (visible === false || !document.root) {
    return document;
  }

  const [otherId] = findBars(document, role === 'header' ? 'footer' : 'header');
  const like = otherId ? document[otherId] : null;
  const likeSpacer = like ? childIds(like).map((id) => document[id]).find((child) => child?.type === 'Spacer') : null;
  const source: TBrandSource = brand.audience ?? 'endClient';
  const brandColor = BRAND_TOKENS.find((token) => token.kind === 'brand' && token.source === source)!;
  const style = like?.data?.style
    ? JSON.parse(JSON.stringify(like.data.style))
    : { backgroundColor: tokenText(brandColor, brand), padding: { ...BAR_PADDING } };

  let next = Date.now();
  const newId = () => {
    while (`block-${next}` in document) next++;
    return `block-${next++}`;
  };
  const spacerId = newId();
  const barId = newId();

  const rootIds = idsOf(document.root.data?.childrenIds);
  const main = mainContainer(document);
  const at = role === 'header' ? 0 : main ? rootIds.indexOf(main) + 1 : rootIds.length;

  return {
    ...document,
    [spacerId]: { type: 'Spacer', data: { props: { height: likeSpacer?.data?.props?.height ?? BAR_SPACER_HEIGHT } } },
    [barId]: { type: 'Container', data: { style, props: { childrenIds: [spacerId], brandingBar: role, visible } } },
    root: {
      ...document.root,
      data: { ...document.root.data, childrenIds: [...rootIds.slice(0, at), barId, ...rootIds.slice(at)] },
    },
  };
}
