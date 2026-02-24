import { Link } from "react-router-dom";
import { ArrowLeft, Building2, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const VendorTerms = () => {
  return (
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
            <Link to="/vendor/signup">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Signup
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
                <Building2 className="w-8 h-8 text-primary" />
              </motion.div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
                Vendor Partnership Terms
              </h1>
              <p className="text-muted-foreground">
                Last updated: February 24, 2026
              </p>
            </div>

            {/* Content Sections */}
            <div className="space-y-6 text-foreground">
              <section className="space-y-3">
                <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  1. Vendor Agreement
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  By registering as a vendor partner on HostHaven, you agree to provide accurate information about 
                  your property, maintain high service standards, and comply with all applicable laws and regulations. 
                  This agreement governs your relationship with HostHaven as a hospitality service provider.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  2. Property Listing Requirements
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  All property listings must include:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Accurate property descriptions and amenities</li>
                  <li>High-quality, recent photographs</li>
                  <li>Current pricing and availability</li>
                  <li>Valid licenses and certifications</li>
                  <li>Clear cancellation and refund policies</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  3. Commission and Payment
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  HostHaven charges a commission of 15-20% on confirmed bookings, depending on your partnership tier. 
                  Payments are processed within 7-14 business days after guest check-out. You are responsible for 
                  collecting applicable taxes from guests.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  4. Service Standards
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  As a vendor partner, you must:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Honor all confirmed bookings</li>
                  <li>Provide clean, safe accommodations</li>
                  <li>Respond to guest inquiries within 24 hours</li>
                  <li>Maintain property standards as advertised</li>
                  <li>Resolve guest complaints professionally</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  5. Booking Management
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  You are required to keep your availability calendar updated in real-time. Double bookings or 
                  cancellations by the vendor may result in penalties or account suspension. All booking modifications 
                  must be communicated through the HostHaven platform.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  6. Guest Reviews and Ratings
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Guest reviews and ratings are an essential part of our platform. You may not offer incentives for 
                  positive reviews or penalties for negative reviews. Properties maintaining an average rating below 
                  3.5 stars may be subject to review or removal.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  7. Insurance and Liability
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Vendors must maintain appropriate insurance coverage for their properties. HostHaven is not liable 
                  for any damages, injuries, or losses occurring at your property. You are solely responsible for 
                  guest safety and property maintenance.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  8. Termination
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Either party may terminate this agreement with 30 days written notice. HostHaven reserves the right 
                  to immediately suspend or terminate vendor accounts that violate these terms, engage in fraudulent 
                  activity, or fail to meet service standards.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  9. Intellectual Property
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  By uploading content to HostHaven, you grant us a non-exclusive license to use, display, and 
                  promote your property listings. You retain ownership of your content and represent that you have 
                  the right to use all images and descriptions provided.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-serif font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  10. Contact Support
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  For vendor support and partnership inquiries, contact us at{" "}
                  <a href="mailto:vendors@hosthaven.com" className="text-primary hover:underline">
                    vendors@hosthaven.com
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
                <Link to="/vendor/signup">
                  <Button variant="hero">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Continue Registration
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default VendorTerms;
