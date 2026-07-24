import prismaMock from '../../test/prismaMock';
import { SupportService, REFUND_CATEGORY } from './support.service';

jest.mock('../../utils/logger.util', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
jest.mock('../../services/webpush.service', () => ({
  webPushService: { sendNotification: jest.fn() },
}));
jest.mock('../notifications/notifications.service', () => ({
  __esModule: true,
  default: { create: jest.fn() },
}));

const service = new SupportService();

const paidBooking = {
  id: 'booking-1',
  bookingNumber: 'HH-1001',
  status: 'CONFIRMED',
  totalAmount: 5000,
  payment: { status: 'COMPLETED' },
};

describe('SupportService.requestRefund', () => {
  beforeEach(() => {
    prismaMock.booking.findFirst.mockReset();
    prismaMock.supportTicket.findFirst.mockReset();
    prismaMock.supportTicket.create.mockReset();
  });

  it('opens a refund ticket against the caller’s own booking', async () => {
    prismaMock.booking.findFirst.mockResolvedValue(paidBooking);
    prismaMock.supportTicket.findFirst.mockResolvedValue(null);
    prismaMock.supportTicket.create.mockImplementation(({ data }: any) => ({
      id: 'ticket-1',
      ...data,
    }));

    const ticket = await service.requestRefund('user-1', {
      bookingNumber: 'HH-1001',
      reason: 'The room was not as described.',
    });

    expect(ticket.category).toBe(REFUND_CATEGORY);
    expect(ticket.bookingReference).toBe('HH-1001');
    expect(ticket.status).toBe('OPEN');

    // Ownership is enforced in the query, not after the fact.
    expect(prismaMock.booking.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { bookingNumber: 'HH-1001', userId: 'user-1' },
      }),
    );
  });

  it('refuses a booking that does not belong to the caller', async () => {
    prismaMock.booking.findFirst.mockResolvedValue(null);

    await expect(
      service.requestRefund('user-2', {
        bookingNumber: 'HH-1001',
        reason: 'I would like my money back please.',
      }),
    ).rejects.toThrow('No booking found with that reference on your account');

    expect(prismaMock.supportTicket.create).not.toHaveBeenCalled();
  });

  it('refuses a booking that was already refunded', async () => {
    prismaMock.booking.findFirst.mockResolvedValue({
      ...paidBooking,
      payment: { status: 'REFUNDED' },
    });

    await expect(
      service.requestRefund('user-1', {
        bookingNumber: 'HH-1001',
        reason: 'Requesting a refund for this stay.',
      }),
    ).rejects.toThrow('already been refunded');

    expect(prismaMock.supportTicket.create).not.toHaveBeenCalled();
  });

  it('does not stack a second request while one is open', async () => {
    prismaMock.booking.findFirst.mockResolvedValue(paidBooking);
    prismaMock.supportTicket.findFirst.mockResolvedValue({
      id: 'ticket-existing',
      ticketNumber: 'SUP-ABC',
    });

    await expect(
      service.requestRefund('user-1', {
        bookingNumber: 'HH-1001',
        reason: 'Following up on my refund.',
      }),
    ).rejects.toThrow('already open (SUP-ABC)');

    expect(prismaMock.supportTicket.create).not.toHaveBeenCalled();
  });

  it('refuses a booking in a state that cannot be refunded', async () => {
    prismaMock.booking.findFirst.mockResolvedValue({
      ...paidBooking,
      status: 'REFUNDED',
    });

    await expect(
      service.requestRefund('user-1', {
        bookingNumber: 'HH-1001',
        reason: 'Requesting a refund for this stay.',
      }),
    ).rejects.toThrow('cannot be requested');
  });
});
