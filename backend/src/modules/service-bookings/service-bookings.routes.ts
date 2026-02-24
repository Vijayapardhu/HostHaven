import { FastifyInstance } from 'fastify';
import { requireRole } from '../../middleware/auth.middleware';
import { ServiceBookingsController } from './service-bookings.controller';

export default async function serviceBookingsRoutes(fastify: FastifyInstance) {
  const auth = (fastify as any).authenticate;
  fastify.addHook('preHandler', auth);

  fastify.post('/bookings', ServiceBookingsController.create);
  fastify.get('/bookings/my', ServiceBookingsController.getMyBookings);

  fastify.get('/bookings/admin', { preHandler: [requireRole('ADMIN')] }, ServiceBookingsController.getAllForAdmin);
  fastify.put('/bookings/admin/:id/status', { preHandler: [requireRole('ADMIN')] }, ServiceBookingsController.updateStatus);
}
