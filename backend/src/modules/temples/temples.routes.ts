import { FastifyInstance } from 'fastify';
import { TemplesController } from './temples.controller';
import { requireRole } from '../../middleware/auth.middleware';

export default async function templesRoutes(fastify: FastifyInstance) {
  fastify.get('/', TemplesController.getTemples);
  fastify.get('/:id', TemplesController.getById);
  fastify.get('/property/:propertyId', TemplesController.getByProperty);
  fastify.get('/:id/events', TemplesController.getUpcomingEvents);

  fastify.post(
    '/',
    { preHandler: [fastify.authenticate, requireRole('VENDOR', 'ADMIN')] },
    TemplesController.create
  );

  fastify.put(
    '/:id',
    { preHandler: [fastify.authenticate, requireRole('VENDOR', 'ADMIN')] },
    TemplesController.update
  );

  fastify.delete(
    '/:id',
    { preHandler: [fastify.authenticate, requireRole('ADMIN')] },
    TemplesController.delete
  );
}
