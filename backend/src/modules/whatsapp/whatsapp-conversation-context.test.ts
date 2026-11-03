import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyNoMatchChoiceToSearch,
  resolveNoMatchChoice,
} from "./whatsapp-conversation-orchestrator.js";
import {
  publicJobFilters,
  resolveTurnUnderstanding,
  understandLocally,
  type PendingSearchContext,
} from "./whatsapp-bot.logic.js";

function follow(text: string, previous: PendingSearchContext) {
  return resolveTurnUnderstanding(text, understandLocally(text), previous, "JOB_SEARCH");
}

const driverHyd: PendingSearchContext = {
  location: "Hyderabad",
  category: "Driver",
  intent: "JOB_SEARCH",
  locationKind: "city",
  experienceLevel: "",
  minSalary: null,
  maxSalary: null,
};

const developer: PendingSearchContext = {
  location: "Hyderabad",
  category: "Software Developer",
  intent: "JOB_SEARCH",
  locationKind: "city",
  experienceLevel: "2_year",
  minSalary: 20000,
  maxSalary: null,
};

const hydJobs: PendingSearchContext = {
  location: "Hyderabad",
  category: "",
  intent: "JOB_SEARCH",
  locationKind: "city",
  openSearch: true,
  experienceLevel: "",
  minSalary: null,
  maxSalary: null,
};

const full: PendingSearchContext = {
  location: "Hyderabad",
  category: "Driver",
  intent: "JOB_SEARCH",
  locationKind: "city",
  experienceLevel: "fresher",
  minSalary: 20000,
  maxSalary: null,
};

