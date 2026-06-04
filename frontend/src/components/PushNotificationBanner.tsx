import { useState, useEffect } from "react";
import { Bell, X, CheckCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

export function PushNotificationBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    setIsSupported("Notification" in window);
  }, []);

  useEffect(() => {
    if (Notification.permission === "granted") {
      setIsEnabled(true);
      return;
    }

    const dismissed = localStorage.getItem("push-notification-dismissed");
    const shownThisSession = sessionStorage.getItem("push-notification-shown");

    const timers: ReturnType<typeof setTimeout>[] = [];

    if (dismissed === "true") {
      if (isAuthenticated && !sessionStorage.getItem("push-notification-login-shown")) {
        timers.push(setTimeout(() => {
          setShowBanner(true);
          sessionStorage.setItem("push-notification-login-shown", "true");
        }, 3000));
      }
    } else if (!shownThisSession) {
      timers.push(setTimeout(() => {
        setShowBanner(true);
        sessionStorage.setItem("push-notification-shown", "true");
      }, 4000));
    }

    return () => timers.forEach(clearTimeout);
  }, [isAuthenticated]);

  const handleEnable = async () => {
    setIsLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U"
          ),
        });
        await api.push.subscribe(sub.toJSON());
        setIsEnabled(true);
        setShowBanner(false);
        localStorage.setItem("push-notification-dismissed", "true");
      }
    } catch (error) {
      console.error("Failed to enable notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("push-notification-dismissed", "true");
  };

  if (!isSupported || isEnabled) return null;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 120, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 120, opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="fixed bottom-4 left-4 right-4 z-[9999] sm:left-auto sm:right-4 sm:w-[380px]"
        >
          <div className="relative overflow-hidden rounded-3xl shadow-2xl border border-white/20">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
            
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-pink-400/30 rounded-full blur-2xl" />

            <div className="relative p-5">
              <div className="flex items-start gap-4">
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/30">
                    <Bell className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full flex items-center justify-center border-2 border-white">
                    <span className="text-[10px] text-white font-bold">!</span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-lg leading-tight">
                    Enable Notifications
                  </h3>
                  <p className="text-white/80 text-sm mt-1 leading-relaxed">
                    Get instant alerts for bookings, offers & exclusive deals
                  </p>
                </div>

                <button
                  onClick={handleDismiss}
                  className="text-white/60 hover:text-white transition-colors flex-shrink-0 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {["Booking confirmations", "Special offers & discounts", "Price drop alerts"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-white/90 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-yellow-300 to-orange-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={handleDismiss}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-sm font-medium border border-white/20 transition-all"
                >
                  Not now
                </button>
                <button
                  onClick={handleEnable}
                  disabled={isLoading}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-white text-purple-700 text-sm font-bold shadow-lg hover:bg-white/95 hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Enable
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
