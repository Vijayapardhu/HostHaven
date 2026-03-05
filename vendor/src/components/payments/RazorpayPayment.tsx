import { useEffect, useRef, useState, useCallback } from "react";
import { paymentsService } from "@/lib/payments";

interface RazorpayPaymentProps {
  amount: number;
  bookingId: string;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
}

export const RazorpayPayment = ({ amount, bookingId, onSuccess, onError }: RazorpayPaymentProps) => {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    const loadPublicKey = async () => {
      try {
        const { data } = await paymentsService.getPublicKey();
        setPublicKey(data.publicKey || data.publicKey);
      } catch (error) {
        console.error("Failed to load Razorpay public key:", error);
        onError("Failed to initialize payment");
      } finally {
        setIsLoading(false);
      }
    };

    loadPublicKey();
  }, [onError]);

  useEffect(() => {
    if (scriptLoaded.current) return;
    
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      scriptLoaded.current = true;
    };
    document.body.appendChild(script);

    return () => {
      // Don't remove script on unmount to keep it cached
    };
  }, []);

  const initiatePayment = useCallback(async () => {
    if (!publicKey || !window.Razorpay) {
      onError("Payment system not ready");
      return;
    }

    setIsProcessing(true);

    try {
      const { data } = await paymentsService.createVendorOrder(bookingId);
      const { orderId, amount: orderAmount } = data;

      const razorpayOptions = {
        key: publicKey,
        amount: orderAmount * 100,
        currency: "INR",
        name: "HostHaven",
        description: "Hotel Booking Payment",
        order_id: orderId,
        handler: async (response: { razorpay_payment_id: string }) => {
          try {
            await paymentsService.verifyPayment({
              razorpay_order_id: response.razorpay_payment_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: "",
            });
            onSuccess(response.razorpay_payment_id);
          } catch (error) {
            onError("Payment verification failed");
          }
        },
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        theme: {
          color: "#2563eb",
        },
      };

      const razorpay = new window.Razorpay(razorpayOptions);
      razorpay.open();
    } catch (error: any) {
      onError(error?.message || "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  }, [publicKey, bookingId, onSuccess, onError]);

  if (isLoading) {
    return <span>Loading payment...</span>;
  }

  return (
    <button
      type="button"
      onClick={initiatePayment}
      disabled={isProcessing || !publicKey}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
    >
      {isProcessing ? "Processing..." : `Pay ₹${amount}`}
    </button>
  );
};

declare global {
  interface Window {
    Razorpay: any;
  }
}
