import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { vendorService } from "@/lib/vendor";
import logo from "@/assets/logo.png";

const VendorResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") || "";

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const { toast } = useToast();

    const passwordsMatch = confirmPassword === "" || password === confirmPassword;
    const isStrong = password.length >= 8;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
            return;
        }
        setIsLoading(true);
        try {
            await vendorService.resetPassword(token, password);
            setIsSuccess(true);
            setTimeout(() => navigate("/login"), 3000);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to reset password.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#0a0a0f]">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f17] via-[#0a0a0f] to-[#0f0a05]" />
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-orange-600/8 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10 w-full max-w-[420px] space-y-8"
            >
                {/* Logo */}
                <div className="flex justify-center">
                    <Link to="/login">
                        <img src={logo} alt="HostHaven" className="h-16 w-auto drop-shadow-2xl" />
                    </Link>
                </div>

                {/* Invalid token state */}
                {!token ? (
                    <div className="bg-white/5 border border-red-500/20 rounded-2xl p-8 backdrop-blur-xl shadow-2xl text-center space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/20 flex items-center justify-center mx-auto">
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-white">Invalid Link</h3>
                            <p className="text-white/40 text-sm">This password reset link is invalid or has expired.</p>
                        </div>
                        <Link
                            to="/forgot-password"
                            className="inline-flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 font-medium border border-orange-500/20 hover:border-orange-500/40 px-5 py-2.5 rounded-xl bg-orange-500/5 hover:bg-orange-500/10 transition-all"
                        >
                            Request a new link
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-bold text-white tracking-tight">Set new password</h2>
                            <p className="text-white/40 text-sm">Choose a strong password for your account.</p>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
                            <AnimatePresence mode="wait">
                                {!isSuccess ? (
                                    <motion.form
                                        key="form"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onSubmit={handleSubmit}
                                        className="space-y-5"
                                    >
                                        {/* New Password */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-white/50 uppercase tracking-widest">New Password</label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="At least 8 characters"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    required
                                                    minLength={8}
                                                    className="w-full h-12 px-4 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 text-sm outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/10 transition-all"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                                                >
                                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            {/* Strength bar */}
                                            {password.length > 0 && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-1 pt-1">
                                                    <div className="flex gap-1">
                                                        {[...Array(4)].map((_, i) => (
                                                            <div
                                                                key={i}
                                                                className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < (password.length < 8 ? 1 : password.length < 12 ? 2 : password.length < 16 ? 3 : 4)
                                                                        ? password.length < 8 ? "bg-red-500" : password.length < 12 ? "bg-amber-500" : "bg-green-500"
                                                                        : "bg-white/10"
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <p className={`text-xs ${isStrong ? "text-green-400" : "text-amber-400"}`}>
                                                        {!isStrong ? "Too short — minimum 8 characters" : "Good password"}
                                                    </p>
                                                </motion.div>
                                            )}
                                        </div>

                                        {/* Confirm Password */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-white/50 uppercase tracking-widest">Confirm Password</label>
                                            <div className="relative">
                                                <input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    placeholder="Repeat your password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    required
                                                    className={`w-full h-12 px-4 pr-12 bg-white/5 border rounded-xl text-white placeholder:text-white/20 text-sm outline-none focus:ring-2 transition-all ${!passwordsMatch
                                                            ? "border-red-500/60 focus:ring-red-500/10"
                                                            : "border-white/10 focus:border-orange-500/60 focus:ring-orange-500/10"
                                                        }`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                                                >
                                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            {!passwordsMatch && (
                                                <p className="text-xs text-red-400">Passwords do not match</p>
                                            )}
                                        </div>

                                        <motion.button
                                            type="submit"
                                            disabled={isLoading || !passwordsMatch || !isStrong}
                                            whileHover={!isLoading ? { scale: 1.01 } : {}}
                                            whileTap={!isLoading ? { scale: 0.99 } : {}}
                                            className="relative w-full h-12 rounded-xl font-semibold text-sm text-white overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed group mt-2"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 group-hover:from-orange-600 group-hover:to-amber-600 transition-all duration-300" />
                                            <span className="relative flex items-center justify-center gap-2">
                                                {isLoading ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        Resetting...
                                                    </>
                                                ) : (
                                                    <>
                                                        Reset Password
                                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                                    </>
                                                )}
                                            </span>
                                        </motion.button>
                                    </motion.form>
                                ) : (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center space-y-4 py-4"
                                    >
                                        <div className="w-16 h-16 rounded-2xl bg-green-500/15 border border-green-500/20 flex items-center justify-center mx-auto">
                                            <CheckCircle className="w-8 h-8 text-green-400" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-xl font-bold text-white">Password reset!</h3>
                                            <p className="text-white/40 text-sm">
                                                Your password has been updated. Redirecting you to login...
                                            </p>
                                        </div>
                                        <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </>
                )}

                <div className="text-center">
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-1.5 text-sm text-white/30 hover:text-white/60 transition-colors"
                    >
                        <Lock className="w-3.5 h-3.5" />
                        Back to Sign In
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default VendorResetPassword;
