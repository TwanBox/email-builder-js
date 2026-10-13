import React from 'react';

import { FormControlLabel, Stack, Switch, Typography } from '@mui/material';
import { useIntl } from 'react-intl';

import { barState, TBarRole, withBarVisible } from '../../documents/editor/brandingBars';
import { buttonToken, layoutToken, meetingButtonAllowed, tokenText } from '../../documents/editor/brandTokens';
import { meetingState, withMeetingButton } from '../../documents/editor/meetingButton';
import {
  setCampaignLayoutValue,
  setDocument,
  useBrand,
  useDocument,
  useTextOnly,
  setTextOnlyAndNotify,
} from '../../documents/editor/EditorContext';

import EmailLayoutSidebarPanel from './ConfigurationPanel/input-panels/EmailLayoutSidebarPanel';
import BaseSidebarPanel from './ConfigurationPanel/input-panels/helpers/BaseSidebarPanel';
import BrandSyncToggle from './ConfigurationPanel/input-panels/helpers/inputs/BrandSyncToggle';

/**
 * One branding bar: whether it shows, and whether it follows the campaign's or organisation's
 * setting. A bar that is off is not in the canvas, which is why it is switched here and not on the
 * block. Linked to the campaign, the switch changes the campaign's setting; linked to the
 * organisation it only shows it. The link button's hover text says which of these applies.
 */
function BrandingBarRow({ role }: { role: TBarRole }) {
  const document = useDocument();
  const brand = useBrand();
  const t = useIntl();
  const { token, shown } = barState(document, role, brand);
  const set = (visible: boolean | string) => setDocument(withBarVisible(document, role, visible, brand));

  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <FormControlLabel
        control={
          <Switch
            checked={shown}
            disabled={token?.source === 'organisation'}
            onChange={(e) =>
              token
                ? setCampaignLayoutValue(token.field as 'headerBrandingBar' | 'footerBrandingBar', e.target.checked)
                : set(e.target.checked)
            }
          />
        }
        label={t.formatMessage({ id: role === 'header' ? 'brandingBarHeader' : 'brandingBarFooter' })}
      />
      <BrandSyncToggle
        token={token}
        onLink={(source) => set(tokenText(layoutToken(role === 'header' ? 'headerBar' : 'footerBar', source), brand))}
        onUnlink={() => set(shown)}
      />
    </Stack>
  );
}

/**
 * The meeting button: whether the mail shows a button to the meeting in place of its location line,
 * and whether that follows the campaign's or organisation's setting. A button that is off is not in
 * the canvas, which is why it is switched here; its size and style are on the button itself. Linked
 * to the campaign, the switch changes the campaign's setting; linked to the organisation it only
 * shows it.
 *
 * There is nothing to switch in a mail that does not tell where the meeting is, or tells it in a way
 * of its own, and a campaign that also offers a phone call or a visit always shows the location line.
 */
function MeetingButtonRow() {
  const document = useDocument();
  const brand = useBrand();
  const t = useIntl();
  const state = meetingState(document, brand);
  const allowed = meetingButtonAllowed(brand);
  const switchable = state.kind === 'line' || state.kind === 'button';
  const token = state.kind === 'button' ? state.token : null;
  const shown = state.kind === 'button' && state.shown;
  const set = (visible: boolean | string) => setDocument(withMeetingButton(document, visible, brand));

  const note = !switchable
    ? state.kind === 'none'
      ? 'meetingButtonNone'
      : 'meetingButtonUnmanaged'
    : !allowed
      ? 'meetingButtonNotOnline'
      : null;
  // While the button shows, the link button's hover text also says what becomes of the location line.
  const fallbackNote = allowed && shown ? t.formatMessage({ id: 'meetingButtonFallback' }) : null;

  return (
    <>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <FormControlLabel
          control={
            <Switch
              checked={shown && allowed}
              disabled={!switchable || !allowed || token?.source === 'organisation'}
              onChange={(e) => (token ? setCampaignLayoutValue('showButton', e.target.checked) : set(e.target.checked))}
            />
          }
          label={t.formatMessage({ id: 'meetingButtonLabel' })}
        />
        {switchable && (
          <BrandSyncToggle
            token={token}
            onLink={(source) => set(tokenText(buttonToken('show', source), brand))}
            onUnlink={() => set(shown)}
            note={fallbackNote}
          />
        )}
      </Stack>
      {note && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
          {t.formatMessage({ id: note })}
        </Typography>
      )}
    </>
  );
}

export default function StylesPanel() {
  const block = useDocument().root;
  const textOnly = useTextOnly();
  const t = useIntl();

  if (!block) {
    return <p>Block not found</p>;
  }

  const { data, type } = block;
  if (type !== 'EmailLayout') {
    throw new Error('Expected "root" element to be of type EmailLayout');
  }

  return (
    <>
      <EmailLayoutSidebarPanel key="root" data={data} setData={(data) => setDocument({ root: { type, data } })} />
      <BaseSidebarPanel title={t.formatMessage({ id: 'brandingBars' })}>
        <Stack spacing={1}>
          <BrandingBarRow role="header" />
          <BrandingBarRow role="footer" />
        </Stack>
      </BaseSidebarPanel>
      <BaseSidebarPanel title={t.formatMessage({ id: 'meetingButton' })}>
        <MeetingButtonRow />
      </BaseSidebarPanel>
      <BaseSidebarPanel title={t.formatMessage({ id: 'sending' })}>
        <FormControlLabel
          control={
            <Switch
              checked={textOnly}
              onChange={(e) => setTextOnlyAndNotify(e.target.checked)}
            />
          }
          label={t.formatMessage({ id: 'textOnlyLabel' })}
        />
        {textOnly && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
            {t.formatMessage({ id: 'textOnlyDescription' })}
          </Typography>
        )}
      </BaseSidebarPanel>
    </>
  );
}
