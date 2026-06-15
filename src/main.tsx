import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';
import './i18n';

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (
      e.key === 'F5' ||
      (e.ctrlKey && e.key === 'r') ||
      (e.metaKey && e.key === 'r')
    ) {
      e.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
);
