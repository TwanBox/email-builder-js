import React, { useState } from 'react';

import { MenuItem, TextField } from '@mui/material';

import { FONT_FAMILIES } from '../../../../../../documents/blocks/helpers/fontFamily';

import { useIntl } from 'react-intl';

const OPTIONS = FONT_FAMILIES.map((option) => (
  <MenuItem key={option.key} value={option.key} sx={{ fontFamily: option.value }}>
    {option.label}
  </MenuItem>
));

type NullableProps = {
  label: string;
  onChange: (value: null | string) => void;
  defaultValue: null | string;
};
export function NullableFontFamily({ label, onChange, defaultValue }: NullableProps) {
  const [value, setValue] = useState(defaultValue ?? 'inherit');
  const t = useIntl()

  return (
    <TextField
      select
      variant="standard"
      label={label}
      value={value}
      onChange={(ev) => {
        const v = ev.target.value;
        setValue(v);
        onChange(v === null ? null : v);
      }}
    >
      <MenuItem value="inherit">{t.formatMessage({ id: 'inherit' })}</MenuItem>
      {OPTIONS}
    </TextField>
  );
}
