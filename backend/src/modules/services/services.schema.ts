import { z } from 'zod'

const serviceImageSchema = z.union([
  z.string().url(),
  z.object({ url: z.string().url() }),
])

export const createServiceSchema = z
  .object({
    name: z.string().min(2, 'Service name is required'),
    description: z
      .string()
      .min(10, 'Description must be at least 10 characters'),
    category: z.string().min(1, 'Category is required'),
    city: z.string().optional(),
    location: z.string().optional(),
    locations: z.array(z.string()).optional(),
    basePrice: z.coerce.number().min(0, 'Base price must be positive').optional(),
    price: z.coerce.number().min(0, 'Price must be positive').optional(),
    priceUnit: z.string().min(1).optional(),
    duration: z.string().max(120).optional(),
    advanceType: z.enum(['percentage', 'fixed']).default('percentage'),
    advanceValue: z.coerce.number().min(0).default(30),
    images: z.array(serviceImageSchema).optional(),
    active: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => data.basePrice !== undefined || data.price !== undefined, {
    message: 'basePrice is required',
    path: ['basePrice'],
  })
  .transform((data) => {
    return {
      ...data,
      basePrice: data.basePrice ?? data.price!,
      images: (data.images ?? []).map((image) =>
        typeof image === 'string' ? image : image.url
      ),
      active: data.active ?? data.isActive ?? true,
      locations: data.locations ?? (data.location ? [data.location] : undefined),
    }
  })

export const updateServiceSchema = z
  .object({
    name: z.string().min(2, 'Service name is required').optional(),
    description: z
      .string()
      .min(10, 'Description must be at least 10 characters')
      .optional(),
    category: z.string().min(1, 'Category is required').optional(),
    city: z.string().optional(),
    location: z.string().optional(),
    locations: z.array(z.string()).optional(),
    basePrice: z.coerce.number().min(0, 'Base price must be positive').optional(),
    price: z.coerce.number().min(0, 'Price must be positive').optional(),
    priceUnit: z.string().min(1).optional(),
    duration: z.string().max(120).optional(),
    advanceType: z.enum(['percentage', 'fixed']).optional(),
    advanceValue: z.coerce.number().min(0).optional(),
    images: z.array(serviceImageSchema).optional(),
    active: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .transform((data) => {
    const normalized: any = { ...data }

    if (normalized.basePrice === undefined && normalized.price !== undefined) {
      normalized.basePrice = normalized.price
    }
    if (normalized.active === undefined && normalized.isActive !== undefined) {
      normalized.active = normalized.isActive
    }
    if (normalized.images !== undefined) {
      normalized.images = normalized.images.map((image: any) =>
        typeof image === 'string' ? image : image.url
      )
    }

    delete normalized.price
    delete normalized.isActive

    return normalized
  })

export const serviceFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  category: z.string().optional(),
  active: z.coerce.boolean().optional(),
})

export const serviceIdSchema = z.object({
  id: z.string().uuid(),
})

export type CreateServiceInput = z.infer<typeof createServiceSchema>
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>
export type ServiceFilterInput = z.infer<typeof serviceFilterSchema>
