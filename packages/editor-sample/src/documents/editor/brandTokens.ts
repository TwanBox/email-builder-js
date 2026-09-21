import { z } from 'zod';

/**
 * Brand tokens: a campaign's (end client's) or organisation's logo and colours, stored in a
 * template as `{{TOKEN}}` and filled in by tele-mailing-backend when the mail is sent
 * (tele-mailing-backend docs/specs/brand-variables.md). The canvas fills them in with the values
 * tele-mailing sends in LOAD_TEMPLATE, so the builder shows what the recipient gets.
 *
 * Every token has a Dutch and a UK English name; both always work. The builder offers the Dutch
 * name when the organisation's language is `nl`, the English name otherwise.
 */

export type TBrandKind = 'logo' | 'brand' | 'button' | 'buttonText';
export type TBrandColorKind = Exclude<TBrandKind, 'logo'>;
type TBrandSource = 'endClient' | 'organisation';

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

type TBrandValues = { logoUrl: string | null; brandColor: string | null; buttonColor: string | null; buttonTextColor: string | null };

export type TBrand = {
  language: 'nl' | 'en';
  endClient: TBrandValues;
  organisation: TBrandValues;
};

const NO_VALUES: TBrandValues = { logoUrl: null, brandColor: null, buttonColor: null, buttonTextColor: null };
export const EMPTY_BRAND: TBrand = { language: 'nl', endClient: NO_VALUES, organisation: NO_VALUES };

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const HTTPS_URL = /^https:\/\/\S+$/;
const TOKEN = /{{\s*([A-Z_]+)\s*}}/g;
const EXACT_TOKEN = /^\s*{{\s*([A-Z_]+)\s*}}\s*$/;

const TOKENS_BY_NAME = new Map<string, TBrandToken>();
for (const token of BRAND_TOKENS) {
  TOKENS_BY_NAME.set(token.nl, token);
  TOKENS_BY_NAME.set(token.en, token);
}

const FIELD: Record<TBrandKind, keyof TBrandValues> = {
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
    return {
      logoUrl: typeof r.logoUrl === 'string' && HTTPS_URL.test(r.logoUrl) ? r.logoUrl : null,
      brandColor: color(r.brandColor),
      buttonColor: color(r.buttonColor),
      buttonTextColor: color(r.buttonTextColor),
    };
  };
  return {
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

/**
 * `data` with every brand token filled in from `brand`; other `{{VAR}}`s are left as they are.
 * Parts without a token keep their identity, so a template without tokens comes back unchanged.
 */
export function resolveBrandTokens<T>(data: T, brand: TBrand): T {
  const resolve = (node: unknown): unknown => {
    if (typeof node === 'string') {
      if (!node.includes('{{')) return node;
      return node.replace(TOKEN, (match, name) => {
        const token = TOKENS_BY_NAME.get(name);
        return token ? brandValue(token, brand) : match;
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
export function tokenText(token: TBrandToken, brand: TBrand): string {
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
 * `#RRGGBB` in colour fields, so tokens are swapped for a valid colour while validating and the
 * original data is returned. The upstream schemas have no defaults, so nothing is lost that way.
 */
export function safeParseWithBrandTokens<S extends z.ZodTypeAny>(
  schema: S,
  data: unknown
): z.SafeParseReturnType<unknown, z.infer<S>> {
  const probe = (node: unknown): unknown => {
    if (brandTokenOf(node)) return '#000000';
    if (Array.isArray(node)) return node.map(probe);
    if (node && typeof node === 'object') {
      return Object.fromEntries(Object.entries(node).map(([key, child]) => [key, probe(child)]));
    }
    return node;
  };
  const result = schema.safeParse(probe(data));
  return result.success ? { success: true, data: data as z.infer<S> } : result;
}
