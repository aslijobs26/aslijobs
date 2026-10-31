# AsliJobs WhatsApp Bot — Production Audit & Hardening Report

Date: 2026-10-31 (seeker NL + greeting-reset pass)  
Scope: Job-seeker natural-language search, standalone greeting session reset, entity coverage, Phase 18 preservation.  
Source of truth: `aslijobs/backend/src/modules/whatsapp/`

---

## 1. Existing architecture (unchanged spine)

Webhook → signature → ACK → dedupe → BullMQ/inline → per-phone order → `processInboundTurn` → local/Sarvam NLU → `resolveTurnUnderstanding` → role gate → `buildReply` / `searchJobs` → localize → send.

Authorized search: `authorizeWhatsAppRole` → `searchJobs` → `loadJobs` → `jobService.listPublicActiveJobs` (typed tools share gate/service; not sole runtime call site).

---

## 2. Root causes — `interior designer in bhubaneswar` screenshot

Verified in code (not guessed from UI):

| Factor | Finding |
|--------|---------|
| Entity extraction | `Interior Designer` was **not** in `ROLES`; free-title patterns required `jobs`/`vacancy`/`looking for` |
| Location | `Bhubaneswar` was **not** in `PLACES` |
| Intent | No category + no location + no job-word → `UNKNOWN` → clarify (“what kind of job?”) |
| Menu/stale state | Secondary: open-search pending after Find Jobs did not block once entities extracted; primary bug was missing taxonomy |

Standalone `Hi` previously **did not** clear `lastCategory` / `lastLocation` / salary / `lastJobs`, so temporary search criteria silently carried over (product requirement now: fresh conversation).

---

## 3. Files changed (this pass)

| File | Change |
|------|--------|
| `whatsapp-bot.logic.ts` | Cities (Bhubaneswar+); roles (Interior Designer, Car Driver, Security Guard, …); `clearedTemporarySearchSessionFields`; greeting protocol + seeker welcome copy; bare `profile` → `ACCOUNT_STATUS` |
| `whatsapp-bot.criteria.ts` | Free title: `ROLE in KNOWN_PLACE`; restore `job in accounts` department pattern; avoid false place matches |
| `whatsapp-bot.service.ts` | Protocol + GREETING paths clear temporary search session fields; `SESSION_RESET` log |
| `whatsapp-seeker-conversation.test.ts` | **New** regression suite |
| `whatsapp-phase18-regression.test.ts` | Greeting clears pending in multi-turn simulator |
| `package.json` | Register seeker conversation tests |

Phase 18 salary correction, role auth, dedupe, and `search_failed` handling **preserved**.

---

## 4. Implemented behaviour

### Greeting / fresh conversation
- Standalone `Hi` / `Hello` / `Hey` / `Namaste` / script greetings → welcome + **clear temporary search slots** (role, location, salary, experience, pending clarify, lastJobs, lastIntent).
- Permanent data kept: account link, saved language preference, applications, profile documents.
- `Hi, I want driver jobs in Hyderabad` is **not** a protocol greeting; job request is processed.

### Complete NL job requests
- `interior designer in bhubaneswar` → Interior Designer + Bhubaneswar → search-ready (`JOB_SEARCH`, not clarify).
- One-message role+location(+optional salary/experience) searches without asking for optional fields.
- Multi-turn: `carpenter` → ask location; `Hyderabad` merges and searches.
- Bare `Hyderabad` with no prior role stays location-only (asks for role via missing category).

### Menu
- `check application` → `MY_APPLICATIONS`
- `profile` → `ACCOUNT_STATUS`
- `Find Jobs` → open `JOB_SEARCH`
- New complete request overrides empty open-search pending state

### Search outcomes (unchanged semantics)
- Results → `jobs`
- Successful empty → empty `jobs` / no-match copy
- Exception → `search_failed` / service error copy (not “no jobs”)

---

## 5. Exact commands and results

```bash
cd aslijobs/backend

npx tsx --test \
  src/modules/whatsapp/whatsapp-seeker-conversation.test.ts \
  src/modules/whatsapp/whatsapp-phase18-regression.test.ts \
  src/modules/whatsapp/whatsapp-bot.criteria.test.ts \
  src/modules/whatsapp/whatsapp-bot.test.ts \
  src/modules/whatsapp/whatsapp-job-search-context.test.ts \
  src/modules/whatsapp/whatsapp-orchestration-e2e.test.ts
# Result: 136 passed, 0 failed

npm test
# Result: 1131 passed, 0 failed (exit 0)

npm run build
# Result: tsc exit 0
```

Frontend/admin: not re-run this pass (no shared UI changes). Prior known pre-existing frontend lint/test and admin `InboxChatPanel` TS issues remain unrelated.

---

## 6. Staging verification (Meta) — not executed

Add to prior staging plan:

1. After a salary-constrained search, send `Hi` → welcome; then `Show me jobs` → must **ask** for role/location (must not reuse Electrician/Hyderabad/40k).  
2. Send `interior designer in bhubaneswar` → search or honest no-match; **must not** ask job type again.  
3. `Hi, I want car driver jobs in Hyderabad` → search with Car Driver + Hyderabad.  
4. Menu Find Jobs → then paste a full role+city message → search.  

Live Meta / OpenAI / load tests: **not performed**.

---

## 7. Known limitations

1. Taxonomy is still finite; obscure titles rely on free-title heuristics.  
2. Runtime search still uses `loadJobs` directly (tools not sole path).  
3. Clarify-loop bound still mainly location/role.  
4. Greeting reset is Mongo session fields; Redis only queues jobs (no separate search-state cache). In-flight queued turns started **before** Hi may still finish with old context — mitigated by per-phone serialization when both run on same process.  
5. Not live-WhatsApp certified.

---

## 8. Rollback

1. Redeploy previous backend artifact.  
2. Keep OpenAI/OCR flags off if unstable.  
3. Additive taxonomy/session clear logic; no DB migration.  
4. Pause bot per phone via admin inbox if needed.

---

## 9. Evidence classification

| Area | Status |
|------|--------|
| Interior Designer + Bhubaneswar extraction | Implemented + tested |
| Standalone Hi clears temp search | Implemented + tested |
| Greeting+request keeps job search | Implemented + tested |
| Phase 18 salary/context | Preserved + tests green |
| Full backend suite + build | **1131 pass**, build **pass** |
| Live Meta WhatsApp | **Not verified** |
| Production OpenAI / load | **Not verified** |
