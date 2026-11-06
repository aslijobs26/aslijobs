# AsliJobs WhatsApp Bot — Intelligence and Accuracy Audit

Date: 6 November 2026  
Evidence is source code and unit tests named below. Production conversation logs were not available, so misclassification rates in live traffic are unverified.

## 1. How a question is understood

The classifier is `understandLocally` in `backend/src/modules/whatsapp/whatsapp-bot.logic.ts`. It is a stack of phrase lists, place/role catalogs (`PLACES`, `ROLES`, plus the live job-title catalog from `whatsapp-search-catalog.ts`), and slot extractors in `whatsapp-bot.criteria.ts`.

Sarvam is not the primary reader. `shouldUseLlmFallback` calls `sarvam-105b` only when all of these are true:

- the text is at least 12 characters,
- it is not a protocol turn (greeting, thanks, yes/no/ok),
- it is not an explicit “I am an employer / job seeker” choice,
- local intent is `UNKNOWN` or confidence is below 0.9.

The Sarvam system prompt (`UNDERSTAND_SYSTEM` in `sarvam.client.ts`) asks for JSON only: intent, language, location, category, openSearch, confidence. It forbids answering or inventing jobs. The user payload is truncated to 280 characters and includes account type plus, for short follow-up fragments only, previous location and role. There is no full chat history.

If Sarvam is unconfigured, times out at 8 seconds, or returns unusable JSON, `parseUnderstanding` falls back to `understandLocally` via `sarvamFallbackUnderstanding`.

OpenAI (`understandWithOpenAi` / `assistWhatsAppReply`) does not choose tools. Tool choice is `selectWhatsAppTool` in `whatsapp-bot-tools.ts`, keyed by the already chosen intent. OpenAI may only rephrase a deterministic reply, and only when `WHATSAPP_OPENAI_ASSIST_ENABLED` is true. That flag defaults to false. `platform_knowledge`, greetings, post-job, and employer numeric templates are blocked from assist (`openai-assist.routing.ts`).

## 2. Language

`detectLanguage` does not translate the user into English first. It checks Unicode blocks for Telugu, Hindi, Tamil, Kannada, and Malayalam, then romanized word lists, then clear English, then the previous session language for ambiguous short text.

Unit tests in `whatsapp-language-detection.test.ts` passed in this audit for script detection, romanized Telugu/Hindi, English after a Telugu session, and mixed “help me” phrases. Those tests do not prove coverage of every romanized spelling.

Reply language is separate. `buildDeterministicReply` has hand-written strings for some situations and languages. `localizeDeterministicReply` calls Sarvam Translate when the draft language differs from the conversation language. Proper nouns from facts are masked before translation. If translation fails, the verified draft is kept.

## 3. Context

Session slots, not a dialogue transcript, are the memory (`whatsapp-session.model.ts`). `mergePending` keeps role, city, experience, and salary across short follow-ups. Tests that passed:

- “Find React jobs” then “Only Hyderabad” style location add (`whatsapp-conversation-context.test.ts`: adds Hyderabad without replacing React).
- Salary added without dropping driver and Hyderabad.
- Show more of the same search.
- Role-only or city-only corrections.
- Night shift is not turned into a job title.

A standalone greeting (`detectProtocolTurn` → `greeting`) calls `clearedTemporarySearchSessionFields` and drops the active search. “Hi” in the middle of a search starts over. That is implemented behaviour, not an accident in the greeting branch.

“Yes” and “No” are also protocol turns. They return `protocolReply` and never confirm a pending clarification.

`isFollowUpFragment` is only true for texts of at most 48 characters that look like a bare role or place. A longer sentence does not receive `prev.loc` / `prev.role` in the Sarvam payload.

## 4. Short messages

| Message | What the code does | Evidence |
| --- | --- | --- |
| hi / hello / namaste | Protocol greeting. Clears temporary search. | `detectProtocolTurn` |
| yes / no / ok | Protocol acknowledgement. Does not apply a pending choice. | same function, length ≤ 24 |
| next | `looksLikeShowMoreJobs` if the whole message matches `next` or `next jobs`. | regex in `looksLikeShowMoreJobs` |
| status | `looksLikeStatusFollowUp` for an exact short status phrase, then account-status rules. | `looksLikeStatusFollowUp` |
| jobs / apply | Shorter than 12 characters, so Sarvam is not called. Local rules only. | `shouldUseLlmFallback` |
| 2 / apply for 5 | Ordinal into `lastJobs` when a list exists. Does not submit an application. | `looksLikeJobOrdinalSelection`; criteria test “resolves apply for the second shown job without claiming it was submitted” |

## 5. The “which job pays more?” question

The requested example is not implemented as a comparison.

`looksLikeRelativeHigherSalary` matches phrases such as `higher salary`, `more salary`, `konchem ekkuva`, and `low salary vaddu`. It does not match “which one pays more” or “which job pays more”.

