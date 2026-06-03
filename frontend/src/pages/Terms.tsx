import { Link } from "react-router-dom";
import { ArrowLeft, FileText, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import SEOHead from "@/components/SEOHead";
import { usePublicPlatformSettings } from "@/hooks/usePublicPlatformSettings";

const Terms = () => {
  const settings = usePublicPlatformSettings();

  return (
    <>
    <SEOHead title="Terms & Conditions" description="Read HostHaven's terms and conditions for booking hotels, homes, and travel services in Andhra Pradesh." />
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
                <FileText className="w-8 h-8 text-primary" />
              </motion.div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
                Terms of Service
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
                  1. Agreement to Terms
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing and using HostHaven's services, you agree to be bound by these Terms of Service 
                  and all applicable laws and regulations. If you do not agree with any of these terms, you are 
                  prohibited from using or accessing this site.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  2. Use License
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Permission is granted to temporarily access the materials on HostHaven's website for personal, 
                  non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Modify or copy the materials</li>
                  <li>Use the materials for any commercial purpose</li>
                  <li>Attempt to decompile or reverse engineer any software</li>
                  <li>Remove any copyright or proprietary notations</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  3. Booking and Reservations
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  All bookings made through HostHaven are subject to availability and confirmation. We reserve 
                  the right to refuse service, terminate accounts, or cancel orders at our discretion. Prices 
                  are subject to change without notice.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  4. Cancellation Policy
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Cancellation policies vary by property. Please review the specific cancellation terms for each 
                  booking before confirming your reservation. Refunds, if applicable, will be processed according 
                  to the property's cancellation policy.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  5. User Accounts
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  You are responsible for maintaining the confidentiality of your account credentials and for all 
                  activities that occur under your account. You must notify us immediately of any unauthorized use 
                  of your account.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  6. Limitation of Liability
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  HostHaven shall not be liable for any damages arising from the use or inability to use our services, 
                  including but not limited to direct, indirect, incidental, punitive, and consequential damages.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  7. Modifications
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  HostHaven may revise these terms of service at any time without notice. By using this website, 
                  you agree to be bound by the current version of these Terms of Service.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  8. Payment Terms
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  All payments made through HostHaven are processed securely via Razorpay, a PCI-DSS compliant payment gateway. 
                  By making a payment, you agree to Razorpay's terms of service and privacy policy.
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>All transactions are encrypted and secure</li>
                  <li>We do not store your complete credit/debit card details</li>
                  <li>Payment processing is subject to Razorpay's terms</li>
                  <li>Refunds are processed according to our refund policy</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  9. Contact Us
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have any questions about these Terms of Service, please contact us at{" "}
                  <a href={`mailto:${settings.contact.supportEmail}`} className="text-primary hover:underline">
                    {settings.contact.supportEmail}
                  </a>
                </p>
              </section>
            </div>

            {/* Footer */}
            <div className="pt-8 border-t border-border/50">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <Link to="/privacy">
                  <Button variant="outline">
                    View Privacy Policy
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

export default Terms;
