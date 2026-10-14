import React, { useState } from 'react';

import { ToggleButton } from '@mui/material';
import { ButtonProps, ButtonPropsDefaults, ButtonPropsSchema } from '@usewaypoint/block-button';

import { safeParseWithBrandTokens } from '../../../../documents/editor/brandTokens';

import BaseSidebarPanel from './helpers/BaseSidebarPanel';
import ButtonSettingInput from './helpers/inputs/ButtonSettingInput';
import ColorInput from './helpers/inputs/ColorInput';
import RadioGroupInput from './helpers/inputs/RadioGroupInput';
import TextInput from './helpers/inputs/TextInput';
import MultiStylePropertyPanel from './helpers/style-inputs/MultiStylePropertyPanel';

import { useIntl } from 'react-intl';

type ButtonSidebarPanelProps = {
  data: ButtonProps;
  setData: (v: ButtonProps) => void;
};
export default function ButtonSidebarPanel({ data, setData }: ButtonSidebarPanelProps) {
  const [, setErrors] = useState<Zod.ZodError | null>(null);

  const updateData = (d: unknown) => {
    const res = safeParseWithBrandTokens(ButtonPropsSchema, d);
    if (res.success) {
      setData(res.data);
      setErrors(null);
    } else {
      setErrors(res.error);
    }
  };

  const t = useIntl()

  const text = data.props?.text ?? ButtonPropsDefaults.text;
  const url = data.props?.url ?? ButtonPropsDefaults.url;
  const fullWidth = data.props?.fullWidth ?? ButtonPropsDefaults.fullWidth;
  const buttonTextColor = data.props?.buttonTextColor ?? ButtonPropsDefaults.buttonTextColor;
  const buttonBackgroundColor = data.props?.buttonBackgroundColor ?? ButtonPropsDefaults.buttonBackgroundColor;

  return (
    <BaseSidebarPanel title={t.formatMessage({ id: 'buttonBlock' })}>
      <TextInput
        label={t.formatMessage({ id: 'text' })}
        defaultValue={text}
        onChange={(text) => updateData({ ...data, props: { ...data.props, text } })}
      />
      <TextInput
        label="Url"
        defaultValue={url}
        onChange={(url) => updateData({ ...data, props: { ...data.props, url } })}
      />
      <RadioGroupInput
        label={t.formatMessage({ id: 'width' })}
        defaultValue={fullWidth ? 'FULL_WIDTH' : 'AUTO'}
        onChange={(v) => updateData({ ...data, props: { ...data.props, fullWidth: v === 'FULL_WIDTH' } })}
      >
        <ToggleButton value="FULL_WIDTH">{t.formatMessage({ id: 'full' })}</ToggleButton>
        <ToggleButton value="AUTO">{t.formatMessage({ id: 'auto' })}</ToggleButton>
      </RadioGroupInput>
      {/* The size and the style can follow the setting of the campaign or the organisation. */}
      <ButtonSettingInput
        kind="size"
        label={t.formatMessage({ id: 'size' })}
        defaultValue={data.props?.size}
        fallback={ButtonPropsDefaults.size}
        onChange={(size) => updateData({ ...data, props: { ...data.props, size } })}
      >
        <ToggleButton value="x-small">Xs</ToggleButton>
        <ToggleButton value="small">Sm</ToggleButton>
        <ToggleButton value="medium">Md</ToggleButton>
        <ToggleButton value="large">Lg</ToggleButton>
      </ButtonSettingInput>
      <ButtonSettingInput
        kind="format"
        label={t.formatMessage({ id: 'style' })}
        defaultValue={data.props?.buttonStyle}
        fallback={ButtonPropsDefaults.buttonStyle}
        onChange={(buttonStyle) => updateData({ ...data, props: { ...data.props, buttonStyle } })}
      >
        <ToggleButton value="rectangle">{t.formatMessage({ id: 'rectangle' })}</ToggleButton>
        <ToggleButton value="rounded">{t.formatMessage({ id: 'rounded' })}</ToggleButton>
        <ToggleButton value="pill">{t.formatMessage({ id: 'pill' })}</ToggleButton>
      </ButtonSettingInput>
      <ColorInput
        label={t.formatMessage({ id: 'textColor' })}
        brandOptions="buttonText"
        defaultValue={buttonTextColor}
        onChange={(buttonTextColor) => updateData({ ...data, props: { ...data.props, buttonTextColor } })}
      />
      <ColorInput
        label={t.formatMessage({ id: 'buttonColor' })}
        brandOptions="button"
        defaultValue={buttonBackgroundColor}
        onChange={(buttonBackgroundColor) => updateData({ ...data, props: { ...data.props, buttonBackgroundColor } })}
      />
      <MultiStylePropertyPanel
        names={['backgroundColor', 'fontFamily', 'fontSize', 'fontWeight', 'textAlign', 'padding']}
        value={data.style}
        onChange={(style) => updateData({ ...data, style })}
      />
    </BaseSidebarPanel>
  );
}
