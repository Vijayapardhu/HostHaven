import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './lib/strictConsole'

// ── Capture PWA install prompt BEFORE React mounts ──────────────────────────
// The beforeinstallprompt event fires very early. If we only listen inside
// a React component (useEffect), we'll always miss it. So we store it on
// window here and read it from the component later.
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as any).__pwaInstallPrompt = e;
  // Dispatch a custom event so any already-mounted component can react
  window.dispatchEvent(new CustomEvent('pwa-install-ready'));
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
