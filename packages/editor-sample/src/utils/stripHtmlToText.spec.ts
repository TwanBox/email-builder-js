import { stripHtmlToText } from './stripHtmlToText';

describe('stripHtmlToText', () => {
  it('keeps the URL of a reschedule link', () => {
    expect(
      stripHtmlToText(
        '<div style="text-align:right"><a href="{{AFSPRAAK_VERPLAATS_URL}}" target="_blank" style="color: black;">Verplaatsen</a>\n</div>'
      )
    ).toBe('Verplaatsen: {{AFSPRAAK_VERPLAATS_URL}}');
  });

  it('keeps both links of the two-column layout, each on its own line', () => {
    expect(
      stripHtmlToText(
        '<p>Met vriendelijke groet,</p><table><tbody><tr>' +
          '<td><div><a href="{{APPOINTMENT_RESCHEDULE_URL}}" target="_blank">Reschedule</a></div></td>' +
          "<td><div><a target='_blank' href='{{ APPOINTMENT_CANCEL_URL }}'>Cancel</a></div></td>" +
          '</tr></tbody></table>'
      )
    ).toBe('Met vriendelijke groet,\n\nReschedule: {{APPOINTMENT_RESCHEDULE_URL}}\nCancel: {{ APPOINTMENT_CANCEL_URL }}');
  });

  it('leaves every other link as its text, as before', () => {
    expect(stripHtmlToText('<p>Zie <a href="https://example.com">onze site</a>.</p>')).toBe('Zie onze site.');
  });

  it('drops a link without text, as before', () => {
    expect(stripHtmlToText('<div><a href="{{AFSPRAAK_ANNULEER_URL}}"><img src="x.png"></a></div>')).toBe('');
  });
});
