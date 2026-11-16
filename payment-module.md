# Payment & Subscription Module — Implementation Plan

> Status: **Implemented in `backend/` (2026-11-16), uncommitted.** Frontend checkout and pricing UI are a follow-up (see §11).

## 0. Implementation notes (where the build differs from the plan below)

- **Webhook timestamp age check dropped.** The signature is still verified over `timestamp + rawBody`, but deliveries are not rejected for being old. Cashfree retries can arrive late, and replaying a valid event is harmless: processing is idempotent, and nothing is granted without a fresh `GET /pg/orders/{id}` showing PAID with a matching amount.
- **Webhook dedupe**: a retried delivery with the same body is **re-processed until it succeeds once** (`processedAt`), so a transient failure (500) is not lost.
- **`notify_url`** is sent only when it is HTTPS (`CASHFREE_WEBHOOK_BASE_URL`, e.g. your ngrok domain). Otherwise the webhook URL configured in the Cashfree dashboard applies.
- **Open checkout reuse**: `POST /payments/orders` returns the existing session for the same plan if one has more than 5 minutes left, so double clicks don't create duplicate orders.
- **Operations-published jobs** are now `listingPaymentStatus: "not_applicable"` with label `Complimentary` (previously `paid`). This affects the Operations payment filter and KPI counts.
- **Operations reactivation** of a plan-backed job renews its validity window for free (complimentary). Employer reactivation uses a new credit.
- **Live edits**: changing city on a live job is checked against the plan's city limit when the employer submits the edit.
- **Enterprise leads** use a new `enterprise_leads` collection (the `support` module was empty).
- **Expiry only touches plan-backed jobs** (`subscriptionGrantId` set). Legacy and complimentary jobs never auto-expire.
- **Checked against Cashfree MCP docs (2026-11-16).** Matches: API `2025-01-01` (a live `GET /orders` returned the expected `{code,message,type}` error shape), the webhook signature formula and its raw-body requirement, the webhook's `order` / `payment` objects (`order_id`, `cf_payment_id`), and `order_id` rules (≤45 chars, `[A-Za-z0-9_-]`). Fixed: `customer_name`/`customer_email` must be 3–100 chars, so out-of-range values are now left out instead of causing a 400. Notes: (a) `notify_url` is still honoured. Cashfree's retry docs list a fixed `NOTIFY_URL` webhook config for it, and the default retry policy is 3 tries at 2, 10 and 30 min. Adding the dashboard webhook too means two deliveries per event, which is safe because processing is idempotent. The subscription sweep catches anything still missed after retries. (b) The webhook payload (sample `2026-01-01` `PAYMENT_USER_DROPPED_WEBHOOK`) is `{ data: { order, payment, customer_details }, event_time, type }`, exactly the paths `handleCashfreeWebhook` reads. (c) `{order_id}` in `return_url` is substituted by Cashfree; `return_url` must stay under 250 chars. (d) The dashboard order-expiry minimum is 5 min (we use 30). (e) Re-verified the subscription rules against the original requirements: Free 1 job/7 d/1 city auto-granted silently at registration (+ lazy re-ensure + backfill script); ₹299 = 1 job/7 d/1 city; ₹999 = 5 jobs (2nd–6th)/15 d/2 cities; Enterprise = contact sales, not purchasable. The MCP server's **write tools are disabled** on this account, so no sandbox order was created. To enable them: Merchant Dashboard → Settings → General → MCP Server (needs the account owner).

### Before going live
1. Add `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY` (sandbox), and `CASHFREE_WEBHOOK_BASE_URL=https://refusing-untimely-flyable.ngrok-free.dev` to **`backend/.env`**. `env.ts` uses dotenv's default, so `.env.local` is **not** loaded.
2. Run `npx tsx scripts/backfill-free-subscriptions.ts` (dry run), then add `--apply`.
3. In the Cashfree dashboard (Payment Gateway → Developers → Webhooks), add `https://refusing-untimely-flyable.ngrok-free.dev/api/v1/payments/webhooks/cashfree` with the payment success, failed and user-dropped events.
4. Sandbox end-to-end, per §9.3 / §9.4.

