import prisma from '../../config/database';
import { logger } from '../../utils/logger.util';
import { ERROR_CODES } from '../../constants/error-codes';
import { Prisma } from '@prisma/client';
import { webPushService } from '../../services/webpush.service';

export class NotificationsService {
  async getAll(userId: string, filters: {
    page?: number;
    limit?: number;
    isRead?: boolean;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = { userId };

    if (filters.isRead !== undefined) {
      where.isRead = filters.isRead;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      notifications: notifications.map(this.sanitizeNotification),
      unreadCount,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      const error = new Error('Notification not found');
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    return this.sanitizeNotification(notification);
  }

  async create(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, any>;
  }) {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data || {},
      },
    });

    logger.info({ notificationId: notification.id, userId: data.userId }, 'Notification created');

    // Send web push notification
    await webPushService.sendNotification(data.userId, {
      title: data.title,
      body: data.message,
      tag: `notification-${data.type}`,
      data: data.data,
    });

    return this.sanitizeNotification(notification);
  }

  async markAsRead(id: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      const error = new Error('Notification not found');
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return this.sanitizeNotification(updated);
  }

  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    logger.info({ userId }, 'All notifications marked as read');

    return { message: 'All notifications marked as read' };
  }

  async delete(id: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      const error = new Error('Notification not found');
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    await prisma.notification.delete({
      where: { id },
    });

    logger.info({ notificationId: id }, 'Notification deleted');

    return { message: 'Notification deleted' };
  }

  async deleteAll(userId: string) {
    await prisma.notification.deleteMany({
      where: { userId },
    });

    logger.info({ userId }, 'All notifications deleted');

    return { message: 'All notifications deleted' };
  }

  async sendAdminPushNotification(data: {
    title: string;
    message: string;
    type: string;
    target: 'all' | 'users' | 'vendors' | 'admins';
    userIds?: string[];
    data?: Record<string, any>;
  }) {
    const where: Prisma.UserWhereInput = {
      isActive: true,
      isDeleted: false,
    };

    if (data.userIds?.length) {
      where.id = { in: data.userIds };
    } else if (data.target === 'users') {
      where.role = 'USER';
    } else if (data.target === 'vendors') {
      where.role = 'VENDOR';
    } else if (data.target === 'admins') {
      where.role = 'ADMIN';
    }

    const recipients = await prisma.user.findMany({
      where,
      select: { id: true },
    });

    if (recipients.length === 0) {
      const error = new Error('No recipients found for the selected target');
      (error as any).code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }

    const recipientIds = recipients.map((recipient) => recipient.id);

    await prisma.notification.createMany({
      data: recipientIds.map((userId) => ({
        userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data ?? {},
      })),
    });

    const pushData = {
      ...data.data,
      type: data.type,
    };

    const imageUrl = typeof data.data?.imageUrl === 'string' ? data.data.imageUrl : undefined;

    await webPushService.sendNotificationToMultiple(recipientIds, {
      title: data.title,
      body: data.message,
      icon: imageUrl,
      image: imageUrl,
      tag: `admin-${Date.now()}`,
      data: pushData,
    });

    logger.info(
      { target: data.target, recipients: recipientIds.length },
      'Admin push notification sent',
    );

    return {
      sentCount: recipientIds.length,
      target: data.target,
    };
  }

  private sanitizeNotification(notification: any) {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      isRead: notification.isRead,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    };
  }
}

export const notificationsService = new NotificationsService();
export default notificationsService;
