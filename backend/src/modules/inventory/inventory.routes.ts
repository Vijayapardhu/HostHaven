import { FastifyInstance } from 'fastify';
import { InventoryController } from './inventory.controller';

export default async function inventoryRoutes(fastify: FastifyInstance) {
  fastify.get('/live', InventoryController.getLiveInventory);
  fastify.get('/', { preHandler: fastify.authenticate }, InventoryController.getAvailability);
  fastify.post('/lock', { preHandler: fastify.authenticate }, InventoryController.lock);
  fastify.post('/release', { preHandler: fastify.authenticate }, InventoryController.release);
}
