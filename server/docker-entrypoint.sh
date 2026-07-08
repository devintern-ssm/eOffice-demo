#!/bin/sh
set -e

echo "[eoffice] Applying database migrations (prisma migrate deploy)..."
npx prisma migrate deploy

# Optional first-boot seed. The seed inserts demo users with a well-known password,
# so it is OFF by default — enable only for a throwaway pilot, then change passwords.
if [ "$SEED_ON_START" = "true" ]; then
  echo "[eoffice] SEED_ON_START=true — seeding demo data..."
  npm run seed || echo "[eoffice] seed failed or already applied; continuing"
fi

echo "[eoffice] Starting API on :${PORT:-4000}..."
exec node dist/server.js
