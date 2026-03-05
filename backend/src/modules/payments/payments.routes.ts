import { FastifyInstance } from 'fastify';
import { PaymentsController } from './payments.controller';
import { requireRole } from '../../middleware/auth.middleware';

export default async function paymentsRoutes(fastify: FastifyInstance) {
  // Webhook route - no auth required
  fastify.post('/webhook', PaymentsController.webhook);

  // Get Razorpay public key - no auth required (public key)
  fastify.get('/public-key', PaymentsController.getPublicKey);

  // Protected routes
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.post('/create-order', PaymentsController.createOrder);
  fastify.post('/vendor/create-order', { preHandler: [requireRole('VENDOR')] }, PaymentsController.createVendorOrder);
  fastify.post('/verify', PaymentsController.verifyPayment);
  fastify.get('/:id', PaymentsController.getPayment);
}
