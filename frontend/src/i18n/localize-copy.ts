import type { LegalBlock, LegalSection } from "@/types/legal";

export function toCamelCaseId(id: string) {
  return id.replace(/-([a-z0-9])/g, (_, character: string) =>
    character.toUpperCase(),
  );
}

export function numberedCopy(
  record: Record<string, unknown>,
  prefix: string,
): string[] {
  return Object.keys(record)
    .filter((key) => new RegExp(`^${prefix}\\d+$`).test(key))
    .sort(
      (left, right) =>
        Number(left.slice(prefix.length)) - Number(right.slice(prefix.length)),
    )
    .map((key) => {
      const value = record[key];
      return typeof value === "string" ? value : "";
    })
    .filter((value) => value.length > 0);
}

function isCopyRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function legalSectionFromCopy(
  id: string,
  section: Record<string, unknown>,
): LegalSection {
  const blocks: LegalBlock[] = [];

  for (const [key, value] of Object.entries(section)) {
    if (key === "navLabel" || key === "title") {
      continue;
    }

    if (typeof value === "string" && /^p\d+$/.test(key)) {
      blocks.push({ type: "paragraph", text: value });
      continue;
    }

    if (isCopyRecord(value) && /^items\d*$/.test(key)) {
      blocks.push({ type: "list", items: numberedCopy(value, "i") });
      continue;
    }

    if (isCopyRecord(value) && key === "lines") {
      blocks.push({
        type: "contact-lines",
        lines: numberedCopy(value, "l"),
      });
    }
  }

  const title = section.title;
  return {
    id,
    navLabel: typeof section.navLabel === "string" ? section.navLabel : id,
    title: typeof title === "string" && title.trim() ? title : null,
    blocks,
  };
}
