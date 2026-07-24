-- ============================================================================
-- M1 · Stage 2 — Transformative schema reconciliation
-- ============================================================================
--
-- Run ONLY after Stage 1 (M1_stage1_additive.sql) has been applied and
-- verified. Unlike Stage 1, these statements CHANGE existing columns — each
-- section backfills data first, and a failure anywhere aborts the whole
-- transaction, leaving the database untouched.
--
-- Column types and constraints below were verified against the production
-- schema dump (supabase_dump.sql, pulled from the VPS):
--   payouts.status            text DEFAULT 'pending' NOT NULL   -> PayoutStatus enum
--   properties.city           "City" enum NOT NULL              -> text
--   temples.city              "City" enum NOT NULL              -> text
--   admin_logs.entity         text NOT NULL (legacy)            -> nullable
--   admin_logs.entityId       text NOT NULL                     -> nullable
--   commission_ledger.bookingId  text NOT NULL                  -> nullable
--   support_tickets.userId       text NOT NULL                  -> nullable
--   services.slug             added nullable in Stage 1         -> backfilled + UNIQUE NOT NULL
--
-- BEFORE RUNNING (on the VPS):
--   1. Fresh backup:  pg_dump "$DATABASE_URL" -Fc -f hosthaven_pre_M1s2_$(date +%F).dump
--   2. Pre-flight checks — every one of these must return zero rows:
--        SELECT DISTINCT status FROM payouts
--          WHERE UPPER(status) NOT IN ('PENDING','APPROVED','PAID','REJECTED','COMPLETED','FAILED');
--        SELECT id, name FROM services WHERE name IS NULL OR name = '';
--        -- vendors with more than one open payout (violates the new index):
--        SELECT "vendorId", COUNT(*) FROM payouts
--          WHERE UPPER(status) IN ('PENDING','APPROVED')
--          GROUP BY "vendorId" HAVING COUNT(*) > 1;
--   3. Apply:  psql "$DATABASE_URL" -1 -f backend/prisma/manual-migrations/M1_stage2_transformative.sql
--   4. Afterwards, from backend/:  npx prisma migrate diff --from-url "$DATABASE_URL" \
--        --to-schema-datamodel prisma/schema.prisma --script
--      should report nothing beyond intentionally-kept legacy columns
--      (admin_logs.entity / admin_logs.meta).
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1 · payouts.status: lowercase text -> PayoutStatus enum
--     The enum type itself was created in Stage 1. Existing rows hold
--     lowercase values ('pending'), which fail Prisma enum deserialization.
-- ---------------------------------------------------------------------------
UPDATE "payouts" SET "status" = UPPER("status") WHERE "status" <> UPPER("status");

ALTER TABLE "payouts" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "payouts"
  ALTER COLUMN "status" TYPE "PayoutStatus" USING ("status"::"PayoutStatus");
ALTER TABLE "payouts" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- One open (PENDING/APPROVED) payout per vendor at a time. This closes the
-- read-then-write race where a concurrent admin payout and vendor request
-- both selected the same unpaid earnings — the second insert now fails and
-- the application returns "a payout is already open".
CREATE UNIQUE INDEX IF NOT EXISTS "payouts_one_open_per_vendor_key"
  ON "payouts"("vendorId")
  WHERE "status" IN ('PENDING', 'APPROVED');

-- ---------------------------------------------------------------------------
-- 2 · properties.city / temples.city: "City" enum -> text
--     Prisma declares String; the 4-value enum is why city filtering broke
--     for any value outside VIJAYAWADA / NANDIYALA / VETLAPALEM / TIRUPATI.
--     Existing values are preserved verbatim as text.
-- ---------------------------------------------------------------------------
ALTER TABLE "properties" ALTER COLUMN "city" TYPE TEXT USING ("city"::text);
ALTER TABLE "temples"    ALTER COLUMN "city" TYPE TEXT USING ("city"::text);

-- The enum type is now unreferenced; drop it so future diffs stay clean.
DROP TYPE IF EXISTS "City";

-- Seed the city catalogue (created in Stage 1) from every city in use plus
-- the platform defaults, so admin city management starts populated.
INSERT INTO "platform_cities" ("id", "name", "isActive")
SELECT gen_random_uuid()::text, c.name, true
FROM (
  SELECT DISTINCT "city" AS name FROM "properties" WHERE "city" IS NOT NULL
  UNION
  SELECT DISTINCT "city" FROM "temples" WHERE "city" IS NOT NULL
  UNION
  SELECT unnest(ARRAY['VIJAYAWADA','NANDIYALA','VETLAPALEM','TIRUPATI'])
) c
ON CONFLICT ("name") DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3 · admin_logs: reconcile the legacy shape
--     Prisma writes entityType/details and never sends entity/meta, so the
--     legacy NOT NULLs block every insert. Data is copied across and the
--     legacy columns kept (nullable) for history — they can be dropped in a
--     later cleanup once the audit trail is verified.
-- ---------------------------------------------------------------------------
UPDATE "admin_logs" SET "entityType" = COALESCE("entityType", "entity");
UPDATE "admin_logs" SET "details"    = COALESCE("details", "meta");

ALTER TABLE "admin_logs" ALTER COLUMN "entity"   DROP NOT NULL;
ALTER TABLE "admin_logs" ALTER COLUMN "entityId" DROP NOT NULL;

-- ---------------------------------------------------------------------------
-- 4 · Nullability reconciliation
--     commission_ledger rows may reference a service booking instead of a
--     stay booking; support tickets may come from the anonymous contact form.
-- ---------------------------------------------------------------------------
ALTER TABLE "commission_ledger" ALTER COLUMN "bookingId" DROP NOT NULL;
ALTER TABLE "support_tickets"   ALTER COLUMN "userId"    DROP NOT NULL;

-- ---------------------------------------------------------------------------
-- 5 · services.slug: backfill, then enforce UNIQUE NOT NULL
--     Added nullable in Stage 1. Slugs derive from the name; an id fragment
--     guarantees uniqueness for duplicate names.
-- ---------------------------------------------------------------------------
UPDATE "services"
SET "slug" = trim(BOTH '-' FROM regexp_replace(lower("name"), '[^a-z0-9]+', '-', 'g'))
             || '-' || substr("id", 1, 8)
WHERE "slug" IS NULL OR "slug" = '';

CREATE UNIQUE INDEX IF NOT EXISTS "services_slug_key" ON "services"("slug");
ALTER TABLE "services" ALTER COLUMN "slug" SET NOT NULL;

COMMIT;

-- ============================================================================
-- REMINDER — if not already run after Stage 1 (cannot run in a transaction):
--
--   ALTER TYPE "ServiceBookingStatus" ADD VALUE IF NOT EXISTS 'PENDING';
--
-- Service-booking creation sets status 'PENDING' and will fail until this
-- value exists.
-- ============================================================================
