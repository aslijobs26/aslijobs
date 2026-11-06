# AsliJobs WhatsApp Bot — Real Conversation Fixes

Date: 6 November 2026

These fixes follow live WhatsApp checks of the intelligence work. The pipeline is unchanged: local rules first, Sarvam only when local confidence is low, role checks before tools, and website answers taken from indexed page text. OpenAI assist was not enabled. Semantic E5 retrieval was not enabled.

## Issues from the live threads

1. Employer: `Nenu aslijobs lo job post cheyyali anukuntunnanu`
   The bot sent the Telugu post-job link, then added `మీరు చెప్పింది: Nenu Aslijobs Lo.`
2. Employer: `aslijobs guidelines cheppu`
   The bot asked `మీకు ఏ జాబ్ కావాలి?` instead of reading the guidelines.
3. The same guidelines question, and employer guidelines, job-posting rules, and “how do I manage applicants?”, need an answer from the official site in the user’s language, with a source link, and without a job-seeker preference question.

## Root cause: employer role confusion

`మీకు ఏ జాబ్ కావాలి?` is the seeker clarify path. `buildDeterministicReply` uses `clarifyJobTitle` for an unknown intent and for a missing role. A linked employer whose message was `UNKNOWN` took that path. `How do I manage applicants?` was `UNKNOWN`. A yes/no while a seeker slot was still pending also re-asked for a job title, including when the phone is a verified employer.

Role is still taken from the linked account, not from the latest sentence. `authorizeWhatsAppRole` still blocks an employer from seeker job search before any job tool runs. The missing piece was the reply used when the employer message is not a seeker action.

`job seeker ki jobs ela search cheyyali` was classified as `JOB_SEARCH` with the free title `Job Seeker Ki`, then the employer role gate redirected it as if the employer wanted jobs. It is a question about how seekers search.

## Root cause: guidelines misclassification

`aslijobs guidelines cheppu` already classifies as `PLATFORM_KNOWLEDGE` in the current rules, because `looksLikePolicyQuestion` matches `guidelines`. The live job-seeker question is what the employer fallback sends when a message does not match that detector.

These did not match, so they never reached the knowledge handler:

- `job posting rules cheppu` matched `jobs?\s*post` inside `looksLikePostJobRequest` and became `POST_JOB`.
- `How do I manage applicants?` matched neither the applicant-location guide nor an employer jobs intent.
- `అస్లీజాబ్స్ గైడ్‌లైన్స్ చెప్పు` does not contain the Latin word `guidelines`.

`PLATFORM_KNOWLEDGE` is already decided before `POST_JOB` and `JOB_SEARCH` in `understandLocally`. The fix widens the knowledge detectors so those sentences take the existing knowledge branch. The order of the branch was not replaced.

When the database has no knowledge documents, `loadSections` used the short corpus stub for `/guidelines` and skipped `policy-corpus.en.json`. That file is the official guidelines, terms, and privacy text. Sync already merges it. The empty fallback did not.

## Root cause: partial user-message echo

`postJobGuideCopy` appended `మీరు చెప్పింది: ${role} — ${location}` on every verified post-job reply. `extractFreeJobTitle` treated the words before `job` as a title. `cleanRolePhrase` removed a leading `nenu` only when every token was filler, so `Nenu aslijobs lo` survived and was title-cased to `Nenu Aslijobs Lo`. The service passed that category into the copy.

## What changed

