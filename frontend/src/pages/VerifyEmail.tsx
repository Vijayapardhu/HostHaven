import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Mail, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logo from "@/assets/logo.png";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const { toast } = useToast();

  const handleVerify = async () => {
    if (!token) {
      toast({
        title: "Invalid link",
        description: "No verification token found.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await api.auth.verifyEmail(token);
      setIsVerified(true);
      toast({
        title: "Email verified!",
        description: "You can now log in to your account.",
      });
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Please try again or request a new link.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center space-y-6">
          <Link to="/">
            <img src={logo} alt="HostHaven" className="h-16 w-auto mx-auto" />
          </Link>
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h1 className="text-2xl font-serif font-bold text-foreground">
            Email Verified!
          </h1>
          <p className="text-muted-foreground">
            Your email has been verified successfully. You can now log in to your account.
          </p>
          <Link to="/login">
            <Button variant="hero" className="w-full" size="lg">
              Go to Login
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center space-y-6">
        <Link to="/">
          <img src={logo} alt="HostHaven" className="h-16 w-auto mx-auto" />
        </Link>
        <div>
          <Mail className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-bold text-foreground">
            Verify Your Email
          </h1>
          <p className="text-muted-foreground mt-2">
            Click the button below to verify your email address.
          </p>
        </div>

        <Button
          variant="hero"
          className="w-full"
          size="lg"
          onClick={handleVerify}
          disabled={isLoading || !token}
        >
          {isLoading ? "Verifying..." : "Verify Email"}
        </Button>

        {!token && (
          <p className="text-sm text-destructive">
            Invalid verification link. Please check your email for the correct link.
          </p>
        )}

        <Link
          to="/login"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Login
        </Link>
      </div>
    </div>
  );
};

export default VerifyEmail;
