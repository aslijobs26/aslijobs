# AsliJobs WhatsApp Bot — Production Audit & Hardening Report

Date: 2026-10-31 (updated verification pass)  
Scope: Full lifecycle audit + Phase 18 salary/context fixes + remaining verification gaps.  
Source of truth: `aslijobs/backend/src/modules/whatsapp/`

---

## 1. Existing architecture discovered

| Layer | Implementation |
|-------|----------------|
| Webhook | Meta Cloud API verify + HMAC signature; immediate ACK; inbound persistence / inbox |
| Dedup & order | Message-id dedupe; per-phone serialization (`whatsapp-phone-order`) |
| Queue | BullMQ / Redis when configured; inline fallback after ACK if Redis unavailable |
| Orchestration | Single inbound turn: `processInboundTurn` in `whatsapp-bot.service.ts` |
| NLU | Local deterministic (`understandLocally`) → optional Sarvam → account/role overlays → `resolveTurnUnderstanding` |
| Session | Mongo `WhatsAppSessionModel` (TTL 14d): filters, lastJobs, pending clarify, language, activeRole |
| Auth | `authorizeWhatsAppRole` + phone-linked AccountKind (seeker / employer / both / none) |
| Tools | Typed finite set in `whatsapp-bot-tools.ts` (search / applications / employer jobs) |
| Search | `publicJobFilters` → `loadJobs` → `jobService.listPublicActiveJobs` |
| Replies | Deterministic fact templates + Mayura/Sarvam localization; optional OpenAI assist (flagged, grounded) |
| Media | Download via Meta; MIME/signature checks; OCR feature-flagged |
| Admin | Bot pause / human handoff via inbox store |

Helpers (not a second router): `whatsapp-conversation-orchestrator.ts` for no-match menu 1–4 and documented pipeline stages.

---

## 2. Actual request lifecycle

```
Meta webhook
  → signature verify
  → HTTP 200 ACK
  → persist inbound / dedupe
  → queue or inline worker
  → per-phone ordered run
  → processInboundTurn
       → resolve LinkedAccount (fresh)
       → load WhatsAppSession
       → protocol / menu / media / local+Sarvam understand
       → resolveTurnUnderstanding (merge + follow-up + current-message rules)
       → no-match choice overlay (if pendingClarification)
       → authorizeWhatsAppRole
       → buildReply → backend services
       → clarify-loop state update
       → persist session (filters, lastJobs, clarify counters)
       → localizeDeterministicReply (+ optional OpenAI assist)
       → WhatsApp send
  → status webhooks update delivery (separate path)
```

---

## 3. Root causes identified (salary/context pass)

| Bug | Root cause |
|-----|------------|
| `"20,000 lo chunchandi"` ignored; stale ₹40,000 reused | Salary parser required English/₹/`kavali` cues; Telugu `lo chudu/chunchandi` not treated as salary preference |
| `"40k vaddu, 20k chudu"` kept 40k | First `Nk` match won; no reject-then-prefer / last-amount rule |
| Vague `"I want jobs"` wiped Electrician | `broadAsk` cleared prior role whenever openSearch + inherited location |
| Multi-city corrections wrong target | `extractPlace` took first city; English `instead of` vs Telugu `badhulu` differ in order |
| Clarification could repeat forever | No attempt counter / exhausted path for same missing field |
| DB/search throw vs empty | Outer catch used service error; search path now also emits explicit `search_failed` situation |

---

## 4. Files changed and reasons

| File | Change |
|------|--------|
| `whatsapp-bot.criteria.ts` | Telugu salary-show cues; vaddu/change-to parsing; `looksLikeSalaryPreferenceUpdate` |
| `whatsapp-bot.logic.ts` | Context merge; location-change cue rules; clarify exhaustion; `search_failed` reply mapping |
| `whatsapp-bot.service.ts` | Clarify loop wiring; `searchJobs` try/catch → `search_failed` (never empty `jobs`); authorized-path comment |
| `whatsapp-session.model.ts` | `lastClarifyMissing`, `clarifyAttempts` |
| `whatsapp-phase18-regression.test.ts` | Phase 18 + multi-city + clarify intents + rapid consecutive + search_failed |
| `package.json` | Register Phase 18 + related WhatsApp suites in `npm test` |

Phase 18 salary/context fixes were **not rewritten** in this verification pass beyond multi-city cue refinement and search-failure situation hardening.

---

## 5. Conversation state design

Durable (Mongo session): language, activeRole, lastIntent, lastCategory/lastLocation, salary/experience, lastJobs (≤3), pending\* fields, pendingClarification/nearbyCity, lastClarifyMissing/clarifyAttempts, soft resume skills.

Ephemeral: per-turn `BotUnderstanding` via `resolveTurnUnderstanding` / `mergePending`.

