import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { AppRoutes } from "./routes";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <PWAInstallPrompt />
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  );
}

export default App;
