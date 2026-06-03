
import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import adminService from "./admin.service";
import { sendSuccess, sendError } from "../../utils/response.util";
import { ERROR_CODES } from "../../constants/error-codes";
import { logger } from "../../utils/logger.util";
import { reviewsService } from "../reviews/reviews.service";
import { jsonToCsv } from "../../utils/csv.util";
import { exportToExcel, importFromExcel, generateTemplate, getEntityConfig, getAllEntities, exportAllFieldsToExcel, importAllFieldsFromExcel, generateFullTemplate } from "../../utils/excel.util";
import prisma from "../../config/database";
import {
  updateUserStatusSchema,
  propertyApprovalSchema,
  systemStatsSchema,
  adminFilterSchema,
  payoutProcessingSchema,
  createPayoutSchema,
  paymentRefundSchema,
  bookingRefundSchema,
  markPayoutPaidSchema,
  financeListFilterSchema,
  adminRoomUpdateSchema,
  adminRoomBlockSchema,
  adminRoomInventoryOverrideSchema,
  adminRoomInventoryQuerySchema,
  analyticsSchema,
  adminUpdateVendorSchema,
  adminCreatePropertySchema,
  adminUpdatePropertySchema,
  adminUpdatePropertyCancellationSchema,
  updateVendorCommissionSchema,
  createCmsPageSchema,
  updateCmsPageSchema,
  cmsPageIdSchema,
} from "./admin.schema";
import { platformSettingsSchema } from "./admin-settings.schema";
import { adminReviewFilterSchema } from "../reviews/reviews.schema";

