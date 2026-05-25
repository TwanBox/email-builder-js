import React from 'react';

import { FormControlLabel, Switch, Typography } from '@mui/material';
import { useIntl } from 'react-intl';

import { setDocument, useDocument, useTextOnly, useTextBody, setTextOnlyAndNotify } from '../../documents/editor/EditorContext';

import EmailLayoutSidebarPanel from './ConfigurationPanel/input-panels/EmailLayoutSidebarPanel';
import BaseSidebarPanel from './ConfigurationPanel/input-panels/helpers/BaseSidebarPanel';

export default function StylesPanel() {
  const block = useDocument().root;
  const textOnly = useTextOnly();
  const t = useIntl();

  if (!block) {
    return <p>Block not found</p>;
  }

  const { data, type } = block;
  if (type !== 'EmailLayout') {
    throw new Error('Expected "root" element to be of type EmailLayout');
  }

  return (
    <>
      <EmailLayoutSidebarPanel key="root" data={data} setData={(data) => setDocument({ root: { type, data } })} />
      <BaseSidebarPanel title={t.formatMessage({ id: 'sending' })}>
        <FormControlLabel
          control={
            <Switch
              checked={textOnly}
              onChange={(e) => setTextOnlyAndNotify(e.target.checked)}
            />
          }
          label={t.formatMessage({ id: 'textOnlyLabel' })}
        />
        {textOnly && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
            {t.formatMessage({ id: 'textOnlyDescription' })}
          </Typography>
        )}
      </BaseSidebarPanel>
    </>
  );
}
