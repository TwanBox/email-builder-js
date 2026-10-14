import { z } from 'zod';

import { chooseMeetingButton } from './locationLine';

/**
 * Brand tokens: a campaign's (end client's) or organisation's logo and colours, stored in a
 * template as `{{TOKEN}}` and filled in by tele-mailing-backend when the mail is sent
 * (tele-mailing-backend docs/specs/brand-variables.md). The canvas fills them in with the values
 * tele-mailing sends in LOAD_TEMPLATE, so the builder shows what the recipient gets.
 *
 * Every token has a Dutch and a UK English name; both always work. The builder offers the Dutch
 * name when the organisation's language is `nl`, the English name otherwise.
 *
 * The layout tokens (LAYOUT_TOKENS) do the same for the logo's padding and width and for the branding
 * bars, but stand for a number or a boolean: a field that holds exactly such a token is filled in
 * with the typed value (tele-mailing-backend docs/specs/brand-variables.md §3.9).
 *
 * The meeting button tokens (BUTTON_TOKENS, §3.10) do it once more for whether a mail shows its
 * meeting button and for the button's size and style, and BUTTON_TEXT_TOKEN is the button's text in
 * the campaign's language.
 */

export type TBrandKind = 'logo' | 'brand' | 'button' | 'buttonText';
export type TBrandColorKind = Exclude<TBrandKind, 'logo'>;
export type TBrandSource = 'endClient' | 'organisation';

export type TBrandToken = { nl: string; en: string; kind: TBrandKind; source: TBrandSource };

export const BRAND_TOKENS: TBrandToken[] = [
  { nl: 'LOGO_EINDKLANT', en: 'LOGO_ENDCLIENT', kind: 'logo', source: 'endClient' },
  { nl: 'MERKKLEUR_EINDKLANT', en: 'BRAND_COLOUR_ENDCLIENT', kind: 'brand', source: 'endClient' },
  { nl: 'KNOPKLEUR_EINDKLANT', en: 'BUTTON_COLOUR_ENDCLIENT', kind: 'button', source: 'endClient' },
  { nl: 'KNOPTEKSTKLEUR_EINDKLANT', en: 'BUTTON_TEXT_COLOUR_ENDCLIENT', kind: 'buttonText', source: 'endClient' },
  { nl: 'LOGO_ORGANISATIE', en: 'LOGO_ORGANISATION', kind: 'logo', source: 'organisation' },
  { nl: 'MERKKLEUR_ORGANISATIE', en: 'BRAND_COLOUR_ORGANISATION', kind: 'brand', source: 'organisation' },
  { nl: 'KNOPKLEUR_ORGANISATIE', en: 'BUTTON_COLOUR_ORGANISATION', kind: 'button', source: 'organisation' },
  { nl: 'KNOPTEKSTKLEUR_ORGANISATIE', en: 'BUTTON_TEXT_COLOUR_ORGANISATION', kind: 'buttonText', source: 'organisation' },
];

// The image a logo token shows when no logo is set. Must match LOGO_PLACEHOLDER_URL in
// tele-mailing-backend src/utils/brand-tokens.ts, which puts the same image in the sent mail.
export const LOGO_PLACEHOLDER_URL =
  'https://cdn.telecalendar.com/image/upload/v1789848218/Image_placeholder_df81c092b6.png';

// A colour token without a value is white, in the canvas and in the sent mail.
export const MISSING_COLOR = '#FFFFFF';

/** The logo's padding and width and the branding bars, as set on a campaign or an organisation. */
export type TLayoutValues = {
  logoPaddingTop: number | null;
  logoPaddingBottom: number | null;
  logoWidth: number | null;
  headerBrandingBar: boolean | null;
  footerBrandingBar: boolean | null;
};

export type TButtonSize = 'xs' | 'sm' | 'md' | 'lg';
export type TButtonFormat = 'rectangle' | 'rounded' | 'pill';

/** The meeting button, as set on a campaign or an organisation. */
export type TButtonValues = {
  showButton: boolean | null;
  buttonSize: TButtonSize | null;
  buttonFormat: TButtonFormat | null;
};

