import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  JOBS_FOR_AI_LIMIT,
  clearedTemporarySearchSessionFields,
  matchesRequestedRole,
  placeCityAliases,
  publicJobFilters,
  resolveTurnUnderstanding,
  selectVerifiedJobsForReply,
  understandLocally,
} from "./whatsapp-bot.logic.js";

type JobRow = {
  jobId: string;
  jobTitle: string;
  cityName: string;
  city?: string;
  salaryLabel?: string;
  experience?: string;
};

function follow(text: string, previous: Parameters<typeof resolveTurnUnderstanding>[2]) {
  return resolveTurnUnderstanding(text, understandLocally(text), previous, "JOB_SEARCH");
}

function fixtureJobs(): JobRow[] {
  return [
    { jobId: "d1", jobTitle: "Driver", cityName: "Hyderabad", city: "hyderabad", salaryLabel: "₹25,000", experience: "fresher" },
    { jobId: "d2", jobTitle: "Car Driver", cityName: "Hyderabad", city: "hyderabad", salaryLabel: "₹18,000", experience: "1_year" },
    { jobId: "d3", jobTitle: "Screwdriver Operator", cityName: "Hyderabad", city: "hyderabad", salaryLabel: "₹22,000", experience: "fresher" },
    { jobId: "e1", jobTitle: "Electrician", cityName: "Hyderabad", city: "hyderabad", salaryLabel: "₹20,000", experience: "fresher" },
    { jobId: "e2", jobTitle: "Electrical Engineer", cityName: "Hyderabad", city: "hyderabad", salaryLabel: "₹45,000", experience: "2_year" },
    { jobId: "dev1", jobTitle: "Software Developer", cityName: "Hyderabad", city: "hyderabad", salaryLabel: "₹40,000", experience: "1_year" },
    { jobId: "dev2", jobTitle: "React Developer", cityName: "Hyderabad", city: "hyderabad", salaryLabel: "₹35,000", experience: "fresher" },
    { jobId: "c1", jobTitle: "Driver", cityName: "Chennai", city: "chennai", salaryLabel: "₹25,000", experience: "fresher" },
    { jobId: "w1", jobTitle: "Watchman", cityName: "Hyderabad", city: "hyderabad", salaryLabel: "₹15,000", experience: "fresher" },
    { jobId: "w2", jobTitle: "Cyber Security Analyst", cityName: "Hyderabad", city: "hyderabad", salaryLabel: "₹50,000", experience: "2_year" },
    { jobId: "dup1", jobTitle: "Driver", cityName: "Hyderabad", city: "hyderabad", salaryLabel: "₹21,000", experience: "fresher" },
    { jobId: "dup1", jobTitle: "Driver", cityName: "Hyderabad", city: "hyderabad", salaryLabel: "₹21,000", experience: "fresher" },
  ];
}

