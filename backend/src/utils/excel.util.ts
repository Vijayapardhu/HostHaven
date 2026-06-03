import * as XLSX from 'xlsx';
import prisma from '../config/database';

export interface ExcelColumn {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'select' | 'textarea';
  required?: boolean;
  options?: { value: string; label: string }[];
  sampleValues?: string[];
  dynamicOptions?: () => Promise<{ value: string; label: string }[]>;
}

export interface EntityConfig {
  tableName: string;
  columns: ExcelColumn[];
  relations?: {
    name: string;
    table: string;
    idField: string;
    nameField: string;
  }[];
}

const JSON_FIELDS = [
  "images", "videos", "amenities", "highlights", "featureFlags", "darshanTimings",
  "aartiTimings", "specialEvents", "entryFee", "seasonalPricing", "faqs", "businessDocuments",
  "guestDetails", "emailTemplates", "homepageConfig", "bookingIds", "changes", "data"
];

const BOOLEAN_FIELDS = [
  "isActive", "isVerified", "isDeleted", "deletedAt", "twoFactorEnabled", "isFeatured",
  "registrationFeePaid", "active", "parkingAvailable", "wheelchairAccessible",
  "cloakroomAvailable", "restroomsAvailable", "drinkingWaterAvailable", "prasadamCounterAvailable",
  "photographyAllowed", "isReviewed", "vendorVerified", "isForAdmin", "isRead",
  "emailNotifications", "smsNotifications", "pushNotifications", "bookingNotifications",
  "paymentNotifications", "reviewNotifications", "promotionalNotifications", "resolved"
];

const DATE_FIELDS = [
  "createdAt", "updatedAt", "deletedAt", "emailVerifiedAt", "emailVerificationExpires",
  "passwordResetExpires", "lastLoginAt", "lockedUntil", "approvedAt", "rejectedAt",
  "registrationPaidAt", "cancelledAt", "actualCheckIn", "actualCheckOut", "refundedAt",
  "processedAt", "vendorVerifiedAt", "validFrom", "validUntil", "readAt", "resolvedAt",
  "scheduledAt", "sentAt", "expiresAt", "checkInDate", "checkOutDate", "serviceDate"
];

// Dynamic city options fetcher
const getCityOptions = async (): Promise<{ value: string; label: string }[]> => {
  try {
    const cities = await prisma.platformCity.findMany({
      where: { isActive: true },
      select: { name: true },
      orderBy: { name: 'asc' }
    });
    return cities.map(c => ({ value: c.name, label: c.name }));
  } catch {
    return [];
  }
};

