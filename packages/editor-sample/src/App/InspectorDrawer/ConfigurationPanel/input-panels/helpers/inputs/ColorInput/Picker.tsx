import React from 'react';
import { HexColorInput, HexColorPicker } from 'react-colorful';
import { useIntl } from 'react-intl';

import { Box, ButtonBase, Divider, Stack, Typography } from '@mui/material';

import {
  brandTokenOf,
  brandTokensOfKind,
  displayColor,
  TBrandColorKind,
  tokenText,
  wrappableTokenText,
} from '../../../../../../../documents/editor/brandTokens';
import { useBrand } from '../../../../../../../documents/editor/EditorContext';

import Swatch from './Swatch';

const DEFAULT_PRESET_COLORS = [
  '#E11D48',
  '#DB2777',
  '#C026D3',
  '#9333EA',
  '#7C3AED',
  '#4F46E5',
  '#2563EB',
  '#0284C7',
  '#0891B2',
  '#0D9488',
  '#059669',
  '#16A34A',
  '#65A30D',
  '#CA8A04',
  '#D97706',
  '#EA580C',
  '#DC2626',
  '#FFFFFF',
  '#FAFAFA',
  '#F5F5F5',
  '#E5E5E5',
  '#D4D4D4',
  '#A3A3A3',
  '#737373',
  '#525252',
  '#404040',
  '#262626',
  '#171717',
  '#0A0A0A',
  '#000000',
];

const SX = {
  p: 1,
  '.react-colorful__pointer ': {
    width: 16,
    height: 16,
  },
  '.react-colorful__saturation': {
    mb: 1,
    borderRadius: '4px',
  },
  '.react-colorful__last-control': {
    borderRadius: '4px',
  },
  '.react-colorful__hue-pointer': {
    width: '4px',
    borderRadius: '4px',
    height: 24,
    cursor: 'col-resize',
  },
  '.react-colorful__saturation-pointer': {
    cursor: 'all-scroll',
  },
  input: {
    padding: 1,
    border: '1px solid',
    borderColor: 'grey.300',
    borderRadius: '4px',
    width: '100%',
  },
};

type Props = {
  value: string;
  onChange: (v: string) => void;
  brandOptions?: TBrandColorKind;
};
export default function Picker({ value, onChange, brandOptions }: Props) {
  const brand = useBrand();
  const t = useIntl();
  // For a linked field the colour controls start from the brand colour; any change unlinks it.
  const color = displayColor(value, brand) ?? '';

  const renderBrandOptions = () => {
    if (!brandOptions) {
      return null;
    }
    const linkedToken = brandTokenOf(value);
    return (
      <>
        {brandTokensOfKind(brandOptions).map((token) => {
          const text = tokenText(token, brand);
          const selected = linkedToken === token;
          return (
            <ButtonBase
              key={token.nl}
              onClick={() => onChange(text)}
              sx={{
                justifyContent: 'flex-start',
                gap: 1,
                p: 0.5,
                border: '1px solid',
                borderColor: selected ? 'black' : 'grey.200',
                borderRadius: '4px',
                textAlign: 'left',
              }}
            >
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  flexShrink: 0,
                  border: '1px solid',
                  borderColor: 'grey.300',
                  borderRadius: '4px',
                  bgcolor: displayColor(text, brand),
                }}
              />
              <Typography variant="caption">{wrappableTokenText(text)}</Typography>
            </ButtonBase>
          );
        })}
        <Divider />
        <Typography variant="caption" color="text.secondary">
          {t.formatMessage({ id: 'customColour' })}
        </Typography>
      </>
    );
  };

  return (
    <Stack spacing={1} sx={{ ...SX, ...(brandOptions && { width: 240, '.react-colorful': { width: '100%' } }) }}>
      {renderBrandOptions()}
      <HexColorPicker color={color} onChange={onChange} />
      <Swatch paletteColors={DEFAULT_PRESET_COLORS} value={value} onChange={onChange} />
      <Box pt={1}>
        <HexColorInput prefixed color={color} onChange={onChange} />
      </Box>
    </Stack>
  );
}
