import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Car, Bike, Wrench, Phone, Mail, Loader2, MapPin, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { initiatePayment, RazorpayResponse } from "@/lib/razorpay";
import LocationPicker from "@/components/ui/LocationPicker";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";

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
  city?: string;
  location?: string;
  locations?: string[];
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

const getAllImages = (service: Service): string[] => {
  const images: string[] = [];
  if (service.image) images.push(service.image);
  if (service.images?.length) {
    service.images.forEach((img) => {
      if (img.url && !images.includes(img.url)) images.push(img.url);
    });
  }
  if (images.length === 0) {
    images.push("https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800");
  }
  return images;
};

const formatLabel = (value?: string) => {
  if (!value) return "Not specified";
  return value
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const Services = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentImageIndices, setCurrentImageIndices] = useState<Record<string, number>>({});
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [fullscreenService, setFullscreenService] = useState<Service | null>(null);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
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
    setSelectedService(service);
    setShowDetails(true);
  };

  const handlePrevImage = useCallback((serviceId: string, images: string[], e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndices((prev) => {
      const currentIndex = prev[serviceId] || 0;
      return { ...prev, [serviceId]: (currentIndex - 1 + images.length) % images.length };
    });
  }, []);

  const handleNextImage = useCallback((serviceId: string, images: string[], e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndices((prev) => {
      const currentIndex = prev[serviceId] || 0;
      return { ...prev, [serviceId]: (currentIndex + 1) % images.length };
    });
  }, []);

  const openFullscreen = useCallback((service: Service, index: number) => {
    setFullscreenService(service);
    setFullscreenIndex(index);
    setZoomLevel(1);
    setIsFullscreenOpen(true);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    if (fullscreenService) {
      const images = getAllImages(fullscreenService);
      if (diff > threshold) {
        setFullscreenIndex((prev) => (prev + 1) % images.length);
        setZoomLevel(1);
      } else if (diff < -threshold) {
        setFullscreenIndex((prev) => (prev - 1 + images.length) % images.length);
        setZoomLevel(1);
      }
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  }, [fullscreenService]);

  const categoryOptions = useMemo(() => {
    const allCategories = services
      .map((service) => (service.category || "other").trim())
      .filter(Boolean);

    return Array.from(new Set(allCategories));
  }, [services]);

  const locationOptions = useMemo(() => {
    const discoveredLocations = services.flatMap((service) => {
      const values = [service.city, service.location, ...(service.locations || [])]
        .map((entry) => (entry || "").trim())
        .filter(Boolean);
      return values;
    });

    return Array.from(new Set([...discoveredLocations]));
  }, [services]);

  const [apiLocations, setApiLocations] = useState<string[]>([]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const cities = await api.services.getCities();
        if (cities && Array.isArray(cities)) {
          setApiLocations(cities);
        }
      } catch (err) {
        console.error("Failed to fetch service cities:", err);
      }
    };
    fetchLocations();
  }, []);

  const allLocations = useMemo(() => {
    const unique = new Set([...locationOptions, ...apiLocations]);
    return Array.from(unique).sort();
  }, [locationOptions, apiLocations]);

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesSearch =
        !searchQuery.trim() ||
        [
          service.name,
          service.description,
          service.category,
          service.city,
          service.location,
          ...(service.locations || []),
          ...(service.features || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(searchQuery.trim().toLowerCase());

      if (!matchesSearch) return false;

      const categoryMatch =
        selectedCategory === "all" ||
        (service.category || "other").toLowerCase() === selectedCategory.toLowerCase();

      if (!categoryMatch) return false;

      if (selectedLocation === "all") return true;

      const haystack = [
        service.city,
        service.location,
        ...(service.locations || []),
        service.description,
        service.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(selectedLocation.toLowerCase());
    });
  }, [services, searchQuery, selectedCategory, selectedLocation]);

  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];
    
    filteredServices.forEach((service) => {
      const images = getAllImages(service);
      if (images.length > 1) {
        const interval = setInterval(() => {
          setCurrentImageIndices((prev) => {
            const currentIndex = prev[service.id] || 0;
            return {
              ...prev,
              [service.id]: (currentIndex + 1) % images.length,
            };
          });
        }, 5000 + Math.random() * 2000);
        intervals.push(interval);
      }
    });

    return () => intervals.forEach(clearInterval);
  }, [filteredServices]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedService) return;

    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/services" } });
      return;
    }

    if (!form.serviceDate || !form.serviceTime || !form.location.trim()) {
      alert("Please fill date, time, and location.");
      return;
    }

    const advanceAmount = computeAdvance(selectedService);

    try {
      setIsSubmitting(true);

      // 1. Create a PENDING service booking
      const booking = await api.serviceBookings.create({
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        serviceCategory: selectedService.category,
        serviceDate: new Date(`${form.serviceDate}T00:00:00`).toISOString(),
        serviceTime: form.serviceTime,
        location: form.location,
        notes: form.notes,
        advanceAmount: advanceAmount,
        totalAmount: Number(selectedService.price || selectedService.basePrice || advanceAmount),
      });

      // 2. Create Razorpay order on backend
      const orderData = await api.payments.createServiceOrder(booking.id);

      // 3. Initiate payment
      const paymentResult = (await initiatePayment({
        amount: orderData.amount * 100,
        order_id: orderData.orderId,
        keyId: orderData.keyId,
        name: "HostHaven",
        description: `${selectedService.name} - Advance Payment`,
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        notes: {
          serviceBookingId: booking.id,
          serviceName: selectedService.name,
          serviceDate: form.serviceDate,
          serviceTime: form.serviceTime,
          location: form.location,
        },
      })) as RazorpayResponse;

      // 4. Verify payment on backend
      await api.payments.verifyService({
        razorpay_order_id: paymentResult.razorpay_order_id!,
        razorpay_payment_id: paymentResult.razorpay_payment_id,
        razorpay_signature: paymentResult.razorpay_signature!,
        serviceBookingId: booking.id,
      });

      toast.success("Service booking confirmed! Check your bookings for details.");
      navigate("/bookings");
    } catch (error: any) {
      alert(error?.message || "Failed to complete booking request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderServiceDetails = () => {
    if (!selectedService) return null;

    const features = Array.isArray(selectedService.features) ? selectedService.features : [];

    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-foreground">
          <p className="font-medium">Advance Amount: ₹{computeAdvance(selectedService)}</p>
          <p className="text-xs text-muted-foreground">
            Full service price: ₹{Number(selectedService.price || selectedService.basePrice || 0)}
            {selectedService.priceUnit ? ` / ${selectedService.priceUnit.replace("_", " ")}` : ""}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Advance payment is mandatory. Remaining amount is handled offline. Refunds are admin-controlled.
          </p>
        </div>

        <div>
          <h4 className="font-medium text-sm mb-2">Service information</h4>
          <p className="text-sm text-muted-foreground">{selectedService.description}</p>
          {features.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {features.slice(0, 6).map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {feature}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
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
            {isSubmitting ? "Processing..." : `Pay ₹${computeAdvance(selectedService)} & Submit`}
          </Button>
        </form>
      </div>
    );
  };

  return (
    <Layout hideBottomNav={isFullscreenOpen}>
      <div className="py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
              Travel Services
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Book trusted travel help, transport, and on-ground assistance with the same browsing flow used across stays and temples.
            </p>
          </div>

          <div className="bg-card rounded-2xl shadow-card p-4 mb-8 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search services, features, or locations..."
                className="pl-10 h-12 bg-muted border-0 rounded-xl"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedLocation("all")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedLocation === "all"
                    ? "gradient-gold text-primary-foreground shadow-gold"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                All Locations
              </button>
              {allLocations.map((location) => (
                <button
                  key={location}
                  onClick={() => setSelectedLocation(location)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedLocation === location
                      ? "gradient-gold text-primary-foreground shadow-gold"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {formatLabel(location)}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedCategory === "all"
                    ? "gradient-gold text-primary-foreground shadow-gold"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                All Categories
              </button>
              {categoryOptions.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedCategory === category
                      ? "gradient-gold text-primary-foreground shadow-gold"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {formatLabel(category)}
                </button>
              ))}
            </div>
          </div>

          {isLoadingServices ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredServices.length === 0 ? (
            <p className="text-center text-muted-foreground py-16">No services match your filters.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {filteredServices.map((service) => {
                const Icon = getIcon(service);
                const features = Array.isArray(service.features) ? service.features : [];
                const images = getAllImages(service);
                const currentImageIndex = currentImageIndices[service.id] || 0;
                const hasMultipleImages = images.length > 1;
                const fullPrice = Number(service.price || service.basePrice || 0);
                const primaryLocation = service.city || service.location || service.locations?.[0] || "Andhra Pradesh";
                return (
                  <div
                    key={service.id}
                    id={service.id}
                    onClick={() => handleServiceClick(service)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleServiceClick(service);
                      }
                    }}
                    className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer h-full flex flex-col border border-border/40"
                  >
                    <div className="relative h-52 overflow-hidden" onClick={(e) => { e.stopPropagation(); openFullscreen(service, currentImageIndex); }}>
                      <div className="absolute inset-0">
                        {images.map((img, index) => (
                          <img
                            key={index}
                            src={img}
                            alt={`${service.name} - ${index + 1}`}
                            className={`w-full h-full object-cover transition-opacity duration-500 ${
                              index === currentImageIndex ? "opacity-100" : "opacity-0 absolute inset-0"
                            }`}
                          />
                        ))}
                      </div>
                      {hasMultipleImages && (
                        <>
                          <button
                            onClick={(e) => handlePrevImage(service.id, images, e)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Previous image"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleNextImage(service.id, images, e)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Next image"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {images.map((_, index) => (
                              <div
                                key={index}
                                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                  index === currentImageIndex ? "bg-white" : "bg-white/50"
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-heritage-brown/80 via-heritage-brown/20 to-transparent" />
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-card/90 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
                          <Icon className="w-3.5 h-3.5 text-primary" />
                          {formatLabel(service.category)}
                        </span>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="font-serif font-semibold text-xl text-cream-light leading-tight">
                          {service.name}
                        </h3>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-cream-light/85">
                          <MapPin className="w-4 h-4" />
                          <span className="line-clamp-1">{formatLabel(primaryLocation)}</span>
                        </p>
                      </div>
                      {hasMultipleImages && (
                        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                          <span className="text-[10px] text-white font-medium">{currentImageIndex + 1}/{images.length}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{service.description}</p>
                      {features.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-1 mb-4">
                          {features.slice(0, 3).map((feature, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-muted rounded-lg text-xs text-muted-foreground"
                            >
                              {feature}
                            </span>
                          ))}
                          {features.length > 3 && (
                            <span className="px-2 py-1 bg-primary/10 rounded-lg text-xs text-primary font-medium">
                              +{features.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                      <div className="mt-auto pt-4 border-t border-border">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Starting from</p>
                            <p className="text-xl font-semibold text-foreground">
                              ₹{fullPrice.toLocaleString()}
                              <span className="text-muted-foreground font-normal text-sm">
                                {service.priceUnit ? ` / ${formatLabel(service.priceUnit)}` : ""}
                              </span>
                            </p>
                            <p className="text-xs text-primary mt-1">
                              Advance: ₹{computeAdvance(service).toLocaleString()}
                            </p>
                          </div>
                          {service.duration ? (
                            <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                              {service.duration}
                            </span>
                          ) : null}
                        </div>
                        <Button variant="gold" className="w-full mt-4 group-hover:scale-[1.02] transition-transform" onClick={(event) => { event.stopPropagation(); handleServiceClick(service); }}>
                          View & Book
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-16 relative overflow-hidden rounded-3xl">
            <div className="absolute inset-0">
              <img 
                src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1600" 
                alt="Custom Travel" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-heritage-brown/95 via-heritage-brown/80 to-heritage-brown/70" />
            </div>
            <div className="relative p-8 md:p-12 text-center">
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-cream-light mb-4">Need Custom Travel Arrangements?</h2>
              <p className="text-cream-light/80 mb-8 max-w-xl mx-auto">
                Our team can help you plan custom tours, group transportation, and special travel requirements across Andhra Pradesh.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a href="/contact">
                  <Button variant="gold" size="lg" className="min-w-[160px]">
                    <Phone className="w-5 h-5" />
                    Contact Us
                  </Button>
                </a>
                <a href="/contact">
                  <Button size="lg" variant="outline" className="min-w-[160px] bg-transparent text-cream-light border-cream-light/30 hover:bg-cream-light/10 hover:border-cream-light/50">
                    <Mail className="w-5 h-5" />
                    Send a Message
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Viewer */}
      {isFullscreenOpen && fullscreenService && (
        <div 
          className="fixed inset-0 z-[100] bg-black flex flex-col"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex items-center justify-between p-4 bg-black/50">
            <button
              onClick={() => setIsFullscreenOpen(false)}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <span className="text-white text-sm">
              {fullscreenIndex + 1} / {getAllImages(fullscreenService).length}
            </span>
            <div className="w-10" />
          </div>

          <div 
            className="flex-1 flex items-center justify-center overflow-hidden p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={getAllImages(fullscreenService)[fullscreenIndex]}
              alt={`${fullscreenService.name} ${fullscreenIndex + 1}`}
              className="max-w-full max-h-[70vh] object-contain"
              style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.3s ease' }}
            />
          </div>

          <div className="flex items-center justify-center gap-4 p-4 bg-black/50">
            <button
              onClick={() => setZoomLevel(Math.max(1, zoomLevel - 0.5))}
              className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
            >
              <span className="text-xl font-bold">-</span>
            </button>
            <span className="text-white text-sm w-16 text-center">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.5))}
              className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
            >
              <span className="text-xl font-bold">+</span>
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="px-4 py-2 rounded-full bg-white/10 text-white text-sm hover:bg-white/20"
            >
              Reset
            </button>
          </div>

          {getAllImages(fullscreenService).length > 1 && (
            <>
              <button
                onClick={() => {
                  setFullscreenIndex((prev) => (prev - 1 + getAllImages(fullscreenService).length) % getAllImages(fullscreenService).length);
                  setZoomLevel(1);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={() => {
                  setFullscreenIndex((prev) => (prev + 1) % getAllImages(fullscreenService).length);
                  setZoomLevel(1);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}
        </div>
      )}

      {isMobile ? (
        <Drawer open={showDetails} onOpenChange={setShowDetails}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle className="font-serif text-xl">{selectedService ? `Book ${selectedService.name}` : "Service details"}</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4 overflow-y-auto">
              {renderServiceDetails()}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Sheet open={showDetails} onOpenChange={setShowDetails}>
          <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="font-serif text-xl">{selectedService ? `Book ${selectedService.name}` : "Service details"}</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              {renderServiceDetails()}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </Layout>
  );
};

export default Services;
