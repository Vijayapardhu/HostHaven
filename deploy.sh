#!/bin/bash
set -e

cd /var/www/hosthaven

echo "=== Pulling latest code ==="
git pull origin main

echo "=== Building Backend ==="
cd backend
npm install
# Keep the Prisma client and the database schema in sync with schema.prisma
# (prevents "column ... does not exist" runtime errors after schema changes).
npx prisma generate
npx prisma db push
npm run build
pm2 restart hosthaven-backend

echo "=== Building Frontend ==="
cd ../frontend
npm install
npm run build

echo "=== Building Admin ==="
cd ../admin
npm install
npm run build

echo "=== Building Vendor ==="
cd ../vendor
npm install
npm run build

echo "=== Done ==="
