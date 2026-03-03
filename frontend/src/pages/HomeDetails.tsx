import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Star, MapPin, Bed, Users, ArrowLeft, Calendar as CalendarIcon,
  Wifi, CalendarDays, Minus, Plus, Maximize, PlayCircle, Eye,
  ShoppingBag, ShieldCheck, CheckCircle2, ChevronRight, Wind,
  Coffee, Tv, Snowflake, Info
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { createBookingPayment } from "@/lib/razorpay";
import { api } from "@/lib/api";
import { Calendar } from "@/components/ui/calendar";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface PropertyRoom {
  id: string;
  name: string;
  description?: string;
  type: string;
  capacity: number;
  extraBedCapacity: number;
  sizeSqm?: number;
  pricePerNight: number;
  weekendPrice?: number;
  amenities: string[];
  images?: Array<{ url: string; alt?: string; isPrimary?: boolean }>;
}

interface CancellationPolicy {
  freeBeforeHours: number;
  refundPercentBefore: number;
  refundPercentAfter: number;
}

interface PropertyData {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode?: string;
  basePrice: number;
  currency?: string;
  rating: number;
  reviewCount: number;
  bookingCount?: number;
  viewCount?: number;
  description: string;
  shortDesc?: string;
  images: Array<{ url: string; alt?: string; isPrimary?: boolean }>;
  videos?: Array<{ url: string; title?: string }>;
  virtualTourUrl?: string;
  amenities: string[];
  highlights?: string[];
  featureFlags?: any;
  rooms?: PropertyRoom[];
  cancellationPolicy?: CancellationPolicy;
  reviews?: Array<{
    id: string;
    rating: number;
    comment?: string;
    createdAt: string;
    user?: { name?: string; avatarUrl?: string };
  }>;
  latitude?: number;
  longitude?: number;
}

const getAmenityIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("wifi") || n.includes("internet")) return <Wifi className="w-5 h-5" />;
  if (n.includes("ac") || n.includes("air")) return <Snowflake className="w-5 h-5" />;
  if (n.includes("tv") || n.includes("television")) return <Tv className="w-5 h-5" />;
  if (n.includes("coffee") || n.includes("tea")) return <Coffee className="w-5 h-5" />;
  if (n.includes("wind")) return <Wind className="w-5 h-5" />;
  return <CheckCircle2 className="w-5 h-5" />;
};

