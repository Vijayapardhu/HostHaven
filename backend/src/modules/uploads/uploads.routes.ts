import { FastifyInstance } from 'fastify';
import { UploadsController } from './uploads.controller';
import { requireRole } from '../../middleware/auth.middleware';

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

  // Deletion is by client-supplied storage key with no ownership record to
  // check against, so it stays admin-only. No client currently calls either
  // route; asset cleanup happens through the owning resource's own endpoints.
  fastify.delete(
    '/',
    { preHandler: [fastify.authenticate, requireRole('ADMIN')] },
    UploadsController.delete
  );

  fastify.delete(
    '/batch',
    { preHandler: [fastify.authenticate, requireRole('ADMIN')] },
    UploadsController.deleteMultiple
  );
}
