# AsliJobs WhatsApp Bot — Intelligence Improvements

Date: 6 November 2026

This change follows the architecture audit, intelligence audit, and improvement roadmap. The bot is still the same pipeline: local rules first, Sarvam only when local confidence is low, database-backed job search, and role checks before tools. No new chat model was added. OpenAI assist stays off unless the host already sets `WHATSAPP_OPENAI_ASSIST_ENABLED`.

## Decisions

- **Yes/no while a clarification is open.** A bare yes, no, avunu, or kadu is still a protocol acknowledgement when nothing is pending. If the bot is waiting for a city or role, yes and no ask for that slot again. If the no-match menu is open, yes means the nearby city when one was offered (the Telugu copy says “if you say okay”), otherwise it relaxes the salary filter. No keeps the saved search and waits.
- **Hello during an active search.** A bare greeting no longer wipes role, city, salary, or the last job list. `start over`, `reset`, `new search`, and `kotha search` still clear the temporary search.
- **Salary comparison.** “Which one pays more?” compares `salaryLabel` on the jobs just shown. Empty and “not disclosed” labels are skipped, not treated as zero. “Higher salary” still raises the previous minimum by 5000 and searches again.
- **Night shift.** The reply says shift is not a filter, then shows the current role and city results.
- **Two intents.** A message that asks for jobs and application status together asks which to do first. It does not run both. “How do I apply for driver jobs” stays one request.
- **Webhook.** Inbox persist and enqueue finish before HTTP 200. A route failure releases the Meta message claim and returns 500 so Meta can retry. Duplicate claims and the inline Redis fallback are unchanged.
- **Rate limit.** 20 replies per phone per minute. The 21st message is one wait notice. Later messages in that minute stay quiet so the notice is not repeated. Redis holds the counter when `REDIS_URL` is set. A Redis error uses the in-process window.
- **Knowledge.** A failed E5 embedding is not stored as a hash vector. Semantic blend ignores chunks whose dimension does not match the query vector. Answers stay extracts plus one source link, capped at 900 characters. E5 is not turned on by this change.
- **Sarvam context.** Eligible non-protocol turns send last intent, city, role, and minimum salary. `resolveTurnUnderstanding` still prefers a city or role written in the current message, so the model cannot replace them.

## Before / after

| User message | Before | After |
|---|---|---|
| Bot asked for a city. User: “yes” / “avunu” | “Okay 👍” and the question was dropped | The city question is asked again |
| No-match menu open. User: “kadu” | “Okay 👍” | Saved search is kept; the bot waits |
| No-match menu with a nearby city. User: “yes” | “Okay 👍” | Search moves to that nearby city |
| Jobs were just shown. User: “which one pays more?” | Treated as unknown or as a new salary filter | Highest listed pay on that list, or a note that pay was not listed |
| After driver jobs in Hyderabad. User: “night shift” | Same list, with no explanation | The list, plus a line that night shift is not a filter |
| Active search. User: “Hi” | Search slots cleared | Search slots kept |
| User: “start over” | Not a reset unless it was a greeting | Temporary search cleared |
| “show driver jobs in Hyderabad and my application status” | One intent | Asks whether to do jobs or status first |
| “jobs” | Often unknown, and too short for Sarvam | Job search, keeping the previous role and city when they exist |
| “apply” after a job list | How-to-apply text, or unknown | Asks which shown job number |
| 21st reply in a minute | Silence | One rate-limit sentence |
| Webhook crash after HTTP 200 | Turn could be lost | 200 is sent only after persist and enqueue; a failed route returns 500 and releases the claim |

## Files changed

