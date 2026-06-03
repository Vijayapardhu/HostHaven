import { FastifyInstance } from 'fastify';
import { requireRole } from '../../middleware/auth.middleware';
import { SupportController } from './support.controller';
import { config } from '../../config';

const writeRateLimit = {
  max: 10,
  timeWindow: 60 * 1000,
};

export default async function supportRoutes(fastify: FastifyInstance) {
  // Public route for contact form (no auth required)
  fastify.post('/tickets', { config: { rateLimit: writeRateLimit } }, SupportController.create);

  // Authenticated routes
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.get('/tickets/my', SupportController.getMyTickets);
  fastify.get('/tickets/my/:id', SupportController.getMyTicketById);

  // Admin routes
  fastify.get('/tickets/admin', { preHandler: [requireRole('ADMIN')] }, SupportController.getAllTickets);
  fastify.get('/tickets/admin/:id', { preHandler: [requireRole('ADMIN')] }, SupportController.getTicketById);
  fastify.put('/tickets/admin/:id', { preHandler: [requireRole('ADMIN')] }, SupportController.updateTicket);
  fastify.post('/tickets/admin/:id/notes', { preHandler: [requireRole('ADMIN')] }, SupportController.addNote);
  fastify.put('/tickets/admin/:id/reopen', { preHandler: [requireRole('ADMIN')] }, SupportController.reopenTicket);
}
