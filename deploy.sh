#!/bin/bash
set -e

cd /var/www/hosthaven

# Restore the execute bit on locally-installed CLIs (vite, tsc, prisma, …).
# npm install can drop it on this filesystem, which breaks the builds with
# "vite: Permission denied".
fix_bin() {
  chmod +x node_modules/.bin/* 2>/dev/null || true
}

echo "=== Pulling latest code ==="
git pull origin main

echo "=== Building Backend ==="
cd backend
npm install
fix_bin
# Keep the Prisma client and the database schema in sync with schema.prisma
# (prevents "column ... does not exist" runtime errors after schema changes).
npx prisma generate
npx prisma db push
npm run build
pm2 restart hosthaven-backend

echo "=== Building Frontend ==="
cd ../frontend
npm install
fix_bin
npm run build

echo "=== Building Admin ==="
cd ../admin
npm install
fix_bin
npm run build

echo "=== Building Vendor ==="
cd ../vendor
npm install
fix_bin
npm run build

echo "=== Done ==="