const ENTITY_CONFIGS: Record<string, EntityConfig> = {
  users: {
    tableName: 'users',
    columns: [
      { key: 'name', label: 'Name', type: 'string', required: true },
      { key: 'email', label: 'Email', type: 'string', required: true },
      { key: 'phone', label: 'Phone', type: 'string' },
      { key: 'role', label: 'Role', type: 'select', required: true, options: [
        { value: 'USER', label: 'USER' },
        { value: 'VENDOR', label: 'VENDOR' },
        { value: 'ADMIN', label: 'ADMIN' },
      ]},
    ],
  },
  vendors: {
    tableName: 'vendors',
    columns: [
      { key: 'businessName', label: 'Business Name', type: 'string', required: true },
      { key: 'ownerName', label: 'Owner Name', type: 'string', required: true },
      { key: 'email', label: 'Email', type: 'string', required: true },
      { key: 'phone', label: 'Phone', type: 'string', required: true },
      { key: 'city', label: 'City', type: 'string', required: true, dynamicOptions: getCityOptions },
      { key: 'commissionRate', label: 'Commission Rate (%)', type: 'number' },
    ],
  },
  properties: {
    tableName: 'properties',
    columns: [
      { key: 'name', label: 'Property Name', type: 'string', required: true },
      { key: 'type', label: 'Type', type: 'select', required: true, options: [
        { value: 'HOTEL', label: 'HOTEL' },
        { value: 'HOME', label: 'HOME' },
        { value: 'TEMPLE', label: 'TEMPLE' },
      ]},
      { key: 'city', label: 'City', type: 'string', required: true, dynamicOptions: getCityOptions },
      { key: 'status', label: 'Status', type: 'select', options: [
        { value: 'DRAFT', label: 'DRAFT' },
        { value: 'PENDING', label: 'PENDING' },
        { value: 'ACTIVE', label: 'ACTIVE' },
        { value: 'INACTIVE', label: 'INACTIVE' },
      ]},
      { key: 'vendorId', label: 'Vendor ID', type: 'string' },
      { key: 'vendorBusinessName', label: 'Vendor Business Name', type: 'string' },
    ],
    relations: [
      { name: 'vendor', table: 'vendors', idField: 'vendorId', nameField: 'businessName' },
    ],
  },
  rooms: {
    tableName: 'rooms',
    columns: [
      { key: 'propertyId', label: 'Property ID', type: 'string', required: true },
      { key: 'name', label: 'Room Name', type: 'string', required: true },
      { key: 'type', label: 'Room Type', type: 'string', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'totalRooms', label: 'Total Rooms', type: 'number', required: true },
      { key: 'availableRooms', label: 'Available Rooms', type: 'number' },
      { key: 'pricePerNight', label: 'Price Per Night', type: 'number', required: true },
      { key: 'weekendPrice', label: 'Weekend Price', type: 'number' },
      { key: 'capacity', label: 'Capacity', type: 'number' },
      { key: 'isActive', label: 'Is Active', type: 'boolean' },
    ],
  },
  bookings: {
    tableName: 'bookings',
    columns: [
      { key: 'bookingNumber', label: 'Booking Number', type: 'string' },
      { key: 'userId', label: 'User ID', type: 'string' },
      { key: 'userName', label: 'User Name', type: 'string' },
      { key: 'userEmail', label: 'User Email', type: 'string' },
      { key: 'propertyId', label: 'Property ID', type: 'string' },
      { key: 'propertyName', label: 'Property Name', type: 'string' },
      { key: 'status', label: 'Status', type: 'select', options: [
        { value: 'PENDING', label: 'PENDING' },
        { value: 'CONFIRMED', label: 'CONFIRMED' },
        { value: 'CHECKED_IN', label: 'CHECKED_IN' },
        { value: 'CHECKED_OUT', label: 'CHECKED_OUT' },
        { value: 'CANCELLED', label: 'CANCELLED' },
        { value: 'NO_SHOW', label: 'NO_SHOW' },
      ]},
      { key: 'checkInDate', label: 'Check In Date', type: 'date' },
      { key: 'checkOutDate', label: 'Check Out Date', type: 'date' },
      { key: 'totalAmount', label: 'Total Amount', type: 'number' },
    ],
  },
  services: {
    tableName: 'services',
    columns: [
      { key: 'name', label: 'Service Name', type: 'string', required: true },
      { key: 'slug', label: 'Slug', type: 'string' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'category', label: 'Category', type: 'string', required: true },
      { key: 'price', label: 'Price', type: 'number', required: true },
      { key: 'priceUnit', label: 'Price Unit', type: 'select', options: [
        { value: 'per_person', label: 'per_person' },
        { value: 'per_booking', label: 'per_booking' },
        { value: 'per_hour', label: 'per_hour' },
      ]},
      { key: 'isActive', label: 'Is Active', type: 'boolean' },
    ],
  },
  temples: {
    tableName: 'temples',
    columns: [
      { key: 'name', label: 'Temple Name', type: 'string', required: true },
      { key: 'slug', label: 'Slug', type: 'string' },
      { key: 'city', label: 'City', type: 'string', required: true, dynamicOptions: getCityOptions },
      { key: 'fullAddress', label: 'Full Address', type: 'string' },
      { key: 'deityName', label: 'Deity Name', type: 'string', required: true },
      { key: 'templeType', label: 'Temple Type', type: 'string' },
      { key: 'builtYear', label: 'Built Year', type: 'string' },
      { key: 'morningAarti', label: 'Morning Aarti', type: 'string' },
      { key: 'eveningAarti', label: 'Evening Aarti', type: 'string' },
      { key: 'generalEntryFee', label: 'General Entry Fee', type: 'string' },
      { key: 'parkingAvailable', label: 'Parking Available', type: 'boolean' },
      { key: 'active', label: 'Is Active', type: 'boolean' },
    ],
  },
  coupons: {
    tableName: 'coupons',
    columns: [
      { key: 'code', label: 'Coupon Code', type: 'string', required: true },
      { key: 'discountType', label: 'Discount Type', type: 'select', required: true, options: [
        { value: 'percentage', label: 'percentage' },
        { value: 'fixed', label: 'fixed' },
      ]},
      { key: 'discountValue', label: 'Discount Value', type: 'number', required: true },
      { key: 'minBookingAmount', label: 'Min Booking Amount', type: 'number' },
      { key: 'maxDiscountAmount', label: 'Max Discount Amount', type: 'number' },
      { key: 'validFrom', label: 'Valid From', type: 'date' },
      { key: 'validUntil', label: 'Valid Until', type: 'date' },
      { key: 'isActive', label: 'Is Active', type: 'boolean' },
    ],
  },
  platformCities: {
    tableName: 'platformCities',
    columns: [
      { key: 'name', label: 'City Name', type: 'string', required: true },
      { key: 'state', label: 'State', type: 'string' },
      { key: 'country', label: 'Country', type: 'string' },
      { key: 'isActive', label: 'Is Active', type: 'boolean' },
    ],
  },
  platformAmenities: {
    tableName: 'platformAmenities',
    columns: [
      { key: 'name', label: 'Amenity Name', type: 'string', required: true },
      { key: 'category', label: 'Category', type: 'string' },
      { key: 'icon', label: 'Icon', type: 'string' },
      { key: 'isActive', label: 'Is Active', type: 'boolean' },
    ],
  },
  cancellationPolicies: {
    tableName: 'cancellationPolicies',
    columns: [
      { key: 'propertyId', label: 'Property ID', type: 'string', required: true },
      { key: 'freeBeforeHours', label: 'Free Before Hours', type: 'number', required: true },
      { key: 'refundPercentBefore', label: 'Refund % Before', type: 'number', required: true },
      { key: 'refundPercentAfter', label: 'Refund % After', type: 'number', required: true },
    ],
  },
  payouts: {
    tableName: 'payouts',
    columns: [
      { key: 'vendorId', label: 'Vendor ID', type: 'string' },
      { key: 'vendorBusinessName', label: 'Vendor Business Name', type: 'string' },
      { key: 'amount', label: 'Amount', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: [
        { value: 'PENDING', label: 'PENDING' },
        { value: 'PROCESSING', label: 'PROCESSING' },
        { value: 'COMPLETED', label: 'COMPLETED' },
        { value: 'FAILED', label: 'FAILED' },
      ]},
    ],
  },
  payments: {
    tableName: 'payments',
    columns: [
      { key: 'bookingId', label: 'Booking ID', type: 'string' },
      { key: 'bookingNumber', label: 'Booking Number', type: 'string' },
      { key: 'amount', label: 'Amount', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: [
        { value: 'PENDING', label: 'PENDING' },
        { value: 'PROCESSING', label: 'PROCESSING' },
        { value: 'COMPLETED', label: 'COMPLETED' },
        { value: 'FAILED', label: 'FAILED' },
      ]},
      { key: 'method', label: 'Payment Method', type: 'select', options: [
        { value: 'RAZORPAY', label: 'RAZORPAY' },
        { value: 'UPI', label: 'UPI' },
        { value: 'CARD', label: 'CARD' },
        { value: 'CASH', label: 'CASH' },
      ]},
    ],
  },
  serviceBookings: {
    tableName: 'serviceBookings',
    columns: [
      { key: 'serviceId', label: 'Service ID', type: 'string' },
      { key: 'serviceName', label: 'Service Name', type: 'string' },
      { key: 'userId', label: 'User ID', type: 'string' },
      { key: 'userName', label: 'User Name', type: 'string' },
      { key: 'userEmail', label: 'User Email', type: 'string' },
      { key: 'serviceCategory', label: 'Category', type: 'string' },
      { key: 'serviceDate', label: 'Service Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: [
        { value: 'PENDING', label: 'PENDING' },
        { value: 'ADVANCE_PAID', label: 'ADVANCE_PAID' },
        { value: 'CONFIRMED', label: 'CONFIRMED' },
        { value: 'COMPLETED', label: 'COMPLETED' },
        { value: 'CANCELLED', label: 'CANCELLED' },
      ]},
      { key: 'totalAmount', label: 'Total Amount', type: 'number' },
      { key: 'advancePaid', label: 'Advance Paid', type: 'number' },
    ],
  },
  reviews: {
    tableName: 'reviews',
    columns: [
      { key: 'propertyId', label: 'Property ID', type: 'string' },
      { key: 'userId', label: 'User ID', type: 'string' },
      { key: 'userName', label: 'User Name', type: 'string' },
      { key: 'rating', label: 'Rating', type: 'number', required: true },
      { key: 'comment', label: 'Comment', type: 'textarea' },
      { key: 'isVerified', label: 'Is Verified', type: 'boolean' },
      { key: 'isHidden', label: 'Is Hidden', type: 'boolean' },
      { key: 'isApproved', label: 'Is Approved', type: 'boolean' },
    ],
  },
  supportTickets: {
    tableName: 'supportTickets',
    columns: [
      { key: 'userId', label: 'User ID', type: 'string' },
      { key: 'userName', label: 'User Name', type: 'string' },
      { key: 'userEmail', label: 'User Email', type: 'string' },
      { key: 'subject', label: 'Subject', type: 'string', required: true },
      { key: 'description', label: 'Description', type: 'textarea', required: true },
      { key: 'status', label: 'Status', type: 'select', options: [
        { value: 'OPEN', label: 'OPEN' },
        { value: 'IN_PROGRESS', label: 'IN_PROGRESS' },
        { value: 'RESOLVED', label: 'RESOLVED' },
      ]},
      { key: 'priority', label: 'Priority', type: 'select', options: [
        { value: 'low', label: 'low' },
        { value: 'medium', label: 'medium' },
        { value: 'high', label: 'high' },
      ]},
    ],
  },
};