export const AdminController = {
  async getDashboard(request: FastifyRequest, reply: FastifyReply) {
    try {
      const dashboard = await adminService.getDashboard();
      return sendSuccess(reply, dashboard);
    } catch (error: any) {
      logger.error({ error }, "Get admin dashboard failed");
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Unable to load your dashboard. Please try again in a few moments.",
        500,
      );
    }
  },

  async getSystemStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = systemStatsSchema.parse(request.query);

      const stats = await adminService.getSystemStats(
        query.startDate ? new Date(query.startDate) : undefined,
        query.endDate ? new Date(query.endDate) : undefined,
      );

      return sendSuccess(reply, stats);
    } catch (error: any) {
      logger.error({ error }, "Get system stats failed");
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Unable to load system statistics. Please try again.",
        500,
      );
    }
  },

  async getAnalytics(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = analyticsSchema.parse(request.query);
      const result = await adminService.getAnalytics(query.range);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error, query: request.query }, "Get analytics failed");
      if (error.name === "ZodError") {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          "The date range you selected is invalid. Please try again with valid dates.",
          400,
        );
      }
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Unable to load analytics data. Please try again.",
        500,
      );
    }
  },

  async getSettings(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await adminService.getPlatformSettings();
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Get settings failed");
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Unable to load your settings. Please try again.",
        500,
      );
    }
  },

  async updateSettings(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = platformSettingsSchema.parse(request.body);
      const result = await adminService.updatePlatformSettings(data);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error, body: request.body }, "Update settings failed");
      if (error.name === "ZodError") {
        const messages = error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ');
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          `Validation error: ${messages}`,
          400,
        );
      }
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        error?.message || "Unable to save your settings. Please try again.",
        500,
      );
    }
  },

  async getHomepageConfig(request: FastifyRequest, reply: FastifyReply) {
    try {
      const config = await adminService.getHomepageConfig();
      return sendSuccess(reply, config);
    } catch (error: any) {
      logger.error({ error }, "Get homepage config failed");
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Unable to load homepage configuration. Please try again.", 500);
    }
  },

  async updateHomepageConfig(request: FastifyRequest, reply: FastifyReply) {
    try {
      const config = request.body as Record<string, unknown>;
      const result = await adminService.updateHomepageConfig(config);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Update homepage config failed");
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, "The requested homepage configuration was not found.", 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Unable to save homepage changes. Please try again.", 500);
    }
  },

  async getCmsPages(request: FastifyRequest, reply: FastifyReply) {
    try {
      const pages = await adminService.getCmsPages();
      return sendSuccess(reply, pages, 200);
    } catch (error: any) {
      logger.error({ error }, "Get CMS pages failed");
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Unable to load your website pages. Please try again.",
        500,
      );
    }
  },

  async createCmsPage(request: FastifyRequest, reply: FastifyReply) {
    try {
      const payload = createCmsPageSchema.parse(request.body);
      const page = await adminService.createCmsPage(payload);
      return sendSuccess(reply, page, 201);
    } catch (error: any) {
      logger.error({ error }, "Create CMS page failed");
      if (error.name === "ZodError" || error.code === ERROR_CODES.VALIDATION_ERROR) {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          "Please fill in all required fields correctly and try again.",
          400,
        );
      }
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Unable to create the page. Please try again.",
        500,
      );
    }
  },

  async updateCmsPage(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = cmsPageIdSchema.parse(request.params);
      const payload = updateCmsPageSchema.parse(request.body);
      const page = await adminService.updateCmsPage(id, payload);
      return sendSuccess(reply, page, 200);
    } catch (error: any) {
      logger.error({ error }, "Update CMS page failed");
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, "The page you're trying to edit was not found.", 404);
      }
      if (error.name === "ZodError" || error.code === ERROR_CODES.VALIDATION_ERROR) {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          "Please check your changes and try again.",
          400,
        );
      }
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Unable to save your changes. Please try again.",
        500,
      );
    }
  },

  async deleteCmsPage(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = cmsPageIdSchema.parse(request.params);
      const result = await adminService.deleteCmsPage(id);
      return sendSuccess(reply, result, 200);
    } catch (error: any) {
      logger.error({ error }, "Delete CMS page failed");
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, "The page you're trying to delete was not found.", 404);
      }
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Unable to delete the page. Please try again.",
        500,
      );
    }
  },

  async getAllUsers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;

      const result = await adminService.getAllUsers({
        page: parseInt(query.page || "1"),
        limit: parseInt(query.limit || "10"),
        role: query.role,
        search: query.search,
        status: query.status,
      });

      return sendSuccess(reply, result.users, 200, result.meta);
    } catch (error: any) {
      logger.error({ error }, "Get users failed");
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Unable to load the user list. Please try again.",
        500,
      );
    }
  },

  async updateUserStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const data = updateUserStatusSchema.parse(request.body);
      const adminUser = (request as any).user;

      const result = await adminService.updateUserStatus(
        id, 
        data.isActive,
        adminUser ? { id: adminUser.id, name: adminUser.name || 'Admin', email: adminUser.email || '' } : undefined
      );
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Update user status failed");
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, "The user you're trying to update was not found.", 404);
      }
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Unable to update the user. Please try again.",
        500,
      );
    }
  },

  async getUserById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const result = await adminService.getUserById(id);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Get user by ID failed");
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, "The user you're looking for was not found.", 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Unable to load user details. Please try again.", 500);
    }
  },

  async softDeleteUser(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const result = await adminService.softDeleteUser(id);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Soft delete user failed");
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, "The user you're trying to delete was not found.", 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Unable to remove this user. Please try again.", 500);
    }
  },

  async verifyUserEmail(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const result = await adminService.verifyUserEmail(id);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Verify user email failed");
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, "The user you're trying to verify was not found.", 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Unable to verify this user's email. Please try again.", 500);
    }
  },

  async resetUserPassword(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const result = await adminService.resetUserPassword(id);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Reset user password failed");
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to reset password", 500);
    }
  },

  async getUserSessions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const result = await adminService.getUserSessions(id);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Get user sessions failed");
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to get sessions", 500);
    }
  },

  async getAllProperties(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = adminFilterSchema.parse(request.query || {});

      const result = await adminService.getAllProperties({
        page: query.page,
        limit: query.limit,
        status: query.status,
        type: query.type,
        city: query.city,
        vendorId: query.vendorId,
        search: query.search || undefined,
      });

      return sendSuccess(reply, result.properties, 200, result.meta);
    } catch (error: any) {
      logger.error({ error }, "Get properties failed");
      if (error.name === 'ZodError') {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          "Invalid query parameters",
          400,
        );
      }
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to fetch properties",
        500,
      );
    }
  },

  async updatePropertyStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { idOrSlug } = request.params as { idOrSlug: string };
      const data = propertyApprovalSchema.parse(request.body);
      const adminUser = (request as any).user;

      const result = await adminService.updatePropertyStatus(
        idOrSlug,
        data.status,
        data.reason,
        adminUser ? { id: adminUser.id, name: adminUser.name || 'Admin', email: adminUser.email || '' } : undefined
      );
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Update property status failed");
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      if (error.code === ERROR_CODES.VALIDATION_ERROR) {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          error.message || "Invalid status value",
          400
        );
      }
      if (error.name === "ZodError") {
        const details: Record<string, string[]> = {};
        for (const issue of error.issues) {
          const path = issue.path.join('.');
          if (!details[path]) {
            details[path] = [];
          }
          details[path].push(issue.message);
        }
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          "Invalid status value",
          400,
          details
        );
      }
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        error.message || "Failed to update property",
        500,
      );
    }
  },

  async createProperty(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = adminCreatePropertySchema.parse(request.body);

      const property = await adminService.createProperty(body);
      return sendSuccess(reply, property, 201);
    } catch (error: any) {
      logger.error({ error }, "Create property failed");
      if (error.name === "ZodError") {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          "Invalid input data",
          400,
        );
      }
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to create property",
        500,
      );
    }
  },

  async getPropertyById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { idOrSlug } = request.params as { idOrSlug: string };
      const property = await adminService.getPropertyById(idOrSlug);
      return sendSuccess(reply, property, 200);
    } catch (error: any) {
      logger.error({ error }, "Get property failed");
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to get property details", 500);
    }
  },

  async updateProperty(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { idOrSlug } = request.params as { idOrSlug: string };
      const data = adminUpdatePropertySchema.parse(request.body);

      const property = await adminService.updateProperty(idOrSlug, data);
      return sendSuccess(reply, property, 200);
    } catch (error: any) {
      logger.error({ error }, "Update property failed");
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      if (error.name === "ZodError") {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          "Invalid property update payload",
          400,
        );
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to update property", 500);
    }
  },

  async updatePropertyCancellationPolicy(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params as { id: string };
      const { cancellationPolicy } = adminUpdatePropertyCancellationSchema.parse(
        request.body,
      );

      const result = await adminService.updatePropertyCancellationPolicy(
        id,
        cancellationPolicy,
      );
      return sendSuccess(reply, result, 200);
    } catch (error: any) {
      logger.error({ error }, "Update property cancellation policy failed");
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      if (error.name === "ZodError") {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          "Invalid cancellation policy payload",
          400,
        );
      }
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to update cancellation policy",
        500,
      );
    }
  },

  async softDeleteProperty(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const deleted = await adminService.softDeleteProperty(id);
      return sendSuccess(reply, deleted, 200);
    } catch (error: any) {
      logger.error({ error }, "Soft delete property failed");
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to delete property", 500);
    }
  },

  async getAllVendors(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;

      const result = await adminService.getAllVendors({
        page: parseInt(query.page || "1"),
        limit: parseInt(query.limit || "10"),
        status: query.status?.toUpperCase(),
        search: query.search,
      });

      return sendSuccess(reply, result.vendors, 200, result.meta);
    } catch (error: any) {
      logger.error({ error }, "Get vendors failed");
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to fetch vendors",
        500,
      );
    }
  },

  async updateVendorStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as { status: string; reason?: string };
      const adminUser = (request as any).user;

      const result = await adminService.updateVendorStatus(
        id,
        body.status,
        body.reason,
        adminUser ? { id: adminUser.id, name: adminUser.name || 'Admin', email: adminUser.email || '' } : undefined
      );
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Update vendor status failed");
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to update vendor",
        500,
      );
    }
  },

  async updateVendor(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const data = adminUpdateVendorSchema.parse(request.body);

      const result = await adminService.updateVendor(id, data);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Update vendor failed");
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      if (error.name === "ZodError") {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          "Invalid input data",
          400,
        );
      }
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to update vendor",
        500,
      );
    }
  },

  async updateVendorCommission(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { rate } = updateVendorCommissionSchema.parse(request.body);

      const result = await adminService.updateVendorCommission(id, rate);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Update vendor commission failed");
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      if (error.name === "ZodError") {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          "Invalid input data",
          400,
        );
      }
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to update vendor commission",
        500,
      );
    }
  },

  async getVendorById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const vendor = await adminService.getVendorById(id);
      return sendSuccess(reply, vendor, 200);
    } catch (error: any) {
      logger.error({ error }, "Get vendor failed");
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to get vendor details", 500);
    }
  },

  async softDeleteVendor(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const deleted = await adminService.softDeleteVendor(id);
      return sendSuccess(reply, deleted, 200);
    } catch (error: any) {
      logger.error({ error }, "Soft delete vendor failed");
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to delete vendor", 500);
    }
  },

  async getAllBookings(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;

      const result = await adminService.getAllBookings({
        page: parseInt(query.page || "1"),
        limit: parseInt(query.limit || "10"),
        status: query.status?.toUpperCase(),
        vendorId: query.vendorId,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
      });

      return sendSuccess(reply, result.bookings, 200, result.meta);
    } catch (error: any) {
      logger.error({ error }, "Get bookings failed");
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to fetch bookings",
        500,
      );
    }
  },

  async refundBooking(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const body = bookingRefundSchema.parse(request.body);

      const result = await adminService.refundBooking(
        id,
        body.amount,
        body.reason,
      );
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Refund booking failed");
      if (error.name === "ZodError") {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          "Invalid input data",
          400,
        );
      }
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to refund booking",
        500,
      );
    }
  },

  async getBookingById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const booking = await adminService.getBookingById(id);
      return sendSuccess(reply, booking, 200);
    } catch (error: any) {
      logger.error({ error }, "Get booking details failed");
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to fetch booking details", 500);
    }
  },

  async updateBookingStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { status, reason } = request.body as { status: string; reason?: string };
      const adminUser = (request as any).user;
      const updated = await adminService.updateBookingStatus(
        id, 
        status,
        reason,
        adminUser ? { id: adminUser.id, name: adminUser.name || 'Admin', email: adminUser.email || '' } : undefined
      );
      return sendSuccess(reply, updated, 200);
    } catch (error: any) {
      logger.error({ error }, "Update booking status failed");
      if (error.code === ERROR_CODES.VALIDATION_ERROR || error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, error.code === ERROR_CODES.VALIDATION_ERROR ? 400 : 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to update booking status", 500);
    }
  },

  async getPaymentDetails(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const payment = await adminService.getPaymentDetails(id);
      return sendSuccess(reply, payment, 200);
    } catch (error: any) {
      logger.error({ error }, "Get payment details failed");
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to fetch payment details", 500);
    }
  },

  async getAllPayouts(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = financeListFilterSchema.parse(request.query);

      const result = await adminService.getAllPayouts({
        page: query.page,
        limit: query.limit,
        status: query.status,
        search: query.search,
        vendorId: query.vendorId,
        startDate: query.startDate,
        endDate: query.endDate,
      });

      return sendSuccess(reply, result.payouts, 200, result.meta);
    } catch (error: any) {
      logger.error({ error }, "Get payouts failed");
      if (error.name === "ZodError") {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, error.issues?.[0]?.message || "Invalid payout filters", 400);
      }
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to fetch payouts",
        500,
      );
    }
  },

  async getPayoutById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const payout = await adminService.getPayoutById(id);
      return sendSuccess(reply, payout, 200);
    } catch (error: any) {
      logger.error({ error }, "Get payout failed");
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to fetch payout",
        500,
      );
    }
  },

  async getAllPayments(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = financeListFilterSchema.parse(request.query);

      const result = await adminService.getAllPayments({
        page: query.page,
        limit: query.limit,
        status: query.status,
        search: query.search,
        vendorId: query.vendorId,
        bookingId: query.bookingId,
        startDate: query.startDate,
        endDate: query.endDate,
      });

      return sendSuccess(reply, result.payments, 200, result.meta);
    } catch (error: any) {
      logger.error({ error }, "Get payments failed");
      if (error.name === "ZodError") {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, error.issues?.[0]?.message || "Invalid payment filters", 400);
      }
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to fetch payments",
        500,
      );
    }
  },

  async getPaymentById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const payment = await adminService.getPaymentById(id);
      return sendSuccess(reply, payment, 200);
    } catch (error: any) {
      logger.error({ error }, "Get payment failed");
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to fetch payment details",
        500,
      );
    }
  },

  async getAllRefunds(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = financeListFilterSchema.parse(request.query);

      const result = await adminService.getAllRefunds({
        page: query.page,
        limit: query.limit,
        search: query.search,
        vendorId: query.vendorId,
        bookingId: query.bookingId,
        startDate: query.startDate,
        endDate: query.endDate,
      });

      return sendSuccess(reply, result.refunds, 200, result.meta);
    } catch (error: any) {
      logger.error({ error }, "Get refunds failed");
      if (error.name === "ZodError") {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, error.issues?.[0]?.message || "Invalid refund filters", 400);
      }
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to fetch refunds",
        500,
      );
    }
  },

  async refundPayment(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { amount, reason } = paymentRefundSchema.parse(request.body);
      const user = (request as any).user;

      const result = await adminService.refundPayment(id, amount, reason, user ? {
        id: user.id,
        name: user.name,
        email: user.email,
      } : undefined);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Refund payment failed");
      if (error.name === "ZodError") {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          error.issues?.[0]?.message || "Invalid refund payload",
          400,
        );
      }
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      if (error.code === ERROR_CODES.VALIDATION_ERROR) {
        return sendError(reply, error.code, error.message, 400);
      }
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to refund payment",
        500,
      );
    }
  },

  async processPayout(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = payoutProcessingSchema.parse(request.body);
      const user = (request as any).user;

      const result = await adminService.processPayout(
        data.payoutId,
        data.action,
        data.notes,
        user ? {
          id: user.id,
          name: user.name,
          email: user.email,
        } : undefined,
      );
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Process payout failed");
      if (error.name === "ZodError") {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          error.issues?.[0]?.message || "Invalid payout processing payload",
          400,
        );
      }
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      if (error.code === ERROR_CODES.VALIDATION_ERROR) {
        return sendError(reply, error.code, error.message, 400);
      }
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to process payout",
        500,
      );
    }
  },

  async markPayoutPaid(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const body = markPayoutPaidSchema.parse(request.body);
      const user = (request as any).user;

      const result = await adminService.markPayoutPaid(
        id,
        body.transactionId,
        body.notes,
        body.paymentScreenshot,
        user ? {
          id: user.id,
          name: user.name,
          email: user.email,
        } : undefined,
      );
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Mark payout paid failed");
      if (error.name === "ZodError") {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          error.issues?.[0]?.message || "Invalid payout payment details",
          400,
        );
      }
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      if (error.code === ERROR_CODES.VALIDATION_ERROR) {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          error.message || "Invalid payout state for mark paid",
          400,
        );
      }
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to mark payout paid",
        500,
      );
    }
  },

  async verifyPayoutByVendor(request: FastifyRequest, reply: FastifyReply) {
    try {
      return sendError(
        reply,
        ERROR_CODES.FORBIDDEN,
        "Vendor payout acknowledgment must be performed through the vendor portal",
        403,
      );
    } catch (error: any) {
      logger.error({ error }, "Verify payout by vendor failed");
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      if (error.code === ERROR_CODES.VALIDATION_ERROR) {
        return sendError(reply, error.code, error.message, 400);
      }
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to verify payout",
        500,
      );
    }
  },

  async getVendorEarnings(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = financeListFilterSchema.parse(request.query);
      const result = await adminService.getVendorEarnings({
        vendorId: query.vendorId,
        search: query.search,
      });
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Get vendor earnings failed");
      if (error.name === "ZodError") {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, error.issues?.[0]?.message || "Invalid earnings filters", 400);
      }
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to fetch vendor earnings",
        500,
      );
    }
  },

  async createPayout(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { vendorId, amount } = createPayoutSchema.parse(request.body);
      const result = await adminService.createPayout(vendorId, amount);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Create payout failed");
      if (error.name === "ZodError") {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          error.issues?.[0]?.message || "Invalid payout payload",
          400,
        );
      }
      if (error.code === ERROR_CODES.VALIDATION_ERROR) {
        return sendError(reply, error.code, error.message, 400);
      }
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to create payout",
        500,
      );
    }
  },

  async updateRoom(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const body = adminRoomUpdateSchema.parse(request.body);

      const result = await adminService.updateRoom(
        id,
        body
      );
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Update room failed");
      if (error.name === "ZodError") {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          "Invalid input data",
          400,
        );
      }
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to update room",
        500,
      );
    }
  },

  async blockRoomDates(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const body = adminRoomBlockSchema.parse(request.body);

      const result = await adminService.blockRoomDates(
        id,
        body.checkInDate,
        body.checkOutDate,
        body.quantity
      );
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Block room dates failed");
      if (error.name === "ZodError") {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          "Invalid input data",
          400,
        );
      }
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to block room dates",
        500,
      );
    }
  },

  // ─── Review Moderation ───

  async adminGetAllReviews(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = adminReviewFilterSchema.parse(request.query);
      const result = await reviewsService.getAllAdmin({
        page: query.page,
        limit: query.limit,
        propertyId: query.propertyId,
        rating: query.rating,
        search: query.search,
        status: query.status,
      });
      return sendSuccess(reply, result.reviews, 200, result.meta);
    } catch (error: any) {
      logger.error({ error }, "Get admin reviews failed");
      if (error.name === 'ZodError') {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, 'Invalid review filters', 400);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to fetch reviews", 500);
    }
  },

  async adminApproveReview(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const result = await reviewsService.approveReview(id);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, 'Approve review failed');
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to approve review', 500);
    }
  },

  async getRoomInventory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { startDate, endDate } = adminRoomInventoryQuerySchema.parse(
        request.query,
      );

      const result = await adminService.getRoomInventory(
        id,
        new Date(startDate),
        new Date(endDate)
      );
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Get room inventory failed");
      if (error.name === "ZodError") {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          "Invalid inventory query parameters",
          400,
        );
      }
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to fetch inventory", 500);
    }
  },

  async overrideRoomInventory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { date, availableRooms } = adminRoomInventoryOverrideSchema.parse(
        request.body,
      );

      const result = await adminService.overrideRoomInventory(id, new Date(date), availableRooms);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Override room inventory failed");
      if (error.name === "ZodError") {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          "Invalid inventory override payload",
          400,
        );
      }
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to override inventory", 500);
    }
  },

  async updatePropertyRoomMetrics(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id, roomId } = request.params as { id: string; roomId: string };
      const body = adminRoomUpdateSchema.parse(request.body);
      const result = await adminService.updatePropertyRoomMetrics(id, roomId, body);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Update property room metrics failed");
      if (error.name === "ZodError") {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          "Invalid input data",
          400,
        );
      }
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to update room metrics",
        500,
      );
    }
  },

  async releaseRoomLocks(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { lockId } = request.query as { lockId?: string };

      const result = await adminService.releaseRoomLocks(id, lockId);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Release room locks failed");
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to release locks", 500);
    }
  },

  async cleanupInventoryLocks(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await adminService.cleanupInventoryLocks();
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Cleanup inventory locks failed");
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to cleanup locks", 500);
    }
  },

  async getAllPropertiesInventory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { date, vendorId } = request.query as { date?: string; vendorId?: string };
      // Parse date as local date to avoid timezone issues
      let targetDate: Date;
      if (date) {
        const [year, month, day] = date.split('-').map(Number);
        targetDate = new Date(year, month - 1, day, 12, 0, 0);
      } else {
        targetDate = new Date();
        targetDate.setHours(12, 0, 0, 0);
      }
      const result = await adminService.getAllPropertiesInventory(targetDate, vendorId);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Get all properties inventory failed");
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to fetch properties inventory", 500);
    }
  },

  async adminHideReview(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const result = await reviewsService.hideReview(id);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Hide review failed");
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to hide review", 500);
    }
  },

  async adminUnhideReview(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const result = await reviewsService.unhideReview(id);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Unhide review failed");
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to unhide review", 500);
    }
  },

  async adminVerifyReview(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const result = await reviewsService.verifyReview(id);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Verify review failed");
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to verify review", 500);
    }
  },

  async adminUpdateReviewContent(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const data = request.body as { title?: string; comment?: string };
      const result = await reviewsService.adminUpdateReviewContent(id, data);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Admin update review content failed");
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to update review", 500);
    }
  },

  async adminDeleteReview(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const result = await reviewsService.adminDeleteReview(id);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Admin delete review failed");
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to delete review", 500);
    }
  },

  // ─── Export Data ───

  async exportDataCsv(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { entity } = request.params as { entity: string };
      const validEntities = ['users', 'vendors', 'properties', 'bookings', 'payouts', 'payments', 'refunds'];
      if (!validEntities.includes(entity)) {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, "Invalid entity for export. Supported: " + validEntities.join(', '));
      }

      const filters = ['payouts', 'payments', 'refunds'].includes(entity)
        ? financeListFilterSchema.parse(request.query)
        : undefined;

      const rawData = await adminService.exportData(entity as any, filters);
      const csvString = jsonToCsv(rawData);

      reply.header('Content-Type', 'text/csv; charset=utf-8');
      reply.header('Content-Disposition', `attachment; filename="${entity}_export_${new Date().toISOString().split('T')[0]}.csv"`);
      return reply.send(csvString);
    } catch (error: any) {
      logger.error({ error }, "Export CSV failed");
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to export data", 500);
    }
  },

  async exportDataExcel(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { entity } = request.params as { entity: string };
      const validEntities = getAllEntities();
      
      if (!validEntities.includes(entity.toLowerCase())) {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, "Invalid entity for export. Supported: " + validEntities.join(', '));
      }

      const filters = ['payouts', 'payments', 'refunds'].includes(entity.toLowerCase())
        ? financeListFilterSchema.parse(request.query)
        : undefined;

      const rawData = await adminService.exportData(entity as any, filters) as any[];
      const excelBuffer = exportToExcel(rawData, entity);

      reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      reply.header('Content-Disposition', `attachment; filename="${entity}_export_${new Date().toISOString().split('T')[0]}.xlsx"`);
      return reply.send(excelBuffer);
    } catch (error: any) {
      logger.error({ error }, "Export Excel failed");
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to export data", 500);
    }
  },

  async getTemplate(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { entity } = request.params as { entity: string };
      const validEntities = getAllEntities();
      
      if (!validEntities.includes(entity.toLowerCase())) {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, "Invalid entity. Supported: " + validEntities.join(', '));
      }

      const config = getEntityConfig(entity);
      if (!config) {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, "Entity configuration not found");
      }

      const referenceData: Record<string, { id: string; name: string }[]> = {};

      if (entity.toLowerCase() === 'properties' || entity.toLowerCase() === 'rooms') {
        const vendors = await prisma.vendor.findMany({ select: { id: true, businessName: true } });
        referenceData['vendor'] = vendors.map(v => ({ id: v.id, name: v.businessName }));
      }

      if (entity.toLowerCase() === 'bookings') {
        const users = await prisma.user.findMany({ select: { id: true, name: true } });
        const properties = await prisma.property.findMany({ select: { id: true, name: true } });
        referenceData['user'] = users.map(u => ({ id: u.id, name: u.name || u.id }));
        referenceData['property'] = properties.map(p => ({ id: p.id, name: p.name }));
      }

      if (entity.toLowerCase() === 'payouts' || entity.toLowerCase() === 'vendorPayouts') {
        const vendors = await prisma.vendor.findMany({ select: { id: true, businessName: true } });
        referenceData['vendor'] = vendors.map(v => ({ id: v.id, name: v.businessName }));
      }

      if (entity.toLowerCase() === 'payments') {
        const bookings = await prisma.booking.findMany({ select: { id: true, bookingNumber: true } });
        referenceData['booking'] = bookings.map(b => ({ id: b.id, name: b.bookingNumber }));
      }

      const templateBuffer = generateTemplate(entity, referenceData);

      reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      reply.header('Content-Disposition', `attachment; filename="${entity}_template.xlsx"`);
      return reply.send(templateBuffer);
    } catch (error: any) {
      logger.error({ error }, "Get template failed");
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to generate template", 500);
    }
  },

  async importData(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { entity } = request.params as { entity: string };
      const validEntities = getAllEntities();
      
      if (!validEntities.includes(entity.toLowerCase())) {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, "Invalid entity. Supported: " + validEntities.join(', '));
      }

      const config = getEntityConfig(entity);
      if (!config) {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, "Entity configuration not found");
      }

      const file = await request.file();
      if (!file) {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, "No file uploaded");
      }

      const buffer = await file.toBuffer();
      const importedData = await importFromExcel(buffer);

      if (!importedData || importedData.length === 0) {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, "No data found in file");
      }

      const result = await adminService.importData(entity, importedData, config);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Import failed");
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to import data: " + error.message, 500);
    }
  },

  async getImportEntities(request: FastifyRequest, reply: FastifyReply) {
    try {
      const entities = getAllEntities();
      const entityConfigs = entities.map(entity => ({
        name: entity,
        config: getEntityConfig(entity),
      }));
      return sendSuccess(reply, entityConfigs);
    } catch (error: any) {
      logger.error({ error }, "Get entities failed");
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to get entities", 500);
    }
  },

  async exportFullExcel(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { entity } = request.params as { entity: string };
      const validEntities = [
        "users", "vendors", "properties", "rooms", "temples", "bookings", "payments",
        "refunds", "payouts", "commissionLedgers", "coupons", "couponUsages", "reviews",
        "wishlists", "cancellationPolicies", "services", "serviceBookings", "supportTickets",
        "platformSettings", "emailTemplates", "platformCities", "platformAmenities",
        "media", "auditLogs", "errorLogs", "broadcastNotifications", "notifications",
        "sessions", "templeDetails", "inventoryLocks", "inventoryDays", "adminLogs",
        "userPushSubscriptions", "userAddresses"
      ];
      
      if (!validEntities.includes(entity.toLowerCase())) {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, "Invalid entity: " + entity);
      }

      const excelBuffer = await exportAllFieldsToExcel(entity);
      reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      reply.header('Content-Disposition', `attachment; filename="${entity}_full_${new Date().toISOString().split('T')[0]}.xlsx"`);
      return reply.send(excelBuffer);
    } catch (error: any) {
      logger.error({ error }, "Export full Excel failed");
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to export data: " + error.message, 500);
    }
  },

  async getFullTemplate(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { entity } = request.params as { entity: string };
      const validEntities = [
        "users", "vendors", "properties", "rooms", "temples", "bookings", "payments",
        "refunds", "payouts", "commissionLedgers", "coupons", "couponUsages", "reviews",
        "wishlists", "cancellationPolicies", "services", "serviceBookings", "supportTickets",
        "platformSettings", "emailTemplates", "platformCities", "platformAmenities",
        "media", "auditLogs", "errorLogs", "broadcastNotifications", "notifications",
        "sessions", "templeDetails", "inventoryLocks", "inventoryDays", "adminLogs",
        "userPushSubscriptions", "userAddresses"
      ];
      
      if (!validEntities.includes(entity.toLowerCase())) {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, "Invalid entity: " + entity);
      }

      const templateBuffer = await generateFullTemplate(entity);
      reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      reply.header('Content-Disposition', `attachment; filename="${entity}_template_full.xlsx"`);
      return reply.send(templateBuffer);
    } catch (error: any) {
      logger.error({ error }, "Get full template failed");
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to generate template: " + error.message, 500);
    }
  },

  async importFullData(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { entity } = request.params as { entity: string };
      const validEntities = [
        "users", "vendors", "properties", "rooms", "temples", "bookings", "payments",
        "refunds", "payouts", "commissionLedgers", "coupons", "couponUsages", "reviews",
        "wishlists", "cancellationPolicies", "services", "serviceBookings", "supportTickets",
        "platformSettings", "emailTemplates", "platformCities", "platformAmenities",
        "media", "auditLogs", "errorLogs", "broadcastNotifications", "notifications",
        "sessions", "templeDetails", "inventoryLocks", "inventoryDays", "adminLogs",
        "userPushSubscriptions", "userAddresses"
      ];
      
      if (!validEntities.includes(entity.toLowerCase())) {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, "Invalid entity: " + entity);
      }

      const file = await request.file();
      if (!file) {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, "No file uploaded");
      }

      const buffer = await file.toBuffer();
      const result = await importAllFieldsFromExcel(entity, buffer);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Import full data failed");
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to import data: " + error.message, 500);
    }
  },

  async getAllExportEntities(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const entities = [
        { name: "users", label: "Users" },
        { name: "vendors", label: "Vendors" },
        { name: "properties", label: "Properties" },
        { name: "rooms", label: "Rooms" },
        { name: "temples", label: "Temples" },
        { name: "bookings", label: "Bookings" },
        { name: "payments", label: "Payments" },
        { name: "refunds", label: "Refunds" },
        { name: "payouts", label: "Payouts" },
        { name: "commissionLedgers", label: "Commission Ledger" },
        { name: "coupons", label: "Coupons" },
        { name: "couponUsages", label: "Coupon Usages" },
        { name: "reviews", label: "Reviews" },
        { name: "wishlists", label: "Wishlists" },
        { name: "cancellationPolicies", label: "Cancellation Policies" },
        { name: "services", label: "Services" },
        { name: "serviceBookings", label: "Service Bookings" },
        { name: "supportTickets", label: "Support Tickets" },
        { name: "platformSettings", label: "Platform Settings" },
        { name: "emailTemplates", label: "Email Templates" },
        { name: "platformCities", label: "Platform Cities" },
        { name: "platformAmenities", label: "Platform Amenities" },
        { name: "media", label: "Media" },
        { name: "auditLogs", label: "Audit Logs" },
        { name: "errorLogs", label: "Error Logs" },
        { name: "broadcastNotifications", label: "Broadcast Notifications" },
        { name: "notifications", label: "Notifications" },
        { name: "sessions", label: "Sessions" },
        { name: "templeDetails", label: "Temple Details" },
        { name: "inventoryLocks", label: "Inventory Locks" },
        { name: "inventoryDays", label: "Inventory Days" },
        { name: "adminLogs", label: "Admin Logs" },
        { name: "userPushSubscriptions", label: "Push Subscriptions" },
        { name: "userAddresses", label: "User Addresses" },
      ];
      return sendSuccess(reply, entities);
    } catch (error: any) {
      logger.error({ error }, "Get all export entities failed");
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to get entities", 500);
    }
  },

  // ─── Admin Logs ───

  async getAdminLogs(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;
      const result = await adminService.getAdminLogs({
        page: parseInt(query.page || "1"),
        limit: parseInt(query.limit || "20"),
        adminId: query.adminId,
        action: query.action,
        startDate: query.startDate,
        endDate: query.endDate,
      });
      return sendSuccess(reply, result.logs, 200, result.meta);
    } catch (error: any) {
      logger.error({ error }, "Get admin logs failed");
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to fetch admin logs", 500);
    }
  },

  // ─── Audit Logs ───

  async getAuditLogs(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;
      const result = await adminService.getAuditLogs({
        page: parseInt(query.page || "1"),
        limit: parseInt(query.limit || "20"),
        userId: query.userId,
        action: query.action,
        resource: query.resource,
        startDate: query.startDate,
        endDate: query.endDate,
      });
      return sendSuccess(reply, result.logs, 200, result.meta);
    } catch (error: any) {
      logger.error({ error }, "Get audit logs failed");
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to fetch audit logs", 500);
    }
  },

  // ─── System Health ───

  async getSystemHealth(request: FastifyRequest, reply: FastifyReply) {
    try {
      const health = await adminService.getSystemHealth();
      return sendSuccess(reply, health);
    } catch (error: any) {
      logger.error({ error }, "Get system health failed");
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to fetch system health", 500);
    }
  },

  // ─── Error Logs ───

  async getErrorLogs(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;
      const result = await adminService.getErrorLogs({
        page: parseInt(query.page || "1"),
        limit: parseInt(query.limit || "20"),
        level: query.level,
        source: query.source,
        resolved: query.resolved === 'true',
      });
      return sendSuccess(reply, result.errors, 200, result.meta);
    } catch (error: any) {
      logger.error({ error }, "Get error logs failed");
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to fetch error logs", 500);
    }
  },

    async resolveError(request: FastifyRequest, reply: FastifyReply) {
      try {
        const { id } = request.params as { id: string };
        const result = await adminService.resolveError(id);
        return sendSuccess(reply, result);
      } catch (error: any) {
        logger.error({ error }, "Resolve error failed");
        if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
          return sendError(reply, error.code, "Error not found", 404);
        }
        return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to resolve error", 500);
      }
    },

    // ─── Email Template Management ───

    async getEmailTemplates(request: FastifyRequest, reply: FastifyReply) {
      try {
        const { EmailTemplateService } = await import("../../services/email-template.service.js");
        const emailTemplateService = new EmailTemplateService();
        const templates = await emailTemplateService.getAllTemplates();
        return sendSuccess(reply, templates);
      } catch (error: any) {
        logger.error({ error }, "Get email templates failed");
        return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to fetch email templates", 500);
      }
    },

    async getEmailTemplateById(request: FastifyRequest, reply: FastifyReply) {
      try {
        const { id } = request.params as { id: string };
        const { EmailTemplateService } = await import("../../services/email-template.service.js");
        const emailTemplateService = new EmailTemplateService();
        const template = await emailTemplateService.getTemplateByName(id);
        
        if (!template) {
          return sendError(reply, ERROR_CODES.RESOURCE_NOT_FOUND, "Email template not found", 404);
        }
        
        return sendSuccess(reply, template);
      } catch (error: any) {
        logger.error({ error }, "Get email template by ID failed");
        return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to fetch email template", 500);
      }
    },

    async createEmailTemplate(request: FastifyRequest, reply: FastifyReply) {
      try {
        const { EmailTemplateService } = await import("../../services/email-template.service.js");
        const emailTemplateService = new EmailTemplateService();
        const { name, subject, html, text } = request.body as { 
          name: string; 
          subject: string; 
          html: string; 
          text: string;
        };
        
        const template = await emailTemplateService.createTemplate({ name, subject, html, text });
        return sendSuccess(reply, template, 201);
      } catch (error: any) {
        logger.error({ error }, "Create email template failed");
        
        if (error.code === 'P2002') {
          return sendError(reply, ERROR_CODES.VALIDATION_ERROR, "Email template with this name already exists", 400);
        }
        
        return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to create email template", 500);
      }
    },

    async updateEmailTemplate(request: FastifyRequest, reply: FastifyReply) {
      try {
        const { id } = request.params as { id: string };
        const { EmailTemplateService } = await import("../../services/email-template.service.js");
        const emailTemplateService = new EmailTemplateService();
        const { subject, html, text } = request.body as { 
          subject?: string; 
          html?: string; 
          text?: string;
        };
        
        const template = await emailTemplateService.updateTemplate(id, { subject, html, text });
        return sendSuccess(reply, template);
      } catch (error: any) {
        logger.error({ error }, "Update email template failed");
        
        if (error.code === 'P2025') {
          return sendError(reply, ERROR_CODES.RESOURCE_NOT_FOUND, "Email template not found", 404);
        }
        
        return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to update email template", 500);
      }
    },

    async deleteEmailTemplate(request: FastifyRequest, reply: FastifyReply) {
      try {
        const { id } = request.params as { id: string };
        const { EmailTemplateService } = await import("../../services/email-template.service.js");
        const emailTemplateService = new EmailTemplateService();
        await emailTemplateService.deleteTemplate(id);
        return sendSuccess(reply, { success: true });
      } catch (error: any) {
        logger.error({ error }, "Delete email template failed");
        
        if (error.code === 'P2025') {
          return sendError(reply, ERROR_CODES.RESOURCE_NOT_FOUND, "Email template not found", 404);
        }
        
        return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to delete email template", 500);
      }
    },

    // ─── Broadcasts ───

  async getBroadcasts(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;
      const result = await adminService.getBroadcasts({
        page: parseInt(query.page || "1"),
        limit: parseInt(query.limit || "20"),
        status: query.status,
      });
      return sendSuccess(reply, result.broadcasts, 200, result.meta);
    } catch (error: any) {
      logger.error({ error }, "Get broadcasts failed");
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to fetch broadcasts", 500);
    }
  },

  async createBroadcast(request: FastifyRequest, reply: FastifyReply) {
    try {
      const createBroadcastSchema = z.object({
        title: z.string().min(1).max(200),
        message: z.string().min(1),
        targetAudience: z.enum(['all', 'users', 'vendors']).optional(),
        scheduledAt: z.string().datetime().optional(),
      })
      const data = createBroadcastSchema.parse(request.body);
      const user = (request as any).user;
      const result = await adminService.createBroadcast({
        title: data.title,
        message: data.message,
        targetAudience: data.targetAudience || 'all',
        scheduledAt: data.scheduledAt,
      }, user ? {
        id: user.id,
        name: user.name,
        email: user.email,
      } : undefined);
      return sendSuccess(reply, result, 201);
    } catch (error: any) {
      logger.error({ error }, "Create broadcast failed");
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to create broadcast", 500);
    }
  },

  async cancelBroadcast(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const result = await adminService.cancelBroadcast(id);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, "Cancel broadcast failed");
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, "Broadcast not found", 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to cancel broadcast", 500);
    }
  },

  async deleteBroadcast(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      await adminService.deleteBroadcast(id);
      return sendSuccess(reply, { success: true });
    } catch (error: any) {
      logger.error({ error }, "Delete broadcast failed");
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, "Broadcast not found", 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to delete broadcast", 500);
    }
  },

  // City Management
  async getCities(request: FastifyRequest, reply: FastifyReply) {
    try {
      const cities = await adminService.getCities();
      return sendSuccess(reply, cities);
    } catch (error: any) {
      logger.error({ error }, "Get cities failed");
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to get cities", 500);
    }
  },

  async createCity(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { name } = request.body as { name: string };
      if (!name) {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, "City name is required", 400);
      }
      const city = await adminService.createCity(name.toUpperCase().trim());
      return sendSuccess(reply, city, 201);
    } catch (error: any) {
      logger.error({ error }, "Create city failed");
      if (error.code === 'P2002') {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, "City already exists", 400);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to create city", 500);
    }
  },

  async updateCity(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { name, isActive } = request.body as { name?: string; isActive?: boolean };
      const city = await adminService.updateCity(id, { name: name?.toUpperCase().trim(), isActive });
      return sendSuccess(reply, city);
    } catch (error: any) {
      logger.error({ error }, "Update city failed");
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, "City not found", 404);
      }
      if (error.code === 'P2002') {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, "City name already exists", 400);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to update city", 500);
    }
  },

  async deleteCity(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      await adminService.deleteCity(id);
      return sendSuccess(reply, { success: true });
    } catch (error: any) {
      logger.error({ error }, "Delete city failed");
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, "City not found", 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, "Failed to delete city", 500);
    }
  },
};