/** The settings a field can be linked to, and a campaign's can be changed from here. */
export type TCampaignSettings = TLayoutValues & TButtonValues;

type TBrandValues = {
  logoUrl: string | null;
  brandColor: string | null;
  buttonColor: string | null;
  buttonTextColor: string | null;
} & TCampaignSettings;

export type TMeetingLanguage = 'nl' | 'en' | 'de' | 'fr' | 'es';

export type TBrand = {
  language: 'nl' | 'en';
  // The campaign's language: the meeting button's standard text and the label of a location line.
  campaignLanguage: TMeetingLanguage;
  // Whether the campaign offers online meetings only. A mail of a campaign that also offers a phone
  // call or a visit shows its location line, never a button. Null while it is not known.
  onlyOnline: boolean | null;
  // Whose layout settings this mail follows: the campaign's (end client) for a mail to the prospect
  // or a guest, the organisation's for a mail to the account manager. Null when tele-mailing did not
  // say, and then nothing can be linked.
  audience: TBrandSource | null;
  endClient: TBrandValues;
  organisation: TBrandValues;
};

const NO_VALUES: TBrandValues = {
  logoUrl: null,
  brandColor: null,
  buttonColor: null,
  buttonTextColor: null,
  logoPaddingTop: null,
  logoPaddingBottom: null,
  logoWidth: null,
  headerBrandingBar: null,
  footerBrandingBar: null,
  showButton: null,
  buttonSize: null,
  buttonFormat: null,
};
export const EMPTY_BRAND: TBrand = {
  language: 'nl',
  campaignLanguage: 'nl',
  onlyOnline: null,
  audience: null,
  endClient: NO_VALUES,
  organisation: NO_VALUES,
};

export type TLayoutKind = 'paddingTop' | 'paddingBottom' | 'width' | 'headerBar' | 'footerBar';

export type TLayoutToken = { nl: string; en: string; kind: TLayoutKind; source: TBrandSource; field: keyof TLayoutValues };

export const LAYOUT_FIELDS: Record<TLayoutKind, keyof TLayoutValues> = {
  paddingTop: 'logoPaddingTop',
  paddingBottom: 'logoPaddingBottom',
  width: 'logoWidth',
  headerBar: 'headerBrandingBar',
  footerBar: 'footerBrandingBar',
};

const LAYOUT_NAMES: Record<TLayoutKind, { nl: string; en: string }> = {
  paddingTop: { nl: 'LOGO_PADDING_BOVEN', en: 'LOGO_PADDING_TOP' },
  paddingBottom: { nl: 'LOGO_PADDING_ONDER', en: 'LOGO_PADDING_BOTTOM' },
  width: { nl: 'LOGO_BREEDTE', en: 'LOGO_WIDTH' },
  headerBar: { nl: 'MERKBALK_BOVEN', en: 'BRANDING_BAR_HEADER' },
  footerBar: { nl: 'MERKBALK_ONDER', en: 'BRANDING_BAR_FOOTER' },
};

// Must match LAYOUT_TOKENS in tele-mailing-backend src/utils/brand-tokens.ts.
export const LAYOUT_TOKENS: TLayoutToken[] = (['endClient', 'organisation'] as const).flatMap((source) =>
  (Object.keys(LAYOUT_FIELDS) as TLayoutKind[]).map((kind) => ({
    nl: `${LAYOUT_NAMES[kind].nl}_${source === 'endClient' ? 'EINDKLANT' : 'ORGANISATIE'}`,
    en: `${LAYOUT_NAMES[kind].en}_${source === 'endClient' ? 'ENDCLIENT' : 'ORGANISATION'}`,
    kind,
    source,
    field: LAYOUT_FIELDS[kind],
  }))
);

// The padding sliders stop here, and so does the field on a campaign and an organisation.
export const MAX_LOGO_PADDING = 80;

export type TButtonKind = 'show' | 'size' | 'format';

export type TButtonToken = { nl: string; en: string; kind: TButtonKind; source: TBrandSource; field: keyof TButtonValues };

