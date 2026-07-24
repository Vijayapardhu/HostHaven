import { ERROR_CODES } from '../constants/error-codes';

type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * The one way application code signals an expected failure.
 *
 * Anything thrown as an AppError reaches the client with its code, status and
 * message intact; everything else (Prisma errors, Node system errors, plain
 * throws) is treated as internal by the global handler — logged in full,
 * returned as a generic 500. This replaces ~250 ad-hoc
 * `(error as any).code = ...` constructions.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;

  constructor(code: ErrorCode, statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    // Retain a proper prototype chain when targeting ES5-compatible output.
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static notFound(message: string, code: ErrorCode = ERROR_CODES.RESOURCE_NOT_FOUND) {
    return new AppError(code, 404, message);
  }

  static validation(message: string, code: ErrorCode = ERROR_CODES.VALIDATION_ERROR) {
    return new AppError(code, 400, message);
  }

  static unauthorized(message = 'Authentication required') {
    return new AppError(ERROR_CODES.UNAUTHORIZED, 401, message);
  }

  static forbidden(message = 'You do not have permission to do this') {
    return new AppError(ERROR_CODES.FORBIDDEN, 403, message);
  }

  static conflict(message: string, code: ErrorCode = ERROR_CODES.RESOURCE_CONFLICT) {
    return new AppError(code, 409, message);
  }
}

export default AppError;
