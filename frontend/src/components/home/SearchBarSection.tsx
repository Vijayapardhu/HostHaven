import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { format, addDays, differenceInDays } from "date-fns";
import { Search, CalendarDays, MapPin, Users, Minus, Plus, Crosshair, ChevronDown, ShieldCheck, BadgeCheck } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type PropertyType = "hotels" | "homes" | "temples" | "services";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

export default function SearchBarSection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();

  const [location, setLocation] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: addDays(new Date(), 1),
    to: addDays(new Date(), 2),
  });
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);

  useEffect(() => {
    const checkInParam = searchParams.get("checkIn");
    const checkOutParam = searchParams.get("checkOut");
    const guestsParam = searchParams.get("guests");
    const roomsParam = searchParams.get("rooms");
    if (checkInParam || checkOutParam) {
      setDateRange({
        from: checkInParam ? new Date(checkInParam) : undefined,
        to: checkOutParam ? new Date(checkOutParam) : undefined,
      });
    }
    if (guestsParam) {
      const parsed = parseInt(guestsParam);
      if (!isNaN(parsed)) setGuests(parsed);
    }
    if (roomsParam) {
      const parsed = parseInt(roomsParam);
      if (!isNaN(parsed)) setRooms(parsed);
    }
  }, []);

  const [propertyType, setPropertyType] = useState<PropertyType>("hotels");
  const [isRoomGuestOpen, setIsRoomGuestOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);

  const totalNights = dateRange.from && dateRange.to ? differenceInDays(dateRange.to, dateRange.from) : 1;

  const updateGuests = (delta: number) => {
    setGuests((prev) => Math.max(1, Math.min(10, prev + delta)));
  };

  const updateRooms = (delta: number) => {
    setRooms((prev) => Math.max(1, Math.min(5, prev + delta)));
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) params.set("search", location);
    if (dateRange.from) params.set("checkIn", format(dateRange.from, "yyyy-MM-dd"));
    if (dateRange.to) params.set("checkOut", format(dateRange.to, "yyyy-MM-dd"));
    params.set("rooms", rooms.toString());
    params.set("guests", guests.toString());
    const query = params.toString();

    switch (propertyType) {
      case "hotels":
        navigate(query ? `/hotels?${query}` : "/hotels");
        break;
      case "homes":
        navigate(query ? `/homes?${query}` : "/homes");
        break;
      case "temples":
        navigate(query ? `/temples?${query}` : "/temples");
        break;
      case "services":
        navigate(query ? `/services?${query}` : "/services");
        break;
    }
  };

  const handleNearMe = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          navigate(`/search?lat=${latitude}&lng=${longitude}`);
        },
        () => {
          setLocation("Current Location");
          navigate("/search?nearby=1");
        }
      );
    } else {
      setLocation("Current Location");
    }
  };

  const DateContent = ({ closeOnSelect = false }: { closeOnSelect?: boolean }) => (
    <Calendar
      mode="range"
      selected={dateRange}
      onSelect={(range) => {
        if (range) setDateRange(range);
        if (closeOnSelect && range?.from && range?.to) setIsDatePickerOpen(false);
      }}
      disabled={(date) => date < new Date()}
      numberOfMonths={isMobile ? 1 : 2}
      initialFocus
    />
  );

  const dateTrigger = (
    <button className="flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-xl text-left hover:bg-muted transition-colors w-full">
      <CalendarDays className="w-5 h-5 text-primary flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Check In — Check Out</p>
        <p className={cn("text-sm font-semibold", dateRange.from ? "text-foreground" : "text-muted-foreground")}>
          {dateRange.from ? (
            <span className="flex items-center gap-2">
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md text-xs font-bold">
                {format(dateRange.from, "EEE, MMM dd")}
              </span>
              <span className="flex items-center text-muted-foreground">
                <svg className="w-6 h-3" viewBox="0 0 24 12" fill="none">
                  <line x1="2" y1="6" x2="22" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M18 2L22 6L18 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className={cn("px-2 py-0.5 rounded-md text-xs font-bold", dateRange.to ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                {dateRange.to ? format(dateRange.to, "EEE, MMM dd") : "Select"}
              </span>
            </span>
          ) : (
            "Select dates"
          )}
        </p>
      </div>
      <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </button>
  );

  return (
    <section className="bg-gradient-to-b from-heritage-brown/5 to-background px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl shadow-heritage-brown/10 border border-border/50 p-4 md:p-6">

          {/* Mobile: stacked layout */}
          {isMobile ? (
            <div className="space-y-3">
              {/* Location + Near Me */}
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-3 bg-muted/50 rounded-xl px-4 py-3">
                  <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Where are you going?"
                    aria-label="Search destination"
                    className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && location.trim()) {
                        navigate(`/search?q=${encodeURIComponent(location.trim())}`);
                      }
                    }}
                  />
                </div>
                <button
                  onClick={handleNearMe}
                  className="px-3 py-3 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors"
                  title="Near Me"
                >
                  <Crosshair className="w-5 h-5" />
                </button>
              </div>

              {/* Category */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: "hotels", label: "Hotels", icon: "🏨" },
                  { key: "homes", label: "Homestays", icon: "🏠" },
                  { key: "temples", label: "Temples", icon: "🛕" },
                  { key: "services", label: "Services", icon: "🔧" },
                ].map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => setPropertyType(key as PropertyType)}
                    aria-pressed={propertyType === key}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all",
                      propertyType === key
                        ? "bg-primary text-white shadow-md"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <span className="text-lg" aria-hidden="true">{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              {/* Date picker */}
              <Drawer open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <DrawerTrigger asChild>
                  {dateTrigger}
                </DrawerTrigger>
                <DrawerContent className="h-[80vh]">
                  <DrawerHeader>
                    <DrawerTitle>Select Dates</DrawerTitle>
                    <DrawerDescription>
                      {totalNights > 0 && `${totalNights} night${totalNights > 1 ? "s" : ""}`}
                    </DrawerDescription>
                  </DrawerHeader>
                  <div className="px-4 pb-4 flex justify-center">
                    {DateContent({ closeOnSelect: true })}
                  </div>
                  <DrawerFooter>
                    <Button onClick={() => setIsDatePickerOpen(false)} className="w-full">Done</Button>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>

              {/* Guests / Rooms */}
              <Drawer open={isRoomGuestOpen} onOpenChange={setIsRoomGuestOpen}>
                <DrawerTrigger asChild>
                  <button className="flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-xl text-left hover:bg-muted transition-colors w-full">
                    <Users className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Guests & Rooms</p>
                      <p className="text-sm font-semibold text-foreground">
                        {guests} Guest{guests > 1 ? "s" : ""}, {rooms} Room{rooms > 1 ? "s" : ""}
                      </p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </button>
                </DrawerTrigger>
                <DrawerContent className="h-auto">
                  <DrawerHeader>
                    <DrawerTitle>Rooms & Guests</DrawerTitle>
                    <DrawerDescription>Choose the number of rooms and guests</DrawerDescription>
                  </DrawerHeader>
                  <div className="space-y-6 px-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Rooms</p>
                        <p className="text-sm text-muted-foreground">Number of rooms</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => updateRooms(-1)} disabled={rooms <= 1}
                          className="w-9 h-9 rounded-full bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-semibold">{rooms}</span>
                        <button type="button" onClick={() => updateRooms(1)} disabled={rooms >= 5}
                          className="w-9 h-9 rounded-full bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Guests</p>
                        <p className="text-sm text-muted-foreground">Guests per room</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => updateGuests(-1)} disabled={guests <= 1}
                          className="w-9 h-9 rounded-full bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-semibold">{guests}</span>
                        <button type="button" onClick={() => updateGuests(1)} disabled={guests >= 10}
                          className="w-9 h-9 rounded-full bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <DrawerFooter>
                    <Button onClick={() => setIsRoomGuestOpen(false)} className="w-full">Done</Button>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>

              {/* Search Button */}
              <Button onClick={handleSearch} className="w-full py-3 text-base font-semibold rounded-xl">
                <Search className="w-5 h-5" />
                {propertyType === "hotels" ? "Find Hotels" :
                 propertyType === "homes" ? "Find Homestays" :
                 propertyType === "temples" ? "Find Temples" : "Find Services"}
              </Button>
            </div>
          ) : (
            /* Desktop: horizontal layout */
            <div className="space-y-4">
              {/* Category tabs */}
              <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                {[
                  { key: "hotels", label: "Hotels", icon: "🏨" },
                  { key: "homes", label: "Homestays", icon: "🏠" },
                  { key: "temples", label: "Temples", icon: "🛕" },
                  { key: "services", label: "Services", icon: "🔧" },
                ].map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => setPropertyType(key as PropertyType)}
                    aria-pressed={propertyType === key}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      propertyType === key
                        ? "bg-primary text-white shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <span aria-hidden="true">{icon}</span>
                    {label}
                  </button>
                ))}
              </div>

              {/* Search row */}
              <div className="flex items-center gap-3">
                {/* Location */}
                <div className="flex-1 flex items-center gap-3 bg-muted/50 rounded-xl px-4 py-3 border border-border/30 hover:border-primary/30 transition-colors">
                  <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Where are you going?"
                    aria-label="Search destination"
                    className="flex-1 bg-transparent border-none outline-none text-sm font-medium placeholder:text-muted-foreground"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && location.trim()) {
                        navigate(`/search?q=${encodeURIComponent(location.trim())}`);
                      }
                    }}
                  />
                  <button
                    onClick={handleNearMe}
                    className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
                  >
                    <Crosshair className="w-4 h-4" />
                    Near Me
                  </button>
                </div>

                {/* Date picker */}
                <Dialog open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <DialogTrigger asChild>
                    {dateTrigger}
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Select Dates</DialogTitle>
                      <DialogDescription>
                        {totalNights > 0 ? `${totalNights} night${totalNights > 1 ? "s" : ""} selected` : "Choose your check-in and check-out dates"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 flex justify-center">
                      {DateContent({ closeOnSelect: false })}
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Guests */}
                <Drawer open={isRoomGuestOpen} onOpenChange={setIsRoomGuestOpen}>
                  <DrawerTrigger asChild>
                    <button className="flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-xl text-left hover:bg-muted hover:border-primary/30 transition-colors min-w-[160px] border border-border/30">
                      <Users className="w-5 h-5 text-primary flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Guests</p>
                        <p className="text-sm font-semibold text-foreground truncate">
                          {guests} Guest{guests > 1 ? "s" : ""}, {rooms} Room{rooms > 1 ? "s" : ""}
                        </p>
                      </div>
                      <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </button>
                  </DrawerTrigger>
                  <DrawerContent className="h-auto">
                    <DrawerHeader>
                      <DrawerTitle>Rooms & Guests</DrawerTitle>
                      <DrawerDescription>Choose the number of rooms and guests</DrawerDescription>
                    </DrawerHeader>
                    <div className="space-y-6 px-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">Rooms</p>
                          <p className="text-sm text-muted-foreground">Number of rooms</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button type="button" onClick={() => updateRooms(-1)} disabled={rooms <= 1}
                            className="w-9 h-9 rounded-full bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-semibold">{rooms}</span>
                          <button type="button" onClick={() => updateRooms(1)} disabled={rooms >= 5}
                            className="w-9 h-9 rounded-full bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">Guests</p>
                          <p className="text-sm text-muted-foreground">Guests per room</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button type="button" onClick={() => updateGuests(-1)} disabled={guests <= 1}
                            className="w-9 h-9 rounded-full bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-semibold">{guests}</span>
                          <button type="button" onClick={() => updateGuests(1)} disabled={guests >= 10}
                            className="w-9 h-9 rounded-full bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <DrawerFooter>
                      <Button onClick={() => setIsRoomGuestOpen(false)} className="w-full">Done</Button>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>

                {/* Search Button */}
                <Button onClick={handleSearch} size="lg" className="h-[52px] px-8 text-base font-semibold rounded-xl shadow-gold">
                  <Search className="w-5 h-5" />
                  Search
                </Button>
              </div>

              {/* Night count display */}
              {totalNights > 0 && (
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground pt-1">
                  <span className="inline-flex items-center gap-1 bg-primary/5 text-primary font-medium px-2 py-0.5 rounded-full">
                    {totalNights} night{totalNights > 1 ? "s" : ""}
                  </span>
                  <span>selected</span>
                </div>
              )}
            </div>
          )}

          {/* Offers strip */}
          <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 text-primary font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Special Offers Available
            </span>
            <span className="text-border">|</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-green-500" />
              Free Cancellation
            </span>
            <span className="text-border hidden sm:inline">|</span>
            <span className="hidden sm:flex items-center gap-1">
              <BadgeCheck className="w-3 h-3 text-blue-500" />
              Instant Confirmation
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
