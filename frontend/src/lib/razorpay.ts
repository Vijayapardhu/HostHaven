// Razorpay Type Definitions
declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id?: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: {
    [key: string]: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

// Razorpay Key — used only as fallback when backend does not return keyId
const RAZORPAY_KEY_FALLBACK = import.meta.env.VITE_RAZORPAY_KEY || "";

/**
 * Opens the Razorpay payment modal.
 * Prefer passing `keyId` from the backend createOrder response so the key
 * is never hard-coded in the frontend. VITE_RAZORPAY_KEY is a local fallback.
 */
export const initiatePayment = (
  options: Partial<RazorpayOptions> & { keyId?: string }
) => {
  return new Promise((resolve, reject) => {
    const razorpayKey = options.keyId || RAZORPAY_KEY_FALLBACK;

    if (!razorpayKey) {
      alert(
        "Razorpay API key not configured!\n\n" +
        "Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your backend .env and restart the server."
      );
      reject(new Error("Razorpay API key not configured"));
      return;
    }

    if (!window.Razorpay) {
      reject(
        new Error(
          "Razorpay SDK not loaded. Please check your internet connection."
        )
      );
      return;
    }

    const rzpOptions: RazorpayOptions = {
      key: razorpayKey,
      amount: options.amount || 0,
      currency: options.currency || "INR",
      name: options.name || "HostHaven",
      description: options.description || "Booking Payment",
      image: options.image || "/logo.png",
      handler: (response: RazorpayResponse) => {
        resolve(response);
      },
      prefill: options.prefill || {},
      notes: options.notes || {},
      theme: {
        color: options.theme?.color || "#8B6914",
      },
      modal: {
        ondismiss: () => {
          reject(new Error("Payment cancelled by user"));
        },
      },
    };

    if (options.order_id) {
      rzpOptions.order_id = options.order_id;
    }

    const razorpayInstance = new window.Razorpay(rzpOptions);
    razorpayInstance.open();
  });
};

export const createBookingPayment = async ({
  propertyName,
  amount,
  nights,
  checkIn,
  checkOut,
  guests,
  orderId,
  keyId,
  notes,
  userName,
  userEmail,
  userPhone,
}: {
  propertyName: string;
  amount: number;
  nights: number;
  checkIn: string;
  checkOut: string;
  guests: number;
  orderId?: string;
  keyId?: string; // from backend createOrder response
  notes?: Record<string, string>;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
}) => {
  try {
    const response = await initiatePayment({
      amount: amount * 100, // Razorpay expects paise
      name: "HostHaven",
      description: `${propertyName} - ${nights} Night${nights > 1 ? "s" : ""}`,
      order_id: orderId,
      keyId, // key from backend
      prefill: {
        name: userName,
        email: userEmail,
        contact: userPhone,
      },
      notes: {
        property: propertyName,
        checkIn,
        checkOut,
        guests: guests.toString(),
        nights: nights.toString(),
        ...(notes || {}),
      },
    });

    return {
      success: true,
      paymentId: (response as RazorpayResponse).razorpay_payment_id,
      response,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Payment failed",
    };
  }
};
