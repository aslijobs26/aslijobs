# AsliJobs WhatsApp Bot — Final Verification

Date: 6 November 2026

This pass re-read the implementation and ran the backend tests. It does not treat the earlier improvement summary as evidence. Nothing here was checked against a live Meta webhook, a live Sarvam call, a live Redis server, or a production embedding index.

## Result

The twelve items below match the current source, and the automated suites that cover them passed after one fix. That is not a production-readiness sign-off. Live Meta, Sarvam, Redis, and the knowledge index are still untested.

## Verified features

| # | Item | What the code does | How it was checked |
|---|---|---|---|
| 1 | Pending clarification + yes / no / avunu / kadu | `shouldDeferProtocolAck` is true only for an ack while `pendingClarification`, `lastClarifyMissing`, or `pendingIntent` is set. Yes and no while a city or role is missing call `askLocationCopy` or `clarifyJobTitle` and return. With nothing pending, those words stay protocol acknowledgements. Roman `sare` is now an ack as well. | `whatsapp-turn-resolver.ts`, `processInboundTurn` in `whatsapp-bot.service.ts`, intelligence tests |
| 2 | No-match menu | Digits 1–4 still go through `resolveNoMatchChoice`. Yes / avunu / सही uses the offered nearby city, otherwise relaxes salary when `lastMinSalary` is set, otherwise waits. No / kadu waits. The choice is applied in `processInboundTurn` before the reply is built. | `whatsapp-conversation-orchestrator.ts`, service no-match block, intelligence tests, `whatsapp-job-search-context.test.ts` |
| 3 | Greeting keeps an active search | Exact `Hi` / `Hello` uses `shouldClearSearchOnGreeting`. A greeting that is classified as `GREETING` but is not in the protocol list no longer wipes `lastJobs` when a search is active. `start over`, `reset`, and `kotha search` still clear the temporary search. | Service session patch and protocol block; intelligence tests |
| 4 | Salary comparison | `looksLikeShownSalaryComparison` is separate from the “higher salary” minimum bump. `compareShownJobSalaries` uses `parseSalaryLabelCeiling`. Blank and “not disclosed” labels are skipped, not treated as zero. Equal amounts are both listed. The compare runs only after the employer/seeker redirect. | `whatsapp-bot.criteria.ts`, `buildReply` order, intelligence tests |
| 5 | Short messages | `jobs` starts or continues a job search. `apply` after `JOB_SEARCH` becomes job details and the reply asks which shown number. `next` sets `showMore` and keeps role and city. `status` after an application intent becomes `APPLICATION_STATUS`. `status` after a job search does not become an application lookup. A bare role such as `driver` keeps the previous city. | `shortCommandUnderstanding`, `applyConversationFollowUp`, `looksLikeShowMoreJobs`, intelligence tests |
| 6 | Sarvam follow-up context | Non-protocol turns pass `priorIntent`, `priorLocation`, `priorRole`, and `priorMinSalary` into `sarvamUnderstandUserContent`. `resolveTurnUnderstanding` still prefers a city or role written in the current message. | `whatsapp-bot.service.ts` prior object, `sarvam.client.ts`, intelligence tests |
| 7 | Night shift | `mentionsNightShift` adds the “not a search filter” line on job results. A shift-only title is not stored as a role, including “night shift jobs in Hyderabad”. A message that is only a shift still keeps the previous search instead of inventing a role. | `mentionsNightShift`, `roleIsShiftOnly`, `buildDeterministicReply`, intelligence and conversation-context tests |
| 8 | Rate limit | 20 allows, the 21st is `notice`, later counts are `drop`. Phones do not share a memory bucket. If the Redis increment throws, `consumeCountedSlot` uses the in-process window. If the Redis key has no TTL, expire is retried. | `whatsapp-reply-limit.ts`, intelligence tests. No live Redis server was used. |
| 9 | Webhook order | `persistInboundMessages` runs, then `routeConversationalMessages`, then HTTP 200. A thrown route error does not send 200. | `whatsapp-webhook.controller.ts`, inbox store test, intelligence test |
| 10 | Claim release and retry | On route failure the handler releases `releaseWhatsAppEvent` and rethrows. The outer catch sends HTTP 500 so Meta can retry. A successful enqueue keeps the claim. Duplicate claims are skipped inside the route loop. | Source order asserted in tests. No Meta retry was sent. |
| 11 | E5 failure and index compatibility | Provider `xenova` returns null when inference fails or the vector is missing. It does not substitute a hash vector. Sync stores an empty model id when there is no vector. `embeddingsCompatible` rejects a hash vector against the E5 model. `blendSemanticHits` skips a chunk whose length differs from the query vector. | `website-knowledge.embeddings.ts`, `website-knowledge.sync.ts`, `website-knowledge.retrieve.ts`, e2e-closure and intelligence tests. The E5 model was not loaded. |
| 12 | Role gate and job/application correctness | `authorizeWhatsAppRole` still blocks an employer from `JOB_SEARCH` before salary compare. Existing context, criteria, job-result, application-flow, and role-policy tests passed in the full run. | Those suites, listed below |

