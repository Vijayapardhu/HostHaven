import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// ── Capture PWA install prompt BEFORE React mounts ──────────────────────────
// beforeinstallprompt fires very early — before any React useEffect.
// We store it on window so our PWAInstallPrompt component can read it.
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as any).__pwaInstallPrompt = e;
  window.dispatchEvent(new CustomEvent('pwa-install-ready'));
});

createRoot(document.getElementById("root")!).render(<App />);