describe("WhatsApp job results accuracy", () => {
  it("keeps Driver results free of screwdriver and other unrelated titles", () => {
    const selected = selectVerifiedJobsForReply(fixtureJobs(), "Driver", fixtureJobs().length);
    const titles = selected.jobs.map((job) => job.jobTitle);
    assert.ok(titles.includes("Driver"));
    assert.ok(titles.includes("Car Driver"));
    assert.equal(titles.includes("Screwdriver Operator"), false);
    assert.equal(titles.includes("Electrician"), false);
    assert.equal(matchesRequestedRole("Screwdriver Operator", "Driver"), false);
    assert.equal(matchesRequestedRole("Car Driver", "Driver"), true);
  });

  it("keeps Electrician results free of Electrical Engineer", () => {
    assert.equal(matchesRequestedRole("Electrician", "Electrician"), true);
    assert.equal(matchesRequestedRole("Electrical Engineer", "Electrician"), false);
    assert.equal(matchesRequestedRole("ఎలక్ట్రిషియన్", "Electrician"), true);
    const selected = selectVerifiedJobsForReply(fixtureJobs(), "Electrician", fixtureJobs().length);
    assert.deepEqual(
      selected.jobs.map((job) => job.jobTitle),
      ["Electrician"],
    );
  });

  it("returns software developer titles for developer searches", () => {
    assert.equal(matchesRequestedRole("Software Developer", "Software Developer"), true);
    assert.equal(matchesRequestedRole("React Developer", "Software Developer"), true);
    assert.equal(matchesRequestedRole("Driver", "Software Developer"), false);
    const selected = selectVerifiedJobsForReply(fixtureJobs(), "Software Developer", fixtureJobs().length);
    assert.deepEqual(
      selected.jobs.map((job) => job.jobTitle).sort(),
      ["React Developer", "Software Developer"],
    );
  });

  it("does not treat Watchman as a cyber-security title", () => {
    assert.equal(matchesRequestedRole("Watchman", "Watchman"), true);
    assert.equal(matchesRequestedRole("Cyber Security Analyst", "Watchman"), false);
  });

  it("builds city, salary, and experience filters for all six languages", () => {
    const phrases = [
      "Driver jobs in Hyderabad salary 20000 fresher",
      "హైదరాబాద్ లో డ్రైవర్ జాబ్ ఫ్రెషర్ జీతం 20000",
      "हैदराबाद में ड्राइवर जॉब फ्रेशर सैलरी 20000",
      "ஹைதராபாத் இல் டிரைவர் வேலை புதிய சம்பளம் 20000",
      "ಹೈದರಾಬಾದ್ ನಲ್ಲಿ ಡ್ರೈವರ್ ಕೆಲಸ ಫ್ರೆಶರ್ ಸಂಬಳ 20000",
      "ഹൈദരാബാദിൽ ഡ്രൈവർ ജോലി ഫ്രഷർ ശമ്പളം 20000",
    ];
    for (const text of phrases) {
      const filters = publicJobFilters(understandLocally(text));
      assert.equal(filters.search, "Driver", text);
      assert.equal(filters.city, "Hyderabad", text);
      assert.equal(filters.minSalary, 20000, text);
      assert.equal(filters.experience, "fresher", text);
    }
    const ranged = publicJobFilters(
      understandLocally("Driver jobs in Hyderabad salary 20k to 30k"),
    );
    assert.equal(ranged.minSalary, 20000);
    assert.equal(ranged.maxSalary, 30000);
    const aliases = placeCityAliases("Bangalore");
    assert.ok(aliases.some((alias) => /bangalore|bengaluru/i.test(alias)));
  });

  it("deduplicates identical jobIds before counting and showing results", () => {
    const selected = selectVerifiedJobsForReply(fixtureJobs(), "Driver", 12);
    const ids = selected.jobs.map((job) => job.jobId);
    assert.equal(ids.filter((id) => id === "dup1").length, 1);
    assert.equal(new Set(ids).size, ids.length);
  });

  it("show more returns the next batch without repeating earlier jobs", () => {
    const page = Array.from({ length: 12 }, (_, index) => ({
      jobId: `j${index + 1}`,
      jobTitle: "Driver",
      cityName: "Hyderabad",
    }));
    const first = selectVerifiedJobsForReply(page, "Driver", 12);
    assert.equal(first.jobs.length, JOBS_FOR_AI_LIMIT);
    assert.equal(first.hasMore, true);
    const seen = new Set(first.jobs.map((job) => job.jobId));
    const second = selectVerifiedJobsForReply(page, "Driver", 12, seen);
    assert.equal(second.jobs.length, 4);
    assert.equal(
      second.jobs.some((job) => seen.has(job.jobId)),
      false,
    );
    const empty = selectVerifiedJobsForReply(page, "Driver", 12, new Set(page.map((job) => job.jobId)));
    assert.equal(empty.jobs.length, 0);
    assert.equal(empty.hasMore, false);
  });

  it("preserves role city salary and experience across show more", () => {
    const previous = {
      location: "Hyderabad",
      category: "Driver",
      intent: "JOB_SEARCH" as const,
      locationKind: "city" as const,
      experienceLevel: "fresher",
      minSalary: 20000,
      maxSalary: null,
    };
    for (const text of [
      "Show more",
      "ఇంకా జాబ్స్",
      "और जॉब दिखाओ",
      "இன்னும் வேலை",
      "ಇನ್ನಷ್ಟು ಕೆಲಸ",
      "കൂടുതൽ ജോലി",
    ]) {
      const next = follow(text, previous);
      const filters = publicJobFilters(next);
      assert.equal(next.showMore, true, text);
      assert.equal(filters.search, "Driver", text);
      assert.equal(filters.city, "Hyderabad", text);
      assert.equal(filters.minSalary, 20000, text);
      assert.equal(filters.experience, "fresher", text);
    }
  });

  it("returns an empty verified set when nothing matches the role", () => {
    const selected = selectVerifiedJobsForReply(fixtureJobs(), "Plumber", fixtureJobs().length);
    assert.equal(selected.jobs.length, 0);
    assert.equal(selected.total, 0);
    assert.equal(selected.hasMore, false);
  });

  it("clears seen job ids when the temporary search session is reset", () => {
    const cleared = clearedTemporarySearchSessionFields();
    assert.deepEqual(cleared.lastJobs, []);
    assert.deepEqual(cleared.lastSeenJobIds, []);
  });
});
