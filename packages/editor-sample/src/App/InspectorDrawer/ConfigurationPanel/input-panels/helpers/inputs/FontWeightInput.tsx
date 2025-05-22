import React, { useState } from 'react';

import { ToggleButton } from '@mui/material';

import RadioGroupInput from './RadioGroupInput';

import { useIntl } from 'react-intl';

type Props = {
  label: string;
  defaultValue: string;
  onChange: (value: string) => void;
};
export default function FontWeightInput({ label, defaultValue, onChange }: Props) {
  const [value, setValue] = useState(defaultValue);
  const t = useIntl()
  return (
    <RadioGroupInput
      label={label}
      defaultValue={value}
      onChange={(fontWeight) => {
        setValue(fontWeight);
        onChange(fontWeight);
      }}
    >
      <ToggleButton value="normal">{t.formatMessage({ id: 'regular' })}</ToggleButton>
      <ToggleButton value="bold">{t.formatMessage({ id: 'bold' })}</ToggleButton>
    </RadioGroupInput>
  );
}