| File | Function | Change |
|---|---|---|
| `whatsapp-bot.logic.ts` | `postJobGuideCopy` | Verified post-job reply is only the link. No “you said” line in Telugu, Hindi, or English. |
| `whatsapp-bot.logic.ts` | `validateCurrentMessageIntent` | A `POST_JOB` turn keeps a catalog role and a real place. A sentence fragment is dropped. |
| `whatsapp-bot.logic.ts` | `looksLikePolicyQuestion` | Guidelines, rules, `గైడ్`, `రూల్`, and `నియమా` are policy questions, including job-posting rules. |
| `whatsapp-bot.logic.ts` | `looksLikeHowToFindJobs` | `jobs ela search` is how-to-find, so an employer asking how seekers search stays on the public guide. |
| `whatsapp-bot.logic.ts` | `looksLikeApplicantsWhereGuide` | “How do I manage applicants?” is employer website guidance. |
| `whatsapp-bot.logic.ts` | `buildDeterministicReply` | Unknown intent for `accountType: employer` uses the employer capability sentence, not `clarifyJobTitle`. |
| `whatsapp-bot.criteria.ts` | `cleanRolePhrase` | Drops a phrase that contains `aslijobs`, and strips leading `nenu` / `naaku` / `meeru`. |
| `whatsapp-bot.service.ts` | clarification re-ask | A verified employer stuck on a seeker slot gets the employer capability reply and the temporary search is cleared. |
| `whatsapp-bot.service.ts` | `buildReply` | Every reply fact includes the resolved account, so the clarify copy can see employer vs seeker. |
| `website-knowledge.service.ts` | `corpusAsSections` | The no-database fallback includes the official policy sections. |
| `website-knowledge.service.ts` | `answerWebsiteKnowledgeQuestion` | Retrieval uses `expandKnowledgeQuery` so Telugu guideline wording searches the English page. |
| `website-knowledge.retrieve.ts` | `expandKnowledgeQuery`, `scoreSection` | Adds `guidelines` / `employer` / `job posting` hints, and prefers the matching guidelines heading. A general guidelines question prefers General Platform Guidelines over the admin section. Privacy questions are not pulled onto the guidelines page. |
| `website-knowledge.answer.ts` | `composeGroundedKnowledgeAnswer` | Drops a heading repeated at the start of the chunk, adds up to two other sections from the same URL, cuts on a sentence inside the 900-character cap, and keeps `Details: <url>`. |
| `whatsapp-bot.test.ts` | post-job template | Expects the link and rejects `You mentioned`. |
| `whatsapp-real-conversation.test.ts` | new | The live sentences, knowledge URL, no-result, echo, and the earlier clarification / greeting / salary / short-message checks. |

Seeker search, apply-after-a-list, application status, yes/no clarification, the no-match menu, greeting-keeps-search, salary comparison, and `jobs` as an open search are unchanged. `authorizeWhatsAppRole` still rejects employer `JOB_SEARCH`.

## Routing that this code actually uses

1. Webhook signature, persist, then route. Unchanged.
2. Linked account from the phone record. Unchanged.
3. Explicit reset, then a pending clarification. A verified employer is not re-asked for a seeker role or city.
4. Protocol greeting, thanks, and ack. Unchanged.
5. `understandLocally`: unrelated, help, then `PLATFORM_KNOWLEDGE`, then how-to-apply, greeting, account status, seeker flows, employer flows, `POST_JOB`, then job search.
6. `authorizeWhatsAppRole` before tools.
7. Unknown employer text uses the employer capability sentence. Unknown seeker text still asks which job.
8. Sarvam only when the local intent is unknown or confidence is under 0.9 and the message is long enough. Not used for these guideline and post-job sentences.

## Before / after

Employer, verified, Telugu:

Before:
`సరే 👍 జాబ్ పోస్ట్ చేయడానికి ఈ లింక్ ఓపెన్ చేయండి:` plus `https://www.aslijobs.com/post-job?lang=te` plus `మీరు చెప్పింది: Nenu Aslijobs Lo.`

After, exact string from `postJobGuideCopy` with the resolved turn (`intent` `POST_JOB`, category empty):

```
సరే 👍 జాబ్ పోస్ట్ చేయడానికి ఈ లింక్ ఓపెన్ చేయండి:
👉 https://www.aslijobs.com/post-job?lang=te
```

