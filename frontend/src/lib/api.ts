const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000/v1').replace(/\/$/, '');

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

class ApiService {
  private baseUrl: string;
  push!: {
    getVapidKey: () => Promise<{ publicKey: string }>;
    subscribe: (subscription: any) => Promise<{ message: string }>;
    unsubscribe: (endpoint: string) => Promise<{ message: string }>;
  };

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = localStorage.getItem('vendorToken') || localStorage.getItem('accessToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const data: ApiResponse<T> = await response.json();

    if (!response.ok || !data.success) {
      const error = data.error || {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
      };
      throw new Error(error.message);
    }

    return data.data as T;
  }

  async get<T>(endpoint: string, includeAuth: boolean = true): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(includeAuth),
    });

    return this.handleResponse<T>(response);
  }

  // For paginated endpoints where meta is sent as a sibling of data in the response envelope
  private async getPage<T>(endpoint: string, includeAuth: boolean = true): Promise<{ data: T; meta: any }> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(includeAuth),
    });
    const json = await response.json();
    if (!response.ok || !json.success) {
      const error = json.error || { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred' };
      throw new Error(error.message);
    }
    return { data: json.data as T, meta: json.meta };
  }

  async post<T>(endpoint: string, body?: any, includeAuth: boolean = false): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(includeAuth),
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, body?: any, includeAuth: boolean = true): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(includeAuth),
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string, includeAuth: boolean = true, body?: unknown): Promise<T> {
    const options: RequestInit = {
      method: 'DELETE',
      headers: this.getHeaders(includeAuth),
    };
    if (body !== undefined) {
      options.body = JSON.stringify(body);
    }
    const response = await fetch(`${this.baseUrl}${endpoint}`, options);

    return this.handleResponse<T>(response);
  }

  // Auth endpoints
  auth = {
    register: (data: { name: string; email: string; password: string; confirmPassword: string }) =>
      this.post<{ user: any; message: string }>('/auth/register', data),

    login: (data: { email: string; password: string }) =>
      this.post<{ user: any; tokens: { accessToken: string; refreshToken: string; expiresIn: number } }>(
        '/auth/login',
        data
      ),

    loginWithGoogle: (idToken: string) =>
      this.post<{ user: any; tokens: { accessToken: string; refreshToken: string; expiresIn: number }; isNewUser: boolean }>(
        '/auth/google',
        { idToken }
      ),

    getGoogleAuthUrl: () =>
      this.get<{ url: string; state: string }>('/auth/google', false),

    refreshTokens: (refreshToken: string) =>
      this.post<{ accessToken: string; refreshToken: string; expiresIn: number }>(
        '/auth/refresh',
        { refreshToken }
      ),

    logout: (refreshToken?: string) =>
      this.post<{ message: string }>('/auth/logout', { refreshToken }, true),

    logoutAll: () =>
      this.post<{ message: string }>('/auth/logout-all', {}, true),

    getMe: () =>
      this.get<{ user: any }>('/auth/me'),

    verifyEmail: (token: string) =>
      this.post<{ message: string }>('/auth/verify-email', { token }),

    resendVerification: (email: string) =>
      this.post<{ message: string }>('/auth/resend-verification', { email }),

    forgotPassword: (email: string) =>
      this.post<{ message: string }>('/auth/forgot-password', { email }),

    resetPassword: (token: string, password: string, confirmPassword: string) =>
      this.post<{ message: string }>('/auth/reset-password', { token, password, confirmPassword }),

    linkGoogle: (idToken: string) =>
      this.post<{ message: string }>('/auth/link-google', { idToken }, true),

    unlinkGoogle: () =>
      this.delete<{ message: string }>('/auth/unlink-google'),

    updateProfile: (data: { name?: string; avatar?: string; phone?: string }) =>
      this.put<{ user: any }>('/auth/profile', data),

    changePassword: (currentPassword: string, newPassword: string) =>
      this.post<{ message: string }>('/auth/change-password', { currentPassword, newPassword }),

    uploadAvatar: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'hosthaven/avatars');

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${this.baseUrl}/uploads/single?folder=hosthaven/avatars`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Upload failed');
      }
      return data.data.url;
    },

    getNotifications: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : '';
      return this.getPage<any[]>(`/notifications${query}`);
    },

    markNotificationRead: (id: string) =>
      this.put<any>(`/notifications/${id}/read`, {}),

    markAllNotificationsRead: () =>
      this.put<any>(`/notifications/read-all`, {}),

    getAddresses: () =>
      this.get<any[]>('/auth/addresses'),

    addAddress: (data: { label: string; address: string; city: string; state: string; pincode: string }) =>
      this.post<any>('/auth/addresses', data),

    updateAddress: (id: string, data: { label?: string; address?: string; city?: string; state?: string; pincode?: string }) =>
      this.put<any>(`/auth/addresses/${id}`, data),

    deleteAddress: (id: string) =>
      this.delete<any>(`/auth/addresses/${id}`),
  };

  // Properties endpoints
  properties = {
    getAll: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : '';
      return this.getPage<any[]>(`/properties${query}`);
    },

    getById: (id: string) =>
      this.get<any>(`/properties/${id}`),

    getFeatured: () =>
      this.get<any[]>(`/properties/featured`, false),

    getCities: () =>
      this.get<Array<{ city: string; state: string; count: number }>>(`/properties/cities`, false),

    search: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : '';
      return this.getPage<any[]>(`/properties/search${query}`, false);
    },
  };

  // Inventory endpoints
  inventory = {
    lock: (data: { roomId: string; checkIn: string; checkOut: string; quantity?: number }) =>
      this.post<any>('/inventory/lock', data, true),

    release: (data: { roomId: string }) =>
      this.post<any>('/inventory/release', data, true),

    getAvailability: (params: { roomId: string; date: string }) => {
      const query = new URLSearchParams(params).toString();
      return this.get<any>(`/inventory?${query}`, true);
    },
  };

  // Service booking endpoints
  serviceBookings = {
    create: (data: {
      serviceId?: string;
      serviceName: string;
      serviceCategory?: string;
      serviceDate: string;
      serviceTime: string;
      location: string;
      notes?: string;
      advanceAmount: number;
      totalAmount?: number;
      razorpayPaymentId: string;
      razorpayOrderId?: string;
    }) => this.post<any>('/services/bookings', data, true),

    getMy: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : '';
      return this.get<any>(`/services/bookings/my${query}`, true);
    },
  };

  payments = {
    createOrder: (bookingId: string) =>
      this.post<{ orderId: string; amount: number; currency: string; keyId: string }>(
        '/payments/create-order',
        { bookingId },
        true
      ),

    verify: (data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
      this.post<any>('/payments/verify', data, true),
  };

  bookings = {
    create: (data: {
      propertyId: string;
      roomId?: string;
      checkInDate: string;
      checkOutDate: string;
      adults: number;
      children?: number;
      extraBeds?: number;
      specialRequests?: string;
      guestDetails?: Array<{ name: string; age: number; gender: 'male' | 'female' | 'other'; idProof?: string }>;
    }) => this.post<any>('/bookings', data, true),

    cancel: (bookingId: string, reason?: string) =>
      this.put<any>(`/bookings/${bookingId}/cancel`, { reason }, true),

    getMy: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : '';
      return this.getPage<any[]>(`/bookings${query}`);
    },
  };

  // Support ticket endpoints
  support = {
    create: (data: {
      category: string;
      bookingReference?: string;
      message: string;
      attachmentUrl?: string;
    }) => this.post<any>('/support/tickets', data, true),

    getMy: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : '';
      return this.getPage<any[]>(`/support/tickets/my${query}`, true);
    },
  };

  // Temples endpoints
  temples = {
    getAll: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : '';
      return this.getPage<any[]>(`/temples${query}`, false);
    },

    getById: (idOrSlug: string) =>
      this.get<any>(`/temples/${idOrSlug}`, false),
  };

  // Services endpoints (public listing)
  services = {
    getAll: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : '';
      return this.getPage<any[]>(`/services${query}`, false);
    },

    getById: (id: string) =>
      this.get<any>(`/services/${id}`, false),
  };

  // Reviews endpoints (public)
  reviews = {
    getByProperty: (propertyId: string, params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : '';
      return this.get<any>(`/reviews/property/${propertyId}${query}`, false);
    },
  };

  // Contact form
  contact = {
    submit: (data: {
      name: string;
      email: string;
      phone: string;
      subject: string;
      message: string;
    }) => this.post<any>('/support/tickets', {
      category: data.subject,
      message: `Name: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone}\n\n${data.message}`,
    }, true),
  };

  // Wishlist endpoints
  wishlist = {
    getAll: () =>
      this.getPage<any[]>('/wishlist'),

    add: (data: { itemType: string; itemId: string; itemName: string; itemImage: string; itemLocation: string; itemPrice?: number; itemRating?: number }) =>
      this.post<{ item: any }>('/wishlist', data, true),

    remove: (id: string) =>
      this.delete<{ success: boolean }>(`/wishlist/${id}`),
  };

  // Vendor endpoints
  vendor = {
    login: (email: string, password: string) =>
      this.post<{ user: any; vendor: any; accessToken: string; refreshToken: string }>(
        '/vendor/login',
        { email, password }
      ),

    register: (data: {
      email: string;
      password: string;
      name: string;
      phone?: string;
      businessName: string;
      businessAddress?: string;
      gstNumber?: string;
      panNumber?: string;
    }) =>
      this.post<{ user: any; vendor: any; accessToken: string; refreshToken: string }>(
        '/vendor/register',
        data
      ),

    forgotPassword: (email: string) =>
      this.post<{ message: string }>('/auth/forgot-password', { email }),

    resetPassword: (token: string, password: string, confirmPassword: string) =>
      this.post<{ message: string }>('/auth/reset-password', { token, password, confirmPassword }),

    getDashboard: () =>
      this.get<any>('/vendor/dashboard'),

    getProfile: () =>
      this.get<any>('/vendor/profile'),

    updateProfile: (data: {
      businessName?: string;
      businessAddress?: string;
      gstNumber?: string;
      panNumber?: string;
      aadhaarNumber?: string;
      bankAccount?: {
        bankName: string;
        accountNumber: string;
        ifscCode: string;
        accountHolderName: string;
      };
    }) =>
      this.put<any>('/vendor/profile', data),

    getProperties: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : '';
      return this.getPage<any[]>(`/vendor/properties${query}`);
    },

    getPropertyById: (id: string) =>
      this.get<any>(`/properties/${id}`),

    createProperty: (data: any) =>
      this.post<any>('/properties', data, true),

    updateProperty: (id: string, data: any) =>
      this.put<any>(`/properties/${id}`, data),

    deleteProperty: (id: string) =>
      this.delete<any>(`/properties/${id}`),

    getRooms: (propertyId: string) =>
      this.get<any>(`/rooms/property/${propertyId}`),

    createRoom: (data: any) =>
      this.post<any>('/rooms', data, true),

    updateRoom: (id: string, data: any) =>
      this.put<any>(`/rooms/${id}`, data),

    deleteRoom: (id: string) =>
      this.delete<any>(`/rooms/${id}`),

    getBookings: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : '';
      return this.getPage<any[]>(`/bookings/vendor/bookings${query}`);
    },

    getBookingById: (id: string) =>
      this.get<any>(`/bookings/${id}`),

    updateBookingStatus: (id: string, status: string) => {
      if (status === 'CHECKED_IN') return this.put<any>(`/bookings/vendor/${id}/check-in`, {});
      if (status === 'CHECKED_OUT') return this.put<any>(`/bookings/vendor/${id}/check-out`, {});
      if (status === 'CANCELLED') return this.put<any>(`/bookings/${id}/cancel`, { reason: 'Cancelled by vendor' });
      return this.put<any>(`/bookings/${id}/cancel`, { reason: status });
    },

    quickBooking: (data: {
      propertyId: string;
      roomId: string;
      guestName: string;
      guestPhone: string;
      guestEmail?: string;
      checkInDate: string;
      checkOutDate: string;
      adults: number;
      children?: number;
      totalAmount: number;
      paymentMethod: 'CASH' | 'CARD' | 'UPI' | 'ONLINE';
      isOnline?: boolean;
    }) => this.post<any>('/bookings/vendor/quick-booking', data, true),

    checkIn: (id: string) =>
      this.put<any>(`/bookings/vendor/${id}/check-in`, {}),

    checkOut: (id: string) =>
      this.put<any>(`/bookings/vendor/${id}/check-out`, {}),

    getInvoice: (id: string) =>
      this.get<any>(`/bookings/vendor/${id}/invoice`),

    getRoomInventory: (date?: string) => {
      const query = date ? `?date=${date}` : '';
      return this.get<any>(`/bookings/vendor/inventory${query}`);
    },

    getNotifications: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : '';
      return this.getPage<any[]>(`/vendor/notifications${query}`);
    },

    markNotificationRead: (id: string) =>
      this.put<any>(`/vendor/notifications/${id}/read`, {}),

    markAllNotificationsRead: () =>
      this.put<any>(`/vendor/notifications/read-all`, {}),

    getReviews: (propertyId: string) =>
      this.get<any>(`/reviews/property/${propertyId}`),

    getTempleDetails: (propertyId: string) =>
      this.get<any>(`/temples/${propertyId}`),

    updateTempleDetails: (propertyId: string, data: any) =>
      this.put<any>(`/temples/${propertyId}`, data),

    uploadImage: async (file: File, folder: string = 'hosthaven') => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const token = localStorage.getItem('vendorToken') || localStorage.getItem('accessToken');
      const response = await fetch(`${this.baseUrl}/uploads/single?folder=${folder}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Upload failed');
      }
      return data.data;
    },
  };

  // Admin endpoints
  admin = {
    getDashboard: () =>
      this.get<any>('/admin/dashboard'),

    getStats: (startDate?: string, endDate?: string) => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      return this.get<any>(`/admin/stats?${params}`);
    },

    getUsers: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : '';
      return this.get<any>(`/admin/users${query}`);
    },

    updateUserStatus: (userId: string, isActive: boolean) =>
      this.put<any>(`/admin/users/${userId}/status`, { isActive }),

    getProperties: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : '';
      return this.get<any>(`/admin/properties${query}`);
    },

    updatePropertyStatus: (propertyId: string, status: string, reason?: string) =>
      this.put<any>(`/admin/properties/${propertyId}/status`, { status, reason }),

    getVendors: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : '';
      return this.get<any>(`/vendor${query}`);
    },

    approveVendor: (vendorId: string) =>
      this.put<any>(`/vendor/${vendorId}/approve`, {}),

    getNotifications: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : '';
      return this.get<any>(`/admin/notifications${query}`);
    },

    markNotificationRead: (id: string) =>
      this.put<any>(`/admin/notifications/${id}/read`, {}),

    markAllNotificationsRead: () =>
      this.put<any>(`/admin/notifications/read-all`, {}),
  };
}

export const api = new ApiService(API_URL);

api.push = {
  getVapidKey: () =>
    api.get<{ publicKey: string }>('/push/vapid-key', false),

  subscribe: (subscription: any) =>
    api.post<{ message: string }>('/push/subscribe', subscription, true),

  unsubscribe: (endpoint: string) =>
    api.delete<{ message: string }>('/push/unsubscribe', true, { endpoint }),
};

export default api;
