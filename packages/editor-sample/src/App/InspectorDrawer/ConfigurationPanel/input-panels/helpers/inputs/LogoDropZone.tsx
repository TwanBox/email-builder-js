import React, { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';

import { FileUploadOutlined } from '@mui/icons-material';
import { ButtonBase, CircularProgress, Stack, Typography } from '@mui/material';

import { requestEndClientLogo, useLogoUpload } from '../../../../../../documents/editor/EditorContext';

const ACCEPT = 'image/*,.svg,.ico,.heic,.heif,.bmp,.avif,.tif,.tiff,.webp';

const ERROR_TEXT = {
  tooLarge: 'logoTooLarge',
  unreadable: 'logoUnreadable',
  notFetched: 'logoNotFetched',
  failed: 'logoFailed',
} as const;

/**
 * What was dropped or pasted: a file, or else the address of an image dragged from another page (as a
 * link, or inside the HTML the browser hands over). Null when it is neither. As in the wizard.
 */
function droppedImage(data: DataTransfer | null): { file: File } | { url: string } | null {
  if (!data) return null;
  const file = Array.from(data.files ?? []).find(
    (each) => each.type.startsWith('image/') || /\.(svg|ico|heic|heif|bmp|avif|tiff?|webp)$/i.test(each.name)
  );
  if (file) return { file };
  const html = data.getData('text/html');
  const fromHtml = html ? new DOMParser().parseFromString(html, 'text/html').querySelector('img')?.getAttribute('src') : null;
  const fromList = data
    .getData('text/uri-list')
    .split(/\r?\n/)
    .find((line) => line && !line.startsWith('#'));
  const url = [fromHtml, fromList, data.getData('text/plain').trim()].find((candidate) => /^(https?:|data:image\/)/i.test(candidate ?? ''));
  return url ? { url } : null;
}

/**
 * The drop area for a new end client logo, like the logo area of the campaign wizard: drag an image
 * in, click to choose one, or paste one (Cmd+V) while it is open. tele-mailing converts it to PNG and
 * stores it; the canvas shows it at once and the campaign keeps it when the mail is saved.
 */
export default function LogoDropZone() {
  const t = useIntl();
  const { busy, error } = useLogoUpload();
  const [dragging, setDragging] = useState(false);
  const [unreadable, setUnreadable] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const take = (input: { file: File } | { url: string } | null) => {
    if (!input) return setUnreadable(true);
    setUnreadable(false);
    void requestEndClientLogo(input);
  };

  // A copied image pasted while the area is open is the logo; pasted text stays where it is typed.
  useEffect(() => {
    if (busy) return;
    const onPaste = (e: ClipboardEvent) => {
      const file = Array.from(e.clipboardData?.files ?? []).find((each) => each.type.startsWith('image/'));
      if (!file) return;
      e.preventDefault();
      take({ file });
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [busy]);

  const message = unreadable ? 'logoUnreadable' : error ? ERROR_TEXT[error] : null;

  return (
    <Stack spacing={0.5}>
      <ButtonBase
        disabled={busy}
        onClick={() => fileInput.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!busy) take(droppedImage(e.dataTransfer));
        }}
        sx={{
          width: '100%',
          flexDirection: 'column',
          gap: 1,
          px: 2,
          py: 3,
          border: '1px dashed',
          borderColor: dragging ? 'black' : 'grey.400',
          borderRadius: '4px',
          color: 'text.secondary',
          textAlign: 'center',
          '&:hover': { borderColor: 'black' },
        }}
      >
        {busy ? <CircularProgress size={20} color="inherit" /> : <FileUploadOutlined />}
        <Typography variant="caption">{t.formatMessage({ id: busy ? 'logoConverting' : 'logoDropHint' })}</Typography>
      </ButtonBase>
      <input
        ref={fileInput}
        type="file"
        hidden
        accept={ACCEPT}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) take({ file });
          e.target.value = '';
        }}
      />
      {message && (
        <Typography variant="caption" color="error">
          {t.formatMessage({ id: message })}
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary">
        {t.formatMessage({ id: 'logoPngNote' })}
      </Typography>
    </Stack>
  );
}
