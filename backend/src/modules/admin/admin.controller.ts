import { FastifyRequest, FastifyReply } from 'fastify';
import adminService from './admin.service';
import { sendSuccess, sendError } from '../../utils/response.util';
import { ERROR_CODES } from '../../constants/error-codes';
import { logger } from '../../utils/logger.util';
import {
  updateUserStatusSchema,
  propertyApprovalSchema,
  systemStatsSchema,
  adminFilterSchema,
  payoutProcessingSchema,
  bookingRefundSchema,
  markPayoutPaidSchema,
  inventoryOverrideSchema,
  analyticsSchema,
} from './admin.schema';
import { platformSettingsSchema } from './admin-settings.schema';

export const AdminController = {
  async getDashboard(request: FastifyRequest, reply: FastifyReply) {
    try {
      const dashboard = await adminService.getDashboard();
      return sendSuccess(reply, dashboard);
    } catch (error: any) {
      logger.error({ error }, 'Get admin dashboard failed');
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch dashboard', 500);
    }
  },

  async getSystemStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = systemStatsSchema.parse(request.query);

      const stats = await adminService.getSystemStats(
        query.startDate ? new Date(query.startDate) : undefined,
        query.endDate ? new Date(query.endDate) : undefined
      );

      return sendSuccess(reply, stats);
    } catch (error: any) {
      logger.error({ error }, 'Get system stats failed');
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch stats', 500);
    }
  },

  async getAnalytics(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = analyticsSchema.parse(request.query);
      const result = await adminService.getAnalytics(query.range);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, 'Get analytics failed');
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch analytics', 500);
    }
  },

  async getSettings(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await adminService.getPlatformSettings();
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, 'Get settings failed');
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch settings', 500);
    }
  },

  async updateSettings(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = platformSettingsSchema.parse(request.body);
      const result = await adminService.updatePlatformSettings(data);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, 'Update settings failed');
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to update settings', 500);
    }
  },

  async getAllUsers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;

      const result = await adminService.getAllUsers({
        page: parseInt(query.page || '1'),
        limit: parseInt(query.limit || '10'),
        role: query.role,
        search: query.search,
      });

      return sendSuccess(reply, result.users, 200, result.meta);
    } catch (error: any) {
      logger.error({ error }, 'Get users failed');
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch users', 500);
    }
  },

  async updateUserStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const data = updateUserStatusSchema.parse(request.body);

      const result = await adminService.updateUserStatus(id, data.isActive);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, 'Update user status failed');
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to update user', 500);
    }
  },

  async getAllProperties(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = adminFilterSchema.parse(request.query);

      const result = await adminService.getAllProperties({
        page: query.page,
        limit: query.limit,
        status: query.status,
        type: query.type,
        search: query.search,
      });

      return sendSuccess(reply, result.properties, 200, result.meta);
    } catch (error: any) {
      logger.error({ error }, 'Get properties failed');
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch properties', 500);
    }
  },

  async updatePropertyStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const data = propertyApprovalSchema.parse(request.body);

      const result = await adminService.updatePropertyStatus(id, data.status, data.reason);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, 'Update property status failed');
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to update property', 500);
    }
  },

  async getAllBookings(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;

      const result = await adminService.getAllBookings({
        page: parseInt(query.page || '1'),
        limit: parseInt(query.limit || '10'),
        status: query.status,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
      });

      return sendSuccess(reply, result.bookings, 200, result.meta);
    } catch (error: any) {
      logger.error({ error }, 'Get bookings failed');
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch bookings', 500);
    }
  },

  async refundBooking(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const body = bookingRefundSchema.parse(request.body);

      const result = await adminService.refundBooking(id, body.amount, body.reason);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, 'Refund booking failed');
      if (error.name === 'ZodError') {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, 'Invalid input data', 400);
      }
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to refund booking', 500);
    }
  },

  async getAllPayouts(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;

      const result = await adminService.getAllPayouts({
        page: parseInt(query.page || '1'),
        limit: parseInt(query.limit || '10'),
        status: query.status,
      });

      return sendSuccess(reply, result.payouts, 200, result.meta);
    } catch (error: any) {
      logger.error({ error }, 'Get payouts failed');
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch payouts', 500);
    }
  },

  async processPayout(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = payoutProcessingSchema.parse(request.body);

      const result = await adminService.processPayout(data.payoutId, data.action, data.notes);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, 'Process payout failed');
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to process payout', 500);
    }
  },

  async markPayoutPaid(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const body = markPayoutPaidSchema.parse(request.body);

      const result = await adminService.markPayoutPaid(id, body.transactionId, body.notes);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, 'Mark payout paid failed');
      if (error.name === 'ZodError') {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, 'Invalid input data', 400);
      }
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to mark payout paid', 500);
    }
  },

  async overrideInventory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const body = inventoryOverrideSchema.parse(request.body);

      const result = await adminService.overrideRoomInventory(id, body.availableRooms);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, 'Override inventory failed');
      if (error.name === 'ZodError') {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, 'Invalid input data', 400);
      }
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to override inventory', 500);
    }
  },
};
