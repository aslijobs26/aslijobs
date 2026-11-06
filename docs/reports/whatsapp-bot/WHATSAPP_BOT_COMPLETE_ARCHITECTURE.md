# AsliJobs WhatsApp Bot — Current Architecture

Date: 6 November 2026  
Scope: repository inspection of `aslijobs/backend`, `aslijobs/admin`, and the WhatsApp-facing parts of `aslijobs/frontend`.  
Method: source reading and a focused unit-test run. Production Meta traffic, live Sarvam/OpenAI calls, and a full crawl of the knowledge index were not executed.

This document describes the implementation that is in the repository. Feature flags default off unless `backend/src/config/env.ts` says otherwise.

## 1. What the bot is

The conversational bot is a backend pipeline. Meta calls `POST /api/v1/whatsapp/webhook`. The process stores the inbound message in the operations inbox, claims the Meta message id, and either enqueues a BullMQ job or handles the turn in-process. Understanding is mostly deterministic (`understandLocally` in `whatsapp-bot.logic.ts`). Sarvam `sarvam-105b` is a JSON classifier used only when the local read is not confident. OpenAI phrasing is behind `WHATSAPP_OPENAI_ASSIST_ENABLED` (default false). Website answers are retrieved snippets, not a free-form LLM.

The bot does not create job applications or job posts inside WhatsApp. Those actions are website links plus account-status copy. Interview scheduling is outbound Meta templates, not an in-chat scheduler.

## 2. Entry points that control the bot

| Step | File | Function |
| --- | --- | --- |
| Route mount | `backend/src/routes/index.ts` | `apiRouter.use("/whatsapp", whatsappRouter)` |
| Verify + receive | `backend/src/modules/whatsapp/whatsapp.routes.ts` | `GET/POST /webhook` |
| HMAC + routing | `whatsapp-webhook.controller.ts` | `verifyWhatsAppWebhook`, `receiveWhatsAppWebhook` |
| Queue | `whatsapp-inbound.queue.ts` | `enqueueWhatsAppInbound`, `startWhatsAppInboundRuntime` |
| Turn | `whatsapp-bot.service.ts` | `handleConversationalMessage` → `processInboundTurn` |
| Understanding | `whatsapp-bot.logic.ts` | `understandLocally`, `resolveTurnUnderstanding` |
| Classifier LLM | `sarvam.client.ts` | `understandMessage` |
| Reply text | `whatsapp-bot.logic.ts` | `buildDeterministicReply` |
| Optional rephrase | `openai-assist.client.ts` | `assistWhatsAppReply` |
| Send | `whatsapp.service.ts` | `sendBotTextMessage` |

Webhook JSON is parsed in `backend/src/app.ts`. Bodies over 256 KB do not keep `rawBody`, so the HMAC check fails closed.

## 3. Incoming message flow

```
Meta POST /api/v1/whatsapp/webhook
  → verifyWhatsAppSignature (x-hub-signature-256, META_APP_SECRET)
  → persistInboundMessages (inbox, delivery statuses)
  → HTTP 200
  → routeConversationalMessages
       claimWhatsAppEvent(messageId)
       isBotPausedForPhone → stop (human inbox only)
       audio | image | document | text/button/interactive title
       → enqueueWhatsAppInbound
            Redis present: BullMQ queue "whatsapp-inbound" (2 attempts)
            Redis absent or enqueue timeout: handleConversationalMessage inline
  → runInPhoneOrder(phone)
  → processInboundTurn
       lookupAccount + WhatsAppSession
       media / STT / protocol / local intent / optional Sarvam / optional OpenAI
       buildReply (Mongo job and application queries)
       localizeDeterministicReply (Sarvam translate when needed)
       optional assistWhatsAppReply
       WhatsAppSession update after a successful send path
       sendTextMessage
```

Synchronous on the webhook request: signature check, inbox persist, event claim, enqueue. The HTTP handler acknowledges before `routeConversationalMessages` finishes only after persist succeeds (`receiveWhatsAppWebhook`). Routing itself is still in the same promise after `res.sendStatus(200)`.

