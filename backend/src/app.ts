import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import cookie from "@fastify/cookie";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import multipart from "@fastify/multipart";
import { config, isDevelopment, isProduction } from "./config";
import { logger } from "./utils/logger.util";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { authMiddleware, vendorStatusAuthMiddleware } from "./middleware/auth.middleware";
import authRoutes from "./modules/auth/auth.routes";
import propertiesRoutes from "./modules/properties/properties.routes";
import roomsRoutes from "./modules/rooms/rooms.routes";
import templesRoutes from "./modules/temples/temples.routes";
import bookingsRoutes from "./modules/bookings/bookings.routes";
import paymentsRoutes from "./modules/payments/payments.routes";
import reviewsRoutes from "./modules/reviews/reviews.routes";
import wishlistRoutes from "./modules/wishlist/wishlist.routes";
import vendorRoutes from "./modules/vendor/vendor.routes";
import adminRoutes from "./modules/admin/admin.routes";
import uploadsRoutes from "./modules/uploads/uploads.routes";
import notificationsRoutes from "./modules/notifications/notifications.routes";
import servicesRoutes from "./modules/services/services.routes";
import supportRoutes from "./modules/support/support.routes";
import pushRoutes from "./modules/push/push.routes";
import inventoryRoutes from "./modules/inventory/inventory.routes";
import couponsRoutes from "./modules/coupons/coupons.routes";
import adminService from "./modules/admin/admin.service";
import { publicCmsPageParamSchema } from "./modules/admin/admin.schema";
import { ERROR_CODES } from "./constants/error-codes";

const HOMEPAGE_FALLBACK_CONFIG = {
  pageBackground: "hsl(var(--background))",
  sections: {
    banner: { isVisible: true, order: 0 },
    hero: { isVisible: true, order: 1 },
    search: { isVisible: true, order: 2 },
    promoBanner: { isVisible: true, order: 3 },
    features: { isVisible: true, order: 4 },
    destinations: { isVisible: true, order: 5 },
    recommendations: { isVisible: true, order: 6 },
    temples: { isVisible: true, order: 7 },
    services: { isVisible: true, order: 8 },
    becomePartner: { isVisible: true, order: 9 },
  },
  bannerSlides: [],
  destinations: [],
  featureCards: [],
  serviceCards: [],
  temples: [],
  partnerSection: { title: "", subtitle: "", ctaText: "", ctaLink: "" },
  promoBanner: { isVisible: true, imageUrl: "", link: "/", title: "" },
};

declare module 'fastify' {
  interface FastifyContextConfig {
    rawBody?: boolean;
  }
}

export const buildApp = async () => {
  const fastify = Fastify({
    logger: isDevelopment
      ? {
        level: config.logging.level,
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            levelFirst: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        },
      }
      : { level: config.logging.level },
    requestIdHeader: "x-request-id",
    requestIdLogLabel: "requestId",
    bodyLimit: 500 * 1024 * 1024, // 500MB for large video uploads
  });

  fastify.addHook('preParsing', async (request, _reply, payload) => {
    if (!(request.routeOptions as any)?.config?.rawBody) {
      return payload;
    }

    const chunks: Buffer[] = [];
    for await (const chunk of payload) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    const rawBodyBuffer = Buffer.concat(chunks);
    (request as any).rawBody = rawBodyBuffer.toString('utf8');
    return rawBodyBuffer;
  });

  // Register cookie for session management
  await fastify.register(cookie, {
    secret: config.jwt.accessSecret,
    hook: 'onRequest',
  });

