/**
 * Controlled cutover checklist: aslijobs_test (live data) → aslijobs_prod.
 *
 * DO NOT point Render at empty aslijobs_prod before this completes.
 * DO NOT drop or delete aslijobs_test until production smoke tests pass
 * for several days on aslijobs_prod.
 *
 * ---------------------------------------------------------------------------
 * PROVEN CURRENT STATE (code + live health probe, 2026-09-22)
 * ---------------------------------------------------------------------------
 * - Live Render `/api/v1/health` returned environment: "development"
 *   → NODE_ENV is missing or not "production" on Render.
 * - Local `.env` targets database path: aslijobs_test (correct for local).
 * - Atlas shows application collections populated under aslijobs_test.
 * - aslijobs_prod appears under-populated relative to live traffic.
 * - Conclusion: treat aslijobs_test as the current live data store until
 *   counts prove otherwise. Migration is REQUIRED before a hard cutover.
 *
 * ---------------------------------------------------------------------------
 * STEP 0 — Backup
 * ---------------------------------------------------------------------------
 * In Atlas: create a cluster snapshot / backup of the database that holds
 * live data (expected: aslijobs_test). Record snapshot id + timestamp.
 *
 * ---------------------------------------------------------------------------
 * STEP 1 — Count source collections (read-only)
 * ---------------------------------------------------------------------------
 * mongosh (or Atlas UI Aggregations) against aslijobs_test:
 *
 *   db.getCollectionNames().forEach(c => print(c, db[c].countDocuments()))
 *
 * Capture counts for at least:
 * employers, jobs, applications, jobseekers, notifications,
 * operations_team_users, operations_roles, operations_work_items,
 * analytics_events, resumes, saved_jobs, saved_candidates, job_views,
 * employer_documents, departments, job_counters, operations_*.
 *
 * ---------------------------------------------------------------------------
 * STEP 2 — Copy to aslijobs_prod (Atlas tools preferred)
 * ---------------------------------------------------------------------------
 * Preferred: Atlas → ... → Dump/Restore or mongodump/mongorestore
 * between databases on the SAME cluster (no ID rewriting).
 *
 * Example (credentials via env; never commit):
 *
 *   mongodump --uri="$MONGO_URI_TEST" --db=aslijobs_test --out=./backup-aslijobs_test
 *   mongorestore --uri="$MONGO_URI_PROD_CLUSTER" --nsFrom='aslijobs_test.*' --nsTo='aslijobs_prod.*' ./backup-aslijobs_test
 *
 * Do NOT use --drop on aslijobs_test.
 * Prefer restoring into empty aslijobs_prod, then validate counts.
 *
 * ---------------------------------------------------------------------------
 * STEP 3 — Validate aslijobs_prod
 * ---------------------------------------------------------------------------
 * - Collection list matches source
 * - Document counts match (or documented deltas)
 * - Spot-check recent jobs/employers by _id
 * - Indexes: start backend against aslijobs_prod locally with:
 *     NODE_ENV=production
 *     MONGO_URI=.../aslijobs_prod
 *   Confirm startup logs: Database: aslijobs_prod
 *   Confirm applications index sync succeeds (legacy $ne indexes are dropped).
 *
 * ---------------------------------------------------------------------------
 * STEP 4 — Render cutover (after validation)
 * ---------------------------------------------------------------------------
 * Set on Render (dashboard):
 *   NODE_ENV=production
 *   MONGO_URI=<uri path /aslijobs_prod>
 *   Remove ALLOW_NON_CANONICAL_PRODUCTION_DB
 *   Remove EXPECTED_PRODUCTION_DB_NAME
 *
 * Build Command (required with NODE_ENV=production):
 *   npm run render-build
 *   (== npm ci --include=dev && npm run build)
 * Do NOT use bare `npm install && npm run build` — production NODE_ENV omits
 * typescript/@types and the compile will fail.
 *
 * Start Command:
 *   npm start
 *
 * Redeploy. Health must show:
 *   environment: production
 *   database: aslijobs_prod
 *
 * ---------------------------------------------------------------------------
 * STEP 5 — Isolation proof
 * ---------------------------------------------------------------------------
 * Create uniquely named job in production → exists only in aslijobs_prod.jobs
 * Create uniquely named job locally → exists only in aslijobs_test.jobs
 *
 * ---------------------------------------------------------------------------
 * TEMPORARY Render bridge (before migration finishes)
 * ---------------------------------------------------------------------------
 * If you must set NODE_ENV=production before data is copied:
 *   ALLOW_NON_CANONICAL_PRODUCTION_DB=true
 *   EXPECTED_PRODUCTION_DB_NAME=aslijobs_test
 *   MONGO_URI=.../aslijobs_test
 * Remove these immediately after cutover to aslijobs_prod.
 */
export const ASLIJOBS_DB_CUTOVER_DOC_VERSION = "1";