const HomeDetails = () => {
  const { id } = useParams();
  const [home, setHome] = useState<PropertyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const autoScrollInterval = useRef<NodeJS.Timeout | null>(null);

  // Booking state
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState(1);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);
  const [isGuestsOpen, setIsGuestsOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const { toast } = useToast();

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Calculate nights
  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const nights = calculateNights();

  const homeImages = useMemo(() => {
    if (!home?.images?.length) return [];
    return home.images.map((image) => image.url);
  }, [home]);

  const rooms = useMemo(() => home?.rooms || [], [home]);

  const updateGuests = (delta: number) => {
    const maxGuests = rooms.length
      ? Math.max(...rooms.map((room) => room.capacity + (room.extraBedCapacity || 0)))
      : 4;
    setGuests((prev) => Math.max(1, Math.min(maxGuests, prev + delta)));
  };

  const handleBooking = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to book this property",
        variant: "destructive",
      });
      setTimeout(() => {
        navigate("/login", { state: { from: window.location.pathname } });
      }, 1500);
      return;
    }

    if (!checkIn || !checkOut) {
      toast({
        title: "Missing Information",
        description: "Please select check-in and check-out dates",
        variant: "destructive",
      });
      return;
    }

    if (!home) return;

    setIsProcessingPayment(true);
    let bookingId: string | undefined;

    try {
      const totalAmount = home.basePrice * nights;
      const checkInIso = checkIn.toISOString();
      const checkOutIso = checkOut.toISOString();
      const roomId = rooms[0]?.id;
      let lockAcquired = false;

      if (roomId) {
        await api.inventory.lock({
          roomId,
          checkIn: checkInIso,
          checkOut: checkOutIso,
          quantity: 1,
        });
        lockAcquired = true;
      }
      if (!roomId) {
        throw new Error("No rooms available for this home");
      }

      const bookingResponse = await api.bookings.create({
        propertyId: home.id,
        roomId,
        checkInDate: checkInIso,
        checkOutDate: checkOutIso,
        adults: guests,
        children: 0,
        extraBeds: 0,
      });

      bookingId = bookingResponse?.booking?.id || bookingResponse?.id;
      if (!bookingId) {
        throw new Error("Booking creation failed");
      }

      const order = await api.payments.createOrder(bookingId);

      const result = await createBookingPayment({
        propertyName: home.name,
        amount: totalAmount,
        nights: nights,
        checkIn: format(checkIn, "MMM dd, yyyy"),
        checkOut: format(checkOut, "MMM dd, yyyy"),
        guests: guests,
        orderId: order.orderId,
        notes: { propertyId: home.id, roomId: roomId || "" },
      });

      if (result.success) {
        const resp = result.response as any;
        if (resp?.razorpay_order_id && resp?.razorpay_payment_id && resp?.razorpay_signature) {
          await api.payments.verify({
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_signature: resp.razorpay_signature,
          });
        }
        toast({
          title: "Booking Successful! 🎉",
          description: `Your booking for ${home.name} has been confirmed.`,
        });
      } else {
        if (bookingId) {
          await api.bookings.cancel(bookingId, "Payment failed");
        }
        if (lockAcquired && roomId) {
          await api.inventory.release({ roomId });
        }
        throw new Error(result.error || "Payment failed");
      }
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "Unable to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  useEffect(() => {
    const fetchHome = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await api.properties.getById(id);
        setHome(data);
      } catch (err: any) {
        setError(err?.message || "Failed to load home details");
      } finally {
        setIsLoading(false);
      }
    };
    fetchHome();
  }, [id]);

  useEffect(() => {
    if (!homeImages.length) return;
    const startAutoScroll = () => {
      if (autoScrollInterval.current) clearInterval(autoScrollInterval.current);
      autoScrollInterval.current = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % homeImages.length);
      }, 4000);
    };
    startAutoScroll();
    return () => {
      if (autoScrollInterval.current) clearInterval(autoScrollInterval.current);
    };
  }, [homeImages.length]);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || !homeImages.length) return;
    const dist = touchStart - touchEnd;
    if (dist > 50) setCurrentImageIndex((prev) => (prev + 1) % homeImages.length);
    if (dist < -50) setCurrentImageIndex((prev) => (prev - 1 + homeImages.length) % homeImages.length);
    setTouchStart(0); setTouchEnd(0);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-xl font-medium text-muted-foreground animate-pulse">Loading amazing spaces...</p>
        </div>
      </Layout>
    );
  }

  if (error || !home) {
    return (
      <Layout>
        <div className="py-20 text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Info className="w-10 h-10 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Property Not Found</h2>
          <p className="text-muted-foreground mb-8">{error || "We couldn't find the home you're looking for."}</p>
          <Button onClick={() => navigate("/homes")} size="lg">Browse Other Homes</Button>
        </div>
      </Layout>
    );
  }

  const currencyStr = home.currency || "INR";

  return (
    <Layout>
      <div className="bg-background min-h-screen pb-20 md:pb-10">
        <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">

          <Link to="/homes" className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 hover:bg-muted text-foreground rounded-full transition-all duration-300 mb-6 font-medium text-sm group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Homes
          </Link>

          {/* Hero Section */}
          <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl mb-12 bg-black group h-[40vh] md:h-[60vh]">
            <div className="absolute inset-0 transition-opacity duration-1000 ease-in-out">
              {homeImages.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`${home.name} ${index + 1}`}
                  className={cn(
                    "absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-in-out",
                    index === currentImageIndex ? "opacity-100 scale-100" : "opacity-0 scale-105"
                  )}
                />
              ))}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 text-white">
              <div className="flex flex-wrap gap-3 mb-4">
                {home.rating > 0 && (
                  <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border-0 py-1.5 px-3">
                    <Star className="w-4 h-4 fill-current mr-1 text-yellow-500" />
                    <span className="font-bold">{home.rating}</span>
                    <span className="ml-1 opacity-80 font-normal">({home.reviewCount} reviews)</span>
                  </Badge>
                )}
                {home.viewCount && home.viewCount > 100 && (
                  <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border-0 py-1.5 px-3">
                    <Eye className="w-4 h-4 mr-1 text-primary-foreground" />
                    Highly Viewed
                  </Badge>
                )}
                {home.highlights?.slice(0, 2).map((h, i) => (
                  <Badge key={i} variant="secondary" className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border-0 py-1.5 px-3">
                    {h}
                  </Badge>
                ))}
              </div>
              <h1 className="text-3xl md:text-5xl lg:text-7xl font-serif font-bold text-white mb-3 text-shadow-sm tracking-tight">
                {home.name}
              </h1>
              <div className="flex items-center gap-2 text-white/90 text-sm md:text-lg">
                <MapPin className="w-5 h-5 text-primary-foreground" />
                <span className="font-medium">{home.address}, {home.city}, {home.state} {home.pincode}</span>
              </div>
            </div>

            {home.virtualTourUrl && (
              <a href={home.virtualTourUrl} target="_blank" rel="noreferrer" className="absolute top-6 right-6 bg-white/20 hover:bg-white/40 backdrop-blur-lg rounded-full px-5 py-2.5 flex items-center gap-2 text-white font-semibold transition-all shadow-xl">
                <PlayCircle className="w-5 h-5" /> Virtual Tour
              </a>
            )}

            {/* Gallery Navigation Controls (Desktop) */}
            <div className="absolute bottom-12 right-12 hidden md:flex gap-2">
              {homeImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImageIndex(i)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    i === currentImageIndex ? "w-8 bg-primary" : "w-3 bg-white/50 hover:bg-white"
                  )}
                />
              ))}
            </div>

            {/* Mobile Touch Area */}
            <div
              className="absolute inset-0 md:hidden z-10"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

            {/* Main Content Area */}
            <div className="lg:col-span-8 space-y-10">

              {/* Quick Info Bar */}
              <div className="flex flex-wrap items-center gap-4 p-5 bg-card rounded-2xl shadow-sm border border-border/50">
                <div className="flex items-center gap-3 pr-4 border-r border-border/50">
                  <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><Users className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Guests</p>
                    <p className="font-semibold text-foreground">Up to {rooms.length ? Math.max(...rooms.map(r => r.capacity + (r.extraBedCapacity || 0))) : 4}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 pr-4 border-r border-border/50">
                  <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><Bed className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Rooms</p>
                    <p className="font-semibold text-foreground">{rooms.length} Bedrooms</p>
                  </div>
                </div>
                {home.bookingCount && home.bookingCount > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><ShoppingBag className="w-5 h-5" /></div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Popular</p>
                      <p className="font-semibold text-foreground">{home.bookingCount} Bookings</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-4">
                <h2 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
                  About this Property
                </h2>
                {home.shortDesc && (
                  <p className="text-lg font-medium text-foreground/80 leading-relaxed italic border-l-4 border-primary pl-4 py-1">
                    "{home.shortDesc}"
                  </p>
                )}
                <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-muted-foreground leading-loose">
                  {home.description.split('\n').map((paragraph, idx) => (
                    <p key={idx} className="mb-4">{paragraph}</p>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div className="space-y-6">
                <h2 className="text-2xl font-serif font-bold text-foreground">What this place offers</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {home.amenities.map((amenity, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-4 bg-muted/30 rounded-2xl hover:bg-muted/70 transition-colors border border-border/30">
                      <div className="text-primary">{getAmenityIcon(amenity)}</div>
                      <span className="font-medium text-sm sm:text-base text-foreground/90">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rooms Details */}
              {rooms.length > 0 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-serif font-bold text-foreground mb-6">Accommodations</h2>
                  <div className="grid gap-6">
                    {rooms.map((room) => (
                      <Card key={room.id} className="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col md:flex-row">
                          <div className="md:w-1/3 bg-muted isolate">
                            {room.images?.[0]?.url ? (
                              <img src={room.images[0].url} alt={room.name} className="w-full h-full object-cover min-h-[200px]" />
                            ) : (
                              <div className="w-full h-full min-h-[200px] flex items-center justify-center bg-primary/5">
                                <Bed className="w-12 h-12 text-primary/20" />
                              </div>
                            )}
                          </div>
                          <CardContent className="p-6 md:w-2/3 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-bold">{room.name}</h3>
                                <Badge variant="outline" className="capitalize font-semibold">{room.type}</Badge>
                              </div>
                              {room.description && <p className="text-sm text-muted-foreground mb-4">{room.description}</p>}

                              <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4 text-sm font-medium">
                                <div className="flex items-center gap-1.5"><Users className="w-4 h-4 text-primary" /> Max: {room.capacity + (room.extraBedCapacity || 0)} Guests</div>
                                {room.sizeSqm && <div className="flex items-center gap-1.5"><Maximize className="w-4 h-4 text-primary" /> {room.sizeSqm} m²</div>}
                              </div>

                              {room.amenities?.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {room.amenities.slice(0, 4).map((am, i) => (
                                    <span key={i} className="text-xs bg-muted px-2 py-1 rounded-md text-muted-foreground">{am}</span>
                                  ))}
                                  {room.amenities.length > 4 && <span className="text-xs text-muted-foreground self-center">+{room.amenities.length - 4} more</span>}
                                </div>
                              )}
                            </div>
                            <div className="mt-4 pt-4 border-t border-border/50 flex items-end justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Room Rate</p>
                                <p className="text-xl font-bold text-primary">{currencyStr} {room.pricePerNight.toLocaleString()} <span className="text-sm text-muted-foreground font-normal">/ night</span></p>
                              </div>
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Policies */}
              <div className="space-y-6">
                <h2 className="text-2xl font-serif font-bold text-foreground">Things to know</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Cancellation Policy */}
                  <div className="bg-card p-6 rounded-2xl shadow-sm border border-border/50">
                    <div className="flex items-center gap-3 mb-4">
                      <ShieldCheck className="w-6 h-6 text-primary" />
                      <h3 className="text-lg font-bold">Cancellation Policy</h3>
                    </div>
                    {home.cancellationPolicy ? (
                      <ul className="space-y-3 text-sm text-muted-foreground">
                        <li className="flex gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          <span>Cancel before {home.cancellationPolicy.freeBeforeHours} hours for a {home.cancellationPolicy.refundPercentBefore}% refund.</span>
                        </li>
                        <li className="flex gap-2">
                          <CheckCircle2 className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                          <span>Cancel within {home.cancellationPolicy.freeBeforeHours} hours for a {home.cancellationPolicy.refundPercentAfter}% refund.</span>
                        </li>
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">Free cancellation up to 24 hours before check-in. Non-refundable afterwards.</p>
                    )}
                  </div>

                  {/* House Rules */}
                  <div className="bg-card p-6 rounded-2xl shadow-sm border border-border/50">
                    <div className="flex items-center gap-3 mb-4">
                      <Info className="w-6 h-6 text-primary" />
                      <h3 className="text-lg font-bold">House Rules</h3>
                    </div>
                    <ul className="space-y-3 text-sm text-muted-foreground">
                      <li className="flex gap-2"><ChevronRight className="w-4 h-4 text-primary mt-0.5 shrink-0" /> Check-in: After 2:00 PM</li>
                      <li className="flex gap-2"><ChevronRight className="w-4 h-4 text-primary mt-0.5 shrink-0" /> Checkout: Before 11:00 AM</li>
                      <li className="flex gap-2"><ChevronRight className="w-4 h-4 text-primary mt-0.5 shrink-0" /> No smoking or unregistered guests allowed</li>
                    </ul>
                  </div>
                </div>
              </div>

            </div>

            {/* Sticky Sidebar Widget */}
            <div className="lg:col-span-4 relative mt-10 lg:mt-0">
              <div className="sticky top-24">
                <Card className="border-border/60 shadow-xl overflow-hidden rounded-3xl">
                  {/* Price Header */}
                  <div className="bg-muted/30 p-6 border-b border-border/50">
                    <div className="flex items-end gap-2 mb-2">
                      <span className="text-4xl font-serif font-black text-primary">{currencyStr} {home.basePrice.toLocaleString()}</span>
                      <span className="text-muted-foreground font-medium mb-1">/ night</span>
                    </div>
                    {home.viewCount && home.viewCount > 50 && (
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-full mt-2">
                        <Eye className="w-3.5 h-3.5" /> High Demand Property
                      </div>
                    )}
                  </div>

                  <CardContent className="p-6">
                    <div className="space-y-4">

                      {/* Dates Selector */}
                      <div className="grid grid-cols-2 bg-muted/40 p-1 rounded-xl border border-border/50">
                        <div className="relative p-3">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Check-in</p>
                          <input
                            type="date"
                            className="w-full bg-transparent border-none p-0 text-sm font-semibold focus:outline-none focus:ring-0 text-foreground cursor-pointer"
                            min={new Date().toISOString().split("T")[0]}
                            value={checkIn ? format(checkIn, "yyyy-MM-dd") : ""}
                            onChange={(e) => setCheckIn(e.target.value ? new Date(e.target.value + "T00:00:00") : undefined)}
                          />
                        </div>
                        <div className="relative p-3 border-l border-border/50">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Checkout</p>
                          <input
                            type="date"
                            className="w-full bg-transparent border-none p-0 text-sm font-semibold focus:outline-none focus:ring-0 text-foreground cursor-pointer"
                            min={checkIn ? format(new Date(checkIn.getTime() + 86400000), "yyyy-MM-dd") : new Date().toISOString().split("T")[0]}
                            value={checkOut ? format(checkOut, "yyyy-MM-dd") : ""}
                            onChange={(e) => setCheckOut(e.target.value ? new Date(e.target.value + "T00:00:00") : undefined)}
                          />
                        </div>
                      </div>

                      {/* Guests Selector */}
                      <div className="bg-muted/40 p-1 rounded-xl border border-border/50">
                        <div className="p-3">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Guests</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-foreground">{guests} Guest{guests > 1 ? 's' : ''}</span>
                            <div className="flex items-center gap-3">
                              <button onClick={() => updateGuests(-1)} disabled={guests <= 1} className="w-8 h-8 rounded-full bg-background border flex justify-center items-center hover:bg-muted disabled:opacity-50 transition-colors">
                                <Minus className="w-4 h-4 text-foreground" />
                              </button>
                              <button onClick={() => updateGuests(1)} disabled={rooms.length ? guests >= Math.max(...rooms.map(r => r.capacity + (r.extraBedCapacity || 0))) : guests >= 4} className="w-8 h-8 rounded-full bg-background border flex justify-center items-center hover:bg-muted disabled:opacity-50 transition-colors">
                                <Plus className="w-4 h-4 text-foreground" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Summary Pricing (Visible if dates selected) */}
                      {nights > 0 && (
                        <div className="pt-4 mt-2 border-t border-border/50 space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{currencyStr} {home.basePrice.toLocaleString()} x {nights} night{nights > 1 ? 's' : ''}</span>
                            <span className="font-medium text-foreground">{currencyStr} {(home.basePrice * nights).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground underline decoration-dotted">Taxes & fees</span>
                            <span className="font-medium text-foreground">Calculated at checkout</span>
                          </div>
                          <div className="flex justify-between font-bold text-lg pt-3 border-t border-border/50">
                            <span>Total</span>
                            <span className="text-primary">{currencyStr} {(home.basePrice * nights).toLocaleString()}</span>
                          </div>
                        </div>
                      )}

                      <Button
                        size="xl"
                        onClick={handleBooking}
                        disabled={!checkIn || !checkOut || isProcessingPayment}
                        className="w-full h-14 text-lg font-bold rounded-2xl bg-primary hover:bg-primary/90 mt-4 shadow-lg shadow-primary/30 transition-all hover:-translate-y-1"
                      >
                        {isProcessingPayment ? (
                          <span className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processing...
                          </span>
                        ) : "Reserve Now"}
                      </Button>
                      <p className="text-center text-xs text-muted-foreground font-medium">You won't be charged yet</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HomeDetails;
