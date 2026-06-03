import { z } from 'zod';

export const createNotificationSchema = z.object({
  type: z.string(),
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(1000),
  data: z.record(z.any()).optional(),
});

export const notificationFilterSchema = z.object({
  isRead: z.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().min(1).max(100).default(20),
});

export const notificationIdSchema = z.object({
  id: z.string().uuid(),
});

export const markReadSchema = z.object({
  ids: z.array(z.string().uuid()).optional(),
  all: z.boolean().optional(),
});

export const adminPushNotificationSchema = z.object({
  title: z.string().min(1).max(120),
  message: z.string().min(1).max(1000),
  type: z.string().min(1).max(120).default("admin_announcement"),
  target: z.enum(["all", "users", "vendors", "admins"]).default("all"),
  userIds: z.array(z.string().uuid()).optional(),
  data: z.record(z.any()).optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type NotificationFilterInput = z.infer<typeof notificationFilterSchema>;
export type MarkReadInput = z.infer<typeof markReadSchema>;
export type AdminPushNotificationInput = z.infer<typeof adminPushNotificationSchema>;
