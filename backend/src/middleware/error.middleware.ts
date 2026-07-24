import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { sendError } from '../utils/response.util';
import { ERROR_CODES } from '../constants/error-codes';
import { logger } from '../utils/logger.util';
import { ZodError } from 'zod';
import { AppError } from '../utils/app-error';

// Codes the application defines itself. Anything outside this set (Prisma's
// P-codes, Node's E-codes) is treated as internal and never echoed to clients.
const APPLICATION_ERROR_CODES: ReadonlySet<string> = new Set(
  Object.values(ERROR_CODES),
);

const isApplicationErrorCode = (code: unknown): code is string =>
  typeof code === 'string' && APPLICATION_ERROR_CODES.has(code);

export const errorHandler = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const requestId = request.id;
  
  // Log the error
  logger.error({
    requestId,
    error: {
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode,
    },
    request: {
      method: request.method,
      url: request.url,
      headers: {
        'user-agent': request.headers['user-agent'],
        'content-type': request.headers['content-type'],
        'x-request-id': request.headers['x-request-id'],
      },
    },
  }, 'Request error');

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const details: Record<string, string[]> = {};
    error.errors.forEach((err) => {
      const path = err.path.join('.');
      if (!details[path]) {
        details[path] = [];
      }
      details[path].push(err.message);
    });

    return reply.status(400).send({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation failed',
        details,
      },
      timestamp: new Date().toISOString(),
      requestId,
    });
  }

  // AppError is the canonical expected-failure signal: code, status, and
  // message all chosen deliberately by application code.
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
      timestamp: new Date().toISOString(),
      requestId,
    });
  }

  // Handle known application error codes (legacy pattern, migrating to
  // AppError module by module).
  //
  // Only codes the application itself defines may have their message returned.
  // Prisma errors carry codes like P2002/P2025 and Node system errors carry
  // ECONNREFUSED — echoing those leaks model and column names to the client,
  // so anything unrecognised falls through to the generic 500 below.
  const rawCode = (error as any).code;
  if (rawCode && isApplicationErrorCode(rawCode)) {
    const statusCode = error.statusCode || 400;

    return reply.status(statusCode).send({
      success: false,
      error: {
        code: rawCode,
        message: error.message,
      },
      timestamp: new Date().toISOString(),
      requestId,
    });
  }

  if (rawCode) {
    logger.error(
      { requestId, code: rawCode, message: error.message },
      'Internal error with non-application code suppressed from response',
    );
  }

  // Handle Fastify errors
  if (error.statusCode) {
    const message = 
      error.statusCode === 401 ? 'Unauthorized' :
      error.statusCode === 403 ? 'Forbidden' :
      error.statusCode === 404 ? 'Not Found' :
      error.statusCode === 429 ? 'Too Many Requests' :
      error.message;

    return reply.status(error.statusCode).send({
      success: false,
      error: {
        code: error.statusCode === 429 ? ERROR_CODES.RATE_LIMIT_EXCEEDED : ERROR_CODES.INTERNAL_ERROR,
        message,
      },
      timestamp: new Date().toISOString(),
      requestId,
    });
  }

  // Handle unknown errors
  return reply.status(500).send({
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
    },
    timestamp: new Date().toISOString(),
    requestId,
  });
};

export const notFoundHandler = (request: FastifyRequest, reply: FastifyReply) => {
  return reply.status(404).send({
    success: false,
    error: {
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: `Route ${request.method} ${request.url} not found`,
    },
    timestamp: new Date().toISOString(),
    requestId: request.id,
  });
};
