import { FastifyInstance } from 'fastify';
import { VendorController, AdminVendorController } from './vendor.controller';
import { requireRole } from '../../middleware/auth.middleware';
import { PropertiesController } from '../properties/properties.controller';
import { NotificationsController } from '../notifications/notifications.controller';
import pushRoutes from '../push/push.routes';

export default async function vendorRoutes(fastify: FastifyInstance) {
  await fastify.register(pushRoutes);

  fastify.post('/register', VendorController.register);
  fastify.post('/login', VendorController.login);

  fastify.get(
    '/dashboard',
    { preHandler: [fastify.authenticate, requireRole('VENDOR')] },
    VendorController.getDashboard
  );

  fastify.get(
    '/profile',
    { preHandler: [fastify.authenticate, requireRole('VENDOR')] },
    VendorController.getProfile
  );

  fastify.put(
    '/profile',
    { preHandler: [fastify.authenticate, requireRole('VENDOR')] },
    VendorController.updateProfile
  );

  fastify.get(
    '/properties',
    { preHandler: [fastify.authenticate, requireRole('VENDOR')] },
    PropertiesController.getVendorProperties
  );

  fastify.get(
    '/notifications',
    { preHandler: [fastify.authenticate, requireRole('VENDOR')] },
    NotificationsController.getUserNotifications
  );

  fastify.put(
    '/notifications/:id/read',
    { preHandler: [fastify.authenticate, requireRole('VENDOR')] },
    NotificationsController.markAsRead
  );

  fastify.put(
    '/notifications/read-all',
    { preHandler: [fastify.authenticate, requireRole('VENDOR')] },
    NotificationsController.markAllAsRead
  );

  fastify.get(
    '/',
    { preHandler: [fastify.authenticate, requireRole('ADMIN')] },
    AdminVendorController.getAllVendors
  );

  fastify.post(
    '/admin/onboarding',
    { preHandler: [fastify.authenticate, requireRole('ADMIN')] },
    AdminVendorController.createOnboardingVendor
  );

  fastify.put(
    '/:id/approve',
    { preHandler: [fastify.authenticate, requireRole('ADMIN')] },
    AdminVendorController.approveVendor
  );
}
