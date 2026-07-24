-- ============================================================================
-- M1 · Commission-ledger backfill — DRY-RUN REPORT (read-only)
-- ============================================================================
--
-- Context: commission recording has been throwing on every payment for the
-- entire schema-drift window, so vendors have completed, paid bookings with no
-- commission_ledger row — meaning they were never owed a payout for them.
--
-- This file only SELECTs. Run it on the VPS after Stage 1 + Stage 2:
--
--   psql "$DATABASE_URL" -f backend/prisma/manual-migrations/M1_backfill_dryrun_report.sql \
--     > backfill_report_$(date +%F).txt
--
-- Review the output (especially §4's grand total against your Razorpay
-- settlement figures) BEFORE running M1_backfill_apply.sql.
-- ============================================================================

\echo '=== 1. Summary: completed payments missing a commission entry ==='

SELECT
  COUNT(*)                                     AS missing_entries,
  MIN(pay."createdAt")::date                   AS earliest_payment,
  MAX(pay."createdAt")::date                   AS latest_payment,
  SUM(b."totalAmount")                         AS gross_booking_value,
  SUM(ROUND(b."totalAmount" * v."commissionRate" / 100, 2))          AS commission_owed_to_platform,
  SUM(b."totalAmount" - ROUND(b."totalAmount" * v."commissionRate" / 100, 2)) AS earnings_owed_to_vendors
FROM "bookings" b
JOIN "payments"  pay ON pay."bookingId" = b."id" AND pay."status" = 'COMPLETED'
JOIN "properties" pr ON pr."id" = b."propertyId"
JOIN "vendors"    v  ON v."id" = pr."vendorId"
LEFT JOIN "commission_ledger" cl ON cl."bookingId" = b."id"
WHERE cl."id" IS NULL;

\echo ''
\echo '=== 2. Detail: every row the apply script would insert ==='

SELECT
  b."bookingNumber",
  pay."createdAt"::date                        AS paid_on,
  v."businessName"                             AS vendor,
  b."status"                                   AS booking_status,
  b."totalAmount"                              AS booking_amount,
  v."commissionRate"                           AS rate_pct,
  ROUND(b."totalAmount" * v."commissionRate" / 100, 2)               AS commission,
  b."totalAmount" - ROUND(b."totalAmount" * v."commissionRate" / 100, 2) AS vendor_earning
FROM "bookings" b
JOIN "payments"  pay ON pay."bookingId" = b."id" AND pay."status" = 'COMPLETED'
JOIN "properties" pr ON pr."id" = b."propertyId"
JOIN "vendors"    v  ON v."id" = pr."vendorId"
LEFT JOIN "commission_ledger" cl ON cl."bookingId" = b."id"
WHERE cl."id" IS NULL
ORDER BY pay."createdAt";

\echo ''
\echo '=== 3. Manual review: refunded / partially refunded, NOT auto-backfilled ==='
\echo '(a fully refunded booking earns the vendor nothing; a partial refund'
\echo ' needs a human decision on the apportionment)'

SELECT
  b."bookingNumber",
  pay."status"                                 AS payment_status,
  pay."createdAt"::date                        AS paid_on,
  v."businessName"                             AS vendor,
  b."totalAmount"                              AS booking_amount,
  COALESCE(SUM(r."amount"), 0)                 AS refunded_amount
FROM "bookings" b
JOIN "payments"  pay ON pay."bookingId" = b."id"
  AND pay."status" IN ('REFUNDED', 'PARTIALLY_REFUNDED')
JOIN "properties" pr ON pr."id" = b."propertyId"
JOIN "vendors"    v  ON v."id" = pr."vendorId"
LEFT JOIN "refunds" r ON r."paymentId" = pay."id"
LEFT JOIN "commission_ledger" cl ON cl."bookingId" = b."id"
WHERE cl."id" IS NULL
GROUP BY b."bookingNumber", pay."status", pay."createdAt", v."businessName", b."totalAmount"
ORDER BY pay."createdAt";

\echo ''
\echo '=== 4. Reconciliation: total captured per month (compare to Razorpay settlement) ==='

SELECT
  date_trunc('month', pay."createdAt")::date   AS month,
  COUNT(*)                                     AS completed_payments,
  SUM(pay."amount")                            AS captured_amount
FROM "payments" pay
WHERE pay."status" = 'COMPLETED'
GROUP BY 1
ORDER BY 1;

\echo ''
\echo '=== 5. Service bookings with advance paid and no ledger entry (info only) ==='

SELECT
  sb."bookingNumber",
  sb."serviceName",
  sb."status",
  sb."advanceAmount",
  sb."totalAmount"
FROM "service_bookings" sb
LEFT JOIN "commission_ledger" cl ON cl."serviceBookingId" = sb."id"
WHERE sb."status" IN ('ADVANCE_PAID', 'CONFIRMED', 'COMPLETED')
  AND cl."id" IS NULL
ORDER BY sb."createdAt";
