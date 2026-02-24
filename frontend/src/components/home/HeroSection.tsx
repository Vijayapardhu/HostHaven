import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { CalendarDays, Users, Search, Minus, Plus, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const HeroSection = () => {
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);
  const [isRoomsOpen, setIsRoomsOpen] = useState(false);
  const [isGuestsOpen, setIsGuestsOpen] = useState(false);
  const [isRoomGuestDialogOpen, setIsRoomGuestDialogOpen] = useState(false);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (checkIn) params.set("checkIn", format(checkIn, "yyyy-MM-dd"));
    if (checkOut) params.set("checkOut", format(checkOut, "yyyy-MM-dd"));
    if (guests) params.set("guests", guests.toString());
    if (rooms) params.set("rooms", rooms.toString());
    
    navigate(`/hotels?${params.toString()}`);
  };

  const updateGuests = (delta: number) => {
    setGuests(prev => Math.max(1, Math.min(10, prev + delta)));
  };

  const updateRooms = (delta: number) => {
    setRooms(prev => Math.max(1, Math.min(5, prev + delta)));
  };

  return (
    <section className="bg-gradient-to-b from-cream to-cream-light">
      <div className="container mx-auto px-4 pt-3 pb-8 md:pb-10">
        {/* Logo removed from hero - now in header top-left on mobile */}

        {/* Tagline */}
        <h1 className="text-2xl md:text-3xl lg:text-5xl font-serif font-bold text-center text-foreground mb-4 md:mb-6">
          Find Hotels at Best Prices
        </h1>

        {/* Search Card */}
        <div className="bg-card rounded-xl shadow-card p-3 md:p-4 lg:p-5 max-w-5xl mx-auto">
          {/* Mobile View - Drawers */}
          <div className="md:hidden">
            {/* Dates Row - Check In & Check Out side by side */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              {/* Check In */}
              <Drawer open={isCheckInOpen} onOpenChange={setIsCheckInOpen}>
                <DrawerTrigger asChild>
                  <button className="flex items-center gap-2 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-left">
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
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Select Check-In Date</DrawerTitle>
                    <DrawerDescription>Choose your arrival date</DrawerDescription>
                  </DrawerHeader>
                  <div className="p-4 flex justify-center">
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
                </DrawerContent>
              </Drawer>

              {/* Check Out */}
              <Drawer open={isCheckOutOpen} onOpenChange={setIsCheckOutOpen}>
                <DrawerTrigger asChild>
                  <button className="flex items-center gap-2 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-left">
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
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Select Check-Out Date</DrawerTitle>
                    <DrawerDescription>Choose your departure date</DrawerDescription>
                  </DrawerHeader>
                  <div className="p-4 flex justify-center">
                    <Calendar
                      mode="single"
                      selected={checkOut}
                      onSelect={(date) => {
                        setCheckOut(date);
                        setIsCheckOutOpen(false);
                      }}
                      disabled={(date) => date < (checkIn || new Date())}
                      initialFocus
                    />
                  </div>
                </DrawerContent>
              </Drawer>
            </div>

            {/* Rooms & Guests Row - side by side */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {/* Rooms */}
              <Drawer open={isRoomsOpen} onOpenChange={setIsRoomsOpen}>
                <DrawerTrigger asChild>
                  <button className="flex items-center gap-2 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-left">
                    <Home className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-muted-foreground font-medium">Rooms</p>
                      <p className="text-xs font-medium">
                        {rooms} Room{rooms > 1 ? "s" : ""}
                      </p>
                    </div>
                  </button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Select Rooms</DrawerTitle>
                    <DrawerDescription>Number of rooms needed</DrawerDescription>
                  </DrawerHeader>
                  <div className="p-6">
                    <div className="flex items-center justify-between max-w-xs mx-auto">
                      <button
                        onClick={() => updateRooms(-1)}
                        disabled={rooms <= 1}
                        className="w-12 h-12 rounded-full bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <span className="text-2xl font-bold text-foreground">{rooms}</span>
                      <button
                        onClick={() => updateRooms(1)}
                        disabled={rooms >= 5}
                        className="w-12 h-12 rounded-full bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <DrawerFooter>
                    <Button onClick={() => setIsRoomsOpen(false)} className="w-full">
                      Done
                    </Button>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>

              {/* Guests */}
              <Drawer open={isGuestsOpen} onOpenChange={setIsGuestsOpen}>
                <DrawerTrigger asChild>
                  <button className="flex items-center gap-2 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-left">
                    <Users className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-muted-foreground font-medium">Guests</p>
                      <p className="text-xs font-medium">
                        {guests} Guest{guests > 1 ? "s" : ""}
                      </p>
                    </div>
                  </button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Select Guests</DrawerTitle>
                    <DrawerDescription>Number of guests staying</DrawerDescription>
                  </DrawerHeader>
                  <div className="p-6">
                    <div className="flex items-center justify-between max-w-xs mx-auto">
                      <button
                        onClick={() => updateGuests(-1)}
                        disabled={guests <= 1}
                        className="w-12 h-12 rounded-full bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <span className="text-2xl font-bold text-foreground">{guests}</span>
                      <button
                        onClick={() => updateGuests(1)}
                        disabled={guests >= 10}
                        className="w-12 h-12 rounded-full bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <DrawerFooter>
                    <Button onClick={() => setIsGuestsOpen(false)} className="w-full">
                      Done
                    </Button>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            </div>
          </div>

          {/* Desktop View - Popovers & Dialog */}
          <div className="hidden md:block">
            {/* Dates Row */}
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg mb-3">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground font-medium">Check In</p>
                        <p className={cn(
                          "text-sm font-medium truncate",
                          !checkIn && "text-muted-foreground"
                        )}>
                          {checkIn ? format(checkIn, "MMM dd, yyyy") : "Select"}
                        </p>
                      </div>
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={checkIn}
                    onSelect={setCheckIn}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <span className="text-muted-foreground text-xs">-</span>

              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground font-medium">Check Out</p>
                        <p className={cn(
                          "text-sm font-medium truncate",
                          !checkOut && "text-muted-foreground"
                        )}>
                          {checkOut ? format(checkOut, "MMM dd, yyyy") : "Select"}
                        </p>
                      </div>
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={checkOut}
                    onSelect={setCheckOut}
                    disabled={(date) => date < (checkIn || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Rooms & Guests Row */}
            <div className="p-4 bg-muted rounded-lg mb-4">
              <Dialog open={isRoomGuestDialogOpen} onOpenChange={setIsRoomGuestDialogOpen}>
                <DialogTrigger asChild>
                  <button className="flex items-center gap-2 w-full text-left">
                    <Home className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground font-medium">Rooms & Guests</p>
                      <p className="text-sm font-medium text-foreground">
                        {rooms} Room{rooms > 1 ? "s" : ""}, {guests} Guest{guests > 1 ? "s" : ""}
                      </p>
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Select Rooms & Guests</DialogTitle>
                    <DialogDescription>
                      Choose the number of rooms and guests for your stay
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6 py-4">
                    {/* Rooms */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Rooms</p>
                        <p className="text-sm text-muted-foreground">Number of rooms needed</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateRooms(-1)}
                          disabled={rooms <= 1}
                          className="w-9 h-9 rounded-full bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-semibold text-foreground">{rooms}</span>
                        <button
                          onClick={() => updateRooms(1)}
                          disabled={rooms >= 5}
                          className="w-9 h-9 rounded-full bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Guests */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Guests</p>
                        <p className="text-sm text-muted-foreground">Number of guests staying</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateGuests(-1)}
                          disabled={guests <= 1}
                          className="w-9 h-9 rounded-full bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-semibold text-foreground">{guests}</span>
                        <button
                          onClick={() => updateGuests(1)}
                          disabled={guests >= 10}
                          className="w-9 h-9 rounded-full bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      onClick={() => setIsRoomGuestDialogOpen(false)}
                      className="w-full"
                    >
                      Done
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Search Button */}
          <Button 
            variant="hero" 
            size="lg" 
            className="w-full text-sm md:text-base"
            onClick={handleSearch}
          >
            Find Hotels Now
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
