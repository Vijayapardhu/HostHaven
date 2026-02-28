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
        return sendError(reply, error.code, error.message, 409);
      }
      if (error.name === 'ZodError') {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, 'Invalid input data', 400);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to register vendor', 500);
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
        return sendError(reply, error.code, error.message, 401);
      }
      if (error.code === ERROR_CODES.FORBIDDEN) {
        return sendError(reply, error.code, error.message, 403);
      }
      if (error.name === 'ZodError') {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, 'Invalid input data', 400);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to login', 500);
    }
  },

  async getDashboard(request: FastifyRequest, reply: FastifyReply) {
    try {
      const vendorId = (request as any).user.vendorId;

      const dashboard = await vendorService.getDashboard(vendorId);

      return sendSuccess(reply, dashboard);
    } catch (error: any) {
      logger.error({ error }, 'Get vendor dashboard failed');
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch dashboard', 500);
    }
  },

  async getAnalytics(request: FastifyRequest, reply: FastifyReply) {
    try {
      const vendorId = (request as any).user.vendorId;
      const analytics = await vendorService.getAnalytics(vendorId);
      return sendSuccess(reply, analytics);
    } catch (error: any) {
      logger.error({ error }, 'Get vendor analytics failed');
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch analytics', 500);
    }
  },

  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const vendorId = (request as any).user.vendorId;

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
      const vendorId = (request as any).user.vendorId;
      const data = updateVendorSchema.parse(request.body);

      const profile = await vendorService.updateVendor(vendorId, data);

      return sendSuccess(reply, profile);
    } catch (error: any) {
      logger.error({ error }, 'Update vendor profile failed');
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      if (error.name === 'ZodError') {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, 'Invalid input data', 400);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to update profile', 500);
    }
  },

  async getHotel(request: FastifyRequest, reply: FastifyReply) {
    try {
      const vendorId = (request as any).user.vendorId;
      const hotel = await vendorService.getHotel(vendorId);
      return sendSuccess(reply, hotel);
    } catch (error: any) {
      logger.error({ error }, 'Get vendor hotel failed');
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch hotel', 500);
    }
  },

  async updateHotel(request: FastifyRequest, reply: FastifyReply) {
    try {
      const vendorId = (request as any).user.vendorId;
      const data = request.body as any; // We can parse using a Zod schema if available
      const hotel = await vendorService.updateHotel(vendorId, data);
      return sendSuccess(reply, hotel);
    } catch (error: any) {
      logger.error({ error }, 'Update vendor hotel failed');
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to update hotel', 500);
    }
  },

  async uploadHotelImage(request: FastifyRequest, reply: FastifyReply) {
    try {
      const vendorId = (request as any).user.vendorId;
      const data = await request.file();
      if (!data) {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, 'No file uploaded', 400);
      }

      const fileUpload = {
        filename: data.filename,
        data: await data.toBuffer(),
        mimetype: data.mimetype,
      };

      const result = await vendorService.uploadHotelImage(vendorId, fileUpload);
      return sendSuccess(reply, result, 201);
    } catch (error: any) {
      logger.error({ error }, 'Upload hotel image failed');
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to upload image', 500);
    }
  },

  async deleteHotelImage(request: FastifyRequest, reply: FastifyReply) {
    try {
      const vendorId = (request as any).user.vendorId;
      const { imgId } = request.params as any;
      await vendorService.deleteHotelImage(vendorId, imgId);
      return sendSuccess(reply, { success: true });
    } catch (error: any) {
      logger.error({ error }, 'Delete hotel image failed');
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to delete image', 500);
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
      const adminId = (request as any).user.id;

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
      const adminId = (request as any).user.id;

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

export const VendorRoomsController = {
  async getRoomsByProperty(request: FastifyRequest, reply: FastifyReply) {
    try {
      const vendorId = (request as any).user.vendorId;
      const { propertyId } = request.params as any;

      const rooms = await vendorService.getRoomsByProperty(vendorId, propertyId);
      return sendSuccess(reply, rooms);
    } catch (error: any) {
      logger.error({ error }, 'Get vendor property rooms failed');
      if (error.code === ERROR_CODES.UNAUTHORIZED || error.message === 'Unauthorized') {
        return sendError(reply, ERROR_CODES.UNAUTHORIZED, 'Unauthorized', 403);
      }
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch rooms', 500);
    }
  },

  async createRoom(request: FastifyRequest, reply: FastifyReply) {
    try {
      const vendorId = (request as any).user.vendorId;
      const { propertyId } = request.params as any;
      const data = request.body as any;

      const room = await vendorService.createRoom(vendorId, propertyId, data);
      return sendSuccess(reply, room, 201);
    } catch (error: any) {
      logger.error({ error }, 'Create vendor property room failed');
      if (error.code === ERROR_CODES.UNAUTHORIZED || error.message === 'Unauthorized') {
        return sendError(reply, ERROR_CODES.UNAUTHORIZED, 'Unauthorized', 403);
      }
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to create room', 500);
    }
  },

  async updateRoom(request: FastifyRequest, reply: FastifyReply) {
    try {
      const vendorId = (request as any).user.vendorId;
      const { propertyId, roomId } = request.params as any;
      const data = request.body as any;

      const room = await vendorService.updateRoom(vendorId, propertyId, roomId, data);
      return sendSuccess(reply, room);
    } catch (error: any) {
      logger.error({ error }, 'Update vendor property room failed');
      if (error.code === ERROR_CODES.UNAUTHORIZED || error.message === 'Unauthorized') {
        return sendError(reply, ERROR_CODES.UNAUTHORIZED, 'Unauthorized', 403);
      }
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to update room', 500);
    }
  },

  async deleteRoom(request: FastifyRequest, reply: FastifyReply) {
    try {
      const vendorId = (request as any).user.vendorId;
      const { propertyId, roomId } = request.params as any;

      await vendorService.deleteRoom(vendorId, propertyId, roomId);
      return sendSuccess(reply, { success: true });
    } catch (error: any) {
      logger.error({ error }, 'Delete vendor property room failed');
      if (error.code === ERROR_CODES.UNAUTHORIZED || error.message === 'Unauthorized') {
        return sendError(reply, ERROR_CODES.UNAUTHORIZED, 'Unauthorized', 403);
      }
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to delete room', 500);
    }
  },
};
