import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Users, BedDouble } from "lucide-react";
import { DateRange } from "react-day-picker";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import BookingPickerDialog from "@/components/booking/BookingPickerDialog";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface PropertyRoom {
  id: string;
  name: string;
  pricePerNight: number;
  capacity: number;
  extraBedCapacity?: number;
}

interface PropertyData {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  basePrice: number;
  currency?: string;
  images?: Array<{ url: string }>;
  rooms?: PropertyRoom[];
}

const BookingFlow = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [property, setProperty] = useState<PropertyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkInParam = searchParams.get("checkIn");
  const checkOutParam = searchParams.get("checkOut");
  const guestsParam = searchParams.get("guests");

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: checkInParam ? new Date(checkInParam) : undefined,
    to: checkOutParam ? new Date(checkOutParam) : undefined,
  });
  const [guests, setGuests] = useState(() => {
    if (!guestsParam) return 2;
    const parsed = parseInt(guestsParam);
    return isNaN(parsed) ? 2 : parsed;
  });
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isGuestsOpen, setIsGuestsOpen] = useState(false);
  const [isRoomOpen, setIsRoomOpen] = useState(false);

  const checkIn = dateRange?.from;
  const checkOut = dateRange?.to;

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    api.properties
      .getById(id)
      .then((data) => {
        setProperty(data);
        const initialRoom = searchParams.get("roomId") || data?.rooms?.[0]?.id || "";
        setSelectedRoomId(initialRoom);
      })
      .catch(() => {
        toast({
          title: "Unable to load property",
          description: "Please try again.",
          variant: "destructive",
        });
      })
      .finally(() => setIsLoading(false));
  }, [id, searchParams, toast]);

  const rooms = useMemo(() => property?.rooms || [], [property]);
  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) || rooms[0],
    [rooms, selectedRoomId]
  );

  useEffect(() => {
    if (!selectedRoom && rooms.length > 0) {
      setSelectedRoomId(rooms[0].id);
    }
  }, [rooms, selectedRoom]);

  const maxGuests = useMemo(() => {
    if (!rooms.length) return 4;
    return Math.max(...rooms.map((room) => room.capacity + (room.extraBedCapacity || 0)));
  }, [rooms]);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [checkIn, checkOut]);

  const roomPrice = selectedRoom?.pricePerNight ?? property?.basePrice ?? 0;
  const totalAmount = nights > 0 ? roomPrice * nights : 0;

  const from = searchParams.get("from") || "hotels";
  const backPath = from === "homes" ? `/homes/${id}` : `/hotels/${id}`;

  const handleContinue = () => {
    if (!property || !selectedRoom?.id || !checkIn || !checkOut) {
      toast({
        title: "Missing details",
        description: "Please choose room, dates, and guests to continue.",
        variant: "destructive",
      });
      return;
    }

    const params = new URLSearchParams({
      roomId: selectedRoom.id,
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
      guests: String(guests),
      from,
    });

    navigate(`/booking/${property.id}/review?${params.toString()}`);
  };

  if (isLoading || !property) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">
          Loading booking flow...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-10 booking-step-enter">
        <Link to={backPath} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to property
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Step 1 of 4</p>
            <h1 className="text-2xl md:text-3xl font-serif font-bold">Plan your stay</h1>
            <p className="text-muted-foreground mt-1">{property.name}</p>

            <Card className="mt-6">
              <CardContent className="p-5 md:p-6 space-y-4">
                <button className="w-full text-left border rounded-xl p-4 hover:bg-muted/40 transition" onClick={() => setIsRoomOpen(true)}>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Room</p>
                  <p className="font-semibold flex items-center gap-2 mt-1"><BedDouble className="w-4 h-4" /> {selectedRoom?.name || "Select room"}</p>
                </button>

                <button className="w-full text-left border rounded-xl p-4 hover:bg-muted/40 transition" onClick={() => setIsDatePickerOpen(true)}>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Dates</p>
                  <p className="font-semibold flex items-center gap-2 mt-1"><CalendarDays className="w-4 h-4" /> {checkIn ? `${format(checkIn, "MMM dd")} - ${checkOut ? format(checkOut, "MMM dd, yyyy") : "..."}` : "Select dates"}</p>
                </button>

                <button className="w-full text-left border rounded-xl p-4 hover:bg-muted/40 transition" onClick={() => setIsGuestsOpen(true)}>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Guests</p>
                  <p className="font-semibold flex items-center gap-2 mt-1"><Users className="w-4 h-4" /> {guests} Guest{guests > 1 ? "s" : ""}</p>
                </button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="lg:sticky lg:top-24">
              <CardContent className="p-5 md:p-6 space-y-4">
                <h2 className="text-lg font-semibold">Booking summary</h2>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{selectedRoom?.name || "Room"}</p>
                  <p>{roomPrice.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })} / night</p>
                </div>

                {nights > 0 ? (
                  <div className="pt-3 border-t text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>{nights} night{nights > 1 ? "s" : ""}</span>
                      <span>{totalAmount.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                ) : null}

                <Button className="w-full" size="lg" onClick={handleContinue}>
                  Continue to checkout
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <BookingPickerDialog
        open={isRoomOpen}
        onOpenChange={setIsRoomOpen}
        title="Select room"
      >
        <div className="space-y-2 max-h-[320px] overflow-auto pr-1">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => {
                setSelectedRoomId(room.id);
                setIsRoomOpen(false);
              }}
              className={`w-full text-left rounded-xl border p-3 transition ${room.id === selectedRoom?.id ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}
            >
              <p className="font-medium">{room.name}</p>
              <p className="text-sm text-muted-foreground">Up to {room.capacity + (room.extraBedCapacity || 0)} guests • ₹{(room.pricePerNight ?? 0).toLocaleString('en-IN')}/night</p>
            </button>
          ))}
        </div>
      </BookingPickerDialog>

      <BookingPickerDialog
        open={isDatePickerOpen}
        onOpenChange={setIsDatePickerOpen}
        title="Select dates"
        description="Choose your check-in and check-out dates"
      >
        <div className="flex justify-center">
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={(range) => {
              setDateRange(range);
              if (range?.from && range?.to) {
                setTimeout(() => setIsDatePickerOpen(false), 300);
              }
            }}
            disabled={(date) => date < new Date()}
            numberOfMonths={2}
            initialFocus
          />
        </div>
      </BookingPickerDialog>

      <BookingPickerDialog
        open={isGuestsOpen}
        onOpenChange={setIsGuestsOpen}
        title="Select guests"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border p-4">
            <div>
              <p className="font-medium">Guests</p>
              <p className="text-sm text-muted-foreground">Max {maxGuests}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" onClick={() => setGuests((prev) => Math.max(1, prev - 1))}>-</Button>
              <span className="font-semibold w-6 text-center">{guests}</span>
              <Button variant="outline" size="icon" onClick={() => setGuests((prev) => Math.min(maxGuests, prev + 1))}>+</Button>
            </div>
          </div>
          <Button className="w-full" onClick={() => setIsGuestsOpen(false)}>Done</Button>
        </div>
      </BookingPickerDialog>
    </Layout>
  );
};

export default BookingFlow;
