import React, { useState } from 'react';

import { HeightOutlined } from '@mui/icons-material';
import { DividerProps, DividerPropsDefaults, DividerPropsSchema } from '@usewaypoint/block-divider';

import BaseSidebarPanel from './helpers/BaseSidebarPanel';
import ColorInput from './helpers/inputs/ColorInput';
import SliderInput from './helpers/inputs/SliderInput';
import MultiStylePropertyPanel from './helpers/style-inputs/MultiStylePropertyPanel';

import { useIntl } from 'react-intl';

type DividerSidebarPanelProps = {
  data: DividerProps;
  setData: (v: DividerProps) => void;
};
export default function DividerSidebarPanel({ data, setData }: DividerSidebarPanelProps) {
  const [, setErrors] = useState<Zod.ZodError | null>(null);
  const updateData = (d: unknown) => {
    const res = DividerPropsSchema.safeParse(d);
    if (res.success) {
      setData(res.data);
      setErrors(null);
    } else {
      setErrors(res.error);
    }
  };

  const lineColor = data.props?.lineColor ?? DividerPropsDefaults.lineColor;
  const lineHeight = data.props?.lineHeight ?? DividerPropsDefaults.lineHeight;

  const t = useIntl()

  return (
    <BaseSidebarPanel title={t.formatMessage({ id: 'dividerBlock' })}>
      <ColorInput
        label={t.formatMessage({ id: 'color' })}
        defaultValue={lineColor}
        onChange={(lineColor) => updateData({ ...data, props: { ...data.props, lineColor } })}
      />
      <SliderInput
        label={t.formatMessage({ id: 'height' })}
        iconLabel={<HeightOutlined sx={{ color: 'text.secondary' }} />}
        units="px"
        step={1}
        min={1}
        max={24}
        defaultValue={lineHeight}
        onChange={(lineHeight) => updateData({ ...data, props: { ...data.props, lineHeight } })}
      />
      <MultiStylePropertyPanel
        names={['backgroundColor', 'padding']}
        value={data.style}
        onChange={(style) => updateData({ ...data, style })}
      />
    </BaseSidebarPanel>
  );
}
