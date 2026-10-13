import React, { useState } from 'react';

import { InputLabel, Stack, ToggleButtonGroup } from '@mui/material';

import {
  BUTTON_SIZES,
  buttonToken,
  buttonTokenOf,
  buttonValue,
  TButtonFormat,
  TButtonSize,
  tokenText,
} from '../../../../../../documents/editor/brandTokens';
import { setCampaignLayoutValue, useBrand } from '../../../../../../documents/editor/EditorContext';

import BrandSyncToggle from './BrandSyncToggle';

type Props = {
  kind: 'size' | 'format';
  label: string;
  // A size or style that follows the campaign's or organisation's setting holds its token.
  defaultValue: string | null | undefined;
  // What the button renders without a value of its own.
  fallback: string;
  onChange: (v: string) => void;
  children: JSX.Element | JSX.Element[];
};

// A campaign stores a size as xs, sm, md or lg; a Button block calls the same sizes by another name.
const SIZE_OF_BLOCK = new Map<string, TButtonSize>((Object.keys(BUTTON_SIZES) as TButtonSize[]).map((size) => [BUTTON_SIZES[size], size]));

/**
 * The size or the style of a Button, like RadioGroupInput, that can follow the setting of the
 * campaign or the organisation. A linked choice shows the setting it follows; picking another then
 * changes that setting (campaign) or is switched off (organisation).
 */
export default function ButtonSettingInput({ kind, label, defaultValue, fallback, onChange, children }: Props) {
  const brand = useBrand();
  const [raw, setRaw] = useState<string | null>(defaultValue ?? null);
  const token = buttonTokenOf(raw);
  const shown = token ? String(buttonValue(token, brand)) : raw ?? fallback;

  const set = (v: string) => {
    setRaw(v);
    onChange(v);
  };

  const handleChange = (_: unknown, v: unknown) => {
    // Clicking the choice that is selected already gives null: there is always one selected.
    if (typeof v !== 'string') return;
    if (!token) return set(v);
    if (kind === 'size') {
      const size = SIZE_OF_BLOCK.get(v);
      if (size) setCampaignLayoutValue('buttonSize', size);
    } else {
      setCampaignLayoutValue('buttonFormat', v as TButtonFormat);
    }
  };

  return (
    <Stack alignItems="flex-start" width="100%">
      <InputLabel shrink>{label}</InputLabel>
      <Stack direction="row" alignItems="center" spacing={0.5} width="100%">
        <ToggleButtonGroup exclusive fullWidth value={shown} size="small" disabled={token?.source === 'organisation'} onChange={handleChange}>
          {children}
        </ToggleButtonGroup>
        <BrandSyncToggle token={token} onLink={(source) => set(tokenText(buttonToken(kind, source), brand))} onUnlink={() => set(shown)} />
      </Stack>
    </Stack>
  );
}
