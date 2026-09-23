#!/bin/sh
# Do not use `set -e`. A failed migrate/seed must never prevent `next start`.
# Coolify/Traefik returns 503 for the whole site if this script exits first.

if [ "${HOSTNAME:-}" = "0.0.0.0" ]; then
  unset HOSTNAME
fi

case "${AUTH_URL:-}" in
  //*) AUTH_URL="https:${AUTH_URL}" ;;
  *replace_with*|*your_coolify*|*your-coolify*|*sslip.io*|*"0.0.0.0"*) AUTH_URL="" ;;
esac
if [ -z "${AUTH_URL:-}" ]; then
  AUTH_URL="${SERVICE_URL_APP_3000:-https://kick.smarterp.space}"
fi
export AUTH_URL
export AUTH_TRUST_HOST=true

if [ -z "${AUTH_SECRET:-}" ]; then
  echo "Warning: AUTH_SECRET is not set; generating a temporary secret so the site can start."
  AUTH_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
  export AUTH_SECRET
fi

run_db_tasks() {
  # Let Next accept traffic before migrate/seed compete for memory.
  i=0
  while [ "$i" -lt 90 ]; do
    if curl -fsS http://127.0.0.1:3000/api/health >/dev/null 2>&1; then
      break
    fi
    i=$((i + 1))
    sleep 1
  done

  if npm run db:migrate; then
    echo "Database migrations applied."
  elif npx drizzle-kit migrate; then
    echo "Database migrations applied with drizzle-kit."
  else
    echo "Warning: database migrate failed; the site is running anyway."
  fi

  if [ "${RUN_DB_SEED:-true}" = "true" ]; then
    npx tsx src/db/seed.ts || echo "Warning: database seed failed; the site is running anyway."
  fi
}

# Listen immediately so the proxy has a healthy backend. DB work happens after.
run_db_tasks &

exec node node_modules/next/dist/bin/next start --hostname 0.0.0.0 --port 3000
