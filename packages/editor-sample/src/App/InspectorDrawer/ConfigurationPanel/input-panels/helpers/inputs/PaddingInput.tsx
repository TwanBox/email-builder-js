import React, { useState } from 'react';

import {
  AlignHorizontalLeftOutlined,
  AlignHorizontalRightOutlined,
  AlignVerticalBottomOutlined,
  AlignVerticalTopOutlined,
} from '@mui/icons-material';
import { Box, InputLabel, Stack } from '@mui/material';

import {
  layoutToken,
  layoutTokenOf,
  layoutValue,
  TLayoutKind,
  tokenText,
} from '../../../../../../documents/editor/brandTokens';
import { setCampaignLayoutValue, useBrand } from '../../../../../../documents/editor/EditorContext';

import BrandSyncToggle from './BrandSyncToggle';
import RawSliderInput from './raw/RawSliderInput';

// A side that follows the logo padding of the campaign or organisation holds its layout token.
type TPaddingValue = {
  top: number | string;
  bottom: number | string;
  right: number | string;
  left: number | string;
};
type Props = {
  label: string;
  defaultValue: TPaddingValue | null;
  onChange: (value: TPaddingValue) => void;
  // Let the top and bottom padding follow the logo padding of the campaign or organisation (Image).
  brandSync?: boolean;
};

const SYNCED: Partial<Record<keyof TPaddingValue, TLayoutKind>> = { top: 'paddingTop', bottom: 'paddingBottom' };

export default function PaddingInput({ label, defaultValue, onChange, brandSync }: Props) {
  const brand = useBrand();
  const [value, setValue] = useState<TPaddingValue>(() => {
    if (defaultValue) {
      return defaultValue;
    }
    return {
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
    };
  });

  function handleChange(internalName: keyof TPaddingValue, nValue: number | string) {
    const v = {
      ...value,
      [internalName]: nValue,
    };
    setValue(v);
    onChange(v);
  }

  const renderSide = (side: keyof TPaddingValue, iconLabel: JSX.Element) => {
    const raw = value[side];
    const token = layoutTokenOf(raw);
    // A linked side shows the setting it follows; moving it changes that setting, not this mail.
    const shown = token ? (layoutValue(token, brand) as number) : typeof raw === 'number' ? raw : 0;
    const slider = (
      <RawSliderInput
        iconLabel={iconLabel}
        value={shown}
        disabled={token?.source === 'organisation'}
        setValue={(num) =>
          token ? setCampaignLayoutValue(token.field as 'logoPaddingTop' | 'logoPaddingBottom', num) : handleChange(side, num)
        }
        units="px"
        step={4}
        min={0}
        max={80}
        marks
      />
    );
    if (!brandSync) {
      return slider;
    }
    const kind = SYNCED[side];
    return (
      <Stack direction="row" alignItems="center" spacing={0.5} width="100%">
        {slider}
        <Box sx={{ width: 30, flexShrink: 0 }}>
          {kind && (
            <BrandSyncToggle
              token={token}
              onLink={(source) => handleChange(side, tokenText(layoutToken(kind, source), brand))}
              onUnlink={() => handleChange(side, shown)}
            />
          )}
        </Box>
      </Stack>
    );
  };

  return (
    <Stack spacing={2} alignItems="flex-start" pb={1}>
      <InputLabel shrink>{label}</InputLabel>

      {renderSide('top', <AlignVerticalTopOutlined sx={{ fontSize: 16 }} />)}
      {renderSide('bottom', <AlignVerticalBottomOutlined sx={{ fontSize: 16 }} />)}
      {renderSide('left', <AlignHorizontalLeftOutlined sx={{ fontSize: 16 }} />)}
      {renderSide('right', <AlignHorizontalRightOutlined sx={{ fontSize: 16 }} />)}
    </Stack>
  );
}
