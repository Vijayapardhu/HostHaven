import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

declare global {
  interface Window {
    google: any;
  }
}

interface GoogleLoginButtonProps {
  mode?: "login" | "link";
  onError?: (error: string) => void;
}

const GoogleLoginButton = ({ mode = "login", onError }: GoogleLoginButtonProps) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const { loginWithGoogle, linkGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const initGoogleSignIn = () => {
      if (!window.google || !buttonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: false,
      });

      // Render the actual Google button but keep it hidden
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        width: 300,
        text: mode === "login" ? "continue_with" : "link_with",
        shape: "rectangular",
      });
    };

    if (!window.google) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogleSignIn;
      document.head.appendChild(script);

      return () => {
        script.remove();
      };
    } else {
      initGoogleSignIn();
    }
  }, [mode]);

  const handleGoogleResponse = async (response: any) => {
    try {
      if (mode === "link") {
        await linkGoogle(response.credential);
        toast({
          title: "Success",
          description: "Google account linked successfully",
        });
      } else {
        const result = await loginWithGoogle(response.credential);
        toast({
          title: result.isNewUser ? "Welcome!" : "Welcome back!",
          description: result.isNewUser
            ? "Your account has been created"
            : "You have successfully logged in",
        });
        navigate("/");
      }
    } catch (error: any) {
      const errorMessage = error.message || "Google login failed";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      onError?.(errorMessage);
    }
  };

  return (
    <div className="w-full">
      {/* Custom Google Button */}
      <motion.button
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          // Trigger the hidden Google button
          if (buttonRef.current) {
            const googleBtn = buttonRef.current.querySelector('div[role="button"]') as HTMLElement;
            googleBtn?.click();
          }
        }}
        className="w-full h-14 bg-gradient-to-r from-white to-cream-light border-2 border-border hover:border-primary/30 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 group relative overflow-hidden"
      >
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-gold/5 to-heritage-brown/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Google Icon with glow effect */}
        <div className="relative z-10">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          <svg className="w-6 h-6 relative z-10" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        </div>
        
        {/* Text with gradient on hover */}
        <span className="text-base font-semibold text-foreground relative z-10 flex items-center gap-2">
          Continue with
          <span className="bg-gradient-to-r from-primary via-gold to-heritage-brown bg-clip-text text-transparent font-bold">
            Google
          </span>
        </span>

        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </motion.button>

      {/* Hidden Google Button */}
      <div ref={buttonRef} className="absolute opacity-0 pointer-events-none -z-10 overflow-hidden w-0 h-0">
        {}
      </div>
    </div>
  );
};

export default GoogleLoginButton;
