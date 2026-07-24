import prismaMock from '../../test/prismaMock';
import { InventoryService } from './inventory.service';
import { parseStayDate } from '../../utils/date.util';

jest.mock('../../utils/logger.util', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const service = new InventoryService();

const checkIn = parseStayDate('2026-08-01');
const checkOut = parseStayDate('2026-08-03');

/** Runs the transaction callback against the mock client. */
const runTransaction = () => {
  (prismaMock.$transaction as jest.Mock).mockImplementation(
    async (fn: any) => fn(prismaMock),
  );
};

describe('InventoryService.lockInventory', () => {
  beforeEach(() => {
    prismaMock.room.findUnique.mockReset();
    prismaMock.booking.count.mockReset();
    prismaMock.inventoryLock.aggregate.mockReset();
    prismaMock.inventoryLock.create.mockReset();
    runTransaction();
  });

  it('counts existing bookings as occupied, not just other locks', async () => {
    prismaMock.room.findUnique.mockResolvedValue({ id: 'room-1', totalRooms: 2 });
    prismaMock.inventoryLock.aggregate.mockResolvedValue({
      _sum: { quantity: 0 },
    });
    // Both rooms are already booked for these dates.
    prismaMock.booking.count.mockResolvedValue(2);

    await expect(
      service.lockInventory('room-1', 'user-1', 1, checkIn, checkOut),
    ).rejects.toThrow('Room not available');

    expect(prismaMock.inventoryLock.create).not.toHaveBeenCalled();
  });

  it('allows a lock when capacity remains after locks and bookings', async () => {
    prismaMock.room.findUnique.mockResolvedValue({ id: 'room-1', totalRooms: 3 });
    prismaMock.inventoryLock.aggregate.mockResolvedValue({
      _sum: { quantity: 1 },
    });
    prismaMock.booking.count.mockResolvedValue(1);
    prismaMock.inventoryLock.create.mockResolvedValue({
      id: 'lock-1',
      roomId: 'room-1',
      quantity: 1,
      lockUntil: new Date(),
    });

    const lock = await service.lockInventory(
      'room-1',
      'user-1',
      1,
      checkIn,
      checkOut,
    );

    expect(lock.id).toBe('lock-1');
  });

  it('rejects the lock that would exceed capacity', async () => {
    prismaMock.room.findUnique.mockResolvedValue({ id: 'room-1', totalRooms: 3 });
    prismaMock.inventoryLock.aggregate.mockResolvedValue({
      _sum: { quantity: 1 },
    });
    prismaMock.booking.count.mockResolvedValue(1);

    // 1 locked + 1 booked + 2 requested = 4 > 3
    await expect(
      service.lockInventory('room-1', 'user-1', 2, checkIn, checkOut),
    ).rejects.toThrow('Room not available');
  });
});

describe('InventoryService.releaseLock', () => {
  beforeEach(() => {
    prismaMock.inventoryLock.deleteMany.mockReset();
    prismaMock.inventoryLock.deleteMany.mockResolvedValue({ count: 1 });
  });

  it('scopes the release to the given stay dates', async () => {
    await service.releaseLock('room-1', 'user-1', checkIn, checkOut);

    expect(prismaMock.inventoryLock.deleteMany).toHaveBeenCalledWith({
      where: {
        roomId: 'room-1',
        userId: 'user-1',
        checkInDate: { lt: checkOut },
        checkOutDate: { gt: checkIn },
      },
    });
  });

  it('falls back to releasing the caller’s locks when no dates are given', async () => {
    await service.releaseLock('room-1', 'user-1');

    expect(prismaMock.inventoryLock.deleteMany).toHaveBeenCalledWith({
      where: { roomId: 'room-1', userId: 'user-1' },
    });
  });
});
