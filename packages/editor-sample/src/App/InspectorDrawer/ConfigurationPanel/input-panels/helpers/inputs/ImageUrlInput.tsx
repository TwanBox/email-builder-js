import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import { EditOutlined, LinkOutlined } from '@mui/icons-material';
import { Box, ButtonBase, IconButton, Stack, Tooltip, Typography } from '@mui/material';

import {
  brandTokenOf,
  brandTokensOfKind,
  brandValue,
  TBrandToken,
  tokenText,
  wrappableTokenText,
} from '../../../../../../documents/editor/brandTokens';
import { useBrand, useCanEditLogo, useLogoUpload } from '../../../../../../documents/editor/EditorContext';

import LogoDropZone from './LogoDropZone';
import TextInput from './TextInput';

const OPTION_SX = {
  justifyContent: 'flex-start',
  gap: 1,
  p: 0.5,
  width: '100%',
  border: '1px solid',
  borderRadius: '4px',
  textAlign: 'left',
};

const THUMBNAIL_SX = {
  width: 32,
  height: 24,
  flexShrink: 0,
  border: '1px solid',
  borderColor: 'grey.300',
  borderRadius: '4px',
  objectFit: 'contain',
  bgcolor: '#FFFFFF',
};

type Props = {
  label: string;
  defaultValue: string;
  onChange: (value: string) => void;
};

/**
 * The image URL as three options, like the brand colours in the colour picker: the end client's
 * logo, the organisation's logo, or a web URL typed by hand. The first two store a brand token that
 * the backend fills in per campaign when the mail is sent.
 *
 * The end client's logo has an Edit button when the mail belongs to a campaign: it opens a drop area
 * for a new logo (LogoDropZone), which the campaign keeps when the mail is saved.
 */
export default function ImageUrlInput({ label, defaultValue, onChange }: Props) {
  const t = useIntl();
  const brand = useBrand();
  const canEditLogo = useCanEditLogo();
  const { busy } = useLogoUpload();
  const logoTokens = brandTokensOfKind('logo');
  const selectedToken = brandTokenOf(defaultValue);
  // Kept so switching to a logo and back does not throw away what was typed.
  const [ownUrl, setOwnUrl] = useState(selectedToken ? '' : defaultValue);
  const [editingLogo, setEditingLogo] = useState(false);
  const endClientLogoUrl = brand.endClient.logoUrl;

  // A new logo has come in: the drop area closes.
  const [shownLogo, setShownLogo] = useState(endClientLogoUrl);
  useEffect(() => {
    if (endClientLogoUrl === shownLogo) return;
    setShownLogo(endClientLogoUrl);
    if (!busy) setEditingLogo(false);
  }, [endClientLogoUrl, shownLogo, busy]);

  const renderTokenOption = (token: TBrandToken) => {
    const selected = selectedToken === token;
    const editable = canEditLogo && token.source === 'endClient';
    const editText = t.formatMessage({ id: 'editLogo' });
    return (
      <Stack key={token.nl} spacing={1}>
        <Box sx={{ position: 'relative' }}>
          <ButtonBase
            onClick={() => onChange(tokenText(token, brand))}
            sx={{ ...OPTION_SX, borderColor: selected ? 'black' : 'grey.200', ...(editable && { pr: 5 }) }}
          >
            <Box component="img" src={brandValue(token, brand)} alt="" sx={THUMBNAIL_SX} />
            <Typography variant="caption">{wrappableTokenText(tokenText(token, brand))}</Typography>
          </ButtonBase>
          {editable && (
            <Tooltip title={editText}>
              <IconButton
                size="small"
                aria-label={editText}
                aria-expanded={editingLogo}
                onClick={() => setEditingLogo((open) => !open)}
                sx={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', color: editingLogo ? 'text.primary' : 'grey.600' }}
              >
                <EditOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        {editable && editingLogo && <LogoDropZone />}
      </Stack>
    );
  };

  const renderOwnUrlOption = () => {
    if (selectedToken) {
      return (
        <ButtonBase onClick={() => onChange(ownUrl)} sx={{ ...OPTION_SX, borderColor: 'grey.200' }}>
          <LinkOutlined fontSize="small" sx={{ color: 'grey.600' }} />
          <Typography variant="caption">{label}</Typography>
        </ButtonBase>
      );
    }
    return (
      <Box sx={{ ...OPTION_SX, px: 1, pb: 1, borderColor: 'black' }}>
        <TextInput
          label={label}
          defaultValue={defaultValue}
          onChange={(v) => {
            setOwnUrl(v);
            onChange(v);
          }}
        />
      </Box>
    );
  };

  return (
    <Stack spacing={1} sx={{ width: '100%' }}>
      {logoTokens.map(renderTokenOption)}
      {renderOwnUrlOption()}
    </Stack>
  );
}
