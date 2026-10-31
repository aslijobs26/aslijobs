# AsliJobs WhatsApp Bot — Implementation Report (Updated)

Date: 2026-10-31  
Scope: Complete pending OCR / document / OpenAI validation on the existing hybrid bot.

## 1. Existing architecture preserved

Meta webhook → signature → fast ACK → inbox persist + dedupe → BullMQ/inline inbound → per-phone order → bot turn → local intent / Sarvam-105B → DB `buildReply` → Mayura → send → delivery webhooks.

**Sarvam and Mayura were not removed or replaced.** OpenAI remains optional assist on verified facts. Notifications, Admin Inbox, handoff/pause unchanged.

## 2. Files changed and why

| Path | Why |
|------|-----|
| `ocr/whatsapp-ocr.types.ts` | OCR result contract |
| `ocr/whatsapp-ocr.factory.ts` | Provider factory + test override |
| `ocr/whatsapp-ocr.tesseract.provider.ts` | tesseract.js WASM image OCR |
| `ocr/whatsapp-image-signature.ts` | Magic-byte image validation + dimensions |
| `whatsapp-media-extract.ts` | Digital PDF/DOCX/TXT + scanned PDF via screenshot+OCR; spoof/size/page limits |
| `whatsapp-media-understand.service.ts` | Image OCR path; in-memory only (no public Cloudinary resume URLs) |
| `whatsapp-media-messages.ts` | OCR empty / encrypted / job-ad localized copy |
| `openai-assist.client.ts` | Stronger fact/injection checks; sanitize untrusted text |
| `whatsapp.service.ts` | SSRF host allowlist on Meta media download |
| `config/env.ts`, `.env.example` | `WHATSAPP_OCR_*` and media limits |
| `package.json` | `tesseract.js`; new test files |
| `scripts/smoke-*.ts` | Live/offline smoke probes |

## 3. OCR provider and exact implementation

- **Provider:** `tesseract.js` v7 (`createWorker` / `recognize`) — WASM, **no OS native Tesseract binary**.
- **Factory:** `createWhatsAppOcrProvider()`; disabled when `WHATSAPP_OCR_ENABLED=false`.
- **Images:** magic bytes (JPEG/PNG/WEBP) → dimension cap 4096 → OCR → truncate.
- **Independence:** Media understand and OCR are **separate flags**. OCR does not auto-enable with media understand.

## 4. Scanned PDF processing

1. Validate size + `%PDF` magic.
2. Digital `PDFParse.getText()` first.
3. If usable alphanumeric text → digital (or mixed if thin multi-page + OCR on).
4. If empty/unusable → `getScreenshot` (PNG buffers) per page (max `WHATSAPP_OCR_MAX_PDF_PAGES`) → tesseract OCR → join in page order.
5. Encrypted PDF → `PasswordException` → localized encrypted message.
6. **Live smoke:** `scripts/smoke-pdf-ocr-path.ts` rendered a text PDF page and OCR’d it — `pdf_ocr_has_react=yes`.

## 5. Supported file types and limits (defaults)

| Type | Support |
|------|---------|
| TXT | Digital extract |
| DOCX | Mammoth (PK magic required) |
| PDF digital | pdf-parse text |
| PDF scanned | Screenshot + OCR when OCR enabled |
| JPEG/PNG/WEBP | OCR when OCR enabled |
| Legacy DOC, ZIP, RAR, EXE | Rejected |
| MIME/magic mismatch | Rejected |

Limits (env): max bytes 8MB, extract chars 12k, OCR timeout 45s, max PDF pages 5, scale 1.5, extract timeout 60s.

**Storage:** inbound media is **not** uploaded to Cloudinary (would create public URLs). Processed in memory only.

## 6. OpenAI SDK / model / schema

- HTTP Chat Completions (`fetch`), not a separate SDK package.
- Configured model: `OPENAI_MODEL` (example `gpt-6-luna`).
- **Live-verified 2026-10-31:** `openai_key_present=yes`, `openai_live_status=200`, `openai_live=ok` for `gpt-6-luna` (smoke script; key never printed).
- JSON schema structured output; runtime Zod validation; hallucination/injection heuristics; unauthorized `proposed_action` rejected; failures → deterministic/Mayura fallback.

## 7. Environment variables and safe defaults

```
WHATSAPP_OPENAI_ASSIST_ENABLED=false
OPENAI_API_KEY=
OPENAI_MODEL=gpt-6-luna
OPENAI_ASSIST_MAX_TOKENS=280
OPENAI_ASSIST_TIMEOUT_MS=12000

WHATSAPP_MEDIA_UNDERSTAND_ENABLED=false
WHATSAPP_OCR_ENABLED=false
WHATSAPP_OCR_LANGUAGES=eng
WHATSAPP_OCR_TIMEOUT_MS=45000
WHATSAPP_OCR_MAX_PDF_PAGES=5
WHATSAPP_OCR_PDF_SCALE=1.5
WHATSAPP_MEDIA_MAX_BYTES=8000000
WHATSAPP_MEDIA_MAX_EXTRACT_CHARS=12000
WHATSAPP_MEDIA_EXTRACT_TIMEOUT_MS=60000
```

