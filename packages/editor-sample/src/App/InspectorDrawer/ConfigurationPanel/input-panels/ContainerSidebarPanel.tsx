import React, { useState } from 'react';

import ContainerPropsSchema, { ContainerProps } from '../../../../documents/blocks/Container/ContainerPropsSchema';

import BaseSidebarPanel from './helpers/BaseSidebarPanel';
import MultiStylePropertyPanel from './helpers/style-inputs/MultiStylePropertyPanel';

import { useIntl } from 'react-intl';

type ContainerSidebarPanelProps = {
  data: ContainerProps;
  setData: (v: ContainerProps) => void;
};

export default function ContainerSidebarPanel({ data, setData }: ContainerSidebarPanelProps) {
  const [, setErrors] = useState<Zod.ZodError | null>(null);
  const updateData = (d: unknown) => {
    const res = ContainerPropsSchema.safeParse(d);
    if (res.success) {
      setData(res.data);
      setErrors(null);
    } else {
      setErrors(res.error);
    }
  };

  const t = useIntl()

  return (
    <BaseSidebarPanel title={t.formatMessage({ id: 'containerBlock' })}>
      <MultiStylePropertyPanel
        names={['backgroundColor', 'borderColor', 'borderRadius', 'padding']}
        value={data.style}
        onChange={(style) => updateData({ ...data, style })}
      />
    </BaseSidebarPanel>
  );
}
