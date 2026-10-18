import { ImagePropsSchema } from '@usewaypoint/block-image';

import ContainerPropsSchema from '../blocks/Container/ContainerPropsSchema';

import { barState, findBars, withBarVisible } from './brandingBars';
import {
  BACKGROUND_TOKENS,
  backgroundToken,
  backgroundTokenOf,
  displayColor,
  isHiddenBlock,
  LAYOUT_TOKENS,
  layoutToken,
  layoutTokenOf,
  parseBrand,
  renderable,
  resolveBrandTokens,
  safeParseWithBrandTokens,
  tokenText,
} from './brandTokens';

const brand = (endClient: object = {}, organisation: object = {}, extra: object = {}) =>
  parseBrand({ language: 'nl', audience: 'endClient', endClient, organisation, ...extra });

const mail = () => ({
  root: { type: 'EmailLayout', data: { childrenIds: ['logo', 'main', 'bar', 'footer'] } },
  logo: {
    type: 'Image',
    data: {
      style: { padding: { top: '{{LOGO_PADDING_BOVEN_EINDKLANT}}', bottom: 8, left: 0, right: 0 } },
      props: { url: '{{LOGO_EINDKLANT}}', width: '{{LOGO_BREEDTE_EINDKLANT}}' },
    },
  },
  main: { type: 'Container', data: { style: {}, props: { childrenIds: ['text'] } } },
  text: { type: 'Text', data: { props: { text: 'Hi' } } },
  bar: {
    type: 'Container',
    data: {
      style: { backgroundColor: '{{MERKKLEUR_EINDKLANT}}', padding: { top: 8, bottom: 8, left: 24, right: 24 } },
      props: { childrenIds: ['spacer'], brandingBar: 'footer', visible: '{{MERKBALK_ONDER_EINDKLANT}}' },
    },
  },
  spacer: { type: 'Spacer', data: { props: { height: 6 } } },
  footer: { type: 'Text', data: { props: { text: 'Footer' } } },
});

describe('layout tokens', () => {
  it('has the names the backend resolves', () => {
    expect(LAYOUT_TOKENS.filter((t) => t.source === 'endClient').map((t) => [t.nl, t.en])).toEqual([
      ['LOGO_PADDING_BOVEN_EINDKLANT', 'LOGO_PADDING_TOP_ENDCLIENT'],
      ['LOGO_PADDING_ONDER_EINDKLANT', 'LOGO_PADDING_BOTTOM_ENDCLIENT'],
      ['LOGO_BREEDTE_EINDKLANT', 'LOGO_WIDTH_ENDCLIENT'],
      ['MERKBALK_BOVEN_EINDKLANT', 'BRANDING_BAR_HEADER_ENDCLIENT'],
      ['MERKBALK_ONDER_EINDKLANT', 'BRANDING_BAR_FOOTER_ENDCLIENT'],
    ]);
    expect(LAYOUT_TOKENS.filter((t) => t.source === 'organisation').map((t) => t.en)).toEqual([
      'LOGO_PADDING_TOP_ORGANISATION',
      'LOGO_PADDING_BOTTOM_ORGANISATION',
      'LOGO_WIDTH_ORGANISATION',
      'BRANDING_BAR_HEADER_ORGANISATION',
      'BRANDING_BAR_FOOTER_ORGANISATION',
    ]);
  });

  it('fills a field that is exactly a token with a number or a boolean', () => {
    const b = brand({ logoPaddingTop: 16, logoWidth: 320, footerBrandingBar: false }, { logoPaddingBottom: 4 });
    const resolved = resolveBrandTokens(mail(), b);
    expect(resolved.logo.data.style.padding).toEqual({ top: 16, bottom: 8, left: 0, right: 0 });
    expect(resolved.logo.data.props.width).toBe(320);
    expect(resolved.bar.data.props.visible).toBe(false);
    expect(resolveBrandTokens({ a: '{{ LOGO_PADDING_BOTTOM_ORGANISATION }}', b: 'w {{LOGO_WIDTH_ENDCLIENT}}px' }, b)).toEqual({
      a: 4,
      b: 'w 320px',
    });
  });

  it('falls back to no padding, the own width and a bar that shows', () => {
    const resolved = resolveBrandTokens(mail(), brand({ logoPaddingTop: 81, logoWidth: 0, footerBrandingBar: 'no' }));
    expect(resolved.logo.data.style.padding.top).toBe(0);
    expect(resolved.logo.data.props.width).toBeNull();
    expect(resolved.bar.data.props.visible).toBe(true);
  });

  it('keeps a document without tokens as it is', () => {
    const document = { root: { type: 'EmailLayout', data: { childrenIds: [] } } };
    expect(resolveBrandTokens(document, brand())).toBe(document);
  });

  it('reads the audience and nothing else as one', () => {
    expect(brand().audience).toBe('endClient');
    expect(parseBrand({ audience: 'organisation' }).audience).toBe('organisation');
    expect(parseBrand({ audience: 'campaign' }).audience).toBeNull();
    expect(parseBrand(undefined).audience).toBeNull();
  });

  it('validates a block that holds tokens and returns it unchanged', () => {
    const { logo, bar } = mail();
    const image = safeParseWithBrandTokens(ImagePropsSchema, logo.data);
    expect(image.success && image.data).toBe(logo.data);
    const container = safeParseWithBrandTokens(ContainerPropsSchema, bar.data);
    expect(container.success && container.data).toBe(bar.data);
    expect(safeParseWithBrandTokens(ImagePropsSchema, { props: { width: '{{NOT_A_TOKEN}}' } }).success).toBe(false);
  });

  it('writes the token in the organisation language', () => {
    const token = layoutToken('width', 'organisation');
    expect(tokenText(token, brand())).toBe('{{LOGO_BREEDTE_ORGANISATIE}}');
    expect(tokenText(token, parseBrand({ language: 'de' }))).toBe('{{LOGO_WIDTH_ORGANISATION}}');
    expect(layoutTokenOf('{{LOGO_WIDTH_ORGANISATION}}')).toBe(token);
    expect(layoutTokenOf('{{LOGO_ORGANISATION}}')).toBeNull();
  });
});