- `backend/src/modules/whatsapp/whatsapp-bot.logic.ts`
- `backend/src/modules/whatsapp/whatsapp-bot.service.ts`
- `backend/src/modules/whatsapp/whatsapp-bot.criteria.ts`
- `backend/src/modules/whatsapp/whatsapp-turn-resolver.ts` (new)
- `backend/src/modules/whatsapp/whatsapp-reply-limit.ts` (new)
- `backend/src/modules/whatsapp/whatsapp-intelligence-improvements.test.ts` (new)
- `backend/src/modules/whatsapp/sarvam.client.ts`
- `backend/src/modules/whatsapp/whatsapp-webhook.controller.ts`
- `backend/src/modules/whatsapp/inbox/whatsapp-inbox-store.test.ts`
- `backend/src/modules/website-knowledge/website-knowledge.answer.ts`
- `backend/src/modules/website-knowledge/website-knowledge.embeddings.ts`
- `backend/src/modules/website-knowledge/website-knowledge.retrieve.ts`
- `backend/src/modules/website-knowledge/website-knowledge.sync.ts`
- `backend/package.json` (test script includes the new file)

## Tests and build

Executed on 6 November 2026 from `aslijobs/backend`:

- `npx tsc --noEmit` — passed.
- `npx tsc` (backend build) — passed.
- New suite `whatsapp-intelligence-improvements.test.ts` — 18 passed, 0 failed.
- Related suites run in the same session: conversation context, criteria, inbox store, website knowledge, website-knowledge embedding contracts, bot, language detection, response quality, seeker conversation, job results, security, reliability, role policy, conversation intelligence. Those runs passed (79 then 217, plus the 18 above).

The 116-case evaluation set in `WHATSAPP_BOT_TEST_CASES.md` was not executed. These unit tests do not measure live Meta, Sarvam, or production retrieval accuracy.

## Remaining limitations

- One model call still returns one intent. Only the job-search plus application-status pair is split into a clarification. Other mixed questions still take one path.
- “Which one pays more?” needs `lastJobs`. It does not look up salaries that were never shown.
- Shift, employment type, and work mode are still not database filters. The bot only explains night shift.
- Roman Telugu detection is still a word list plus Unicode blocks. Unlisted spellings can stay English.
- Sarvam still sees at most 280 characters and the compact slot object, not the inbox transcript.
- The “Looking at your question...” bubble is no longer sent in parallel with Sarvam. A slow Sarvam call is silent until the answer or the local fallback.
- The rate-limit notice uses the saved session language. A brand-new number gets English.
- Hash embeddings remain the default. Telugu questions still will not match English pages until E5 is indexed.
- In-chat apply and in-chat job posting are unchanged. The bot still sends links.
- Greeting reset is now conditional in `processInboundTurn`. `clearedTemporarySearchSessionFields()` itself is unchanged and is still what an explicit reset writes.

## Production configuration and reindex

Do not enable E5 on a hash index.

1. Set `WEBSITE_KNOWLEDGE_EMBEDDING_PROVIDER=xenova` and `WEBSITE_KNOWLEDGE_EMBEDDING_MODEL` to `Xenova/multilingual-e5-small`.
2. Reindex with that same provider (`knowledge:sync`). Chunks must be 384 dimensions. `embeddingsCompatible` rejects a hash vector on an E5 query and the reverse.
3. Only then set `WEBSITE_KNOWLEDGE_SEMANTIC_ENABLED=true`.
4. If the E5 model fails to load, query embedding returns null and retrieval stays lexical. It no longer writes a 256-dimension hash vector under an E5 label.
5. `REDIS_URL` should be set so the reply counter and the inbound queue are shared across processes. Empty Redis keeps the in-process counter and the inline inbound fallback.
6. Leave `WHATSAPP_OPENAI_ASSIST_ENABLED` unset until a separate evaluation. This change does not turn it on.

## Needs live Meta or Sarvam validation

- Webhook 200 timing against Meta’s timeout when Redis is down and the turn runs inline.
- Meta retry after a 500, including claim release and no duplicate user-visible reply.
- Sarvam latency now that the intermediate “looking at your question” bubble is not sent.
- Sarvam classification quality when `prev` includes intent, city, role, and salary. Local merge still overrides an explicit city or role in the current message.
- The rate-limit notice on a real WhatsApp thread, including the Redis key `wa:replies:<hash>`.
- Knowledge answers after an E5 reindex. This repo was not reindexed and semantic retrieval was not enabled here.
- Approved template names were not checked against the Meta business account.
