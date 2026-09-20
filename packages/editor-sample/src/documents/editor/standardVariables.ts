import { TBrand } from './brandTokens';

/**
 * The `{{VAR}}` placeholders tele-mailing-backend fills in when a mail is sent
 * (tele-mailing-backend src/utils/template-variables.ts, which must list the same names).
 *
 * Every variable has a Dutch and a UK English name and both always work; an organisation's
 * language only decides which of the two the Variabelen tab shows.
 */

type TStandardVariable = {
  nl: string;
  en: string;
  // An example of what the variable produces, or what it means.
  hint?: string;
  hintEn?: string;
};

export const STANDARD_VARIABLES: TStandardVariable[] = [
  { nl: 'NAAM_PROSPECT', en: 'NAME_PROSPECT' },
  { nl: 'EMAIL_PROSPECT', en: 'EMAIL_PROSPECT' },
  { nl: 'NAAM_ACCOUNTMANAGER', en: 'NAME_ACCOUNT_MANAGER' },
  { nl: 'EMAIL_ACCOUNTMANAGER', en: 'EMAIL_ACCOUNT_MANAGER' },
  { nl: 'EMAIL_AFZENDER', en: 'EMAIL_SENDER' },
  { nl: 'NAAM_AFSPRAAK', en: 'NAME_APPOINTMENT' },
  { nl: 'STARTTIJD_AFSPRAAK', en: 'START_TIME_APPOINTMENT', hint: 'HH:mm' },
  { nl: 'EINDTIJD_AFSPRAAK', en: 'END_TIME_APPOINTMENT', hint: 'HH:mm' },
  { nl: 'DATUM_AFSPRAAK', en: 'DATE_APPOINTMENT', hint: 'DD-MM-YYYY' },
  // The backend formats dates in Dutch, so these examples stay Dutch in both languages.
  { nl: 'DATUM_AFSPRAAK_WEEKDAG', en: 'DATE_APPOINTMENT_WEEKDAY', hint: 'maandag' },
  { nl: 'DATUM_AFSPRAAK_UITGESCHREVEN', en: 'DATE_APPOINTMENT_WRITTEN_OUT', hint: 'maandag 3 maart' },
  { nl: 'AFSPRAAK_TIJDZONE', en: 'APPOINTMENT_TIMEZONE', hint: 'Europe/Amsterdam' },
  { nl: 'NAAM_CAMPAGNE', en: 'NAME_CAMPAIGN' },
  { nl: 'NOTITIE_VOOR_IEDEREEN', en: 'NOTE_FOR_EVERYONE', hint: 'Afspraak Beschrijving', hintEn: 'Appointment description' },
  { nl: 'LOCATIE_AFSPRAAK', en: 'LOCATION_APPOINTMENT', hint: 'Adres of Meeting link', hintEn: 'Address or meeting link' },
  { nl: 'AFSPRAAK_VERPLAATS_URL', en: 'APPOINTMENT_RESCHEDULE_URL' },
  { nl: 'AFSPRAAK_ANNULEER_URL', en: 'APPOINTMENT_CANCEL_URL' },
  { nl: 'BEDRIJFSNAAM_ACCOUNTMANAGER', en: 'COMPANY_NAME_ACCOUNT_MANAGER' },
  { nl: 'BEDRIJFSNAAM_ORGANISATIE', en: 'COMPANY_NAME_ORGANISATION' },
];

/** `{{NAME}}` in the organisation's language. */
export function variableText(variable: TStandardVariable, brand: TBrand): string {
  return `{{${brand.language === 'nl' ? variable.nl : variable.en}}}`;
}

/** The example or explanation shown on hover, in the organisation's language. */
export function variableHint(variable: TStandardVariable, brand: TBrand): string | undefined {
  return brand.language === 'nl' ? variable.hint : variable.hintEn ?? variable.hint;
}