When it does match, and a previous minimum salary exists, `mergePending` adds 5000 to that minimum and searches again. It does not sort `lastJobs` by pay.

`JOB_DETAILS` can show salary for one numbered result already stored on the session. There is no function that compares several shown jobs and answers which pays more.

Classification of this gap: missing capability. No production log in this audit shows users hitting it. The code path is absent, so the bot cannot be correct for that question unless some other regex accidentally maps it to `JOB_DETAILS`.

## 6. Website knowledge behaviour

| Situation | Behaviour | Evidence |
| --- | --- | --- |
| Intent is `PLATFORM_KNOWLEDGE` and a hit is high or low | User receives sanitized snippet text plus `Details: {url}` | `composeGroundedKnowledgeAnswer` |
| No hit or confidence `none` | Fixed “could not confirm” text plus Help Center, Contact, FAQs, email, phone | same file |
| Knowledge confidence none but the turn has a focus such as register | Bot uses the older help template instead of the knowledge miss | `buildReply` in `whatsapp-bot.service.ts` |
| User asks for live jobs | Not the knowledge index. `JOB_SEARCH` queries public jobs | `runAuthorizedJobSearch` |
| User asks for their own applications | Not the knowledge index. Requires a linked seeker | role gate + application handlers |
| Unrelated small talk that is not protocol | `UNRELATED` → `out_of_scope` copy, or Sarvam if the local read is weak and the text is long enough | `unknownUserAction`, `UNDERSTAND_SYSTEM` |
| Semantic retrieval | Off unless `WEBSITE_KNOWLEDGE_SEMANTIC_ENABLED=true`. Default embedding provider is `hash` | `env.ts` |
| E5 | `Xenova/multilingual-e5-small`, 384 dims, L2 norm. Used only when provider resolves to xenova and the model loads. Load failure falls back to hash | `website-knowledge.embeddings.ts` |

Knowledge answers are not generated by Sarvam or OpenAI. They are extracts. A Telugu question against English page text depends on lexical overlap plus, if enabled, multilingual E5. With the default hash embedder, romanized or native-script queries will not match English tokens. That is a structural retrieval limit, confirmed by `embedKnowledgeTextHash` (SHA-256 buckets of the query’s own tokens).

## 7. Issue register

Confirmed means the behaviour is in the source. Potential means it depends on live model output, index contents, or traffic. Unverified means production logs are required.