---

## 1. Goals

1. Employers can buy job-posting plans through **Cashfree Payment Gateway**.
2. Payments are confirmed **server-side only**, by a signed Cashfree webhook plus a direct API re-check. The browser redirect is never trusted.
3. Plan limits (job count, listing validity, cities) are **enforced** when a job is submitted, approved, and reactivated.
4. Every new employer gets the **Free plan silently**: no notification, toast, email, or WhatsApp.

---

## 2. Plan catalog

| Code | Price | Job credits | Listing validity (per job) | Max distinct cities | Purchasable |
|---|---|---|---|---|---|
| `free` | ₹0 | 1 (the first job) | 7 days | 1 | No. Auto-granted once per employer |
| `starter_299` | ₹299 | 1 (the 2nd job) | 7 days | 1 | Yes, via Cashfree |
| `growth_999` | ₹999 | 5 (jobs 2–6) | 15 days | 2 | Yes, via Cashfree |
| `enterprise` | Contact sales | Custom | Custom | Custom | No. Lead form only. Operations can grant it manually later |

- The catalog lives in code (`subscription.constants.ts`). Prices are **never** read from the client.
- Each purchase creates a separate **grant** (entitlement record), so buying ₹299 twice gives two separate 1-job grants.
- Credits are consumed **oldest-first**: Free first, then paid grants by `activatedAt`.

---

## 3. Domain model (MongoDB / Mongoose)

### 3.1 `SubscriptionGrant` (new): `subscriptions/subscription-grant.model.ts`
One document per entitlement an employer holds.

| Field | Type | Notes |
|---|---|---|
| `employerId` | ObjectId → Employer | indexed |
| `planCode` | enum `free \| starter_299 \| growth_999 \| enterprise` | |
| `source` | enum `auto_free \| payment \| operations_grant` | |
| `jobCredits` | Number | snapshot from catalog at grant time |
| `jobCreditsUsed` | Number | atomically `$inc`'d |
| `listingValidityDays` | Number | snapshot (7 / 15 / custom) |
| `maxCities` | Number | snapshot (1 / 2 / custom) |
| `citiesUsed` | [String] | normalized city keys, `$addToSet` |
| `consumedJobIds` | [ObjectId → Job] | audit trail |
| `status` | enum `active \| exhausted \| cancelled` | |
| `paymentOrderId` | ObjectId → PaymentOrder \| null | set for `source: payment` |
| `activatedAt` | Date | |
| `priceInr` | Number | snapshot of the amount paid |

Indexes:
- `{ employerId: 1, status: 1, activatedAt: 1 }` for credit lookup.
- **Unique partial** `{ employerId: 1 }` where `planCode: "free"`. This makes the auto-grant idempotent and race-safe.
- **Unique partial** `{ paymentOrderId: 1 }` where `paymentOrderId` exists. One paid order can only ever produce one grant, even when webhooks are duplicated.

### 3.2 `PaymentOrder` (new): `payments/payment-order.model.ts`

| Field | Type | Notes |
|---|---|---|
| `orderId` | String, unique | our id sent to Cashfree, e.g. `AJ_<ts>_<rand>` |
| `cfOrderId` | String | Cashfree's internal id |
| `paymentSessionId` | String | `select: false`, returned once to the client |
| `employerId` | ObjectId | indexed |
| `planCode` | enum (purchasable only) | |
| `amount` / `currency` | Number / `"INR"` | from catalog |
| `status` | enum `created \| paid \| failed \| user_dropped \| expired \| cancelled` | |
| `cfPaymentId`, `paymentMethod`, `paymentGroup`, `bankReference` | String | from the webhook or API |
| `paidAt`, `failedAt`, `failureReason` | | |
| `grantId` | ObjectId → SubscriptionGrant \| null | |
| `lastVerifiedAt` | Date | last time we called Cashfree for this order |
| `expiresAt` | Date | `order_expiry_time` (default 30 min) |

