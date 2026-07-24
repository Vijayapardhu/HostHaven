import { errorHandler } from './error.middleware';
import { AppError } from '../utils/app-error';

jest.mock('../utils/logger.util', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const makeReply = () => {
  const reply: any = {
    statusCode: 0,
    payload: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    send(payload: unknown) {
      this.payload = payload;
      return this;
    },
  };
  return reply;
};

const request: any = {
  id: 'req-1',
  method: 'GET',
  url: '/test',
  headers: {},
};

describe('errorHandler', () => {
  it('returns an AppError with its own status, code, and message', () => {
    const reply = makeReply();

    errorHandler(
      AppError.conflict('Coupon code already exists') as any,
      request,
      reply,
    );

    expect(reply.statusCode).toBe(409);
    expect(reply.payload.error.code).toBe('RESOURCE_CONFLICT');
    expect(reply.payload.error.message).toBe('Coupon code already exists');
  });

  it('suppresses Prisma-style codes instead of echoing schema details', () => {
    const reply = makeReply();
    const prismaLike: any = new Error(
      'Unique constraint failed on the fields: (`email`)',
    );
    prismaLike.code = 'P2002';

    errorHandler(prismaLike, request, reply);

    expect(reply.statusCode).toBe(500);
    expect(reply.payload.error.message).not.toContain('email');
  });

  it('suppresses Node system error codes', () => {
    const reply = makeReply();
    const systemError: any = new Error('connect ECONNREFUSED 127.0.0.1:6379');
    systemError.code = 'ECONNREFUSED';

    errorHandler(systemError, request, reply);

    expect(reply.statusCode).toBe(500);
    expect(reply.payload.error.message).not.toContain('127.0.0.1');
  });

  it('still honours the legacy application-code pattern during migration', () => {
    const reply = makeReply();
    const legacy: any = new Error('Booking not found');
    legacy.code = 'BOOKING_NOT_FOUND';

    errorHandler(legacy, request, reply);

    expect(reply.statusCode).toBe(400);
    expect(reply.payload.error.code).toBe('BOOKING_NOT_FOUND');
    expect(reply.payload.error.message).toBe('Booking not found');
  });
});
