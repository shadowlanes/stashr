import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/chrome-extension';
import App from './App';
import './style.css';

const PUBLISHABLE_KEY = import.meta.env['VITE_CLERK_PUBLISHABLE_KEY'] as string;
const SYNC_HOST = import.meta.env['VITE_CLERK_SYNC_HOST'] as string | undefined;

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');
}

const POPUP_URL = chrome.runtime.getURL('popup.html');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl={POPUP_URL}
      signInFallbackRedirectUrl={POPUP_URL}
      signUpFallbackRedirectUrl={POPUP_URL}
      syncSessionWithTab
      {...(SYNC_HOST ? { syncHost: SYNC_HOST } : {})}
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>,
);
