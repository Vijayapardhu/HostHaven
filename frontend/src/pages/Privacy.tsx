import { Link } from "react-router-dom";
import { ArrowLeft, Shield, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import SEOHead from "@/components/SEOHead";
import { usePublicPlatformSettings } from "@/hooks/usePublicPlatformSettings";

const Privacy = () => {
  const settings = usePublicPlatformSettings();

  return (
    <>
    <SEOHead title="Privacy Policy" description="HostHaven's privacy policy — how we collect, use, and protect your personal information when booking hotels and travel services in Andhra Pradesh." />
    <div className="min-h-screen bg-gradient-to-br from-cream via-background to-cream-light">
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gold/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <Link to="/">
              <img src={logo} alt="HostHaven" className="h-12 w-auto" />
            </Link>
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="container mx-auto px-6 py-12 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-card/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/50 p-8 md:p-12 space-y-8"
          >
            {/* Title */}
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10"
              >
                <Shield className="w-8 h-8 text-primary" />
              </motion.div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
                Privacy Policy
              </h1>
              <p className="text-muted-foreground">
                Last updated: March 3, 2026
              </p>
            </div>

            {/* Content Sections */}
            <div className="space-y-6 text-foreground">
              <section className="space-y-3">
                <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  1. Information We Collect
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We collect information you provide directly to us when you create an account, make a booking, 
                  or communicate with us. This may include:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Name, email address, and phone number</li>
                  <li>Payment and billing information</li>
                  <li>Travel preferences and booking history</li>
                  <li>Communications with our customer service team</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  2. How We Use Your Information
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Process your bookings and payments</li>
                  <li>Send booking confirmations and updates</li>
                  <li>Provide customer support</li>
                  <li>Improve our services and user experience</li>
                  <li>Send promotional communications (with your consent)</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  3. Information Sharing
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We do not sell your personal information. We may share your information with:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Hotels and accommodation providers to complete your bookings</li>
                  <li>Payment processors (Razorpay) to handle transactions securely</li>
                  <li>Service providers who assist with our operations</li>
                  <li>Legal authorities when required by law</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  4. Payment Data & Razorpay
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  For payment processing, we use Razorpay, a secure PCI-DSS Level 1 certified payment gateway. 
                  When you make a payment:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Your payment details are processed directly by Razorpay</li>
                  <li>We do not store your complete credit/debit card numbers</li>
                  <li>Razorpay handles all payment authorization and processing</li>
                  <li>Transaction data is subject to Razorpay's privacy policy</li>
                  <li>We receive only payment confirmation status from Razorpay</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  By using our payment services, you agree to Razorpay's Terms of Service and Privacy Policy. 
                  Razorpay's privacy policy can be found at{" "}
                  <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    razorpay.com/privacy
                  </a>
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  5. Data Security
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We implement appropriate technical and organizational measures to protect your personal information 
                  against unauthorized access, alteration, disclosure, or destruction. This includes encryption of 
                  sensitive data and secure server infrastructure.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  6. Cookies and Tracking
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We use cookies and similar tracking technologies to enhance your experience, analyze site usage, 
                  and assist in our marketing efforts. You can control cookie preferences through your browser settings.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  7. Your Rights
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  You have the right to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Access and receive a copy of your personal data</li>
                  <li>Correct inaccurate or incomplete information</li>
                  <li>Request deletion of your data</li>
                  <li>Opt-out of marketing communications</li>
                  <li>Withdraw consent where applicable</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  8. Children's Privacy
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Our services are not directed to children under 18. We do not knowingly collect personal information 
                  from children. If you believe we have collected information from a child, please contact us immediately.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  9. Changes to This Policy
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
                  the new policy on this page and updating the "Last updated" date.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  10. Contact Us
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have questions about this Privacy Policy or our data practices, please contact us at{" "}
                  <a href={`mailto:${settings.contact.supportEmail}`} className="text-primary hover:underline">
                    {settings.contact.supportEmail}
                  </a>
                </p>
              </section>
            </div>

            {/* Footer */}
            <div className="pt-8 border-t border-border/50">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <Link to="/terms">
                  <Button variant="outline">
                    View Terms of Service
                  </Button>
                </Link>
                <Link to="/">
                  <Button variant="hero">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Return to Home
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
    </>
  );
};

export default Privacy;
