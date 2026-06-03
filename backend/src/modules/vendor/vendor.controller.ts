import { FastifyRequest, FastifyReply } from 'fastify';
import vendorService from './vendor.service';
import { sendSuccess, sendError } from '../../utils/response.util';
import { ERROR_CODES } from '../../constants/error-codes';
import { logger } from '../../utils/logger.util';
import {
  registerVendorSchema,
  updateVendorSchema,
  vendorLoginSchema,
  vendorIdSchema,
  vendorFilterSchema,
  adminCreateVendorOnboardingSchema,
  changePasswordSchema,
} from './vendor.schema';

export const VendorController = {
  async register(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = registerVendorSchema.parse(request.body);

      const result = await vendorService.register(data);

      return sendSuccess(reply, result, 201);
    } catch (error: any) {
      logger.error({ error }, 'Vendor registration failed');
      if (error.code === ERROR_CODES.RESOURCE_CONFLICT) {
        return sendError(reply, error.code, "An account with this email already exists. Please try a different email or login to your existing account.", 409);
      }
      if (error.name === 'ZodError') {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, "Please fill in all required fields correctly.", 400);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Unable to create your account. Please try again later.", 500);
    }
  },

  async apply(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = registerVendorSchema.parse(request.body);

      const result = await vendorService.apply(data);

      return sendSuccess(reply, result, 201);
    } catch (error: any) {
      logger.error({ error }, 'Vendor apply failed');
      if (error.code === ERROR_CODES.RESOURCE_CONFLICT) {
        const message = error.message.includes('email') || error.message.includes('Email')
          ? "An account with this email already exists. Please try a different email or login to your existing account."
          : "This phone number is already registered. Please use a different phone number.";
        return sendError(reply, error.code, message, 409);
      }
      if (error.name === 'ZodError') {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, "Please fill in all required fields correctly.", 400);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Unable to submit your application. Please try again later.", 500);
    }
  },

  async login(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = vendorLoginSchema.parse(request.body);

      const result = await vendorService.login(data.email, data.password);

      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, 'Vendor login failed');
      if (error.code === ERROR_CODES.UNAUTHORIZED) {
        return sendError(reply, error.code, "Invalid email or password. Please check your credentials and try again.", 401);
      }
      if (error.code === ERROR_CODES.FORBIDDEN) {
        return sendError(reply, error.code, "Your account has been suspended. Please contact support for assistance.", 403);
      }
      if (error.name === 'ZodError') {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, "Please enter a valid email and password.", 400);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Unable to login at the moment. Please try again later.", 500);
    }
  },

  async getDashboard(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      if (user?.role !== 'VENDOR' || !user.vendorId) {
        return sendError(reply, ERROR_CODES.FORBIDDEN, 'Vendor access required', 403);
      }
      const vendorId = user.vendorId;

      const dashboard = await vendorService.getDashboard(vendorId);

      return sendSuccess(reply, dashboard);
    } catch (error: any) {
      logger.error({ error }, 'Get vendor dashboard failed');
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, "Your account details could not be found.", 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Unable to load your dashboard. Please try again.", 500);
    }
  },

  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      if (user?.role !== 'VENDOR' || !user.vendorId) {
        return sendError(reply, ERROR_CODES.FORBIDDEN, 'Vendor access required', 403);
      }
      const vendorId = user.vendorId;

      const profile = await vendorService.getVendorProfile(vendorId);

      return sendSuccess(reply, profile);
    } catch (error: any) {
      logger.error({ error }, 'Get vendor profile failed');
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch profile', 500);
    }
  },

  async updateProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      if (user?.role !== 'VENDOR' || !user.vendorId) {
        return sendError(reply, ERROR_CODES.FORBIDDEN, 'Vendor access required', 403);
      }
      const vendorId = user.vendorId;
      const data = updateVendorSchema.parse(request.body);

      const profile = await vendorService.updateVendor(vendorId, data);

      return sendSuccess(reply, profile);
    } catch (error: any) {
      logger.error({ error }, 'Update vendor profile failed');
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      if (error.name === 'ZodError') {
        const firstIssue = error.issues?.[0];
        const field = firstIssue?.path?.join('.') ?? 'field';
        const message = firstIssue?.message ?? 'Invalid input data';
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, `${field}: ${message}`, 400);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to update profile', 500);
    }
  },

  async changePassword(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      if (user?.role !== 'VENDOR' || !user.vendorId) {
        return sendError(reply, ERROR_CODES.FORBIDDEN, 'Vendor access required', 403);
      }
      const vendorId = user.vendorId;
      const data = changePasswordSchema.parse(request.body);

      const result = await vendorService.changePassword(vendorId, data.currentPassword, data.newPassword);

      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, 'Vendor change password failed');
      if (error.code === ERROR_CODES.UNAUTHORIZED) {
        return sendError(reply, error.code, 'Current password is incorrect', 401);
      }
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      if (error.name === 'ZodError') {
        const firstIssue = error.issues?.[0];
        const field = firstIssue?.path?.join('.') ?? 'field';
        const message = firstIssue?.message ?? 'Invalid input data';
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, `${field}: ${message}`, 400);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to change password', 500);
    }
  },

  async getEarningsSummary(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      if (user?.role !== 'VENDOR' || !user.vendorId) {
        return sendError(reply, ERROR_CODES.FORBIDDEN, 'Vendor access required', 403);
      }
      const vendorId = user.vendorId;

      const summary = await vendorService.getEarningsSummary(vendorId);

      return sendSuccess(reply, summary);
    } catch (error: any) {
      logger.error({ error }, 'Get vendor earnings summary failed');
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch earnings summary', 500);
    }
  },

  async getPayoutHistory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      if (user?.role !== 'VENDOR' || !user.vendorId) {
        return sendError(reply, ERROR_CODES.FORBIDDEN, 'Vendor access required', 403);
      }
      const vendorId = user.vendorId;
      const query = request.query as { page?: string; limit?: string; status?: string };

      const result = await vendorService.getPayoutHistory(vendorId, {
        page: query.page ? parseInt(query.page) : undefined,
        limit: query.limit ? parseInt(query.limit) : undefined,
        status: query.status,
      });

      return sendSuccess(reply, result.payouts, 200, result.meta);
    } catch (error: any) {
      logger.error({ error }, 'Get vendor payout history failed');
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch payout history', 500);
    }
  },

  async requestPayout(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      if (user?.role !== 'VENDOR' || !user.vendorId) {
        return sendError(reply, ERROR_CODES.FORBIDDEN, 'Vendor access required', 403);
      }
      const vendorId = user.vendorId;
      const body = request.body as { amount?: number };

      const payout = await vendorService.requestPayout(vendorId, body.amount);

      return sendSuccess(reply, payout, 201);
    } catch (error: any) {
      logger.error({ error }, 'Request payout failed');
      if (error.code === ERROR_CODES.VALIDATION_ERROR) {
        return sendError(reply, error.code, error.message, 400);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to request payout', 500);
    }
  },

  async blockInventoryDate(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      if (user?.role !== 'VENDOR' || !user.vendorId) {
        return sendError(reply, ERROR_CODES.FORBIDDEN, 'Vendor access required', 403);
      }
      const vendorId = user.vendorId;
      const body = request.body as { roomTypeId: string; date: string; reason?: string };

      const result = await vendorService.blockInventoryDate(vendorId, body);

      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, 'Vendor block inventory date failed');
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      if (error.code === ERROR_CODES.VALIDATION_ERROR) {
        return sendError(reply, error.code, error.message, 400);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to block date', 500);
    }
  },

  async unblockInventoryDate(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      if (user?.role !== 'VENDOR' || !user.vendorId) {
        return sendError(reply, ERROR_CODES.FORBIDDEN, 'Vendor access required', 403);
      }
      const vendorId = user.vendorId;
      const body = request.body as { roomTypeId: string; date: string };

      const result = await vendorService.unblockInventoryDate(vendorId, body);

      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, 'Vendor unblock inventory date failed');
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to unblock date', 500);
    }
  },

  async blockInventoryDates(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      if (user?.role !== 'VENDOR' || !user.vendorId) {
        return sendError(reply, ERROR_CODES.FORBIDDEN, 'Vendor access required', 403);
      }
      const vendorId = user.vendorId;
      const body = request.body as {
        roomId?: string;
        propertyId?: string;
        startDate: string;
        endDate: string;
        reason?: string;
      };

      const result = await vendorService.blockInventoryDates(vendorId, body);

      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, 'Vendor block inventory dates failed');
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      if (error.code === ERROR_CODES.VALIDATION_ERROR) {
        return sendError(reply, error.code, error.message, 400);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to block dates', 500);
    }
  },
};

