import { FastifyReply, FastifyRequest } from 'fastify';
import { sendError, sendSuccess } from '../../utils/response.util';
import { ERROR_CODES } from '../../constants/error-codes';
import { logger } from '../../utils/logger.util';
import inventoryService from './inventory.service';
import { inventoryLockSchema, inventoryReleaseSchema, inventoryQuerySchema } from './inventory.schema';
import { verifyAccessToken } from '../../utils/token.util';
import prisma from '../../config/database';
import { AuthUser } from '../../types';

export const InventoryController = {
  async getLiveInventory(request: FastifyRequest, reply: FastifyReply) {
    reply.hijack();
    
    const stream = reply.raw;
    stream.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    try {
      const token = (request.query as any).token;
      
      if (!token) {
        stream.write(`data: ${JSON.stringify({ error: 'Token required' })}\n\n`);
        stream.end();
        return;
      }

      const decoded = verifyAccessToken(token);
      if (!decoded) {
        stream.write(`data: ${JSON.stringify({ error: 'Invalid or expired token' })}\n\n`);
        stream.end();
        return;
      }

      const user = await prisma.user.findFirst({
        where: { id: decoded.userId, isDeleted: false, isActive: true },
        select: { id: true, email: true, role: true },
      });

      if (!user) {
        stream.write(`data: ${JSON.stringify({ error: 'User not found' })}\n\n`);
        stream.end();
        return;
      }

      const requestUser: AuthUser = {
        id: user.id,
        email: user.email,
        role: user.role as AuthUser['role'],
      };

      if (requestUser.role === 'VENDOR') {
        const vendor = await prisma.vendor.findUnique({
          where: { userId: requestUser.id },
          select: { id: true },
        });
        if (!vendor) {
          stream.write(`data: ${JSON.stringify({ error: 'Vendor not found' })}\n\n`);
          stream.end();
          return;
        }
        requestUser.vendorId = vendor.id;
      }

      const sendSnapshot = async () => {
        try {
          const snapshot = await inventoryService.getLiveInventorySnapshot(requestUser);
          stream.write(`data: ${JSON.stringify(snapshot)}\n\n`);
        } catch (err) {
          logger.error({ err }, 'Failed to send inventory snapshot');
        }
      };

      await sendSnapshot();

      const interval = setInterval(sendSnapshot, 8000);

      request.raw.on('close', () => {
        clearInterval(interval);
      });
    } catch (error: any) {
      logger.error({ error }, 'Live inventory SSE failed');
      stream.write(`data: ${JSON.stringify({ error: 'Internal server error' })}\n\n`);
      stream.end();
    }
  },

  async getAvailability(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = inventoryQuerySchema.parse(request.query);
      const result = await inventoryService.getAvailability(query.roomId, new Date(query.date));
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, 'Get inventory availability failed');
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch inventory', 500);
    }
  },

  async lock(request: FastifyRequest, reply: FastifyReply) {
    try {
      const payload = inventoryLockSchema.parse(request.body);
      const userId = (request as any).user?.id;
      const result = await inventoryService.lockInventory(
        payload.roomId,
        userId,
        payload.quantity,
        new Date(payload.checkIn),
        new Date(payload.checkOut)
      );
      return sendSuccess(reply, result, 201);
    } catch (error: any) {
      logger.error({ error }, 'Lock inventory failed');
      if (error.code === ERROR_CODES.ROOM_NOT_AVAILABLE) {
        return sendError(reply, error.code, error.message, 409);
      }
      if (error.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
        return sendError(reply, error.code, error.message, 404);
      }
      if (error.name === 'ZodError') {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, 'Invalid input data', 400);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to lock inventory', 500);
    }
  },

  async release(request: FastifyRequest, reply: FastifyReply) {
    try {
      const payload = inventoryReleaseSchema.parse(request.body);
      const userId = (request as any).user?.id;
      const result = await inventoryService.releaseLock(payload.roomId, userId);
      return sendSuccess(reply, result);
    } catch (error: any) {
      logger.error({ error }, 'Release inventory lock failed');
      if (error.name === 'ZodError') {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, 'Invalid input data', 400);
      }
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to release inventory', 500);
    }
  },
};
