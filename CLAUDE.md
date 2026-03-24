# Stashr — Project Context for Claude

## What is this?
Self-hosted Pocket clone. Browser extension saves articles → Fastify API stores metadata in Postgres and HTML in object storage → Next.js web app for reading.

## Repo
https://github.com/shadowlanes/stashr (private)

## Monorepo structure (pnpm workspaces)
```
stashr/
├── apps/
│   ├── web/          # Next.js 16 reader app (port 4103)
│   └── extension/    # WXT browser extension (Chrome MV3)
├── services/
│   └── api/          # Fastify API (port 4101)
├── packages/
│   └── db/           # Drizzle ORM schema + migrations (shared)
└── docker-compose.yml
```

## Port assignments (all 4100-series)
| Service         | Host port |
|-----------------|-----------|
| Fastify API     | 4101      |
| PostgreSQL      | 4102      |
| Web app (host)  | 4103      |
| MinIO S3 API    | 4104      |
| MinIO Console   | 4105      |

## Running locally
```bash
# Backend (Postgres + API + MinIO) — Docker
docker compose up

# Run migrations (first time only)
DATABASE_URL=postgres://stashr:stashr@localhost:4102/stashr pnpm --filter @stashr/db migrate

# Web app
pnpm dev:web   # → http://localhost:4103

# Extension
cd apps/extension && pnpm build
# Load .output/chrome-mv3/ as unpacked extension in Chrome
```

## Tech stack
- **API**: Node.js + Fastify + TypeScript, OOP pattern (Service/Repository classes)
- **ORM**: Drizzle ORM + drizzle-kit migrations
- **DB**: PostgreSQL 16
- **Object storage**: MinIO locally (S3-compatible), Cloudflare R2 in production
- **Auth**: Clerk (`@clerk/nextjs` in web, `@clerk/chrome-extension` in extension, `@clerk/backend` verifyToken in API)
- **Web**: Next.js 16 App Router + Tailwind CSS
- **Extension**: WXT + React + TypeScript + Readability.js (parses article in-browser, sends cleaned HTML to API)

## Key design decisions
- Readability.js runs **in the extension** (content script), not server-side — no parser worker, no Redis, no BullMQ
- Article HTML stored in R2/MinIO; only metadata in Postgres
- `forcePathStyle: true` on S3Client when endpoint is http:// (MinIO); false for R2
- Clerk JWT validated server-side via `verifyToken()` from `@clerk/backend`
- User row auto-created in Postgres on first API request using clerk_user_id

## Env files
- `services/api/.env` — only needs Clerk keys; all storage/DB pre-filled for local
- `apps/web/.env.local` — needs Clerk publishable + secret key
- `apps/extension/.env` — needs Clerk publishable key

## Current blocker (as of last session)
`@clerk/chrome-extension` auth not working correctly after sign-in on web app.
Symptom: after signing in at localhost:4103, clicking the extension still shows "Sign in".
Root cause: `syncSessionWithTab` only syncs from the currently active tab.
Next step: consult Clerk MCP (`claude mcp add clerk --transport http https://mcp.clerk.com/mcp`) for correct setup.
The Clerk MCP has been added to the project — needs a session restart to load.

## Code style
- Strict TypeScript throughout
- OOP: classes for services and repositories (BookmarkService, BookmarkRepository, R2StorageService, UserRepository, TagRepository)
- Routes are thin — business logic in service layer, DB access in repository layer
- No `exactOptionalPropertyTypes` (removed — causes friction with Drizzle nullable fields)
