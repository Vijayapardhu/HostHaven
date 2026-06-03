import { FastifyRequest, FastifyReply } from 'fastify';
import notificationsService from './notifications.service';
import { sendSuccess, sendError } from '../../utils/response.util';
import { ERROR_CODES } from '../../constants/error-codes';
import { logger } from '../../utils/logger.util';
import {
  notificationFilterSchema,
  notificationIdSchema,
  markReadSchema,
  adminPushNotificationSchema,
} from './notifications.schema';

export const NotificationsController = {
  async getAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = notificationFilterSchema.parse(request.query);
      const userId = (request as any).user.id;

      const result = await notificationsService.getAll(userId, {
        page: query.page,
        limit: query.limit,
        isRead: query.isRead,
      });

      return sendSuccess(reply, result.notifications, 200, {
        ...result.meta,
        unreadCount: result.unreadCount,
      });
    } catch (error: any) {
      logger.error({ error }, 'Get notifications failed');
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch notifications', 500);
    }
  },

  async getUserNotifications(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = notificationFilterSchema.parse(request.query);
      const userId = (request as any).user.id;

      const result = await notificationsService.getAll(userId, {
        page: query.page,
        limit: query.limit,
        isRead: query.isRead,
      });

      return sendSuccess(reply, result.notifications, 200, {
        ...result.meta,
        unreadCount: result.unreadCount,
      });
    } catch (error: any) {
      logger.error({ error }, 'Get user notifications failed');
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch notifications', 500);
    }
  },

  async getById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = notificationIdSchema.parse(request.params);
      const userId = (request as any).user.id;

      const notification = await notificationsService.getById(id, userId);
      return sendSuccess(reply, notification);
    } catch (error: any) {
      logger.error({ error }, 'Get notification failed');
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch notification', 500);
    }
  },

  async markAsRead(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = notificationIdSchema.parse(request.params);
      const userId = (request as any).user.id;

      const notification = await notificationsService.markAsRead(id, userId);
      return sendSuccess(reply, notification);
    } catch (error: any) {
      logger.error({ error }, 'Mark as read failed');
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to mark as read', 500);
    }
  },

  async markAllAsRead(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;

      const result = await notificationsService.markAllAsRead(userId);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, 'Mark all as read failed');
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to mark all as read', 500);
    }
  },

  async sendAdminPushNotification(request: FastifyRequest, reply: FastifyReply) {
    try {
      const payload = adminPushNotificationSchema.parse(request.body);
      const result = await notificationsService.sendAdminPushNotification(payload);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, 'Send admin push notification failed');
      if (error.name === 'ZodError' || error.code === ERROR_CODES.VALIDATION_ERROR) {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, error.message || 'Invalid input', 400);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to send push notification', 500);
    }
  },

  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = notificationIdSchema.parse(request.params);
      const userId = (request as any).user.id;

      const result = await notificationsService.delete(id, userId);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, 'Delete notification failed');
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to delete notification', 500);
    }
  },

  async deleteAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;

      const result = await notificationsService.deleteAll(userId);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, 'Delete all notifications failed');
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to delete notifications', 500);
    }
  },
};
