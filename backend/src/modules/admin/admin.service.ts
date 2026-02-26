import prisma from '../../config/database';
import { logger } from '../../utils/logger.util';
import { ERROR_CODES } from '../../constants/error-codes';
import { Prisma } from '@prisma/client';
import type { PlatformSettingsInput } from './admin-settings.schema';

export class AdminService {
  async getPlatformSettings() {
    const settings = await prisma.platformSetting.findFirst();

    if (!settings) {
      const created = await prisma.platformSetting.create({
        data: {
          platformName: 'HostHaven',
          commissionRate: new Prisma.Decimal(15),
          supportEmail: 'support@hosthaven.com',
          supportPhone: '+91 1800 123 4567',
          emailNotifications: true,
          pushNotifications: true,
          minPayoutAmount: new Prisma.Decimal(1000),
          payoutFrequency: 'WEEKLY',
          emailTemplates: [],
          featureFlags: [],
        },
      });

      return {
        ...created,
        commissionRate: created.commissionRate.toNumber(),
        minPayoutAmount: created.minPayoutAmount.toNumber(),
      };
    }

    return {
      ...settings,
      commissionRate: settings.commissionRate.toNumber(),
      minPayoutAmount: settings.minPayoutAmount.toNumber(),
    };
  }

  async updatePlatformSettings(data: PlatformSettingsInput) {
    const existing = await prisma.platformSetting.findFirst();

    const payload = {
      platformName: data.platformName,
      commissionRate: new Prisma.Decimal(data.commissionRate),
      supportEmail: data.supportEmail,
      supportPhone: data.supportPhone,
      emailNotifications: data.emailNotifications,
      pushNotifications: data.pushNotifications,
      minPayoutAmount: new Prisma.Decimal(data.minPayoutAmount),
      payoutFrequency: data.payoutFrequency,
      emailTemplates: data.emailTemplates ?? [],
      featureFlags: data.featureFlags ?? [],
    };

    const updated = existing
      ? await prisma.platformSetting.update({
          where: { id: existing.id },
          data: payload,
        })
      : await prisma.platformSetting.create({ data: payload });

    logger.info({ settingsId: updated.id }, 'Platform settings updated');

    return {
      ...updated,
      commissionRate: updated.commissionRate.toNumber(),
      minPayoutAmount: updated.minPayoutAmount.toNumber(),
    };
  }
  async getDashboard() {
    const [
      totalUsers,
      totalProperties,
      totalBookings,
      totalRevenue,
      recentBookings,
      recentVendors,
      pendingProperties,
      activeProperties,
      totalVendors,
      pendingVendors,
      totalServiceBookings,
      totalSupportTickets,
      openTickets,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.property.count(),
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
      prisma.property.count({ where: { status: 'ACTIVE' } }),
      prisma.vendor.count(),
      prisma.vendor.count({ where: { isApproved: false } }),
      prisma.serviceBooking.count(),
      prisma.supportTicket.count(),
      prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    ]);