Greetings do not clear search filters.

---

## 6. Intent & entity-resolution improvements

- Telugu salary preference + correction phrases  
- Salary-only follow-ups keep prior role + city  
- Vague job ask without new place keeps prior role  
- Location change: `instead of` (before), `badhulu`/`rather than` (after), `change to`, `ki marchu`  
- Short clarifications merge onto pending search  

---

## 7. Job search and filter fixes

- Updated `minSalary` reaches `publicJobFilters` (Phase 18 assertions)  
- Show-more reuses criteria; excludes shown IDs  
- No-match cites active salary  
- **Empty successful search ≠ failure:** `situation: "jobs"` + empty vs `situation: "search_failed"` / `serviceErrorCopy`  

Salary semantics: **minimum monthly preference**.

---

## 8. Role authorization and security

Central `authorizeWhatsAppRole` unchanged in strength. Role never taken from user claim or LLM.

---

## 9. Authorized job-search execution path (audit)

**Runtime path (all conversational JOB_SEARCH / PROFILE_* searches):**

1. `authorizeWhatsAppRole` in `processInboundTurn` (before handlers)  
2. `buildReply` → `searchJobs`  
3. Defensive employer block inside `searchJobs`  
4. `loadJobs` → `jobService.listPublicActiveJobs`  

**Typed tools path (`executeSearchPublicJobs`):**

- Same `authorizeWhatsAppRole` + `publicJobsQuerySchema` + `jobService.listPublicActiveJobs`  
- Used as authorized capability surface for tests / future tool-calling  
- **Inconsistency (documented, not rewritten):** live turns do **not** call `executeSearchPublicJobs`; they call `loadJobs` directly after the same role gate. Both hit the same job service and role policy. Unifying into one call site remains a follow-up, not a correctness blocker.

---

## 10. AI, translation, database, queue failure handling

| Failure | Behavior | Evidence |
|---------|----------|----------|
| Sarvam understand timeout/error | Local/fallback understanding; no invented jobs | `sarvam.client.ts` catch → fallback |
| Translation fail | Keep deterministic source text; mark failed; no Chat LLM substitute | `sarvam-translate.client.ts`; bot translation tests |
| OpenAI assist fail / hallucination | Discard assist; keep deterministic facts | `openai-assist` routing + client |
| DB / `listPublicActiveJobs` throw | `searchJobs` → `situation: "search_failed"` (service error copy); outer turn catch also uses `serviceErrorCopy` | service + Phase 18 test |
| Redis/queue unavailable | Log `queue_unavailable`; process inline after ACK | `whatsapp-inbound.queue.ts` |
| Per-phone concurrent messages | Serialized via `runInPhoneOrder` | phone-order + Phase 18 rapid test |

---

## 11. Queue and webhook reliability

Signature, ACK-before-AI, dedupe, BullMQ attempts=2, duplicate jobId skip, inline fallback — preserved. Covered by existing inbound/order/notification tests. **Not load-tested live.**

---

## 12. Tests added / expanded

`whatsapp-phase18-regression.test.ts`:

- Mandatory salary-correction multi-turn  
- Multi-city location corrections  
- Clarify loop across role/location/which_job/purpose  
- Rapid consecutive ordered merges (`runInPhoneOrder`)  
- `search_failed` ≠ empty jobs reply  

---

## 13. Exact commands and real results

### Backend (documented scripts: `backend/README.md`, `package.json`)

```bash
cd aslijobs/backend
npm test
# Result: 1123 passed, 0 failed (exit 0) — duration ~67s

npm run build
# Result: tsc → exit 0

npx tsc --noEmit   # equivalent typecheck
# Result: exit 0 (also covered by build)
```

Backend has **no** `lint` script in `package.json` / README.

Focused WhatsApp regression (also in `npm test`):

```bash
npx tsx --test src/modules/whatsapp/whatsapp-phase18-regression.test.ts \
  src/modules/whatsapp/whatsapp-job-search-context.test.ts \
  src/modules/whatsapp/whatsapp-bot.criteria.test.ts
# Result: 34 passed, 0 failed
```

### Frontend

```bash
cd aslijobs/frontend
npm test
# Result: 104 passed, 1 failed (exit 1)
# Failure: src/i18n/employer-interface-language.test.ts
#   "removes the language selector from the employer navbar..."
# Classification: PRE-EXISTING — unrelated to WhatsApp backend changes

npm run lint
# Result: exit 1 — 78 errors, 35 warnings (React Compiler / setState-in-effect, refs)
# Classification: PRE-EXISTING — no WhatsApp module files in this tree were edited

npm run build
# Result: Next.js production build exit 0
```

### Admin

