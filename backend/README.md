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

## Health Check

```
GET /api/v1/health
```
