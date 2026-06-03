import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, XCircle, AlertCircle, RefreshCw, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import logo from "@/assets/logo.png";
import { vendorService } from "@/lib/vendor";
import { getVendorToken, clearTokens } from "@/services/tokenService";

const VendorPendingVerification = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<{
    applicationStatus: string;
    isApproved: boolean;
    rejectionReason?: string;
    businessName: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const token = getVendorToken();
      if (!token) {
        setError(true);
        setLoading(false);
        return;
      }

      try {
        const data = await vendorService.getApplicationStatus();
        setStatus(data);
        setError(false);

        if (data.applicationStatus === "APPROVED") {
          navigate("/dashboard");
        }
      } catch (err) {
        console.error("Failed to check status:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [navigate]);

  const handleReapply = () => {
    navigate("/reapply");
  };

  const handleLogin = () => {
    clearTokens();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="min-h-screen flex overflow-hidden bg-[#0a0a0f]">
        <div className="relative hidden lg:flex lg:w-[40%] flex-col overflow-hidden flex-shrink-0">
          <img
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1400&auto=format&fit=crop"
            alt="Luxury hotel"
            className="absolute inset-0 h-full w-full object-cover scale-105"
            style={{ filter: "brightness(0.38)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-orange-950/70 via-black/50 to-black/80" />
          <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-orange-500/20 blur-[100px] animate-pulse" />
          
          <div className="relative z-10 flex flex-col h-full p-12">
            <img src={logo} alt="HostHaven" className="h-14 w-auto drop-shadow-xl" />
            
            <div className="flex-1 flex flex-col justify-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h1 className="text-4xl xl:text-5xl font-bold text-white leading-[1.15]">
                  Check Your<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                    Application Status
                  </span>
                </h1>
                <p className="text-white/55 text-base max-w-xs">
                  Please login to check your application status.
                </p>
              </motion.div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 lg:p-10 relative overflow-y-auto">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f17] via-[#0a0a0f] to-[#0f0a05]" />
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-orange-600/8 rounded-full blur-3xl pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 w-full max-w-[500px] space-y-7 my-6"
          >
            <div className="lg:hidden flex justify-center mb-8">
              <img src={logo} alt="HostHaven" className="h-14 w-auto" />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-amber-400" />
              </div>
              
              <h3 className="text-lg font-semibold text-white mb-2">
                Session Required
              </h3>
              <p className="text-white/40 text-sm mb-6">
                Please login to view your application status.
              </p>

              <button
                onClick={() => navigate("/login")}
                className="w-full h-12 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Login to Check Status
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const isRejected = status?.applicationStatus === "REJECTED";

  return (
    <div className="min-h-screen flex overflow-hidden bg-[#0a0a0f]">
      <div className="relative hidden lg:flex lg:w-[40%] flex-col overflow-hidden flex-shrink-0">
        <img
          src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1400&auto=format&fit=crop"
          alt="Luxury hotel"
          className="absolute inset-0 h-full w-full object-cover scale-105"
          style={{ filter: "brightness(0.38)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-orange-950/70 via-black/50 to-black/80" />
        <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-orange-500/20 blur-[100px] animate-pulse" />
        
        <div className="relative z-10 flex flex-col h-full p-12">
          <img src={logo} alt="HostHaven" className="h-14 w-auto drop-shadow-xl" />
          
          <div className="flex-1 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h1 className="text-4xl xl:text-5xl font-bold text-white leading-[1.15]">
                Application<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                  {isRejected ? "Needs Revision" : "Under Review"}
                </span>
              </h1>
              <p className="text-white/55 text-base max-w-xs">
                {isRejected
                  ? "Please review the reason for rejection and submit a new application."
                  : "We are reviewing your vendor application. This usually takes 1-2 business days."}
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-10 relative overflow-y-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f17] via-[#0a0a0f] to-[#0f0a05]" />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-orange-600/8 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-[500px] space-y-7 my-6"
        >
          <div className="lg:hidden flex justify-center mb-8">
            <img src={logo} alt="HostHaven" className="h-14 w-auto" />
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-white">
              {isRejected ? "Application Rejected" : "Application Pending"}
            </h2>
            <p className="text-white/40 text-sm">
              {status?.businessName || "Your Business"}
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
            {isRejected ? (
              <div className="space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/20 flex items-center justify-center mx-auto">
                  <XCircle className="w-8 h-8 text-red-400" />
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white text-center">
                    Reason for Rejection
                  </h3>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <p className="text-red-300 text-sm">
                      {status?.rejectionReason || "Your application did not meet our requirements."}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <button
                    onClick={handleReapply}
                    className="w-full h-12 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Apply Again
                  </button>
                  
                  <button
                    onClick={handleLogin}
                    className="w-full h-12 rounded-xl font-semibold text-sm text-white/70 border border-white/10 hover:bg-white/5 transition-all"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center mx-auto">
                  <Clock className="w-8 h-8 text-amber-400" />
                </div>

                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-white">
                    Under Review
                  </h3>
                  <p className="text-white/40 text-sm">
                    Your application is being reviewed by our team. You'll receive an email once the review is complete.
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 text-white/30 text-sm">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  Checking status automatically...
                </div>

                <button
                  onClick={handleLogin}
                  className="w-full h-12 rounded-xl font-semibold text-sm text-white/70 border border-white/10 hover:bg-white/5 transition-all"
                >
                  Back to Login
                </button>
              </div>
            )}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-white">What happens next?</h4>
                <ul className="text-xs text-white/40 space-y-1">
                  <li>• Our team reviews your business documents</li>
                  <li>• You may be contacted for additional information</li>
                  <li>• You'll receive an email when approved</li>
                </ul>
              </div>
            </div>
          </div>

          <p className="text-center text-white/20 text-xs">
            © {new Date().getFullYear()} HostHaven. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default VendorPendingVerification;
