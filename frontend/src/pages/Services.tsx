import { useState, useEffect } from "react";
import { Car, Bike, Wrench, Phone, Mail, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { initiatePayment, RazorpayResponse } from "@/lib/razorpay";
import LocationPicker from "@/components/ui/LocationPicker";

interface Service {
  id: string;
  name: string;
  description: string;
  icon?: string;
  features: string[];
  image?: string;
  images?: Array<{ url: string }>;
  category: string;
  // fields from backend DB
  price: number;
  priceUnit?: string;
  advanceType?: string;   // 'percentage' | 'fixed'
  advanceValue?: number;  // e.g. 50 for 50% or 300 for fixed ₹300
  // legacy computed field (may be absent)
  advanceAmount?: number;
  basePrice?: number;
  duration?: string;
  isActive?: boolean;
}

/** Compute the advance amount to be paid from backend fields */
const computeAdvance = (service: Service): number => {
  if (service.advanceAmount) return Number(service.advanceAmount);
  const price = Number(service.price || service.basePrice || 0);
  const value = Number(service.advanceValue ?? 30);
  if (service.advanceType === 'fixed') return value;
  // default: percentage
  return Math.round((price * value) / 100);
};

const iconMap: Record<string, typeof Car> = {
  car: Car,
  bike: Bike,
  wrench: Wrench,
  transport: Car,
  maintenance: Wrench,
};

const getIcon = (service: Service) => {
  if (service.icon && iconMap[service.icon.toLowerCase()]) return iconMap[service.icon.toLowerCase()];
  if (service.category && iconMap[service.category.toLowerCase()]) return iconMap[service.category.toLowerCase()];
  if (service.name.toLowerCase().includes("bike")) return Bike;
  if (service.name.toLowerCase().includes("car rental")) return Car;
  return Wrench;
};

const getImage = (service: Service) => {
  if (service.image) return service.image;
  if (service.images?.length) return service.images[0].url;
  return "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800";
};

const Services = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    serviceDate: "",
    serviceTime: "",
    location: "",
    notes: "",
  });

  useEffect(() => {
    setIsLoadingServices(true);
    api.services.getAll()
      .then((result: any) => {
        const list = Array.isArray(result?.data) ? result.data : [];
        setServices(list.filter((s: Service) => s.isActive !== false));
      })
      .catch(() => { })
      .finally(() => setIsLoadingServices(false));
  }, []);

  const handleServiceClick = (service: Service) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/services" } });
      return;
    }

    setSelectedService(service);
    setShowModal(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedService) return;

    if (!form.serviceDate || !form.serviceTime || !form.location.trim()) {
      alert("Please fill date, time, and location.");
      return;
    }

    const advanceAmount = computeAdvance(selectedService);

    try {
      setIsSubmitting(true);

      // Fetch Razorpay key from backend config
      let backendKey: string | undefined;
      try {
        const cfg = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/v1'}/config/payment-key`);
        if (cfg.ok) {
          const cfgData = await cfg.json();
          backendKey = cfgData?.data?.keyId || cfgData?.keyId;
        }
      } catch { /* use fallback */ }

      const paymentResult = (await initiatePayment({
        amount: advanceAmount * 100,
        name: "HostHaven",
        description: `${selectedService.name} - Advance Payment`,
        keyId: backendKey,
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        notes: {
          serviceName: selectedService.name,
          serviceDate: form.serviceDate,
          serviceTime: form.serviceTime,
          location: form.location,
        },
      })) as RazorpayResponse;

      await api.serviceBookings.create({
        serviceName: selectedService.name,
        serviceCategory: selectedService.category,
        serviceDate: new Date(`${form.serviceDate}T00:00:00`).toISOString(),
        serviceTime: form.serviceTime,
        location: form.location,
        notes: form.notes,
        advanceAmount: advanceAmount,
        totalAmount: Number(selectedService.price || selectedService.basePrice || advanceAmount),
        razorpayPaymentId: paymentResult.razorpay_payment_id,
        razorpayOrderId: paymentResult.razorpay_order_id,
      });

      alert("Advance paid and service booking request submitted. Admin will contact you manually.");
      setShowModal(false);
      setSelectedService(null);
      setForm({ serviceDate: "", serviceTime: "", location: "", notes: "" });
    } catch (error: any) {
      alert(error?.message || "Failed to complete booking request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="py-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">Travel Services</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              Everything you need for a seamless and comfortable journey across Andhra Pradesh
            </p>
          </div>

          {isLoadingServices ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : services.length === 0 ? (
            <p className="text-center text-muted-foreground py-16">No services available at the moment.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {services.map((service) => {
                const Icon = getIcon(service);
                const features = Array.isArray(service.features) ? service.features : [];
                return (
                  <div
                    key={service.id}
                    id={service.id}
                    className="bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img src={getImage(service)} alt={service.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-heritage-brown/80 via-heritage-brown/20 to-transparent" />
                      <div className="absolute bottom-4 left-4">
                        <div className="w-12 h-12 rounded-xl gradient-gold flex items-center justify-center mb-2">
                          <Icon className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <h3 className="font-serif font-semibold text-xl text-cream-light">{service.name}</h3>
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="text-muted-foreground text-sm mb-4">{service.description}</p>
                      {features.length > 0 && (
                        <ul className="space-y-2 mb-4">
                          {features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm text-foreground">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      )}
                      <p className="text-sm font-medium text-primary mb-4">
                        {selectedService && computeAdvance(service) > 0
                          ? `Advance: ₹${computeAdvance(service)}`
                          : `Price: ₹${Number(service.price || service.basePrice || 0)}`}
                      </p>
                      <Button variant="gold" className="w-full" onClick={() => handleServiceClick(service)}>
                        Book Now
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-16 bg-card rounded-2xl shadow-card p-8 text-center">
            <h2 className="text-2xl font-serif font-bold text-foreground mb-4">Need Custom Travel Arrangements?</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Our team can help you plan custom tours, group transportation, and special travel requirements across Andhra Pradesh.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a href="/contact">
                <Button variant="gold" size="lg">
                  <Phone className="w-5 h-5" />
                  Contact Us
                </Button>
              </a>
              <a href="/contact">
                <Button variant="goldOutline" size="lg">
                  <Mail className="w-5 h-5" />
                  Send a Message
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Book {selectedService?.name}</DialogTitle>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-foreground">
              <p className="font-medium">Advance Amount: ₹{selectedService ? computeAdvance(selectedService) : 0}</p>
              {selectedService && (
                <p className="text-xs text-muted-foreground">
                  Full service price: ₹{Number(selectedService.price || selectedService.basePrice || 0)}
                  {selectedService.priceUnit ? ` / ${selectedService.priceUnit.replace('_', ' ')}` : ''}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Advance payment is mandatory. Remaining amount is handled offline. Refunds are admin-controlled.
              </p>
            </div>

            <div>
              <label htmlFor="service-date" className="text-sm font-medium text-foreground">Service Date</label>
              <input
                id="service-date"
                type="date"
                required
                title="Select service date"
                min={new Date().toISOString().split("T")[0]}
                value={form.serviceDate}
                onChange={(e) => setForm((prev) => ({ ...prev, serviceDate: e.target.value }))}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label htmlFor="service-time" className="text-sm font-medium text-foreground">Service Time</label>
              <input
                id="service-time"
                type="time"
                required
                title="Select service time"
                value={form.serviceTime}
                onChange={(e) => setForm((prev) => ({ ...prev, serviceTime: e.target.value }))}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Location</label>
              <div className="mt-1">
                <LocationPicker
                  value={form.location}
                  onChange={(address) => setForm((prev) => ({ ...prev, location: address }))}
                />
              </div>
              {!form.location && (
                <p className="text-xs text-destructive mt-1">Please select a location from the map</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Notes (optional)</label>
              <textarea
                rows={3}
                placeholder="Any specific requirements"
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <Button type="submit" variant="gold" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : `Pay ₹${selectedService ? computeAdvance(selectedService) : 0} & Submit`}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Services;