export const BUTTON_FIELDS: Record<TButtonKind, keyof TButtonValues> = {
  show: 'showButton',
  size: 'buttonSize',
  format: 'buttonFormat',
};

const BUTTON_NAMES: Record<TButtonKind, { nl: string; en: string }> = {
  show: { nl: 'MEETING_KNOP', en: 'MEETING_BUTTON' },
  size: { nl: 'KNOP_GROOTTE', en: 'BUTTON_SIZE' },
  format: { nl: 'KNOP_STIJL', en: 'BUTTON_STYLE' },
};

// Must match BUTTON_TOKENS in tele-mailing-backend src/utils/brand-tokens.ts.
export const BUTTON_TOKENS: TButtonToken[] = (['endClient', 'organisation'] as const).flatMap((source) =>
  (Object.keys(BUTTON_FIELDS) as TButtonKind[]).map((kind) => ({
    nl: `${BUTTON_NAMES[kind].nl}_${source === 'endClient' ? 'EINDKLANT' : 'ORGANISATIE'}`,
    en: `${BUTTON_NAMES[kind].en}_${source === 'endClient' ? 'ENDCLIENT' : 'ORGANISATION'}`,
    kind,
    source,
    field: BUTTON_FIELDS[kind],
  }))
);

// The values of `buttonSize` on a campaign and an organisation, and the size a Button block calls it.
export const BUTTON_SIZES: Record<TButtonSize, 'x-small' | 'small' | 'medium' | 'large'> = {
  xs: 'x-small',
  sm: 'small',
  md: 'medium',
  lg: 'large',
};
// The values of `buttonFormat`; a Button block calls this its `buttonStyle`.
export const BUTTON_FORMATS: TButtonFormat[] = ['rectangle', 'rounded', 'pill'];

// What a Button block renders when it holds no size or style at all.
export const BLOCK_BUTTON_SIZE = 'medium';
export const BLOCK_BUTTON_FORMAT: TButtonFormat = 'rounded';

/** The text of the meeting button, per campaign language. One token, whoever the mail is for. */
export const BUTTON_TEXT_TOKEN = { nl: 'KNOPTEKST_MEETING', en: 'BUTTON_TEXT_MEETING' };

// Must match MEETING_BUTTON_LABELS in tele-mailing-backend src/utils/brand-tokens.ts.
export const MEETING_BUTTON_LABELS: Record<TMeetingLanguage, string> = {
  nl: 'Afspraak deelnemen',
  en: 'Join meeting',
  de: 'Meeting beitreten',
  fr: 'Rejoindre la réunion',
  es: 'Unirse a la reunión',
};

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const HTTPS_URL = /^https:\/\/\S+$/;
const TOKEN = /{{\s*([A-Z_]+)\s*}}/g;
const EXACT_TOKEN = /^\s*{{\s*([A-Z_]+)\s*}}\s*$/;

const TOKENS_BY_NAME = new Map<string, TBrandToken>();
for (const token of BRAND_TOKENS) {
  TOKENS_BY_NAME.set(token.nl, token);
  TOKENS_BY_NAME.set(token.en, token);
}

const LAYOUT_BY_NAME = new Map<string, TLayoutToken>();
for (const token of LAYOUT_TOKENS) {
  LAYOUT_BY_NAME.set(token.nl, token);
  LAYOUT_BY_NAME.set(token.en, token);
}

const BUTTON_BY_NAME = new Map<string, TButtonToken>();
for (const token of BUTTON_TOKENS) {
  BUTTON_BY_NAME.set(token.nl, token);
  BUTTON_BY_NAME.set(token.en, token);
}

const BUTTON_TEXT_NAMES = new Set([BUTTON_TEXT_TOKEN.nl, BUTTON_TEXT_TOKEN.en]);

const FIELD: Record<TBrandKind, 'logoUrl' | 'brandColor' | 'buttonColor' | 'buttonTextColor'> = {
  logo: 'logoUrl',
  brand: 'brandColor',
  button: 'buttonColor',
  buttonText: 'buttonTextColor',
};

