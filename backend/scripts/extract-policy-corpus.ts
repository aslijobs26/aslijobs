/**
 * Extract English Privacy / Terms / Guidelines text from frontend i18n bundles
 * into a JSON corpus consumed by website-knowledge sync.
 *
 * Usage: npx tsx scripts/extract-policy-corpus.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const frontendBundles = join(here, "../../frontend/src/i18n/bundles");
const outFile = join(here, "../src/modules/website-knowledge/generated/policy-corpus.en.json");

type SectionOut = {
  id: string;
  path: string;
  title: string;
  sectionHeading: string;
  content: string;
  sourceType: "policy";
  persona: "general";
};

function flattenStrings(value: unknown, acc: string[] = []): string[] {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed) acc.push(trimmed);
    return acc;
  }
  if (Array.isArray(value)) {
    for (const item of value) flattenStrings(item, acc);
    return acc;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (key === "navLabel") continue;
      flattenStrings(child, acc);
    }
  }
  return acc;
}

function sectionsFromBundle(
  path: string,
  pageTitle: string,
  sections: Record<string, unknown>,
): SectionOut[] {
  const out: SectionOut[] = [];
  for (const [id, raw] of Object.entries(sections)) {
    if (!raw || typeof raw !== "object") continue;
    const section = raw as Record<string, unknown>;
    const heading =
      (typeof section.title === "string" && section.title)
      || (typeof section.navLabel === "string" && section.navLabel)
      || id;
    const parts = flattenStrings(section);
    const content = parts.join(" ").replace(/\s+/g, " ").trim();
    if (content.length < 40) continue;
    out.push({
      id: `${path.replace(/\W+/g, "-")}-${id}`,
      path,
      title: pageTitle,
      sectionHeading: heading,
      content: content.slice(0, 8_000),
      sourceType: "policy",
      persona: "general",
    });
  }
  return out;
}

async function loadEn(bundleFile: string, exportName: string): Promise<Record<string, unknown>> {
  const mod = await import(pathToFileURL(join(frontendBundles, bundleFile)).href);
  const bundle = mod[exportName];
  if (!bundle?.en) throw new Error(`Missing ${exportName}.en in ${bundleFile}`);
  return bundle.en as Record<string, unknown>;
}

async function main() {
  const privacyEn = await loadEn("privacy.ts", "privacyBundle");
  const termsEn = await loadEn("terms.ts", "termsBundle");
  const guidelinesEn = await loadEn("guidelines.ts", "guidelinesBundle");

  const privacyRoot = (privacyEn.privacy || privacyEn) as Record<string, unknown>;
  const termsRoot = (termsEn.terms || termsEn) as Record<string, unknown>;
  const guidelinesRoot = (guidelinesEn.guidelines || guidelinesEn) as Record<string, unknown>;

  const sections = [
    ...sectionsFromBundle(
      "/privacy-policy",
      String((privacyRoot.meta as { title?: string } | undefined)?.title || "Privacy Policy"),
      (privacyRoot.sections || {}) as Record<string, unknown>,
    ),
    ...sectionsFromBundle(
      "/terms-and-conditions",
      String((termsRoot.meta as { title?: string } | undefined)?.title || "Terms & Conditions"),
      (termsRoot.sections || {}) as Record<string, unknown>,
    ),
    ...sectionsFromBundle(
      "/guidelines",
      String((guidelinesRoot.meta as { title?: string } | undefined)?.title || "Guidelines"),
      (guidelinesRoot.sections || {}) as Record<string, unknown>,
    ),
  ];

  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(
    outFile,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: "frontend/src/i18n/bundles/{privacy,terms,guidelines}.ts en",
        sectionCount: sections.length,
        sections,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ outFile, sectionCount: sections.length }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
