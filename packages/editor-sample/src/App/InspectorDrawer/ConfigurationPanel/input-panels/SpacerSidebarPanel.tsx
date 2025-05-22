import React, { useState } from 'react';

import { HeightOutlined } from '@mui/icons-material';
import { SpacerProps, SpacerPropsDefaults, SpacerPropsSchema } from '@usewaypoint/block-spacer';

import BaseSidebarPanel from './helpers/BaseSidebarPanel';
import SliderInput from './helpers/inputs/SliderInput';

import { useIntl } from 'react-intl';

type SpacerSidebarPanelProps = {
  data: SpacerProps;
  setData: (v: SpacerProps) => void;
};
export default function SpacerSidebarPanel({ data, setData }: SpacerSidebarPanelProps) {
  const [, setErrors] = useState<Zod.ZodError | null>(null);

  const updateData = (d: unknown) => {
    const res = SpacerPropsSchema.safeParse(d);
    if (res.success) {
      setData(res.data);
      setErrors(null);
    } else {
      setErrors(res.error);
    }
  };

  const t = useIntl()

  return (
    <BaseSidebarPanel title={t.formatMessage({ id: 'spacerBlock' })}>
      <SliderInput
        label={t.formatMessage({ id: 'distance' })}
        iconLabel={<HeightOutlined sx={{ color: 'text.secondary' }} />}
        units="px"
        step={4}
        min={4}
        max={128}
        defaultValue={data.props?.height ?? SpacerPropsDefaults.height}
        onChange={(height) => updateData({ ...data, props: { ...data.props, height } })}
      />
    </BaseSidebarPanel>
  );
}
