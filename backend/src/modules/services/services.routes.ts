import { FastifyInstance } from "fastify";
import { requireRole } from "../../middleware/auth.middleware";
import { ServicesController } from "./services.controller";
import { ServiceBookingsController } from "../service-bookings/service-bookings.controller";

export default async function servicesRoutes(fastify: FastifyInstance) {
  const auth = (fastify as any).authenticate;
  fastify.addHook("preHandler", auth);

  // Public routes
  fastify.get("/", ServicesController.getAll);

  // Service bookings - Public
  fastify.post("/bookings", ServiceBookingsController.create);
  fastify.get("/bookings/my", ServiceBookingsController.getMyBookings);

  // Service bookings - Admin only
  fastify.get(
    "/bookings/admin",
    { preHandler: [requireRole("ADMIN")] },
    ServiceBookingsController.getAllForAdmin,
  );
  fastify.get(
    "/bookings/admin/:id",
    { preHandler: [requireRole("ADMIN")] },
    ServiceBookingsController.getByIdForAdmin,
  );
  fastify.put(
    "/bookings/admin/:id/status",
    { preHandler: [requireRole("ADMIN")] },
    ServiceBookingsController.updateStatus,
  );
  fastify.post(
    "/bookings/admin/:id/refund",
    { preHandler: [requireRole("ADMIN")] },
    ServiceBookingsController.refund,
  );

  // Services - Admin only
  fastify.get(
    "/new",
    { preHandler: [auth, requireRole("ADMIN")] },
    ServicesController.getNewForm,
  );
  fastify.post(
    "/",
    { preHandler: [auth, requireRole("ADMIN")] },
    ServicesController.create,
  );
  fastify.get("/:id", ServicesController.getById);
  fastify.put(
    "/:id",
    { preHandler: [auth, requireRole("ADMIN")] },
    ServicesController.update,
  );
  fastify.delete(
    "/:id",
    { preHandler: [auth, requireRole("ADMIN")] },
    ServicesController.delete,
  );
  fastify.post(
    "/:id/activate",
    { preHandler: [auth, requireRole("ADMIN")] },
    ServicesController.activate,
  );
  fastify.post(
    "/:id/deactivate",
    { preHandler: [auth, requireRole("ADMIN")] },
    ServicesController.deactivate,
  );
}
