import api from "@/lib/api";

export const paymentsService = {
  getPublicKey: async () => {
    const response = await api.get("/v1/payments/public-key");
    return response.data;
  },

  createOrder: async (bookingId: string) => {
    const response = await api.post("/v1/payments/create-order", { bookingId });
    return response.data;
  },

  createVendorOrder: async (bookingId: string) => {
    const response = await api.post("/v1/payments/vendor/create-order", { bookingId });
    return response.data;
  },

  verifyPayment: async (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    const response = await api.post("/v1/payments/verify", data);
    return response.data;
  },
};
