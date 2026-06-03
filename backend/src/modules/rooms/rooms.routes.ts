import { FastifyInstance } from 'fastify';
import { RoomsController } from './rooms.controller';
import { requireRole } from '../../middleware/auth.middleware';
import { config } from '../../config';

const writeRateLimit = {
  max: config.rateLimit.writeMax,
  timeWindow: 60 * 1000,
};

export default async function roomsRoutes(fastify: FastifyInstance) {
  // Specific routes must come before parameterized routes
  fastify.get('/property/:propertyId', RoomsController.getByProperty);
  fastify.get('/:id/availability', RoomsController.checkAvailability);
  fastify.get('/:id', RoomsController.getById);
  fastify.get('/', RoomsController.getAll);

  fastify.post(
    '/',
    { preHandler: [fastify.authenticate, requireRole('VENDOR')], config: { rateLimit: writeRateLimit } },
    RoomsController.create
  );

  fastify.put(
    '/:id',
    { preHandler: [fastify.authenticate, requireRole('VENDOR')], config: { rateLimit: writeRateLimit } },
    RoomsController.update
  );

  fastify.delete(
    '/:id',
    { preHandler: [fastify.authenticate, requireRole('VENDOR')], config: { rateLimit: writeRateLimit } },
    RoomsController.delete
  );
}
