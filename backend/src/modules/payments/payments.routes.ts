import { FastifyInstance } from 'fastify';
import { PaymentsController } from './payments.controller';
import { requireRole, requireVerified } from '../../middleware/auth.middleware';
import { config } from '../../config';

const writeRateLimit = {
  max: config.rateLimit.writeMax,
  timeWindow: 60 * 1000,
};

export default async function paymentsRoutes(fastify: FastifyInstance) {
  // Webhook route - no auth required
  fastify.post(
    '/webhook',
    {
      config: {
        rawBody: true,
      },
    },
    PaymentsController.webhook,
  );

  // Get Razorpay public key - no auth required (public key)
  fastify.get('/public-key', PaymentsController.getPublicKey);

  // Protected routes
  fastify.addHook('preHandler', fastify.authenticate);

  const requireVerifiedHandler = [requireVerified];
  const requireVendorVerifiedHandler = [requireRole('VENDOR'), requireVerified];

  fastify.post('/create-order', { preHandler: requireVerifiedHandler, config: { rateLimit: writeRateLimit } }, PaymentsController.createOrder);
  fastify.post('/create-service-order', { preHandler: requireVerifiedHandler, config: { rateLimit: writeRateLimit } }, PaymentsController.createServiceOrder);
  fastify.post('/vendor/create-order', { preHandler: requireVendorVerifiedHandler, config: { rateLimit: writeRateLimit } }, PaymentsController.createVendorOrder);
  fastify.post('/verify', { preHandler: requireVerifiedHandler, config: { rateLimit: writeRateLimit } }, PaymentsController.verifyPayment);
  fastify.post('/verify-service', { preHandler: requireVerifiedHandler, config: { rateLimit: writeRateLimit } }, PaymentsController.verifyServicePayment);
  fastify.get('/:id', PaymentsController.getPayment);
}
