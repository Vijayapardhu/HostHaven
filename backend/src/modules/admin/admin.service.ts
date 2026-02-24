import prisma from '../../config/database';
import { logger } from '../../utils/logger.util';
import { ERROR_CODES } from '../../constants/error-codes';
import { Prisma } from '@prisma/client';

export class AdminService {
  async getDashboard() {
    const [
      totalUsers,
      totalProperties,
      totalBookings,
      totalRevenue,
      recentBookings,
      recentVendors,
      pendingProperties,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.property.count({ where: { status: 'ACTIVE' } }),
      prisma.booking.count(),
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          property: { select: { name: true, type: true } },
        },
      }),
      prisma.vendor.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.property.count({ where: { status: 'PENDING' } }),
    ]);

    const pendingVendors = await prisma.vendor.count({ where: { isApproved: false } });

    return {
      stats: {
        totalUsers,
        totalProperties,
        totalBookings,
        totalRevenue: totalRevenue._sum.amount?.toNumber() || 0,
        pendingProperties,
        pendingVendors,
      },
      recentBookings: recentBookings.map((b: any) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        user: b.user,
        property: b.property,
        totalAmount: b.totalAmount.toNumber(),
        status: b.status,
        createdAt: b.createdAt,
      })),
      recentVendors: recentVendors.map((v: any) => ({
        id: v.id,
        businessName: v.businessName,
        user: v.user,
        isApproved: v.isApproved,
        createdAt: v.createdAt,
      })),
    };
  }

  async getSystemStats(startDate?: Date, endDate?: Date) {
    const where: any = {};
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [users, properties, bookings, revenue] = await Promise.all([
      prisma.user.count({ where }),
      prisma.property.count({ where }),
      prisma.booking.count({ where }),
      prisma.payment.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _sum: { amount: true },
      }),
    ]);

    const bookingStats = await prisma.booking.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    });

    const propertyTypes = await prisma.property.groupBy({
      by: ['type'],
      where: { status: 'ACTIVE' },
      _count: { id: true },
    });

    return {
      users,
      properties,
      bookings,
      revenue: revenue._sum.amount?.toNumber() || 0,
      byStatus: bookingStats.reduce((acc: any, s: any) => {
        acc[s.status] = s._count.id;
        return acc;
      }, {}),
      byPropertyType: propertyTypes.reduce((acc: any, p: any) => {
        acc[p.type] = p._count.id;
        return acc;
      }, {}),
    };
  }

  async getAllUsers(filters: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateUserStatus(userId: string, isActive: boolean) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      const error = new Error('User not found');
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });

    logger.info({ userId, isActive }, 'User status updated');

    return {
      id: updated.id,
      isActive: updated.isActive,
    };
  }

  async getAllProperties(filters: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    search?: string;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { city: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          vendor: {
            select: {
              id: true,
              businessName: true,
            },
          },
          _count: { select: { bookings: true, reviews: true } },
        },
      }),
      prisma.property.count({ where }),
    ]);

    return {
      properties: properties.map((p: any) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        status: p.status,
        city: p.state,
        basePrice: p.basePrice.toNumber(),
        rating: p.rating.toNumber(),
        reviewCount: p.reviewCount,
        bookingsCount: p._count.bookings,
        vendor: p.vendor,
        createdAt: p.createdAt,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updatePropertyStatus(propertyId: string, status: string, reason?: string) {
    const property = await prisma.property.findUnique({ where: { id: propertyId } });

    if (!property) {
      const error = new Error('Property not found');
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const updated = await prisma.property.update({
      where: { id: propertyId },
      data: { status: status as any },
    });

    logger.info({ propertyId, status }, 'Property status updated');

    return {
      id: updated.id,
      status: updated.status,
    };
  }

  async getAllBookings(filters: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.checkInDate = {};
      if (filters.startDate) where.checkInDate.gte = filters.startDate;
      if (filters.endDate) where.checkInDate.lte = filters.endDate;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          property: { select: { id: true, name: true, type: true, city: true } },
          room: { select: { id: true, name: true } },
          payment: { select: { status: true, amount: true } },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    return {
      bookings: bookings.map((b: any) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        user: b.user,
        property: b.property,
        room: b.room,
        checkInDate: b.checkInDate,
        checkOutDate: b.checkOutDate,
        totalAmount: b.totalAmount.toNumber(),
        status: b.status,
        paymentStatus: b.payment?.status,
        createdAt: b.createdAt,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAllPayouts(filters: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.status) where.status = filters.status;

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          vendor: {
            select: {
              id: true,
              businessName: true,
              user: { select: { name: true, email: true } },
            },
          },
        },
      }),
      prisma.payout.count({ where }),
    ]);

    return {
      payouts: payouts.map((p: any) => ({
        id: p.id,
        vendor: p.vendor,
        amount: p.amount.toNumber(),
        status: p.status,
        periodStart: p.periodStart,
        periodEnd: p.periodEnd,
        processedAt: p.processedAt,
        transactionId: p.transactionId,
        createdAt: p.createdAt,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async processPayout(payoutId: string, action: 'approve' | 'reject', notes?: string) {
    const payout = await prisma.payout.findUnique({ where: { id: payoutId } });

    if (!payout) {
      const error = new Error('Payout not found');
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    if (action === 'approve') {
      await prisma.payout.update({
        where: { id: payoutId },
        data: {
          status: 'completed',
          processedAt: new Date(),
          transactionId: `TXN-${Date.now()}`,
        },
      });
    } else {
      await prisma.payout.update({
        where: { id: payoutId },
        data: { status: 'rejected' },
      });
    }

    logger.info({ payoutId, action }, 'Payout processed');

    return { message: `Payout ${action}d successfully` };
  }

  async refundBooking(bookingId: string, amount?: number, reason?: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });

    if (!booking) {
      const error = new Error('Booking not found');
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    if (!booking.payment) {
      const error = new Error('Payment record not found for booking');
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const refundAmount = amount ?? booking.payment.amount.toNumber();

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: booking.payment.id },
        data: {
          status: 'REFUNDED',
          refundAmount: new Prisma.Decimal(refundAmount),
          refundedAt: new Date(),
        },
      }),
      prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'REFUNDED',
          refundAmount: new Prisma.Decimal(refundAmount),
          cancellationReason: reason,
          cancelledAt: new Date(),
        },
      }),
    ]);

    logger.info({ bookingId, refundAmount }, 'Booking refunded by admin');

    return {
      bookingId,
      refundAmount,
      message: 'Refund marked successfully',
    };
  }

  async markPayoutPaid(payoutId: string, transactionId: string, notes?: string) {
    const payout = await prisma.payout.findUnique({ where: { id: payoutId } });

    if (!payout) {
      const error = new Error('Payout not found');
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const updated = await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'paid',
        processedAt: new Date(),
        transactionId,
      },
    });

    logger.info({ payoutId, transactionId, notes }, 'Payout marked as paid by admin');

    return {
      id: updated.id,
      status: updated.status,
      transactionId: updated.transactionId,
      processedAt: updated.processedAt,
    };
  }

  async overrideRoomInventory(roomId: string, availableRooms: number) {
    const room = await prisma.room.findUnique({ where: { id: roomId } });

    if (!room) {
      const error = new Error('Room not found');
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const nextAvailable = Math.min(availableRooms, room.totalRooms);

    const updated = await prisma.room.update({
      where: { id: roomId },
      data: { availableRooms: nextAvailable },
    });

    logger.info({ roomId, availableRooms: nextAvailable }, 'Room inventory overridden by admin');

    return {
      id: updated.id,
      totalRooms: updated.totalRooms,
      availableRooms: updated.availableRooms,
      message: 'Inventory updated',
    };
  }
}

export const adminService = new AdminService();
export default adminService;
