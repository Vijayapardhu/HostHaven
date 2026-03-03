import { useState, useEffect, useMemo } from "react";
import { Car, Bike, Wrench, Phone, Mail, Loader2, Search, MapPin, Camera, Utensils, Package, Star, Clock, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { initiatePayment, RazorpayResponse } from "@/lib/razorpay";

interface Service {
  id: string;
  name: string;
  description: string;
  icon?: string;
  features: string[];
  image?: string;
  images?: Array<{ url: string }>;
  category: string;
  advanceAmount: number;
  basePrice?: number;
  isActive?: boolean;
  rating?: number;
  reviewCount?: number;
}

const categoryConfig: Record<string, { icon: typeof Car; label: string; color: string; bgGradient: string }> = {
  transport: { icon: Car, label: "Transport", color: "text-blue-600", bgGradient: "from-blue-500/10 to-blue-600/5" },
  guide: { icon: User, label: "Guide Services", color: "text-emerald-600", bgGradient: "from-emerald-500/10 to-emerald-600/5" },
  photography: { icon: Camera, label: "Photography", color: "text-pink-600", bgGradient: "from-pink-500/10 to-pink-600/5" },
  food: { icon: Utensils, label: "Food & Dining", color: "text-orange-600", bgGradient: "from-orange-500/10 to-orange-600/5" },
  other: { icon: Package, label: "Other Services", color: "text-purple-600", bgGradient: "from-purple-500/10 to-purple-600/5" },
};

const defaultIconMap: Record<string, typeof Car> = {
  car: Car,
  bike: Bike,
  wrench: Wrench,
  transport: Car,
  maintenance: Wrench,
  guide: User,
  photography: Camera,
  food: Utensils,
  other: Package,
};

const getIcon = (service: Service) => {
  if (service.icon && defaultIconMap[service.icon.toLowerCase()]) {
    return defaultIconMap[service.icon.toLowerCase()];
  }
  if (service.category && defaultIconMap[service.category.toLowerCase()]) {
    return defaultIconMap[service.category.toLowerCase()];
  }
  if (service.name.toLowerCase().includes("bike")) return Bike;
  if (service.name.toLowerCase().includes("car rental") || service.name.toLowerCase().includes("car")) return Car;
  if (service.name.toLowerCase().includes("guide")) return User;
  if (service.name.toLowerCase().includes("camera") || service.name.toLowerCase().includes("photo")) return Camera;
  if (service.name.toLowerCase().includes("food") || service.name.toLowerCase().includes("dining")) return Utensils;
  return Package;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
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

  const categories = useMemo(() => {
    const cats = new Set(services.map(s => s.category).filter(Boolean));
    return Array.from(cats) as string[];
  }, [services]);

  const filteredServices = useMemo(() => {
    let filtered = services;

    if (activeCategory !== "all") {
      filtered = filtered.filter(s => s.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query) ||
        s.category?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [services, activeCategory, searchQuery]);

  const servicesByCategory = useMemo(() => {
    const grouped: Record<string, Service[]> = {};
    filteredServices.forEach(service => {
      const cat = service.category || "other";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(service);
    });
    return grouped;
  }, [filteredServices]);

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

    try {
      setIsSubmitting(true);
      const paymentResult = (await initiatePayment({
        amount: selectedService.advanceAmount * 100,
        name: "HostHaven",
        description: `${selectedService.name} - Advance Payment`,
        prefill: { name: user?.name, email: user?.email },
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
        advanceAmount: selectedService.advanceAmount,
        totalAmount: selectedService.advanceAmount,
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

  const scrollToCategory = (category: string) => {
    setActiveCategory(category);
    if (category !== "all") {
      const element = document.getElementById(`category-${category}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <Layout>
      <div className="py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">Travel Services</h1>
            <p className="text-muted-foreground mt-2">
              Everything you need for a seamless and comfortable journey across Andhra Pradesh
            </p>
          </div>

          {/* Filters */}
          <div className="bg-card rounded-2xl shadow-card p-4 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 bg-muted border-0 rounded-xl"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setActiveCategory("all")}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeCategory === "all"
                      ? "gradient-gold text-primary-foreground shadow-gold"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                >
                  All Services
                </button>
                {categories.map((cat) => {
                  const config = categoryConfig[cat] || categoryConfig.other;
                  const Icon = config.icon;
                  return (
                    <button
                      key={cat}
                      onClick={() => scrollToCategory(cat)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeCategory === cat
                          ? "gradient-gold text-primary-foreground shadow-gold"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {isLoadingServices ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No services found</p>
              {searchQuery && (
                <Button variant="outline" className="mt-4" onClick={() => setSearchQuery("")}>
                  Clear Search
                </Button>
              )}
            </div>
          ) : activeCategory === "all" ? (
            <div className="space-y-12">
              {Object.entries(servicesByCategory).map(([category, categoryServices]) => {
                const config = categoryConfig[category] || categoryConfig.other;
                const Icon = config.icon;
                return (
                  <div key={category} id={`category-${category}`} className="scroll-mt-20">
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.bgGradient} flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${config.color}`} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-serif font-bold text-foreground">{config.label}</h2>
                        <p className="text-sm text-muted-foreground">{categoryServices.length} service{categoryServices.length !== 1 ? 's' : ''} available</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {categoryServices.map((service) => (
                        <ServiceCard key={service.id} service={service} onBook={handleServiceClick} getIcon={getIcon} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <ServiceCard key={service.id} service={service} onBook={handleServiceClick} getIcon={getIcon} />
              ))}
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Book {selectedService?.name}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-foreground">
              <p className="font-medium">Advance Amount: ₹{selectedService?.advanceAmount || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Advance payment is mandatory. Remaining amount is handled offline. Refunds are admin-controlled.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Service Date</label>
              <input
                type="date"
                required
                min={new Date().toISOString().split("T")[0]}
                value={form.serviceDate}
                onChange={(e) => setForm((prev) => ({ ...prev, serviceDate: e.target.value }))}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Service Time</label>
              <input
                type="time"
                required
                value={form.serviceTime}
                onChange={(e) => setForm((prev) => ({ ...prev, serviceTime: e.target.value }))}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Location</label>
              <input
                type="text"
                required
                placeholder="Pickup or service location"
                value={form.location}
                onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
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
              {isSubmitting ? "Processing..." : `Pay ₹${selectedService?.advanceAmount || 0} & Submit`}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

function ServiceCard({ service, onBook, getIcon }: { service: Service; onBook: (s: Service) => void; getIcon: (s: Service) => typeof Car }) {
  const Icon = getIcon(service);
  const features = Array.isArray(service.features) ? service.features : [];

  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 group">
      <div className="relative h-44 overflow-hidden">
        <img
          src={getImage(service)}
          alt={service.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-heritage-brown/90 via-heritage-brown/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Icon className="w-5 h-5 text-white" />
            </div>
            {service.rating && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium">
                <Star className="w-3 h-3 fill-current" />
                {service.rating.toFixed(1)}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-serif font-semibold text-lg text-foreground mb-2 line-clamp-1">{service.name}</h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{service.description}</p>

        {features.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {features.slice(0, 3).map((feature, idx) => (
              <span key={idx} className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
                {feature}
              </span>
            ))}
            {features.length > 3 && (
              <span className="text-xs px-2 py-1 text-muted-foreground">+{features.length - 3} more</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Starting from</p>
            <p className="text-lg font-bold text-primary">₹{service.advanceAmount || service.basePrice || 0}</p>
          </div>
          <Button variant="gold" size="sm" onClick={() => onBook(service)}>
            Book Now
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Services;
