import React from 'react';
import ReactDOM from 'react-dom/client';

import { CssBaseline, ThemeProvider } from '@mui/material';
import { IntlProvider } from 'react-intl';

import App from './App';
import theme from './theme';

import en from '../src/locales/en.json';
import nl from '../src/locales/nl.json';

const params = new URLSearchParams(window.location.search);
const locale = params.get('locale');

// Choose messages based on locale
const messages = {
  en,
  nl
}[locale as 'en' | 'nl'] || nl;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <IntlProvider locale={locale || 'nl'} messages={messages}>
        <App />
      </IntlProvider>
    </ThemeProvider>
  </React.StrictMode>
);