Asynchronous after enqueue: the BullMQ worker calls `handleConversationalMessage`. Concurrency is `WHATSAPP_INBOUND_CONCURRENCY` (default 4). Same-phone turns are serialized by `runInPhoneOrder` (`whatsapp-phone-order.ts`).

Redis uses:

- BullMQ connection for `whatsapp-inbound` and the notification/reminder queues.
- Not the conversation memory. Memory is Mongo `WhatsAppSession`.

AI inference points:

- Sarvam speech-to-text (`saaras:v3`, fallback `saarika:v2.5`) for voice notes.
- Sarvam chat `sarvam-105b` for JSON intent when `shouldUseLlmFallback` is true.
- OpenAI chat (`OPENAI_MODEL`, default `gpt-6-luna`) only when the assist flag is on and `shouldUseOpenAiAssist` allows the situation.
- Xenova `multilingual-e5-small` only when website-knowledge semantic retrieval is enabled and the embedding provider is xenova/e5. Default provider is hash. Semantic retrieval defaults off.

Database queries happen in account lookup, session read/write, inbox persist, public job search, application lists, employer job lists, and website-knowledge FAQ/section/chunk loads.

Failures:

- Bad signature or verify token: HTTP 403, no bot turn.
- Inbox persist throws: HTTP 500, routing does not start.
- Route throws after claim: `releaseWhatsAppEvent` so a later delivery can retry.
- Duplicate message id: skipped.
- Account lookup throws: English `serviceErrorCopy`, turn stops.
- Voice STT fails: `voiceUnclearCopy`, turn stops.
- Sarvam classifier missing key, timeout (8s), or bad JSON: `understandLocally` fallback.
- Job search throws: situation `search_failed`, not an empty job list.
- Meta send failure: logged; `sendBotTextMessage` does not throw. Ambiguous timeouts are not retried.
- In-process rate limit `allowReply`: 20 replies per phone per 60 seconds, then the turn returns with no message. The map is process-local.

Retries:

- BullMQ inbound: 2 attempts, exponential backoff 2s. No separate dead-letter queue in this file; failed jobs are kept (`removeOnFail: 100`).
- Notification queues have their own retry/claim logic in `whatsapp-notification.model.ts`.
- Sarvam STT tries a second model. The classifier does not.

## 4. Registration and OTP

OTP is not the conversational bot.

`otp.factory.ts` builds `WhatsAppOtpProvider`, which calls `WhatsAppService.sendOtpMessage`. That sends the approved template `WHATSAPP_OTP_TEMPLATE_NAME` (authentication button) through the Cloud API. On acceptance, `recordOutboundMessage` calls `ensureInboxConversation`. An OTP send therefore creates or updates an operations inbox thread before any user reply.

`WhatsAppSession` is not created by OTP. It is upserted on an inbound turn (`processInboundTurn`). First user message is what starts bot memory (language, menu state, last jobs).

Account linking is a phone lookup at the start of every turn (`lookupAccount`). Indian national numbers map through `indianWhatsAppNationalPhone`. Foreign WhatsApp numbers are not collapsed onto Indian accounts (`whatsapp-security.test.ts`). Blocked or suspended seekers and inactive employers are not treated as linked.

Employer and job-seeker registration themselves stay on the website. The bot returns register URLs and incomplete-profile copy (`registrationCopy`, `postJobGuideCopy`, `seekerProfileStatusCopy`).

## 5. Understanding and reply generation

Order inside `processInboundTurn` after text exists:

1. `isNoResumeMessage` → fixed copy.
2. `detectProtocolTurn` for hi/thanks/yes/no/ok when the text is at most 24 characters. A greeting clears temporary search fields and returns a template. Yes/no never reach intent classification.
3. `understandLocally`. If `shouldUseLlmFallback` is false, that result is final. Fallback is skipped when the local intent is not `UNKNOWN` and confidence is at least 0.9, when the text is shorter than 12 characters, or when the turn is protocol or an explicit account-role choice.
4. Otherwise `understandWithOpenAi` if configured, else Sarvam `understandMessage`. Sarvam runs in parallel with a short “Looking at your question...” text.
5. `resolveTurnUnderstanding` overlays entities, follow-ups, and session slots (`mergePending`).
6. `authorizeWhatsAppRole` blocks cross-role intents before tools run.
7. `buildReply` queries jobs or applications, or `answerWebsiteKnowledgeQuestion`.
8. `buildDeterministicReply` then `localizeDeterministicReply` (Sarvam translate).
9. Optional OpenAI rephrase. `looksLikeHallucinatedFacts` drops invented salaries, companies, and “successfully applied” claims.

