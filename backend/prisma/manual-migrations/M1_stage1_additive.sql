-- ============================================================================
-- M1 · Stage 1 — Additive schema reconciliation
-- ============================================================================
--
-- Brings the production database up to the columns and tables the Prisma schema
-- already expects. STAGE 1 IS ADDITIVE ONLY: it creates missing tables, adds
-- missing columns (all nullable or defaulted), creates missing enum types, and
-- adds indexes. It does not drop, rename, or retype anything, so it cannot lose
-- data and re-running it is harmless (every statement is guarded).
--
-- WHAT THIS FIXES IMMEDIATELY
--   • vendors.applicationStatus  — the missing column that 401s every vendor
--     request and produces the vendor login bounce-loop.
--   • payouts.* + updatedAt      — payout create/approve/pay all fail today
--     because @updatedAt writes a column prod lacks.
--   • commission_ledger.*        — commission recording currently throws on
--     every payment, so no vendor liability is written.
--   • coupons / coupon_usages    — any booking with a coupon 500s.
--   • the remaining feature tables the admin panel reads.
--
-- WHAT THIS DELIBERATELY DOES NOT DO (deferred to Stage 2, needs backfill)
--   • payouts.status  text 'pending' -> PayoutStatus enum 'PENDING'
--   • properties.city / temples.city  City enum -> text
--   • admin_logs  make the legacy `entity` column nullable (its NOT NULL with
--     no default currently breaks every Prisma insert)
--   • services.slug  add UNIQUE + NOT NULL after backfilling slugs
--   • ServiceBookingStatus  add the PENDING value (see note at end — cannot run
--     inside a transaction)
--
-- BEFORE RUNNING (the database is the Postgres instance on the VPS — run these
-- ON the VPS, where it is reachable as localhost)
--   1. Take a backup and confirm it restores:
--        pg_dump "$DATABASE_URL" -Fc -f hosthaven_pre_M1_$(date +%F).dump
--   2. Validate this file against the live schema:
--        cd /var/www/hosthaven/backend
--        npx prisma migrate diff \
--          --from-url "$DATABASE_URL" \
--          --to-schema-datamodel prisma/schema.prisma --script
--      Everything in Stage 1 below should appear in that diff. Anything in the
--      diff that is a DROP or a type change belongs to Stage 2 — do not run it
--      here.
--   3. Run inside a transaction:
--        psql "$DATABASE_URL" -1 -f backend/prisma/manual-migrations/M1_stage1_additive.sql
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Enum types (guarded — Postgres has no CREATE TYPE IF NOT EXISTS)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "VendorApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Created now so Stage 2 can convert payouts.status onto it.
DO $$ BEGIN
  CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'REJECTED', 'COMPLETED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- Missing tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "coupons" (
  "id"                   TEXT PRIMARY KEY,
  "code"                 TEXT NOT NULL,
  "description"          TEXT,
  "discountType"         "DiscountType" NOT NULL DEFAULT 'PERCENTAGE',
  "discountValue"        DECIMAL(10,2) NOT NULL,
  "minBookingAmount"     DECIMAL(10,2),
  "maxDiscountAmount"    DECIMAL(10,2),
  "usageLimit"           INTEGER,
  "usageCount"           INTEGER NOT NULL DEFAULT 0,
  "perUserLimit"         INTEGER NOT NULL DEFAULT 1,
  "validFrom"            TIMESTAMP(3) NOT NULL,
  "validUntil"           TIMESTAMP(3) NOT NULL,
  "isActive"             BOOLEAN NOT NULL DEFAULT true,
  "applicableProperties" TEXT[] NOT NULL DEFAULT '{}',
  "applicableCities"     TEXT[] NOT NULL DEFAULT '{}',
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "coupons_code_key" ON "coupons"("code");
CREATE INDEX IF NOT EXISTS "coupons_code_idx" ON "coupons"("code");
CREATE INDEX IF NOT EXISTS "coupons_isActive_idx" ON "coupons"("isActive");