export const getEntityConfig = (entity: string): EntityConfig | undefined => {
  return ENTITY_CONFIGS[entity.toLowerCase()];
};

export const getAllEntities = (): string[] => {
  return Object.keys(ENTITY_CONFIGS);
};

export const exportToExcel = <T extends Record<string, any>>(
  data: T[],
  entity: string,
  config?: EntityConfig
): Buffer => {
  if (data.length === 0) {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["No Data"]]), entity);
    return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
  }

  const processedData = data.map((row) => {
    const flat: Record<string, any> = {};
    for (const [key, value] of Object.entries(row)) {
      if (JSON_FIELDS.includes(key)) {
        flat[key] = typeof value === 'string' ? value : JSON.stringify(value);
      } else if (BOOLEAN_FIELDS.includes(key)) {
        flat[key] = value === true ? "TRUE" : value === false ? "FALSE" : "";
      } else if (DATE_FIELDS.includes(key) && value) {
        flat[key] = new Date(value).toISOString();
      } else {
        flat[key] = value;
      }
    }
    return flat;
  });

  const worksheet = XLSX.utils.json_to_sheet(processedData);
  
  const colWidths = Object.keys(processedData[0] || {}).map((key) => ({
    wch: Math.max(key.length, 15),
  }));
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, entity);

  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
};

