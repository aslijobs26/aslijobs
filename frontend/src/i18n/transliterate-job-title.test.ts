import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  clearJobTitleTransliterationCache,
  transliterateJobTitle,
} from "./transliterate-job-title";

const SCRIPT: Record<string, RegExp> = {
  te: /[\u0C00-\u0C7F]/,
  hi: /[\u0900-\u097F]/,
  ta: /[\u0B80-\u0BFF]/,
  kn: /[\u0C80-\u0CFF]/,
  ml: /[\u0D00-\u0D7F]/,
};

const TITLES = [
  "Field Sales Executive",
  "Full Stack Developer",
  "Customer Support Executive",
  "Data Entry Operator",
  "Software Engineer",
  "Delivery Partner",
  "Sales Manager",
] as const;

const here = path.dirname(fileURLToPath(import.meta.url));
const componentsDir = path.resolve(here, "../components");

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = path.join(directory, entry);
    if (statSync(fullPath).isDirectory()) return sourceFiles(fullPath);
    return fullPath.endsWith(".tsx") || fullPath.endsWith(".ts") ? [fullPath] : [];
  });
}

describe("job title transliteration", () => {
  it("leaves English titles unchanged", () => {
    for (const title of TITLES) {
      assert.equal(transliterateJobTitle(title, "en"), title);
      assert.equal(transliterateJobTitle(title, "english"), title);
    }
    assert.equal(transliterateJobTitle("", "te"), "");
    assert.equal(transliterateJobTitle("HR Executive", "te").startsWith("HR "), true);
  });

  it("writes the example titles in Telugu and Hindi without translating their meaning", () => {
    assert.equal(
      transliterateJobTitle("Field Sales Executive", "te"),
      "ఫీల్డ్ సేల్స్ ఎగ్జిక్యూటివ్",
    );
    assert.equal(
      transliterateJobTitle("Full Stack Developer", "te"),
      "ఫుల్ స్టాక్ డెవలపర్",
    );
    assert.equal(
      transliterateJobTitle("Customer Support Executive", "te"),
      "కస్టమర్ సపోర్ట్ ఎగ్జిక్యూటివ్",
    );
    assert.equal(
      transliterateJobTitle("Data Entry Operator", "te"),
      "డేటా ఎంట్రీ ఆపరేటర్",
    );
    assert.equal(transliterateJobTitle("Software Engineer", "te"), "సాఫ్ట్వేర్ ఇంజనీర్");
    assert.equal(transliterateJobTitle("Delivery Partner", "te"), "డెలివరీ పార్టనర్");
    assert.equal(transliterateJobTitle("Sales Manager", "te"), "సేల్స్ మేనేజర్");
    assert.equal(transliterateJobTitle("Carpenter", "te"), "కార్పెంటర్");

    assert.equal(
      transliterateJobTitle("Field Sales Executive", "hi"),
      "फील्ड सेल्स एग्जीक्यूटिव",
    );
    assert.equal(
      transliterateJobTitle("Full Stack Developer", "hi"),
      "फुल स्टैक डेवलपर",
    );
    assert.equal(
      transliterateJobTitle("Customer Support Executive", "hi"),
      "कस्टमर सपोर्ट एग्जीक्यूटिव",
    );

    const delivery = transliterateJobTitle("Delivery Partner", "te");
    assert.equal(delivery.includes("వ్యక్తి"), false);
    assert.equal(transliterateJobTitle("Carpenter", "te").includes("వడ్రంగి"), false);
    assert.equal(transliterateJobTitle("Field Sales Executive", "te").includes("క్షేత్ర"), false);
    assert.equal(transliterateJobTitle("Delivery Partner", "hi").includes("व्यक्ति"), false);
  });

  it("uses Tamil, Kannada, and Malayalam script and keeps each language separate", () => {
    for (const title of TITLES) {
      const telugu = transliterateJobTitle(title, "te");
      const hindi = transliterateJobTitle(title, "hi");
      const tamil = transliterateJobTitle(title, "ta");
      const kannada = transliterateJobTitle(title, "kn");
      const malayalam = transliterateJobTitle(title, "ml");
      assert.match(telugu, SCRIPT.te);
      assert.match(hindi, SCRIPT.hi);
      assert.match(tamil, SCRIPT.ta);
      assert.match(kannada, SCRIPT.kn);
      assert.match(malayalam, SCRIPT.ml);
      assert.notEqual(telugu, hindi);
      assert.notEqual(tamil, telugu);
      assert.notEqual(kannada, telugu);
      assert.notEqual(malayalam, telugu);
      assert.equal(transliterateJobTitle(title, "te"), telugu);
    }
  });

  it("keeps an already local-script title and does not call a translation service", () => {
    assert.equal(transliterateJobTitle("డెలివరీ పార్టనర్", "te"), "డెలివరీ పార్టనర్");
    assert.equal(transliterateJobTitle("Driver 2", "te").endsWith("2"), true);
    const source = readFileSync(path.join(here, "transliterate-job-title.ts"), "utf8");
    assert.doesNotMatch(source, /fetch\(|sarvam|api\.sarvam/i);
    assert.match(source, /transliterationCache/);
  });

  it("caches by language so a Telugu result is not reused for Hindi", () => {
    clearJobTitleTransliterationCache();
    const telugu = transliterateJobTitle("Sales Manager", "te");
    const hindi = transliterateJobTitle("Sales Manager", "hi");
    assert.equal(transliterateJobTitle("Sales Manager", "te"), telugu);
    assert.equal(transliterateJobTitle("Sales Manager", "hi"), hindi);
    assert.notEqual(telugu, hindi);
  });

  it("transliterates listing, search, and detail titles through the same function", () => {
    const surfaces = [
      "job-search/JobSearchJobCard.tsx",
      "job-search/JobSearchOverviewPanel.tsx",
      "job-search/JobSearchMobileJobDetails.tsx",
      "jobs/JobDetailsCenterPanel.tsx",
      "jobs/JobDetailsLeftRail.tsx",
      "home/jobs-discovery/JobCard.tsx",
    ];
    for (const surface of surfaces) {
      const source = readFileSync(path.join(componentsDir, surface), "utf8");
      assert.match(source, /transliterateJobTitle/);
    }
  });

  it("does not transliterate employer dashboard titles", () => {
    const employerFiles = sourceFiles(componentsDir).filter((filePath) => {
      const relative = path.relative(componentsDir, filePath);
      return relative.split(path.sep).some((part) => part === "employer" || part.startsWith("employer-"));
    });
    assert.ok(employerFiles.length > 0);
    for (const filePath of employerFiles) {
      const source = readFileSync(filePath, "utf8");
      assert.equal(source.includes("transliterateJobTitle"), false, filePath);
    }
  });

  it("renders a listing of titles without an external request", () => {
    const started = Date.now();
    for (let index = 0; index < 200; index += 1) {
      for (const title of TITLES) {
        transliterateJobTitle(`${title} ${index % 3 === 0 ? "II" : ""}`.trim(), "te");
      }
    }
    assert.ok(Date.now() - started < 1500);
  });
});