The bot does not translate the user message into English before classification. `detectLanguage` scores native script and romanized cues (`ROMAN_TELUGU`, `ROMAN_HINDI`, and the Tamil, Kannada, and Malayalam lists) and can inherit the session language. Sarvam is asked for a language field, but `resolveLanguage` prefers a clear signal in the current text.

## 6. Website knowledge

Ingestion: `website-knowledge.sync.ts` and `website-knowledge.queue.ts` crawl public pages (`website-knowledge.crawl.ts`, `website-knowledge.discover.ts`), optionally use Playwright for thin pages when `WEBSITE_KNOWLEDGE_BROWSER_FALLBACK_ENABLED` is true, chunk sections, and store FAQ plus chunk documents.

Embeddings (`website-knowledge.embeddings.ts`):

- Default: `aslijobs-hash-v1`, 256 dimensions, L2-normalized hashed bag of tokens. This is not a semantic model.
- Optional: `Xenova/multilingual-e5-small`, 384 dimensions, L2-normalized (`pooling: mean`, `normalize: true` in the Xenova call). Query text is prefixed as an E5 query when `asQuery` is set.
- `embeddingsCompatible` rejects mixed hash and E5 vectors.
- If Xenova fails to load, `embedKnowledgeText` falls back to hash and logs `e5_infer_failed`.

Retrieval (`website-knowledge.retrieve.ts`, `website-knowledge.service.ts`):

- Lexical FAQ and section scoring always runs.
- Dense blend runs only when `WEBSITE_KNOWLEDGE_SEMANTIC_ENABLED` is true. Cosine below 0.22 is ignored. A new semantic hit needs a score of at least 18.
- `confidenceFromHits`: FAQ near-exact or score ≥ 24 is high; score ≥ section minimum is low; otherwise none.

Answer (`website-knowledge.answer.ts`): `composeGroundedKnowledgeAnswer` pastes sanitized chunk text and a source URL. It does not call an LLM. Prompt-injection lines in retrieved text are stripped. No-hit copy points at Help Center, Contact, and FAQs.

The bot calls this only for intent `PLATFORM_KNOWLEDGE` (`buildReply`). OpenAI assist is hard-disabled for situation `platform_knowledge`.

Live jobs are not in this index. Job questions use `loadJobs` / `jobService` public queries.

## 7. Supported workflows confirmed in code

### Job seeker

| Workflow | Status | Where |
| --- | --- | --- |
| Language-aware greeting and help | Implemented | `protocolReply`, `capabilityCopy` |
| Public job search with city, role, experience, salary | Implemented | `runAuthorizedJobSearch`, `loadJobs` |
| Follow-up location, role, salary, show-more, ordinal pick | Implemented for the patterns in `mergePending` and `looksLikeShowMoreJobs` | logic + tests |
| Job details for a numbered result | Implemented | `JOB_DETAILS` uses `lastJobs` |
| How to apply | Guide plus public URL | `howToApplyCopy`. No in-chat apply |
| My applications, counts, status, coverage | Implemented for a linked seeker | `buildReply` application cases |
| Skills from profile | Implemented | `MY_SKILLS` |
| Profile-based job search | Implemented | `PROFILE_JOBS` uses seeker role and city |
| Resume image/PDF | Partial, flag off by default | `whatsapp-media-understand.service.ts`. Skills stored on the session for 24 hours. Does not write the JobSeeker profile |
| Voice notes | Implemented when Sarvam STT is configured | `transcribeWhatsAppAudio` |
| Registration | Link and status copy only | `registrationCopy` |

