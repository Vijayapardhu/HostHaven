import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { format, addDays, parseISO } from "date-fns";
import { 
  Star, MapPin, Bed, Users, ArrowLeft, Calendar as CalendarIcon,
  Minus, Plus, X, ImageIcon, Share2, Heart, Check,
  Clock, Shield, Car, Waves, Snowflake, Tv, Coffee, Wind,
  ChevronLeft, ChevronRight, Info, Wifi, UtensilsCrossed, Dumbbell
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { api } from "@/lib/api";
import { Calendar } from "@/components/ui/calendar";
import { cn, formatCity } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { RoomCard } from "@/components/room/RoomCard";
import { PropertyReviews } from "@/components/review/PropertyReviews";
import SEOHead from "@/components/SEOHead";
import { 
  useBookingFlow, 
  VideoModal, 
  LoginPromptModal 
} from "@/components/booking/BookingFlowHandler";

interface PropertyRoom {
  id: string;
  name: string;
  description?: string;
  type?: string;
  capacity: number;
  extraBedCapacity?: number;
  sizeSqm?: number;
  pricePerNight: number;
  amenities: string[];
  images?: Array<{ url: string; alt?: string }>;
  video?: string;
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
  rooms?: PropertyRoom[];
  cancellationPolicy?: CancellationPolicy;
  latitude?: number;
  longitude?: number;
  slug?: string;
  // SEO fields from database
  metaTitle?: string;
  metaDesc?: string;
}

const amenityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-5 h-5" />,
  restaurant: <UtensilsCrossed className="w-5 h-5" />,
  parking: <Car className="w-5 h-5" />,
  gym: <Dumbbell className="w-5 h-5" />,
  pool: <Waves className="w-5 h-5" />,
  ac: <Snowflake className="w-5 h-5" />,
  "air-conditioner": <Snowflake className="w-5 h-5" />,
  tv: <Tv className="w-5 h-5" />,
  breakfast: <Coffee className="w-5 h-5" />,
  "room-service": <Clock className="w-5 h-5" />,
  "wind-fan": <Wind className="w-5 h-5" />,
};

const getAmenityIcon = (name: string) => {
  const key = name.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  return amenityIcons[key] || <Check className="w-5 h-5" />;
};

const HomeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();
  
  const [home, setHome] = useState<PropertyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Gallery state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  // Touch swipe support
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  // Calendar modal state
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState<"checkIn" | "checkOut">("checkIn");
  
  // Tabs
  const [activeTab, setActiveTab] = useState("overview");
  
  // Booking state - Initialize from URL params
  const [checkIn, setCheckIn] = useState<Date | undefined>(() => {
    const param = searchParams.get("checkIn");
    return param ? parseISO(param) : addDays(new Date(), 1);
  });
  const [checkOut, setCheckOut] = useState<Date | undefined>(() => {
    const param = searchParams.get("checkOut");
    return param ? parseISO(param) : addDays(new Date(), 2);
  });
  const [guests, setGuests] = useState(() => {
    const param = searchParams.get("guests");
    if (!param) return 1;
    const parsed = parseInt(param);
    return isNaN(parsed) ? 1 : parsed;
  });

  // Booking flow hook
  const {
    showVideo,
    hasWatchedVideo,
    showLoginPrompt,
    currentVideoUrl,
    currentRoomId,
    videoRef,
    handleRoomBook,
    handleQuickBook,
    handleLoginRedirect,
    handleCloseVideo,
    handleVideoTimeUpdate,
    handleVideoEnded,
    proceedToBooking,
    setShowLoginPrompt,
  } = useBookingFlow(id || "", "homes");

  const homeImages = useMemo(() => {
    if (!home?.images?.length) return [];
    return home.images.map((image) => image.url);
  }, [home]);

  const rooms = useMemo(() => home?.rooms || [], [home]);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  }, [checkIn, checkOut]);

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

  // Keyboard navigation for gallery
  useEffect(() => {
    if (!showGallery) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setCurrentImageIndex((prev) => (prev - 1 + homeImages.length) % homeImages.length);
      } else if (e.key === "ArrowRight") {
        setCurrentImageIndex((prev) => (prev + 1) % homeImages.length);
      } else if (e.key === "Escape") {
        setShowGallery(false);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showGallery, homeImages.length]);

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setTouchEnd(e.changedTouches[0].clientX);
    if (touchStart && e.changedTouches[0].clientX) {
      const swipeDistance = touchStart - e.changedTouches[0].clientX;
      if (Math.abs(swipeDistance) > 50) {
        if (swipeDistance > 0) {
          // Swipe left - next image
          setCurrentImageIndex((prev) => (prev + 1) % homeImages.length);
        } else {
          // Swipe right - previous image
          setCurrentImageIndex((prev) => (prev - 1 + homeImages.length) % homeImages.length);
        }
      }
    }
  };

  const scrollToRooms = () => {
    document.getElementById("rooms-section")?.scrollIntoView({ behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (error || !home) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
            <Info className="w-10 h-10 text-destructive" />
          </div>
          <p className="text-lg font-semibold">{error || "Property not found"}</p>
          <Button onClick={() => navigate("/homes")} className="mt-4">Back to Homestays</Button>
        </div>
      </Layout>
    );
  }

  const currencyStr = home.currency || "₹";
  const lowestPrice = rooms.length > 0 ? Math.min(...rooms.map(r => r.pricePerNight ?? Infinity)) : (home.basePrice ?? 0);
  const safeLowest = lowestPrice === Infinity ? 0 : (lowestPrice ?? 0);

  const wishlistItem = {
    id: home.id,
    type: "home" as const,
    name: home.name,
    location: `${formatCity(home.city)}, ${home.state}`,
    image: home.images?.[0]?.url || "",
    price: lowestPrice,
    rating: home.rating,
  };

  const liked = isInWishlist(home.id, "home");

  const handleToggleLike = () => {
    toggleWishlist(wishlistItem);
    toast({
      title: liked ? "Removed from wishlist" : "Added to wishlist",
      description: liked ? "This home is no longer in your wishlist." : "This home was added to your wishlist.",
    });
  };

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);

    const shareData = {
      title: home.name,
      text: `${home.name} in ${formatCity(home.city)}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareData.url);
        toast({
          title: "Link copied",
          description: "Home link copied to clipboard.",
        });
      } else {
        toast({
          title: "Share not supported",
          description: "Your browser does not support sharing on this page.",
          variant: "destructive",
        });
      }
    } catch {
      // User cancellation from native share sheet is a normal flow.
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Layout>
      <SEOHead
        title={home.metaTitle || `${home.name} - Homestay in ${formatCity(home.city)}`}
        description={home.metaDesc || `${home.name} in ${formatCity(home.city)}, ${home.state}. Explore amenities, room options, and secure booking on HostHaven.`}
        keywords={`${home.name}, homes in ${formatCity(home.city).toLowerCase()}, ${formatCity(home.city).toLowerCase()} homestay booking, HostHaven`}
        canonical={`https://hosthaven.in/homes/${home.slug || id}`}
        ogImage={home.images?.[0]?.url || "/logo.png"}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "LodgingBusiness",
          name: home.name,
          image: home.images?.map((img) => img.url).filter(Boolean),
          address: {
            "@type": "PostalAddress",
            addressLocality: formatCity(home.city),
            addressRegion: home.state,
            streetAddress: home.address,
            addressCountry: "IN",
          },
          aggregateRating: home.reviewCount > 0
            ? {
                "@type": "AggregateRating",
                ratingValue: home.rating,
                reviewCount: home.reviewCount,
              }
            : undefined,
          url: `https://hosthaven.in/homes/${home.slug || id}`,
        }}
      />
      {/* Hero Gallery Section */}
      <div className="relative">
        {/* Mobile: Horizontal scroll */}
        <div className="md:hidden">
          <div className="relative aspect-[4/3] overflow-hidden bg-muted" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            {homeImages.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`${home.name} ${index + 1}`}
                className={cn(
                  "absolute inset-0 w-full h-full object-cover transition-all duration-500",
                  index === currentImageIndex ? "opacity-100" : "opacity-0"
                )}
              />
            ))}
            
            {/* Top actions */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between z-10">
              <button
                onClick={() => navigate("/homes")}
                title="Back to homes"
                aria-label="Back to homes"
                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleShare}
                  disabled={isSharing}
                  title="Share home"
                  aria-label="Share home"
                  className="w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg disabled:opacity-60"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <button
                  onClick={handleToggleLike}
                  title={liked ? "Remove from wishlist" : "Add to wishlist"}
                  aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
                  className="w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg"
                >
                  <Heart className={cn("w-5 h-5", liked ? "fill-primary text-primary" : "text-foreground")} />
                </button>
              </div>
            </div>

            {/* Image counter */}
            <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              {currentImageIndex + 1}/{homeImages.length}
            </div>

            {/* Swipe dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {homeImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  title={`Show image ${index + 1}`}
                  aria-label={`Show image ${index + 1}`}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    index === currentImageIndex ? "w-6 bg-white" : "w-2 bg-white/50"
                  )}
                />
              ))}
            </div>
          </div>
          
          {/* Title below carousel */}
          <div className="p-4 bg-background border-b">
            <div className="flex items-center gap-2 mb-2">
              {home.rating > 0 && (
                <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <Star className="w-4 h-4 fill-current" />
                  {home.rating} ({home.reviewCount})
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-1">{home.name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              {formatCity(home.city)}, {home.state}
            </div>
          </div>
        </div>

        {/* Desktop: Grid gallery */}
        <div className="hidden md:block">
          <div className="grid grid-cols-4 grid-rows-2 gap-2 h-48 md:h-64 lg:h-96">
            <div className="col-span-2 row-span-2 relative rounded-l-2xl overflow-hidden group cursor-pointer" onClick={() => setShowGallery(true)}>
              <img src={homeImages[0]} alt={home.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> View all photos
              </div>
            </div>
            {homeImages.slice(1, 5).map((img, index) => (
              <div key={index} className={cn("relative overflow-hidden group cursor-pointer", index === 1 ? "rounded-tr-2xl" : index === 3 ? "rounded-br-2xl" : "")} onClick={() => setShowGallery(true)}>
                <img src={img} alt={`${home.name} ${index + 2}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                {index === 3 && homeImages.length > 5 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">+{homeImages.length - 5}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Gallery Modal */}
        {showGallery && (
          <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <button
              onClick={() => setShowGallery(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition"
              title="Close gallery"
              aria-label="Close gallery"
            >
              <X className="w-6 h-6" />
            </button>
            <button
              onClick={() => setCurrentImageIndex((prev) => (prev - 1 + homeImages.length) % homeImages.length)}
              className="absolute left-4 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition"
              title="Previous image"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onClick={() => setCurrentImageIndex((prev) => (prev + 1) % homeImages.length)}
              className="absolute right-4 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition"
              title="Next image"
              aria-label="Next image"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
            <img src={homeImages[currentImageIndex]} alt={`${home.name} ${currentImageIndex + 1}`} className="max-w-full max-h-full object-contain" />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {homeImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    index === currentImageIndex ? "w-8 bg-white" : "bg-white/50"
                  )}
                  title={`Go to image ${index + 1}`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
            <div className="absolute top-4 left-4 text-white text-sm bg-black/30 px-3 py-1 rounded-full">
              {currentImageIndex + 1} / {homeImages.length}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Content */}
          <div className="flex-1 lg:max-w-[65%]">
            {/* Header Info */}
            <div className="mb-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1 bg-amber-100 text-amber-700 rounded-full px-2.5 py-0.5">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-semibold">{home.rating}</span>
                    </div>
                    <span className="text-muted-foreground">({home.reviewCount} reviews)</span>
                    {home.bookingCount && home.bookingCount > 0 && (
                      <span className="text-muted-foreground">• {home.bookingCount} bookings</span>
                    )}
                  </div>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2">
                    {home.name}
                  </h1>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span>{home.address}, {formatCity(home.city)}, {home.state} {home.pincode}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-4 mb-6 py-4 border-y">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Up to {rooms.length ? Math.max(...rooms.map(r => r.capacity + (r.extraBedCapacity || 0))) : 4} Guests</p>
                  <p className="text-xs text-muted-foreground">Per night</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bed className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{rooms.length} Bedrooms</p>
                  <p className="text-xs text-muted-foreground">Available</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Secure Booking</p>
                  <p className="text-xs text-muted-foreground">Free cancellation</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b mb-6 sticky top-0 bg-background z-10 -mx-4 px-4 md:mx-0 md:px-0">
              <div className="flex gap-6 overflow-x-auto scrollbar-hide">
                {["overview", "rooms", "reviews", "location"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      if (tab === "rooms") scrollToRooms();
                      if (tab === "reviews") document.getElementById("reviews-section")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className={cn(
                      "pb-3 text-sm font-medium capitalize border-b-2 transition-colors whitespace-nowrap",
                      activeTab === tab
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* About */}
                <section>
                  <h2 className="text-xl font-bold mb-4">About this place</h2>
                  {home.shortDesc && (
                    <p className="text-lg text-foreground/80 italic border-l-4 border-primary pl-4 py-2 mb-4">
                      "{home.shortDesc}"
                    </p>
                  )}
                  <p className="text-muted-foreground leading-relaxed">{home.description}</p>
                </section>

                {/* Amenities */}
                <section>
                  <h2 className="text-xl font-bold mb-4">What this place offers</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {home.amenities.map((amenity) => (
                      <div key={amenity} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                        <div className="text-primary">{getAmenityIcon(amenity)}</div>
                        <span className="text-sm font-medium capitalize">{amenity.replace(/-/g, " ")}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Policies */}
                <section>
                  <h2 className="text-xl font-bold mb-4">Things to know</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-muted/50 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold">Cancellation</h3>
                      </div>
                      {home.cancellationPolicy ? (
                        <p className="text-sm text-muted-foreground">
                          Free cancellation up to {home.cancellationPolicy.freeBeforeHours} hours before check-in.
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Free cancellation up to 24 hours before check-in.</p>
                      )}
                    </div>
                    <div className="bg-muted/50 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold">House Rules</h3>
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>Check-in: After 2:00 PM</li>
                        <li>Checkout: Before 11:00 AM</li>
                        <li>No smoking</li>
                      </ul>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === "rooms" && (
              <section id="rooms-section">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Available Rooms</h2>
                  <p className="text-muted-foreground">{rooms.length} room types</p>
                </div>
                <div className="space-y-4">
                  {rooms.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={{
                        ...room,
                        video: room.video,
                        images: room.images
                      }}
                      hotelId={home.id}
                      checkIn={checkIn}
                      checkOut={checkOut}
                      guests={guests}
                      onBookNow={(roomId) => {
                        handleRoomBook(roomId, room.video);
                      }}
                    />
                  ))}
                </div>
              </section>
            )}

            {activeTab === "reviews" && (
              <section id="reviews-section">
                <h2 className="text-xl font-bold mb-6">Guest Reviews</h2>
                <PropertyReviews propertyId={home.id} />
              </section>
            )}

            {activeTab === "location" && (
              <section>
                <h2 className="text-xl font-bold mb-4">Location</h2>
                <div className="rounded-2xl overflow-hidden h-[300px] bg-muted">
                  {home.latitude && home.longitude ? (
                    <iframe
                      title="Property location"
                      src={`https://www.google.com/maps?q=${home.latitude},${home.longitude}&z=14&output=embed`}
                      className="w-full h-full"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      Location not available
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span>{home.address}, {home.city}, {home.state} {home.pincode}</span>
                </div>
              </section>
            )}
          </div>

          {/* Right Sidebar - Booking Card */}
          <div className="lg:w-[35%] lg:max-w-[400px]">
            <div className="bg-white rounded-2xl shadow-xl border sticky top-24 overflow-hidden">
              {/* Price Header */}
              <div className="bg-gradient-to-r from-primary to-primary/80 p-4 text-white">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-3xl font-bold">{currencyStr}{safeLowest.toLocaleString('en-IN')}</span>
                    <span className="text-white/80"> /night</span>
                  </div>
                  {nights > 0 && (
                    <div className="text-right">
                      <span className="text-sm">Total: </span>
                      <span className="font-bold">{currencyStr}{(safeLowest * nights).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Booking Form */}
              <div className="p-4 space-y-4">
                {/* Date Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setCalendarTarget("checkIn");
                      setShowCalendarModal(true);
                    }}
                    className="text-left md:pointer-events-none"
                  >
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Check-in</label>
                    <div className="border rounded-xl p-3 cursor-pointer hover:border-primary/50 transition md:cursor-default md:hover:border-border flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-primary flex-shrink-0" />
                      <div>
                        <span className="text-sm font-medium block">
                          {checkIn ? format(checkIn, "MMM dd") : "Select"}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {checkIn ? format(checkIn, "EEE") : ""}
                        </p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setCalendarTarget("checkOut");
                      setShowCalendarModal(true);
                    }}
                    className="text-left md:pointer-events-none"
                  >
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Check-out</label>
                    <div className="border rounded-xl p-3 cursor-pointer hover:border-primary/50 transition md:cursor-default md:hover:border-border flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-primary flex-shrink-0" />
                      <div>
                        <span className="text-sm font-medium block">
                          {checkOut ? format(checkOut, "MMM dd") : "Select"}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {checkOut ? format(checkOut, "EEE") : ""}
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Calendar - Desktop only */}
                <div className="hidden md:block border rounded-xl overflow-hidden">
                  <Calendar
                    mode="range"
                    selected={{ from: checkIn, to: checkOut }}
                    onSelect={(range) => {
                      setCheckIn(range?.from);
                      setCheckOut(range?.to);
                    }}
                    disabled={(date) => date < new Date()}
                    numberOfMonths={1}
                  />
                </div>

                {/* Guests */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Guests</label>
                  <div className="flex items-center justify-between border rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">{guests} Guest{guests > 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setGuests(Math.max(1, guests - 1))}
                        title="Decrease guests"
                        aria-label="Decrease guests"
                        className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-muted"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setGuests(Math.min(10, guests + 1))}
                        title="Increase guests"
                        aria-label="Increase guests"
                        className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-muted"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Price Breakdown */}
                {nights > 0 && (
                  <div className="space-y-2 py-3 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{currencyStr}{safeLowest.toLocaleString('en-IN')} x {nights} night{nights > 1 ? "s" : ""}</span>
                      <span>{currencyStr}{(safeLowest * nights).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taxes & fees</span>
                      <span>{currencyStr}{Math.round(safeLowest * nights * 0.12).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between font-bold pt-2 border-t">
                      <span>Total</span>
                      <span>{currencyStr}{Math.round(safeLowest * nights * 1.12).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}

                {/* Book Button */}
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    if (rooms.length > 0) {
                      document.getElementById("rooms-section")?.scrollIntoView({ behavior: "smooth" });
                      setActiveTab("rooms");
                    } else {
                      handleQuickBook();
                    }
                  }}
                >
                  {rooms.length > 0 ? "Select Room to Book" : "Book Now"}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  You won't be charged yet
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      <VideoModal
        isOpen={showVideo}
        videoUrl={currentVideoUrl || ""}
        onClose={handleCloseVideo}
        onTimeUpdate={handleVideoTimeUpdate}
        onEnded={handleVideoEnded}
        hasWatched={hasWatchedVideo}
        videoRef={videoRef as any}
        onProceed={() => {
          handleCloseVideo();
          const params = new URLSearchParams(window.location.search);
          if (currentRoomId) params.set("roomId", currentRoomId);
          navigate(`/booking/${home.id}?${params.toString()}`);
        }}
      />

      {/* Login Prompt Modal */}
      <LoginPromptModal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        onLogin={handleLoginRedirect}
      />

      {/* Calendar Bottom Drawer Modal - Mobile Only */}
      {showCalendarModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:hidden">
          <div className="w-full bg-background rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {calendarTarget === "checkIn" ? "Select Check-in" : "Select Check-out"}
              </h2>
              <button
                onClick={() => setShowCalendarModal(false)}
                className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"
                aria-label="Close calendar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Calendar */}
            <div className="p-4">
              <Calendar
                mode="single"
                selected={calendarTarget === "checkIn" ? checkIn : checkOut}
                onSelect={(date) => {
                  if (!date) return;

                  if (calendarTarget === "checkIn") {
                    setCheckIn(date);
                    if (!checkOut || checkOut <= date) {
                      setCheckOut(addDays(date, 1));
                    }
                    setCalendarTarget("checkOut");
                    return;
                  }

                  if (checkIn && date <= checkIn) {
                    setCheckOut(addDays(checkIn, 1));
                  } else {
                    setCheckOut(date);
                  }
                  setShowCalendarModal(false);
                }}
                disabled={(date) => {
                  const today = new Date();
                  if (calendarTarget === "checkIn") return date < today;
                  return date <= (checkIn || today);
                }}
                numberOfMonths={1}
              />
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-background border-t p-4 space-y-2">
              <p className="text-xs text-muted-foreground">
                Selecting: {calendarTarget === "checkIn" ? "Check-in date" : "Check-out date"}
              </p>
              <div className="flex gap-2 text-sm">
                <div className="flex-1">
                  <p className="text-muted-foreground text-xs mb-1">Check-in</p>
                  <p className="font-semibold">{checkIn ? format(checkIn, "MMM dd, yyyy") : "Select date"}</p>
                </div>
                <div className="flex-1">
                  <p className="text-muted-foreground text-xs mb-1">Check-out</p>
                  <p className="font-semibold">{checkOut ? format(checkOut, "MMM dd, yyyy") : "Select date"}</p>
                </div>
              </div>
              <Button
                onClick={() => {
                  if (calendarTarget === "checkIn") {
                    setCalendarTarget("checkOut");
                    return;
                  }
                  setShowCalendarModal(false);
                }}
                size="lg"
                className="w-full"
              >
                {calendarTarget === "checkIn" ? "Continue to Check-out" : "Confirm Dates"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default HomeDetails;
