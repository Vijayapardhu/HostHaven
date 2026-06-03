import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { CheckCircle2, Calendar, MapPin, User, ArrowRight, Home, LayoutDashboard } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { format } from "date-fns";

const BookingSuccess = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [property, setProperty] = useState<any>(null);

  const checkInIso = searchParams.get("checkIn");
  const checkOutIso = searchParams.get("checkOut");
  const guestName = searchParams.get("guestName");

  useEffect(() => {
    if (!id) return;
    api.properties.getById(id).then(setProperty).catch(() => { });

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const legacyWindow = window as Window & { webkitAudioContext?: typeof AudioContext };
    const AudioContextClass = window.AudioContext || legacyWindow.webkitAudioContext;
    if (!AudioContextClass) return;

    const context = new AudioContextClass();
    const masterGain = context.createGain();
    masterGain.gain.setValueAtTime(0.04, context.currentTime);
    masterGain.connect(context.destination);

    const playTone = (frequency: number, startOffset: number, duration = 0.16) => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, context.currentTime + startOffset);
      gainNode.gain.setValueAtTime(0.0001, context.currentTime + startOffset);
      gainNode.gain.exponentialRampToValueAtTime(1, context.currentTime + startOffset + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + startOffset + duration);
      oscillator.connect(gainNode);
      gainNode.connect(masterGain);
      oscillator.start(context.currentTime + startOffset);
      oscillator.stop(context.currentTime + startOffset + duration + 0.02);
    };

    playTone(523.25, 0, 0.14);
    playTone(659.25, 0.12, 0.14);
    playTone(783.99, 0.24, 0.22);

    return () => {
      if (context.state !== "closed") {
        context.close();
      }
    };
  }, [id]);

  return (
    <Layout>
      <style>{`
        @keyframes hh-pop-in {
          0% { transform: scale(0.7); opacity: 0; }
          60% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes hh-fall {
          0% { transform: translateY(-24px) rotate(0deg); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translateY(250px) rotate(360deg); opacity: 0; }
        }
      `}</style>
      <div className="container mx-auto px-4 py-16 md:py-24 max-w-3xl booking-step-enter">
        <div className="text-center space-y-6 mb-12">
          <div className="relative h-0">
            {Array.from({ length: 18 }).map((_, index) => {
              const left = `${4 + (index * 5) % 92}%`;
              const delay = `${(index % 9) * 0.08}s`;
              const duration = `${1.8 + (index % 5) * 0.18}s`;
              return (
                <span
                  key={index}
                  className="absolute top-2 block h-2 w-2 rounded-sm"
                  style={{
                    left,
                    backgroundColor: index % 2 === 0 ? "hsl(var(--primary))" : "hsl(var(--accent))",
                    animation: `hh-fall ${duration} ease-in forwards`,
                    animationDelay: delay,
                  }}
                />
              );
            })}
          </div>
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 text-green-600 mb-2 border-4 border-white shadow-xl" style={{ animation: "hh-pop-in 520ms cubic-bezier(0.2, 0.9, 0.2, 1) both" }}>
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground tracking-tight">Booking Confirmed!</h1>
          <p className="text-lg text-muted-foreground font-medium max-w-md mx-auto">
            Thank you, <span className="text-foreground font-bold">{guestName || "Guest"}</span>! Your stay for {property?.name || "the property"} is locked in.
          </p>
        </div>

        <Card className="border-border shadow-2xl rounded-3xl overflow-hidden border-t-8 border-t-primary">
          <CardContent className="p-8 md:p-10 space-y-8">
            <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><Calendar className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Scheduled Dates</p>
                    <p className="font-semibold text-lg">
                      {checkInIso ? format(new Date(checkInIso), "MMM dd, yyyy") : "?"} — {checkOutIso ? format(new Date(checkOutIso), "MMM dd, yyyy") : "?"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><MapPin className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Location</p>
                    <p className="font-semibold text-lg">{property?.city || "?"}, Andhra Pradesh</p>
                    <p className="text-sm text-muted-foreground">{property?.address || "Loading address..."}</p>
                  </div>
                </div>
              </div>
              <div className="md:w-48 aspect-square rounded-2xl overflow-hidden shadow-inner bg-muted">
                {property?.images?.[0] && (
                  <img src={typeof property.images[0] === 'string' ? property.images[0] : property.images[0]?.url || '/placeholder.jpg'} className="w-full h-full object-cover" />
                )}
              </div>
            </div>

            <div className="p-6 bg-muted/40 rounded-2xl border border-border/50">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Guest Summary
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Primary Guest</p>
                  <p className="font-medium text-foreground">{guestName || "Authenticated User"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Booking Status</p>
                  <p className="font-medium text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Fully Paid</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button asChild className="flex-1 h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20" variant="gold">
                <Link to="/bookings" className="flex items-center justify-center gap-2">
                  <LayoutDashboard className="w-5 h-5" /> View My Bookings
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1 h-14 rounded-2xl text-lg font-bold">
                <Link to="/" className="flex items-center justify-center gap-2">
                  <Home className="w-5 h-5" /> Back to Home <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-12">
          An email confirmation has been sent to your registered account. <br />
          Need help? <Link to="/contact" className="text-primary font-semibold hover:underline">Contact Support</Link>
        </p>
      </div>
    </Layout>
  );
};

export default BookingSuccess;
