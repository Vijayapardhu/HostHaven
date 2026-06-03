import { useEffect } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";

const BookingProcessing = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const propertyName = searchParams.get("property") || "your property";
  const bookingId = searchParams.get("bookingId") || "";

  useEffect(() => {
    if (!id) return;
    const timer = window.setTimeout(() => {
      navigate(`/booking/${id}/success?${searchParams.toString()}`, { replace: true });
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [id, navigate, searchParams]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 md:py-14 max-w-2xl booking-step-enter">
        <Card>
          <CardContent className="p-6 md:p-10 text-center space-y-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Step 4 of 4</p>
            <div className="flex justify-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold">Finalizing your booking</h1>
            <p className="text-muted-foreground">
              Confirming payment and reservation for <span className="font-medium text-foreground">{propertyName}</span>.
            </p>

            {bookingId ? (
              <div className="rounded-xl border bg-muted/30 p-3 text-sm">
                Booking ID: <span className="font-semibold">{bookingId}</span>
              </div>
            ) : null}

            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full w-1/2 rounded-full bg-primary animate-pulse" />
            </div>

            <p className="text-xs text-muted-foreground">This usually takes a couple of seconds...</p>
          </CardContent>
        </Card>

        <div className="mt-4 text-center">
          <Link className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" to={`/booking/${id}`}>
            <ArrowLeft className="w-4 h-4" /> Back to booking details
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default BookingProcessing;
