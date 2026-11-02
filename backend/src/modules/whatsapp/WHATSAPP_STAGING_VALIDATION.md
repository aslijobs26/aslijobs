# WhatsApp staging validation

Use this only on a staging Meta app, staging API, and staging database. Do not message customer numbers.

## Setup

- Staging `WHATSAPP_TOKEN`, phone number id, and webhook verify token.
- `OPENAI_API_KEY` and `WHATSAPP_OPENAI_ASSIST_ENABLED` only on the staging process.
- `SARVAM_API_KEY` on staging if translation fallback should be exercised.
- Redis available so BullMQ is used. Repeat one case with Redis stopped to confirm the inline fallback still answers.
- Allowlist of test handsets only. Remove every other recipient from the staging send path.

## Cases

1. Webhook: POST a signed staging payload. Expect HTTP 200 before the reply is generated.
2. Send the same `message.id` twice. Expect one reply.
3. From one test number, send "driver jobs" then "Hyderabad" quickly. Expect one ordered search, not two interleaved replies.
4. "Hi" clears the previous role and city. "Hi, driver jobs in Hyderabad" searches immediately.
5. Telugu: `నాకు డ్రైవర్ ఉద్యోగాలు కావాలి` and `హైదరాబాద్ లో ఉద్యోగాలు చూపించు`. Reply language stays Telugu.
6. "Hyd lo driver jobs" and "Vizag lo electrician jobs" resolve to Hyderabad and Visakhapatnam.
7. A title that exists only in staging jobs (for example CNC Machine Operator) is found from "cnc operator jobs". An unknown title is not renamed to a different role.
8. "jobs in Atlantis" does not search Hyderabad.
9. Salary follow-up `20000 lo chunchandi` keeps the role and city and changes only the salary.
10. Application status for the test seeker matches the staging application record. No status is stated when the account has none.
11. Stop Mongo or point the search at a down database. The reply must say the search failed, not that there are no jobs.
12. Logs may show `OPENAI_UNDERSTAND`, `source=sarvam`, or `source=local`. They must not contain the API key or the full phone number.
13. Publish or pause a staging job, then send a search for its title. The catalog log should show `invalidated` and, on the next message, `refreshed` with title and city counts. A failed refresh must keep answering from the previous catalog.

## Stop

If any reply names a job, company, salary, or application status that is not in the staging database, stop and treat it as a grounding failure.
