import { FastifyInstance } from 'fastify';
import { AuthController } from './auth.controller';

export default async function authRoutes(fastify: FastifyInstance) {
  // Public routes
  fastify.post('/register', AuthController.register);
  fastify.post('/login', AuthController.login);
  fastify.post('/refresh', AuthController.refresh);
  fastify.post('/verify-email', AuthController.verifyEmail);
  fastify.post('/resend-verification', AuthController.resendVerification);
  fastify.post('/forgot-password', AuthController.forgotPassword);
  fastify.post('/reset-password', AuthController.resetPassword);

  // Vendor routes
  fastify.post('/vendor/login', AuthController.vendorLogin);
  fastify.post('/vendor/forgot-password', AuthController.vendorForgotPassword);
  fastify.post('/vendor/reset-password', AuthController.vendorResetPassword);

  // Google OAuth routes
  fastify.get('/google', AuthController.googleAuthUrl);
  fastify.get('/google/callback', AuthController.googleCallback);
  fastify.post('/google', AuthController.googleLogin);

  // Protected routes
  fastify.get('/me', { preHandler: [fastify.authenticate] }, AuthController.me);
  fastify.post('/logout', { preHandler: [fastify.authenticate] }, AuthController.logout);
  fastify.post('/logout-all', { preHandler: [fastify.authenticate] }, AuthController.logoutAll);
  fastify.post('/change-password', { preHandler: [fastify.authenticate] }, AuthController.changePassword);
  fastify.post('/link-google', { preHandler: [fastify.authenticate] }, AuthController.linkGoogle);
  fastify.delete('/unlink-google', { preHandler: [fastify.authenticate] }, AuthController.unlinkGoogle);
}
