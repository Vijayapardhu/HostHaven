import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
    interface Window {
        __pwaInstallPrompt?: BeforeInstallPromptEvent;
    }
}

export function PWAInstallPrompt() {
    const [showBanner, setShowBanner] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        if (window.matchMedia("(display-mode: standalone)").matches) {
            setIsInstalled(true);
            return;
        }
        if (localStorage.getItem("pwa-frontend-dismissed") === "true") return;

        const ios =
            /iphone|ipad|ipod/i.test(navigator.userAgent) &&
            !(window as any).MSStream &&
            !("chrome" in window);

        if (ios && !(navigator as any).standalone) {
            setIsIOS(true);
            setTimeout(() => setShowBanner(true), 3000);
            return;
        }

        const show = () => setTimeout(() => setShowBanner(true), 1500);

        if (window.__pwaInstallPrompt) {
            show();
        } else {
            window.addEventListener("pwa-install-ready", show, { once: true });
            return () => window.removeEventListener("pwa-install-ready", show);
        }
    }, []);

    const handleInstall = async () => {
        const prompt = window.__pwaInstallPrompt;
        if (!prompt) return;
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === "accepted") {
            setShowBanner(false);
            window.__pwaInstallPrompt = undefined;
        }
    };

    const handleDismiss = () => {
        setShowBanner(false);
        localStorage.setItem("pwa-frontend-dismissed", "true");
    };

    if (isInstalled) return null;

    return (
        <AnimatePresence>
            {showBanner && (
                <motion.div
                    initial={{ y: 120, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 120, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 22 }}
                    className="fixed bottom-4 left-4 right-4 z-[9999] sm:left-auto sm:right-4 sm:w-[360px]"
                >
                    {/* Light card for the consumer-facing frontend */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xl flex items-start gap-3">
                        <img
                            src={logo}
                            alt="HostHaven"
                            className="w-12 h-12 rounded-xl flex-shrink-0 shadow object-contain"
                        />

                        <div className="flex-1 min-w-0">
                            <p className="text-gray-900 font-semibold text-sm leading-tight">
                                {isIOS ? "Add HostHaven to Home Screen" : "Install HostHaven"}
                            </p>
                            {isIOS ? (
                                <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                                    Tap <span className="text-orange-500 font-medium">Share ↑</span> then{" "}
                                    <span className="text-orange-500 font-medium">"Add to Home Screen"</span>
                                </p>
                            ) : (
                                <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                                    Book hotels faster — works offline &amp; opens like an app
                                </p>
                            )}

                            {!isIOS && (
                                <button
                                    onClick={handleInstall}
                                    className="mt-2.5 inline-flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95"
                                >
                                    <Download className="w-3 h-3" />
                                    Install Now
                                </button>
                            )}
                        </div>

                        <button
                            onClick={handleDismiss}
                            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 p-0.5 -mt-0.5"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