// The organisation languages that get the English variable names; anything else is Dutch.
const LANGUAGES = ['en', 'fr', 'de'];

/** The brand from a LOAD_TEMPLATE payload, with anything that is not a hex colour or https URL dropped. */
export function parseBrand(input: unknown): TBrand {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (input && typeof input === 'object' ? input : {}) as any;
  const values = (v: unknown): TBrandValues => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = (v && typeof v === 'object' ? v : {}) as any;
    const color = (c: unknown) => (typeof c === 'string' && HEX_COLOR.test(c) ? c : null);
    const whole = (n: unknown, min: number, max = Infinity) =>
      typeof n === 'number' && Number.isInteger(n) && n >= min && n <= max ? n : null;
    const flag = (b: unknown) => (typeof b === 'boolean' ? b : null);
    return {
      logoUrl: typeof r.logoUrl === 'string' && HTTPS_URL.test(r.logoUrl) ? r.logoUrl : null,
      brandColor: color(r.brandColor),
      buttonColor: color(r.buttonColor),
      buttonTextColor: color(r.buttonTextColor),
      logoPaddingTop: whole(r.logoPaddingTop, 0, MAX_LOGO_PADDING),
      logoPaddingBottom: whole(r.logoPaddingBottom, 0, MAX_LOGO_PADDING),
      logoWidth: whole(r.logoWidth, 1),
      headerBrandingBar: flag(r.headerBrandingBar),
      footerBrandingBar: flag(r.footerBrandingBar),
      showButton: flag(r.showButton),
      buttonSize: r.buttonSize in BUTTON_SIZES ? r.buttonSize : null,
      buttonFormat: BUTTON_FORMATS.includes(r.buttonFormat) ? r.buttonFormat : null,
    };
  };
  return {
    audience: raw.audience === 'endClient' || raw.audience === 'organisation' ? raw.audience : null,
    // A campaign without a language of its own writes in its organisation's; tele-mailing sends the
    // one that applies. Anything else is Dutch.
    campaignLanguage: raw.campaignLanguage in MEETING_BUTTON_LABELS ? raw.campaignLanguage : 'nl',
    onlyOnline: typeof raw.onlyOnline === 'boolean' ? raw.onlyOnline : null,
    // An organisation with no language counts as Dutch, the way the backend and tele-mailing read it.
    // tele-mailing always sends an explicit null when the field is empty, so testing for undefined
    // alone would show that organisation the English names.
    language: LANGUAGES.includes(raw.language) ? 'en' : 'nl',
    endClient: values(raw.endClient),
    organisation: values(raw.organisation),
  };
}

/** The value a token stands for: the brand value, or the fallback when it is not set. */
export function brandValue(token: TBrandToken, brand: TBrand): string {
  const value = brand[token.source][FIELD[token.kind]];
  if (value) return value;
  return token.kind === 'logo' ? LOGO_PLACEHOLDER_URL : MISSING_COLOR;
}

export function layoutToken(kind: TLayoutKind, source: TBrandSource): TLayoutToken {
  return LAYOUT_TOKENS.find((token) => token.kind === kind && token.source === source)!;
}

/** The layout token a field holds, if its whole value is one (a linked padding, width or bar). */
export function layoutTokenOf(value: unknown): TLayoutToken | null {
  if (typeof value !== 'string') return null;
  const match = EXACT_TOKEN.exec(value);
  return match ? LAYOUT_BY_NAME.get(match[1]) ?? null : null;
}

/**
 * What a layout token stands for. Without a value: no padding, the image's own width, and a bar that
 * shows - the same fallbacks the backend renders a sent mail with.
 */
export function layoutValue(token: TLayoutToken, brand: TBrand): number | boolean | null {
  const value = brand[token.source][token.field];
  switch (token.kind) {
    case 'paddingTop':
    case 'paddingBottom':
      return typeof value === 'number' ? value : 0;
    case 'width':
      return typeof value === 'number' ? value : null;
    default:
      return value !== false;
  }
}

export function buttonToken(kind: TButtonKind, source: TBrandSource): TButtonToken {
  return BUTTON_TOKENS.find((token) => token.kind === kind && token.source === source)!;
}

