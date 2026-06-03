import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, BarChart3, Users, ShieldCheck, Settings } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import useAuthStore from "../stores/authStore";
import logo from "@/assets/logo.png";

const features = [
  { icon: BarChart3, text: "Full analytics & reporting" },
  { icon: Users, text: "Manage vendors & customers" },
  { icon: ShieldCheck, text: "Role-based access control" },
  { icon: Settings, text: "System configuration" },
];

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [savedEmail] = useState(() => localStorage.getItem("admin_email_saved") || "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, [savedEmail]);

  const extractErrorMessage = (err: unknown): string => {
    if (!err) return "An unexpected error occurred";
    
    if (typeof err === 'string') return err;
    
    const error = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
    
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.message) {
      return error.message;
    }
    return "Invalid credentials";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address");
      toast.error("Please enter your email address");
      return;
    }

    if (!password) {
      setError("Please enter your password");
      toast.error("Please enter your password");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const result = await login({ email, password });
      
      if (result.requiresMfa) {
        toast.info("MFA verification required");
        return;
      }

      if (rememberMe) {
        localStorage.setItem("admin_email_saved", email);
      } else {
        localStorage.removeItem("admin_email_saved");
      }

      toast.success("Welcome back!");
    } catch (err: unknown) {
      const message = extractErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden bg-[#0a0a0f]">

      {/* ─── LEFT PANEL ─── */}
      <div className="relative hidden lg:flex lg:w-[52%] flex-col overflow-hidden">
        {/* Background image */}
        <img
          src="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1400&auto=format&fit=crop"
          alt="Luxury hotel"
          className="absolute inset-0 h-full w-full object-cover scale-105"
          style={{ filter: "brightness(0.40)" }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/70 via-black/50 to-black/80" />

        {/* Animated blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-500/15 blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-14">
          {/* Logo */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <img src={logo} alt="HostHaven" className="h-16 w-auto drop-shadow-2xl" />
          </motion.div>

          {/* Main copy */}
          <div className="flex-1 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                Admin Control Center
              </div>
              <h1 className="text-5xl xl:text-6xl font-bold text-white leading-[1.1] tracking-tight">
                HostHaven.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
                  Admin Panel.
                </span>
              </h1>
              <p className="text-lg text-white/60 max-w-sm leading-relaxed">
                Full control over bookings, vendors, properties, and platform analytics — all in one secure place.
              </p>

              {/* Feature bullets */}
              <div className="grid grid-cols-1 gap-3 pt-4">
                {features.map(({ icon: Icon, text }, i) => (
                  <motion.div
                    key={text}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="flex items-center gap-3 group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                      <Icon className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-white/70 text-sm font-medium">{text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Bottom stat row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="flex items-center gap-8 pt-8 border-t border-white/10"
          >
            {[["100%", "Uptime"], ["24/7", "Support"], ["Secure", "Platform"]].map(([value, label]) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-white/50 mt-0.5">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ─── RIGHT PANEL (form) ─── */}
      <div className="flex-1 flex items-center justify-center p-6 relative overflow-y-auto">
        {/* Subtle background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f17] via-[#0a0a0f] to-[#050a0f]" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-600/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-indigo-500/6 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 w-full max-w-[420px] space-y-8"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center">
            <img src={logo} alt="HostHaven" className="h-16 w-auto" />
          </div>

          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-white tracking-tight">Admin Sign in</h2>
            <p className="text-white/40 text-sm">Enter your credentials to access the control panel.</p>
          </div>

          {/* System status badge */}
          <div className="inline-flex items-center gap-2 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            System Online — All services operational
          </div>

          {/* Form card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl space-y-5 shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/50 uppercase tracking-widest">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="admin@hosthaven.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    autoComplete="email"
                    required
                    className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 text-sm outline-none focus:border-blue-500/60 focus:bg-white/8 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-widest">Password</label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    autoComplete="current-password"
                    required
                    className="w-full h-12 px-4 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 text-sm outline-none focus:border-blue-500/60 focus:bg-white/8 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                  >
                    <AnimatePresence mode="wait">
                      <motion.div key={showPassword ? "off" : "on"} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.15 }}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </motion.div>
                    </AnimatePresence>
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/30 focus:ring-1"
                />
                <span className="text-sm text-white/40 group-hover:text-white/60 transition-colors">Remember me</span>
              </label>

              {/* Submit button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={!loading ? { scale: 1.01 } : {}}
                whileTap={!loading ? { scale: 0.99 } : {}}
                className="relative w-full h-12 rounded-xl font-semibold text-sm text-white overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 group-hover:from-blue-500 group-hover:to-indigo-500 transition-all duration-300" />
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </span>
              </motion.button>
            </form>
          </div>

          {/* Back link */}
          <div className="text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors"
            >
              ← Back to site
            </Link>
          </div>

          <p className="text-center text-white/20 text-xs">
            © {new Date().getFullYear()} HostHaven. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
