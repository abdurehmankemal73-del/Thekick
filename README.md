# THE KICK — Club Management System

**JJU THE KICK INTERNATIONAL TAEKWONDO CLUB**  
International Taekwon-Do Federation (ITF)

Production-ready club platform: public website, student accounts, admin operations, grades, absence permissions, and announcements.

## Architecture

- **Frontend & API:** Next.js App Router (TypeScript)
- **Database:** PostgreSQL, accessed through Drizzle ORM and `DATABASE_URL`
- **Local Postgres (intended):** Docker Compose (`postgres:16-alpine`)
- **Local Postgres (temporary fallback only):** embedded PostgreSQL, same `DATABASE_URL` — not part of production architecture
- **ORM:** Drizzle ORM (`drizzle-orm` + `postgres` + `drizzle-kit`)
- **Auth:** Auth.js v5 (Credentials) with bcrypt password hashes and JWT httpOnly cookies
- **Authorization:** Server-side `requireAuth` / `requireAdmin` / `requireStudent` on every protected API

Prisma is not used.

```
Browser → Next.js pages / Route Handlers → guards → Drizzle → PostgreSQL
```

## Requirements

- Node.js 20+
- Docker for local PostgreSQL (`npm run db:up`)

If Docker Hub cannot pull `postgres:16-alpine`, you may temporarily run `npm run db:embedded`. That is a development fallback only. The app still uses Drizzle + `DATABASE_URL` against standard PostgreSQL. Switch back to Docker later with no schema or query changes.

## Installation

```bash
npm install
cp .env.example .env
```

Generate `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Environment variables

See [`.env.example`](.env.example). Required:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Auth.js signing secret |
| `AUTH_URL` | Public site URL (e.g. `http://localhost:3000`) |
| `ADMIN_EMAIL` | Seeded admin login |
| `ADMIN_PASSWORD` | Seeded admin password (never commit a real production password) |
| `SEED_DEMO` | `true` only in development to insert sample students |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Server-side SMTP for student approval emails |

Do not put real secrets in this README or in source control.

## Database setup

**Intended local database:** Docker PostgreSQL.

```bash
npm run db:up
```

[`docker-compose.dev.yml`](docker-compose.dev.yml) starts `postgres:16-alpine` with user/password/database `thekick` on port `5432`, matching:

```
DATABASE_URL=postgresql://thekick:thekick@localhost:5432/thekick
```

**Temporary development fallback** (only if the Docker image cannot be pulled):

```bash
npm run db:embedded
```

Keep that process running. It serves the **same** `DATABASE_URL` on `localhost:5432`. Application database logic does not change. When Docker Hub works, stop the embedded process and use `npm run db:up` instead.

Then apply migrations against whichever PostgreSQL is listening:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

`db:seed` creates the admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD` and default club settings. If `SEED_DEMO=true`, it also inserts example students (password `Student123!`).

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production build

```bash
npm run build
npm start
```

## Authentication & roles

- Students register at `/register` with status **PENDING**. They cannot sign in until an admin approves them.
- Admins and approved students sign in at `/login`.
- Passwords are hashed with bcrypt (cost 12). Hashes are never returned by the API.
- JWT cookies store `id` and `role` only. APIs always reload the user from PostgreSQL and check `ACTIVE` status and role.

| Feature | Public | Student | Admin |
| --- | --- | --- | --- |
| Home / About / News / Calendar / Contact / Register / Login | Yes | Yes | Yes |
| Own profile, grades, permissions, same-belt directory | No | Yes | — |
| Approve/reject students, calendar CRUD, news + image upload, grades, permissions | No | No | Yes |

Students can see **only** other **ACTIVE** students with the **same belt**. The filter is applied in the SQL query, not in the browser.

## Deployment

### Netlify + hosted PostgreSQL

1. Create a hosted PostgreSQL database (Neon, Supabase, or Railway). Use a **pooled** connection string in `DATABASE_URL` when the host provides one.
2. In Netlify → Site configuration → Environment variables, set the values listed in [`.env.example`](.env.example) (especially `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, and SMTP).
3. Connect this Git repository. Netlify detects Next.js. The build command in `netlify.toml` runs Drizzle migrations, then `npm run build`.
4. After the first successful deploy, run seed **once** against production (from your machine, with production `DATABASE_URL`):

```bash
SEED_DEMO=false npm run db:seed
```

Keep `SEED_DEMO=false` in Netlify. News images are stored in PostgreSQL so they persist across deploys.

### Other Node hosts

1. Provision PostgreSQL and set `DATABASE_URL`.
2. Set `AUTH_SECRET`, `AUTH_URL`, and a strong `ADMIN_PASSWORD`.
3. Run `npm run db:migrate` then `npm run db:seed` (keep `SEED_DEMO=false`).
4. Run `npm run build` and start with `npm start`.

Login is rate-limited (20 attempts / 15 minutes per IP+email, in-memory — this is per serverless instance on Netlify).
