import { FastifyRequest, FastifyReply } from 'fastify';
import templesService from './temples.service';
import { sendSuccess, sendError } from '../../utils/response.util';
import { ERROR_CODES } from '../../constants/error-codes';
import { logger } from '../../utils/logger.util';
import {
  createTempleDetailsSchema,
  updateTempleDetailsSchema,
  templeDetailsIdSchema,
  templeFilterSchema,
} from './temples.schema';

export const TemplesController = {
  async getTemples(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = templeFilterSchema.parse(request.query);

      const result = await templesService.getTemples({
        page: query.page,
        limit: query.limit,
        deity: query.deity,
        templeType: query.templeType,
        state: query.state,
      });

      return sendSuccess(reply, result.temples, 200, result.meta);
    } catch (error: any) {
      logger.error({ error }, 'Get temples failed');
      if (error.name === 'ZodError') {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, 'Invalid query parameters', 400);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch temples', 500);
    }
  },

  async getById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = templeDetailsIdSchema.parse(request.params);
      const temple = await templesService.getById(id);
      return sendSuccess(reply, temple);
    } catch (error: any) {
      logger.error({ error }, 'Get temple failed');
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch temple', 500);
    }
  },

  async getByProperty(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { propertyId } = request.params as { propertyId: string };
      const temple = await templesService.getByProperty(propertyId);
      return sendSuccess(reply, temple);
    } catch (error: any) {
      logger.error({ error }, 'Get temple by property failed');
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch temple', 500);
    }
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = createTempleDetailsSchema.parse(request.body);

      const temple = await templesService.create(data);

      return sendSuccess(reply, temple, 201);
    } catch (error: any) {
      logger.error({ error }, 'Create temple details failed');
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      if (error.code === ERROR_CODES.RESOURCE_CONFLICT) {
        return sendError(reply, error.code, error.message, 409);
      }
      if (error.name === 'ZodError') {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, 'Invalid input data', 400);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to create temple details', 500);
    }
  },

  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = templeDetailsIdSchema.parse(request.params);
      const data = updateTempleDetailsSchema.parse(request.body);

      const temple = await templesService.update(id, data);

      return sendSuccess(reply, temple);
    } catch (error: any) {
      logger.error({ error }, 'Update temple details failed');
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      if (error.name === 'ZodError') {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, 'Invalid input data', 400);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to update temple details', 500);
    }
  },

  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = templeDetailsIdSchema.parse(request.params);
      const result = await templesService.delete(id);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, 'Delete temple details failed');
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to delete temple details', 500);
    }
  },

  async getUpcomingEvents(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = templeDetailsIdSchema.parse(request.params);
      const { days } = request.query as { days?: string };

      const events = await templesService.getUpcomingEvents(id, days ? parseInt(days) : 30);
      return sendSuccess(reply, events);
    } catch (error: any) {
      logger.error({ error }, 'Get upcoming events failed');
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch events', 500);
    }
  },
};