export const importFromExcel = async (
  buffer: Buffer
): Promise<Record<string, any>[]> => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  return data as Record<string, any>[];
};

export const getAllFieldsForEntity = async (entity: string): Promise<string[]> => {
  const modelMap: Record<string, keyof typeof prisma> = {
    users: 'user',
    vendors: 'vendor',
    properties: 'property',
    rooms: 'room',
    temples: 'temple',
    bookings: 'booking',
    payments: 'payment',
    refunds: 'refund',
    payouts: 'payout',
    commissionLedgers: 'commissionLedger',
    coupons: 'coupon',
    couponUsages: 'couponUsage',
    reviews: 'review',
    wishlists: 'wishlist',
    cancellationPolicies: 'cancellationPolicy',
    services: 'service',
    serviceBookings: 'serviceBooking',
    supportTickets: 'supportTicket',
    platformSettings: 'platformSetting',
    emailTemplates: 'emailTemplate',
    platformCities: 'platformCity',
    platformAmenities: 'platformAmenity',
    media: 'media',
    auditLogs: 'auditLog',
    errorLogs: 'errorLog',
    broadcastNotifications: 'broadcastNotification',
    notifications: 'notification',
    sessions: 'session',
    templeDetails: 'templeDetails',
    inventoryLocks: 'inventoryLock',
    inventoryDays: 'inventoryDay',
    adminLogs: 'adminLog',
    userPushSubscriptions: 'userPushSubscription',
    userAddresses: 'userAddress',
  };

  const modelName = modelMap[entity.toLowerCase()];
  if (!modelName) return [];

  const model = prisma[modelName] as any;
  if (!model || !model.fields) return [];

  return Object.keys(model.fields);
};

