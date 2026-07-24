#!/bin/bash
# ============================================================================
# M1 database reconciliation — VPS runbook
# ============================================================================
#
# Runs the whole M1 sequence against the local Postgres on this VPS, stopping
# for an explicit confirmation before every step that writes. Safe to re-run:
# both migration stages are idempotent, and an abort at any gate leaves the
# database exactly as it was.
#
# Usage (on the VPS):
#   cd /var/www/hosthaven
#   bash backend/prisma/manual-migrations/run-M1-on-vps.sh
#
# Requires: psql, pg_dump, node/npx (for the prisma diff), DATABASE_URL in
# backend/.env.
# ============================================================================

set -euo pipefail

MIGRATIONS_DIR="backend/prisma/manual-migrations"
STAMP=$(date +%F_%H%M)
BACKUP_DIR="${HOME}/hosthaven-backups"

if [ ! -f "${MIGRATIONS_DIR}/M1_stage1_additive.sql" ]; then
  echo "Run this from the repo root (/var/www/hosthaven)." >&2
  exit 1
fi

# DATABASE_URL from backend/.env without exporting everything in it.
DATABASE_URL=$(grep -E '^DATABASE_URL=' backend/.env | head -1 | cut -d= -f2- | tr -d '"')
if [ -z "${DATABASE_URL}" ]; then
  echo "DATABASE_URL not found in backend/.env" >&2
  exit 1
fi

confirm() {
  # $1: prompt. Aborts the script unless the operator types exactly "yes".
  echo ""
  read -r -p "$1  Type 'yes' to continue: " answer
  if [ "${answer}" != "yes" ]; then
    echo "Aborted. Nothing further was run."
    exit 1
  fi
}

echo "============================================================"
echo " Step 1/7 · Backups (database + uploaded media)"
echo "============================================================"
mkdir -p "${BACKUP_DIR}"
pg_dump "${DATABASE_URL}" -Fc -f "${BACKUP_DIR}/hosthaven_pre_M1_${STAMP}.dump"
echo "Database backup: ${BACKUP_DIR}/hosthaven_pre_M1_${STAMP}.dump ($(du -h "${BACKUP_DIR}/hosthaven_pre_M1_${STAMP}.dump" | cut -f1))"

UPLOAD_DIR=$(grep -E '^UPLOAD_DIR=' backend/.env | head -1 | cut -d= -f2- | tr -d '"')
UPLOAD_DIR=${UPLOAD_DIR:-backend/uploads}
if [ -d "${UPLOAD_DIR}" ]; then
  tar -czf "${BACKUP_DIR}/hosthaven_uploads_${STAMP}.tar.gz" -C "$(dirname "${UPLOAD_DIR}")" "$(basename "${UPLOAD_DIR}")"
  echo "Uploads backup:  ${BACKUP_DIR}/hosthaven_uploads_${STAMP}.tar.gz"
else
  echo "Uploads dir ${UPLOAD_DIR} not present yet — skipping media backup."
fi

# Prove the dump restores structurally before touching anything.
pg_restore --list "${BACKUP_DIR}/hosthaven_pre_M1_${STAMP}.dump" > /dev/null
echo "Backup verified readable by pg_restore."

echo ""
echo "============================================================"
echo " Step 2/7 · Schema diff (read-only) — REVIEW THIS"
echo "============================================================"
(cd backend && npx prisma migrate diff \
  --from-url "${DATABASE_URL}" \
  --to-schema-datamodel prisma/schema.prisma \
  --script) | tee "${BACKUP_DIR}/M1_diff_${STAMP}.sql" || {
    echo "prisma migrate diff failed — investigate before continuing." >&2
    exit 1
  }
echo ""
echo "Diff saved to ${BACKUP_DIR}/M1_diff_${STAMP}.sql."
echo "Everything the diff shows should correspond to stage 1 + stage 2."
echo "If it shows a DROP or type change NOT covered in stage 2, STOP and share it."

confirm "Reviewed the diff, and it matches the two stage files?"

echo ""
echo "============================================================"
echo " Step 3/7 · Stage 2 pre-flight checks (must all be empty)"
echo "============================================================"
psql "${DATABASE_URL}" -c "SELECT DISTINCT status FROM payouts WHERE UPPER(status) NOT IN ('PENDING','APPROVED','PAID','REJECTED','COMPLETED','FAILED');"
psql "${DATABASE_URL}" -c "SELECT id, name FROM services WHERE name IS NULL OR name = '';"
psql "${DATABASE_URL}" -c "SELECT \"vendorId\", COUNT(*) FROM payouts WHERE UPPER(status) IN ('PENDING','APPROVED') GROUP BY \"vendorId\" HAVING COUNT(*) > 1;"

confirm "All three pre-flight queries returned zero rows?"

echo ""
echo "============================================================"
echo " Step 4/7 · Apply Stage 1 (additive)"
echo "============================================================"
confirm "Apply M1_stage1_additive.sql to the PRODUCTION database?"
psql "${DATABASE_URL}" -1 -v ON_ERROR_STOP=1 -f "${MIGRATIONS_DIR}/M1_stage1_additive.sql"
echo "Stage 1 applied."

echo ""
echo "============================================================"
echo " Step 5/7 · ServiceBookingStatus PENDING (non-transactional)"
echo "============================================================"
psql "${DATABASE_URL}" -c "ALTER TYPE \"ServiceBookingStatus\" ADD VALUE IF NOT EXISTS 'PENDING';"
echo "Enum value ensured."

echo ""
echo "============================================================"
echo " Step 6/7 · Apply Stage 2 (transformative)"
echo "============================================================"
confirm "Apply M1_stage2_transformative.sql to the PRODUCTION database?"
psql "${DATABASE_URL}" -1 -v ON_ERROR_STOP=1 -f "${MIGRATIONS_DIR}/M1_stage2_transformative.sql"
echo "Stage 2 applied."

echo ""
echo "============================================================"
echo " Step 7/7 · Verify + commission backfill dry-run report"
echo "============================================================"
echo "Post-migration diff (should be empty bar the kept legacy admin_logs columns):"
(cd backend && npx prisma migrate diff \
  --from-url "${DATABASE_URL}" \
  --to-schema-datamodel prisma/schema.prisma \
  --script) | tee "${BACKUP_DIR}/M1_postdiff_${STAMP}.sql"

psql "${DATABASE_URL}" -f "${MIGRATIONS_DIR}/M1_backfill_dryrun_report.sql" \
  | tee "${BACKUP_DIR}/M1_backfill_report_${STAMP}.txt"

echo ""
echo "============================================================"
echo " DONE — nothing further runs automatically."
echo "============================================================"
echo "Share these two files for review before any further step:"
echo "  ${BACKUP_DIR}/M1_postdiff_${STAMP}.sql"
echo "  ${BACKUP_DIR}/M1_backfill_report_${STAMP}.txt"
echo ""
echo "The commission backfill (M1_backfill_apply.sql) is NOT run by this"
echo "script — it runs only after the report's totals are reconciled."
echo ""
echo "Then: restart the backend (pm2 restart hosthaven-backend) and test"
echo "vendor login, one payment, and one payout end-to-end."
