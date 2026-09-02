#!/bin/sh
set -eu

npx drizzle-kit migrate

if [ "${RUN_DB_SEED:-true}" = "true" ]; then
  npx tsx src/db/seed.ts || echo "Warning: database seed failed; starting the app anyway."
fi

exec npm start
