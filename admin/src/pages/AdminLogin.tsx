import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import useAuthStore from "../stores/authStore";
import logo from "@/assets/logo.png";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [savedEmail] = useState(
    () => localStorage.getItem("admin_email_saved") || "",
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      await login({ email, password });
      if (rememberMe) {
        localStorage.setItem("admin_email_saved", email);
      } else {
        localStorage.removeItem("admin_email_saved");
      }
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (error: any) {
      const message = error.response?.data?.message || "Invalid credentials";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, [savedEmail]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 p-4 sm:p-6">
      <div className="w-full max-w-[980px] overflow-hidden rounded-3xl border border-orange-200/50 bg-white shadow-2xl md:grid md:grid-cols-[0.42fr_0.58fr]">
        {/* Left Side - Brand Panel */}
        <section className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 px-8 pb-8 pt-10 text-white md:min-h-[600px]">
          {/* Decorative Pattern */}
          <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]" />

          {/* Abstract Shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

          <div className="relative z-10 flex h-full flex-col items-center justify-between text-center">
            <p className="text-[44px] font-semibold leading-none tracking-tight">Welcome</p>

            <div className="space-y-4">
              <div className="mx-auto flex h-[92px] w-[92px] items-center justify-center rounded-2xl bg-white p-4 shadow-xl">
                <img
                  src={logo}
                  alt="HostHaven"
                  className="h-full w-full object-contain"
                />
              </div>
              <h1 className="text-[44px] font-semibold tracking-tight">HostHaven</h1>
              <p className="text-orange-100 text-sm font-medium">Admin Dashboard</p>
            </div>

            <p className="max-w-[255px] text-xs leading-relaxed text-orange-100">
              Manage your properties, bookings, and analytics all in one place.
            </p>

            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <p className="text-[10px] uppercase tracking-[0.18em] text-orange-100/80">
                System Online
              </p>
            </div>
          </div>

          {/* Decorative Side Strip */}
          <div className="absolute right-0 top-0 h-full w-2 bg-gradient-to-b from-orange-300 via-orange-400 to-amber-400" />
        </section>

        {/* Right Side - Login Form */}
        <section className="bg-white px-7 py-9 sm:px-12 md:px-16 md:py-14">
          <div className="mx-auto max-w-[380px]">
            <h2 className="text-center text-[36px] font-bold leading-none text-slate-800">
              Login
            </h2>
            <p className="mt-3 text-center text-sm text-slate-500">
              Enter your credentials to access the admin panel.
            </p>

            <form onSubmit={handleLogin} className="mt-10 space-y-7">
              {/* Email Field */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  E-mail Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Mail className="h-4 w-4 text-orange-500" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    autoComplete="email"
                    className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock className="h-4 w-4 text-orange-500" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 pl-10 pr-12 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 h-full px-3 text-slate-400 transition-colors hover:text-orange-500"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500 focus:ring-offset-2"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  className="text-sm font-medium text-orange-600 transition-colors hover:text-orange-700 hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading || !email || !password}
                  className={`flex-1 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all ${
                    loading || !email || !password
                      ? "cursor-not-allowed bg-slate-300 shadow-none"
                      : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 hover:shadow-xl hover:-translate-y-0.5"
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </button>

                <Link
                  to="/"
                  className="flex-1 rounded-xl border-2 border-slate-200 px-6 py-3 text-center text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
                >
                  Back to site
                </Link>
              </div>
            </form>

            {/* Footer Info */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <p className="text-center text-xs text-slate-400">
                &copy; {new Date().getFullYear()} HostHaven. All rights reserved.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
