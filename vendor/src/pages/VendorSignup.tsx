import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, Building2, User, Phone, Mail, Lock, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { vendorService } from "@/lib/vendor";
import { setTokens } from "@/services/tokenService";

interface VendorSignupProps {
  reapply?: boolean;
}

const VendorSignup: React.FC<VendorSignupProps> = ({ reapply: isReapply = false }) => {
    const navigate = useNavigate();
    const [_searchParams] = useSearchParams();
    const { toast } = useToast();
    
const [_step, _setStep] = useState(isReapply ? 2 : 1);
    const [_registrationFee, setRegistrationFee] = useState<{ amount: number; currency: string }>({ amount: 0, currency: 'INR' });
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        businessName: "",
        businessAddress: "",
        gstNumber: "",
        panNumber: "",
        aadhaarNumber: "",
        bankName: "",
        accountNumber: "",
        ifscCode: "",
        accountHolderName: "",
    });
const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        const fetchFee = async () => {
            try {
                const fee = await vendorService.getRegistrationFee();
                setRegistrationFee(fee);
            } catch (error) {
                console.error("Failed to fetch registration fee:", error);
            }
        };
        fetchFee();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
        setFormData((prev) => ({ ...prev, phone: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const payload = {
                email: formData.email,
                password: formData.password,
                name: formData.name,
                phone: formData.phone || undefined,
                businessName: formData.businessName,
            };

            const response = await api.post(isReapply ? "/v1/vendor/reapply" : "/v1/vendor/apply", payload);
            
            const responseData = response.data?.data ?? response.data;
            
            if (responseData?.accessToken && responseData?.vendor) {
                setTokens({ 
                    accessToken: responseData.accessToken, 
                    refreshToken: responseData.refreshToken 
                });
                setIsSuccess(true);
                setTimeout(() => {
                    window.location.href = "/pending-verification";
                }, 1500);
            } else {
                setIsSuccess(true);
                setTimeout(() => navigate("/login"), 1500);
            }
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.message || "Failed to submit application";
            
            let title = isReapply ? "Resubmission failed" : "Registration failed";
            let description = message;
            
            if (status === 409) {
                title = "Account already exists";
                description = "An account with this email already exists. Please login or use a different email.";
            } else if (status === 400) {
                title = "Invalid input";
                if (message.includes("email")) {
                    description = "Please enter a valid email address.";
                } else if (message.includes("password")) {
                    description = "Password must be at least 8 characters.";
                } else {
                    description = "Please fill in all required fields correctly.";
                }
            } else if (status === 500) {
                if (message.includes("phone")) {
                    title = "Phone number already registered";
                    description = "This phone number is already registered. Please use a different phone number.";
                } else {
                    description = "Server error. Please try again later.";
                }
            }
            
            toast({
                title,
                description,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const validatePassword = (password: string): string[] => {
      const errors: string[] = [];
      if (password.length < 8) errors.push("At least 8 characters");
      if (!/[A-Z]/.test(password)) errors.push("One uppercase letter");
      if (!/[a-z]/.test(password)) errors.push("One lowercase letter");
      if (!/[0-9]/.test(password)) errors.push("One number");
      if (!/[!@#$%^&*]/.test(password)) errors.push("One special character (!@#$%^&*)");
      return errors;
    };

    const passwordErrors = validatePassword(formData.password);
    const isStrong = passwordErrors.length === 0;
    const passwordsMatch = confirmPassword === "" || formData.password === confirmPassword;
    const canSubmit = isStrong && formData.password === confirmPassword && confirmPassword.length > 0;

    return (
        <div className="min-h-screen flex overflow-hidden bg-[#0a0a0f]">

            {/* ─── LEFT INFO PANEL ─── */}
            <div className="relative hidden lg:flex lg:w-[40%] flex-col overflow-hidden flex-shrink-0">
                <img
                    src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1400&auto=format&fit=crop"
                    alt="Luxury hotel"
                    className="absolute inset-0 h-full w-full object-cover scale-105"
                    style={{ filter: "brightness(0.38)" }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-orange-950/70 via-black/50 to-black/80" />
                <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-orange-500/20 blur-[100px] animate-pulse" />
                <div className="absolute bottom-[-5%] right-[-5%] w-[300px] h-[300px] rounded-full bg-amber-500/10 blur-[80px] animate-pulse" style={{ animationDelay: "1.5s" }} />

                <div className="relative z-10 flex flex-col h-full p-12">
                    {/* Logo */}
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                        <img src={logo} alt="HostHaven" className="h-14 w-auto drop-shadow-xl" />
                    </motion.div>

                    <div className="flex-1 flex flex-col justify-center space-y-7">
                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-400/30 text-orange-300 px-4 py-1.5 rounded-full text-sm font-medium mb-5">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                                Partner Program
                            </div>
                            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-[1.15] tracking-tight">
                                Join our network<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                                    of top partners.
                                </span>
                            </h1>
                            <p className="text-white/55 mt-4 text-base max-w-xs leading-relaxed">
                                List your property on HostHaven and reach thousands of guests every day.
                            </p>
                        </motion.div>

                        <div className="space-y-3.5">
                            {[
                                "Zero setup fees",
                                "Real-time booking management",
                                "Instant payout tracking",
                                "Dedicated vendor support",
                            ].map((item, i) => (
                                <motion.div
                                    key={item}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + i * 0.1 }}
                                    className="flex items-center gap-3"
                                >
                                    <div className="w-5 h-5 rounded-full bg-orange-500/20 border border-orange-400/30 flex items-center justify-center flex-shrink-0">
                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                                    </div>
                                    <span className="text-white/65 text-sm">{item}</span>
                                </motion.div>
                            ))}
                        </div>

                        {/* Stats */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.9 }}
                            className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10"
                        >
                            {[["500+", "Partners"], ["50K+", "Bookings"], ["4.9★", "Rating"]].map(([value, label]) => (
                                <div key={label} className="text-center">
                                    <p className="text-xl font-bold text-white">{value}</p>
                                    <p className="text-xs text-white/40 mt-0.5">{label}</p>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* ─── RIGHT FORM PANEL ─── */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-10 relative overflow-y-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f17] via-[#0a0a0f] to-[#0f0a05]" />
                <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-orange-600/8 rounded-full blur-3xl pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative z-10 w-full max-w-[700px] space-y-7 my-6"
                >
                    {/* Mobile logo */}
                    <div className="lg:hidden flex justify-center">
                        <img src={logo} alt="HostHaven" className="h-14 w-auto" />
                    </div>

                    {/* Header */}
                    <div className="space-y-1">
                        <h2 className="text-3xl font-bold text-white tracking-tight">{isReapply ? "Apply Again" : "Create account"}</h2>
                        <p className="text-white/40 text-sm">{isReapply ? "Update your details and resubmit your application" : "Start listing your property on HostHaven today."}</p>
                    </div>

                    {/* Form Card */}
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
                                    {/* ── ROW 1: Full Name + Phone ── */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                                                <User className="w-3 h-3" /> Full Name
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                placeholder="John Doe"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 text-sm outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/10 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                                                <Phone className="w-3 h-3" /> Phone <span className="text-white/25 normal-case font-normal">(optional)</span>
                                            </label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                placeholder="9876543210"
                                                value={formData.phone}
                                                onChange={handlePhoneChange}
                                                maxLength={10}
                                                inputMode="numeric"
                                                className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 text-sm outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/10 transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* ── ROW 2: Email + Business Name ── */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                                                <Mail className="w-3 h-3" /> Business Email
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                placeholder="vendor@business.com"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 text-sm outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/10 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                                                <Building2 className="w-3 h-3" /> Hotel / Business Name
                                            </label>
                                            <input
                                                type="text"
                                                name="businessName"
                                                placeholder="Grand Plaza Hotel"
                                                value={formData.businessName}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 text-sm outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/10 transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* ── ROW 3: Password + Confirm Password ── */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Password */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                                                <Lock className="w-3 h-3" /> Password
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    name="password"
                                                    placeholder="Min 8 characters"
                                                    value={formData.password}
                                                    onChange={handleInputChange}
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
                                            {formData.password.length > 0 && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-1 pt-0.5">
                                                    <div className="flex gap-1">
                                                        {[...Array(4)].map((_, i) => {
                                                            const level = formData.password.length < 8 ? 1 : formData.password.length < 12 ? 2 : formData.password.length < 16 ? 3 : 4;
                                                            const color = level === 1 ? "bg-red-500" : level === 2 ? "bg-amber-500" : "bg-green-500";
                                                            return <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < level ? color : "bg-white/10"}`} />;
                                                        })}
                                                    </div>
                                                    <p className={`text-xs ${isStrong ? "text-green-400" : "text-amber-400"}`}>
                                                        {isStrong ? "Good strength" : "Too short"}
                                                    </p>
                                                </motion.div>
                                            )}
                                        </div>

                                        {/* Confirm Password */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                                                <Lock className="w-3 h-3" /> Confirm Password
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    placeholder="Repeat password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    required
                                                    className={`w-full h-12 px-4 pr-12 bg-white/5 border rounded-xl text-white placeholder:text-white/20 text-sm outline-none focus:ring-2 transition-all ${!passwordsMatch
                                                            ? "border-red-500/60 focus:ring-red-500/10"
                                                            : confirmPassword.length > 0
                                                                ? "border-green-500/40 focus:ring-green-500/10"
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
                                            {confirmPassword.length > 0 && (
                                                <motion.p
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className={`text-xs ${passwordsMatch ? "text-green-400" : "text-red-400"}`}
                                                >
                                                    {passwordsMatch ? "Passwords match ✓" : "Passwords do not match"}
                                                </motion.p>
                                            )}
                                        </div>
                                    </div>

                                    {/* ── Submit Button ── */}
                                    <motion.button
                                        type="submit"
                                        disabled={isLoading || !canSubmit}
                                        whileHover={!isLoading ? { scale: 1.005 } : {}}
                                        whileTap={!isLoading ? { scale: 0.995 } : {}}
                                        className="relative w-full h-12 rounded-xl font-semibold text-sm text-white overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed group mt-2"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 group-hover:from-orange-600 group-hover:to-amber-600 transition-all duration-300" />
                                        <span className="relative flex items-center justify-center gap-2">
                                            {isLoading ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Submitting...
                                                </>
                                            ) : (
                                                <>
                                                    {isReapply ? "Resubmit Application" : "Submit Application"}
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
                                    className="text-center space-y-4 py-6"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-green-500/15 border border-green-500/20 flex items-center justify-center mx-auto">
                                        <CheckCircle className="w-8 h-8 text-green-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-white">{isReapply ? "Application Resubmitted!" : "Application Submitted!"}</h3>
                                        <p className="text-white/40 text-sm">Redirecting to status page...</p>
                                    </div>
                                    <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Sign in link */}
                    <div className="text-center space-y-1">
                        <p className="text-white/30 text-sm">Already a partner?</p>
                        <Link
                            to="/login"
                            className="text-sm text-orange-400 hover:text-orange-300 font-medium transition-colors"
                        >
                            Sign in to your account →
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

export default VendorSignup;
