import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Star, MapPin, Wifi, UtensilsCrossed, Car, Dumbbell, Phone, ArrowLeft, Calendar as CalendarIcon, Users, X, ChevronLeft, ChevronRight, CalendarDays, Minus, Plus } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { createBookingPayment } from "@/lib/razorpay";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

const hotelData: Record<string, {
  id: string;
  name: string;
  location: string;
  address: string;
  price: number;
  rating: number;
  reviews: number;
  images: string[];
  description: string;
  amenities: { name: string; icon: string }[];
  roomTypes: { name: string; price: number; capacity: number }[];
  mentorContact: string;
}> = {
  "1": {
    id: "1",
    name: "Taj Gateway Hotel",
    location: "Tirupati",
    address: "Renigunta Road, Near Airport, Tirupati 517501",
    price: 8500,
    rating: 4.8,
    reviews: 324,
    images: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800",
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
    ],
    description: "Experience luxury and comfort at Taj Gateway Hotel, perfectly located near Tirumala Temple. Our hotel offers world-class amenities, authentic South Indian cuisine, and personalized service to make your pilgrimage memorable.",
    amenities: [
      { name: "Free WiFi", icon: "wifi" },
      { name: "Restaurant", icon: "restaurant" },
      { name: "Parking", icon: "parking" },
      { name: "Gym", icon: "gym" },
    ],
    roomTypes: [
      { name: "Deluxe Room", price: 8500, capacity: 2 },
      { name: "Premium Suite", price: 12500, capacity: 3 },
      { name: "Presidential Suite", price: 25000, capacity: 4 },
    ],
    mentorContact: "+91 98765 43210",
  },
  "2": {
    id: "2",
    name: "Fortune Murali Park",
    location: "Vijayawada",
    address: "MG Road, Vijayawada 520010",
    price: 7200,
    rating: 4.8,
    reviews: 312,
    images: [
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800",
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800",
    ],
    description: "Premium hotel in the heart of Vijayawada, close to Kanaka Durga Temple. Features modern amenities, spa facilities, and authentic Andhra cuisine.",
    amenities: [
      { name: "Free WiFi", icon: "wifi" },
      { name: "Restaurant", icon: "restaurant" },
      { name: "Parking", icon: "parking" },
      { name: "Gym", icon: "gym" },
    ],
    roomTypes: [
      { name: "Standard Room", price: 7200, capacity: 2 },
      { name: "Deluxe Suite", price: 11000, capacity: 3 },
    ],
    mentorContact: "+91 98765 43211",
  },
  "3": {
    id: "3",
    name: "Sri Sai Residency",
    location: "Nandyala",
    address: "Temple Road, Nandyala 518501",
    price: 3200,
    rating: 4.5,
    reviews: 145,
    images: [
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200",
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
    ],
    description: "Comfortable stay near Mahanandi Temple. Perfect for pilgrims seeking peace and convenience.",
    amenities: [
      { name: "Free WiFi", icon: "wifi" },
      { name: "Restaurant", icon: "restaurant" },
      { name: "Parking", icon: "parking" },
    ],
    roomTypes: [
      { name: "Standard Room", price: 3200, capacity: 2 },
      { name: "Deluxe Room", price: 4500, capacity: 3 },
    ],
    mentorContact: "+91 98765 43212",
  },
};

const defaultHotel = hotelData["1"];

