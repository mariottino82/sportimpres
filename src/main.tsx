import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import App from './App.tsx';
import './index.css';

// Auto-recovery su rilascio nuova versione: se un chunk dinamico non viene trovato dal browser, ricarica automaticamente la pagina
window.addEventListener('vite:preloadError', (event) => {
  console.warn('[APP VERSION UPDATE] Nuovo bundle rilevato dal browser, ricaricamento pagina...', event);
  event.preventDefault();
  window.location.reload();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