```bash
cd aslijobs/admin
npm test
# Result: 54 passed, 0 failed (exit 0)

npm run lint
# Result: exit 0 with oxlint warnings only (hooks / fast-refresh)

npm run build
# Result: exit 2
#   InboxChatPanel.tsx(1170,35): TS2345 string | undefined not assignable to string
# Classification: PRE-EXISTING — admin inbox UI; not caused by WhatsApp bot changes
```

---

## 14. TypeScript, lint, and build summary

| Package | Test | Build | Lint |
|---------|------|-------|------|
| backend | **1123/1123 pass** | **pass** | N/A (no script) |
| frontend | 104 pass / **1 pre-existing fail** | **pass** | **78 pre-existing errors** |
| admin | **54/54 pass** | **1 pre-existing TS error** | warnings only (exit 0) |

No WhatsApp-bot regression failures. No security controls disabled.

---

## 15. Environment variables and deployment

No new required env vars. Session fields additive on Mongo.

Relevant: Meta WhatsApp secrets, `REDIS_URL` (optional), `SARVAM_*`, Mayura, `WHATSAPP_OPENAI_ASSIST_ENABLED` / `OPENAI_*`, media/OCR flags.

**Render build:** `npm run render-build` (`npm ci --include=dev && npm run build`) per backend README.

---

## 16. Staging test plan (Meta WhatsApp) — manual, not executed here

Prerequisites: staging backend with staging Meta app / test number; Mongo staging DB; Redis optional; OpenAI/OCR flags **false** initially.

1. Webhook verify GET + signed POST with test payload; confirm HTTP 200 before slow work.  
2. Duplicate `messageId` → single reply.  
3. Seeker Phase 18 script: Driver typo → Hi → electrician → I want jobs → salary 40k context → `20,000 lo chunchandi` → confirm response uses ₹20,000 filters, not ₹40,000.  
4. Multi-city: `Hyderabad badhulu Vijayawada` and `Chennai instead of Hyderabad`.  
5. Rapid double-send: salary then location change; confirm ordered final filters.  
6. Employer: posted-job status; seeker job search blocked.  
7. Force DB error in staging only (optional) → must see fetch-error copy, not “no jobs found”.  
8. Pause bot in admin inbox → no auto-reply.  
9. Enable OpenAI assist only after model ID confirmed; re-run one seeker search.  

**Do not** run destructive tests against production user data.

---

## 17. Live WhatsApp / OpenAI / load testing

| Item | Status |
|------|--------|
| Live Meta WhatsApp staging | **Not performed** |
| Production OpenAI assist | **Not performed** |
| Load / multi-process Redis stress | **Not performed** |

---

## 18. Known limitations

1. Runtime search does not call `executeSearchPublicJobs` (same gate + service; dual call sites).  
2. Clarify loop bound is for `location` / `role` missing fields.  
3. Multi-city without change cues still uses first city.  
4. Job alerts not auto-subscribed from chat.  
5. Frontend lint / one frontend test / admin build TS error are pre-existing blockers outside WhatsApp bot scope.  
6. Backend has no project lint script.

---

## 19. Rollback procedure

1. Redeploy previous backend artifact (`npm run build` / Render previous deploy).  
2. Keep `WHATSAPP_OPENAI_ASSIST_ENABLED=false` and OCR flags off if unstable.  
3. Session fields are additive; no down-migration required.  
4. Pause bot per phone via admin inbox if duplicate replies appear; drain worker if needed.

---

## 20. Recommended next steps

1. Execute staging Meta plan above.  
2. Fix pre-existing frontend lint/test and admin `InboxChatPanel` TS error in separate PRs.  
3. Optionally route `loadJobs` through `executeSearchPublicJobs` for a single authorized call site.  
4. Add metrics for `JOB_SEARCH_FAILED`, `CLARIFY_LOOP_BREAK`, salary updates.  
5. Confirm OpenAI model ID before staging assist enablement.

---

## Evidence summary

| Claim | Evidence |
|-------|----------|
| Full backend `npm test` | **1123 passed**, exit 0 |
| Backend `npm run build` | exit 0 |
| Phase 18 + expanded regressions | **34 passed** in focused run; included in full suite |
| Search failure ≠ empty search | `search_failed` situation + Phase 18 assertion |
| Authorized search path | Code comment + role gate + defensive `searchJobs` |
| Live WhatsApp ready | **Not claimed** |

### Classification

- **Implemented and tested (offline):** salary/context Phase 18, multi-city cues, clarify loops, rapid ordered merges, search_failed distinction, full backend suite + build.  
- **Implemented but not live-tested:** webhook/queue/media; staging Meta plan documented only.  
- **Pre-existing failures (not from this WhatsApp work):** frontend 1 test fail; frontend eslint 78 errors; admin build TS2345 in `InboxChatPanel.tsx`.  
- **Not performed:** live Meta, production OpenAI, load testing.