    const newBookingsToday = await prisma.booking.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    return {
      stats: {
        totalUsers,
        totalProperties,
        activeProperties,
        totalBookings,
        totalRevenue: totalRevenue._sum.amount?.toNumber() || 0,
        pendingProperties,
        pendingVendors,
        totalVendors,
        totalServiceBookings,
        totalSupportTickets,
        openTickets,
        newBookingsToday,
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

  async createProperty(data: any) {
    const slug = data.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-') + '-' + Date.now()

    const property = await prisma.property.create({
      data: {
        name: data.name,
        slug,
        type: data.type || 'HOTEL',
        status: data.status || 'DRAFT',
        description: data.description,
        address: data.address,
        city: data.city || 'VIJAYAWADA',
        state: data.state || 'Andhra Pradesh',
        pincode: data.pincode,
        basePrice: new Prisma.Decimal(data.basePrice || 0),
        amenities: data.amenities || [],
        images: data.images || [],
        mapLocation: data.mapLocation || undefined,
      },
    });

    logger.info({ propertyId: property.id }, 'Property created by admin');

    return {
      id: property.id,
      name: property.name,
      slug: property.slug,
      status: property.status,
    };
  }

  async updateVendorStatus(vendorId: string, status: string, reason?: string) {
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });

    if (!vendor) {
      const error = new Error('Vendor not found');
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const updateData: any = {};
    if (status === 'APPROVED') {
      updateData.isApproved = true;
      updateData.approvedAt = new Date();
    } else if (status === 'REJECTED') {
      updateData.isApproved = false;
    }

    const updated = await prisma.vendor.update({
      where: { id: vendorId },
      data: updateData,
    });

    logger.info({ vendorId, status }, 'Vendor status updated');

    return {
      id: updated.id,
      isApproved: updated.isApproved,
      approvedAt: updated.approvedAt,
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

  async getAllVendors(filters: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (filters.status === 'PENDING') {
      where.isApproved = false;
    } else if (filters.status === 'APPROVED') {
      where.isApproved = true;
    }
    
    if (filters.search) {
      where.OR = [
        { businessName: { contains: filters.search, mode: 'insensitive' } },
        { user: { name: { contains: filters.search, mode: 'insensitive' } } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          properties: { select: { id: true, name: true, status: true } },
          _count: { select: { properties: true } },
        },
      }),
      prisma.vendor.count({ where }),
    ]);

    return {
      vendors: vendors.map((v: any) => ({
        id: v.id,
        businessName: v.businessName,
        email: v.user?.email,
        phone: v.phone,
        isApproved: v.isApproved,
        approvedAt: v.approvedAt,
        propertiesCount: v._count.properties,
        properties: v.properties,
        user: v.user,
        createdAt: v.createdAt,
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
          refundedAt: new Date(),
        },
      }),
      prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'REFUNDED',
          cancellationReason: reason,
          cancelledAt: new Date(),
        },
      }),
      prisma.refund.create({
        data: {
          paymentId: booking.payment.id,
          amount: new Prisma.Decimal(refundAmount),
          reason,
          status: 'processed',
        },
      }),
    ]);

    logger.info({ bookingId, refundAmount }, 'Booking refunded by admin');

    return {
      bookingId,
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

  async getAnalytics(range: '7d' | '30d' | '3m') {
    const daysMap = { '7d': 7, '30d': 30, '3m': 90 } as const;
    const days = daysMap[range] ?? 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalUsers, totalProperties, totalBookings, totalRevenue] = await Promise.all([
      prisma.user.count(),
      prisma.property.count({ where: { status: 'ACTIVE' } }),
      prisma.booking.count({ where: { createdAt: { gte: startDate } } }),
      prisma.payment.aggregate({
        where: { status: 'COMPLETED', createdAt: { gte: startDate } },
        _sum: { amount: true },
      }),
    ]);

    const months: { month: string; start: Date; end: Date }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      months.push({
        month: date.toLocaleString('en-US', { month: 'short' }),
        start: date,
        end,
      });
    }

    const bookingsByMonth = await Promise.all(
      months.map(async (month) => {
        const count = await prisma.booking.count({
          where: { createdAt: { gte: month.start, lte: month.end } },
        });
        return { month: month.month, count };
      })
    );

    const revenueByMonth = await Promise.all(
      months.map(async (month) => {
        const revenue = await prisma.payment.aggregate({
          where: { status: 'COMPLETED', createdAt: { gte: month.start, lte: month.end } },
          _sum: { amount: true },
        });
        return { month: month.month, amount: revenue._sum.amount?.toNumber() || 0 };
      })
    );

    const topPropertiesRaw = await prisma.property.findMany({
      where: { status: 'ACTIVE' },
      take: 5,
      orderBy: { bookingCount: 'desc' },
      select: {
        name: true,
        bookingCount: true,
        bookings: {
          select: {
            totalAmount: true,
          },
        },
      },
    });

    const topProperties = topPropertiesRaw.map((property) => ({
      name: property.name,
      bookings: property.bookingCount,
      revenue: property.bookings.reduce((sum, booking) => sum + booking.totalAmount.toNumber(), 0),
    }));

    const previousStart = new Date(startDate);
    previousStart.setDate(previousStart.getDate() - days);
    const previousEnd = new Date(startDate);

    const [prevUsers, prevProperties, prevBookings, prevRevenue] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: previousStart, lte: previousEnd } } }),
      prisma.property.count({ where: { createdAt: { gte: previousStart, lte: previousEnd } } }),
      prisma.booking.count({ where: { createdAt: { gte: previousStart, lte: previousEnd } } }),
      prisma.payment.aggregate({
        where: { status: 'COMPLETED', createdAt: { gte: previousStart, lte: previousEnd } },
        _sum: { amount: true },
      }),
    ]);

    const prevRevenueAmount = prevRevenue._sum.amount?.toNumber() || 0;

    const growth = (current: number, previous: number) => {
      if (previous === 0) return current === 0 ? 0 : 100;
      return Number((((current - previous) / previous) * 100).toFixed(1));
    };

    return {
      totalUsers,
      userGrowth: growth(totalUsers, prevUsers),
      totalProperties,
      propertyGrowth: growth(totalProperties, prevProperties),
      totalBookings,
      bookingGrowth: growth(totalBookings, prevBookings),
      totalRevenue: totalRevenue._sum.amount?.toNumber() || 0,
      revenueGrowth: growth(totalRevenue._sum.amount?.toNumber() || 0, prevRevenueAmount),
      bookingsByMonth,
      revenueByMonth,
      topProperties,
    };
  }
}

export const adminService = new AdminService();
export default adminService;
