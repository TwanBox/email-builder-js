import React from 'react';
import { useIntl } from 'react-intl';

import { LinkOffOutlined, LinkOutlined } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';

import { TBrandSource } from '../../../../../../documents/editor/brandTokens';
import { useBrand } from '../../../../../../documents/editor/EditorContext';

type Props = {
  // The token the field holds, when it follows a setting of the campaign or the organisation.
  token: { source: TBrandSource } | null;
  onLink: (source: TBrandSource) => void;
  onUnlink: () => void;
  // A second note for the hover text, about the field itself; it follows the first after a blank line.
  note?: string | null;
};

/**
 * Links a field to the setting of the campaign or the organisation, or gives it a value of
 * its own again. Which of the two a mail links to follows from who the mail is for
 * (`brand.audience`), so there is one button and no choice to get wrong.
 *
 * The hover text says what the field follows now, what a change to it does and what a click does.
 * For a linked field that depends on what it is linked to (the token it holds), not on the audience:
 * a setting of the campaign is changed from here, one of the organisation is not.
 */
export default function BrandSyncToggle({ token, onLink, onUnlink, note }: Props) {
  const brand = useBrand();
  const t = useIntl();
  const hoverText = (id: string) =>
    note ? (
      <>
        {t.formatMessage({ id })}
        <br />
        <br />
        {note}
      </>
    ) : (
      t.formatMessage({ id })
    );

  if (token) {
    return (
      <Tooltip title={hoverText(token.source === 'endClient' ? 'syncLinkedCampaign' : 'syncLinkedOrganisation')}>
        <IconButton size="small" onClick={onUnlink} sx={{ color: 'primary.main' }}>
          <LinkOutlined fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  }

  // Without an audience tele-mailing does not fill in or save a setting, so there is nothing to link to.
  const audience = brand.audience;
  if (!audience) {
    return null;
  }
  return (
    <Tooltip title={hoverText(audience === 'endClient' ? 'syncUnlinkedCampaign' : 'syncUnlinkedOrganisation')}>
      <IconButton size="small" onClick={() => onLink(audience)} sx={{ color: 'grey.500' }}>
        <LinkOffOutlined fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
