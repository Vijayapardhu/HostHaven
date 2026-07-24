import prisma from '../../config/database';
import { ERROR_CODES } from '../../constants/error-codes';
import { logger } from '../../utils/logger.util';
import { AppError } from '../../utils/app-error';
import { webPushService } from '../../services/webpush.service';
import notificationsService from '../notifications/notifications.service';

const generateTicketNumber = () => `SUP-${Date.now().toString(36).toUpperCase()}`;

/**
 * Refund requests are raised as support tickets under this category rather than
 * being self-service: an agent reviews the booking and applies the cancellation
 * policy before any money moves.
 */
export const REFUND_CATEGORY = 'Refund';

/** Booking states a guest may request a refund against. */
const REFUNDABLE_BOOKING_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'CHECKED_IN',
  'CHECKED_OUT',
  'CANCELLED',
] as const;

export class SupportService {
  async create(userId: string | undefined, data: {
    category: string;
    bookingReference?: string;
    message: string;
    attachmentUrl?: string;
  }) {
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: userId || null, // Allow null for unauthenticated users
        ticketNumber: generateTicketNumber(),
        category: data.category,
        bookingReference: data.bookingReference,
        message: data.message,
        attachmentUrl: data.attachmentUrl,
        status: 'OPEN',
      },
    });
    logger.info({ supportTicketId: ticket.id }, 'Support ticket created');
    return ticket;
  }

  /**
   * Raises a refund request against one of the caller's own bookings.
   *
   * The booking is resolved by its human-readable booking number and must
   * belong to the caller, so a guest cannot open a refund case on someone
   * else's stay. Duplicate open requests are rejected rather than stacked.
   */
  async requestRefund(
    userId: string,
    data: { bookingNumber: string; reason: string },
  ) {
    const booking = await prisma.booking.findFirst({
      where: { bookingNumber: data.bookingNumber, userId },
      select: {
        id: true,
        bookingNumber: true,
        status: true,
        totalAmount: true,
        payment: { select: { status: true } },
      },
    });

    if (!booking) {
      throw AppError.notFound(
        'No booking found with that reference on your account',
      );
    }

    if (
      !(REFUNDABLE_BOOKING_STATUSES as readonly string[]).includes(
        booking.status,
      )
    ) {
      throw AppError.validation(
        `A refund cannot be requested for a booking that is ${booking.status.toLowerCase()}`,
      );
    }

    if (booking.payment?.status === 'REFUNDED') {
      throw AppError.validation('This booking has already been refunded');
    }

    const existing = await prisma.supportTicket.findFirst({
      where: {
        userId,
        category: REFUND_CATEGORY,
        bookingReference: booking.bookingNumber,
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        isDeleted: false,
      },
      select: { id: true, ticketNumber: true },
    });

    if (existing) {
      throw AppError.validation(
        `A refund request for this booking is already open (${existing.ticketNumber})`,
      );
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        ticketNumber: generateTicketNumber(),
        category: REFUND_CATEGORY,
        bookingReference: booking.bookingNumber,
        message: data.reason,
        status: 'OPEN',
      },
    });

    logger.info(
      { supportTicketId: ticket.id, bookingId: booking.id },
      'Refund requested via support',
    );

    return ticket;
  }

  async notifyAdmins(ticket: any) {
    try {
      // Get all admin users
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN', isActive: true },
        select: { id: true, name: true },
      });

      const title = 'New Support Ticket';
      const message = `Ticket #${ticket.ticketNumber}: ${ticket.category}`;
      
      // Send web push to all admins
      for (const admin of admins) {
        await notificationsService.create({
          userId: admin.id,
          type: 'SUPPORT_TICKET_CREATED',
          title,
          message,
          data: {
            ticketId: ticket.id,
            ticketNumber: ticket.ticketNumber,
            category: ticket.category,
          },
        });

        await webPushService.sendNotification(admin.id, {
          title,
          body: message,
          tag: `support-ticket-${ticket.id}`,
          data: {
            ticketId: ticket.id,
            ticketNumber: ticket.ticketNumber,
          },
        });
      }

      logger.info({ ticketId: ticket.id, adminCount: admins.length }, 'Admin notifications sent');
    } catch (error) {
      logger.error({ error, ticketId: ticket.id }, 'Failed to send admin notifications');
    }
  }

  async getMyTickets(userId: string, filters: { page: number; limit: number; status?: string }) {
    const skip = (filters.page - 1) * filters.limit;
    const where: any = { userId, isDeleted: false };
    if (filters.status) where.status = filters.status;

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where, skip, take: filters.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.supportTicket.count({ where }),
    ]);

    return {
      tickets,
      meta: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) },
    };
  }

  async getAllTickets(filters: {
    page: number;
    limit: number;
    status?: string;
    category?: string;
    search?: string;
  }) {
    const skip = (filters.page - 1) * filters.limit;
    const where: any = { isDeleted: false };
    if (filters.status) where.status = filters.status;
    if (filters.category) {
      where.category = { equals: filters.category, mode: 'insensitive' };
    }

    // Matched server-side so paging and totals stay consistent — previously
    // the admin UI filtered one already-paginated page client-side.
    if (filters.search) {
      const search = filters.search.trim();
      where.OR = [
        { ticketNumber: { contains: search, mode: 'insensitive' } },
        { bookingReference: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
        { user: { is: { name: { contains: search, mode: 'insensitive' } } } },
        { user: { is: { email: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where, skip, take: filters.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      }),
      prisma.supportTicket.count({ where }),
    ]);

    return {
      tickets,
      meta: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) },
    };
  }

  async getTicketById(id: string) {
    const ticket = await prisma.supportTicket.findFirst({
      where: { id, isDeleted: false },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
    if (!ticket) {
      const error = new Error('Support ticket not found');
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }
    return ticket;
  }

  async getMyTicketById(userId: string, ticketId: string) {
    const ticket = await prisma.supportTicket.findFirst({
      where: { id: ticketId, userId, isDeleted: false },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
    if (!ticket) {
      const error = new Error('Support ticket not found');
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }
    return ticket;
  }

  async updateTicket(id: string, data: { status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'; adminNotes?: string }) {
    const existing = await prisma.supportTicket.findFirst({ where: { id, isDeleted: false } });
    if (!existing) {
      const error = new Error('Support ticket not found');
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const updateData: any = {};
    if (data.status) {
      updateData.status = data.status;
      updateData.resolvedAt = data.status === 'RESOLVED' ? new Date() : null;
    }
    if (data.adminNotes !== undefined) {
      // Append note with timestamp to existing notes
      const timestamp = new Date().toISOString();
      const newEntry = `[${timestamp}] ${data.adminNotes}`;
      updateData.adminNotes = existing.adminNotes
        ? `${existing.adminNotes}\n---\n${newEntry}`
        : newEntry;
    }

    const ticket = await prisma.supportTicket.update({ where: { id }, data: updateData });
    logger.info({ supportTicketId: id, status: data.status }, 'Support ticket updated');
    return ticket;
  }

  async addNote(id: string, content: string, addedBy: string) {
    const existing = await prisma.supportTicket.findFirst({ where: { id, isDeleted: false } });
    if (!existing) {
      const error = new Error('Support ticket not found');
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const timestamp = new Date().toISOString();
    const newEntry = `[${timestamp}] (${addedBy}) ${content}`;
    const adminNotes = existing.adminNotes
      ? `${existing.adminNotes}\n---\n${newEntry}`
      : newEntry;

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: { adminNotes },
    });
    logger.info({ supportTicketId: id }, 'Note added to support ticket');
    return ticket;
  }

  async reopenTicket(id: string) {
    const existing = await prisma.supportTicket.findFirst({ where: { id, isDeleted: false } });
    if (!existing) {
      const error = new Error('Support ticket not found');
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }
    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: { status: 'OPEN', resolvedAt: null },
    });
    logger.info({ supportTicketId: id }, 'Support ticket reopened');
    return ticket;
  }
}

export const supportService = new SupportService();
export default supportService;
