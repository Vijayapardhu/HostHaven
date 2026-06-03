import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AUTH_KEY = "hosthaven_auth";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const isNewUser = searchParams.get("isNewUser") === "true";
    const error = searchParams.get("error");

    if (error) {
      toast({
        title: "Authentication failed",
        description: error,
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (accessToken && refreshToken) {
      // Store using new combined format
      const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
      const authData = {
        accessToken,
        refreshToken,
        user: null, // Will be fetched on app load
        expiresAt,
      };
      localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
      
      // Also keep old keys for backward compatibility
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      toast({
        title: isNewUser ? "Welcome!" : "Welcome back!",
        description: isNewUser
          ? "Your account has been created successfully."
          : "You have been logged in successfully.",
      });

      navigate("/");
    } else {
      toast({
        title: "Authentication failed",
        description: "Missing authentication tokens.",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
