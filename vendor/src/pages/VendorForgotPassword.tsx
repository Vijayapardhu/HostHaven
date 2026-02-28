import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { vendorService } from "@/lib/vendor";
import logo from "@/assets/logo.png";

const VendorForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await vendorService.forgotPassword(email);
            setIsSent(true);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to process request. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#0a0a0f]">
            {/* Background blobs */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f17] via-[#0a0a0f] to-[#0f0a05]" />
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-orange-600/8 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-amber-500/6 rounded-full blur-[80px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10 w-full max-w-[420px] space-y-8"
            >
                {/* Logo */}
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="flex justify-center">
                    <Link to="/vendor/login">
                        <img src={logo} alt="HostHaven" className="h-16 w-auto drop-shadow-2xl" />
                    </Link>
                </motion.div>

                {/* Header */}
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold text-white tracking-tight">Forgot password?</h2>
                    <p className="text-white/40 text-sm">
                        No worries. Enter your email and we'll send you a reset link.
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
                    <AnimatePresence mode="wait">
                        {!isSent ? (
                            <motion.form
                                key="form"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onSubmit={handleSubmit}
                                className="space-y-5"
                            >
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-white/50 uppercase tracking-widest">
                                        Business Email
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="vendor@business.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 text-sm outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/10 transition-all"
                                    />
                                </div>

                                <motion.button
                                    type="submit"
                                    disabled={isLoading}
                                    whileHover={!isLoading ? { scale: 1.01 } : {}}
                                    whileTap={!isLoading ? { scale: 0.99 } : {}}
                                    className="relative w-full h-12 rounded-xl font-semibold text-sm text-white overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 group-hover:from-orange-600 group-hover:to-amber-600 transition-all duration-300" />
                                    <span className="relative flex items-center justify-center gap-2">
                                        {isLoading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                Send Reset Link
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
                                    <h3 className="text-xl font-bold text-white">Check your inbox</h3>
                                    <p className="text-white/40 text-sm">
                                        We sent a reset link to{" "}
                                        <span className="text-orange-400 font-semibold">{email}</span>
                                    </p>
                                </div>
                                <p className="text-white/25 text-xs pt-2">
                                    Didn't receive it? Check your spam folder or{" "}
                                    <button onClick={() => setIsSent(false)} className="text-orange-400 hover:text-orange-300 underline transition-colors">
                                        try another email
                                    </button>
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Back link */}
                <div className="text-center">
                    <Link
                        to="/vendor/login"
                        className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to Sign In
                    </Link>
                </div>

                <p className="text-center text-white/20 text-xs">
                    © {new Date().getFullYear()} HostHaven. All rights reserved.
                </p>
            </motion.div>
        </div>
    );
};

export default VendorForgotPassword;
