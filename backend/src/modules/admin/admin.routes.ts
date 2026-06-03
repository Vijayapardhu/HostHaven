import { FastifyInstance } from 'fastify';
import { AdminController } from './admin.controller';
import { requireRole } from '../../middleware/auth.middleware';
import { NotificationsController } from '../notifications/notifications.controller';

const idParamSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', minLength: 1 },
  },
};

const idOrSlugParamSchema = {
  type: 'object',
  required: ['idOrSlug'],
  properties: {
    idOrSlug: { type: 'string', minLength: 1 },
  },
};

const propertyRoomParamSchema = {
  type: 'object',
  required: ['id', 'roomId'],
  properties: {
    id: { type: 'string', minLength: 1 },
    roomId: { type: 'string', minLength: 1 },
  },
};

const updateVendorCommissionBodySchema = {
  type: 'object',
  properties: {
    rate: { type: 'number', minimum: 0, maximum: 100 },
    commissionRate: { type: 'number', minimum: 0, maximum: 100 },
  },
  anyOf: [{ required: ['rate'] }, { required: ['commissionRate'] }],
  additionalProperties: true,
};

const updatePropertyCancellationBodySchema = {
  type: 'object',
  required: ['cancellationPolicy'],
  properties: {
    cancellationPolicy: {
      type: 'string',
      enum: ['FREE_CANCELLATION', 'MODERATE', 'STRICT', 'NON_REFUNDABLE'],
    },
  },
  additionalProperties: true,
};

const updateRoomBodySchema = {
  type: 'object',
  properties: {
    pricePerNight: { type: 'number', minimum: 0 },
    weekendPrice: { type: 'number', minimum: 0 },
    totalRooms: { type: 'integer', minimum: 0 },
    availableRooms: { type: 'integer', minimum: 0 },
    isActive: { type: 'boolean' },
    images: { type: 'array', items: { type: 'string' } },
    roomImages: { type: 'array', items: { type: 'string' } },
    video: { type: 'string' },
  },
  additionalProperties: false,
};

const overrideInventoryBodySchema = {
  type: 'object',
  required: ['date', 'availableRooms'],
  properties: {
    date: { type: 'string', minLength: 1 },
    availableRooms: { type: 'integer', minimum: 0 },
  },
  additionalProperties: false,
};

