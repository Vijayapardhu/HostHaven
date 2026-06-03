import { FastifyInstance } from 'fastify';
import { AuthController } from './auth.controller';
import { config } from '../../config';

const authRateLimit = {
  max: config.rateLimit.authMax,
  timeWindow: 60 * 1000,
  keyGenerator: (request: any) => request.ip,
};

const writeRateLimit = {
  max: config.rateLimit.writeMax,
  timeWindow: 60 * 1000,
};

const readRateLimit = {
  max: config.rateLimit.apiMax,
  timeWindow: 60 * 1000,
};

export default async function authRoutes(fastify: FastifyInstance) {
  // Public routes
  fastify.post('/register', { config: { rateLimit: authRateLimit } }, AuthController.register);
  fastify.post('/login', { config: { rateLimit: authRateLimit } }, AuthController.login);
  fastify.post('/refresh', AuthController.refresh);
  fastify.get('/refresh', AuthController.refreshGet);
  fastify.post('/verify-email', AuthController.verifyEmail);
  fastify.post('/resend-verification', { config: { rateLimit: authRateLimit } }, AuthController.resendVerification);
  fastify.post('/forgot-password', { config: { rateLimit: authRateLimit } }, AuthController.forgotPassword);
  fastify.get('/forgot-password', async (req, reply) => {
    return reply.send({ status: 'ok' });
  });

  // Alias for register
  fastify.get('/signup', async (req, reply) => {
    return reply.send({ status: 'ok', message: 'Use POST /register' });
  });
  fastify.post('/reset-password', AuthController.resetPassword);

  // Vendor routes
  fastify.post('/vendor/login', { config: { rateLimit: authRateLimit } }, AuthController.vendorLogin);
  fastify.post('/vendor/forgot-password', { config: { rateLimit: authRateLimit } }, AuthController.vendorForgotPassword);
  fastify.post('/vendor/reset-password', AuthController.vendorResetPassword);

  // Google OAuth routes
  fastify.get('/google', AuthController.googleAuthUrl);
  fastify.get('/google/callback', AuthController.googleCallback);
  fastify.post('/google', AuthController.googleLogin);

  // Protected routes
  fastify.get('/me', { preHandler: [fastify.authenticate], config: { rateLimit: readRateLimit } }, AuthController.me);
  fastify.get('/session', { preHandler: [fastify.authenticate], config: { rateLimit: readRateLimit } }, AuthController.session);
  fastify.post('/logout', { preHandler: [fastify.authenticate] }, AuthController.logout);
  fastify.post('/logout-all', { preHandler: [fastify.authenticate] }, AuthController.logoutAll);
  fastify.post('/change-password', { preHandler: [fastify.authenticate], config: { rateLimit: writeRateLimit } }, AuthController.changePassword);
  fastify.post('/2fa/setup', { preHandler: [fastify.authenticate], config: { rateLimit: writeRateLimit } }, AuthController.setupTwoFactor);
  fastify.post('/2fa/verify', { preHandler: [fastify.authenticate], config: { rateLimit: writeRateLimit } }, AuthController.verifyTwoFactor);
  fastify.delete('/2fa', { preHandler: [fastify.authenticate], config: { rateLimit: writeRateLimit } }, AuthController.disableTwoFactor);
  fastify.post('/link-google', { preHandler: [fastify.authenticate] }, AuthController.linkGoogle);
  fastify.delete('/unlink-google', { preHandler: [fastify.authenticate] }, AuthController.unlinkGoogle);

  // Profile routes
  fastify.put('/profile', { preHandler: [fastify.authenticate], config: { rateLimit: writeRateLimit } }, AuthController.updateProfile);

  // Address routes
  fastify.get('/addresses', { preHandler: [fastify.authenticate], config: { rateLimit: readRateLimit } }, AuthController.getAddresses);
  fastify.post('/addresses', { preHandler: [fastify.authenticate], config: { rateLimit: writeRateLimit } }, AuthController.addAddress);
  fastify.put('/addresses/:id', { preHandler: [fastify.authenticate], config: { rateLimit: writeRateLimit } }, AuthController.updateAddress);
  fastify.delete('/addresses/:id', { preHandler: [fastify.authenticate] }, AuthController.deleteAddress);
}