describe('a bar that is switched off', () => {
  it('is hidden by its own value or by the setting it follows', () => {
    const { bar } = mail();
    expect(isHiddenBlock(bar, brand())).toBe(false);
    expect(isHiddenBlock(bar, brand({ footerBrandingBar: false }))).toBe(true);
    expect(isHiddenBlock({ type: 'Container', data: { props: { visible: false } } }, brand())).toBe(true);
    expect(isHiddenBlock({ type: 'Container', data: { props: {} } }, brand())).toBe(false);
  });

  it('is left out of what the recipient gets', () => {
    const document = mail();
    const before = JSON.stringify(document);
    const off = renderable(document, brand({ footerBrandingBar: false, logoUrl: 'https://cdn.example.com/logo.png' }));
    expect(off.root.data.childrenIds).toEqual(['logo', 'main', 'footer']);
    expect(off.logo.data.props.url).toBe('https://cdn.example.com/logo.png');
    expect(renderable(document, brand()).root.data.childrenIds).toEqual(['logo', 'main', 'bar', 'footer']);
    expect(JSON.stringify(document)).toBe(before);
  });
});

describe('branding bars in the Styles tab', () => {
  it('reads a linked, a fixed and a missing bar', () => {
    expect(barState(mail(), 'footer', brand())).toEqual({ token: layoutToken('footerBar', 'endClient'), shown: true });
    expect(barState(mail(), 'footer', brand({ footerBrandingBar: false })).shown).toBe(false);
    expect(barState(mail(), 'header', brand())).toEqual({ token: null, shown: false });
    const fixed = withBarVisible(mail(), 'footer', false, brand());
    expect(barState(fixed, 'footer', brand())).toEqual({ token: null, shown: false });
  });

  it('ignores a bar that is no longer part of the mail', () => {
    const document = mail();
    document.root.data.childrenIds = ['logo', 'main', 'footer'];
    expect(findBars(document, 'footer')).toEqual([]);
  });

  it('adds a top bar like the bottom one, first in the mail', () => {
    const document = mail();
    const token = tokenText(layoutToken('headerBar', 'endClient'), brand());
    const next = withBarVisible(document, 'header', token, brand());
    const [barId] = next.root.data.childrenIds;
    expect(next.root.data.childrenIds.slice(1)).toEqual(document.root.data.childrenIds);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bar = (next as any)[barId];
    expect(bar.data.props.brandingBar).toBe('header');
    expect(bar.data.props.visible).toBe('{{MERKBALK_BOVEN_EINDKLANT}}');
    expect(bar.data.style).toEqual(document.bar.data.style);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((next as any)[bar.data.props.childrenIds[0]]).toEqual({ type: 'Spacer', data: { props: { height: 6 } } });
  });

  it('adds a bottom bar straight after the main container, in the brand colour of the audience', () => {
    const document = mail();
    document.root.data.childrenIds = ['logo', 'main', 'footer'];
    const next = withBarVisible(document, 'footer', true, parseBrand({ language: 'en', audience: 'organisation' }));
    const ids = next.root.data.childrenIds;
    expect(ids.length).toBe(4);
    expect(ids.indexOf('main')).toBe(1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((next as any)[ids[2]].data).toEqual({
      style: { backgroundColor: '{{BRAND_COLOUR_ORGANISATION}}', padding: { top: 8, bottom: 8, left: 80, right: 80 } },
      props: { childrenIds: [expect.any(String)], brandingBar: 'footer', visible: true },
    });
  });

  it('adds nothing when a missing bar is only switched off', () => {
    const document = mail();
    expect(withBarVisible(document, 'header', false, brand())).toBe(document);
  });
});

describe('the brand colour behind the logo', () => {
  const logo = (backgroundColor: unknown) => ({
    type: 'Image',
    data: { style: { backgroundColor, padding: { top: 40, bottom: 40, left: 0, right: 0 } }, props: { url: 'https://x/l.png' } },
  });

  it('has the names the backend resolves', () => {
    expect(BACKGROUND_TOKENS.map((t) => [t.source, t.nl, t.en])).toEqual([
      ['endClient', 'LOGO_ACHTERGROND_EINDKLANT', 'LOGO_BACKGROUND_ENDCLIENT'],
      ['organisation', 'LOGO_ACHTERGROND_ORGANISATIE', 'LOGO_BACKGROUND_ORGANISATION'],
    ]);
  });

  it('is the brand colour of the same source when the setting is on, and no background otherwise', () => {
    const on = brand({ brandColor: '#123456', logoBackground: true }, { brandColor: '#abcdef', logoBackground: false });
    expect(resolveBrandTokens(logo('{{LOGO_ACHTERGROND_EINDKLANT}}'), on).data.style.backgroundColor).toBe('#123456');
    expect(resolveBrandTokens(logo('{{LOGO_BACKGROUND_ORGANISATION}}'), on).data.style.backgroundColor).toBeNull();
    // An empty setting is off, so nothing changes before it is set.
    expect(resolveBrandTokens(logo('{{LOGO_ACHTERGROND_EINDKLANT}}'), brand()).data.style.backgroundColor).toBeNull();
  });

  it('is white when the setting is on but the brand colour is empty, like any colour token', () => {
    expect(resolveBrandTokens(logo('{{LOGO_ACHTERGROND_EINDKLANT}}'), brand({ logoBackground: true })).data.style.backgroundColor).toBe(
      '#FFFFFF'
    );
  });

  it('is shown as the colour it stands for, and validates', () => {
    const on = brand({ brandColor: '#123456', logoBackground: true });
    expect(displayColor('{{LOGO_ACHTERGROND_EINDKLANT}}', on)).toBe('#123456');
    expect(backgroundTokenOf('{{LOGO_ACHTERGROND_EINDKLANT}}')).toEqual(backgroundToken('endClient'));
    expect(backgroundTokenOf('#123456')).toBeNull();
    const data = logo('{{LOGO_ACHTERGROND_EINDKLANT}}').data;
    expect(safeParseWithBrandTokens(ImagePropsSchema, data)).toEqual({ success: true, data });
  });

  it('is written in the organisation language', () => {
    expect(tokenText(backgroundToken('endClient'), brand())).toBe('{{LOGO_ACHTERGROND_EINDKLANT}}');
    expect(tokenText(backgroundToken('organisation'), parseBrand({ language: 'en' }))).toBe('{{LOGO_BACKGROUND_ORGANISATION}}');
  });
});
