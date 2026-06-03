import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { handleError } from './lib/errorHandler';
import './lib/strictConsole';

// Suppress Chrome extension messaging errors
window.addEventListener('message', (event) => {
  if (event.source === window && event.data?.type?.startsWith('__chrome_extension')) {
    event.stopPropagation();
  }
});

// Register service worker for push notifications
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/push-sw.js", {
        scope: "/",
      });
    } catch (error) {
      console.warn('Service worker registration failed:', error);
    }
  });
}

// ── Capture PWA install prompt BEFORE React mounts ──────────────────────────
// beforeinstallprompt fires very early — before any React useEffect.
// We store it on window so our PWAInstallPrompt component can read it.
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as any).__pwaInstallPrompt = e;
  window.dispatchEvent(new CustomEvent('pwa-install-ready'));
});

createRoot(document.getElementById("root")!).render(<App />);
