import { useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { getFriendlyAuthError } from "@/lib/errors";
import { api } from "@/lib/api";

/**
 * Completes a login for a 2FA-enabled account.
 *
 * Reached two ways: password login returns a challenge and navigates here with
 * state, or the Google OAuth callback redirects here with ?userId=. Both flows
 * previously dead-ended — this route did not exist and fell through to the CMS
 * catch-all.
 */
const TwoFactorVerify = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { toast } = useToast();

  const state = (location.state ?? {}) as { userId?: string; from?: string };
  const userId = state.userId || searchParams.get("userId") || "";
  const from = state.from || "/";

  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedCode = code.trim();
  const isCodeValid = trimmedCode.length >= 6;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isCodeValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await api.auth.verifyTwoFactorLogin({
        userId,
        code: trimmedCode,
      });

      localStorage.setItem("accessToken", result.tokens.accessToken);
      localStorage.setItem("refreshToken", result.tokens.refreshToken);

      toast({ title: "Welcome back!" });

      // Full navigation so AuthContext re-initialises from storage; replace()
      // keeps this challenge page out of history.
      window.location.replace(from);
    } catch (error) {
      const friendly = getFriendlyAuthError(error);
      toast({
        title: friendly.title,
        description: friendly.description,
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-sm text-center space-y-4">
          <h1 className="text-xl font-semibold">Session expired</h1>
          <p className="text-sm text-muted-foreground">
            This verification link is missing its login context. Please sign in
            again.
          </p>
          <Button asChild className="w-full">
            <Link to="/login">Back to login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-6 rounded-2xl border bg-card p-8 shadow-card"
      >
        <div className="space-y-2 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" aria-hidden="true" />
          </span>
          <h1 className="text-xl font-semibold">Two-factor verification</h1>
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code from your authenticator app, or one of your
            backup codes.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="totp-code" className="text-sm font-medium">
            Verification code
          </label>
          <Input
            id="totp-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            placeholder="123456"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            maxLength={32}
            aria-describedby="totp-hint"
          />
          <p id="totp-hint" className="text-xs text-muted-foreground">
            Backup codes are accepted here too.
          </p>
        </div>

        <Button type="submit" disabled={!isCodeValid || isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Verifying…
            </>
          ) : (
            "Verify and sign in"
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline">
            Use a different account
          </Link>
        </p>
      </form>
    </div>
  );
};

export default TwoFactorVerify;