CREATE TABLE IF NOT EXISTS "coupon_usages" (
  "id"             TEXT PRIMARY KEY,
  "couponId"       TEXT NOT NULL,
  "userId"         TEXT NOT NULL,
  "bookingId"      TEXT,
  "discountAmount" DECIMAL(10,2) NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "coupon_usages_couponId_userId_key" ON "coupon_usages"("couponId", "userId");
CREATE INDEX IF NOT EXISTS "coupon_usages_userId_idx" ON "coupon_usages"("userId");
CREATE INDEX IF NOT EXISTS "coupon_usages_couponId_idx" ON "coupon_usages"("couponId");

CREATE TABLE IF NOT EXISTS "platform_cities" (
  "id"        TEXT PRIMARY KEY,
  "name"      TEXT NOT NULL,
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "platform_cities_name_key" ON "platform_cities"("name");

CREATE TABLE IF NOT EXISTS "platform_amenities" (
  "id"        TEXT PRIMARY KEY,
  "name"      TEXT NOT NULL,
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "platform_amenities_name_key" ON "platform_amenities"("name");

CREATE TABLE IF NOT EXISTS "email_templates" (
  "id"        TEXT PRIMARY KEY,
  "name"      TEXT NOT NULL,
  "subject"   TEXT NOT NULL,
  "html"      TEXT NOT NULL,
  "text"      TEXT NOT NULL,
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "email_templates_name_key" ON "email_templates"("name");
CREATE INDEX IF NOT EXISTS "email_templates_name_isActive_idx" ON "email_templates"("name", "isActive");

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id"         TEXT PRIMARY KEY,
  "userId"     TEXT,
  "userName"   TEXT,
  "userEmail"  TEXT,
  "action"     TEXT NOT NULL,
  "resource"   TEXT NOT NULL,
  "resourceId" TEXT,
  "changes"    JSONB,
  "ipAddress"  TEXT,
  "timestamp"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "audit_logs_userId_idx" ON "audit_logs"("userId");
CREATE INDEX IF NOT EXISTS "audit_logs_resource_idx" ON "audit_logs"("resource");
CREATE INDEX IF NOT EXISTS "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

CREATE TABLE IF NOT EXISTS "error_logs" (
  "id"        TEXT PRIMARY KEY,
  "level"     TEXT NOT NULL,
  "message"   TEXT NOT NULL,
  "stack"     TEXT,
  "source"    TEXT,
  "userId"    TEXT,
  "requestId" TEXT,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolved"  BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS "error_logs_level_idx" ON "error_logs"("level");
CREATE INDEX IF NOT EXISTS "error_logs_timestamp_idx" ON "error_logs"("timestamp");
CREATE INDEX IF NOT EXISTS "error_logs_resolved_idx" ON "error_logs"("resolved");

-- Transactional outbox: post-payment side effects are enqueued in the same
-- transaction as the payment and executed by a worker with retry.
CREATE TABLE IF NOT EXISTS "outbox_events" (
  "id"          TEXT PRIMARY KEY,
  "type"        TEXT NOT NULL,
  "payload"     JSONB NOT NULL,
  "status"      TEXT NOT NULL DEFAULT 'PENDING',
  "attempts"    INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 5,
  "lastError"   TEXT,
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "outbox_events_status_availableAt_idx"
  ON "outbox_events"("status", "availableAt");

CREATE TABLE IF NOT EXISTS "broadcast_notifications" (
  "id"             TEXT PRIMARY KEY,
  "title"          TEXT NOT NULL,
  "message"        TEXT NOT NULL,
  "targetAudience" TEXT NOT NULL,
  "status"         TEXT NOT NULL,
  "scheduledAt"    TIMESTAMP(3),
  "sentAt"         TIMESTAMP(3),
  "createdBy"      TEXT NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "broadcast_notifications_status_idx" ON "broadcast_notifications"("status");
CREATE INDEX IF NOT EXISTS "broadcast_notifications_targetAudience_idx" ON "broadcast_notifications"("targetAudience");

-- ---------------------------------------------------------------------------
-- vendors — unblocks the vendor login loop and the approval pipeline
-- ---------------------------------------------------------------------------
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "applicationStatus" "VendorApplicationStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMP(3);
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "registrationFeePaid" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "registrationPaymentId" TEXT;
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "registrationPaidAt" TIMESTAMP(3);
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "businessDocuments" JSONB;
CREATE INDEX IF NOT EXISTS "vendors_applicationStatus_idx" ON "vendors"("applicationStatus");

-- Existing approved vendors should stay approved rather than reverting to the
-- PENDING default. Adjust the WHERE clause to match your prod status column.
UPDATE "vendors" SET "applicationStatus" = 'APPROVED'
  WHERE "applicationStatus" = 'PENDING' AND "isApproved" = true;

-- ---------------------------------------------------------------------------
-- payouts — every write fails today because @updatedAt targets a missing column
-- ---------------------------------------------------------------------------
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "bankName" TEXT;
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "bankAccount" TEXT;
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "ifscCode" TEXT;
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "upiId" TEXT;
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "upiQrCode" TEXT;
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "paymentScreenshot" TEXT;
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "vendorVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "vendorVerifiedAt" TIMESTAMP(3);
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "vendorNotes" TEXT;
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "processedBy" TEXT;
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ---------------------------------------------------------------------------
-- commission_ledger — commission recording throws on every payment today
-- ---------------------------------------------------------------------------
ALTER TABLE "commission_ledger" ADD COLUMN IF NOT EXISTS "serviceBookingId" TEXT;
ALTER TABLE "commission_ledger" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE UNIQUE INDEX IF NOT EXISTS "commission_ledger_serviceBookingId_key" ON "commission_ledger"("serviceBookingId");

-- ---------------------------------------------------------------------------
-- users — 2FA + notification preferences
-- ---------------------------------------------------------------------------
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "twoFactorSecret" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "twoFactorBackupCodes" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailNotifications" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "smsNotifications" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "pushNotifications" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bookingNotifications" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "paymentNotifications" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reviewNotifications" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "promotionalNotifications" BOOLEAN NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------------
-- bookings — guestPhone is written unconditionally; taxPercent is read on every load
-- ---------------------------------------------------------------------------
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "taxPercent" DECIMAL(5,2) NOT NULL DEFAULT 0;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "guestPhone" TEXT;

-- ---------------------------------------------------------------------------
-- services — slug added NULLABLE here; the UNIQUE + NOT NULL is a Stage 2 step
-- after slugs are backfilled.
-- ---------------------------------------------------------------------------
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "locations" TEXT[] NOT NULL DEFAULT '{}';

-- ---------------------------------------------------------------------------
-- platform_settings, rooms, notifications
-- ---------------------------------------------------------------------------
ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "vendorRegistrationFee" DECIMAL(10,2);
ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "allowedCities" TEXT[] NOT NULL DEFAULT ARRAY['VETLAPALEM','VIJAYAWADA','NANDIYALA'];
ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "defaultState" TEXT NOT NULL DEFAULT 'Andhra Pradesh';

ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "video" TEXT;

ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "isForAdmin" BOOLEAN NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------------
-- admin_logs — add the new columns Prisma expects. The legacy `entity` column
-- (NOT NULL, no default) still blocks inserts and is handled in Stage 2.
-- ---------------------------------------------------------------------------
ALTER TABLE "admin_logs" ADD COLUMN IF NOT EXISTS "entityType" TEXT;
ALTER TABLE "admin_logs" ADD COLUMN IF NOT EXISTS "details" JSONB;
ALTER TABLE "admin_logs" ADD COLUMN IF NOT EXISTS "ipAddress" TEXT;
ALTER TABLE "admin_logs" ADD COLUMN IF NOT EXISTS "userAgent" TEXT;

COMMIT;

-- ============================================================================
-- RUN SEPARATELY — NOT inside the transaction above
-- ============================================================================
-- ALTER TYPE ... ADD VALUE cannot run in a transaction block. Service booking
-- creation sets status 'PENDING', which prod's ServiceBookingStatus enum lacks,
-- so run this on its own before service bookings are created:
--
--   ALTER TYPE "ServiceBookingStatus" ADD VALUE IF NOT EXISTS 'PENDING';
--
-- (Placed here rather than above so the transactional block stays valid.)
