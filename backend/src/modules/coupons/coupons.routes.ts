import { FastifyInstance } from "fastify";
import { couponsController } from "./coupons.controller";
import { requireRole } from "../../middleware/auth.middleware";

export default async function couponsRoutes(fastify: FastifyInstance) {
  fastify.get("/public", couponsController.getPublicCoupons);

  // Public by design (checkout preview before login), but rate-limited so the
  // code space cannot be enumerated by brute force.
  fastify.post(
    "/validate",
    { config: { rateLimit: { max: 20, timeWindow: 60 * 1000 } } },
    couponsController.validateCoupon,
  );

  // NOTE: there is deliberately no /apply route. Redemption happens inside the
  // booking-creation transaction (bookings.service.resolveCoupon), where usage
  // and the booking commit together. The old /apply handler trusted a
  // client-supplied userId and burned usage with no booking attached, letting
  // anyone exhaust another user's per-user eligibility.

  fastify.get(
    "/",
    { preHandler: [fastify.authenticate, requireRole("ADMIN")] },
    couponsController.getCoupons
  );

  fastify.post(
    "/",
    { preHandler: [fastify.authenticate, requireRole("ADMIN")] },
    couponsController.createCoupon
  );

  fastify.get(
    "/:id",
    { preHandler: [fastify.authenticate, requireRole("ADMIN")] },
    couponsController.getCouponById
  );

  fastify.put(
    "/:id",
    { preHandler: [fastify.authenticate, requireRole("ADMIN")] },
    couponsController.updateCoupon
  );

  fastify.delete(
    "/:id",
    { preHandler: [fastify.authenticate, requireRole("ADMIN")] },
    couponsController.deleteCoupon
  );
}
