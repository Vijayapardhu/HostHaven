import prisma from '../../config/database';
import { hashPassword, generateToken } from '../../utils/hash.util';
import { logger } from '../../utils/logger.util';
import { ERROR_CODES } from '../../constants/error-codes';
import { Prisma } from '@prisma/client';
import notificationsService from '../notifications/notifications.service';
import { webPushService } from '../../services/webpush.service';

export class VendorService {
  async register(data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    businessName: string;
    businessAddress?: string;
    gstNumber?: string;
    panNumber?: string;
    aadhaarNumber?: string;
    bankAccount?: any;
  }) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      const error = new Error('Email already registered');
      (error as any).code = ERROR_CODES.RESOURCE_CONFLICT;
      throw error;
    }

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: await hashPassword(data.password),
        name: data.name,
        phone: data.phone,
        role: 'VENDOR',
      },
    });

    const vendor = await prisma.vendor.create({
      data: {
        userId: user.id,
        businessName: data.businessName,
        businessAddress: data.businessAddress,
        gstNumber: data.gstNumber,
        panNumber: data.panNumber,
        aadhaarNumber: data.aadhaarNumber,
        bankAccount: data.bankAccount,
        isApproved: false,
      },
    });

    const accessToken = generateToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = generateToken({ id: user.id }, 'refresh');

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    logger.info({ vendorId: vendor.id, userId: user.id }, 'Vendor registered');

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      vendor: {
        id: vendor.id,
        businessName: vendor.businessName,
        isApproved: vendor.isApproved,
      },
      accessToken,
      refreshToken,
    };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { vendor: true },
    });

    if (!user || !user.passwordHash) {
      const error = new Error('Invalid credentials');
      (error as any).code = ERROR_CODES.UNAUTHORIZED;
      throw error;
    }

    const isValid = await Bun.password.verify(password, user.passwordHash);
    if (!isValid) {
      const error = new Error('Invalid credentials');
      (error as any).code = ERROR_CODES.UNAUTHORIZED;
      throw error;
    }

    if (user.role !== 'VENDOR') {
      const error = new Error('Not authorized as vendor');
      (error as any).code = ERROR_CODES.FORBIDDEN;
      throw error;
    }

    const accessToken = generateToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = generateToken({ id: user.id }, 'refresh');

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    logger.info({ userId: user.id }, 'Vendor logged in');

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      vendor: user.vendor ? {
        id: user.vendor.id,
        businessName: user.vendor.businessName,
        isApproved: user.vendor.isApproved,
      } : null,
      accessToken,
      refreshToken,
    };
  }

  async getDashboard(vendorId: string) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        user: {
          select: { name: true, email: true, phone: true, avatarUrl: true },
        },
      },
    });

    if (!vendor) {
      const error = new Error('Vendor not found');
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const [
      propertiesCount,
      activeBookings,
      totalRevenue,
      recentBookings,
      pendingPayouts,
    ] = await Promise.all([
      prisma.property.count({ where: { vendorId } }),
      prisma.booking.count({
        where: {
          property: { vendorId },
          status: { in: ['CONFIRMED', 'CHECKED_IN'] },
        },
      }),
      prisma.booking.aggregate({
        where: {
          property: { vendorId },
          status: { in: ['CHECKED_OUT'] },
          payment: { status: 'COMPLETED' },
        },
        _sum: { totalAmount: true },
      }),
      prisma.booking.findMany({
        where: { property: { vendorId } },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          property: { select: { name: true } },
          room: { select: { name: true } },
        },
      }),
      prisma.payout.findMany({
        where: { vendorId, status: 'pending' },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      vendor: {
        id: vendor.id,
        businessName: vendor.businessName,
        isApproved: vendor.isApproved,
        commissionRate: vendor.commissionRate.toNumber(),
        user: vendor.user,
      },
      stats: {
        propertiesCount,
        activeBookings,
        totalRevenue: totalRevenue._sum.totalAmount?.toNumber() || 0,
        pendingPayouts: pendingPayouts.length,
      },
      recentBookings: recentBookings.map((b: any) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        user: b.user,
        property: b.property,
        room: b.room,
        checkInDate: b.checkInDate,
        checkOutDate: b.checkOutDate,
        totalAmount: b.totalAmount.toNumber(),
        status: b.status,
        createdAt: b.createdAt,
      })),
    };
  }

  async getVendorProfile(vendorId: string) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!vendor) {
      const error = new Error('Vendor not found');
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    return {
      id: vendor.id,
      businessName: vendor.businessName,
      businessAddress: vendor.businessAddress,
      gstNumber: vendor.gstNumber,
      panNumber: vendor.panNumber,
      aadhaarNumber: vendor.aadhaarNumber,
      bankAccount: vendor.bankAccount,
      isApproved: vendor.isApproved,
      approvedAt: vendor.approvedAt,
      commissionRate: vendor.commissionRate.toNumber(),
      user: vendor.user,
      createdAt: vendor.createdAt,
    };
  }

  async updateVendor(vendorId: string, data: {
    businessName?: string;
    businessAddress?: string;
    gstNumber?: string;
    panNumber?: string;
    aadhaarNumber?: string;
    bankAccount?: any;
  }) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      const error = new Error('Vendor not found');
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const updated = await prisma.vendor.update({
      where: { id: vendorId },
      data,
    });

    logger.info({ vendorId }, 'Vendor profile updated');

    return {
      id: updated.id,
      businessName: updated.businessName,
      businessAddress: updated.businessAddress,
      gstNumber: updated.gstNumber,
      panNumber: updated.panNumber,
      aadhaarNumber: updated.aadhaarNumber,
      bankAccount: updated.bankAccount,
    };
  }

  async getAllVendors(filters: {
    page?: number;
    limit?: number;
    isApproved?: boolean;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.isApproved !== undefined) {
      where.isApproved = filters.isApproved;
    }

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true, avatarUrl: true },
          },
          _count: { select: { properties: true } },
        },
      }),
      prisma.vendor.count({ where }),
    ]);

    return {
      vendors: vendors.map((v: any) => ({
        id: v.id,
        businessName: v.businessName,
        businessAddress: v.businessAddress,
        gstNumber: v.gstNumber,
        isApproved: v.isApproved,
        approvedAt: v.approvedAt,
        commissionRate: v.commissionRate.toNumber(),
        propertiesCount: v._count.properties,
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

  async approveVendor(vendorId: string, adminId: string) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: { user: true },
    });

    if (!vendor) {
      const error = new Error('Vendor not found');
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const updated = await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        isApproved: true,
        approvedBy: adminId,
        approvedAt: new Date(),
      },
    });

    logger.info({ vendorId, adminId }, 'Vendor approved');

    await notificationsService.create({
      userId: vendor.userId,
      type: 'VENDOR_APPROVED',
      title: 'Vendor Account Approved',
      message: `Your vendor account "${vendor.businessName}" has been approved. You can now list your properties.`,
      data: { vendorId: vendor.id },
    });

    await webPushService.sendNotification(vendor.userId, {
      title: 'Vendor Account Approved',
      body: `Your vendor account "${vendor.businessName}" has been approved. You can now list your properties.`,
      tag: 'vendor-approved',
      data: { vendorId: vendor.id },
    });

    return {
      id: updated.id,
      isApproved: updated.isApproved,
      approvedAt: updated.approvedAt,
    };
  }
}

export const vendorService = new VendorService();
export default vendorService;
