import { FastifyInstance } from 'fastify';
import { ReviewsController } from './reviews.controller';

export default async function reviewsRoutes(fastify: FastifyInstance) {
  // Specific routes must come before parameterized routes
  fastify.get('/property/:propertyId', ReviewsController.getPropertyReviews);
  fastify.get('/:id', ReviewsController.getById);
  fastify.get('/', ReviewsController.getAll);

  fastify.post(
    '/',
    { preHandler: fastify.authenticate },
    ReviewsController.create
  );

  fastify.put(
    '/:id',
    { preHandler: fastify.authenticate },
    ReviewsController.update
  );

  fastify.delete(
    '/:id',
    { preHandler: fastify.authenticate },
    ReviewsController.delete
  );
}
