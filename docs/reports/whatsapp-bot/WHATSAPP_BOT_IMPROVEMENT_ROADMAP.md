# AsliJobs WhatsApp Bot — Improvement Roadmap

Date: 6 November 2026  
Each item names the current code limit. No application code was changed for this audit.

## P0 — Correctness and trust

### P0.1 Do not treat yes/no as a dead-end while a clarification is open

Why: `detectProtocolTurn` returns before `pendingClarification` is read.  
Limit: `whatsapp-bot.logic.ts` `detectProtocolTurn`; early return in `processInboundTurn`.  
Impact: clarify menus stop working when the user answers with yes, no, avunu, or kadu.  
Complexity: low.  
Files: `whatsapp-bot.logic.ts`, `whatsapp-bot.service.ts`, `whatsapp-conversation-context.test.ts`.  
Risk: real “no” after a finished turn must still be a simple ack. Gate the change on a non-empty `pendingClarification` or `lastClarifyMissing`.  
Sequence: first.

### P0.2 Stop silent rate-limit drops

Why: `allowReply` returns without a message.  
Limit: in-memory map in `whatsapp-bot.service.ts`.  
Impact: bursts look like a dead bot; multiple Node processes do not share the counter.  
Complexity: low if the message is local; medium if the counter moves to Redis.  
Files: `whatsapp-bot.service.ts`, `whatsapp-redis.ts`.  
Risk: sending the limit line must itself be limited to one message per window.  
Sequence: with P0.1.

### P0.3 Ack the webhook only after the job is queued

Why: `receiveWhatsAppWebhook` sends HTTP 200 before `routeConversationalMessages`.  
Limit: `whatsapp-webhook.controller.ts`.  
Impact: a crash in the gap drops the turn unless Meta retries and the claim was released.  
Complexity: medium. Meta expects a fast 200; enqueue must stay under the platform timeout.  
Files: `whatsapp-webhook.controller.ts`, `whatsapp-inbound.queue.ts`.  
Risk: slower 200 if Redis is down (inline handling today already blocks). Keep the inline fallback.  
Sequence: after P0.1, before any prompt work.

## P1 — Answer accuracy

### P1.1 Compare salaries on the jobs already shown

Why: “which one pays more?” is not in `looksLikeRelativeHigherSalary`, and that function only adds 5000 to the previous minimum.  
Limit: `whatsapp-bot.criteria.ts`, `mergePending`.  
Impact: follow-ups about the list the user can see are wrong or restart a search.  
Complexity: low. Use `lastJobs[].salaryLabel` and `formatSalaryLabel`. If labels are missing, say pay was not listed.  
Files: `whatsapp-bot.logic.ts`, `whatsapp-bot.criteria.ts`, `whatsapp-job-results.test.ts`.  
Risk: undisclosed salaries must not be treated as zero.  
Sequence: first accuracy item.

### P1.2 Say when a filter cannot be applied

Why: night shift is preserved as “not a role” and the old list logic continues without telling the user that shift is not a filter.  
Limit: `looksLikeShiftConstraint`.  
Impact: the reply looks like the bot ignored the new constraint.  
Complexity: low.  
Files: `whatsapp-bot.logic.ts` `buildDeterministicReply`.  
Sequence: with P1.1.

### P1.3 Short unknown text

Why: under 12 characters, Sarvam never runs.  
Limit: `shouldUseLlmFallback`.  
Impact: “jobs”, “apply”, and unknown one-word roles depend on regex luck.  
Complexity: low. A local table for those words is safer than calling a model for every “ok”. Do not remove the protocol list.  
Files: `whatsapp-bot.logic.ts`, `whatsapp-bot.test.ts`.  
Sequence: after P0.1 so yes/no stay special-cased.

### P1.4 Turn on E5 only as a matched index

Why: default retrieval is lexical plus optional hash embeddings. Hash buckets do not match Telugu tokens to English pages.  
Limit: `WEBSITE_KNOWLEDGE_SEMANTIC_ENABLED` default false; provider default `hash`.  
Impact: website answers miss paraphrases and Indic questions.  
Complexity: medium. Reindex with `Xenova/multilingual-e5-small` (384 dims). `embeddingsCompatible` must stay in the query path.  
Files: `website-knowledge.embeddings.ts`, `website-knowledge.sync.ts`, `website-knowledge.service.ts`, env on the API host.  
Dependency: model download on the server (`warmXenovaEmbeddingModel`).  
Risk: CPU latency. `MAX_INFER_CONCURRENCY` is already 2. Do not mix hash and E5 chunks.  
Sequence: after a staging reindex, not before P0.

### P1.5 Keep knowledge answers extractive and shorter