### 3.3 `PaymentWebhookEvent` (new): `payments/payment-webhook-event.model.ts`
Append-only log for audit, replay, and dedupe.
- `provider: "cashfree"`, `eventType`, `orderId`, `cfPaymentId`, `signatureValid`, `payloadHash` (sha256 of raw body, **unique** for dedupe), `payload` (Mixed), `processedAt`, `processingError`.
- TTL index of 180 days on `createdAt`, so the log does not grow forever.

### 3.4 `Job` model (existing): additive changes only
- New: `subscriptionGrantId: ObjectId | null` (the grant that paid for this listing).
- Reuse existing fields:
  - `listingPaymentStatus`: `paid` when a credit is attached, `not_applicable` for Operations-owned jobs.
  - `listingPackageLabel`: e.g. `"Free"`, `"₹299"`, `"₹999"`.
  - `listingValidUntil`: set to `approvedAt + listingValidityDays`.

### 3.5 `EnterpriseLead` (new, small): `subscriptions/enterprise-lead.model.ts`
- `employerId?`, name, phone, email, company, expected monthly hires, message, `status: new | contacted | closed`.
- I'll check the existing `support` module first. If it already stores tickets, I'll reuse it instead of adding a new collection.

---

## 4. Cashfree integration

API: **Cashfree PG v2025-01-01** (`x-api-version` header). Plain `axios` (already a dependency), no extra SDK.

| Env | Base URL |
|---|---|
| sandbox | `https://sandbox.cashfree.com/pg` |
| production | `https://api.cashfree.com/pg` |

### 4.1 Flow

```
Employer (frontend)            Backend                               Cashfree
 ── POST /payments/orders ───▶ validate plan, create PaymentOrder
                               POST /pg/orders ─────────────────────▶
                               ◀──── cf_order_id, payment_session_id
 ◀── { orderId, paymentSessionId, mode }
 cashfree.checkout(sessionId) ─────────────────────────────────────▶ user pays
                                                                     │
                               ◀── POST /payments/webhooks/cashfree ─┘ (signed)
                               verify signature → GET /pg/orders/{id} (re-check)
                               → mark PAID → create SubscriptionGrant (idempotent)
 ◀── redirect to return_url?order_id=…
 ── POST /payments/orders/:id/verify ▶ same reconcile path (covers late or missed webhooks)
 ◀── { status: "paid", grant }
```

### 4.2 Create order (`POST /pg/orders`)
- `order_id`: our id. `order_amount`: from catalog. `order_currency`: `INR`.
- `customer_details`: `customer_id` (employer `_id`), `customer_phone` (normalized WhatsApp number), `customer_email`, `customer_name`.
- `order_meta.return_url`: `${FRONTEND_URL}/employer/payments/return?order_id={order_id}`
- `order_meta.notify_url`: `${CASHFREE_WEBHOOK_BASE_URL}/api/v1/payments/webhooks/cashfree`. Locally this is your **ngrok static domain** on port 5000.
- `order_expiry_time`: now + 30 min.
- `order_tags`: `{ planCode, employerId }`.

### 4.3 Webhook verification
- Headers: `x-webhook-signature`, `x-webhook-timestamp`.
- Expected signature: `base64( HMAC_SHA256( timestamp + rawBody, CASHFREE_SECRET_KEY ) )`, compared with `crypto.timingSafeEqual`.
- Reject requests whose timestamp is more than ±5 minutes off (replay protection).
- The signature is computed over the raw body, so the parsed JSON is not enough:
  - Extend the `express.json({ verify })` hook in `app.ts`, which already captures `rawBody` for `/whatsapp/webhook`, to also capture it for `/payments/webhooks/cashfree`, with a 256 KB cap.
  - Add the path to the global rate-limiter `skip` list.
  - Add a dedicated limiter for it, like the one in `whatsapp.routes.ts`.
- Handled events:
  - `PAYMENT_SUCCESS_WEBHOOK`: reconcile, then grant.
  - `PAYMENT_FAILED_WEBHOOK`: mark `failed`.
  - `PAYMENT_USER_DROPPED_WEBHOOK`: mark `user_dropped`.
  - Anything else: log only.
- Always respond **200** quickly once the signature is valid, including duplicates, so Cashfree stops retrying. Respond **401** if the signature is invalid.

