import api from "@/lib/api";

const getData = (response: any) => response?.data ?? response;

export interface Booking {
  id: string
  bookingNumber: string
  userId: string
  user?: {
    id: string
    phone: string
    name?: string
    email?: string
  }
  propertyId: string
  property?: {
    id: string
    name: string
    type: string
  }
  checkInDate: string
  checkOutDate: string
  roomsBooked?: number
  nights?: number
  totalAmount: number
  amountPaid?: number
  status: string
  paymentStatus: string
  createdAt: string
  commissionAmount?: number
  vendorEarning?: number
  commissionRate?: number
  adults?: number
  children?: number
  paymentMethod?: string
  advancePaid?: number
}

export interface BookingRecord extends Omit<Booking, 'user'> {
  user?: {
    name: string
    email: string
  }
}

const mapBooking = (booking: any): Booking => ({
  id: booking.id,
  bookingNumber: booking.bookingNumber ?? booking.id,
  userId: booking.user?.id ?? booking.userId,
  user: booking.user,
  propertyId: booking.property?.id ?? booking.propertyId,
  property: booking.property,
  checkInDate: booking.checkInDate,
  checkOutDate: booking.checkOutDate,
  roomsBooked: booking.roomsBooked,
  nights: booking.nights,
  totalAmount: Number(booking.totalAmount ?? 0),
  amountPaid: booking.amountPaid,
  status: booking.status,
  paymentStatus: booking.paymentStatus,
  createdAt: booking.createdAt,
  commissionAmount: booking.commissionAmount,
  vendorEarning: booking.vendorEarning,
  commissionRate: booking.commissionRate,
})

export const bookingsService = {
  getBookings: async (params?: Record<string, string>) => {
    const response = await api.get("/v1/bookings/vendor/bookings", { params });
    const payload = response?.data
    const body = payload?.data
    const data = Array.isArray(body)
      ? body
      : body?.bookings ?? body?.data ?? []
    const meta = payload?.meta ?? body?.meta ?? body?.pagination
    return {
      data: Array.isArray(data) ? data.map(mapBooking) : [],
      pagination: meta ? {
        total: meta.total ?? 0,
        page: meta.page ?? 1,
        limit: meta.limit ?? 10,
        totalPages: meta.totalPages ?? 1,
      } : { total: 0, page: 1, limit: 10, totalPages: 1 },
    }
  },

  getVendorBookings: async (params?: Record<string, string>) => {
    const response = await api.get("/v1/bookings/vendor/bookings", { params });
    const payload = response?.data
    const body = payload?.data
    const data = Array.isArray(body)
      ? body
      : body?.bookings ?? body?.data ?? []
    const meta = payload?.meta ?? body?.meta ?? body?.pagination
    return {
      data: Array.isArray(data) ? data.map(mapBooking) : [],
      pagination: meta ? {
        total: meta.total ?? 0,
        page: meta.page ?? 1,
        limit: meta.limit ?? 10,
        totalPages: meta.totalPages ?? 1,
      } : { total: 0, page: 1, limit: 10, totalPages: 1 },
    }
  },

  getBookingById: async (id: string) => {
    const response = await api.get(`/v1/bookings/${id}`);
    return mapBooking(getData(response.data));
  },

  updateBookingStatus: async (id: string, status: string) => {
    if (status === "CHECKED_IN") {
      const response = await api.put(`/v1/bookings/vendor/${id}/check-in`);
      return getData(response.data);
    }
    if (status === "CHECKED_OUT") {
      const response = await api.put(`/v1/bookings/vendor/${id}/check-out`);
      return getData(response.data);
    }
    if (status === "CANCELLED") {
      const response = await api.put(`/v1/bookings/${id}/cancel`);
      return getData(response.data);
    }
    throw new Error(`Unsupported status transition: ${status}`);
  },

  quickBooking: async (data: unknown) => {
    const response = await api.post("/v1/bookings/vendor/quick-booking", data);
    return getData(response.data);
  },

  checkIn: async (id: string) => {
    const response = await api.put(`/v1/bookings/vendor/${id}/check-in`);
    return getData(response.data);
  },

  checkOut: async (id: string) => {
    const response = await api.put(`/v1/bookings/vendor/${id}/check-out`);
    return getData(response.data);
  },

  getInvoice: async (id: string) => {
    const response = await api.get(`/v1/bookings/vendor/${id}/invoice`);
    return getData(response.data);
  },
};
