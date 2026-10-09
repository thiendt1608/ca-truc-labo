import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initPwa } from './platform/pwa';
import { App } from './ui/App';
import './ui/theme/global.css';

initPwa();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