### 4.4 Rules before a grant is created
1. The webhook signature is valid, **and** a fresh `GET /pg/orders/{order_id}` returns `order_status === "PAID"`.
2. `order_amount` and `order_currency` match our stored `PaymentOrder` exactly.
3. The `PaymentOrder` is still `created`. The move to `paid` is an atomic `findOneAndUpdate({ status: "created" })`.
4. Grant creation relies on the unique `paymentOrderId` index. A duplicate-key error means the grant already exists, so it is treated as success.

### 4.5 Using the Cashfree MCP tool during implementation
- Confirm the current API version, request/response shapes, and webhook payload against live Cashfree docs.
- Create sandbox test orders and trigger test webhooks to the ngrok URL during manual verification (§9).

---

## 5. API routes (all under `/api/v1`)

### Subscriptions: `modules/subscriptions/subscription.routes.ts`, mounted at `/subscriptions`
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/subscriptions/plans` | public | Plan catalog for the pricing page |
| GET | `/subscriptions/me` | `requireEmployerAuth` | Active grants, remaining credits, cities used, history |
| POST | `/subscriptions/enterprise-enquiry` | optional workspace auth, rate-limited | "Contact sales" lead capture |

### Payments: `modules/payments/payment.routes.ts`, mounted at `/payments`
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/payments/orders` | `requireEmployerAuth` | Body `{ planCode }`. Creates a Cashfree order and returns `{ orderId, paymentSessionId, mode }` |
| GET | `/payments/orders` | `requireEmployerAuth` | The employer's order history |
| GET | `/payments/orders/:orderId` | `requireEmployerAuth` | Order status (own orders only) |
| POST | `/payments/orders/:orderId/verify` | `requireEmployerAuth` | Re-checks with Cashfree and grants if paid. Used by the return page |
| POST | `/payments/webhooks/cashfree` | **signature** (no JWT) | Cashfree webhook receiver |

### Operations (read-only, phase 2): `/operations/payments`
- List and filter orders. Show an employer's grants.
- Manually grant `enterprise` / custom plans (`source: operations_grant`), guarded by `requireOperationsPermission`.

All bodies are validated with **zod** through the existing `validate.middleware.ts`. Errors use `AppError` + `HTTP_STATUS`, like the rest of the code.

---

## 6. Free plan auto-assignment (silent)

- `subscriptionService.ensureFreeGrant(employerId)` is idempotent: it upserts against the unique partial index.
- It is called from:
  1. `EmployerService.registerEmployer`, right after `EmployerModel.create(...)` (the first time an employer record exists). It is wrapped in try/catch so a failure here can never break registration.
  2. **Lazy fallback**: `getMySubscription` and `consumeCredit` call it too. This covers employers created through other paths (Operations, WhatsApp bot, legacy accounts).
- It sends no notifications of any kind.
- Backfill script `backend/scripts/backfill-free-subscriptions.ts`: grants a **fresh, unused** Free credit to every existing employer, including employers who already posted jobs (confirmed Q3).

---

## 7. Enforcement in the job lifecycle

Service: `modules/subscriptions/subscription-entitlement.service.ts`

| Lifecycle point (existing code) | New behaviour |
|---|---|
| `JobService.createJob` (non-draft submit), `publishDraft` → `pending_approval` | If the job has no `subscriptionGrantId`, **consume 1 credit** atomically. If none is available, reject with `402 PAYMENT_REQUIRED` and code `NO_JOB_CREDITS`, so the frontend can open the pricing page. Replaces the hard-coded `listingPaymentStatus = "paid"` lines (job.service.ts ~1461, ~1789, ~2194) |
| Resubmission after `rejected` | Keeps the same grant. No new credit |
| Operations **approve** (`approveJobWithEmployerNotification`) | Sets `listingValidUntil = now + grant.listingValidityDays` (first approval only; live-change approvals keep the existing date) |
| Job **deleted** while it has never gone live (`draft` / `pending_approval` / `rejected`) | **Refunds** the credit: `$inc: -1`, removes the job from `consumedJobIds`, and removes its city if no other job uses it |
| `reactivate` (closed/expired → active) | Needs a **new credit**. The validity clock restarts |
| `resume` (paused → active) | No credit. `listingValidUntil` is unchanged (pausing does not extend validity) |
| Operations-created / owned jobs (`creationSource: "operations"`) | Exempt: `listingPaymentStatus: "not_applicable"` (see Q5) |

