# AsliJobs Backend API

Common REST API for the AsliJobs platform.

## Tech Stack

- Node.js
- Express.js
- TypeScript
- MongoDB / Mongoose

## Getting Started

1. Copy `.env.example` to `.env` and fill in required values.
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The API runs at `http://localhost:5000`.

## Scripts

- `npm run dev` — Start development server with hot reload
- `npm run build` — Compile TypeScript to `dist/`
- `npm run start` — Run production build
- `npm run typecheck` — Type-check without emitting files
- `npm run render-build` — **Render Build Command**: `npm ci --include=dev && npm run build`

- `npm run translation:worker` — Dedicated translation worker (also starts inside `npm run dev`)
- `npm run translation:backfill` — Queue translations for existing active jobs

## Job translation

Public job details never wait on the translation provider. Missing translations are queued and the original text is returned immediately.

Redis is optional:

```bash
# Redis (local). Then set REDIS_URL=redis://127.0.0.1:6379 in backend/.env
docker run --name aslijobs-redis -p 6379:6379 redis:7

# Worker. The API process also starts this runtime.
npm run translation:worker

# Existing active jobs, resumable with --after=<mongoId>
npm run translation:backfill
```

## Render (production)

Keep `NODE_ENV=production` in the Render environment (required for DB safety guards).

**Build Command** (required):

```bash
npm run render-build
```

Do **not** use bare `npm install && npm run build` when `NODE_ENV=production` —
npm will omit `devDependencies` (`typescript`, `@types/node`, `@types/express`, …)
and `tsc` will fail with missing `process` / `express` types.

**Start Command**:

```bash
npm start
```

Temporary DB bridge while migrating live data off `aslijobs_test` is documented in
`docs/database-cutover-aslijobs-prod.md`.

## Health Check

```
GET /api/v1/health
```
