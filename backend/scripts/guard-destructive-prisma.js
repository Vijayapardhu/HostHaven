#!/usr/bin/env node
/**
 * Refuses to run Prisma commands that rewrite or reset the database.
 *
 * DATABASE_URL in this project points at the live production Supabase
 * instance, and `prisma migrate dev` / `prisma db push` will alter or drop
 * production data without a confirmation prompt. Schema changes go out as
 * reviewed SQL instead — see the Phase 3 roadmap, milestone M1.
 *
 * `prisma migrate deploy` is unaffected: it only applies migrations that have
 * already been reviewed and committed.
 */

const COMMANDS = {
  'migrate-dev': 'prisma migrate dev',
  'db-push': 'prisma db push',
};

const requested = process.argv[2];
const label = COMMANDS[requested] || requested || 'this command';

console.error(`
  Refusing to run "${label}".

  DATABASE_URL points at the production database. This command rewrites the
  schema in place and can drop columns and tables without confirmation.

  To change the schema:
    1. Confirm a restorable backup exists (Supabase PITR or pg_dump).
    2. Write the DDL as a reviewed migration.
    3. Apply it with "npm run prisma:migrate:deploy".

  If you are genuinely on a disposable local database, run the Prisma command
  directly with an explicit DATABASE_URL rather than through this script.
`);

process.exit(1);