**Atomic credit consumption** (no double spend under concurrent submits):
```ts
GrantModel.findOneAndUpdate(
  {
    employerId, status: "active",
    $expr: { $lt: ["$jobCreditsUsed", "$jobCredits"] },
    $or: [
      { citiesUsed: cityKey },                                  // city already counted
      { $expr: { $lt: [{ $size: "$citiesUsed" }, "$maxCities"] } }, // room for a new city
    ],
  },
  { $inc: { jobCreditsUsed: 1 }, $addToSet: { citiesUsed: cityKey, consumedJobIds: jobId } },
  { sort: { activatedAt: 1 }, new: true },
);
```
A follow-up update flips `status` to `exhausted` once `jobCreditsUsed === jobCredits`. `cityKey` = the normalized `state + city` slug (reuses `toLocationSlug`).

**Expiry sweep**: `subscription-expiry.worker.ts`
- Every 10 minutes it moves `active` / `paused` jobs whose `listingValidUntil < now` to `expired`, setting `lastStatusChangedAt`, `closedFromStatus`, etc.
- It follows the existing BullMQ-with-local-timer-fallback pattern used by the reminder queues, and is started from `server.ts`.
- The same worker reconciles **stale `created` orders** older than 30 minutes by calling `GET /pg/orders/{id}`. This catches any webhook that never arrived.

---

## 8. Files to add or change

**New**
```
backend/src/modules/subscriptions/
  subscription.constants.ts          # plan catalog + types
  subscription-grant.model.ts
  enterprise-lead.model.ts           # (or reuse support module)
  subscription.service.ts            # ensureFreeGrant, getMySubscription, grants
  subscription-entitlement.service.ts# consume / refund / validity
  subscription-expiry.worker.ts      # listing expiry + stale-order reconcile
  subscription.controller.ts / .routes.ts / .validation.ts
  subscription-entitlement.test.ts
backend/src/modules/payments/
  cashfree.client.ts                 # axios client: createOrder, getOrder, getOrderPayments
  cashfree-webhook.signature.ts      # verify HMAC + timestamp
  payment-order.model.ts
  payment-webhook-event.model.ts
  payment.service.ts                 # createOrder, reconcileOrder (single code path), handleWebhook
  payment.controller.ts / .routes.ts / .validation.ts
  cashfree-webhook.signature.test.ts
  payment.service.test.ts            # idempotency, amount mismatch, duplicate webhook
backend/scripts/backfill-free-subscriptions.ts
```

**Modified**
- `backend/src/config/env.ts`: new env vars (below).
- `backend/.env.example`: documented placeholders (no secrets).
- `backend/src/app.ts`: rawBody capture and rate-limit skip for the Cashfree webhook path.
- `backend/src/routes/index.ts`: mount `/subscriptions` and `/payments`.
- `backend/src/modules/employers/employer.service.ts`: `ensureFreeGrant` after create.
- `backend/src/modules/jobs/job.model.ts`: `subscriptionGrantId`.
- `backend/src/modules/jobs/job.service.ts`: consume / refund / reactivate hooks.
- `backend/src/modules/operations/jobs/operations-jobs.service.ts`: set `listingValidUntil` on approve.
- `backend/src/server.ts`: start and stop the expiry worker.
- `backend/test-manifest.json`: register the new test files (whatever `scripts/run-tests.mjs` expects).

**New env vars**
```
CASHFREE_ENV=sandbox                  # sandbox | production
CASHFREE_APP_ID=
CASHFREE_SECRET_KEY=
CASHFREE_API_VERSION=2025-01-01
CASHFREE_WEBHOOK_BASE_URL=https://<your-ngrok-static-domain>   # prod: real API host
PAYMENTS_ENABLED=true                 # kill switch; false → paid routes return 503, Free still works
SUBSCRIPTION_ENFORCEMENT_ENABLED=true # false → log-only mode while rolling out
```
`env.ts` refuses to start in production if `CASHFREE_ENV=production` is set but the keys are empty.

