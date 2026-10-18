import React, { useState } from 'react';
import { useIntl } from 'react-intl';

import { FormControlLabel, InputLabel, Stack, Switch } from '@mui/material';

import { backgroundToken, backgroundTokenOf, backgroundValue, tokenText } from '../../../../../../documents/editor/brandTokens';
import { setCampaignLayoutValue, useBrand } from '../../../../../../documents/editor/EditorContext';

import BrandSyncToggle from './BrandSyncToggle';
import { NullableColorInput } from './ColorInput';

type LogoBackgroundInputProps = {
  label: string;
  // A background that follows the logo background of the campaign or organisation holds its token.
  defaultValue: string | null;
  onChange: (v: string | null) => void;
};

/**
 * The background colour of an Image, which can follow the campaign's or organisation's "brand colour
 * behind the logo". A linked background shows that setting as a switch; switching it changes the
 * setting (campaign) or is not possible here (organisation). Unlinked it is the usual colour picker.
 */
export default function LogoBackgroundInput({ label, defaultValue, onChange }: LogoBackgroundInputProps) {
  const brand = useBrand();
  const t = useIntl();
  const [raw, setRaw] = useState<string | null>(defaultValue ?? null);
  // Remounts the colour picker when the field is linked or unlinked, so it shows the new value.
  const [pickerKey, setPickerKey] = useState(0);
  const token = backgroundTokenOf(raw);
  const shown = token ? backgroundValue(token, brand) : raw;

  const set = (v: string | null) => {
    setRaw(v);
    onChange(v);
  };

  // Linking or unlinking swaps what the field holds, so the picker starts again from the new value.
  const relink = (v: string | null) => {
    set(v);
    setPickerKey((k) => k + 1);
  };

  const sync = (
    <BrandSyncToggle
      token={token}
      onLink={(source) => relink(tokenText(backgroundToken(source), brand))}
      onUnlink={() => relink(shown)}
    />
  );

  if (token) {
    return (
      <Stack alignItems="flex-start">
        <InputLabel sx={{ mb: 0.5 }}>{label}</InputLabel>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <FormControlLabel
            label={t.formatMessage({ id: 'logoBackgroundSwitch' })}
            disabled={token.source === 'organisation'}
            control={
              <Switch
                checked={brand[token.source].logoBackground === true}
                onChange={(_, checked: boolean) => setCampaignLayoutValue('logoBackground', checked)}
              />
            }
          />
          {sync}
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack direction="row" alignItems="flex-end" spacing={0.5}>
      <NullableColorInput key={pickerKey} label={label} defaultValue={raw} onChange={set} brandOptions="brand" />
      {sync}
    </Stack>
  );
}