export default async function adminRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', (fastify as any).authenticate);
  fastify.addHook('preHandler', requireRole('ADMIN'));

  fastify.get('/dashboard', AdminController.getDashboard);
  fastify.get('/stats', AdminController.getSystemStats);
  fastify.get('/analytics', AdminController.getAnalytics);
  fastify.get('/settings', AdminController.getSettings);
  fastify.put('/settings', AdminController.updateSettings);
  fastify.get('/settings/homepage', AdminController.getHomepageConfig);
  fastify.put('/settings/homepage', AdminController.updateHomepageConfig);
  fastify.get('/cms/pages', AdminController.getCmsPages);
  fastify.post('/cms/pages', AdminController.createCmsPage);
  fastify.put('/cms/pages/:id', { schema: { params: idParamSchema, body: { type: 'object', additionalProperties: true } } }, AdminController.updateCmsPage);
  fastify.delete('/cms/pages/:id', { schema: { params: idParamSchema } }, AdminController.deleteCmsPage);

  fastify.get('/users', AdminController.getAllUsers);
  fastify.get('/users/:id', AdminController.getUserById);
  fastify.put('/users/:id/status', AdminController.updateUserStatus);
  fastify.delete('/users/:id', AdminController.softDeleteUser);
  fastify.put('/users/:id/verify-email', AdminController.verifyUserEmail);
  fastify.post('/users/:id/reset-password', AdminController.resetUserPassword);
  fastify.get('/users/:id/sessions', AdminController.getUserSessions);

  fastify.get('/properties', AdminController.getAllProperties);
  fastify.get('/properties/:idOrSlug', AdminController.getPropertyById);
  fastify.put(
    '/properties/:idOrSlug',
    { schema: { params: idOrSlugParamSchema, body: { type: 'object', additionalProperties: true } } },
    AdminController.updateProperty,
  );
  fastify.put(
    '/properties/:id/cancellation-policy',
    { schema: { params: idParamSchema, body: updatePropertyCancellationBodySchema } },
    AdminController.updatePropertyCancellationPolicy,
  );
  fastify.delete('/properties/:idOrSlug', AdminController.softDeleteProperty);
  fastify.post('/properties', AdminController.createProperty);
  fastify.put('/properties/:idOrSlug/status', AdminController.updatePropertyStatus);

  fastify.get('/vendors', AdminController.getAllVendors);
  fastify.get('/vendors/:id', AdminController.getVendorById);
  fastify.put('/vendors/:id/status', AdminController.updateVendorStatus);
  fastify.put(
    '/vendors/:id/commission',
    { schema: { params: idParamSchema, body: updateVendorCommissionBodySchema } },
    AdminController.updateVendorCommission,
  );
  fastify.put(
    '/vendors/:id',
    { schema: { params: idParamSchema, body: { type: 'object', additionalProperties: true } } },
    AdminController.updateVendor,
  );
  fastify.delete('/vendors/:id', AdminController.softDeleteVendor);

  fastify.get('/bookings', AdminController.getAllBookings);
  fastify.get('/bookings/:id', AdminController.getBookingById);
  fastify.put('/bookings/:id/status', AdminController.updateBookingStatus);
  fastify.get('/bookings/:id/payment', AdminController.getPaymentDetails);
  fastify.put('/bookings/:id/refund', AdminController.refundBooking);

  fastify.get('/payments', AdminController.getAllPayments);
  fastify.get('/payments/:id', AdminController.getPaymentById);
  fastify.put('/payments/:id/refund', AdminController.refundPayment);
  fastify.get('/refunds', AdminController.getAllRefunds);

  fastify.get('/payouts', AdminController.getAllPayouts);
  fastify.post('/payouts', AdminController.createPayout);
  fastify.get('/payouts/earnings', AdminController.getVendorEarnings);
  fastify.get('/payouts/:id', AdminController.getPayoutById);
  fastify.post('/payouts/process', AdminController.processPayout);
  fastify.put('/payouts/:id/mark-paid', AdminController.markPayoutPaid);
  fastify.put('/payouts/:id/verify', AdminController.verifyPayoutByVendor);

  fastify.put(
    '/rooms/:id',
    { schema: { params: idParamSchema, body: updateRoomBodySchema } },
    AdminController.updateRoom,
  );
  fastify.put(
    '/properties/:id/rooms/:roomId',
    { schema: { params: propertyRoomParamSchema, body: updateRoomBodySchema } },
    AdminController.updatePropertyRoomMetrics,
  );
  fastify.put(
    '/properties/:id/rooms/:roomId/metrics',
    { schema: { params: propertyRoomParamSchema, body: updateRoomBodySchema } },
    AdminController.updatePropertyRoomMetrics,
  );
  fastify.post('/rooms/:id/block', AdminController.blockRoomDates);
  fastify.get('/rooms/:id/inventory', AdminController.getRoomInventory);
  fastify.put(
    '/rooms/:id/inventory/override',
    { schema: { params: idParamSchema, body: overrideInventoryBodySchema } },
    AdminController.overrideRoomInventory,
  );
  fastify.delete('/rooms/:id/locks', AdminController.releaseRoomLocks);
  fastify.post('/inventory/cleanup', AdminController.cleanupInventoryLocks);
  fastify.get('/inventory/properties', AdminController.getAllPropertiesInventory);

  fastify.get('/notifications', NotificationsController.getUserNotifications);
  fastify.post('/notifications/push', NotificationsController.sendAdminPushNotification);
  fastify.put('/notifications/read-all', NotificationsController.markAllAsRead);
  fastify.put('/notifications/:id/read', NotificationsController.markAsRead);

  // Review moderation
  fastify.get('/reviews', AdminController.adminGetAllReviews);
  fastify.put('/reviews/:id/approve', AdminController.adminApproveReview);
  fastify.put('/reviews/:id', AdminController.adminUpdateReviewContent);
  fastify.put('/reviews/:id/hide', AdminController.adminHideReview);
  fastify.put('/reviews/:id/unhide', AdminController.adminUnhideReview);
  fastify.put('/reviews/:id/verify', AdminController.adminVerifyReview);
  fastify.delete('/reviews/:id', AdminController.adminDeleteReview);

  // Export Data
  fastify.get('/export/:entity', AdminController.exportDataCsv);
  fastify.get('/export/:entity/excel', AdminController.exportDataExcel);
  fastify.get('/template/:entity', AdminController.getTemplate);
  fastify.get('/import/entities', AdminController.getImportEntities);
  fastify.post('/import/:entity', AdminController.importData);

  // Full Export/Import with ALL fields
  fastify.get('/export-full/:entity', AdminController.exportFullExcel);
  fastify.get('/template-full/:entity', AdminController.getFullTemplate);
  fastify.post('/import-full/:entity', AdminController.importFullData);
  fastify.get('/export-entities', AdminController.getAllExportEntities);

  // System & Logs
  fastify.get('/logs', AdminController.getAdminLogs);
  fastify.get('/audit-logs', AdminController.getAuditLogs);
  fastify.get('/system/health', AdminController.getSystemHealth);
  fastify.get('/system/errors', AdminController.getErrorLogs);
  fastify.put('/system/errors/:id/resolve', AdminController.resolveError);

  // Broadcasts
  fastify.get('/broadcasts', AdminController.getBroadcasts);
  fastify.post('/broadcasts', AdminController.createBroadcast);
  fastify.put('/broadcasts/:id/cancel', AdminController.cancelBroadcast);
  fastify.delete('/broadcasts/:id', AdminController.deleteBroadcast);

  // Email Template Management
  fastify.get('/email-templates', AdminController.getEmailTemplates);
  fastify.get('/email-templates/:id', AdminController.getEmailTemplateById);
  fastify.post('/email-templates', AdminController.createEmailTemplate);
  fastify.put('/email-templates/:id', AdminController.updateEmailTemplate);
  fastify.delete('/email-templates/:id', AdminController.deleteEmailTemplate);

  // City Management
  fastify.get('/cities', AdminController.getCities);
  fastify.post('/cities', AdminController.createCity);
  fastify.put('/cities/:id', AdminController.updateCity);
  fastify.delete('/cities/:id', AdminController.deleteCity);
}
