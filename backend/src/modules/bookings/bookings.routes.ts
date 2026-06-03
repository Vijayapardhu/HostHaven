import { FastifyInstance } from "fastify";
import { BookingsController } from "./bookings.controller";
import { requireRole } from "../../middleware/auth.middleware";
import { config } from "../../config";

const writeRateLimit = {
  max: config.rateLimit.writeMax,
  timeWindow: 60 * 1000,
};

export default async function bookingsRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.authenticate);

  // Static routes FIRST - customer routes
  fastify.post("/", { config: { rateLimit: writeRateLimit } }, BookingsController.create);
  fastify.post("/check-price", { config: { rateLimit: writeRateLimit } }, BookingsController.checkPrice);
  fastify.get("/", BookingsController.getUserBookings);

  // Vendor routes - static paths BEFORE dynamic :id routes
  fastify.get(
    "/vendor/bookings",
    { preHandler: [requireRole("VENDOR")] },
    BookingsController.getVendorBookings,
  );
  fastify.get(
    "/vendor/:id",
    { preHandler: [requireRole("VENDOR")] },
    BookingsController.getVendorBookingById,
  );
  fastify.post(
    "/vendor/quick-booking",
    { preHandler: [requireRole("VENDOR")], config: { rateLimit: writeRateLimit } },
    BookingsController.quickBooking,
  );
  fastify.put(
    "/vendor/:id/cancel",
    { preHandler: [requireRole("VENDOR")], config: { rateLimit: writeRateLimit } },
    BookingsController.cancelVendor,
  );
  fastify.put(
    "/vendor/:id/reschedule",
    { preHandler: [requireRole("VENDOR")], config: { rateLimit: writeRateLimit } },
    BookingsController.reschedule,
  );

  fastify.put(
    "/vendor/:id/modify",
    { preHandler: [requireRole("VENDOR")], config: { rateLimit: writeRateLimit } },
    BookingsController.modifyBooking,
  );

  fastify.put(
    "/vendor/:id/check-in",
    { preHandler: [requireRole("VENDOR")], config: { rateLimit: writeRateLimit } },
    BookingsController.checkIn,
  );

  fastify.put(
    "/vendor/:id/check-out",
    { preHandler: [requireRole("VENDOR")], config: { rateLimit: writeRateLimit } },
    BookingsController.checkOut,
  );

  fastify.get(
    "/vendor/:id/invoice",
    { preHandler: [requireRole("VENDOR")] },
    BookingsController.generateInvoice,
  );

  fastify.get(
    "/vendor/:id/invoice/pdf",
    { preHandler: [requireRole("VENDOR")] },
    BookingsController.downloadInvoicePDF,
  );

  fastify.get(
    "/vendor/inventory",
    { preHandler: [requireRole("VENDOR")] },
    BookingsController.getRoomInventory,
  );

  // Customer dynamic routes - MUST be LAST
  fastify.get("/:id", BookingsController.getById);
  fastify.put("/:id/cancel", { config: { rateLimit: writeRateLimit } }, BookingsController.cancel);
  fastify.put("/:id/reschedule", { config: { rateLimit: writeRateLimit } }, BookingsController.reschedule);
  fastify.put("/:id/modify", { config: { rateLimit: writeRateLimit } }, BookingsController.modifyBooking);
  fastify.get("/:id/invoice/pdf", BookingsController.downloadInvoicePDF);
}
