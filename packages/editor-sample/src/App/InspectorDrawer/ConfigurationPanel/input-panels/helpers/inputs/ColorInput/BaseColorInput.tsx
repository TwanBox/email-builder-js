import React, { useState } from 'react';

import { AddOutlined, CloseOutlined, LinkOutlined } from '@mui/icons-material';
import { ButtonBase, InputLabel, Menu, Stack, Typography } from '@mui/material';

import {
  brandTokenOf,
  displayColor,
  TBrandColorKind,
  tokenText,
  wrappableTokenText,
} from '../../../../../../../documents/editor/brandTokens';
import { useBrand } from '../../../../../../../documents/editor/EditorContext';

import Picker from './Picker';

const BUTTON_SX = {
  border: '1px solid',
  borderColor: 'cadet.400',
  width: 32,
  height: 32,
  borderRadius: '4px',
  bgcolor: '#FFFFFF',
};

type Props =
  | {
      nullable: true;
      label: string;
      onChange: (value: string | null) => void;
      defaultValue: string | null;
      brandOptions?: TBrandColorKind;
    }
  | {
      nullable: false;
      label: string;
      onChange: (value: string) => void;
      defaultValue: string;
      brandOptions?: TBrandColorKind;
    };
export default function ColorInput({ label, defaultValue, onChange, nullable, brandOptions }: Props) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [value, setValue] = useState(defaultValue);
  const brand = useBrand();
  // A field linked to a brand colour holds its token; show the colour it stands for.
  const linkedToken = brandTokenOf(value);
  const shownColor = displayColor(value, brand);
  const handleClickOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const renderResetButton = () => {
    if (!nullable) {
      return null;
    }
    if (typeof value !== 'string' || value.trim().length === 0) {
      return null;
    }
    return (
      <ButtonBase
        onClick={() => {
          setValue(null);
          onChange(null);
        }}
      >
        <CloseOutlined fontSize="small" sx={{ color: 'grey.600' }} />
      </ButtonBase>
    );
  };

  const renderOpenButton = () => {
    if (shownColor) {
      return <ButtonBase onClick={handleClickOpen} sx={{ ...BUTTON_SX, bgcolor: shownColor }} />;
    }
    return (
      <ButtonBase onClick={handleClickOpen} sx={{ ...BUTTON_SX }}>
        <AddOutlined fontSize="small" />
      </ButtonBase>
    );
  };

  const renderLinkedToken = () => {
    if (!linkedToken) {
      return null;
    }
    return (
      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: 'grey.700', minWidth: 0 }}>
        <LinkOutlined fontSize="small" />
        <Typography variant="caption">{wrappableTokenText(tokenText(linkedToken, brand))}</Typography>
      </Stack>
    );
  };

  return (
    <Stack alignItems="flex-start">
      <InputLabel sx={{ mb: 0.5 }}>{label}</InputLabel>
      <Stack direction="row" spacing={1} alignItems="center">
        {renderOpenButton()}
        {renderResetButton()}
        {renderLinkedToken()}
      </Stack>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        MenuListProps={{
          sx: { height: 'auto', padding: 0 },
        }}
      >
        <Picker
          value={value || ''}
          brandOptions={brandOptions}
          onChange={(v) => {
            setValue(v);
            onChange(v);
          }}
        />
      </Menu>
    </Stack>
  );
}
