// A link to the reschedule or cancel page. Stripped like any other tag it would leave only its text
// ("Verplaatsen") in the text version, with no way to reach the page.
const RESCHEDULE_OR_CANCEL_LINK =
  /<a\b[^>]*?\shref\s*=\s*(["'])\s*({{\s*(?:AFSPRAAK_VERPLAATS_URL|APPOINTMENT_RESCHEDULE_URL|AFSPRAAK_ANNULEER_URL|APPOINTMENT_CANCEL_URL)\s*}})\s*\1[^>]*>([\s\S]*?)<\/a>/gi;

/**
 * Strip HTML tags and decode common entities to produce plain text.
 * Mirrors the stripHtmlToText() function in the backend mail service, except that a reschedule or
 * cancel link keeps its URL as the line `Label: {{VAR}}`. That is the line the backend writes when a
 * campaign's link settings change (tele-mailing-backend src/utils/link-settings.ts, htmlToText):
 * keep the two the same.
 */
export function stripHtmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(RESCHEDULE_OR_CANCEL_LINK, (match, _quote, variable, inner) => {
      const label = inner.replace(/<[^>]+>/g, '').trim();
      return label ? `${label}: ${variable}` : match;
    })
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/td>/gi, '  ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
