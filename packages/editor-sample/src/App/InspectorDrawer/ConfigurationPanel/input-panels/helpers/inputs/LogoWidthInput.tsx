import React, { useState } from 'react';

import { Stack, TextField, Typography } from '@mui/material';

import { layoutToken, layoutTokenOf, layoutValue, tokenText } from '../../../../../../documents/editor/brandTokens';
import { setCampaignLayoutValue, useBrand } from '../../../../../../documents/editor/EditorContext';

import BrandSyncToggle from './BrandSyncToggle';

type LogoWidthInputProps = {
  label: string;
  // A width that follows the logo width of the campaign or organisation holds its layout token.
  defaultValue: number | string | null | undefined;
  onChange: (v: number | string | null) => void;
};

/**
 * The width of an Image, like TextDimensionInput, that can follow the logo width of the campaign or
 * the organisation. A linked width shows the setting it follows; typing then changes that setting
 * (campaign) or is switched off (organisation).
 */
export default function LogoWidthInput({ label, defaultValue, onChange }: LogoWidthInputProps) {
  const brand = useBrand();
  const [raw, setRaw] = useState<number | string | null>(defaultValue ?? null);
  const token = layoutTokenOf(raw);
  const shown = token ? (layoutValue(token, brand) as number | null) : typeof raw === 'number' ? raw : null;

  const set = (v: number | string | null) => {
    setRaw(v);
    onChange(v);
  };

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (ev) => {
    const value = parseInt(ev.target.value);
    if (token) {
      // The setting holds a width of at least 1; empty is "auto".
      setCampaignLayoutValue('logoWidth', isNaN(value) || value < 1 ? null : value);
      return;
    }
    set(isNaN(value) ? null : value);
  };

  return (
    <Stack direction="row" alignItems="flex-end" spacing={0.5} width="100%">
      <TextField
        fullWidth
        onChange={handleChange}
        value={shown ?? ''}
        disabled={token?.source === 'organisation'}
        label={label}
        variant="standard"
        placeholder="auto"
        size="small"
        InputLabelProps={{ shrink: true }}
        InputProps={{
          endAdornment: (
            <Typography variant="body2" color="text.secondary">
              px
            </Typography>
          ),
        }}
      />
      <BrandSyncToggle
        token={token}
        onLink={(source) => set(tokenText(layoutToken('width', source), brand))}
        onUnlink={() => set(shown)}
      />
    </Stack>
  );
}
