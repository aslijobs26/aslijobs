import { extractEducationHint, extractExperienceDetail } from "./whatsapp-bot.criteria.js";
import {
  clearedTemporarySearchSessionFields,
  locationGrain,
  parentCity,
  resolveTurnUnderstanding,
  serviceErrorCopy,
  understandLocally,
  type PendingSearchContext,
} from "./whatsapp-bot.logic.js";
import { groundOpenAiUnderstanding } from "./openai-assist.client.js";
import { withSearchCatalog } from "./whatsapp-search-catalog.js";

export type UnderstandingExpect = {
  intent?: string;
  category?: string;
  location?: string;
  locationNot?: string;
  minSalary?: number | null;
  experienceYears?: number | null;
  language?: string;
  education?: string;
};

export type UnderstandingEvalCase = {
  id: string;
  text: string;
  expect: UnderstandingExpect;
  catalog?: { titles: string[]; cities: string[] };
  previous?: PendingSearchContext | null;
};

const LIVE_TITLES = [
  "CNC Machine Operator",
  "Delivery Executive",
  "Security Officer",
  "Electrical Technician",
  "Plumber",
];

const LIVE_CITIES = ["Visakhapatnam", "Hyderabad", "Secunderabad", "Amaravati", "Bhubaneswar"];

export const WHATSAPP_UNDERSTANDING_EVAL: UnderstandingEvalCase[] = [
  {
    id: "te-driver",
    text: "నాకు డ్రైవర్ ఉద్యోగాలు కావాలి",
    expect: { intent: "JOB_SEARCH", category: "Driver", language: "te" },
  },
  {
    id: "te-hyderabad",
    text: "హైదరాబాద్ లో ఉద్యోగాలు చూపించు",
    expect: { intent: "JOB_SEARCH", location: "Hyderabad", language: "te" },
  },
  {
    id: "te-salary",
    text: "నాకు 20000 జీతం కావాలి",
    expect: { minSalary: 20000, language: "te" },
  },
  {
    id: "te-driver-work",
    text: "డ్రైవర్ పని కావాలి",
    expect: { intent: "JOB_SEARCH", category: "Driver", language: "te" },
  },
  {
    id: "te-experience",
    text: "నాకు 2 సంవత్సరాలు అనుభవం ఉంది",
    expect: { experienceYears: 2, language: "te" },
  },
  {
    id: "roman-te",
    text: "Hyd lo driver jobs kavali",
    expect: { intent: "JOB_SEARCH", category: "Driver", location: "Hyderabad", language: "te" },
  },
  {
    id: "hi-driver",
    text: "मुझे ड्राइवर की नौकरी चाहिए",
    expect: { intent: "JOB_SEARCH", category: "Driver", language: "hi" },
  },
  {
    id: "roman-hi",
    text: "mujhe driver job chahiye",
    expect: { intent: "JOB_SEARCH", category: "Driver", language: "hi" },
  },
  {
    id: "ta-driver",
    text: "எனக்கு டிரைவர் வேலை வேண்டும்",
    expect: { intent: "JOB_SEARCH", category: "Driver", language: "ta" },
  },
  {
    id: "kn-driver",
    text: "ನನಗೆ ಡ್ರೈವರ್ ಕೆಲಸ ಬೇಕು",
    expect: { intent: "JOB_SEARCH", category: "Driver", language: "kn" },
  },
  {
    id: "ml-driver",
    text: "എനിക്ക് ഡ്രൈവർ ജോലി വേണം",
    expect: { intent: "JOB_SEARCH", category: "Driver", language: "ml" },
  },
  {
    id: "en-mixed",
    text: "driver jobs kavali in Hyderabad",
    expect: { intent: "JOB_SEARCH", category: "Driver", location: "Hyderabad" },
  },
  {
    id: "vizag-alias",
    text: "Vizag lo electrician jobs",
    expect: { category: "Electrician", location: "Visakhapatnam" },
  },
  {
    id: "secunderabad-stays",
    text: "Security jobs in Secunderabad",
    expect: { location: "Secunderabad", locationNot: "Hyderabad" },
  },
  {
    id: "unknown-city-not-replaced",
    text: "driver jobs in Atlantis",
    expect: { category: "Driver", locationNot: "Hyderabad" },
  },
  {
    id: "misspelled-city",
    text: "electrician jobs in visakhapatam",
    expect: { category: "Electrician", location: "Visakhapatnam" },
  },
  {
    id: "unknown-role-preserved",
    text: "basket weaver jobs in Hyderabad",
    expect: { category: "Basket Weaver", location: "Hyderabad" },
  },
  {
    id: "cnc-catalog",
    text: "cnc operator jobs",
    catalog: { titles: LIVE_TITLES, cities: LIVE_CITIES },
    expect: { intent: "JOB_SEARCH", category: "CNC Machine Operator" },
  },
  {
    id: "security-catalog",
    text: "security guard jobs",
    catalog: { titles: ["Security Officer"], cities: LIVE_CITIES },
    expect: { category: "Security Officer" },
  },
  {
    id: "electrician-catalog-when-only-technician",
    text: "electrician jobs",
    catalog: { titles: ["Electrical Technician"], cities: [] },
    expect: { category: "Electrical Technician" },
  },
  {
    id: "electrician-kept-when-title-exists",
    text: "electrician jobs",
    catalog: { titles: ["Electrician", "Electrical Technician"], cities: [] },
    expect: { category: "Electrician" },
  },
  {
    id: "unrelated-role-not-remapped",
    text: "plumber jobs",
    catalog: { titles: ["Painter", "Electrician"], cities: [] },
    expect: { category: "Plumber" },
  },
  {
    id: "dynamic-city",
    text: "driver jobs in Amaravati",
    catalog: { titles: LIVE_TITLES, cities: LIVE_CITIES },
    expect: { category: "Driver", location: "Amaravati" },
  },
  {
    id: "education-hint",
    text: "I completed intermediate, what jobs can I get?",
    expect: { intent: "JOB_SEARCH", education: "intermediate" },
  },
  {
    id: "greeting",
    text: "Hi",
    expect: { intent: "GREETING", language: "en" },
  },
  {
    id: "greeting-plus-request",
    text: "Hi, I need driver jobs in Hyderabad",
    expect: { intent: "JOB_SEARCH", category: "Driver", location: "Hyderabad" },
  },
  {
    id: "application-status",
    text: "check my application status",
    expect: { intent: "APPLICATION_STATUS", language: "en" },
  },
];