// Register multipart for file uploads
  await fastify.register(multipart, {
    limits: {
      fileSize: 500 * 1024 * 1024, // 500MB per file (increased for videos)
      files: 20, // Maximum 20 files per request
    },
  });

  // Register authentication decorator
  fastify.decorate("authenticate", authMiddleware);
  fastify.decorate("authenticateVendorStatus", vendorStatusAuthMiddleware);

  // Security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: isProduction
      ? {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
          connectSrc: [
            "'self'",
            config.app.frontendUrl,
            config.app.vendorUrl,
            config.app.adminUrl,
          ],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
        },
      }
      : false,
    crossOriginEmbedderPolicy: false,
  });

  // CORS
  await fastify.register(cors, {
    origin: (origin, cb) => {
      // Allow all origins in development, or specific origins in production
      if (isProduction) {
        // Production URLs - these take priority
        const productionOrigins = [
          "https://hosthaven.in",
          "https://www.hosthaven.in",
          "https://api.hosthaven.in",
          "https://admin.hosthaven.in",
          "https://vendor.hosthaven.in",
          "https://www.admin.hosthaven.in",
          "https://www.vendor.hosthaven.in",
          "http://hosthaven.in",
          "http://www.hosthaven.in",
          "http://api.hosthaven.in",
          "http://admin.hosthaven.in",
          "http://vendor.hosthaven.in",
          "http://www.admin.hosthaven.in",
          "http://www.vendor.hosthaven.in",
        ];

        // Only use config URLs if they're not localhost
        const configOrigins = [
          config.app.frontendUrl,
          config.app.vendorUrl,
          config.app.adminUrl,
        ].filter(url => url && !url.includes('localhost') && !url.includes('127.0.0.1'));

        const allowedOrigins = [...productionOrigins, ...configOrigins];

        // Allow requests with no origin (e.g., mobile apps, curl requests)
        if (!origin) {
          cb(null, true);
        } else if (allowedOrigins.includes(origin)) {
          cb(null, true);
        } else {
          // Also check if origin matches pattern like *.hosthaven.in
          if (origin && origin.includes('.hosthaven.in')) {
            cb(null, true);
          } else {
            cb(new Error("Not allowed by CORS"), false);
          }
        }
      } else {
        // In development, allow all origins
        cb(null, true);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-Request-Id",
      "Cache-Control",
      "Pragma",
      "X-Forwarded-For",
      "X-Real-IP",
      "X-Client-Version",
      "X-Refresh-Token",
      "Access-Control-Allow-Headers",
      "Access-Control-Allow-Origin",
      "Cookie",
      "Set-Cookie",
    ],
    exposedHeaders: [
      "Content-Disposition",
      "Access-Control-Allow-Origin",
    ],
  });

  // Rate limiting
  await fastify.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.windowMs,
    cache: 10000,
    allowList: isDevelopment ? ["127.0.0.1", "::1"] : [],
    keyGenerator: (request) => {
      return request.user?.id || request.ip;
    },
    skipOnError: true,
  });

  // Swagger documentation
  if (isDevelopment) {
    await fastify.register(swagger, {
      openapi: {
        openapi: "3.0.0",
        info: {
          title: "HostHaven API",
          description: "Travel and Heritage Tourism Platform API",
          version: "1.0.0",
        },
        servers: [
          {
            url: `http://localhost:${config.app.port}/${config.app.apiVersion}`,
            description: "Development server",
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
          },
        },
      },
    });

    await fastify.register(swaggerUI, {
      routePrefix: "/docs",
      uiConfig: {
        docExpansion: "list",
        deepLinking: true,
      },
    });
  }

  // Health check
  fastify.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: config.app.apiVersion,
  }));

  // Public homepage config endpoint (no auth)
  fastify.get(
    `/${config.app.apiVersion}/settings/homepage`,
    async (request, reply) => {
      try {
        const homepageConfig = await adminService.getHomepageConfig();
        return { success: true, data: homepageConfig };
      } catch (error) {
        logger.error({ error }, "Failed to fetch public homepage config");
        return { success: true, data: HOMEPAGE_FALLBACK_CONFIG };
      }
    },
  );

  fastify.get(`/${config.app.apiVersion}/settings/public`, async () => {
    try {
      const platformSettings = await adminService.getPublicPlatformSettings();
      return { success: true, data: platformSettings };
    } catch {
      return {
        success: true,
        data: {
          platformName: "HostHaven",
          supportEmail: "support@hosthaven.com",
          supportPhone: "+91 1800 123 4567",
          contact: {
            supportEmail: "support@hosthaven.com",
            supportPhone: "+91 1800 123 4567",
            supportAddress: "Vijayawada, Andhra Pradesh, India",
            supportHours: "24/7 Customer Support",
            supportCompanyName: "HostHaven Travels Pvt. Ltd.",
          },
          social: {},
        },
      };
    }
  });

  fastify.get(
    `/${config.app.apiVersion}/cms/:audience/:slug`,
    async (request, reply) => {
      const parsed = publicCmsPageParamSchema.safeParse(request.params);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: "Invalid CMS page URL",
          },
        });
      }

      try {
        const page = await adminService.getPublishedCmsPage(
          parsed.data.audience,
          parsed.data.slug,
        );
        return { success: true, data: page };
      } catch (error: any) {
        if (error?.code === ERROR_CODES.RESOURCE_NOT_FOUND) {
          return reply.status(404).send({
            success: false,
            error: {
              code: ERROR_CODES.RESOURCE_NOT_FOUND,
              message: error.message,
            },
          });
        }

        logger.error({ error }, "Failed to fetch public CMS page");
        return reply.status(500).send({
          success: false,
          error: {
            code: ERROR_CODES.INTERNAL_ERROR,
            message: "Failed to fetch CMS page",
          },
        });
      }
    },
  );

  // Public endpoint: expose Razorpay key ID to front-end (key secret never leaves backend)
  fastify.get(
    `/${config.app.apiVersion}/config/payment-key`,
    async (_request, _reply) => {
      return {
        success: true,
        data: {
          keyId: config.razorpay?.keyId || "",
        },
      };
    },
  );

  // Public SEO settings endpoint (no auth required)
  fastify.get(`/${config.app.apiVersion}/seo/settings`, async () => {
    try {
      const seoSettings = await adminService.getPublicSeoSettings();
      return { success: true, data: seoSettings };
    } catch {
      return {
        success: true,
        data: {
          platformName: "HostHaven",
          seo: {
            metaTitle: "HostHaven",
            metaDescription: "Book trusted hotels, homes, and travel experiences with HostHaven.",
            indexable: true,
            canonicalBaseUrl: "https://hosthaven.in",
          },
          social: {},
        },
      };
    }
  });

  // Dynamic sitemap.xml endpoint
  fastify.get("/sitemap.xml", async (_request, reply) => {
    try {
      const sitemapXml = await adminService.generateSitemapXml();
      reply.header("Content-Type", "application/xml");
      reply.header("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
      return reply.send(sitemapXml);
    } catch (error) {
      logger.error({ error }, "Failed to generate sitemap.xml");
      reply.header("Content-Type", "application/xml");
      return reply.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://hosthaven.in/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`);
    }
  });

  // Dynamic robots.txt endpoint
  fastify.get("/robots.txt", async (_request, reply) => {
    try {
      const robotsTxt = await adminService.generateRobotsTxt();
      reply.header("Content-Type", "text/plain");
      reply.header("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
      return reply.send(robotsTxt);
    } catch (error) {
      logger.error({ error }, "Failed to generate robots.txt");
      reply.header("Content-Type", "text/plain");
      return reply.send(`User-agent: *
Allow: /
Sitemap: https://hosthaven.in/sitemap.xml`);
    }
  });

  // API routes
  await fastify.register(authRoutes, {
    prefix: `/${config.app.apiVersion}/auth`,
  });
  await fastify.register(propertiesRoutes, {
    prefix: `/${config.app.apiVersion}/properties`,
  });
  await fastify.register(roomsRoutes, {
    prefix: `/${config.app.apiVersion}/rooms`,
  });
  await fastify.register(templesRoutes, {
    prefix: `/${config.app.apiVersion}/temples`,
  });
  await fastify.register(bookingsRoutes, {
    prefix: `/${config.app.apiVersion}/bookings`,
  });
  await fastify.register(paymentsRoutes, {
    prefix: `/${config.app.apiVersion}/payments`,
  });
  await fastify.register(reviewsRoutes, {
    prefix: `/${config.app.apiVersion}/reviews`,
  });
  await fastify.register(wishlistRoutes, {
    prefix: `/${config.app.apiVersion}/wishlist`,
  });
  await fastify.register(vendorRoutes, {
    prefix: `/${config.app.apiVersion}/vendor`,
  });
  await fastify.register(adminRoutes, {
    prefix: `/${config.app.apiVersion}/admin`,
  });
  await fastify.register(uploadsRoutes, {
    prefix: `/${config.app.apiVersion}/uploads`,
  });
  await fastify.register(notificationsRoutes, {
    prefix: `/${config.app.apiVersion}/notifications`,
  });
  await fastify.register(servicesRoutes, {
    prefix: `/${config.app.apiVersion}/services`,
  });
  await fastify.register(inventoryRoutes, {
    prefix: `/${config.app.apiVersion}/inventory`,
  });
  await fastify.register(supportRoutes, {
    prefix: `/${config.app.apiVersion}/support`,
  });
  await fastify.register(couponsRoutes, {
    prefix: `/${config.app.apiVersion}/coupons`,
  });
  await fastify.register(pushRoutes, { prefix: `/${config.app.apiVersion}` });

  // Root path - Show access restricted page
  fastify.get('/', async (_request, reply) => {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Access Restricted | HostHaven</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      overflow: hidden;
    }
    .container {
      text-align: center;
      padding: 2rem;
      position: relative;
      z-index: 10;
    }
    .lock-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 2rem;
      position: relative;
    }
    .lock-body {
      width: 50px;
      height: 40px;
      background: linear-gradient(135deg, #eab308 0%, #f59e0b 100%);
      border-radius: 8px;
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      animation: lockBounce 2s ease-in-out infinite;
    }
    .lock-shackle {
      width: 30px;
      height: 35px;
      border: 6px solid #eab308;
      border-bottom: none;
      border-radius: 15px 15px 0 0;
      position: absolute;
      top: 5px;
      left: 50%;
      transform: translateX(-50%);
      animation: shackleMove 2s ease-in-out infinite;
    }
    @keyframes lockBounce {
      0%, 100% { transform: translateX(-50%) translateY(0); }
      50% { transform: translateX(-50%) translateY(-5px); }
    }
    @keyframes shackleMove {
      0%, 100% { top: 5px; }
      50% { top: 10px; }
    }
    h1 {
      color: #fff;
      font-size: 2.5rem;
      margin-bottom: 1rem;
      text-shadow: 0 2px 10px rgba(0,0,0,0.3);
    }
    .message {
      color: #94a3b8;
      font-size: 1.1rem;
      margin-bottom: 2rem;
      max-width: 400px;
    }
    .badge {
      display: inline-block;
      background: rgba(234, 179, 8, 0.2);
      color: #eab308;
      padding: 0.5rem 1.5rem;
      border-radius: 50px;
      font-size: 0.875rem;
      border: 1px solid rgba(234, 179, 8, 0.3);
    }
    .particles {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      z-index: 1;
    }
    .particle {
      position: absolute;
      width: 4px;
      height: 4px;
      background: rgba(234, 179, 8, 0.5);
      border-radius: 50%;
      animation: float 15s infinite;
    }
    .particle:nth-child(1) { left: 10%; animation-delay: 0s; animation-duration: 15s; }
    .particle:nth-child(2) { left: 20%; animation-delay: 2s; animation-duration: 12s; }
    .particle:nth-child(3) { left: 30%; animation-delay: 4s; animation-duration: 18s; }
    .particle:nth-child(4) { left: 40%; animation-delay: 1s; animation-duration: 14s; }
    .particle:nth-child(5) { left: 50%; animation-delay: 3s; animation-duration: 16s; }
    .particle:nth-child(6) { left: 60%; animation-delay: 5s; animation-duration: 13s; }
    .particle:nth-child(7) { left: 70%; animation-delay: 2.5s; animation-duration: 17s; }
    .particle:nth-child(8) { left: 80%; animation-delay: 1.5s; animation-duration: 11s; }
    .particle:nth-child(9) { left: 90%; animation-delay: 3.5s; animation-duration: 19s; }
    @keyframes float {
      0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { transform: translateY(-100vh) rotate(720deg); opacity: 0; }
    }
  </style>
</head>
<body>
  <div class="particles">
    <div class="particle"></div>
    <div class="particle"></div>
    <div class="particle"></div>
    <div class="particle"></div>
    <div class="particle"></div>
    <div class="particle"></div>
    <div class="particle"></div>
    <div class="particle"></div>
    <div class="particle"></div>
  </div>
  <div class="container">
    <div class="lock-icon">
      <div class="lock-shackle"></div>
      <div class="lock-body"></div>
    </div>
    <h1>Access Restricted</h1>
    <p class="message">
      This is a private API endpoint. Direct access is not allowed.<br>
      Please visit our main website to book your stay.
    </p>
    <span class="badge">🔒 Private Endpoint</span>
  </div>
</body>
</html>`;
    
    reply.header('Content-Type', 'text/html');
    return reply.send(html);
  });

  // Error handlers
  fastify.setErrorHandler(errorHandler);
  fastify.setNotFoundHandler(notFoundHandler);

  return fastify;
};

export default buildApp;
