import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { CorpusSection } from "./website-knowledge.corpus.js";

type PolicyFile = {
  generatedAt?: string;
  sectionCount?: number;
  sections: Array<{
    id: string;
    path: string;
    title: string;
    sectionHeading: string;
    content: string;
    sourceType: "policy";
    persona: "general";
  }>;
};

let cached: readonly CorpusSection[] | null = null;

export function loadOfficialPolicyCorpusSections(): readonly CorpusSection[] {
  if (cached) return cached;
  try {
    const file = join(
      dirname(fileURLToPath(import.meta.url)),
      "generated",
      "policy-corpus.en.json",
    );
    const parsed = JSON.parse(readFileSync(file, "utf8")) as PolicyFile;
    cached = (parsed.sections || []).map((section) => ({
      id: section.id,
      path: section.path,
      title: section.title,
      sectionHeading: section.sectionHeading,
      content: section.content,
      sourceType: "policy" as const,
      persona: "general" as const,
      keywords: [
        section.sectionHeading.toLowerCase(),
        section.path.replace(/^\//, ""),
        "policy",
      ],
    }));
    return cached;
  } catch {
    cached = [];
    return cached;
  }
}

/** Prefer full official policy sections over short stubs for the same path+heading. */
export function mergePolicySectionsIntoCorpus(
  base: readonly CorpusSection[],
): CorpusSection[] {
  const policy = loadOfficialPolicyCorpusSections();
  if (policy.length === 0) return [...base];
  const policyPaths = new Set(policy.map((s) => s.path));
  const kept = base.filter((section) => !policyPaths.has(section.path));
  return [...kept, ...policy];
}