export type EvalFailure = { id: string; field: string; expected: string; actual: string };

export function evaluateUnderstandingCase(item: UnderstandingEvalCase): EvalFailure[] {
  const run = () => {
    const local = understandLocally(item.text);
    const resolved = item.previous
      ? resolveTurnUnderstanding(item.text, local, item.previous, item.previous.intent)
      : local;
    const failures: EvalFailure[] = [];
    const check = (field: string, actual: string, expected: string | undefined) => {
      if (expected == null) return;
      if (actual !== expected) {
        failures.push({ id: item.id, field, expected, actual });
      }
    };
    check("intent", resolved.intent, item.expect.intent);
    check("category", resolved.category, item.expect.category);
    check("location", resolved.location, item.expect.location);
    check("language", resolved.language, item.expect.language);
    if (item.expect.locationNot && resolved.location === item.expect.locationNot) {
      failures.push({
        id: item.id,
        field: "locationNot",
        expected: `not ${item.expect.locationNot}`,
        actual: resolved.location,
      });
    }
    if (item.expect.minSalary != null) {
      check("minSalary", String(resolved.minSalary ?? ""), String(item.expect.minSalary));
    }
    if (item.expect.experienceYears != null) {
      check(
        "experienceYears",
        String(resolved.originalExperienceYears ?? extractExperienceDetail(item.text).years ?? ""),
        String(item.expect.experienceYears),
      );
    }
    if (item.expect.education != null) {
      check("education", extractEducationHint(item.text), item.expect.education);
    }
    return failures;
  };
  return item.catalog ? withSearchCatalog(item.catalog, run) : run();
}

export function evaluateUnderstandingDataset(
  cases: readonly UnderstandingEvalCase[] = WHATSAPP_UNDERSTANDING_EVAL,
): { total: number; passed: number; failures: EvalFailure[] } {
  const failures = cases.flatMap((item) => evaluateUnderstandingCase(item));
  const failedIds = new Set(failures.map((failure) => failure.id));
  return { total: cases.length, passed: cases.length - failedIds.size, failures };
}

export function hallucinationChecks(): EvalFailure[] {
  const failures: EvalFailure[] = [];
  const invented = groundOpenAiUnderstanding("నాకు డ్రైవర్ ఉద్యోగాలు కావాలి", {
    intent: "JOB_SEARCH",
    language: "te",
    location: "Atlantis",
    category: "Astronaut",
  });
  if (invented?.location === "Atlantis" || invented?.category === "Astronaut") {
    failures.push({
      id: "hallucination-entities",
      field: "grounding",
      expected: "drop invented location and role",
      actual: `${invented?.location ?? ""}/${invented?.category ?? ""}`,
    });
  }
  if (invented?.category !== "Driver") {
    failures.push({
      id: "hallucination-entities",
      field: "category",
      expected: "Driver",
      actual: invented?.category ?? "",
    });
  }
  const status = groundOpenAiUnderstanding("check my application status", {
    intent: "JOB_SEARCH",
    language: "en",
    location: "Mumbai",
    category: "Driver",
  });
  if (status?.intent === "JOB_SEARCH" || status?.location === "Mumbai" || status?.minSalary != null) {
    failures.push({
      id: "application-grounding",
      field: "intent",
      expected: "APPLICATION_STATUS without invented city or salary",
      actual: `${status?.intent ?? ""}/${status?.location ?? ""}/${status?.minSalary ?? ""}`,
    });
  }
  return failures;
}

export function safetyInvariants(): string[] {
  const problems: string[] = [];
  if (parentCity("Secunderabad")) problems.push("Secunderabad must not widen to another city");
  if (locationGrain("Madhapur") !== "locality") problems.push("Madhapur is a locality");
  if (locationGrain("Hyderabad") !== "city") problems.push("Hyderabad is a city");
  if (locationGrain("Telangana") !== "state" && locationGrain("Bihar") !== "state") {
    problems.push("known states stay states");
  }
  const cleared = clearedTemporarySearchSessionFields();
  if (cleared.lastCategory || cleared.lastLocation || cleared.pendingClarification) {
    problems.push("greeting reset must clear temporary search slots");
  }
  const failed = serviceErrorCopy("en");
  if (/no matching jobs/i.test(failed)) problems.push("search failure copy must not look like an empty result");
  return problems;
}
