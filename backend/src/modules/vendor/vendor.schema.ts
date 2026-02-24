import { z } from 'zod';

export const registerVendorSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/).optional(),
  businessName: z.string().min(2).max(200),
  businessAddress: z.string().max(500).optional(),
  gstNumber: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional(),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional(),
  aadhaarNumber: z.string().regex(/^\d{12}$/).optional(),
  bankAccount: z.object({
    bankName: z.string().min(2).max(100),
    accountNumber: z.string().min(9).max(18),
    ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/),
    accountHolderName: z.string().min(2).max(100),
  }).optional(),
});

export const updateVendorSchema = z.object({
  businessName: z.string().min(2).max(200).optional(),
  businessAddress: z.string().max(500).optional(),
  gstNumber: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional(),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional(),
  aadhaarNumber: z.string().regex(/^\d{12}$/).optional(),
  bankAccount: z.object({
    bankName: z.string().min(2).max(100),
    accountNumber: z.string().min(9).max(18),
    ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/),
    accountHolderName: z.string().min(2).max(100),
  }).optional(),
});

export const vendorLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const vendorIdSchema = z.object({
  id: z.string().uuid(),
});

export const vendorFilterSchema = z.object({
  isApproved: z.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
});

export type RegisterVendorInput = z.infer<typeof registerVendorSchema>;
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;
export type VendorLoginInput = z.infer<typeof vendorLoginSchema>;