### Employer

| Workflow | Status | Where |
| --- | --- | --- |
| Account / verification status | Implemented | `employerVerificationCopy` |
| Post a job | Guide and `/post-job` link. Not an in-chat draft | `postJobGuideCopy` |
| List own jobs and application counts | Implemented | `EMPLOYER_JOBS`, `EMPLOYER_JOB_STATUS`, `EMPLOYER_APPLICATION_COUNT` |
| Candidate job search | Blocked | `SEEKER_PRIVATE_INTENTS`, `authorizeWhatsAppRole` |
| Interview create/reschedule/cancel | Not in the bot. Outbound templates | `notifications/interview-*.notification.ts` |
| Approval, rejection, incomplete-draft reminders | Outbound templates and BullMQ reminder queues | notification constants and queues |

Employers and seekers who share a phone get `choose_account` until `activeRole` is set, except public-job scope which still goes through the role gate.

## 8. Outbound notifications

`WHATSAPP_NOTIFICATION_EVENTS` in `whatsapp-notification.constants.ts` covers account created, profile reminders, employer approval/rejection, job submitted/approved/rejected/incomplete, application submitted/received, and interview scheduled (phone, online, offline), rescheduled, and cancelled.

Sends are approved templates with language codes, not free bot text. URL buttons exist only where `whatsapp-notification.policy.ts` says the Meta template has a dynamic suffix. The conversational bot itself sends session text (`sendSessionTextMessage`), not interactive list messages.

Without `REDIS_URL`, `env.ts` warns that notification sends are inline and not durable across restarts.

## 9. Operations inbox

Models: `inbox/whatsapp-inbox.model.ts` (conversation + message). Store: `whatsapp-inbox-store.ts`. Admin API: `operations-whatsapp-inbox.*`. UI: `admin/src/routes/operations-whatsapp-inbox-page.tsx` and `admin/src/components/operations/inbox/`.

Pause (`pauseBotForAdmin` / `isBotPausedForPhone`) stops auto-replies. Delivery statuses from Meta update inbox rows and notification dispatch rows. Admin replies are a separate sender type. Inbox translation uses `operations-whatsapp-inbox-translation.service.ts` and is for staff view, not the bot reply language.

## 10. Session memory

Collection fields are in `whatsapp-session.model.ts`: language, active role, pending and last search slots, last jobs (id, title, company, city, salary), seen job ids, clarify attempts, resume skills, linked account id. TTL index: `lastInteractionAt` expires after 14 days.

There is no transcript of prior user utterances on the session. Follow-ups work from slots and `lastJobs`, not from a chat log. The inbox stores message bodies for operations, and the bot does not read that history back into the classifier except the compact `prev.loc` / `prev.role` sent to Sarvam when `isFollowUpFragment` is true (text length ≤ 48 and a role or place with few words).

## 11. Security controls present in code

- Verify-token compare is timing-safe. Challenge must match `^[A-Za-z0-9._-]{1,256}$`.
- HMAC required when `requireWhatsAppWebhookSecret()` is true. Production refuses `WHATSAPP_ALLOW_UNSIGNED_WEBHOOKS`.
- Webhook path is exempt from the global API limiter and has its own limiter: 600 requests per minute.
- Verify token is redacted from Morgan logs.
- Phone identity does not map non-Indian numbers onto Indian accounts.
- Role gate runs before tools. `whatsapp-bot-tools.ts` exposes only `search_public_jobs`, `list_seeker_applications`, and `list_employer_jobs`.
- OpenAI output is rejected when it invents applications or salaries.
- Retrieved website text is sanitized before it is shown.
- Live knowledge WhatsApp send (`website-knowledge.whatsapp-e2e.ts`) is default off and allowlist-gated.

## 12. Tests that exist

The backend `package.json` `test` script includes webhook signature, language, conversation context, job search, application flow, role policy, tools, orchestration, media/OCR, notifications, and website-knowledge suites. This audit executed 55 tests in five files (all passed). The rest of the script was not run. See the intelligence report for the executed list.
