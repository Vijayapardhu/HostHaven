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

// Razorpay Key Configuration
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY || "";

export const initiatePayment = (options: Partial<RazorpayOptions>) => {
  return new Promise((resolve, reject) => {
    // Check if Razorpay key is configured
    if (!RAZORPAY_KEY) {
      const errorMsg = 
        "Razorpay API key not configured!\n\n" +
        "To enable payments:\n" +
        "1. Sign up at https://dashboard.razorpay.com/signup (FREE)\n" +
        "2. Go to Settings → API Keys → Generate Test Key\n" +
        "3. Add to frontend/.env file:\n" +
        "   VITE_RAZORPAY_KEY=rzp_test_YourKeyHere\n" +
        "4. Restart the development server";
      
      alert(errorMsg);
      reject(new Error("Razorpay API key not configured"));
      return;
    }

    if (!window.Razorpay) {
      reject(new Error("Razorpay SDK not loaded. Please check your internet connection."));
      return;
    }

    const defaultOptions: RazorpayOptions = {
      key: RAZORPAY_KEY,
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

    const razorpayInstance = new window.Razorpay(defaultOptions);
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
  userName?: string;
  userEmail?: string;
  userPhone?: string;
}) => {
  try {
    const response = await initiatePayment({
      amount: amount * 100, // Razorpay expects amount in paise
      name: "HostHaven",
      description: `${propertyName} - ${nights} Night${nights > 1 ? "s" : ""}`,
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
