FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
# Coolify injects ARG NODE_ENV=production into every stage; that makes npm skip
# devDependencies (needed for next build + drizzle-kit migrate). Force a full
# install. Skip lifecycle scripts: allowScripts gates embedded-postgres binaries.
RUN NODE_ENV=development npm ci --ignore-scripts --no-audit --no-fund

FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN NODE_ENV=production npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# Do not set HOSTNAME=0.0.0.0 — Auth.js treats it as the public host and
# sign-in cookies/callbacks then target 0.0.0.0 instead of the domain.
# next start binds with --hostname in package.json.
ENV AUTH_URL=https://kick.smarterp.space
ENV AUTH_TRUST_HOST=true
ENV SEED_DEMO=false
ENV RUN_DB_SEED=true

RUN apk add --no-cache libc6-compat

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
CMD ["./docker-entrypoint.sh"]