---

## 9. Testing & verification

1. **Unit tests** (`tsx --test`, matching the existing tests):
   - Signature: valid, invalid, stale timestamp, tampered body.
   - Credit consumption: Free → 299 → 999 ordering, city limits (1 vs 2), exhaustion, concurrent consume (no double spend), refund on delete.
   - `ensureFreeGrant` is idempotent under parallel calls.
   - `reconcileOrder`: duplicate webhook, webhook + verify race, amount mismatch rejected, `PAID` → grant exactly once.
2. `npm run typecheck` and `npm test` pass.
3. **Sandbox end-to-end through ngrok** (backend on :5000):
   - Create an order and pay with a Cashfree sandbox test card/UPI.
   - Confirm the webhook hits the ngrok URL, the signature verifies, the order is `paid`, and the grant is created.
   - Replay the same webhook and confirm there is no second grant.
   - Run a failed payment and a user-dropped flow.
   - Call `/verify` without a webhook (simulate a missed delivery).
4. **Lifecycle checks**:
   - A new employer posts job 1 (Free), and job 2 is blocked with 402.
   - Buy 299, post job 2, and job 3 is blocked again.
   - Buy 999, post jobs 3–7 in at most 2 cities. Approve, then fast-forward `listingValidUntil` and confirm the sweep expires the job.

---

## 10. Rollout order

1. Models, catalog, `ensureFreeGrant`, `/subscriptions/plans`, `/subscriptions/me`, and the backfill script.
2. Cashfree client, orders, webhook, and verify routes (sandbox).
3. Job lifecycle enforcement behind `SUBSCRIPTION_ENFORCEMENT_ENABLED` (log-only first, then enforce).
4. Expiry and reconcile worker.
5. Operations read views and the manual enterprise grant (phase 2).

---

## 11. Out of scope (follow-ups)
- Frontend: wire the pricing page (`frontend/src/app/(site)/pricing-plans`) to `/subscriptions/plans`, add Cashfree JS checkout (`@cashfreepayments/cashfree-js`), a payment return page, a "credits left" badge, and a 402 → upgrade prompt in the job wizard.
- GST invoices and PDF receipts (`pdfkit` is already available).
- Refunds through the Cashfree refund API.
- Admin payments dashboard.

---

## 12. Decisions (confirmed 2026-11-16)

- Q1: Validity = listing duration per job, counted from approval. Paid credits never expire.
- Q2: The 2-city limit applies only to ₹999. Its 5 jobs can span at most 2 distinct cities.
- Q3: Existing employers get a **fresh** Free credit, even if they already posted jobs.
- Q4: Operations-created jobs are free (complimentary) and use no credits.
- Q5–Q8: defaults below are accepted.

### Original questions (for reference)

1. **Who gets subscriptions?** Default: **employers only**. Job seekers get nothing. Team members share their employer's grants.
2. **What does "validity" mean?** Default: **how long each job stays live**, counted from Operations approval. The plan itself never expires, so unused paid credits stay usable. Should unused credits expire instead (e.g., 999 credits must be used within N days)?
3. **Existing employers with jobs already posted**: Default: they get Free, but it is **marked used** if they already have a non-draft job. Alternatively, give everyone a fresh Free credit.
4. **"2 cities" on ₹999**: A job has a single city today. Default: the 5 jobs from that purchase can **span at most 2 distinct cities**. The alternative (one job listed in 2 cities at once) needs job-model changes and is a bigger task.
5. **Operations-created jobs** for an employer: Default: **exempt** (no credit consumed). Should they use the employer's credits instead?
6. **Can ₹299 be bought while the Free credit is still unused, or bought repeatedly?** Default: yes to both. Each purchase adds 1 credit.
7. **Pricing and GST**: are ₹299 / ₹999 GST-inclusive? Default: the amount charged equals the listed price exactly.
8. **Rejected jobs**: Default: the credit stays with the job (free resubmission), and is refunded only if the job is deleted before it ever goes live.
