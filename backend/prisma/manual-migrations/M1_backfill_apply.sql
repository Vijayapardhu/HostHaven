-- ============================================================================
-- M1 · Commission-ledger backfill — APPLY
-- ============================================================================
--
-- Inserts the commission entries that were never recorded while the schema
-- drift broke calculateCommission. Inserts EXACTLY the rows §2 of the dry-run
-- report listed: bookings with a COMPLETED payment and no ledger row.
--
--   • Refunded / partially refunded payments are NOT touched — §3 of the
--     report lists them for a human decision.
--   • Commission maths mirrors adminService.calculateCommission: commission =
--     round(totalAmount × vendor rate ÷ 100, 2), earning = total − commission.
--   • Entries are backdated to the payment date so payout period ranges
--     stay truthful. payoutId stays NULL — the next payout run picks them up.
--   • Idempotent: the anti-join makes a re-run insert nothing.
--
-- RUN ONLY AFTER the dry-run report has been reviewed and its §1 totals
-- reconciled against Razorpay settlement:
--
--   psql "$DATABASE_URL" -1 -f backend/prisma/manual-migrations/M1_backfill_apply.sql
-- ============================================================================

BEGIN;

INSERT INTO "commission_ledger" (
  "id",
  "bookingId",
  "vendorId",
  "bookingAmount",
  "commissionRate",
  "commissionAmount",
  "vendorEarning",
  "payoutId",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  b."id",
  v."id",
  b."totalAmount",
  v."commissionRate",
  ROUND(b."totalAmount" * v."commissionRate" / 100, 2),
  b."totalAmount" - ROUND(b."totalAmount" * v."commissionRate" / 100, 2),
  NULL,
  pay."createdAt",
  CURRENT_TIMESTAMP
FROM "bookings" b
JOIN "payments"  pay ON pay."bookingId" = b."id" AND pay."status" = 'COMPLETED'
JOIN "properties" pr ON pr."id" = b."propertyId"
JOIN "vendors"    v  ON v."id" = pr."vendorId"
LEFT JOIN "commission_ledger" cl ON cl."bookingId" = b."id"
WHERE cl."id" IS NULL;

-- Post-check: how many rows were written, and the new unpaid totals per
-- vendor (what the next payout run will offer).
\echo '=== Inserted entries and resulting unpaid earnings per vendor ==='
SELECT
  v."businessName",
  COUNT(*)                 AS unpaid_entries,
  SUM(cl."vendorEarning")  AS unpaid_earnings
FROM "commission_ledger" cl
JOIN "vendors" v ON v."id" = cl."vendorId"
WHERE cl."payoutId" IS NULL
GROUP BY v."businessName"
ORDER BY unpaid_earnings DESC;

COMMIT;
