import { FastifyInstance } from "fastify";
import { requireRole } from "../../middleware/auth.middleware";
import { ServicesController } from "./services.controller";
import { ServiceBookingsController } from "../service-bookings/service-bookings.controller";

export default async function servicesRoutes(fastify: FastifyInstance) {
  const auth = (fastify as any).authenticate;

  // Public routes - static first
  fastify.get("/", ServicesController.getAll);
  fastify.get("/cities", ServicesController.getCities);

  // Service bookings - Auth routes - static BEFORE dynamic
  fastify.post("/bookings", { preHandler: [auth] }, ServiceBookingsController.create);
  fastify.get("/bookings/my", { preHandler: [auth] }, ServiceBookingsController.getMyBookings);
  fastify.get("/bookings/my/:id", { preHandler: [auth] }, ServiceBookingsController.getMyBookingById);
  fastify.put("/bookings/my/:id/cancel", { preHandler: [auth] }, ServiceBookingsController.cancelMyBooking);
  fastify.get("/bookings/my/:id/invoice", { preHandler: [auth] }, ServiceBookingsController.getInvoice);

  // Service bookings - Admin only - static BEFORE dynamic
  fastify.get(
    "/bookings/admin",
    { preHandler: [auth, requireRole("ADMIN")] },
    ServiceBookingsController.getAllForAdmin,
  );
  fastify.get(
    "/bookings/admin/:id",
    { preHandler: [auth, requireRole("ADMIN")] },
    ServiceBookingsController.getByIdForAdmin,
  );
  fastify.put(
    "/bookings/admin/:id/status",
    { preHandler: [auth, requireRole("ADMIN")] },
    ServiceBookingsController.updateStatus,
  );
  fastify.post(
    "/bookings/admin/:id/refund",
    { preHandler: [auth, requireRole("ADMIN")] },
    ServiceBookingsController.refund,
  );

  // Services - Admin only - static BEFORE dynamic
  fastify.get(
    "/new",
    { preHandler: [auth, requireRole("ADMIN")] },
    ServicesController.getNewForm,
  );
  fastify.post(
    "/",
    { preHandler: [auth, requireRole("ADMIN", "VENDOR")] },
    ServicesController.create,
  );
  fastify.put(
    "/:id",
    { preHandler: [auth, requireRole("ADMIN", "VENDOR")] },
    ServicesController.update,
  );
  fastify.delete(
    "/:id",
    { preHandler: [auth, requireRole("ADMIN", "VENDOR")] },
    ServicesController.delete,
  );
  fastify.post(
    "/:id/activate",
    { preHandler: [auth, requireRole("ADMIN", "VENDOR")] },
    ServicesController.activate,
  );
  fastify.post(
    "/:id/deactivate",
    { preHandler: [auth, requireRole("ADMIN", "VENDOR")] },
    ServicesController.deactivate,
  );

  // Dynamic :idOrSlug route - MUST be LAST - supports both UUID and slug
  fastify.get("/:idOrSlug", ServicesController.getById);
}
