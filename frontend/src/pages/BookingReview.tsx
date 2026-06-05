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

interface PriceData {
  baseAmount: number;
  extraBedAmount: number;
  taxAmount: number;
  totalAmount: number;
  nights: number;
  breakdown: {
    roomPrice: number;
    nights: number;
    extraBeds: number;
    extraBedPricePerNight: number;
    taxRate: string;
  };
}

const BookingReview = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  const [property, setProperty] = useState<PropertyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [isPriceLoading, setIsPriceLoading] = useState(false);

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

  useEffect(() => {
    if (!id || !checkIn || !checkOut || !selectedRoom?.id) return;
    setIsPriceLoading(true);
    api.bookings
      .checkPrice({
        propertyId: id,
        roomId: selectedRoom.id,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        guests: guestsCount,
      })
      .then((data) => setPriceData(data))
      .catch(() => {
        toast({
          title: "Price unavailable",
          description: "Could not fetch updated pricing.",
          variant: "destructive",
        });
      })
      .finally(() => setIsPriceLoading(false));
  }, [id, checkIn, checkOut, selectedRoom?.id, guestsCount, toast]);

  const nights = priceData?.nights ?? 0;
  const roomPrice = selectedRoom?.pricePerNight ?? property?.basePrice ?? 0;
  const totalAmount = priceData?.baseAmount ?? (nights * roomPrice);
  const taxAmount = priceData?.taxAmount ?? 0;
  const grandTotal = priceData?.totalAmount ?? totalAmount;
  const taxPercent = priceData?.breakdown?.taxRate
    ? parseFloat(priceData.breakdown.taxRate)
    : 12;
  const taxEnabled = priceData ? (priceData.taxAmount > 0) : false;

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

    setIsProcessing(true);
    navigate(`/booking/${id}/checkout?${searchParams.toString()}`, {
      state: { guestName, guestPhone },
    });
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
                    <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground ml-1">Primary Guest Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="As per ID proof"
                          className="pl-10 h-12 bg-muted/30 border-border focus:bg-background transition-all"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          autoComplete="name"
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
                          autoComplete="tel"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 ml-1">We'll send booking updates to this number.</p>
                    </div>
                  </form>
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
                    {isPriceLoading ? (
                      <div className="space-y-3 py-2">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                        <div className="h-6 bg-muted rounded animate-pulse w-1/2 mt-4" />
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{selectedRoom?.name} × {nights} Night{nights > 1 ? "s" : ""}</span>
                          <span className="font-medium">₹{totalAmount.toLocaleString('en-IN')}</span>
                        </div>
                        {taxEnabled ? (
                          <>
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>GST ({taxPercent}%)</span>
                              <span>₹{taxAmount.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground pl-3">
                              <span>CGST ({(taxPercent / 2).toFixed(1)}%)</span>
                              <span>₹{Math.round(taxAmount / 2).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground pl-3">
                              <span>SGST ({(taxPercent / 2).toFixed(1)}%)</span>
                              <span>₹{Math.round(taxAmount / 2).toLocaleString('en-IN')}</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Taxes & Fees</span>
                            <span className="font-medium text-green-600">Included</span>
                          </div>
                        )}
                        <div className="pt-3 flex justify-between items-end border-t">
                          <span className="text-lg font-bold">Total Amount</span>
                          <div className="text-right">
                            <p className="text-2xl font-black text-primary">₹{(taxEnabled ? grandTotal : totalAmount).toLocaleString('en-IN')}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <Button
                    className="w-full h-14 text-lg font-bold rounded-2xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-95"
                    onClick={handleNext}
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Processing..." : "Continue to Payment"}
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
