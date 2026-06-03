import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Phone, Mail, MapPin, Clock, MessageCircle, Loader2, CheckCircle2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import SEOHead from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { usePublicPlatformSettings } from "@/hooks/usePublicPlatformSettings";

const CONTACT_DRAFT_KEY = "hosthaven_contact_draft";

const Contact = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const settings = usePublicPlatformSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name || !form.email || !form.subject || !form.message) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!isAuthenticated) {
      localStorage.setItem(CONTACT_DRAFT_KEY, JSON.stringify(form));
      navigate("/login", { state: { from: location.pathname + location.search, contactRedirect: true } });
      return;
    }

    try {
      setIsSubmitting(true);
      await api.support.create({
        category: form.subject,
        message: `Contact Form\nName: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone}\n\n${form.message}`,
      });
      setIsSuccess(true);
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
      localStorage.removeItem(CONTACT_DRAFT_KEY);
    } catch (err: any) {
      setError(err?.message || "Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const storedDraft = localStorage.getItem(CONTACT_DRAFT_KEY);
    if (!storedDraft) return;

    try {
      const draft = JSON.parse(storedDraft);
      setForm({
        name: draft.name || "",
        email: draft.email || "",
        phone: draft.phone || "",
        subject: draft.subject || "",
        message: draft.message || "",
      });
    } catch {
      localStorage.removeItem(CONTACT_DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    const shouldAutoSubmit = (location.state as { contactRedirect?: boolean } | null)?.contactRedirect;
    const storedDraft = localStorage.getItem(CONTACT_DRAFT_KEY);
    if (!shouldAutoSubmit || !storedDraft || !isAuthenticated || isLoading || isSubmitting || isSuccess) {
      return;
    }

    const submitDraft = async () => {
      try {
        const draft = JSON.parse(storedDraft);
        if (!draft?.name || !draft?.email || !draft?.subject || !draft?.message) {
          return;
        }

        setError(null);
        setIsSubmitting(true);
        await api.support.create({
          category: draft.subject,
          message: `Contact Form\nName: ${draft.name}\nEmail: ${draft.email}\nPhone: ${draft.phone || ""}\n\n${draft.message}`,
        });
        setIsSuccess(true);
        setForm({ name: "", email: "", phone: "", subject: "", message: "" });
        localStorage.removeItem(CONTACT_DRAFT_KEY);
        navigate(location.pathname, { replace: true, state: {} });
      } catch (err: any) {
        setError(err?.message || "Failed to send message. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    };

    void submitDraft();
  }, [isAuthenticated, isLoading, isSubmitting, isSuccess, location.pathname, location.state, navigate]);

  return (
    <>
      <SEOHead
        title="Contact Us"
        description="Get in touch with HostHaven for hotel bookings, travel services, or partnership inquiries in Andhra Pradesh. 24/7 customer support available."
        keywords="contact HostHaven, customer support, hotel booking help, travel inquiry Andhra Pradesh, partnership HostHaven"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: "Contact HostHaven",
          description: "Get in touch with HostHaven for bookings and inquiries",
          url: "https://hosthaven.in/contact",
          mainEntity: {
            "@type": "Organization",
            name: "HostHaven",
            address: {
              "@type": "PostalAddress",
              addressLocality: "Vijayawada",
              addressRegion: "Andhra Pradesh",
              addressCountry: "IN",
            },
            email: settings.contact.supportEmail,
          },
        }}
      />
      <Layout>
      <div className="py-8 md:py-12 bg-background min-h-screen">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-3">
              Contact Us
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Have questions about customizable rooms or need assistance? 
              We're here to help you create your perfect stay.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="space-y-6">
              <div className="bg-card rounded-2xl shadow-card p-6">
                <h2 className="text-xl font-serif font-semibold text-foreground mb-6">
                  Get in Touch
                </h2>
                
                <div className="space-y-5">
                  <div className="flex items-start gap-4 p-4 bg-muted rounded-xl">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Phone</p>
                        <p className="text-muted-foreground text-sm">{settings.contact.supportPhone}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-muted rounded-xl">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Email</p>
                        <p className="text-muted-foreground text-sm">{settings.contact.supportEmail}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-muted rounded-xl">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Address</p>
                      <p className="text-muted-foreground text-sm">
                        {settings.contact.supportCompanyName}<br />
                        {settings.contact.supportAddress}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-muted rounded-xl">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Working Hours</p>
                      <p className="text-muted-foreground text-sm">
                        {settings.contact.supportHours}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl shadow-card p-6">
              <h2 className="text-xl font-serif font-semibold text-foreground mb-6">
                Send us a Message
              </h2>

              {isSuccess ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Message Sent!</h3>
                  <p className="text-muted-foreground mb-6">Thank you for contacting us. We'll get back to you soon.</p>
                  <Button variant="gold" onClick={() => setIsSuccess(false)}>Send Another Message</Button>
                </div>
              ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                    {error}
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Full Name</label>
                  <Input
                    type="text"
                    placeholder="Enter your name"
                    className="h-12 bg-muted border-0 rounded-xl"
                    required
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Email Address</label>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    className="h-12 bg-muted border-0 rounded-xl"
                    required
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Phone Number</label>
                  <Input
                    type="tel"
                    placeholder="9876543210"
                    className="h-12 bg-muted border-0 rounded-xl"
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    inputMode="numeric"
                    maxLength={10}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Subject</label>
                  <select
                    className="w-full h-12 px-4 bg-muted border-0 rounded-xl text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                    value={form.subject}
                    onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                  >
                    <option value="">Select a topic</option>
                    <option value="customizable-rooms">Customizable Rooms</option>
                    <option value="booking-inquiry">Booking Inquiry</option>
                    <option value="partnership">Partnership Opportunity</option>
                    <option value="feedback">Feedback</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Message</label>
                  <Textarea
                    placeholder="Tell us about your requirements..."
                    className="min-h-[120px] bg-muted border-0 rounded-xl resize-none"
                    required
                    value={form.message}
                    onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                  />
                </div>
                <Button type="submit" variant="hero" size="xl" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending...</>
                  ) : "Send Message"}
                </Button>
              </form>
              )}
            </div>
          </div>
        </div>
      </div>
      </Layout>
    </>
  );
};

export default Contact;
