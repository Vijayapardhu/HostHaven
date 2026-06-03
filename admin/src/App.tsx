import { useEffect, useState } from "react";
import { BrowserRouter, useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AppRoutes } from "./routes";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import useAuthStore from "./stores/authStore";

function AppContent() {
  const navigate = useNavigate();
  const { initializeSession, isLoading, logout } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeSession().finally(() => setIsInitialized(true));
  }, [initializeSession]);

  useEffect(() => {
    const handleLogout = () => {
      logout();
      navigate('/login', { replace: true });
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [navigate, logout]);

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AppRoutes />
      <PWAInstallPrompt />
      <Toaster position="top-right" richColors />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
