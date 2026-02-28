import api from "@/lib/api";

export interface Booking {
  id: string;
  bookingNumber?: string;
  user?: { name: string; email: string };
  property?: { name: string; city: string };
  checkInDate: string;
  checkOutDate: string;
  adults?: number;
  children?: number;
  totalAmount?: number;
  status: string;
  paymentStatus?: string;
  createdAt?: string;
}

export const bookingsService = {
  getBookings: async (params?: Record<string, string | number>) => {
    const response = await api.get("/v1/vendor/bookings", { params });
    return response.data;
  },

  getBookingById: async (id: string) => {
    const response = await api.get(`/v1/vendor/bookings/${id}`);
    return response.data;
  },

  updateBookingStatus: async (id: string, status: string) => {
    const response = await api.patch(`/v1/vendor/bookings/${id}/status`, {
      status,
    });
    return response.data;
  },

  quickBooking: async (data: unknown) => {
    const response = await api.post("/v1/vendor/bookings/quick-booking", data);
    return response.data;
  },

  checkIn: async (id: string) => {
    const response = await api.patch(`/v1/vendor/bookings/${id}/checkin`);
    return response.data;
  },

  checkOut: async (id: string) => {
    const response = await api.patch(`/v1/vendor/bookings/${id}/checkout`);
    return response.data;
  },

  getInvoice: async (id: string) => {
    const response = await api.get(`/v1/vendor/bookings/${id}/invoice`);
    return response.data;
  },
};
