import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, User, Phone, Info, CheckCircle2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

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
  currency?: string;
  images?: Array<{ url: string }>;
  rooms?: PropertyRoom[];
}

const BookingReview = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  const [property, setProperty] = useState<PropertyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  const roomId = searchParams.get("roomId") || "";
  const checkInIso = searchParams.get("checkIn") || "";
  const checkOutIso = searchParams.get("checkOut") || "";
  const guestsCount = Number(searchParams.get("guests") || "1");
  const from = searchParams.get("from") || "hotels";

  const checkIn = useMemo(() => checkInIso ? new Date(checkInIso) : undefined, [checkInIso]);
  const checkOut = useMemo(() => checkOutIso ? new Date(checkOutIso) : undefined, [checkOutIso]);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    api.properties
      .getById(id)
      .then((data) => {
        setProperty(data);
        if (user) {
          setGuestName(user.name || "");
        }
      })
      .catch(() => {
        toast({
          title: "Unable to load property",
          description: "Please try again.",
          variant: "destructive",
        });
      })
      .finally(() => setIsLoading(false));
  }, [id, user, toast]);

  const selectedRoom = useMemo(
    () => property?.rooms?.find((room) => room.id === roomId) || property?.rooms?.[0],
    [property, roomId]
  );

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [checkIn, checkOut]);

  const roomPrice = selectedRoom?.pricePerNight || property?.basePrice || 0;
  const totalAmount = nights * roomPrice;

  const handleNext = () => {
    if (!guestName.trim() || !guestPhone.trim()) {
      toast({
        title: "Details required",
        description: "Please enter primary guest name and phone number.",
        variant: "destructive",
      });
      return;
    }

    if (!isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please login to proceed with booking.",
      });
      navigate("/login", { state: { from: window.location.pathname + window.location.search } });
      return;
    }

    const params = new URLSearchParams(searchParams);
    params.set("guestName", guestName);
    params.set("guestPhone", guestPhone);

    navigate(`/booking/${id}/checkout?${params.toString()}`);
  };

  if (isLoading || !property) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center animate-pulse">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Preparing your booking review...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl booking-step-enter">
        <Link
          to={`/booking/${id}?${searchParams.toString()}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Edit Selection
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-8">
            <header>
              <h1 className="text-3xl font-serif font-bold text-foreground">Review & Guest Info</h1>
              <p className="text-muted-foreground mt-2">Step 2 of 4: Confirm your selection and enter guest details</p>
            </header>

            <section className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Guest Details
                </h2>
                <Card className="border-border shadow-sm overflow-hidden rounded-2xl">
                  <CardContent className="p-6 space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground ml-1">Primary Guest Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="As per ID proof"
                          className="pl-10 h-12 bg-muted/30 border-border focus:bg-background transition-all"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground ml-1">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="9876543210"
                          className="pl-10 h-12 bg-muted/30 border-border focus:bg-background transition-all"
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          inputMode="numeric"
                          maxLength={10}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 ml-1">We'll send booking updates to this number.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex gap-4">
                <Info className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-primary">Important Information</p>
                  <p className="text-muted-foreground mt-1">Please ensure the guest name matches the ID you will present during check-in. Standard check-in time is 12:00 PM.</p>
                </div>
              </div>
            </section>
          </div>

          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-24 space-y-6">
              <Card className="border-border shadow-lg rounded-3xl overflow-hidden">
                <div className="aspect-[16/9] overflow-hidden">
                  <img
                    src={property.images?.[0]?.url || "https://images.unsplash.com/photo-1542314831-c6a4d27ce66b?w=800"}
                    alt={property.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h2 className="text-xl font-serif font-bold h-7 overflow-hidden text-ellipsis whitespace-nowrap">{property.name}</h2>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1 truncate">
                      <CheckCircle2 className="w-4 h-4 text-primary" /> {property.city}, {property.state}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-border/50">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Check-In</p>
                      <p className="font-semibold text-sm mt-0.5">{checkIn ? format(checkIn, "EEE, MMM dd") : "Not set"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Check-Out</p>
                      <p className="font-semibold text-sm mt-0.5">{checkOut ? format(checkOut, "EEE, MMM dd") : "Not set"}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{selectedRoom?.name} × {nights} Nights</span>
                      <span className="font-medium">₹{totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taxes & Fees</span>
                      <span className="font-medium text-green-600">Included</span>
                    </div>
                    <div className="pt-3 flex justify-between items-end">
                      <span className="text-lg font-bold">Total Amount</span>
                      <div className="text-right">
                        <p className="text-2xl font-black text-primary">₹{totalAmount.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full h-14 text-lg font-bold rounded-2xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-95"
                    onClick={handleNext}
                  >
                    Continue to Payment
                  </Button>
                  <p className="text-center text-[10px] text-muted-foreground font-medium flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Secure SSL encrypted booking
                  </p>
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
};

export default BookingReview;
