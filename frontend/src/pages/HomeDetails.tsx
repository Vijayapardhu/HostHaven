import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Star, MapPin, Bed, Users, ArrowLeft, Calendar as CalendarIcon, Wifi, CalendarDays, Minus, Plus } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { createBookingPayment } from "@/lib/razorpay";
import api from "@/lib/api";
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

interface PropertyRoom {
  id: string;
  name: string;
  pricePerNight: number;
  capacity: number;
}

interface PropertyData {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  basePrice: number;
  rating: number;
  reviewCount: number;
  description: string;
  images: Array<{ url: string; alt?: string; isPrimary?: boolean }>;
  amenities: string[];
  rooms?: PropertyRoom[];
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
  const [guests, setGuests] = useState(2);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);
  const [isGuestsOpen, setIsGuestsOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const { toast } = useToast();

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

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const updateGuests = (delta: number) => {
    const maxGuests = rooms.length
      ? Math.max(...rooms.map((room) => room.capacity))
      : 4;
    setGuests((prev) => Math.max(1, Math.min(maxGuests, prev + delta)));
  };

  const handleBooking = async () => {
    // Check if user is logged in
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to book this property",
        variant: "destructive",
      });
      // Redirect to login page after a short delay
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

    if (!home) {
      toast({
        title: "Home Unavailable",
        description: "Home details are not available right now.",
        variant: "destructive",
      });
      return;
    }

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
        notes: {
          propertyId: home.id,
          roomId: roomId || "",
        },
      });

      if (result.success) {
        if (result.response?.razorpay_order_id && result.response?.razorpay_payment_id && result.response?.razorpay_signature) {
          await api.payments.verify({
            razorpay_order_id: result.response.razorpay_order_id,
            razorpay_payment_id: result.response.razorpay_payment_id,
            razorpay_signature: result.response.razorpay_signature,
          });
        }
        toast({
          title: "Booking Successful! 🎉",
          description: `Your booking for ${home.name} has been confirmed. Payment ID: ${result.paymentId}`,
        });
        
        // Reset booking form
        setCheckIn(undefined);
        setCheckOut(undefined);
        setGuests(1);
      } else {
        if (bookingId) {
          const cancelResult = await api.bookings.cancel(bookingId, "Payment failed");
          toast({
            title: "Booking Cancelled",
            description: cancelResult?.booking?.status
              ? `Booking status updated to ${cancelResult.booking.status}.`
              : "Booking was cancelled due to payment failure.",
          });
        }
        if (lockAcquired && roomId) {
          await api.inventory.release({ roomId });
        }
        toast({
          title: "Payment Failed",
          description: result.error || "Unable to process payment. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      if (rooms[0]?.id) {
        await api.inventory.release({ roomId: rooms[0].id });
      }
      if (typeof bookingId === "string") {
        const cancelResult = await api.bookings.cancel(bookingId, "Payment failed");
        toast({
          title: "Booking Cancelled",
          description: cancelResult?.booking?.status
            ? `Booking status updated to ${cancelResult.booking.status}.`
            : "Booking was cancelled due to payment failure.",
        });
      }
      toast({
        title: "Booking Error",
        description: "An unexpected error occurred. Please try again.",
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
      setError(null);
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


  // Auto-scroll functionality
  useEffect(() => {
    if (!homeImages.length) return;
    const startAutoScroll = () => {
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
      }
      autoScrollInterval.current = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % homeImages.length);
      }, 3500);
    };

    startAutoScroll();
    return () => {
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
      }
    };
  }, [homeImages.length]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || homeImages.length === 0) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setCurrentImageIndex((prev) => (prev + 1) % homeImages.length);
    }
    if (isRightSwipe) {
      setCurrentImageIndex((prev) => (prev - 1 + homeImages.length) % homeImages.length);
    }

    // Reset auto-scroll after manual swipe
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
    }
    autoScrollInterval.current = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % homeImages.length);
    }, 3500);

    setTouchStart(0);
    setTouchEnd(0);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="py-16 text-center text-muted-foreground">Loading home details...</div>
      </Layout>
    );
  }

  if (error || !home) {
    return (
      <Layout>
        <div className="py-16 text-center">
          <p className="text-lg font-semibold">Unable to load home</p>
          <p className="text-sm text-muted-foreground mt-2">{error || "Home not found"}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-4 md:py-6">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <Link to="/homes" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4 md:mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Homes
          </Link>

          {/* Images - Vertical on mobile, Grid on desktop */}
          <div className="mb-4 md:mb-8">
            {/* Mobile: Horizontal scroll gallery */}
            <div className="md:hidden -mx-4 px-4">
              <div 
                className="relative rounded-xl overflow-hidden aspect-[4/3] bg-muted"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {homeImages.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`${home.name} ${index + 1}`}
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
                      index === currentImageIndex
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-105 blur-sm"
                    }`}
                  />
                ))}
              </div>
              <div className="flex justify-center gap-1.5 mt-3">
                {homeImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentImageIndex
                        ? "w-6 bg-primary"
                        : "w-2 bg-primary/30"
                    }`}
                    aria-label={`View image ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Desktop: Grid layout */}
            <div className="hidden md:grid grid-cols-3 gap-4">
              <div className="col-span-2 rounded-2xl overflow-hidden aspect-[16/10]">
                <img
                  src={homeImages[0]}
                  alt={home.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="grid grid-rows-2 gap-4">
                {homeImages.slice(1, 3).map((img, index) => (
                  <div key={index} className="rounded-2xl overflow-hidden">
                    <img
                      src={img}
                      alt={`${home.name} ${index + 2}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4 md:space-y-8">
              {/* Header */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2.5 py-0.5 md:px-3 md:py-1">
                    <Star className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current" />
                    <span className="text-sm md:text-base font-medium">{home.rating}</span>
                  </div>
                  <span className="text-muted-foreground text-xs md:text-sm">({home.reviewCount} reviews)</span>
                </div>
                <h1 className="text-xl md:text-4xl font-serif font-bold text-foreground">
                  {home.name}
                </h1>
                <div className="flex items-center gap-2 text-muted-foreground mt-2 text-sm md:text-base">
                  <MapPin className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  {home.address}, {home.city}
                </div>
              </div>

              {/* Property Details */}
              <div className="flex items-center gap-4 md:gap-6 p-3 md:p-4 bg-card rounded-xl shadow-card">
                <div className="flex items-center gap-2">
                  <Bed className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  <span className="text-sm md:text-base font-medium">{rooms.length} Rooms</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  <span className="text-sm md:text-base font-medium">
                    Up to {rooms.length ? Math.max(...rooms.map((room) => room.capacity)) : 4} Guests
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="text-lg md:text-xl font-serif font-semibold text-foreground mb-2 md:mb-3">About this Home</h2>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{home.description}</p>
              </div>

              {/* Amenities */}
              <div>
                <h2 className="text-lg md:text-xl font-serif font-semibold text-foreground mb-3 md:mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                  {home.amenities.slice(0, 12).map((amenity) => (
                    <div key={amenity} className="flex items-center gap-2 md:gap-3 bg-card rounded-xl p-3 md:p-4 shadow-card">
                      <Wifi className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                      <span className="text-xs md:text-sm font-medium">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {home.reviews?.length ? (
                <div>
                  <h2 className="text-lg md:text-xl font-serif font-semibold text-foreground mb-3 md:mb-4">Guest Reviews</h2>
                  <div className="space-y-4">
                    {home.reviews.slice(0, 4).map((review) => (
                      <div key={review.id} className="rounded-xl bg-card p-4 shadow-card">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                            <span className="text-sm font-semibold">
                              {(review.user?.name || "G").charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{review.user?.name || "Guest"}</p>
                            <p className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="ml-auto flex items-center gap-1 text-primary">
                            <Star className="h-4 w-4 fill-current" />
                            <span className="text-sm font-semibold">{review.rating.toFixed(1)}</span>
                          </div>
                        </div>
                        {review.comment ? (
                          <p className="mt-3 text-sm text-muted-foreground">{review.comment}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Booking Card */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl md:rounded-2xl shadow-card p-4 md:p-6 lg:sticky lg:top-24">
                <div className="text-center mb-4 md:mb-6">
                  <p className="text-muted-foreground text-xs md:text-sm">Per night</p>
                  <p className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                    ₹{home.basePrice.toLocaleString()}
                  </p>
                  {nights > 0 && (
                    <div className="mt-2 inline-flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-3 py-1">
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span className="text-xs font-semibold">{nights} Night{nights > 1 ? 's' : ''}</span>
                       <span className="text-xs">• ₹{(home.basePrice * nights).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {home.latitude && home.longitude ? (
                  <div className="mt-6 rounded-xl overflow-hidden border border-border">
                    <iframe
                      title="Home location"
                      src={`https://www.google.com/maps?q=${home.latitude},${home.longitude}&z=14&output=embed`}
                      className="w-full h-48"
                      loading="lazy"
                    />
                  </div>
                ) : null}

                <div className="space-y-3 md:space-y-4">
                  {/* Mobile: Drawer inputs */}
                  <div className="md:hidden grid grid-cols-2 gap-2">
                    <Drawer open={isCheckInOpen} onOpenChange={setIsCheckInOpen}>
                      <button
                        onClick={() => setIsCheckInOpen(true)}
                        className="flex items-center gap-2 p-2.5 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-left"
                      >
                        <CalendarDays className="w-4 h-4 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-muted-foreground font-medium">Check In</p>
                          <p className={cn(
                            "text-xs font-medium truncate",
                            !checkIn && "text-muted-foreground"
                          )}>
                            {checkIn ? format(checkIn, "MMM dd") : "Select"}
                          </p>
                        </div>
                      </button>
                      <DrawerContent className="max-h-[85vh]">
                        <DrawerHeader className="text-left">
                          <DrawerTitle className="text-lg font-semibold">Select Check-In Date</DrawerTitle>
                          <DrawerDescription className="text-sm">Choose your arrival date</DrawerDescription>
                        </DrawerHeader>
                        <div className="px-4 pb-6 flex justify-center">
                          <div className="bg-card rounded-2xl p-4 shadow-sm">
                            <Calendar
                              mode="single"
                              selected={checkIn}
                              onSelect={(date) => {
                                setCheckIn(date);
                                setIsCheckInOpen(false);
                              }}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </div>
                        </div>
                      </DrawerContent>
                    </Drawer>

                    <Drawer open={isCheckOutOpen} onOpenChange={setIsCheckOutOpen}>
                      <button
                        onClick={() => setIsCheckOutOpen(true)}
                        className="flex items-center gap-2 p-2.5 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-left"
                      >
                        <CalendarDays className="w-4 h-4 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-muted-foreground font-medium">Check Out</p>
                          <p className={cn(
                            "text-xs font-medium truncate",
                            !checkOut && "text-muted-foreground"
                          )}>
                            {checkOut ? format(checkOut, "MMM dd") : "Select"}
                          </p>
                        </div>
                      </button>
                      <DrawerContent className="max-h-[85vh]">
                        <DrawerHeader className="text-left">
                          <DrawerTitle className="text-lg font-semibold">Select Check-Out Date</DrawerTitle>
                          <DrawerDescription className="text-sm">
                            {checkIn ? `Check-in: ${format(checkIn, "MMM dd, yyyy")}` : "Choose your departure date"}
                          </DrawerDescription>
                        </DrawerHeader>
                        <div className="px-4 pb-6 flex justify-center">
                          <div className="bg-card rounded-2xl p-4 shadow-sm">
                            <Calendar
                              mode="single"
                              selected={checkOut}
                              onSelect={(date) => {
                                setCheckOut(date);
                                setIsCheckOutOpen(false);
                              }}
                              disabled={(date) => date < (checkIn || new Date())}
                              modifiers={checkIn ? { checkInDate: checkIn } : {}}
                              modifiersClassNames={{
                                checkInDate: "bg-primary/20 text-primary font-semibold border-2 border-primary"
                              }}
                              initialFocus
                            />
                          </div>
                        </div>
                      </DrawerContent>
                    </Drawer>
                  </div>

                  {/* Desktop: Simple inputs */}
                  <div className="hidden md:grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                      <CalendarIcon className="w-4 h-4 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-muted-foreground font-medium">Check In</p>
                        <input type="date" className="w-full bg-transparent border-0 p-0 text-xs font-medium focus:outline-none" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                      <CalendarIcon className="w-4 h-4 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-muted-foreground font-medium">Check Out</p>
                        <input type="date" className="w-full bg-transparent border-0 p-0 text-xs font-medium focus:outline-none" />
                      </div>
                    </div>
                  </div>

                  {/* Guests - Mobile Drawer */}
                  <div className="md:hidden">
                    <Drawer open={isGuestsOpen} onOpenChange={setIsGuestsOpen}>
                      <button
                        onClick={() => setIsGuestsOpen(true)}
                        className="w-full flex items-center gap-2 p-2.5 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-left"
                      >
                        <Users className="w-4 h-4 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-muted-foreground font-medium">Guests</p>
                          <p className="text-xs font-medium">
                            {guests} Guest{guests > 1 ? "s" : ""}
                          </p>
                        </div>
                      </button>
                      <DrawerContent className="max-h-[85vh]">
                        <DrawerHeader className="text-left">
                          <DrawerTitle className="text-lg font-semibold">Select Guests</DrawerTitle>
                          <DrawerDescription className="text-sm">Number of guests staying</DrawerDescription>
                        </DrawerHeader>
                        <div className="px-6 pb-6">
                          <div className="bg-card rounded-2xl p-8 shadow-sm">
                            <div className="flex items-center justify-between max-w-xs mx-auto">
                              <button
                                onClick={() => updateGuests(-1)}
                                disabled={guests <= 1}
                                className="w-14 h-14 rounded-full bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-sm"
                              >
                                <Minus className="w-5 h-5" />
                              </button>
                              <div className="text-center">
                                <span className="text-4xl font-bold text-foreground">{guests}</span>
                                <p className="text-xs text-muted-foreground mt-1">Guest{guests > 1 ? "s" : ""}</p>
                              </div>
                              <button
                                onClick={() => updateGuests(1)}
                               disabled={
                                 guests >=
                                 (rooms.length ? Math.max(...rooms.map((room) => room.capacity)) : 4)
                               }
                                className="w-14 h-14 rounded-full bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-sm"
                              >
                                <Plus className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <DrawerFooter className="pt-2">
                          <Button onClick={() => setIsGuestsOpen(false)} className="w-full" size="lg">
                            Done
                          </Button>
                        </DrawerFooter>
                      </DrawerContent>
                    </Drawer>
                  </div>

                  {/* Guests - Desktop Select */}
                  <div className="hidden md:block">
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                      <Users className="w-4 h-4 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-muted-foreground font-medium">Guests</p>
                        <select className="w-full bg-transparent border-0 p-0 text-xs font-medium focus:outline-none appearance-none cursor-pointer">
                          {Array.from({ length: rooms.length ? Math.max(...rooms.map((room) => room.capacity)) : 4 }, (_, i) => i + 1).map((num) => (
                            <option key={num} value={num}>{num} Guest{num > 1 ? "s" : ""}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="hero" 
                    className="w-full" 
                    size="xl"
                    onClick={handleBooking}
                    disabled={!checkIn || !checkOut || isProcessingPayment}
                  >
                    {isProcessingPayment ? "Processing..." : "Book Now"}
                  </Button>
                </div>

                <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-border text-center">
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Free cancellation up to 24 hours before check-in
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HomeDetails;
