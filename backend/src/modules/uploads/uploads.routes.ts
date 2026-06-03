import { FastifyInstance } from 'fastify';
import { UploadsController } from './uploads.controller';

export default async function uploadsRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/single',
    {
      preHandler: [fastify.authenticate],
      config: {
        rateLimit: {
          max: 30,
          timeWindow: '1 minute',
        },
      },
    },
    UploadsController.uploadSingle
  );

  fastify.post(
    '/multiple',
    {
      preHandler: [fastify.authenticate],
      config: {
        rateLimit: {
          max: 15,
          timeWindow: '1 minute',
        },
      },
    },
    UploadsController.uploadMultiple
  );

  fastify.delete(
    '/',
    { preHandler: [fastify.authenticate] },
    UploadsController.delete
  );

  fastify.delete(
    '/batch',
    { preHandler: [fastify.authenticate] },
    UploadsController.deleteMultiple
  );
}
