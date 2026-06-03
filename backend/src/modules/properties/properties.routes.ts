import { FastifyInstance } from "fastify";
import { PropertiesController } from "./properties.controller";
import { requireRole } from "../../middleware/auth.middleware";
import { config } from "../../config";

const writeRateLimit = {
  max: config.rateLimit.writeMax,
  timeWindow: 60 * 1000,
};

const searchRateLimit = {
  max: config.rateLimit.searchMax,
  timeWindow: 60 * 1000,
};

export default async function propertiesRoutes(fastify: FastifyInstance) {
  // Public routes - static first, then dynamic
  fastify.get("/", PropertiesController.getAll);
  fastify.get("/featured", PropertiesController.getFeatured);
  fastify.get("/cities", PropertiesController.getCities);
  fastify.get("/cities/list", PropertiesController.getCityNames);
  fastify.get("/amenities", PropertiesController.getAmenities);
  fastify.get("/search", { config: { rateLimit: searchRateLimit } }, PropertiesController.search);
  
  // Admin management routes - MUST be before /:id route
  fastify.get("/admin/amenities", { preHandler: [fastify.authenticate, requireRole("ADMIN")] }, PropertiesController.getAmenities);
  fastify.put("/admin/amenities", { preHandler: [fastify.authenticate, requireRole("ADMIN")] }, PropertiesController.toggleAmenity);
  fastify.get("/admin/cities", { preHandler: [fastify.authenticate, requireRole("ADMIN")] }, PropertiesController.getCities);
  fastify.post("/admin/cities", { preHandler: [fastify.authenticate, requireRole("ADMIN")] }, PropertiesController.createCity);
  fastify.put("/admin/cities", { preHandler: [fastify.authenticate, requireRole("ADMIN")] }, PropertiesController.toggleCity);

  // Dynamic routes - must be LAST
  fastify.get("/:id", PropertiesController.getById);
  fastify.get("/:id/availability", { config: { rateLimit: searchRateLimit } }, PropertiesController.checkAvailability);

  // Protected routes - Vendor only
  fastify.post(
    "/",
    { preHandler: [fastify.authenticate, requireRole("VENDOR")], config: { rateLimit: writeRateLimit } },
    PropertiesController.create,
  );

  fastify.post(
    "/amenities",
    { preHandler: [fastify.authenticate, requireRole("VENDOR", "ADMIN")], config: { rateLimit: writeRateLimit } },
    PropertiesController.createAmenity,
  );

  fastify.put(
    "/:idOrSlug",
    { preHandler: [fastify.authenticate, requireRole("VENDOR", "ADMIN")], config: { rateLimit: writeRateLimit } },
    PropertiesController.update,
  );

  fastify.delete(
    "/:idOrSlug",
    { preHandler: [fastify.authenticate, requireRole("VENDOR", "ADMIN")], config: { rateLimit: writeRateLimit } },
    PropertiesController.delete,
  );
}
