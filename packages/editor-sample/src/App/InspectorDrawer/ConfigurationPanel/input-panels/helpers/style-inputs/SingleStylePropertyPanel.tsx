import React from 'react';

import { RoundedCornerOutlined } from '@mui/icons-material';

import { TStyle } from '../../../../../../documents/blocks/helpers/TStyle';
import { NullableColorInput } from '../inputs/ColorInput';
import { NullableFontFamily } from '../inputs/FontFamily';
import FontSizeInput from '../inputs/FontSizeInput';
import FontWeightInput from '../inputs/FontWeightInput';
import PaddingInput from '../inputs/PaddingInput';
import SliderInput from '../inputs/SliderInput';
import TextAlignInput from '../inputs/TextAlignInput';

import { useIntl } from 'react-intl';

type StylePropertyPanelProps = {
  name: keyof TStyle;
  value: TStyle;
  onChange: (style: TStyle) => void;
};
export default function SingleStylePropertyPanel({ name, value, onChange }: StylePropertyPanelProps) {
  const defaultValue = value[name] ?? null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (v: any) => {
    onChange({ ...value, [name]: v });
  };

  const t = useIntl()

  switch (name) {
    case 'backgroundColor':
      return <NullableColorInput label={t.formatMessage({ id: 'backgroundColor' })} defaultValue={defaultValue} onChange={handleChange} />;
    case 'borderColor':
      return <NullableColorInput label={t.formatMessage({ id: 'borderColor' })} defaultValue={defaultValue} onChange={handleChange} />;
    case 'borderRadius':
      return (
        <SliderInput
          iconLabel={<RoundedCornerOutlined />}
          units="px"
          step={4}
          marks
          min={0}
          max={48}
          label={t.formatMessage({ id: 'borderRadius' })}
          defaultValue={defaultValue}
          onChange={handleChange}
        />
      );
    case 'color':
      return <NullableColorInput label={t.formatMessage({ id: 'textColor' })} defaultValue={defaultValue} onChange={handleChange} />;
    case 'fontFamily':
      return <NullableFontFamily label={t.formatMessage({ id: 'fontFamily' })} defaultValue={defaultValue} onChange={handleChange} />;
    case 'fontSize':
      return <FontSizeInput label={t.formatMessage({ id: 'fontSize' })} defaultValue={defaultValue} onChange={handleChange} />;
    case 'fontWeight':
      return <FontWeightInput label={t.formatMessage({ id: 'fontWeight' })} defaultValue={defaultValue} onChange={handleChange} />;
    case 'textAlign':
      return <TextAlignInput label={t.formatMessage({ id: 'alignment' })} defaultValue={defaultValue} onChange={handleChange} />;
    case 'padding':
      return <PaddingInput label={t.formatMessage({ id: 'padding' })} defaultValue={defaultValue} onChange={handleChange} />;
  }
}