`aslijobs guidelines cheppu`, `Tell me AsliJobs guidelines`, and `అస్లీజాబ్స్ గైడ్‌లైన్స్ చెప్పు` are `PLATFORM_KNOWLEDGE`. The answer is the General Platform Guidelines section from `/guidelines`, including “Users must provide correct, genuine, and updated information”, and ends with `Details: https://www.aslijobs.com/guidelines`. It does not ask which job.

`employer guidelines enti` uses the Employer Guidelines section: “Employers must post only genuine job openings with correct and complete information.” Same guidelines URL.

`job posting rules cheppu` is `PLATFORM_KNOWLEDGE`, not `POST_JOB`. The answer is Job Posting Guidelines: “Every job post on AsliJobs should be clear, truthful, and easy to understand.”

`How do I manage applicants?` uses the employer guide: applications are managed through the employer dashboard. Source `https://www.aslijobs.com/employer-guide`.

`job seeker ki jobs ela search cheyyali` from an employer stays `PLATFORM_KNOWLEDGE` with no seeker redirect. The answer is the public find-jobs guide: seekers search by city, state, and category. Source `https://www.aslijobs.com/find-jobs`.

`How can I post a job?` stays website guidance and includes a post-job or guidelines URL.

A query with no matching tokens, `zzzzqqqq plugh`, returns confidence `none` and “I could not confirm that answer from the official AsliJobs documentation available to me.” plus the Help Center link.

An employer unknown-intent reply in Telugu is:

`నేను మీరు పోస్ట్ చేసిన ఉద్యోగాలు, వాటి స్థితి, మరియు వాటికి వచ్చిన దరఖాస్తుల గురించి సహాయం చేయగలను.`

A seeker who still needs a role is still asked `మీకు ఏ జాబ్…`.

The knowledge text is the English page extract. Sarvam Translate still localizes it when the saved reply language is Telugu. That translation was not called in these tests.

## Tests and build

From `aslijobs/backend` on 6 November 2026:

- `whatsapp-real-conversation.test.ts`: 13 passed, 0 failed. This covers the 30 requested checks as grouped cases: employer guidelines, post-job echo, manage applicants, seeker-search-asked-by-employer, seeker React/apply/status/guidelines, English and Telugu and Roman Telugu guidelines, posting rules, no-result, source URL, multi-section answer, echo cleanup, clarification yes, no-match choice `2`, greeting keeps search, salary comparison, `jobs`, Roman Telugu driver in Hyderabad, and employer `JOB_SEARCH` denied.
- Website knowledge suites (`website-knowledge.test.ts`, `website-knowledge.gaps.test.ts`, and the other knowledge test files in the full run): passed. Privacy “what personal information do you collect from job seekers?” still resolves to `/privacy-policy`.
- All backend `*.test.ts` files: 134 files, 6 batches, `BATCHES_FAILED=0`. Counts 239 + 136 + 221 + 371 + 332 + 78 = 1377 passed, 0 failed.
- `npx tsc --noEmit`: passed.
- `npx tsc` (the `npm run build` script): passed.

`npm test` is still too long for Windows `cmd`. The suite was run with `npx tsx --test` in batches of 25.

## Still needs a live check

- Send the two original WhatsApp sentences from a verified employer phone and confirm the thread shows one bubble: the post-job link, and the guidelines extract, with no second echo bubble from an older process.
- Confirm Sarvam Translate turns the English guidelines extract into Telugu on a Telugu session. These tests assert the English source text.
- If production Mongo already has knowledge documents, those rows are used ahead of the file fallback. Run `knowledge:sync` so `/guidelines` in the database matches `policy-corpus.en.json`. This change does not turn on E5 and does not reindex.
- Do not set `WHATSAPP_OPENAI_ASSIST_ENABLED`.
- Dual-role phones (`both`) still choose a surface before private data. Only a phone linked solely as employer skips seeker clarify slots.
