import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
    interface Window {
        __pwaInstallPrompt?: BeforeInstallPromptEvent;
    }
}

export function usePWAInstall() {
    const [canInstall, setCanInstall] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Already running as a standalone PWA
        if (window.matchMedia("(display-mode: standalone)").matches) {
            setIsInstalled(true);
            return;
        }

        const checkPrompt = () => {
            if (window.__pwaInstallPrompt) setCanInstall(true);
        };

        checkPrompt(); // might already be captured in main.tsx

        window.addEventListener("pwa-install-ready", checkPrompt);
        return () => window.removeEventListener("pwa-install-ready", checkPrompt);
    }, []);

    const install = useCallback(async () => {
        const prompt = window.__pwaInstallPrompt;
        if (!prompt) return false;
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === "accepted") {
            setCanInstall(false);
            setIsInstalled(true);
            window.__pwaInstallPrompt = undefined;
        }
        return outcome === "accepted";
    }, []);

    return { canInstall, isInstalled, install };
}
