import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Star, MapPin, Bed, Users, ArrowLeft, Calendar as CalendarIcon, Wifi, CalendarDays, Minus, Plus } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { createBookingPayment } from "@/lib/razorpay";
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

interface HomeData {
  id: string;
  name: string;
  location: string;
  address: string;
  price: number;
  rating: number;
  reviews: number;
  images: string[];
  description: string;
  bedrooms: number;
  guests: number;
  amenities: string[];
}

const homesData: Record<string, HomeData> = {
  "1": {
    id: "1",
    name: "Krishna Riverside Villa",
    location: "Vijayawada",
    address: "Near Prakasam Barrage, Vijayawada 520001",
    price: 4500,
    rating: 4.7,
    reviews: 89,
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
    ],
    description: "Experience the charm of traditional Andhra living at this beautiful riverside villa. Located near the iconic Prakasam Barrage, this home offers stunning views of the Krishna River and easy access to Kanaka Durga Temple. The villa features spacious rooms, a private garden, and authentic South Indian hospitality.",
    bedrooms: 3,
    guests: 6,
    amenities: ["River View", "Kitchen", "Garden", "WiFi", "Parking", "AC"],
  },
  "2": {
    id: "2",
    name: "City Center Apartment",
    location: "Vijayawada",
    address: "MG Road, Vijayawada 520010",
    price: 3200,
    rating: 4.5,
    reviews: 67,
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
    ],
    description: "Modern apartment in the heart of Vijayawada, perfect for business travelers and families. Walking distance to shopping centers, restaurants, and public transport. Fully furnished with all modern amenities.",
    bedrooms: 2,
    guests: 4,
    amenities: ["AC", "Kitchen", "Parking", "WiFi", "TV", "Washing Machine"],
  },
  "3": {
    id: "3",
    name: "Heritage Cottage",
    location: "Nandyala",
    address: "Temple Road, Nandyala 518501",
    price: 2800,
    rating: 4.4,
    reviews: 56,
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
    ],
    description: "Charming heritage cottage near the famous Mahanandi Temple. Experience traditional Andhra architecture with modern comforts. The cottage features a beautiful garden and is perfect for spiritual retreats.",
    bedrooms: 2,
    guests: 4,
    amenities: ["Garden", "Kitchen", "Parking", "Temple Proximity"],
  },
  "4": {
    id: "4",
    name: "Traditional Home Stay",
    location: "Nandyala",
    address: "Srisailam Road, Nandyala 518502",
    price: 2200,
    rating: 4.3,
    reviews: 45,
    images: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
    ],
    description: "Authentic traditional home stay offering a glimpse into local Andhra culture. Includes home-cooked meals and guided tours to nearby temples including Srisailam and Ahobilam.",
    bedrooms: 3,
    guests: 6,
    amenities: ["Courtyard", "Kitchen", "Local Guide", "Home Meals"],
  },
  "5": {
    id: "5",
    name: "Seaside Home",
    location: "Vetapalem",
    address: "Beach Road, Vetapalem 523187",
    price: 3500,
    rating: 4.6,
    reviews: 78,
    images: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
    ],
    description: "Beautiful seaside home just steps away from the pristine Vetapalem beach. Wake up to the sound of waves and enjoy stunning sunrises. Perfect for beach lovers and families looking for a peaceful coastal getaway.",
    bedrooms: 3,
    guests: 6,
    amenities: ["Beach Access", "Kitchen", "Balcony", "WiFi", "Sea View"],
  },
  "6": {
    id: "6",
    name: "Beach Cottage",
    location: "Vetapalem",
    address: "Vodarevu Road, Vetapalem 523188",
    price: 2900,
    rating: 4.5,
    reviews: 62,
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
    ],
    description: "Cozy beach cottage near Vodarevu beach, one of the cleanest beaches in Andhra Pradesh. Enjoy fresh seafood, local fishing culture, and tranquil beach walks.",
    bedrooms: 2,
    guests: 4,
    amenities: ["Sea View", "Kitchen", "Parking", "Beach Nearby"],
  },
};