describe("WhatsApp conversation context", () => {
  it("keeps Driver and Hyderabad when the next message is only fresher", () => {
    for (const text of [
      "Only fresher jobs",
      "ఫ్రెషర్ జాబ్స్ మాత్రమే",
      "fresher jobs matrame",
      "सिर्फ फ्रेशर जॉब",
      "sirf fresher jobs",
      "புதிய வேலை மட்டும்",
      "ಫ್ರೆಶರ್ ಕೆಲಸ ಮಾತ್ರ",
      "ഫ്രഷർ ജോലി മാത്രം",
    ]) {
      const next = follow(text, driverHyd);
      assert.equal(next.intent, "JOB_SEARCH", text);
      assert.equal(next.category, "Driver", text);
      assert.equal(next.location, "Hyderabad", text);
      assert.equal(next.experienceLevel, "fresher", text);
    }
  });

  it("adds Hyderabad without replacing React", () => {
    const react: PendingSearchContext = {
      location: "",
      category: "React",
      intent: "JOB_SEARCH",
    };
    for (const text of [
      "Hyderabad only",
      "హైదరాబాద్ మాత్రమే",
      "Hyderabad matrame",
      "सिर्फ हैदराबाद",
      "sirf Hyderabad",
      "ஹைதராபாத் மட்டும்",
      "ಹೈದರಾಬಾದ್ ಮಾತ್ರ",
      "ഹൈദരാബാദ് മാത്രം",
    ]) {
      const next = follow(text, react);
      assert.equal(next.intent, "JOB_SEARCH", text);
      assert.equal(next.category, "React", text);
      assert.equal(next.location, "Hyderabad", text);
    }
  });

  it("adds a salary without dropping Driver or Hyderabad", () => {
    for (const text of [
      "Salary 20k",
      "జీతం 20000",
      "सैलरी 20000",
      "சம்பளம் 20000",
      "ಸಂಬಳ 20000",
      "ശമ്പളം 20000",
    ]) {
      const next = follow(text, driverHyd);
      assert.equal(next.category, "Driver", text);
      assert.equal(next.location, "Hyderabad", text);
      assert.equal(next.minSalary, 20000, text);
      assert.equal(publicJobFilters(next).search, "Driver", text);
      assert.equal(publicJobFilters(next).minSalary, 20000, text);
    }
  });

  it("shows more of the same developer search", () => {
    for (const text of [
      "Show more",
      "ఇంకా జాబ్స్",
      "inka jobs",
      "और जॉब दिखाओ",
      "இன்னும் வேலை",
      "ಇನ್ನಷ್ಟು ಕೆಲಸ",
      "കൂടുതൽ ജോലി",
    ]) {
      const next = follow(text, developer);
      assert.equal(next.showMore, true, text);
      assert.equal(next.category, "Software Developer", text);
      assert.equal(next.location, "Hyderabad", text);
      assert.equal(next.experienceLevel, "2_year", text);
      assert.equal(next.minSalary, 20000, text);
    }
  });

  it("does not turn a night-shift follow-up into a job role", () => {
    for (const text of [
      "Only night shift",
      "నైట్ షిఫ్ట్ మాత్రమే",
      "सिर्फ नाइट शिफ्ट",
      "நைட் ஷிப்ட் மட்டும்",
      "ನೈಟ್ ಶಿಫ್ಟ್ ಮಾತ್ರ",
      "നൈറ്റ് ഷിഫ്റ്റ് മാത്രം",
    ]) {
      const next = follow(text, hydJobs);
      assert.equal(next.intent, "JOB_SEARCH", text);
      assert.equal(next.category, "", text);
      assert.equal(next.location, "Hyderabad", text);
      assert.equal(publicJobFilters(next).search, "", text);
      assert.equal(publicJobFilters(next).city, "Hyderabad", text);
    }
    const kept = follow("Only night shift", full);
    assert.equal(kept.category, "Driver");
    assert.equal(kept.experienceLevel, "fresher");
    assert.equal(kept.minSalary, 20000);
  });

  it("changes only the role", () => {
    for (const text of [
      "Change to electrician",
      "ఎలక్ట్రీషియన్ గా మార్చు",
      "electrician ga marchu",
      "इलेक्ट्रीशियन में बदलो",
      "எலக்ட்ரீஷியனாக மாற்று",
      "ಎಲೆಕ್ಟ್ರಿಷಿಯನ್ ಗೆ ಬದಲಾಯಿಸಿ",
      "ഇലക്ട്രീഷ്യൻ ആക്കി മാറ്റൂ",
    ]) {
      const next = follow(text, full);
      assert.equal(next.category, "Electrician", text);
      assert.equal(next.location, "Hyderabad", text);
      assert.equal(next.experienceLevel, "fresher", text);
      assert.equal(next.minSalary, 20000, text);
    }
  });

  it("changes only the city", () => {
    for (const text of [
      "Change location to Chennai",
      "చెన్నై కి మార్చు",
      "Chennai ki marchu",
      "लोकेशन चेन्नई कर दो",
      "இடத்தை சென்னைக்கு மாற்று",
      "ಸ್ಥಳವನ್ನು ಚೆನ್ನೈಗೆ ಬದಲಾಯಿಸಿ",
      "സ്ഥലം ചെന്നൈ ആക്കൂ",
    ]) {
      const next = follow(text, full);
      assert.equal(next.category, "Driver", text);
      assert.equal(next.location, "Chennai", text);
      assert.equal(next.experienceLevel, "fresher", text);
      assert.equal(next.minSalary, 20000, text);
    }
  });

  it("changes only the salary", () => {
    for (const text of [
      "Change salary to 30k",
      "జీతం 30000 కి మార్చు",
      "सैलरी 30000 कर दो",
      "சம்பளம் 30000 ஆக மாற்று",
      "ಸಂಬಳ 30000 ಕ್ಕೆ ಬದಲಾಯಿಸಿ",
      "ശമ്പളം 30000 ആക്കൂ",
    ]) {
      const next = follow(text, full);
      assert.equal(next.category, "Driver", text);
      assert.equal(next.location, "Hyderabad", text);
      assert.equal(next.experienceLevel, "fresher", text);
      assert.equal(next.minSalary, 30000, text);
    }
  });

  it("removes the experience filter and keeps the other criteria", () => {
    for (const text of [
      "Remove experience filter",
      "అనుభవం వద్దు",
      "experience vaddu",
      "अनुभव हटाओ",
      "experience hatao",
      "அனுபவம் வேண்டாம்",
      "ಅನುಭವ ಬೇಡ",
      "പരിചയം വേണ്ട",
    ]) {
      const next = follow(text, full);
      assert.equal(next.intent, "JOB_SEARCH", text);
      assert.equal(next.category, "Driver", text);
      assert.equal(next.location, "Hyderabad", text);
      assert.equal(next.experienceLevel, "", text);
      assert.equal(next.minSalary, 20000, text);
      assert.equal(publicJobFilters(next).experience, "", text);
    }
    const fresher = follow("no experience", driverHyd);
    assert.equal(fresher.experienceLevel, "fresher");
    assert.equal(fresher.category, "Driver");
  });

  it("modifies one no-match criterion and keeps the rest", () => {
    const session = {
      lastCategory: "Driver",
      lastLocation: "Hyderabad",
      lastMinSalary: 40000,
      lastMaxSalary: null,
      lastSalaryBasis: "monthly",
      lastExperience: "fresher",
      lastExperienceYears: 0,
      lastExperienceRange: "",
      locationKind: "city",
      pendingNearbyCity: "Secunderabad",
      pendingClarification: "job_search_no_match",
    };
    assert.equal(resolveNoMatchChoice("1"), "relax_salary");
    const relaxed = applyNoMatchChoiceToSearch("relax_salary", session, "en");
    assert.notEqual(relaxed, "wait");
    if (relaxed && typeof relaxed === "object") {
      assert.equal(relaxed.category, "Driver");
      assert.equal(relaxed.location, "Hyderabad");
      assert.equal(relaxed.minSalary, null);
      assert.equal(relaxed.experienceLevel, "fresher");
    }
    const nearby = applyNoMatchChoiceToSearch("use_nearby", session, "te");
    if (nearby && typeof nearby === "object") {
      assert.equal(nearby.location, "Secunderabad");
      assert.equal(nearby.category, "Driver");
      assert.equal(nearby.minSalary, 40000);
      assert.equal(nearby.experienceLevel, "fresher");
    }
    const previous: PendingSearchContext = {
      location: "Hyderabad",
      category: "Driver",
      intent: "JOB_SEARCH",
      locationKind: "city",
      experienceLevel: "fresher",
      minSalary: 40000,
      maxSalary: null,
    };
    const role = follow("change to electrician", previous);
    assert.equal(role.category, "Electrician");
    assert.equal(role.location, "Hyderabad");
    assert.equal(role.minSalary, 40000);
    assert.equal(role.experienceLevel, "fresher");
    const city = follow("Chennai lo", previous);
    assert.equal(city.category, "Driver");
    assert.equal(city.location, "Chennai");
    assert.equal(city.minSalary, 40000);
  });
});
