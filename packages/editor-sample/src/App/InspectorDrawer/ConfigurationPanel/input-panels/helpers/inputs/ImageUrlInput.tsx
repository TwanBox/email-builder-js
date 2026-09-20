import React, { useState } from 'react';

import { LinkOutlined } from '@mui/icons-material';
import { Box, ButtonBase, Stack, Typography } from '@mui/material';

import {
  brandTokenOf,
  brandTokensOfKind,
  brandValue,
  TBrandToken,
  tokenText,
  wrappableTokenText,
} from '../../../../../../documents/editor/brandTokens';
import { useBrand } from '../../../../../../documents/editor/EditorContext';

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
 */
export default function ImageUrlInput({ label, defaultValue, onChange }: Props) {
  const brand = useBrand();
  const logoTokens = brandTokensOfKind('logo');
  const selectedToken = brandTokenOf(defaultValue);
  // Kept so switching to a logo and back does not throw away what was typed.
  const [ownUrl, setOwnUrl] = useState(selectedToken ? '' : defaultValue);

  const renderTokenOption = (token: TBrandToken) => {
    const selected = selectedToken === token;
    return (
      <ButtonBase
        key={token.nl}
        onClick={() => onChange(tokenText(token, brand))}
        sx={{ ...OPTION_SX, borderColor: selected ? 'black' : 'grey.200' }}
      >
        <Box component="img" src={brandValue(token, brand)} alt="" sx={THUMBNAIL_SX} />
        <Typography variant="caption">{wrappableTokenText(tokenText(token, brand))}</Typography>
      </ButtonBase>
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
