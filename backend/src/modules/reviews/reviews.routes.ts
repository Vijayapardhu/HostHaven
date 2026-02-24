import { FastifyInstance } from 'fastify';
import { ReviewsController } from './reviews.controller';

export default async function reviewsRoutes(fastify: FastifyInstance) {
  fastify.get('/', ReviewsController.getAll);
  fastify.get('/property/:propertyId', ReviewsController.getPropertyReviews);
  fastify.get('/:id', ReviewsController.getById);

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
