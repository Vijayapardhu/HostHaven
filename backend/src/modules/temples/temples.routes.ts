import { FastifyInstance } from "fastify";
import { TemplesController } from "./temples.controller";
import { authMiddleware, requireRole } from "../../middleware/auth.middleware";

export default async function templesRoutes(fastify: FastifyInstance) {
  fastify.get("/", TemplesController.getTemples);

  fastify.post(
    "/ai/autofill",
    { preHandler: [authMiddleware, requireRole("ADMIN")] },
    TemplesController.aiAutofill,
  );

  fastify.get("/:idOrSlug", TemplesController.getById);

  fastify.post(
    "/",
    { preHandler: [authMiddleware, requireRole("ADMIN")] },
    TemplesController.create,
  );

  fastify.put(
    "/:idOrSlug",
    { preHandler: [authMiddleware, requireRole("ADMIN")] },
    TemplesController.update,
  );

  fastify.patch(
    "/:idOrSlug/activate",
    { preHandler: [authMiddleware, requireRole("ADMIN")] },
    TemplesController.activate,
  );

  fastify.patch(
    "/:idOrSlug/deactivate",
    { preHandler: [authMiddleware, requireRole("ADMIN")] },
    TemplesController.deactivate,
  );

  fastify.delete(
    "/:idOrSlug",
    { preHandler: [authMiddleware, requireRole("ADMIN")] },
    TemplesController.delete,
  );

  fastify.get(
    "/export",
    { preHandler: [authMiddleware, requireRole("ADMIN")] },
    TemplesController.exportTemples,
  );

  fastify.post(
    "/import",
    { preHandler: [authMiddleware, requireRole("ADMIN")] },
    TemplesController.importTemples,
  );
}
