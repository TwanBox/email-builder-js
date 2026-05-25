import React, { useEffect, useRef } from 'react';

import { Box, Typography } from '@mui/material';
import { renderToStaticMarkup } from '@usewaypoint/email-builder';
import { useIntl } from 'react-intl';

import {
  useDocument,
  useTextBody,
  setTextBodyAndNotify,
} from '../../documents/editor/EditorContext';
import { stripHtmlToText } from '../../utils/stripHtmlToText';

export default function TextOnlyEditor() {
  const document = useDocument();
  const textBody = useTextBody();
  const initialised = useRef(false);
  const t = useIntl();

  // Auto-populate from the HTML template the very first time this editor mounts
  // (handles the case where textOnly was already true when the project was loaded,
  //  but no textBody was saved yet)
  useEffect(() => {
    if (!initialised.current && !textBody) {
      const html = renderToStaticMarkup(document, { rootBlockId: 'root' });
      setTextBodyAndNotify(stripHtmlToText(html));
    }
    initialised.current = true;
  }, []);

  return (
    <Box
      sx={{
        height: '100%',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        justifyContent: 'center',
        overflowY: 'auto',
        py: 4,
        px: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: 600,
          gap: 1,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: 'text.disabled',
            textTransform: 'uppercase',
            letterSpacing: 1,
            fontSize: '0.65rem',
          }}
        >
          {t.formatMessage({ id: 'textOnlyLabel' })}
        </Typography>
        <Box
          component="textarea"
          value={textBody}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setTextBodyAndNotify(e.target.value)
          }
          spellCheck={false}
          sx={{
            width: '100%',
            flexGrow: 1,
            minHeight: 480,
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            lineHeight: 1.7,
            color: '#262626',
            backgroundColor: '#ffffff',
            border: '1px solid #e0e0e0',
            borderRadius: 1,
            p: 3,
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
            '&:focus': {
              borderColor: 'primary.main',
              boxShadow: '0 0 0 2px rgba(25,118,210,0.15)',
            },
          }}
        />
      </Box>
    </Box>
  );
}
