import React, { useState } from 'react';

import { RoundedCornerOutlined } from '@mui/icons-material';

import EmailLayoutPropsSchema, {
  EmailLayoutProps,
} from '../../../../documents/blocks/EmailLayout/EmailLayoutPropsSchema';

import BaseSidebarPanel from './helpers/BaseSidebarPanel';
import ColorInput, { NullableColorInput } from './helpers/inputs/ColorInput';
import { NullableFontFamily } from './helpers/inputs/FontFamily';
import SliderInput from './helpers/inputs/SliderInput';

import { useIntl } from 'react-intl';

type EmailLayoutSidebarFieldsProps = {
  data: EmailLayoutProps;
  setData: (v: EmailLayoutProps) => void;
};
export default function EmailLayoutSidebarFields({ data, setData }: EmailLayoutSidebarFieldsProps) {
  const [, setErrors] = useState<Zod.ZodError | null>(null);

  const updateData = (d: unknown) => {
    const res = EmailLayoutPropsSchema.safeParse(d);
    if (res.success) {
      setData(res.data);
      setErrors(null);
    } else {
      setErrors(res.error);
    }
  };

  const t = useIntl()

  return (
    <BaseSidebarPanel title={t.formatMessage({ id: 'global' })}>
      <ColorInput
        label={t.formatMessage({ id: 'backdropColor' })}
        defaultValue={data.backdropColor ?? '#F5F5F5'}
        onChange={(backdropColor) => updateData({ ...data, backdropColor })}
      />
      <ColorInput
        label={t.formatMessage({ id: 'canvasColor' })}
        defaultValue={data.canvasColor ?? '#FFFFFF'}
        onChange={(canvasColor) => updateData({ ...data, canvasColor })}
      />
      <NullableColorInput
        label={t.formatMessage({ id: 'canvasBorderColor' })}
        defaultValue={data.borderColor ?? null}
        onChange={(borderColor) => updateData({ ...data, borderColor })}
      />
      <SliderInput
        iconLabel={<RoundedCornerOutlined />}
        units="px"
        step={4}
        marks
        min={0}
        max={48}
        label={t.formatMessage({ id: 'canvasBorderRadius' })}
        defaultValue={data.borderRadius ?? 0}
        onChange={(borderRadius) => updateData({ ...data, borderRadius })}
      />
      <NullableFontFamily
        label={t.formatMessage({ id: 'fontFamily' })}
        defaultValue="MODERN_SANS"
        onChange={(fontFamily) => updateData({ ...data, fontFamily })}
      />
      <ColorInput
        label={t.formatMessage({ id: 'textColor' })}
        defaultValue={data.textColor ?? '#262626'}
        onChange={(textColor) => updateData({ ...data, textColor })}
      />
    </BaseSidebarPanel>
  );
}
