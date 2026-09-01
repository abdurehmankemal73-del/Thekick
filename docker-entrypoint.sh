#!/bin/sh
set -eu

npx drizzle-kit migrate

if [ "${RUN_DB_SEED:-true}" = "true" ]; then
  npx tsx src/db/seed.ts
fi

exec npm start