const defaultHome = homesData["1"];

const HomeDetails = () => {
  const { id } = useParams();
  const home = homesData[id || "1"] || defaultHome;
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

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const updateGuests = (delta: number) => {
    setGuests(prev => Math.max(1, Math.min(home.guests, prev + delta)));
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

    setIsProcessingPayment(true);
    
    try {
      const totalAmount = home.price * nights;
      const result = await createBookingPayment({
        propertyName: home.name,
        amount: totalAmount,
        nights: nights,
        checkIn: format(checkIn, "MMM dd, yyyy"),
        checkOut: format(checkOut, "MMM dd, yyyy"),
        guests: guests,
      });

      if (result.success) {
        toast({
          title: "Booking Successful! 🎉",
          description: `Your booking for ${home.name} has been confirmed. Payment ID: ${result.paymentId}`,
        });
        
        // Reset booking form
        setCheckIn(undefined);
        setCheckOut(undefined);
        setGuests(1);
      } else {
        toast({
          title: "Payment Failed",
          description: result.error || "Unable to process payment. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Booking Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Auto-scroll functionality
  useEffect(() => {
    const startAutoScroll = () => {
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
      }
      autoScrollInterval.current = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % home.images.length);
      }, 3500);
    };

    startAutoScroll();
    return () => {
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
      }
    };
  }, [home.images.length]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setCurrentImageIndex((prev) => (prev + 1) % home.images.length);
    }
    if (isRightSwipe) {
      setCurrentImageIndex((prev) => (prev - 1 + home.images.length) % home.images.length);
    }

    // Reset auto-scroll after manual swipe
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
    }
    autoScrollInterval.current = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % home.images.length);
    }, 3500);

    setTouchStart(0);
    setTouchEnd(0);
  };

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
                {home.images.map((img, index) => (
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
                {home.images.map((_, index) => (
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
                  src={home.images[0]}
                  alt={home.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="grid grid-rows-2 gap-4">
                {home.images.slice(1, 3).map((img, index) => (
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
                  <span className="text-muted-foreground text-xs md:text-sm">({home.reviews} reviews)</span>
                </div>
                <h1 className="text-xl md:text-4xl font-serif font-bold text-foreground">
                  {home.name}
                </h1>
                <div className="flex items-center gap-2 text-muted-foreground mt-2 text-sm md:text-base">
                  <MapPin className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  {home.address}
                </div>
              </div>

              {/* Property Details */}
              <div className="flex items-center gap-4 md:gap-6 p-3 md:p-4 bg-card rounded-xl shadow-card">
                <div className="flex items-center gap-2">
                  <Bed className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  <span className="text-sm md:text-base font-medium">{home.bedrooms} Bedrooms</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  <span className="text-sm md:text-base font-medium">Up to {home.guests} Guests</span>
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
                  {home.amenities.map((amenity) => (
                    <div key={amenity} className="flex items-center gap-2 md:gap-3 bg-card rounded-xl p-3 md:p-4 shadow-card">
                      <Wifi className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                      <span className="text-xs md:text-sm font-medium">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Booking Card */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl md:rounded-2xl shadow-card p-4 md:p-6 lg:sticky lg:top-24">
                <div className="text-center mb-4 md:mb-6">
                  <p className="text-muted-foreground text-xs md:text-sm">Per night</p>
                  <p className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                    ₹{home.price.toLocaleString()}
                  </p>
                  {nights > 0 && (
                    <div className="mt-2 inline-flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-3 py-1">
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span className="text-xs font-semibold">{nights} Night{nights > 1 ? 's' : ''}</span>
                      <span className="text-xs">• ₹{(home.price * nights).toLocaleString()}</span>
                    </div>
                  )}
                </div>

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
                                disabled={guests >= home.guests}
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
                          {Array.from({ length: home.guests }, (_, i) => i + 1).map((num) => (
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