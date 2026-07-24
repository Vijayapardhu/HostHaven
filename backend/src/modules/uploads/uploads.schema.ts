import { z } from 'zod';

/**
 * Query parameters for upload endpoints. The folder value is validated for
 * shape here and then authorised against the role-based allowlist in the
 * controller (resolveUploadFolder) — parsing alone must not grant access.
 */
export const uploadQuerySchema = z.object({
  folder: z.string().min(1).max(120).optional(),
  resourceType: z.enum(['image', 'video', 'raw', 'auto']).default('image'),
  compress: z.enum(['true', 'false']).optional(),
});

export const deleteFileSchema = z
  .object({
    publicId: z.string().min(1).max(300).optional(),
    key: z.string().min(1).max(300).optional(),
  })
  .refine((data) => Boolean(data.publicId || data.key), {
    message: 'publicId or key is required',
  });

export const deleteFilesSchema = z
  .object({
    publicIds: z.array(z.string().min(1).max(300)).max(50).optional(),
    keys: z.array(z.string().min(1).max(300)).max(50).optional(),
  })
  .refine(
    (data) =>
      (data.publicIds?.length ?? 0) > 0 || (data.keys?.length ?? 0) > 0,
    { message: 'publicIds or keys are required' },
  );

export type UploadQueryInput = z.infer<typeof uploadQuerySchema>;
export type DeleteFileInput = z.infer<typeof deleteFileSchema>;
export type DeleteFilesInput = z.infer<typeof deleteFilesSchema>;
