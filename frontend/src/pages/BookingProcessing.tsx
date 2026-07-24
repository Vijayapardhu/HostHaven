import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 40000;

/** Booking states that mean the payment settled and confirmation is done. */
const SETTLED_STATUSES = ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"];
/** Booking states that mean it will never settle. */
const FAILED_STATUSES = ["CANCELLED", "REFUNDED"];

/**
 * Waits for the backend to confirm the booking.
 *
 * Confirmation happens server-side — either from the payment-verify call or
 * from the Razorpay webhook — so this polls the booking rather than assuming
 * success after a fixed delay.
 */
const BookingProcessing = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const propertyName = searchParams.get("property") || "your property";
  const bookingId = searchParams.get("bookingId") || "";

  const [outcome, setOutcome] = useState<"pending" | "timeout" | "failed">(
    "pending",
  );
  const timedOutAt = useRef(Date.now() + POLL_TIMEOUT_MS);

  useEffect(() => {
    if (!id) return;

    // Without a booking id there is nothing to poll; the payment path always
    // supplies one, so this only covers a hand-edited URL.
    if (!bookingId) {
      setOutcome("timeout");
      return;
    }

    let cancelled = false;
    let timer: number | undefined;

    const poll = async () => {
      try {
        const booking = await api.bookings.getById(bookingId);
        if (cancelled) return;

        const status = String(booking?.status || "").toUpperCase();

        if (SETTLED_STATUSES.includes(status)) {
          navigate(`/booking/${id}/success?${searchParams.toString()}`, {
            replace: true,
          });
          return;
        }

        if (FAILED_STATUSES.includes(status)) {
          setOutcome("failed");
          return;
        }
      } catch (error) {
        // A transient read failure should not end the wait; the timeout will.
        console.error("Failed to read booking status while confirming", error);
      }

      if (cancelled) return;

      if (Date.now() >= timedOutAt.current) {
        setOutcome("timeout");
        return;
      }

      timer = window.setTimeout(poll, POLL_INTERVAL_MS);
    };

    poll();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [id, bookingId, navigate, searchParams]);

  const isPending = outcome === "pending";

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 md:py-14 max-w-2xl booking-step-enter">
        <Card>
          <CardContent className="p-6 md:p-10 text-center space-y-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Step 4 of 4
            </p>

            <div className="flex justify-center" aria-hidden="true">
              {isPending ? (
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
              ) : (
                <AlertCircle className="w-12 h-12 text-amber-500" />
              )}
            </div>

            <div role="status" aria-live="polite" className="space-y-2">
              {isPending && (
                <>
                  <h1 className="text-2xl md:text-3xl font-serif font-bold">
                    Finalizing your booking
                  </h1>
                  <p className="text-muted-foreground">
                    Confirming payment and reservation for{" "}
                    <span className="font-medium text-foreground">
                      {propertyName}
                    </span>
                    .
                  </p>
                </>
              )}

              {outcome === "timeout" && (
                <>
                  <h1 className="text-2xl md:text-3xl font-serif font-bold">
                    Still confirming
                  </h1>
                  <p className="text-muted-foreground">
                    Your payment went through and we're finishing up. If any
                    money was taken it is safe — your booking will appear under
                    My Bookings shortly.
                  </p>
                </>
              )}

              {outcome === "failed" && (
                <>
                  <h1 className="text-2xl md:text-3xl font-serif font-bold">
                    Booking not confirmed
                  </h1>
                  <p className="text-muted-foreground">
                    This booking was cancelled before it could be confirmed. Any
                    payment taken will be refunded — contact support if you need
                    help.
                  </p>
                </>
              )}
            </div>

            {bookingId ? (
              <div className="rounded-xl border bg-muted/30 p-3 text-sm">
                Booking ID: <span className="font-semibold">{bookingId}</span>
              </div>
            ) : null}

            {isPending ? (
              <>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full w-1/2 rounded-full bg-primary animate-pulse" />
                </div>
                <p className="text-xs text-muted-foreground">
                  This usually takes a couple of seconds...
                </p>
              </>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button asChild>
                  <Link to="/bookings">View my bookings</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/profile/support/raise">Contact support</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-4 text-center">
          <Link
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            to={`/booking/${id}`}
          >
            <ArrowLeft className="w-4 h-4" /> Back to booking details
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default BookingProcessing;
