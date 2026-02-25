import { FastifyInstance } from 'fastify';
import { AdminController } from './admin.controller';
import { requireRole } from '../../middleware/auth.middleware';
import { NotificationsController } from '../notifications/notifications.controller';

export default async function adminRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);
  fastify.addHook('preHandler', requireRole('ADMIN'));

  fastify.get('/dashboard', AdminController.getDashboard);
  fastify.get('/stats', AdminController.getSystemStats);
  fastify.get('/analytics', AdminController.getAnalytics);
  fastify.get('/settings', AdminController.getSettings);
  fastify.put('/settings', AdminController.updateSettings);

  fastify.get('/users', AdminController.getAllUsers);
  fastify.put('/users/:id/status', AdminController.updateUserStatus);

  fastify.get('/properties', AdminController.getAllProperties);
  fastify.put('/properties/:id/status', AdminController.updatePropertyStatus);

  fastify.get('/bookings', AdminController.getAllBookings);
  fastify.put('/bookings/:id/refund', AdminController.refundBooking);

  fastify.get('/payouts', AdminController.getAllPayouts);
  fastify.post('/payouts/process', AdminController.processPayout);
  fastify.put('/payouts/:id/mark-paid', AdminController.markPayoutPaid);

  fastify.put('/rooms/:id/inventory', AdminController.overrideInventory);

  fastify.get('/notifications', NotificationsController.getUserNotifications);
  fastify.put('/notifications/:id/read', NotificationsController.markAsRead);
  fastify.put('/notifications/read-all', NotificationsController.markAllAsRead);
}
