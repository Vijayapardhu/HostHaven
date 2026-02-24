import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { config } from '../config';
import { logger } from '../utils/logger.util';

const connection = new Redis(config.redis.url, {
  maxRetriesPerRequest: null,
});

export const emailQueue = new Queue('email-queue', { connection });

export const queueService = {
  async addBookingConfirmedJob(data: {
    userEmail: string;
    userName: string;
    propertyName: string;
    checkIn: Date;
    checkOut: Date;
    bookingNumber: string;
    totalAmount: number;
  }) {
    await emailQueue.add('booking-confirmed', {
      type: 'booking-confirmed',
      ...data,
    });
    logger.info({ bookingNumber: data.bookingNumber }, 'Added booking confirmation job to queue');
  },

  async addBookingCancelledJob(data: {
    userEmail: string;
    userName: string;
    propertyName: string;
    bookingNumber: string;
    refundAmount?: number;
  }) {
    await emailQueue.add('booking-cancelled', {
      type: 'booking-cancelled',
      ...data,
    });
    logger.info({ bookingNumber: data.bookingNumber }, 'Added booking cancellation job to queue');
  },

  async addPaymentReminderJob(data: {
    userEmail: string;
    userName: string;
    propertyName: string;
    bookingNumber: string;
    amount: number;
    dueDate: Date;
  }) {
    await emailQueue.add('payment-reminder', {
      type: 'payment-reminder',
      ...data,
    });
    logger.info({ bookingNumber: data.bookingNumber }, 'Added payment reminder job to queue');
  },

  async addReviewRequestJob(data: {
    userEmail: string;
    userName: string;
    propertyName: string;
    bookingNumber: string;
  }) {
    await emailQueue.add('review-request', {
      type: 'review-request',
      ...data,
    });
    logger.info({ bookingNumber: data.bookingNumber }, 'Added review request job to queue');
  },
};

export default queueService;
