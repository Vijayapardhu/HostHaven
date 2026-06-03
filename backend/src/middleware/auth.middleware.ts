import { FastifyRequest, FastifyReply } from "fastify";
import { verifyAccessToken } from "../utils/token.util";
import { sendError } from "../utils/response.util";
import { ERROR_CODES } from "../constants/error-codes";
import { logger } from "../utils/logger.util";
import prisma from "../config/database";

import { AuthUser } from "../types";

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
  }
  interface FastifyInstance {
    authenticate: any;
    authenticateVendorStatus: any;
  }
}

const resolveRequestUser = async (
  decoded: ReturnType<typeof verifyAccessToken>,
  options?: { allowPendingVendor?: boolean },
): Promise<AuthUser | null> => {
  if (!decoded?.userId) {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: {
      id: decoded.userId,
      isDeleted: false,
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  if (!user) {
    return null;
  }

  const requestUser: AuthUser = {
    id: user.id,
    email: user.email,
    role: user.role as AuthUser["role"],
  };

  if (requestUser.role === "VENDOR") {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: requestUser.id },
      select: { id: true, isDeleted: true, applicationStatus: true },
    });
    if (!vendor || vendor.isDeleted) {
      return null;
    }
    requestUser.vendorId = vendor.id;
    requestUser.isApproved = vendor.applicationStatus === 'APPROVED';
    requestUser.applicationStatus = vendor.applicationStatus;

    if (vendor.applicationStatus === "SUSPENDED") {
      return null;
    }

    if (!options?.allowPendingVendor && vendor.applicationStatus !== 'APPROVED') {
      return null;
    }
  }

  return requestUser;
};

export const authMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(
        reply,
        ERROR_CODES.UNAUTHORIZED,
        "Authorization header missing",
        401,
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return sendError(
        reply,
        ERROR_CODES.INVALID_TOKEN,
        "Invalid or expired token",
        401,
      );
    }

    const requestUser = await resolveRequestUser(decoded);
    if (!requestUser) {
      return sendError(
        reply,
        ERROR_CODES.UNAUTHORIZED,
        "Authentication failed",
        401,
      );
    }

    request.user = requestUser;
  } catch (error) {
    logger.error({ error }, "Auth middleware error");
    return sendError(
      reply,
      ERROR_CODES.UNAUTHORIZED,
      "Authentication failed",
      401,
    );
  }
};

export const optionalAuthMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const authHeader = request.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = verifyAccessToken(token);

      if (!decoded) {
        logger.debug("Optional auth received invalid token");
        return;
      }

      const requestUser = await resolveRequestUser(decoded);
      if (requestUser) {
        request.user = requestUser;
      } else {
        logger.debug({ userId: decoded.userId }, "Optional auth user not found");
      }
    }
  } catch (error) {
    logger.warn({ error }, "Optional auth middleware error");
  }
};

export const vendorStatusAuthMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(
        reply,
        ERROR_CODES.UNAUTHORIZED,
        "Authorization header missing",
        401,
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return sendError(
        reply,
        ERROR_CODES.INVALID_TOKEN,
        "Invalid or expired token",
        401,
      );
    }

    const requestUser = await resolveRequestUser(decoded, { allowPendingVendor: true });
    if (!requestUser) {
      return sendError(
        reply,
        ERROR_CODES.UNAUTHORIZED,
        "Authentication failed",
        401,
      );
    }

    request.user = requestUser;
  } catch (error) {
    logger.error({ error }, "Vendor status auth middleware error");
    return sendError(
      reply,
      ERROR_CODES.UNAUTHORIZED,
      "Authentication failed",
      401,
    );
  }
};

export const requireRole = (...roles: string[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return sendError(
        reply,
        ERROR_CODES.UNAUTHORIZED,
        "Authentication required",
        401,
      );
    }

    const userRole = request.user.role.toUpperCase();
    const hasRole = roles.some((role) => role.toUpperCase() === userRole);

    if (!hasRole) {
      return sendError(
        reply,
        ERROR_CODES.FORBIDDEN,
        "Insufficient permissions",
        403,
      );
    }
  };
};

export const requireVerified = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    if (!request.user) {
      return sendError(
        reply,
        ERROR_CODES.UNAUTHORIZED,
        "Authentication required",
        401,
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        id: request.user.id,
        isDeleted: false,
        isActive: true,
      },
      select: {
        isVerified: true,
        role: true,
      },
    });

    if (!user) {
      return sendError(
        reply,
        ERROR_CODES.UNAUTHORIZED,
        "Authentication required",
        401,
      );
    }

    if (user.role !== "ADMIN" && !user.isVerified) {
      return sendError(
        reply,
        ERROR_CODES.EMAIL_NOT_VERIFIED,
        "Please verify your email before continuing",
        403,
      );
    }
  } catch (error) {
    logger.error({ error }, "Require verified middleware error");
    return sendError(
      reply,
      ERROR_CODES.INTERNAL_ERROR,
      "Failed to verify account status",
      500,
    );
  }
};
