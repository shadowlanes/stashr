# Quick Start

Get StashR running locally in a few minutes.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- A [Clerk](https://clerk.com/) account (free tier works)

## 1. Clone and install

```bash
git clone https://github.com/shadowlanes/stashr.git
cd stashr
pnpm install
```

## 2. Configure environment variables

### API (`services/api/.env`)

```env
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

The remaining API env vars (database, MinIO) are pre-filled in `docker-compose.yml` for local development.

### Web app (`apps/web/.env.local`)

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### Chrome extension (`apps/extension/.env`)

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

> **Where to get Clerk keys:** Create a Clerk application at [dashboard.clerk.com](https://dashboard.clerk.com). Copy the publishable key and secret key from **API Keys** in your Clerk dashboard.

## 3. Start the backend

```bash
docker compose up
```

This starts:
- **PostgreSQL** on port `4102`
- **MinIO** (S3-compatible storage) on port `4104` (console on `4105`)
- **Fastify API** on port `4101`

MinIO is automatically initialized with a `stashr-articles` bucket.

## 4. Run database migrations

In a separate terminal:

```bash
pnpm db:migrate
```

You only need to do this once (and after pulling new migrations).

## 5. Start the web app

```bash
pnpm dev:web
```

Open [http://localhost:4103](http://localhost:4103) and sign in with Clerk.

## 6. Load the Chrome extension

```bash
cd apps/extension && pnpm build
```

Then in Chrome:
1. Go to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `apps/extension/.output/chrome-mv3/` directory

Navigate to any article and click the StashR extension icon to save it.

## Port reference

| Service | Port |
|---------|------|
| Fastify API | 4101 |
| PostgreSQL | 4102 |
| Web app | 4103 |
| MinIO S3 API | 4104 |
| MinIO Console | 4105 |

## Verify it works

1. Open [http://localhost:4103](http://localhost:4103) — you should see the StashR reading list (empty)
2. Navigate to any article in Chrome and click the StashR extension icon
3. Click **Save to StashR** — the article should appear in your reading list
4. Click on the article card to open the reader view
