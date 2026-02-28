import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, Building2, ShieldCheck, TrendingUp, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";
import { useToast } from "@/hooks/use-toast";
import { useVendor } from "@/contexts/VendorContext";

const features = [
  { icon: Building2, text: "Manage hotel & home listings" },
  { icon: TrendingUp, text: "Track bookings in real-time" },
  { icon: Star, text: "View earnings & analytics" },
  { icon: ShieldCheck, text: "Secure partner portal" },
];

const VendorLogin = () => {
  const navigate = useNavigate();
  const { login } = useVendor();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast({ title: "Welcome back!", description: "Successfully logged in to vendor dashboard" });
      navigate("/vendor/dashboard");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden bg-[#0a0a0f]">

      {/* ─── LEFT PANEL ─── */}
      <div className="relative hidden lg:flex lg:w-[52%] flex-col overflow-hidden">
        {/* Background image */}
        <img
          src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1400&auto=format&fit=crop"
          alt="Luxury hotel"
          className="absolute inset-0 h-full w-full object-cover scale-105"
          style={{ filter: "brightness(0.45)" }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-950/70 via-black/50 to-black/80" />

        {/* Animated blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-500/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-amber-500/15 blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />

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
              <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-400/30 text-orange-300 px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                Vendor Partner Portal
              </div>
              <h1 className="text-5xl xl:text-6xl font-bold text-white leading-[1.1] tracking-tight">
                Your Hotel.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                  Your Dashboard.
                </span>
              </h1>
              <p className="text-lg text-white/60 max-w-sm leading-relaxed">
                Manage properties, track bookings, and grow your hospitality business with powerful tools.
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
                    <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-400/20 flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                      <Icon className="w-4 h-4 text-orange-400" />
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
            {[["500+", "Partners"], ["50K+", "Bookings"], ["4.9★", "Rating"]].map(([value, label]) => (
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
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f17] via-[#0a0a0f] to-[#0f0a05]" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-orange-600/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-amber-500/6 rounded-full blur-3xl pointer-events-none" />

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
            <h2 className="text-3xl font-bold text-white tracking-tight">Sign in</h2>
            <p className="text-white/40 text-sm">Access your vendor dashboard to manage your properties.</p>
          </div>

          {/* Form card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl space-y-5 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/50 uppercase tracking-widest">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="vendor@business.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 text-sm outline-none focus:border-orange-500/60 focus:bg-white/8 focus:ring-2 focus:ring-orange-500/10 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-widest">Password</label>
                  <Link to="/vendor/forgot-password" className="text-xs text-orange-400 hover:text-orange-300 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full h-12 px-4 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 text-sm outline-none focus:border-orange-500/60 focus:bg-white/8 focus:ring-2 focus:ring-orange-500/10 transition-all"
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

              {/* Submit button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={!isLoading ? { scale: 1.01 } : {}}
                whileTap={!isLoading ? { scale: 0.99 } : {}}
                className="relative w-full h-12 rounded-xl font-semibold text-sm text-white overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed mt-2 group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 group-hover:from-orange-600 group-hover:to-amber-600 transition-all duration-300" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-orange-400/30 to-amber-400/0 blur-xl" />
                <span className="relative flex items-center justify-center gap-2">
                  {isLoading ? (
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

          {/* Register link */}
          <div className="text-center space-y-3">
            <p className="text-white/30 text-sm">New to HostHaven?</p>
            <Link
              to="/vendor/signup"
              className="inline-flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 font-medium border border-orange-500/20 hover:border-orange-500/40 px-6 py-2.5 rounded-xl bg-orange-500/5 hover:bg-orange-500/10 transition-all"
            >
              <Building2 className="w-4 h-4" />
              Register as a Vendor Partner
            </Link>
          </div>

          <p className="text-center text-white/20 text-xs">
            © {new Date().getFullYear()} HostHaven. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default VendorLogin;
