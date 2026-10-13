import React, { useState } from 'react';

import { Typography } from '@mui/material';
import { TextProps, TextPropsSchema } from '@usewaypoint/block-text';

import { safeParseWithBrandTokens } from '../../../../documents/editor/brandTokens';
import { useBrand, useDocument } from '../../../../documents/editor/EditorContext';
import { locationLines } from '../../../../documents/editor/locationLine';
import { meetingButtonShown } from '../../../../documents/editor/meetingButton';

import BaseSidebarPanel from './helpers/BaseSidebarPanel';
// import BooleanInput from './helpers/inputs/BooleanInput';
import TextInput from './helpers/inputs/TextInput';
import MultiStylePropertyPanel from './helpers/style-inputs/MultiStylePropertyPanel';

import { useIntl } from 'react-intl';

type TextSidebarPanelProps = {
  data: TextProps;
  setData: (v: TextProps) => void;
};
export default function TextSidebarPanel({ data, setData }: TextSidebarPanelProps) {
  const [, setErrors] = useState<Zod.ZodError | null>(null);

  const updateData = (d: unknown) => {
    const res = safeParseWithBrandTokens(TextPropsSchema, d);
    if (res.success) {
      setData(res.data);
      setErrors(null);
    } else {
      setErrors(res.error);
    }
  };

  const t = useIntl()
  const document = useDocument();
  const brand = useBrand();
  // The line is here to edit, but the mail shows the meeting button in its place.
  const locationLineHidden = locationLines(data.props?.text).length > 0 && meetingButtonShown(document, brand);

  return (
    <BaseSidebarPanel title={t.formatMessage({ id: 'textBlock' })}>
      <TextInput
        label={t.formatMessage({ id: 'content' })}
        rows={5}
        defaultValue={data.props?.text ?? ''}
        onChange={(text) => updateData({ ...data, props: { ...data.props, text, markdown: true } })}
      />
      {locationLineHidden && (
        <Typography variant="caption" color="text.secondary" display="block">
          {t.formatMessage({ id: 'locationLineHidden' })}
        </Typography>
      )}
      {/* <BooleanInput
        label="Markdown"
        defaultValue={data.props?.markdown ?? true}
        onChange={(markdown) => updateData({ ...data, props: { ...data.props, markdown } })}
      /> */}

      <MultiStylePropertyPanel
        names={['color', 'backgroundColor', 'fontFamily', 'fontSize', 'fontWeight', 'textAlign', 'padding']}
        value={data.style}
        onChange={(style) => updateData({ ...data, style })}
      />
    </BaseSidebarPanel>
  );
}
