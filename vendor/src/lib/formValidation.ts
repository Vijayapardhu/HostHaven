/**
 * Frontend Form Validation Rules
 * Mirrors backend validation to provide real-time feedback to users
 */

export const VALIDATION_RULES = {
  // Auth Fields
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Invalid email address',
  },
  password: {
    min: 8,
    max: 100,
    uppercase: true,
    lowercase: true,
    number: true,
    special: true,
    message: 'Password must be 8-100 chars with uppercase, lowercase, number, and special character',
  },
  name: {
    min: 2,
    max: 100,
    message: '2-100 characters required',
  },
  phoneIndia: {
    pattern: /^[6-9]\d{9}$/,
    message: '10-digit Indian mobile number (6-9 start)',
  },

  // Property Fields
  propertyName: {
    min: 2,
    max: 200,
    message: '2-200 characters required',
  },
  propertyDescription: {
    min: 10,
    max: 5000,
    message: '10-5000 characters required',
  },
  propertyShortDesc: {
    min: 0,
    max: 200,
    message: 'Maximum 200 characters',
  },
  address: {
    min: 5,
    max: 500,
    message: '5-500 characters required',
  },
  state: {
    min: 2,
    max: 100,
    message: '2-100 characters required',
  },
  pincode: {
    pattern: /^[1-9][0-9]{5}$/,
    message: '6-digit PIN code required (starts with 1-9)',
  },
  latitude: {
    min: -90,
    max: 90,
    message: 'Latitude must be between -90 and 90',
  },
  longitude: {
    min: -180,
    max: 180,
    message: 'Longitude must be between -180 and 180',
  },
  basePrice: {
    min: 0.01,
    message: 'Price must be greater than 0',
  },
  currency: {
    min: 1,
    max: 10,
    message: '1-10 characters required',
  },

  // Room Fields
  roomName: {
    min: 2,
    max: 120,
    message: '2-120 characters required',
  },
  roomDescription: {
    min: 0,
    max: 1000,
    message: 'Maximum 1000 characters',
  },
  roomType: {
    min: 1,
    max: 50,
    message: '1-50 characters required',
  },
  capacity: {
    min: 1,
    max: 20,
    message: 'Capacity must be between 1 and 20',
  },
  extraBedCapacity: {
    min: 0,
    max: 10,
    message: 'Extra beds must be between 0 and 10',
  },
  pricePerNight: {
    min: 0.01,
    message: 'Price must be greater than 0',
  },
  weekendPrice: {
    min: 0,
    message: 'Weekend price cannot be negative',
  },
  roomSize: {
    min: 0.01,
    message: 'Size must be greater than 0',
  },
  totalRooms: {
    min: 1,
    max: 500,
    message: 'Total rooms must be between 1 and 500',
  },

  // Vendor/Business Fields
  businessName: {
    min: 2,
    max: 200,
    message: '2-200 characters required',
  },
  fullName: {
    min: 2,
    max: 100,
    message: '2-100 characters required',
  },
  businessAddress: {
    min: 5,
    max: 500,
    message: '5-500 characters required',
  },
  gstNumber: {
    pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    message: 'Invalid GST number format',
  },
  panNumber: {
    pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    message: 'Invalid PAN format (e.g., AAAAA0000A)',
  },
  aadhaarNumber: {
    pattern: /^\d{12}$/,
    message: '12-digit Aadhaar number required',
  },
  ifscCode: {
    pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/,
    message: 'Invalid IFSC code (e.g., SBIN0001234)',
  },
  accountNumber: {
    min: 9,
    max: 18,
    message: '9-18 characters required',
  },
  bankName: {
    min: 2,
    max: 100,
    message: '2-100 characters required',
  },

  // Review Fields
  reviewRating: {
    min: 1,
    max: 5,
    message: 'Rating must be between 1 and 5',
  },
  reviewTitle: {
    min: 0,
    max: 100,
    message: 'Maximum 100 characters',
  },
  reviewComment: {
    min: 10,
    max: 2000,
    message: '10-2000 characters required',
  },

  // Temple Fields
  deity: {
    min: 2,
    max: 100,
    message: '2-100 characters required',
  },
  templeType: {
    min: 0,
    max: 50,
    message: 'Maximum 50 characters',
  },
  dressCode: {
    min: 0,
    max: 200,
    message: 'Maximum 200 characters',
  },

  // Support/Ticket Fields
  supportCategory: {
    min: 2,
    max: 80,
    message: '2-80 characters required',
  },
  supportMessage: {
    min: 5,
    max: 3000,
    message: '5-3000 characters required',
  },
  bookingReference: {
    min: 0,
    max: 80,
    message: 'Maximum 80 characters',
  },

  // Generic Fields
  searchText: {
    min: 0,
    max: 5000,
    message: 'Maximum 5000 characters',
  },
  notes: {
    min: 0,
    max: 500,
    message: 'Maximum 500 characters',
  },
};

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateField(fieldName: string, value: any): ValidationResult {
  const rule = VALIDATION_RULES[fieldName as keyof typeof VALIDATION_RULES];
  if (!rule) {
    return { valid: true, errors: [] };
  }

  const errors: string[] = [];

  // Handle empty values
  if (
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim() === '')
  ) {
    // Don't validate required on all fields - that's a separate concern
    return { valid: true, errors: [] };
  }

  const strValue = String(value).trim();
  const numValue = Number(value);

  // Check min length
  if ('min' in rule && strValue.length > 0) {
    if (strValue.length < rule.min) {
      errors.push(`Minimum ${rule.min} characters required`);
    }
  }

  // Check max length
  if ('max' in rule && strValue.length > 0) {
    if (strValue.length > rule.max) {
      errors.push(`Maximum ${rule.max} characters allowed`);
    }
  }

  // Check pattern
  if ('pattern' in rule && strValue.length > 0) {
    if (!rule.pattern.test(strValue)) {
      errors.push(rule.message);
    }
  }

  // Check number min
  if ('min' in rule && typeof rule.min === 'number' && !isNaN(numValue)) {
    if (numValue < rule.min) {
      if ('message' in rule && rule.message.includes('greater than')) {
        errors.push(rule.message);
      } else {
        errors.push(`Minimum value is ${rule.min}`);
      }
    }
  }

  // Check number max
  if ('max' in rule && typeof rule.max === 'number' && !isNaN(numValue)) {
    if (numValue > rule.max) {
      if ('message' in rule && rule.message.includes('between')) {
        errors.push(rule.message);
      } else {
        errors.push(`Maximum value is ${rule.max}`);
      }
    }
  }

  // Check password complexity (only for password field)
  if (fieldName === 'password' && strValue.length > 0) {
    const passwordRule = rule as { uppercase?: boolean; lowercase?: boolean; number?: boolean; special?: boolean };
    if (passwordRule.uppercase && !/[A-Z]/.test(strValue)) {
      errors.push('Must contain at least one uppercase letter');
    }
    if (passwordRule.lowercase && !/[a-z]/.test(strValue)) {
      errors.push('Must contain at least one lowercase letter');
    }
    if (passwordRule.number && !/[0-9]/.test(strValue)) {
      errors.push('Must contain at least one number');
    }
    if (passwordRule.special && !/[^A-Za-z0-9]/.test(strValue)) {
      errors.push('Must contain at least one special character');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getFieldHint(fieldName: string): string {
  const rule = VALIDATION_RULES[fieldName as keyof typeof VALIDATION_RULES];
  if (!rule || !rule.message) return '';
  return rule.message;
}

export function getFieldConstraints(fieldName: string): {
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  type?: string;
} {
  const rule = VALIDATION_RULES[fieldName as keyof typeof VALIDATION_RULES];
  if (!rule) return {};

  const constraints: any = {};

  if ('min' in rule && typeof rule.min === 'number') {
    if (fieldName.includes('rice') || fieldName.includes('Price') || fieldName === 'refundAmount') {
      constraints.min = rule.min;
      constraints.type = 'number';
    } else {
      constraints.minLength = rule.min;
    }
  }

  if ('max' in rule && typeof rule.max === 'number') {
    if (fieldName.includes('rice') || fieldName.includes('Price') || fieldName === 'refundAmount') {
      constraints.max = rule.max;
    } else {
      constraints.maxLength = rule.max;
    }
  }

  if ('pattern' in rule) {
    constraints.pattern = rule.pattern;
  }

  return constraints;
}
