/**
 * Live multilingual-E5 inference verification (WASM/onnxruntime-web path).
 *
 * Usage:
 *   npx tsx scripts/verify-e5-embeddings.ts
 */
import {
  cosineSimilarity,
  embedKnowledgeText,
  getEmbeddingProviderHealth,
  warmXenovaEmbeddingModel,
  XENOVA_E5_DIMS,
} from "../src/modules/website-knowledge/website-knowledge.embeddings.js";
import { loadOfficialPolicyCorpusSections } from "../src/modules/website-knowledge/website-knowledge.policy.js";

const QUERIES = [
  { lang: "en", text: "What personal information does AsliJobs collect?" },
  { lang: "en", text: "How do job seekers apply for jobs?" },
  { lang: "hi", text: "प्राइवेसी पॉलिसी में कौन सी जानकारी एकत्रित की जाती है?" },
  { lang: "te", text: "అసలీజాబ్స్ గోప్యతా విధానం ఏమిటి?" },
  { lang: "ta", text: "தனியுரிமைக் கொள்கை என்ன?" },
  { lang: "kn", text: "ಗೌಪ್ಯತಾ ನೀತಿ ಏನು?" },
  { lang: "ml", text: "സ്വകാര്യതാ നയം എന്താണ്?" },
  { lang: "en", text: "employer guidelines for posting jobs" },
  { lang: "en", text: "terms and conditions account suspension" },
  { lang: "en", text: "pricing for employers" },
];

async function main() {
  const warmStart = Date.now();
  const ready = await warmXenovaEmbeddingModel();
  const health = getEmbeddingProviderHealth();
  console.log(
    JSON.stringify({
      event: "e5_warmup",
      ready,
      health,
      warmMs: Date.now() - warmStart,
    }),
  );
  if (!ready) {
    console.error(JSON.stringify({ event: "e5_failed", reason: health.error }));
    process.exitCode = 1;
    return;
  }

  const sections = loadOfficialPolicyCorpusSections().slice(0, 40);
  const passageVectors: Array<{ title: string; path: string; vector: number[] }> = [];
  for (const section of sections.slice(0, 12)) {
    const embedded = await embedKnowledgeText({
      text: `${section.sectionHeading}\n${section.content}`.slice(0, 1800),
      enabled: true,
      provider: "xenova",
    });
    if (embedded?.provider === "xenova" && embedded.vector.length === XENOVA_E5_DIMS) {
      passageVectors.push({
        title: section.sectionHeading,
        path: section.path,
        vector: embedded.vector,
      });
    }
  }

  const results = [];
  for (const q of QUERIES) {
    const t0 = Date.now();
    const embedded = await embedKnowledgeText({
      text: q.text,
      enabled: true,
      provider: "xenova",
      asQuery: true,
    });
    const inferMs = Date.now() - t0;
    if (!embedded || embedded.provider !== "xenova") {
      results.push({ ...q, ok: false, provider: embedded?.provider || null, inferMs });
      continue;
    }
    const norm = Math.sqrt(embedded.vector.reduce((s, x) => s + x * x, 0));
    const ranked = passageVectors
      .map((p) => ({
        path: p.path,
        title: p.title,
        score: cosineSimilarity(embedded.vector, p.vector),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    results.push({
      lang: q.lang,
      text: q.text,
      ok: true,
      dims: embedded.vector.length,
      norm,
      inferMs,
      top: ranked,
    });
  }

  const okCount = results.filter((r) => r.ok).length;
  console.log(
    JSON.stringify({
      event: "e5_verify_summary",
      okCount,
      total: results.length,
      passagesEmbedded: passageVectors.length,
      health: getEmbeddingProviderHealth(),
      results,
    }),
  );
  if (okCount < results.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(JSON.stringify({ event: "e5_verify_crash", error: String(error) }));
  process.exitCode = 1;
});
