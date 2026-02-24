import { FastifyInstance } from 'fastify';
import { RoomsController } from './rooms.controller';
import { requireRole } from '../../middleware/auth.middleware';

export default async function roomsRoutes(fastify: FastifyInstance) {
  fastify.get('/', RoomsController.getAll);
  fastify.get('/property/:propertyId', RoomsController.getByProperty);
  fastify.get('/:id', RoomsController.getById);
  fastify.get('/:id/availability', RoomsController.checkAvailability);

  fastify.post(
    '/',
    { preHandler: [fastify.authenticate, requireRole('VENDOR')] },
    RoomsController.create
  );

  fastify.put(
    '/:id',
    { preHandler: [fastify.authenticate, requireRole('VENDOR')] },
    RoomsController.update
  );

  fastify.delete(
    '/:id',
    { preHandler: [fastify.authenticate, requireRole('VENDOR')] },
    RoomsController.delete
  );
}
