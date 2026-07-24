import { useState, type ReactNode } from "react";
import { Loader2, Phone, MessageSquare, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { usePublicPlatformSettings } from "@/hooks/usePublicPlatformSettings";
import { handleError } from "@/lib/errorHandler";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface RefundRequestDialogProps {
  bookingNumber: string;
  trigger: ReactNode;
  /** Called after a request is submitted, so the caller can refresh state. */
  onSubmitted?: () => void;
}

const MIN_REASON_LENGTH = 10;
const MAX_REASON_LENGTH = 3000;

/**
 * Refunds are agent-reviewed rather than self-service: the guest either calls
 * support or submits a request here, and an admin applies the cancellation
 * policy before any money moves.
 */
const RefundRequestDialog = ({
  bookingNumber,
  trigger,
  onSubmitted,
}: RefundRequestDialogProps) => {
  const settings = usePublicPlatformSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);

  const supportPhone = settings.contact.supportPhone;
  const trimmedReason = reason.trim();
  const isReasonValid =
    trimmedReason.length >= MIN_REASON_LENGTH &&
    trimmedReason.length <= MAX_REASON_LENGTH;

  const resetAndClose = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setReason("");
      setTicketNumber(null);
    }
  };

  const handleSubmit = async () => {
    if (!isReasonValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const ticket = await api.support.requestRefund({
        bookingNumber,
        reason: trimmedReason,
      });
      setTicketNumber(ticket.ticketNumber);
      toast.success("Refund request submitted");
      onSubmitted?.();
    } catch (error) {
      handleError(error, "refund request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {ticketNumber ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Request received
              </DialogTitle>
              <DialogDescription>
                Your refund request for booking {bookingNumber} is open as
                ticket {ticketNumber}. Our team will review it against the
                cancellation policy and get back to you.
              </DialogDescription>
            </DialogHeader>
            <Button onClick={() => resetAndClose(false)} className="w-full">
              Done
            </Button>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Request a refund</DialogTitle>
              <DialogDescription>
                Refunds for booking {bookingNumber} are handled by our support
                team. Call us, or send a request here and we will reply.
              </DialogDescription>
            </DialogHeader>

            <a
              href={`tel:${supportPhone.replace(/\s+/g, "")}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-4 transition-colors hover:bg-muted"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                <Phone className="h-5 w-5 text-emerald-600" />
              </span>
              <span className="text-left">
                <span className="block text-sm font-medium text-foreground">
                  Call support
                </span>
                <span className="block text-xs text-muted-foreground">
                  {supportPhone}
                </span>
              </span>
            </a>

            <div className="space-y-2">
              <label
                htmlFor="refund-reason"
                className="flex items-center gap-2 text-sm font-medium text-foreground"
              >
                <MessageSquare className="h-4 w-4 text-primary" />
                Or tell us why you need a refund
              </label>
              <Textarea
                id="refund-reason"
                rows={4}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Describe what went wrong so we can process this faster."
                maxLength={MAX_REASON_LENGTH}
                aria-describedby="refund-reason-hint"
              />
              <p
                id="refund-reason-hint"
                className="text-right text-xs text-muted-foreground"
              >
                {trimmedReason.length < MIN_REASON_LENGTH
                  ? `At least ${MIN_REASON_LENGTH} characters`
                  : `${reason.length}/${MAX_REASON_LENGTH}`}
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!isReasonValid || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                "Submit refund request"
              )}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RefundRequestDialog;