export const exportAllFieldsToExcel = async (entity: string): Promise<Buffer> => {
  const modelMap: Record<string, keyof typeof prisma> = {
    users: 'user',
    vendors: 'vendor',
    properties: 'property',
    rooms: 'room',
    temples: 'temple',
    bookings: 'booking',
    payments: 'payment',
    refunds: 'refund',
    payouts: 'payout',
    commissionLedgers: 'commissionLedger',
    coupons: 'coupon',
    couponUsages: 'couponUsage',
    reviews: 'review',
    wishlists: 'wishlist',
    cancellationPolicies: 'cancellationPolicy',
    services: 'service',
    serviceBookings: 'serviceBooking',
    supportTickets: 'supportTicket',
    platformSettings: 'platformSetting',
    emailTemplates: 'emailTemplate',
    platformCities: 'platformCity',
    platformAmenities: 'platformAmenity',
    media: 'media',
    auditLogs: 'auditLog',
    errorLogs: 'errorLog',
    broadcastNotifications: 'broadcastNotification',
    notifications: 'notification',
    sessions: 'session',
    templeDetails: 'templeDetails',
    inventoryLocks: 'inventoryLock',
    inventoryDays: 'inventoryDay',
    adminLogs: 'adminLog',
    userPushSubscriptions: 'userPushSubscription',
    userAddresses: 'userAddress',
  };

  const modelName = modelMap[entity.toLowerCase()];
  if (!modelName) {
    throw new Error(`Unknown entity: ${entity}`);
  }

  const model = prisma[modelName] as any;
  const records = await model.findMany({ orderBy: { createdAt: 'desc' } });

  if (records.length === 0) {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["No Data"]]), entity);
    return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
  }

  const processedData = records.map((row: any) => {
    const flat: Record<string, any> = {};
    for (const [key, value] of Object.entries(row)) {
      if (JSON_FIELDS.includes(key)) {
        flat[key] = typeof value === 'string' ? value : JSON.stringify(value);
      } else if (BOOLEAN_FIELDS.includes(key)) {
        flat[key] = value === true ? "TRUE" : value === false ? "FALSE" : "";
      } else if (DATE_FIELDS.includes(key) && value && typeof value === 'object') {
        try { flat[key] = new Date(value as unknown as string | number | Date).toISOString(); } catch { flat[key] = String(value); }
      } else {
        flat[key] = value;
      }
    }
    return flat;
  });

  const worksheet = XLSX.utils.json_to_sheet(processedData);
  const colWidths = Object.keys(processedData[0] || {}).map((key) => ({
    wch: Math.max(key.length, 15),
  }));
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, entity);

  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
};

