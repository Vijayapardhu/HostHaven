import api from "@/lib/api";

const getData = (response: any) => response?.data?.data ?? response?.data ?? response;

export const paymentsService = {
  getPublicKey: async () => {
    const response = await api.get("/v1/payments/public-key");
    return getData(response.data);
  },

  createOrder: async (bookingId: string) => {
    const response = await api.post("/v1/payments/create-order", { bookingId });
    return getData(response.data);
  },

  createVendorOrder: async (bookingId: string) => {
    const response = await api.post("/v1/payments/vendor/create-order", { bookingId });
    return getData(response.data);
  },

  verifyPayment: async (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    const response = await api.post("/v1/payments/verify", data);
    return getData(response.data);
  },
};