/** The meeting button token a field holds, if its whole value is one (a linked switch, size or style). */
export function buttonTokenOf(value: unknown): TButtonToken | null {
  if (typeof value !== 'string') return null;
  const match = EXACT_TOKEN.exec(value);
  return match ? BUTTON_BY_NAME.get(match[1]) ?? null : null;
}

/**
 * What a meeting button token stands for. Without a value: no button, and the size and style a
 * Button block has of its own - the same fallbacks the backend renders a sent mail with.
 */
export function buttonValue(token: TButtonToken, brand: TBrand): boolean | string {
  const value = brand[token.source][token.field];
  switch (token.kind) {
    case 'show':
      return value === true;
    case 'size':
      return BUTTON_SIZES[value as TButtonSize] ?? BLOCK_BUTTON_SIZE;
    default:
      return BUTTON_FORMATS.includes(value as TButtonFormat) ? (value as string) : BLOCK_BUTTON_FORMAT;
  }
}

/**
 * `data` with every brand token filled in from `brand`; other `{{VAR}}`s are left as they are.
 * Parts without a token keep their identity, so a template without tokens comes back unchanged.
 */
export function resolveBrandTokens<T>(data: T, brand: TBrand): T {
  const resolve = (node: unknown): unknown => {
    if (typeof node === 'string') {
      if (!node.includes('{{')) return node;
      // A field that is exactly a layout token becomes the number or boolean it stands for.
      const layout = layoutTokenOf(node);
      if (layout) return layoutValue(layout, brand);
      // And one that is exactly a meeting button token the boolean, size or style.
      const button = buttonTokenOf(node);
      if (button) return buttonValue(button, brand);
      return node.replace(TOKEN, (match, name) => {
        const token = TOKENS_BY_NAME.get(name);
        if (token) return brandValue(token, brand);
        if (BUTTON_TEXT_NAMES.has(name)) return MEETING_BUTTON_LABELS[brand.campaignLanguage];
        const inText = LAYOUT_BY_NAME.get(name);
        if (inText) return String(layoutValue(inText, brand) ?? '');
        const buttonInText = BUTTON_BY_NAME.get(name);
        return buttonInText ? String(buttonValue(buttonInText, brand)) : match;
      });
    }
    if (Array.isArray(node)) {
      const mapped = node.map(resolve);
      return mapped.some((child, i) => child !== node[i]) ? mapped : node;
    }
    if (node && typeof node === 'object') {
      let changed = false;
      const entries = Object.entries(node).map(([key, child]) => {
        const resolved = resolve(child);
        if (resolved !== child) changed = true;
        return [key, resolved];
      });
      return changed ? Object.fromEntries(entries) : node;
    }
    return node;
  };
  return resolve(data) as T;
}

/** The brand token a field holds, if its whole value is one (e.g. a linked colour). */
export function brandTokenOf(value: unknown): TBrandToken | null {
  if (typeof value !== 'string') return null;
  const match = EXACT_TOKEN.exec(value);
  return match ? TOKENS_BY_NAME.get(match[1]) ?? null : null;
}

/** `{{NAME}}` in the organisation's language. */
export function tokenText(token: { nl: string; en: string }, brand: TBrand): string {
  return `{{${brand.language === 'nl' ? token.nl : token.en}}}`;
}

/** `text` with a line-break opportunity after each underscore, for showing long token names in narrow space. */
export function wrappableTokenText(text: string): string {
  return text.replace(/_/g, '_​');
}

/** The end-client and organisation tokens of one kind, in that order. */
export function brandTokensOfKind(kind: TBrandKind): TBrandToken[] {
  return BRAND_TOKENS.filter((t) => t.kind === kind);
}

/** The colour a field shows: the brand value for a linked field, the field's own colour otherwise. */
export function displayColor(value: string | null | undefined, brand: TBrand): string | null {
  const token = brandTokenOf(value);
  return token ? brandValue(token, brand) : value ?? null;
}