export const importAllFieldsFromExcel = async (
  entity: string,
  buffer: Buffer
): Promise<{ created: number; updated: number; errors: string[] }> => {
  const modelMap: Record<string, keyof typeof prisma> = {
    users: 'user',
    vendors: 'vendor',
    properties: 'property',
    rooms: 'room',
    temples: 'temple',
    bookings: 'booking',
    payments: 'payment',
    refunds: 'refund',
    payouts: 'payout',
    commissionLedgers: 'commissionLedger',
    coupons: 'coupon',
    couponUsages: 'couponUsage',
    reviews: 'review',
    wishlists: 'wishlist',
    cancellationPolicies: 'cancellationPolicy',
    services: 'service',
    serviceBookings: 'serviceBooking',
    supportTickets: 'supportTicket',
    platformSettings: 'platformSetting',
    emailTemplates: 'emailTemplate',
    platformCities: 'platformCity',
    platformAmenities: 'platformAmenity',
    media: 'media',
    auditLogs: 'auditLog',
    errorLogs: 'errorLog',
    broadcastNotifications: 'broadcastNotification',
    notifications: 'notification',
    sessions: 'session',
    templeDetails: 'templeDetails',
    inventoryLocks: 'inventoryLock',
    inventoryDays: 'inventoryDay',
    adminLogs: 'adminLog',
    userPushSubscriptions: 'userPushSubscription',
    userAddresses: 'userAddress',
  };

  const modelName = modelMap[entity.toLowerCase()];
  if (!modelName) {
    throw new Error(`Unknown entity: ${entity}`);
  }

  const model = prisma[modelName] as any;
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet) as any[];

  const results = { created: 0, updated: 0, errors: [] as string[] };

  for (const row of rows) {
    try {
      const data: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(row)) {
        if (value === undefined || value === null || value === "") continue;
        
        let val: any = value;
        
        if (JSON_FIELDS.includes(key)) {
          try { val = JSON.parse(String(val)); } catch { val = []; }
        } else if (BOOLEAN_FIELDS.includes(key)) {
          val = val?.toString().toUpperCase() === "TRUE";
        } else if (DATE_FIELDS.includes(key) && val) {
          try { val = new Date(String(val)); } catch { val = undefined; }
        }
        
        if (val !== undefined) data[key] = val;
      }

      if (data.id) {
        const existing = await model.findUnique({ where: { id: data.id } });
        if (existing) {
          delete data.id;
          await model.update({ where: { id: row.id }, data });
          results.updated++;
          continue;
        }
      }

      await model.create({ data });
      results.created++;
    } catch (err: any) {
      results.errors.push(`Row error: ${err.message}`);
    }
  }

  return results;
};

