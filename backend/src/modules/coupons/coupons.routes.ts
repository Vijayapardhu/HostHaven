import { FastifyInstance } from "fastify";
import { couponsController } from "./coupons.controller";
import { requireRole } from "../../middleware/auth.middleware";

export default async function couponsRoutes(fastify: FastifyInstance) {
  fastify.post("/validate", couponsController.validateCoupon);
  
  fastify.post(
    "/apply",
    { preHandler: [fastify.authenticate] },
    couponsController.applyCoupon
  );

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
