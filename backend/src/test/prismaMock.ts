/**
 * Stand-in for the Prisma client used in unit tests.
 *
 * Jest maps `../../config/database` to this module (see jest.config.js), so
 * services under test operate against plain mocks instead of a real database.
 * Tests set return values per model method as needed.
 */
const model = () => ({
  findFirst: jest.fn(),
  findUnique: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
  upsert: jest.fn(),
  count: jest.fn(),
  aggregate: jest.fn(),
  delete: jest.fn(),
  deleteMany: jest.fn(),
});

export const prismaMock = {
  booking: model(),
  supportTicket: model(),
  user: model(),
  commissionLedger: model(),
  payout: model(),
  payment: model(),
  service: model(),
  serviceBooking: model(),
  room: model(),
  inventoryLock: model(),
  inventoryDay: model(),
  coupon: model(),
  couponUsage: model(),
  cancellationPolicy: model(),
  $transaction: jest.fn(),
};

export default prismaMock;