export const generateFullTemplate = async (entity: string): Promise<Buffer> => {
  const modelMap: Record<string, keyof typeof prisma> = {
    users: 'user',
    vendors: 'vendor',
    properties: 'property',
    rooms: 'room',
    temples: 'temple',
    bookings: 'booking',
    payments: 'payment',
    refunds: 'refund',
    payouts: 'payout',
    commissionLedgers: 'commissionLedger',
    coupons: 'coupon',
    couponUsages: 'couponUsage',
    reviews: 'review',
    wishlists: 'wishlist',
    cancellationPolicies: 'cancellationPolicy',
    services: 'service',
    serviceBookings: 'serviceBooking',
    supportTickets: 'supportTicket',
    platformSettings: 'platformSetting',
    emailTemplates: 'emailTemplate',
    platformCities: 'platformCity',
    platformAmenities: 'platformAmenity',
    media: 'media',
    auditLogs: 'auditLog',
    errorLogs: 'errorLog',
    broadcastNotifications: 'broadcastNotification',
    notifications: 'notification',
    sessions: 'session',
    templeDetails: 'templeDetails',
    inventoryLocks: 'inventoryLock',
    inventoryDays: 'inventoryDay',
    adminLogs: 'adminLog',
    userPushSubscriptions: 'userPushSubscription',
    userAddresses: 'userAddress',
  };

  const modelName = modelMap[entity.toLowerCase()];
  if (!modelName) {
    throw new Error(`Unknown entity: ${entity}`);
  }

  const model = prisma[modelName] as any;
  const fields = Object.keys(model.fields || {});

  const sampleData: Record<string, any> = {};
  for (const field of fields) {
    if (JSON_FIELDS.includes(field)) {
      sampleData[field] = "[]";
    } else if (BOOLEAN_FIELDS.includes(field)) {
      sampleData[field] = "TRUE";
    } else if (field === "id") {
      sampleData[field] = "";
    } else if (field.toLowerCase().includes("email")) {
      sampleData[field] = "example@email.com";
    } else if (field.toLowerCase().includes("url") || field.toLowerCase().includes("image")) {
      sampleData[field] = "https://example.com/image.jpg";
    } else {
      sampleData[field] = "";
    }
  }

  const worksheet = XLSX.utils.json_to_sheet([sampleData]);
  const colWidths = fields.map((f) => ({ wch: Math.max(f.length, 15) }));
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
};

export const generateTemplate = (
  entity: string,
  referenceData?: Record<string, { id: string; name: string }[]>
): Buffer => {
  const config = ENTITY_CONFIGS[entity.toLowerCase()];
  if (!config) {
    throw new Error(`Entity ${entity} not found`);
  }

  const templateData: Record<string, any>[] = [];
  
  const headers: Record<string, string> = {};
  config.columns.forEach((col) => {
    headers[col.key] = col.label;
  });

  if (referenceData) {
    Object.keys(referenceData).forEach((key) => {
      headers[`${key}Id`] = `${key} ID`;
      headers[`${key}Name`] = `${key} Name`;
    });
  }

  templateData.push(headers);

  config.columns.forEach((col, idx) => {
    if (col.required) {
      if (col.options && col.options.length > 0) {
        templateData[0][col.key] = col.options[0].value;
      } else if (col.type === 'string') {
        templateData[0][col.key] = `Sample ${col.label}`;
      } else if (col.type === 'number') {
        templateData[0][col.key] = 1;
      } else if (col.type === 'boolean') {
        templateData[0][col.key] = true;
      }
    }
  });

  if (referenceData) {
    Object.keys(referenceData).forEach((key) => {
      if (referenceData[key] && referenceData[key].length > 0) {
        templateData[0][`${key}Id`] = referenceData[key][0].id;
        templateData[0][`${key}Name`] = referenceData[key][0].name;
      }
    });
  }

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  
  const colWidths = config.columns.map((col) => ({
    wch: Math.max(col.label.length, 15),
  }));
  
  if (referenceData) {
    Object.keys(referenceData).forEach(() => {
      colWidths.push({ wch: 20 });
      colWidths.push({ wch: 20 });
    });
  }
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

  if (referenceData) {
    Object.keys(referenceData).forEach((key) => {
      if (referenceData[key] && referenceData[key].length > 0) {
        const refSheet = XLSX.utils.json_to_sheet(
          referenceData[key].map((item) => ({
            ID: item.id,
            Name: item.name,
          }))
        );
        refSheet['!cols'] = [{ wch: 40 }, { wch: 40 }];
        XLSX.utils.book_append_sheet(workbook, worksheet, key);
      }
    });
  }

  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
};

export { ENTITY_CONFIGS };
export { JSON_FIELDS, BOOLEAN_FIELDS, DATE_FIELDS };