Why: `composeGroundedKnowledgeAnswer` can append up to 1,600 characters from the top chunk.  
Limit: `website-knowledge.answer.ts`.  
Impact: WhatsApp bubbles that quote a whole section.  
Complexity: low. Cap the body, keep one source URL, and do not add an answer LLM.  
Files: `website-knowledge.answer.ts`, `website-knowledge.test.ts`.  
Sequence: independent of E5.

## P2 — Conversation intelligence

### P2.1 Pass slots to the classifier on every non-protocol turn

Why: `prev` is attached only when `isFollowUpFragment` is true.  
Limit: `processInboundTurn` `prior` object.  
Impact: Sarvam restarts context on longer follow-ups. Local merge still saves many of these, so this matters mainly when local confidence is low.  
Complexity: low. Send last intent, location, role, and salary band. Do not send the inbox transcript.  
Files: `whatsapp-bot.service.ts`, `sarvam.client.ts`.  
Risk: the model may overwrite a slot the local merger would have kept. Run `resolveTurnUnderstanding` after the model, which already happens.  
Sequence: after P1.3.

### P2.2 One intent per turn, with an explicit split when two intents are obvious

Why: `BotUnderstanding.intent` is singular.  
Limit: `understandLocally` returns one object.  
Impact: “show driver jobs and what is my application status” answers one side.  
Complexity: medium. Only split when both clause detectors fire (`messageLooksLikeJobAsk` and an application phrase). Otherwise ask which to do first.  
Files: `whatsapp-bot.logic.ts`.  
Sequence: after P1.

### P2.3 Do not clear search context on a bare greeting when a search is active

Why: greeting reset is unconditional.  
Limit: `clearedTemporarySearchSessionFields` on protocol greeting.  
Impact: users who say hello between filters lose the search.  
Complexity: low.  
Files: `processInboundTurn`.  
Risk: product owners may want hello to mean “start over”. Confirm before changing. The code comment says the reset is intentional.  
Sequence: product decision, then a small change.

## P3 — Performance and operations

### P3.1 Delay the “Looking at your question...” bubble

Why: it is sent in parallel with every Sarvam classify.  
Limit: `Promise.all` in `processInboundTurn`.  
Impact: extra message and extra Meta call on every fallback.  
Complexity: low.  
Files: `whatsapp-bot.service.ts`.

### P3.2 Shared rate limit and queue metrics

Why: `allowReply` and worker failures only hit logs (`[WhatsApp] worker_failed`).  
Limit: no dead-letter dashboard in the inbound queue file.  
Complexity: medium.  
Files: `whatsapp-inbound.queue.ts`, operations health if a counter endpoint already exists. Do not add a new product surface unless one is already there.

### P3.3 Session versus inbox

Why: agents see the inbox transcript; the bot does not. That split is correct for privacy, but failed turns are hard to debug.  
Complexity: low. Log intent, language source, and situation without the phone number (the code already masks phones in several lines).  
Files: existing `[WA-FLOW]` logs. Verify production log retention outside this repo.

## P4 — Not recommended yet

- Replacing Sarvam with another chat model as the primary brain. The deterministic job path is what keeps vacancies real. A new model does not fix yes/no, salary compare, or hash retrieval.
- Letting the LLM call Mongo directly. `whatsapp-bot-tools.ts` already limits tools. Keep it that way.
- In-chat application submit. The hallucination filter and `howToApplyCopy` define the current product. Changing it is a product project, not an accuracy patch.
- Interactive list messages for job cards. The sender path is session text. Buttons exist on templates only. Useful later, not required to fix misunderstanding.

## Testing strategy

1. Keep the unit suites that already encode context (`whatsapp-conversation-context.test.ts`, `whatsapp-bot.criteria.test.ts`).
2. Add cases for P0.1 and P1.1 before shipping those changes.
3. Use `WHATSAPP_BOT_TEST_CASES.md` as an evaluation set. It has not been executed.
4. Run the knowledge E2E only with `WHATSAPP_E2E_ENABLED` and an allowlist (`website-knowledge.whatsapp-e2e.ts`). Default is off.
5. Do not mark production readiness from unit tests alone. Meta template approval, Sarvam latency, and the live embedding provider are environment facts.

## Production readiness

The bot is a real, gated pipeline: signature checks, role checks, database-backed jobs, and template notifications exist. It is not “an LLM with tools” and should not be described as one while OpenAI assist and semantic retrieval default off.

Ready for production traffic only if operations confirm: Meta verify token and app secret, `REDIS_URL`, Sarvam key, template names in `whatsapp-notification.constants.ts` match the approved Meta templates, and the knowledge index language matches the embedding provider actually deployed. Those checks are outside this repository snapshot.