const HotelDetails = () => {
  const { id } = useParams();
  const hotel = hotelData[id || "1"] || defaultHotel;
  const [bookingRoom, setBookingRoom] = useState<{ name: string; price: number; capacity: number } | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
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
    setGuests(prev => Math.max(1, Math.min(4, prev + delta)));
  };

  const handleBooking = async (room?: typeof hotel.rooms[0]) => {
    // Check if user is logged in
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to book this hotel",
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
      const roomPrice = room?.price || hotel.price;
      const totalAmount = roomPrice * nights;
      const propertyName = room ? `${hotel.name} - ${room.type}` : hotel.name;
      
      const result = await createBookingPayment({
        propertyName: propertyName,
        amount: totalAmount,
        nights: nights,
        checkIn: format(checkIn, "MMM dd, yyyy"),
        checkOut: format(checkOut, "MMM dd, yyyy"),
        guests: guests,
      });

      if (result.success) {
        toast({
          title: "Booking Successful! 🎉",
          description: `Your booking for ${propertyName} has been confirmed. Payment ID: ${result.paymentId}`,
        });
        
        // Close room selection dialog if open
        if (bookingRoom) {
          setBookingRoom(null);
        }
        
        // Reset booking form
        setCheckIn(undefined);
        setCheckOut(undefined);
        setGuests(2);
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
        setCurrentImageIndex((prev) => (prev + 1) % hotel.images.length);
      }, 3500);
    };

    startAutoScroll();
    return () => {
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
      }
    };
  }, [hotel.images.length]);

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
      setCurrentImageIndex((prev) => (prev + 1) % hotel.images.length);
    }
    if (isRightSwipe) {
      setCurrentImageIndex((prev) => (prev - 1 + hotel.images.length) % hotel.images.length);
    }

    // Reset auto-scroll after manual swipe
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
    }
    autoScrollInterval.current = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % hotel.images.length);
    }, 3500);

    setTouchStart(0);
    setTouchEnd(0);
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "wifi": return <Wifi className="w-5 h-5" />;
      case "restaurant": return <UtensilsCrossed className="w-5 h-5" />;
      case "parking": return <Car className="w-5 h-5" />;
      case "gym": return <Dumbbell className="w-5 h-5" />;
      default: return <Wifi className="w-5 h-5" />;
    }
  };

  return (
    <Layout>
      <div className="py-4 md:py-6">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <Link to="/hotels" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4 md:mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Hotels
          </Link>

          {/* Gallery - Horizontal scroll on mobile, Grid on desktop */}
          <div className="mb-4 md:mb-8">
            {/* Mobile: Smooth blur carousel */}
            <div className="md:hidden -mx-4 px-4">
              <div 
                className="relative rounded-xl overflow-hidden aspect-[4/3] bg-muted"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {hotel.images.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`${hotel.name} ${index + 1}`}
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
                      index === currentImageIndex
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-105 blur-sm"
                    }`}
                  />
                ))}
              </div>
              <div className="flex justify-center gap-1.5 mt-3">
                {hotel.images.map((_, index) => (
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
                  src={hotel.images[0]}
                  alt={hotel.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="grid grid-rows-2 gap-4">
                {hotel.images.slice(1, 3).map((img, index) => (
                  <div key={index} className="rounded-2xl overflow-hidden">
                    <img
                      src={img}
                      alt={`${hotel.name} ${index + 2}`}
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
                    <span className="text-sm md:text-base font-medium">{hotel.rating}</span>
                  </div>
                  <span className="text-muted-foreground text-xs md:text-sm">({hotel.reviews} reviews)</span>
                </div>
                <h1 className="text-xl md:text-4xl font-serif font-bold text-foreground">
                  {hotel.name}
                </h1>
                <div className="flex items-center gap-2 text-muted-foreground mt-2 text-sm md:text-base">
                  <MapPin className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  {hotel.address}
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="text-lg md:text-xl font-serif font-semibold text-foreground mb-2 md:mb-3">About</h2>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{hotel.description}</p>
              </div>

              {/* Amenities */}
              <div>
                <h2 className="text-lg md:text-xl font-serif font-semibold text-foreground mb-3 md:mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  {hotel.amenities.map((amenity) => (
                    <div key={amenity.name} className="flex items-center gap-2 md:gap-3 bg-card rounded-xl p-3 md:p-4 shadow-card">
                      <div className="text-primary">{getIcon(amenity.icon)}</div>
                      <span className="text-xs md:text-sm font-medium">{amenity.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Room Types */}
              <div>
                <h2 className="text-lg md:text-xl font-serif font-semibold text-foreground mb-3 md:mb-4">Room Types</h2>
                <div className="space-y-4">
                  {hotel.roomTypes.map((room) => (
                    <div key={room.name} className="bg-card rounded-xl p-5 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-foreground">{room.name}</h3>
                        <p className="text-muted-foreground text-sm">Up to {room.capacity} guests</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-xl font-semibold text-foreground">
                          ₹{room.price.toLocaleString()}
                          <span className="text-muted-foreground font-normal text-sm">/night</span>
                        </p>
                        <Button variant="gold" onClick={() => setBookingRoom(room)}>Book Now</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Booking Card */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl md:rounded-2xl shadow-card p-4 md:p-6 lg:sticky lg:top-24">
                <div className="text-center mb-4 md:mb-6">
                  <p className="text-muted-foreground text-xs md:text-sm">Starting from</p>
                  <p className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                    ₹{hotel.price.toLocaleString()}
                    <span className="text-muted-foreground font-normal text-sm md:text-base">/night</span>
                  </p>
                  {nights > 0 && (
                    <div className="mt-2 inline-flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-3 py-1">
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span className="text-xs font-semibold">{nights} Night{nights > 1 ? 's' : ''}</span>
                      <span className="text-xs">• ₹{(hotel.price * nights).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 md:space-y-4">
                  {/* Mobile: Drawer inputs */}
                  <div className="md:hidden space-y-2">
                    <Drawer open={isCheckInOpen} onOpenChange={setIsCheckInOpen}>
                      <button
                        onClick={() => setIsCheckInOpen(true)}
                        className="w-full flex items-center gap-2 p-2.5 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-left"
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
                        className="w-full flex items-center gap-2 p-2.5 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-left"
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
                                disabled={guests >= 4}
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

                  {/* Desktop: Simple inputs */}
                  <div className="hidden md:space-y-4 md:block">
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
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                      <Users className="w-4 h-4 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-muted-foreground font-medium">Guests</p>
                        <select className="w-full bg-transparent border-0 p-0 text-xs font-medium focus:outline-none appearance-none cursor-pointer">
                          {[1, 2, 3, 4].map((num) => (
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
                    onClick={() => handleBooking()}
                    disabled={!checkIn || !checkOut || isProcessingPayment}
                  >
                    {isProcessingPayment ? "Processing..." : "Book Now"}
                  </Button>
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">Need help with booking?</p>
                  <a
                    href={`tel:${hotel.mentorContact}`}
                    className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    <span className="font-medium">{hotel.mentorContact}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <Dialog open={!!bookingRoom} onOpenChange={() => setBookingRoom(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Book {bookingRoom?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="p-4 bg-muted rounded-xl">
              <p className="text-sm text-muted-foreground">Room Price</p>
              <p className="text-2xl font-semibold text-foreground">
                ₹{bookingRoom?.price.toLocaleString()}
                <span className="text-muted-foreground font-normal text-sm">/night</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">Up to {bookingRoom?.capacity} guests</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Check In</label>
                <Input type="date" className="h-10 bg-muted border-0 rounded-lg" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Check Out</label>
                <Input type="date" className="h-10 bg-muted border-0 rounded-lg" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Number of Guests</label>
              <select className="w-full h-10 px-3 bg-muted border-0 rounded-lg text-sm">
                {Array.from({ length: bookingRoom?.capacity || 2 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>{num} Guest{num > 1 ? "s" : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Full Name</label>
              <Input placeholder="Enter your name" className="h-10 bg-muted border-0 rounded-lg" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone Number</label>
              <Input placeholder="+91 98765 43210" className="h-10 bg-muted border-0 rounded-lg" />
            </div>
            <Button 
              variant="hero" 
              className="w-full" 
              size="lg"
              onClick={() => bookingRoom && handleBooking({ type: bookingRoom.name, price: bookingRoom.price, capacity: bookingRoom.capacity, size: 0, beds: '' })}
              disabled={!checkIn || !checkOut || isProcessingPayment}
            >
              {isProcessingPayment ? "Processing..." : "Confirm Booking"}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Free cancellation up to 24 hours before check-in
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default HotelDetails;