| Issue | Class | Root cause | File / function | Impact | Evidence | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- |
| Messages under 12 characters never reach Sarvam, even when local intent is UNKNOWN | Confirmed limitation | `shouldUseLlmFallback` returns false when `trimmed.length < 12` | `whatsapp-bot.logic.ts` `shouldUseLlmFallback` | “jobs”, “apply”, typos, and one-word roles stay on regexes | function body | Route unknown short texts through the same slot merger, or a tiny intent table, before giving up |
| Yes/No do not answer a pending question | Confirmed | `detectProtocolTurn` returns `ack` and `processInboundTurn` returns before `resolveTurnUnderstanding` | `whatsapp-bot.logic.ts`, `whatsapp-bot.service.ts` | A clarify prompt followed by “yes” gets a generic ack and can feel like the bot ignored the user | protocol branch returns early | If `pendingClarification` or `lastClarifyMissing` is set, do not treat yes/no as protocol |
| Greeting wipes the active search | Confirmed | greeting path spreads `clearedTemporarySearchSessionFields` | `processInboundTurn` | “Hi” between two search turns drops city and role | code comment “Standalone Hi/Hello starts a fresh conversational search” | Clear only when there is no active `lastIntent` search, or ask before reset |
| No comparison of salaries across the last list | Missing capability | relative-salary handler only raises `minSalary` by 5000 for a fixed phrase list | `looksLikeRelativeHigherSalary`, `mergePending` | “Which one pays more?” is not answered from `lastJobs` | phrase list does not include “pays more” / “which one” | Add a deterministic compare over `lastJobs.salaryLabel` when the user refers to the shown list |
| Follow-up context sent to Sarvam is only loc/role and only for fragments ≤ 48 chars | Confirmed limitation | `isFollowUpFragment` and the `prior` object | `whatsapp-bot.service.ts` | Longer corrections (“only Hyderabad but night shift”) may not be marked as follow-ups for the LLM. Local `mergePending` still handles many of these | `isFollowUpFragment` | Pass last intent and last three slots on every non-protocol turn, still without the raw transcript if privacy requires it |
| Multiple questions in one message are one intent | Confirmed limitation | one `BotUnderstanding` object, one `buildReply` | logic types | The second question is dropped | `BotUnderstanding` has a single `intent` | Split on question marks only when both clauses map to different known intents; otherwise ask which to answer first |
| Knowledge retrieval defaults to keyword/hash, not E5 | Confirmed configuration | `WEBSITE_KNOWLEDGE_SEMANTIC_ENABLED` is true only when the env value is the string true; provider default `hash` | `env.ts`, `website-knowledge.embeddings.ts` | FAQ answers fail for paraphrases and for Indic queries over English pages | defaults in `env.ts` | Enable E5 in the environment that serves production, and refuse to query with hash vectors against an E5 index (`embeddingsCompatible` already guards mixes) |
| Knowledge answer is an extract, not a grounded generation | Architecture | `composeGroundedKnowledgeAnswer` concatenates chunk text | `website-knowledge.answer.ts` | Answers can be long, repetitive, or only partly about the question. They do include a source URL | function body | Keep the extract as the only allowed facts; add a short template (“From {title}: …”) instead of calling an LLM to invent |
| In-chat apply and in-chat job post do not exist | Confirmed product boundary | apply copy builds a URL; post-job copy returns `postJobUrl` | `howToApplyCopy`, `postJobGuideCopy`; hallucination filter rejects “successfully applied” | Users who expect the bot to submit an application get a link. That is correct only if the copy says so | `openai-assist.client.ts` comment and regex | Keep the boundary. Make the deterministic line explicit: “I can’t submit this on WhatsApp.” |
| Silent drop after 20 replies/minute | Confirmed | `allowReply` returns false with no send | `whatsapp-bot.service.ts` | The user sees nothing. The limit is per process, so several instances do not share it | `recentReplies` Map | Send one rate-limit line, and store the counter in Redis |
| Webhook 200 is sent before routing finishes | Confirmed | persist then `res.sendStatus(200)` then `routeConversationalMessages` | `receiveWhatsAppWebhook` | A crash after 200 and before a successful enqueue can lose the turn unless Meta redelivers and the claim was released | controller order | Enqueue first, ack after enqueue success; keep the claim until the worker finishes or attempts are exhausted |
| Shift, benefits, and “walk-in” are not search filters | Confirmed | `looksLikeShiftConstraint` keeps the old search and does not add a shift filter | logic + context test | “Night shift” will not filter jobs. The test expects it not to become a role | `whatsapp-conversation-context.test.ts` | Say that shift is not a filter, instead of repeating the previous list with no explanation |
| Employer vs seeker confusion is guarded, not impossible before the gate | Mitigated | `applyAccountAwareIntent` and `authorizeWhatsAppRole` run after classification | `whatsapp-role-policy.ts` | A seeker asking to post a job is redirected. An employer asking to search jobs is redirected | security tests passed | Keep the gate. Add tests for dual-role `both` with an empty `activeRole` |
| Romanized Indic outside the word lists | Potential | detection is a finite regex, not a language model | `ROMAN_TELUGU` and siblings | Unlisted spellings stay English or inherit the session language | regex constants | Extend lists from real inbox samples; do not claim the current lists are complete |
| Sarvam or OpenAI hallucination of jobs | Mitigated when flags and filters run | Jobs in the reply come from `loadJobs`. Assist is rejected if salaries or companies are new | `looksLikeHallucinatedFacts` | Residual risk if assist is enabled and the heuristic misses a paraphrase | unit test “rejects AI replies that invent application success” | Keep assist off until the heuristic is measured on real replies |
| Duplicate “Looking at your question...” plus the real answer | Confirmed when Sarvam runs | `Promise.all` sends `lookingAtQuestionCopy` and the classifier together | `processInboundTurn` | Two bubbles on slow classifications | code | Send the ack only if the classifier is still running after ~1.5s |

## 8. What is already strong

- Public job facts are loaded from the database. The model is not allowed to invent vacancies in the deterministic path. The criteria test “says there are no matching jobs without inventing vacancies” passed.
- Search failure and empty search are different situations (`search_failed` vs empty).
- Role separation tests passed for seeker application history and employer job posting.
- Webhook HMAC tests passed, including empty-secret rejection when a secret is required.
- Ordinal apply does not claim the application was submitted.
- Session context tests passed for location, role, salary, show-more, and experience clear.
- Knowledge chunks of different embedding models are not mixed (`embeddingsCompatible`).

## 9. Tests executed for this audit

Command (backend):

`npx tsx --test` on:

- `src/modules/whatsapp/whatsapp-language-detection.test.ts`
- `src/modules/whatsapp/whatsapp-conversation-context.test.ts`
- `src/modules/whatsapp/whatsapp-security.test.ts`
- `src/modules/whatsapp/whatsapp-bot.criteria.test.ts`
- `src/modules/website-knowledge/website-knowledge.e2e-closure.test.ts`

Result: 55 passed, 0 failed. Duration about 1.3s. No live Meta, Sarvam, OpenAI, Redis, or Mongo call was required by these files.

Not executed: the rest of the `npm test` script, webhook HTTP integration, inbox UI, notification template approval against Meta, and the 100-case evaluation set in `WHATSAPP_BOT_TEST_CASES.md`.
