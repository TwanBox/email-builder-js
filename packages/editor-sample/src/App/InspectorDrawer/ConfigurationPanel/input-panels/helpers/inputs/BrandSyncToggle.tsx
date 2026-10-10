import React from 'react';
import { useIntl } from 'react-intl';

import { LinkOffOutlined, LinkOutlined } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';

import { TBrandSource, TLayoutToken } from '../../../../../../documents/editor/brandTokens';
import { useBrand } from '../../../../../../documents/editor/EditorContext';

type Props = {
  // The layout token the field holds, when it follows a setting.
  token: TLayoutToken | null;
  onLink: (source: TBrandSource) => void;
  onUnlink: () => void;
};

/**
 * Links a field to the layout setting of the campaign or the organisation, or gives it a value of
 * its own again. Which of the two a mail links to follows from who the mail is for
 * (`brand.audience`), so there is one button and no choice to get wrong.
 *
 * The hover text says what the field follows now, what a change to it does and what a click does.
 * For a linked field that depends on what it is linked to (the token it holds), not on the audience:
 * a setting of the campaign is changed from here, one of the organisation is not.
 */
export default function BrandSyncToggle({ token, onLink, onUnlink }: Props) {
  const brand = useBrand();
  const t = useIntl();

  if (token) {
    return (
      <Tooltip title={t.formatMessage({ id: token.source === 'endClient' ? 'syncLinkedCampaign' : 'syncLinkedOrganisation' })}>
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
    <Tooltip title={t.formatMessage({ id: audience === 'endClient' ? 'syncUnlinkedCampaign' : 'syncUnlinkedOrganisation' })}>
      <IconButton size="small" onClick={() => onLink(audience)} sx={{ color: 'grey.500' }}>
        <LinkOffOutlined fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