## Fixes made during this verification

One new test failed on the first run.

| Failure | Cause | Fix |
|---|---|---|
| `understandLocally("night shift jobs in Hyderabad")` returned category `Night Shift` | A free-text title treated the shift phrase as a role, so the unsupported-filter note could be skipped and the search could use a fake role | `roleIsShiftOnly` drops a title that is only a night shift. Re-run passed. |

Other gaps found by reading the code, then covered with tests:

- Roman `sare` was not a protocol ack, so it never reached the clarification resolver.
- Hindi `सही` was a protocol ack but not treated as yes, so a no-match menu answered “Okay”.
- `status` after `MY_APPLICATIONS` stayed unknown because the follow-up only continued employer topics.
- A greeting classified outside the exact protocol list still replaced `lastJobs` with `[]` while a search was active.
- The Redis reply key set `EXPIRE` only when the counter was 1. A failed expire left a key with no TTL.

## Commands and results

Working directory: `aslijobs/backend`. Date: 6 November 2026.

| Command | Result |
|---|---|
| `npx tsx --test src/modules/whatsapp/whatsapp-intelligence-improvements.test.ts` and the conversation-context and job-search-context files, after the night-shift fix | 42 passed, 0 failed |
| `npx tsc --noEmit --pretty false` | Passed |
| `npx tsc --pretty false` (production emit) | Passed |
| `npm test` | Did not run the suite. Windows reported `The syntax of the command is incorrect` (exit 255). The npm script is one command line that is longer than the Windows command limit. |
| All `src/**/*.test.ts` files, 133 files, via `npx tsx --test` in six batches of 25 | 1,364 passed, 0 failed. `BATCHES_FAILED=0`. |

Batch totals: 239, 136, 221, 371, 343, and 54.

That file set is the same set named by the `npm test` script, including WhatsApp, website knowledge, applications, and jobs. It is not a live API test.

## Untested scenarios

- A real Meta POST, including time-to-200 when Redis is down and the turn runs inline.
- Meta retry after HTTP 500, and whether the user sees one reply or two if the send happened before the throw.
- `consumeWhatsAppReplySlot` against a real Redis instance. The TTL helper and the throw fallback were tested with fakes.
- Sarvam HTTP with the new `prev` object. The JSON body was tested. The model’s classification was not.
- Loading `Xenova/multilingual-e5-small`, a failed model download, and a reindex of the live chunk collection.
- `processInboundTurn` writing a Mongo session. Greeting preservation is covered by the pure helper and by a source check of the session patch, not by a database round trip.
- `bye` during an open clarification still sends the normal acknowledgement and leaves the pending slot in place.
- Employment type and day shift are still not filters. Only night shift gets the explanation.
- The 116-case set in `WHATSAPP_BOT_TEST_CASES.md` was not executed.

## Production configuration

Do not turn semantic retrieval on until the index matches the query model.

1. `REDIS_URL` should be set so the inbound queue and the reply counter are shared. If it is empty, both stay in process.
2. `WHATSAPP_OPENAI_ASSIST_ENABLED` was not enabled by this work.
3. `WEBSITE_KNOWLEDGE_SEMANTIC_ENABLED` stays false unless the host sets the string `true`.
4. Default embedding provider is `hash` (`aslijobs-hash-v1`, 256 dimensions).
5. E5, when used, is `Xenova/multilingual-e5-small`, 384 dimensions. `embeddingsCompatible` rejects a mismatch of model id or dimension.

## Live Meta / Sarvam validation still required

- Webhook acknowledgement time versus Meta’s timeout.
- A failed enqueue that returns 500, then a retry that does not double-send.
- Sarvam replies when `prev` contains intent, city, role, and minimum salary.
- The rate-limit sentence on a real WhatsApp number, and the Redis key `wa:replies:<sha256 prefix>`.
- Knowledge answers after an E5 reindex, for English, Telugu, and roman Telugu questions.

## Deployment and reindex

1. Deploy the backend build from `npx tsc`.
2. Keep semantic retrieval off.
3. Set `WEBSITE_KNOWLEDGE_EMBEDDING_PROVIDER=xenova` and `WEBSITE_KNOWLEDGE_EMBEDDING_MODEL=Xenova/multilingual-e5-small`.
4. Run the existing knowledge sync so every active chunk is 384 dimensions and labeled with that model. A failed E5 embed now leaves the model id empty instead of writing a hash vector.
5. Confirm `embeddingsCompatible` on a sample chunk before setting `WEBSITE_KNOWLEDGE_SEMANTIC_ENABLED=true`.
6. Do not mix hash and E5 chunks in one index.

This verification does not say the bot is ready for production traffic. The unit and source checks passed. The live dependencies above did not.
