# Website Knowledge — Operations & Deployment

## Overview

Pipeline: official website → discovery → SSR extraction → optional Playwright → corpus/policy merge → embeddings (hash or multilingual E5) → hybrid retrieval → grounded answers → admin diagnose → optional authorized WhatsApp E2E.

## Feature flags (safe defaults)

| Variable | Default | Notes |
|---|---|---|
| `WEBSITE_KNOWLEDGE_SEMANTIC_ENABLED` | `false` | Enable dense retrieval |
| `WEBSITE_KNOWLEDGE_EMBEDDING_PROVIDER` | `hash` | `hash` or `xenova`/`e5` |
| `WEBSITE_KNOWLEDGE_BROWSER_FALLBACK_ENABLED` | `false` | Playwright for thin CSR pages |
| `WHATSAPP_E2E_ENABLED` | `false` | Admin live Meta send for knowledge diagnose |
| `WHATSAPP_E2E_ALLOWED_RECIPIENTS` | empty | Comma-separated authorized test numbers only |

Never enable WhatsApp E2E without an explicit allowlist of **your** test numbers.

## Multilingual E5 (Phase 1)

- Model: `Xenova/multilingual-e5-small` (384-d)
- Runtime: `@huggingface/transformers` with **WASM** via `onnxruntime-web`
- Root cause of prior failure: native `onnxruntime-node` `ERR_DLOPEN_FAILED` on Node 24 Windows (ABI/DLL). Linux Node 20 may load native ORT; WASM works cross-platform.
- Prefixes: `query:` for queries, `passage:` for documents
- Fallback: hash embeddings (`aslijobs-hash-v1`, 256-d) if model load/infer fails
- Inference concurrency capped at 2; do not warm the model on every API process start

### Verify

```bash
cd backend
npx tsx scripts/verify-e5-embeddings.ts
```

### Reindex

1. Set `WEBSITE_KNOWLEDGE_SEMANTIC_ENABLED=true`
2. Set `WEBSITE_KNOWLEDGE_EMBEDDING_PROVIDER=xenova`
3. Set `WEBSITE_KNOWLEDGE_EMBEDDING_MODEL=Xenova/multilingual-e5-small`
4. Admin → Website Knowledge → **Reindex all** (or `POST /operations/website-knowledge/reindex`)

Hash and E5 vectors are **not** mixed in the same index; incompatible chunks are re-embedded.

### Rollback

1. Set provider back to `hash`
2. Reindex all
3. Or keep prior Mongo chunk collection backup and restore

## Playwright CSR fallback (Phase 2)

```bash
cd backend
npm i -D playwright
npx playwright install chromium
# Linux servers also need Playwright OS deps: npx playwright install-deps chromium
```

Enable only in workers/ops that crawl:

```
WEBSITE_KNOWLEDGE_BROWSER_FALLBACK_ENABLED=true
```

Verify:

```bash
npx tsx scripts/verify-browser-crawl.ts --origin https://www.aslijobs.com
```

Browser fetch never runs on WhatsApp webhook paths. SSRF allowlist + DNS checks apply before navigation.

## Meta WhatsApp E2E (Phase 3)

1. Set `WHATSAPP_E2E_ENABLED=true` only in a controlled admin environment
2. Set `WHATSAPP_E2E_ALLOWED_RECIPIENTS` to your authorized test number(s)
3. Ensure Meta credentials (`WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`) are valid
4. Admin diagnose → preview → Mock send (CI-safe) or Live send with confirm checkbox + dialog

Rules:

- No automatic sends on startup/sync/crawl/reindex
- One live message per confirmed execution + 60s cooldown
- API accepted ≠ delivered ≠ read
- Delivery receipts come from webhooks when available

## Runtime requirements

| Item | Guidance |
|---|---|
| Node | `20.x` (engines). Node 24 works with WASM E5 path |
| RAM | ≥1.5GB free for E5 model + Chromium if both enabled |
| Model cache | Hugging Face cache under user home / transformers cache |
| Redis / Mongo | Unchanged; knowledge sync uses existing Redis/BullMQ patterns |
| CPU | WASM E5 is CPU-bound; keep crawl concurrency low |

## Troubleshooting

| Symptom | Action |
|---|---|
| `ERR_DLOPEN_FAILED` onnxruntime_binding | Expected on some Windows/Node combos; WASM redirect should engage |
| `https:` WASM URL unsupported | Ensure local `onnxruntime-web` dist wasmPaths (implemented in embeddings loader) |
| `playwright_unavailable` | Install playwright + chromium |
| Thin `/resources` after browser | Inspect frontend CSR route / API; do not invent content |
| Live send refused | Check E2E flag, allowlist, confirm=true, credentials |

## Security

- No private seeker/employer data in website knowledge
- No hardcoded recipients or tokens
- Admin auth + permission gates on diagnose/send
- SSRF protections before browser navigation
