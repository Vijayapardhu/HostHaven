import prisma from '../../config/database';
import { ERROR_CODES } from '../../constants/error-codes';
import { AuthUser } from '../../types';

export interface LiveRoomBooking {
  bookingId: string;
  bookingNumber: string;
  guestName: string;
  phone: string;
  status: string;
  checkIn: string;
  checkOut: string;
}

export interface LiveRoom {
  roomId: string;
  roomName: string;
  roomType: string;
  totalRooms: number;
  filledRooms: number;
  lockedRooms: number;
  availableRooms: number;
  bookings: LiveRoomBooking[];
}

export interface PropertyInventory {
  propertyId: string;
  propertyName: string;
  vendorName: string;
  city: string;
  rooms: LiveRoom[];
}

export class InventoryService {
  async getLiveInventorySnapshot(user: AuthUser): Promise<PropertyInventory[]> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const vendorFilter = user.role === 'VENDOR' && user.vendorId 
        ? { vendorId: user.vendorId }
        : {};

      const properties = await prisma.property.findMany({
        where: {
          ...vendorFilter,
          status: 'ACTIVE',
          isDeleted: false,
        },
        include: {
          vendor: {
            select: {
              businessName: true,
            },
          },
          rooms: {
            where: { isActive: true, isDeleted: false },
            include: {
              bookings: {
                where: {
                  status: { in: ['CONFIRMED', 'CHECKED_IN'] },
                  checkInDate: { lte: endOfDay },
                  checkOutDate: { gte: today },
                },
                select: {
                  id: true,
                  bookingNumber: true,
                  guestDetails: true,
                  guestPhone: true,
                  status: true,
                  checkInDate: true,
                  checkOutDate: true,
                },
              },
              inventoryLocks: {
                where: {
                  lockUntil: { gte: new Date() },
                },
                select: {
                  quantity: true,
                },
              },
            },
          },
        },
      });

      return properties.map((property) => {
        const rooms: LiveRoom[] = property.rooms.map((room) => {
          const filledRooms = room.bookings.length;
          const lockedRooms = room.inventoryLocks.reduce((sum, lock) => sum + lock.quantity, 0);
          const availableRooms = Math.max(room.totalRooms - filledRooms - lockedRooms, 0);

          const bookings: LiveRoomBooking[] = room.bookings.map((booking) => {
            const guestDetails = booking.guestDetails as any;
            const guestName = guestDetails?.[0]?.name || 'Guest';
            
            return {
              bookingId: booking.id,
              bookingNumber: booking.bookingNumber,
              guestName,
              phone: booking.guestPhone || '',
              status: booking.status,
              checkIn: booking.checkInDate.toISOString(),
              checkOut: booking.checkOutDate.toISOString(),
            };
          });

          return {
            roomId: room.id,
            roomName: room.name,
            roomType: room.type,
            totalRooms: room.totalRooms,
            filledRooms,
            lockedRooms,
            availableRooms,
            bookings,
          };
        });

        return {
          propertyId: property.id,
          propertyName: property.name,
          vendorName: property.vendor?.businessName || 'Unknown',
          city: property.city,
          rooms,
        };
      });
    } catch (error) {
      console.error('Error getting live inventory snapshot:', error);
      throw error;
    }
  }

  async getAvailability(roomId: string, date: Date) {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      const error = new Error('Room not found');
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const activeLocks = await prisma.inventoryLock.aggregate({
      where: {
        roomId,
        lockUntil: { gte: new Date() },
      },
      _sum: { quantity: true },
    });

    const bookings = await prisma.booking.aggregate({
      where: {
        roomId,
        status: { in: ['CONFIRMED', 'PENDING', 'CHECKED_IN'] },
        OR: [
          {
            checkInDate: { lte: endOfDay },
            checkOutDate: { gte: startOfDay },
          },
        ],
      },
      _count: { id: true },
    });

    const lockedRooms = activeLocks._sum.quantity || 0;
    const bookedRooms = bookings._count.id || 0;
    const available = Math.max(room.totalRooms - lockedRooms - bookedRooms, 0);

    return {
      roomId,
      totalRooms: room.totalRooms,
      lockedRooms,
      bookedRooms,
      availableRooms: available,
    };
  }

  async lockInventory(
    roomId: string,
    userId: string | undefined,
    quantity: number,
    checkIn: Date,
    checkOut: Date
  ) {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      const error = new Error('Room not found');
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const lockUntil = new Date(Date.now() + 10 * 60 * 1000);

    const lock = await prisma.$transaction(async (tx) => {
      const activeLocks = await tx.inventoryLock.aggregate({
        where: {
          roomId,
          lockUntil: { gte: new Date() },
          OR: [
            {
              checkInDate: { lt: checkOut },
              checkOutDate: { gt: checkIn },
            },
          ],
        },
        _sum: { quantity: true },
      });

      const lockedRooms = activeLocks._sum.quantity || 0;
      if (lockedRooms + quantity > room.totalRooms) {
        const error = new Error('Room not available');
        (error as any).code = ERROR_CODES.ROOM_NOT_AVAILABLE;
        throw error;
      }

      return tx.inventoryLock.create({
        data: {
          roomId,
          userId,
          quantity,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          lockUntil,
        },
      });
    });

    return {
      id: lock.id,
      roomId: lock.roomId,
      quantity: lock.quantity,
      lockUntil: lock.lockUntil,
    };
  }

  async releaseLock(roomId: string, userId?: string) {
    const where: any = { roomId };
    if (userId) {
      where.userId = userId;
    }

    await prisma.inventoryLock.deleteMany({
      where,
    });

    return { message: 'Inventory lock released' };
  }
}

export const inventoryService = new InventoryService();
export default inventoryService;
