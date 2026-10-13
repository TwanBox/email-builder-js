import { ButtonPropsSchema } from '@usewaypoint/block-button';

import {
  BUTTON_TOKENS,
  buttonToken,
  isHiddenBlock,
  parseBrand,
  renderable,
  resolveBrandTokens,
  safeParseWithBrandTokens,
  tokenText,
} from './brandTokens';
import { chooseMeetingButton, locationLines, withoutLocationLines } from './locationLine';
import { meetingButtonShown, meetingState, withMeetingButton } from './meetingButton';

const brand = (endClient: object = {}, organisation: object = {}, extra: object = {}) =>
  parseBrand({ language: 'nl', campaignLanguage: 'nl', onlyOnline: true, audience: 'endClient', endClient, organisation, ...extra });

const LINE_TEXT = 'Onze afspraak staat gepland op {{DATUM_AFSPRAAK}}.\n\nLocatie: {{LOCATIE_AFSPRAAK}}\n\nWil je de afspraak bevestigen?';
const PLAIN_TEXT = 'Onze afspraak staat gepland op {{DATUM_AFSPRAAK}}.\n\nWil je de afspraak bevestigen?';

const base = (children: string[], blocks: object) => ({
  root: { type: 'EmailLayout', data: { childrenIds: ['main'] } },
  main: { type: 'Container', data: { style: {}, props: { childrenIds: children } } },
  bye: { type: 'Text', data: { props: { text: 'Tot dan!' } } },
  ...blocks,
});
const text = (value: string) => ({ type: 'Text', data: { props: { text: value, markdown: true } } });
const button = (props: object = {}) => ({
  type: 'Button',
  data: { style: { fontSize: 16 }, props: { text: 'Afspraak deelnemen', url: '{{LOCATIE_AFSPRAAK}}', ...props } },
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lineMail = (value = LINE_TEXT): any => base(['text', 'bye'], { text: text(value) });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const buttonMail = (props: object = {}, value = PLAIN_TEXT): any => base(['text', 'button', 'bye'], { text: text(value), button: button(props) });
const managed = (visible: boolean | string = true) => buttonMail({ meetingButton: true, visible }, LINE_TEXT);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const added = (before: any, after: any) => Object.keys(after).filter((id) => !(id in before));

describe('meeting button tokens', () => {
  it('has the names the backend resolves', () => {
    expect(BUTTON_TOKENS.map((t) => [t.nl, t.en, t.field])).toEqual([
      ['MEETING_KNOP_EINDKLANT', 'MEETING_BUTTON_ENDCLIENT', 'showButton'],
      ['KNOP_GROOTTE_EINDKLANT', 'BUTTON_SIZE_ENDCLIENT', 'buttonSize'],
      ['KNOP_STIJL_EINDKLANT', 'BUTTON_STYLE_ENDCLIENT', 'buttonFormat'],
      ['MEETING_KNOP_ORGANISATIE', 'MEETING_BUTTON_ORGANISATION', 'showButton'],
      ['KNOP_GROOTTE_ORGANISATIE', 'BUTTON_SIZE_ORGANISATION', 'buttonSize'],
      ['KNOP_STIJL_ORGANISATIE', 'BUTTON_STYLE_ORGANISATION', 'buttonFormat'],
    ]);
  });

  it('fills a field that is exactly a token with the boolean, the size or the style', () => {
    const b = brand({ showButton: true, buttonSize: 'lg', buttonFormat: 'rectangle' }, { showButton: false, buttonSize: 'xs', buttonFormat: 'pill' });
    expect(
      resolveBrandTokens(
        { a: '{{MEETING_KNOP_EINDKLANT}}', b: '{{ BUTTON_SIZE_ENDCLIENT }}', c: '{{KNOP_STIJL_EINDKLANT}}', d: '{{MEETING_BUTTON_ORGANISATION}}', e: '{{KNOP_GROOTTE_ORGANISATIE}}' },
        b
      )
    ).toEqual({ a: true, b: 'large', c: 'rectangle', d: false, e: 'x-small' });
  });

  it('falls back to no button and the size and style a button block has of its own', () => {
    const b = brand({ showButton: 'yes', buttonSize: 'huge', buttonFormat: null });
    expect(resolveBrandTokens({ a: '{{MEETING_KNOP_EINDKLANT}}', b: '{{KNOP_GROOTTE_EINDKLANT}}', c: '{{KNOP_STIJL_EINDKLANT}}' }, b)).toEqual({
      a: false,
      b: 'medium',
      c: 'rounded',
    });
  });

  it('writes the button text in the language of the campaign', () => {
    const label = (campaignLanguage: unknown) => resolveBrandTokens('{{KNOPTEKST_MEETING}} / {{BUTTON_TEXT_MEETING}}', brand({}, {}, { campaignLanguage }));
    expect(label('nl')).toBe('Afspraak deelnemen / Afspraak deelnemen');
    expect(label('en')).toBe('Join meeting / Join meeting');
    expect(label('de')).toBe('Meeting beitreten / Meeting beitreten');
    expect(label('fr')).toBe('Rejoindre la réunion / Rejoindre la réunion');
    expect(label('es')).toBe('Unirse a la reunión / Unirse a la reunión');
    expect(label(undefined)).toBe('Afspraak deelnemen / Afspraak deelnemen');
  });

  it('lets a button that holds tokens through the block schema, with the tokens kept', () => {
    const data = button({ meetingButton: true, visible: '{{MEETING_KNOP_EINDKLANT}}', size: '{{KNOP_GROOTTE_EINDKLANT}}', buttonStyle: '{{BUTTON_STYLE_ORGANISATION}}' }).data;
    const result = safeParseWithBrandTokens(ButtonPropsSchema, data);
    expect(result.success).toBe(true);
    expect(result.success && result.data).toBe(data);
    expect(safeParseWithBrandTokens(ButtonPropsSchema, button({ size: '{{KNOP_GROOTTE}}' }).data).success).toBe(false);
  });
});

describe('the location line', () => {
  it('is a line that ends on the location variable, in any wording', () => {
    for (const line of [
      'Locatie: {{LOCATIE_AFSPRAAK}}',
      'Location: {{LOCATION_APPOINTMENT}}',
      'Lieu : {{ LOCATION_APPOINTMENT }}',
      'Je kunt de afspraak bijwonen via: {{LOCATION_APPOINTMENT}}.',
      '**Locatie:** {{LOCATIE_AFSPRAAK}}',
      '**Locatie: {{LOCATIE_AFSPRAAK}}**',
      '{{LOCATIE_AFSPRAAK}}',
    ]) {
      expect(locationLines(line)).toHaveLength(1);
    }
    for (const line of [
      'We spreken af op {{LOCATIE_AFSPRAAK}} om tien uur',
      '{{NAAM_PROSPECT}}, de locatie is {{LOCATIE_AFSPRAAK}}',
      '[Deelnemen]({{LOCATIE_AFSPRAAK}})',
      'Locatie: <a href="{{LOCATIE_AFSPRAAK}}">link</a>',
      'Locatie: onbekend',
    ]) {
      expect(locationLines(line)).toEqual([]);
    }
    expect(locationLines(LINE_TEXT)).toEqual([{ index: 2, variable: 'LOCATIE_AFSPRAAK' }]);
  });

  it('leaves every other line exactly as it was when it is taken out', () => {
    expect(withoutLocationLines(LINE_TEXT)).toBe(PLAIN_TEXT);
    expect(withoutLocationLines('A\n\nLocatie: {{LOCATIE_AFSPRAAK}}')).toBe('A');
    expect(withoutLocationLines('Locatie: {{LOCATIE_AFSPRAAK}}\n\nB')).toBe('B');
    expect(withoutLocationLines('Naam: {{NAAM_PROSPECT}}\nLocatie: {{LOCATIE_AFSPRAAK}}\nE-mail: {{EMAIL_PROSPECT}}')).toBe(
      'Naam: {{NAAM_PROSPECT}}\nE-mail: {{EMAIL_PROSPECT}}'
    );
    expect(withoutLocationLines('A  \n\nLocatie: {{LOCATIE_AFSPRAAK}}\n\n  B ')).toBe('A  \n\n  B ');
    expect(withoutLocationLines('A\r\n\r\nLocatie: {{LOCATIE_AFSPRAAK}}\r\n\r\nB')).toBe('A\r\n\r\nB');
    expect(withoutLocationLines(PLAIN_TEXT)).toBe(PLAIN_TEXT);
  });
});

describe('the button or the line', () => {
  it('shows the button in place of the line when it is on and may show', () => {
    const document = managed();
    const chosen = chooseMeetingButton(document, true);
    expect(chosen.text.data.props.text).toBe(PLAIN_TEXT);
    expect(chosen.button.data.props.visible).toBe(true);
    expect(document.text.data.props.text).toBe(LINE_TEXT);
  });

  it('shows the line when the button is off or may not show', () => {
    for (const [document, allowed] of [[managed(true), false], [managed(false), true]] as const) {
      const chosen = chooseMeetingButton(document, allowed);
      expect(chosen.text.data.props.text).toBe(LINE_TEXT);
      expect(chosen.button.data.props.visible).toBe(false);
    }
  });

  it('does not touch a mail without a marked button', () => {
    for (const document of [lineMail(), buttonMail(), buttonMail({}, LINE_TEXT)]) {
      expect(chooseMeetingButton(document, true)).toBe(document);
    }
  });

  it('gives the recipient the button or the line, by the setting and by the campaign', () => {
    const document = managed('{{MEETING_KNOP_EINDKLANT}}');
    const sent = (b: ReturnType<typeof brand>, options?: { meetingButton?: boolean }) => renderable(document, b, options);
    const on = sent(brand({ showButton: true }));
    expect(on.main.data.props.childrenIds).toEqual(['text', 'button', 'bye']);
    expect(on.text.data.props.text).toBe(PLAIN_TEXT);
    for (const line of [sent(brand({ showButton: false })), sent(brand({ showButton: true }, {}, { onlyOnline: false })), sent(brand({ showButton: true }), { meetingButton: false })]) {
      expect(line.main.data.props.childrenIds).toEqual(['text', 'bye']);
      expect(line.text.data.props.text).toBe(LINE_TEXT);
    }
    // A campaign whose locations are not known yet is not held back.
    expect(sent(brand({ showButton: true }, {}, { onlyOnline: null })).main.data.props.childrenIds).toContain('button');
  });

  it('hides a meeting button in the canvas when it is off, and whenever the campaign is not online only', () => {
    const block = managed('{{MEETING_KNOP_EINDKLANT}}').button;
    expect(isHiddenBlock(block, brand({ showButton: true }))).toBe(false);
    expect(isHiddenBlock(block, brand({ showButton: false }))).toBe(true);
    expect(isHiddenBlock(block, brand({ showButton: true }, {}, { onlyOnline: false }))).toBe(true);
    expect(isHiddenBlock(managed(true).button, brand({}, {}, { onlyOnline: false }))).toBe(true);
    // Any other button is not held to that rule.
    expect(isHiddenBlock(button({ url: 'https://example.com' }), brand({}, {}, { onlyOnline: false }))).toBe(false);
  });
});

describe('the meeting button in the Styles tab', () => {
  it('reads a line, a button, a linked button and a mail without a location', () => {
    expect(meetingState(base(['bye'], {}), brand())).toEqual({ kind: 'none' });
    expect(meetingState(lineMail(), brand())).toMatchObject({ kind: 'line', textId: 'text', variable: 'LOCATIE_AFSPRAAK' });
    expect(meetingState(buttonMail(), brand())).toMatchObject({ kind: 'button', buttonId: 'button', marked: false, token: null, shown: true });
    const linked = managed('{{MEETING_KNOP_EINDKLANT}}');
    expect(meetingState(linked, brand({ showButton: false }))).toMatchObject({ kind: 'button', marked: true, shown: false, token: { source: 'endClient' } });
    expect(meetingButtonShown(linked, brand({ showButton: true }))).toBe(true);
    expect(meetingButtonShown(linked, brand({ showButton: false }))).toBe(false);
    expect(meetingButtonShown(linked, brand({ showButton: true }, {}, { onlyOnline: false }))).toBe(false);
    expect(meetingButtonShown(buttonMail(), brand())).toBe(false);
  });

  it('leaves a location that is used any other way to its author', () => {
    for (const document of [
      lineMail('We spreken af op {{LOCATIE_AFSPRAAK}} om tien uur.'),
      lineMail(`${LINE_TEXT}\n\nLocation: {{LOCATION_APPOINTMENT}}`),
      buttonMail({}, LINE_TEXT),
      base(['html', 'bye'], { html: { type: 'Html', data: { props: { contents: '<a href="{{LOCATIE_AFSPRAAK}}">Deelnemen</a>' } } } }),
      base(['text', 'button', 'again', 'bye'], { text: text(PLAIN_TEXT), button: button(), again: button() }),
    ]) {
      expect(meetingState(document, brand())).toEqual({ kind: 'unmanaged' });
      expect(withMeetingButton(document, true, brand())).toBe(document);
    }
  });

  it('adds a button under the text with the line, following the settings of the audience', () => {
    const document = lineMail();
    const b = brand({ buttonColor: '#112233' });
    const visible = tokenText(buttonToken('show', 'endClient'), b);
    const next = withMeetingButton(document, visible, b);
    const [id] = added(document, next);
    expect(next.main.data.props.childrenIds).toEqual(['text', id, 'bye']);
    expect(next[id]).toEqual({
      type: 'Button',
      data: {
        style: { fontSize: 16, padding: { top: 8, bottom: 8, left: 24, right: 24 } },
        props: {
          text: '{{KNOPTEKST_MEETING}}',
          url: '{{LOCATIE_AFSPRAAK}}',
          size: '{{KNOP_GROOTTE_EINDKLANT}}',
          buttonStyle: '{{KNOP_STIJL_EINDKLANT}}',
          buttonBackgroundColor: '{{KNOPKLEUR_EINDKLANT}}',
          buttonTextColor: '#FFFFFF',
          meetingButton: true,
          visible: '{{MEETING_KNOP_EINDKLANT}}',
        },
      },
    });
    expect(next.text).toBe(document.text);
    expect(meetingState(next, b)).toMatchObject({ kind: 'button', marked: true, token: { source: 'endClient' } });

    // For the account manager: the organisation's tokens, in its language.
    const host = brand({}, {}, { audience: 'organisation', language: 'en' });
    const forHost = withMeetingButton(document, true, host);
    const props = forHost[added(document, forHost)[0]].data.props;
    expect([props.size, props.buttonStyle, props.text, props.buttonBackgroundColor, props.visible]).toEqual([
      '{{BUTTON_SIZE_ORGANISATION}}',
      '{{BUTTON_STYLE_ORGANISATION}}',
      '{{BUTTON_TEXT_MEETING}}',
      '#000000',
      true,
    ]);
  });

  it('marks a button that was there, and gives the mail its location line', () => {
    const document = buttonMail();
    const next = withMeetingButton(document, false, brand({}, {}, { campaignLanguage: 'fr' }));
    expect(next.button.data.props).toMatchObject({ meetingButton: true, visible: false, text: 'Afspraak deelnemen' });
    expect(next.button.data.style).toEqual(document.button.data.style);
    expect(next.text.data.props.text).toBe(`${PLAIN_TEXT}\n\nLieu : {{LOCATIE_AFSPRAAK}}`);
    expect(added(document, next)).toEqual([]);

    // Without a text above the button the line gets a text of its own.
    const alone = base(['button', 'bye'], { button: button() });
    const withLine = withMeetingButton(alone, true, brand());
    const [id] = added(alone, withLine);
    expect(withLine.main.data.props.childrenIds).toEqual([id, 'button', 'bye']);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((withLine as any)[id].data.props.text).toBe('Locatie: {{LOCATIE_AFSPRAAK}}');
  });

  it('only switches a button that is under the setting already', () => {
    const document = managed(true);
    const off = withMeetingButton(document, false, brand());
    expect(off.button.data.props.visible).toBe(false);
    expect(off.text).toBe(document.text);
    const linked = withMeetingButton(off, '{{MEETING_KNOP_EINDKLANT}}', brand());
    expect(linked.button.data.props.visible).toBe('{{MEETING_KNOP_EINDKLANT}}');
    expect(Object.keys(linked)).toEqual(Object.keys(document));
  });
});
