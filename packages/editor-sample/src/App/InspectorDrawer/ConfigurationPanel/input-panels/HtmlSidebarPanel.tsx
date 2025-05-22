import React, { useState } from 'react';

import { HtmlProps, HtmlPropsSchema } from '@usewaypoint/block-html';

import BaseSidebarPanel from './helpers/BaseSidebarPanel';
import TextInput from './helpers/inputs/TextInput';
import MultiStylePropertyPanel from './helpers/style-inputs/MultiStylePropertyPanel';

import { useIntl } from 'react-intl';

type HtmlSidebarPanelProps = {
  data: HtmlProps;
  setData: (v: HtmlProps) => void;
};
export default function HtmlSidebarPanel({ data, setData }: HtmlSidebarPanelProps) {
  const [, setErrors] = useState<Zod.ZodError | null>(null);

  const updateData = (d: unknown) => {
    const res = HtmlPropsSchema.safeParse(d);
    if (res.success) {
      setData(res.data);
      setErrors(null);
    } else {
      setErrors(res.error);
    }
  };

  const t = useIntl()

  return (
    <BaseSidebarPanel title={t.formatMessage({ id: 'htmlBlock' })}>
      <TextInput
        label={t.formatMessage({ id: 'content' })}
        rows={5}
        defaultValue={data.props?.contents ?? ''}
        onChange={(contents) => updateData({ ...data, props: { ...data.props, contents } })}
      />
      <MultiStylePropertyPanel
        names={['color', 'backgroundColor', 'fontFamily', 'fontSize', 'textAlign', 'padding']}
        value={data.style}
        onChange={(style) => updateData({ ...data, style })}
      />
    </BaseSidebarPanel>
  );
}
