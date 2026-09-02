#!/bin/sh
set -eu

# Auth.js infers the public host from HOSTNAME when proxy headers are missing.
if [ "${HOSTNAME:-}" = "0.0.0.0" ]; then
  unset HOSTNAME
fi

case "${AUTH_URL:-}" in
  //*) AUTH_URL="https:${AUTH_URL}" ;;
  *replace_with*|*your_coolify*|*your-coolify*|*"0.0.0.0"*) AUTH_URL="" ;;
esac
if [ -z "${AUTH_URL:-}" ]; then
  AUTH_URL="${SERVICE_URL_APP_3000:-https://kick.smarterp.space}"
fi
export AUTH_URL
export AUTH_TRUST_HOST=true

npx drizzle-kit migrate

if [ "${RUN_DB_SEED:-true}" = "true" ]; then
  npx tsx src/db/seed.ts || echo "Warning: database seed failed; starting the app anyway."
fi

exec npm start