export const AdminVendorController = {
  async getAllVendors(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = vendorFilterSchema.parse(request.query);

      const result = await vendorService.getAllVendors({
        page: query.page,
        limit: query.limit,
        isApproved: query.isApproved,
      });

      return sendSuccess(reply, result.vendors, 200, result.meta);
    } catch (error: any) {
      logger.error({ error }, 'Get vendors failed');
      if (error.name === 'ZodError') {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, 'Invalid query parameters', 400);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch vendors', 500);
    }
  },

  async approveVendor(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = vendorIdSchema.parse(request.params);
      const user = (request as any).user;
      if (!user?.id) {
        return sendError(reply, ERROR_CODES.UNAUTHORIZED, 'Authentication required', 401);
      }
      const adminId = user.id;

      const result = await vendorService.approveVendor(id, adminId);

      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, 'Approve vendor failed');
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to approve vendor', 500);
    }
  },

  async createOnboardingVendor(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = adminCreateVendorOnboardingSchema.parse(request.body);
      const user = (request as any).user;
      if (!user?.id) {
        return sendError(reply, ERROR_CODES.UNAUTHORIZED, 'Authentication required', 401);
      }
      const adminId = user.id;

      const result = await vendorService.adminCreateOnboarding(data, adminId);

      return sendSuccess(reply, result, 201);
    } catch (error: any) {
      logger.error({ error }, 'Admin onboarding vendor creation failed');
      if (error.code === ERROR_CODES.RESOURCE_CONFLICT) {
        return sendError(reply, error.code, error.message, 409);
      }
      if (error.name === 'ZodError' || error.code === ERROR_CODES.VALIDATION_ERROR) {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, error.message || 'Invalid input data', 400);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to create onboarding vendor', 500);
    }
  },
};