/**
 * `schema.safeParse(data)` for data that may hold brand tokens. The block schemas only accept
 * `#RRGGBB` in colour fields, a number for a padding or width, a boolean for a bar and a fixed list
 * of button sizes and styles, so tokens are
 * swapped for a valid value while validating and the original data is returned. The upstream schemas
 * have no defaults, so nothing is lost that way.
 */
export function safeParseWithBrandTokens<S extends z.ZodTypeAny>(
  schema: S,
  data: unknown
): z.SafeParseReturnType<unknown, z.infer<S>> {
  const probe = (node: unknown): unknown => {
    if (brandTokenOf(node)) return '#000000';
    const layout = layoutTokenOf(node);
    if (layout) return layout.kind === 'headerBar' || layout.kind === 'footerBar' ? true : 0;
    const button = buttonTokenOf(node);
    if (button) return button.kind === 'show' ? true : button.kind === 'size' ? BLOCK_BUTTON_SIZE : BLOCK_BUTTON_FORMAT;
    if (Array.isArray(node)) return node.map(probe);
    if (node && typeof node === 'object') {
      return Object.fromEntries(Object.entries(node).map(([key, child]) => [key, probe(child)]));
    }
    return node;
  };
  const result = schema.safeParse(probe(data));
  return result.success ? { success: true, data: data as z.infer<S> } : result;
}

/** Whether a campaign's mails may show a meeting button at all: not when it offers another location too. */
export function meetingButtonAllowed(brand: TBrand): boolean {
  return brand.onlyOnline !== false;
}

/**
 * Whether a block is switched off: `props.visible` is false, or a token that stands for false. A
 * meeting button is also off while its campaign may not show one.
 */
export function isHiddenBlock(block: unknown, brand: TBrand): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { type, data } = (block ?? {}) as any;
  const visible = data?.props?.visible;
  const layout = layoutTokenOf(visible);
  const button = buttonTokenOf(visible);
  if ((layout ? layoutValue(layout, brand) : button ? buttonValue(button, brand) : visible) === false) return true;
  return type === 'Button' && data?.props?.meetingButton === true && !meetingButtonAllowed(brand);
}

/**
 * The document as the recipient gets it: brand tokens filled in, the meeting button or the location
 * line, blocks that are switched off left out and an image without a URL showing the placeholder.
 * For the preview; the stored document keeps its tokens. The backend does the same when it sends
 * (convertProjectConfigToHTML), where the appointment has to have a link as well; here the mail is
 * shown as it is for an online appointment.
 *
 * `meetingButton: false` gives the mail without its button, with the location line: the text version.
 */
export function renderable<T extends Record<string, unknown>>(
  document: T,
  brand: TBrand,
  { meetingButton = true }: { meetingButton?: boolean } = {}
): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blocks = chooseMeetingButton(resolveBrandTokens(document, brand), meetingButton && meetingButtonAllowed(brand)) as Record<string, any>;
  const hidden = new Set(Object.keys(blocks).filter((id) => blocks[id]?.data?.props?.visible === false));
  const shown = (ids: unknown) => (Array.isArray(ids) ? ids.filter((id) => !hidden.has(id)) : ids);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: Record<string, any> = {};
  for (const [id, block] of Object.entries(blocks)) {
    const data = block?.data;
    if (block?.type === 'EmailLayout') {
      result[id] = { ...block, data: { ...data, childrenIds: shown(data?.childrenIds) } };
    } else if (block?.type === 'Container') {
      result[id] = { ...block, data: { ...data, props: { ...data?.props, childrenIds: shown(data?.props?.childrenIds) } } };
    } else if (block?.type === 'ColumnsContainer' && Array.isArray(data?.props?.columns)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const columns = data.props.columns.map((column: any) => ({ ...column, childrenIds: shown(column?.childrenIds) }));
      result[id] = { ...block, data: { ...data, props: { ...data.props, columns } } };
    } else if (block?.type === 'Image' && !data?.props?.url) {
      result[id] = { ...block, data: { ...data, props: { ...data?.props, url: LOGO_PLACEHOLDER_URL } } };
    } else {
      result[id] = block;
    }
  }
  return result as T;
}