Production still **refuses start** if `META_APP_SECRET` empty. Assist enabled without key/model refuses start. OCR needs no API key (local WASM).

## 8. Security changes

- Production signature `requireSecret` (prior work) retained.
- Meta media download: HTTPS + host allowlist (`fbcdn`, `facebook`, `fbsbx`, `whatsapp.net`); `redirect: "error"`.
- No public resume persistence for inbound WhatsApp media.
- Prompt-injection lines stripped before OpenAI; secret-like model output rejected.
- Resume/OCR body not logged (chars/status only).

## 9. Automated tests — commands and results

```
npx tsx --test src/modules/whatsapp/openai-assist.routing.test.ts \
  src/modules/whatsapp/whatsapp-media-extract.test.ts \
  src/modules/whatsapp/whatsapp-media-pipeline.test.ts \
  src/modules/whatsapp/ocr/whatsapp-image-signature.test.ts \
  src/modules/whatsapp/ocr/whatsapp-ocr.provider.test.ts \
  src/modules/whatsapp/whatsapp-bot.test.ts \
  src/modules/whatsapp/whatsapp-bot.criteria.test.ts \
  src/modules/whatsapp/whatsapp-bot.role.test.ts \
  src/modules/whatsapp/whatsapp-phone-order.test.ts \
  src/modules/whatsapp/whatsapp-inbound-message.test.ts \
  src/modules/whatsapp/whatsapp-media.test.ts \
  src/modules/whatsapp/whatsapp.service.test.ts
```

**Result: 207 passed, 0 failed.**

## 10. TypeScript / build

`npx tsc --noEmit` — **passed** after OCR changes.

## 11. Live API tests actually completed

| Probe | Result |
|-------|--------|
| OpenAI Chat Completions `gpt-6-luna` | **ok** (HTTP 200) |
| tesseract.js 1×1 PNG | **ok** (empty text expected) |
| Digital PDF extract (pdfkit → pdf-parse) | **ok** (`has_react=yes`) |
| PDF screenshot → tesseract OCR | **ok** (`has_react=yes`) |

## 12. Staging / WhatsApp live tests

**Not run.** No authorized WhatsApp staging sandbox send was executed in this session (would require live Meta webhook + test number). Remaining staging checklist:

1. Set flags false → deploy → smoke existing text/voice.
2. Enable `WHATSAPP_MEDIA_UNDERSTAND_ENABLED` + `WHATSAPP_OCR_ENABLED` in staging.
3. Send JPEG resume screenshot, text PDF, DOCX, TXT, unsupported ZIP.
4. Enable OpenAI assist; compare replies vs templates.
5. Confirm no duplicate replies on Meta retry; bot pause still skips auto-reply.

## 13. Tests not run and why

- Full monorepo `npm test` (entire backend suite) — WhatsApp-focused suite run instead (207).
- Live Meta webhook / real phone media — no staging send authorized here.
- Real scanned paper PDF binary fixture — simulated via screenshot OCR path (verified).
- DOCX binary fixture in unit tests — mammoth path retained; TXT/PDF covered; DOCX relies on mammoth + PK magic gate.

## 14. Deployment prerequisites

- Node ≥20 (tesseract.js v7).
- `npm ci` includes `tesseract.js`, `pdf-parse`, `mammoth`.
- First OCR call may download language traineddata (network on deploy host).
- Redis optional (existing inline fallback).
- Do **not** enable OCR/media/OpenAI in production until staging checklist passes.

## 15. Production enablement

1. Deploy with all new flags **false**.
2. Confirm `META_APP_SECRET` set.
3. Staging: media+OCR → sample files.
4. Staging: OpenAI assist on.
5. Gradual production enable; monitor `[WA-OCR]`, `[WhatsAppMedia]`, `[WA-AI-COST]`.

## 16. Rollback

Set `WHATSAPP_OPENAI_ASSIST_ENABLED=false`, `WHATSAPP_MEDIA_UNDERSTAND_ENABLED=false`, `WHATSAPP_OCR_ENABLED=false`. Redeploy prior build if needed. Keep signature/secret production checks.

## 17. Remaining limitations

- OCR quality depends on image clarity and `WHATSAPP_OCR_LANGUAGES` packs (default `eng`).
- Indic-script OCR needs extra language packs configured explicitly.
- No durable private object-store for inbound WA media yet (in-memory only by design for privacy).
- Profile fields never auto-updated from OCR/extract.
- Not production-ready for media/OCR/assist until staging WhatsApp validation completes.

### Status legend (evidence-based)

| Feature | Status |
|---------|--------|
| Image OCR (tesseract.js) | Implemented + unit-tested + smoke-verified |
| Scanned PDF OCR path | Implemented + smoke-verified (screenshot→OCR) |
| Digital PDF/TXT extract | Implemented + unit + smoke-verified |
| DOCX extract | Implemented (mammoth); unit gate for magic; not binary-fixture tested |
| OpenAI assist + `gpt-6-luna` | Implemented + unit-tested + **live API ok** |
| Meta WhatsApp media E2E | Code wired; **not live-verified** |
| Public resume URL avoidance | Implemented (skip Cloudinary for inbound) |
| Feature flags default off | Implemented |
