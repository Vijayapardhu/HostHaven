import { FastifyInstance } from 'fastify';
import { requireRole } from '../../middleware/auth.middleware';
import { SupportController } from './support.controller';

export default async function supportRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.post('/tickets', SupportController.create);
  fastify.get('/tickets/my', SupportController.getMyTickets);

  fastify.get('/tickets/admin', { preHandler: [requireRole('ADMIN')] }, SupportController.getAllTickets);
  fastify.put('/tickets/admin/:id', { preHandler: [requireRole('ADMIN')] }, SupportController.updateTicket);
}
