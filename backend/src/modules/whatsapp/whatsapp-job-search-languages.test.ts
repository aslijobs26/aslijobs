import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EXPERIENCED_SEARCH_LEVEL } from "./whatsapp-bot.criteria.js";
import {
  jobSearchNoMatchCopy,
  jobSearchNoMoreCopy,
  publicJobFilters,
  resolveTurnUnderstanding,
  understandLocally,
  type PendingSearchContext,
} from "./whatsapp-bot.logic.js";

const previousSearch: PendingSearchContext = {
  location: "Hyderabad",
  category: "Driver",
  intent: "JOB_SEARCH",
  locationKind: "city",
};

function read(text: string) {
  return understandLocally(text);
}

describe("WhatsApp job search in six languages", () => {
  it("extracts role and Hyderabad in English", () => {
    const developer = read("I need a developer job in Hyderabad");
    assert.equal(developer.intent, "JOB_SEARCH");
    assert.equal(developer.language, "en");
    assert.equal(developer.category, "Software Developer");
    assert.equal(developer.location, "Hyderabad");

    assert.equal(read("driver jobs in Hyderabad").category, "Driver");
    assert.equal(read("delivery boy jobs in Hyderabad").category, "Delivery Executive");
    assert.equal(read("accountant jobs in Hyderabad").category, "Accountant");
    assert.equal(read("electrician jobs in Hyderabad").category, "Electrician");
    assert.equal(read("sales executive jobs in Hyderabad").category, "Sales Executive");
    assert.equal(read("sales executive jobs in Hyderabad").location, "Hyderabad");
  });

  it("extracts Telugu script and romanized Telugu searches", () => {
    const driver = read("హైదరాబాద్ లో డ్రైవర్ ఉద్యోగాలు కావాలి");
    assert.equal(driver.language, "te");
    assert.equal(driver.intent, "JOB_SEARCH");
    assert.equal(driver.category, "Driver");
    assert.equal(driver.location, "Hyderabad");

    assert.equal(read("హైదరాబాద్ లో ఎలక్ట్రీషియన్ జాబ్స్ ఉన్నాయా").category, "Electrician");
    assert.equal(read("హైదరాబాద్ లో అకౌంటెంట్ ఉద్యోగం కావాలి").category, "Accountant");
    assert.equal(read("హైదరాబాద్ లో డెలివరీ బాయ్ కావాలి").category, "Delivery Executive");
    assert.equal(read("హైదరాబాద్ లో డెవలపర్ ఉద్యోగం కావాలి").category, "Software Developer");
    assert.equal(read("హైదరాబాద్ లో సేల్స్ ఎగ్జిక్యూటివ్ ఉద్యోగం").category, "Sales Executive");

    const roman = read("Hyderabad lo developer job kavali");
    assert.equal(roman.language, "te");
    assert.equal(roman.intent, "JOB_SEARCH");
    assert.equal(roman.category, "Software Developer");
    assert.equal(roman.location, "Hyderabad");
    assert.equal(read("Hyderabad lo delivery boy job kavali").category, "Delivery Executive");
  });

  it("extracts Hindi script and romanized Hindi searches", () => {
    const driver = read("हैदराबाद में ड्राइवर की नौकरी चाहिए");
    assert.equal(driver.language, "hi");
    assert.equal(driver.intent, "JOB_SEARCH");
    assert.equal(driver.category, "Driver");
    assert.equal(driver.location, "Hyderabad");

    assert.equal(read("हैदराबाद में डिलीवरी बॉय चाहिए").category, "Delivery Executive");
    assert.equal(read("हैदराबाद में अकाउंटेंट की नौकरी चाहिए").category, "Accountant");
    assert.equal(read("हैदराबाद में इलेक्ट्रीशियन की नौकरी चाहिए").category, "Electrician");
    assert.equal(read("हैदराबाद में सेल्स एग्जीक्यूटिव की नौकरी").category, "Sales Executive");
    assert.equal(read("हैदराबाद में डेवलपर की नौकरी चाहिए").category, "Software Developer");

    const roman = read("Hyderabad mein driver naukri chahiye");
    assert.equal(roman.language, "hi");
    assert.equal(roman.category, "Driver");
    assert.equal(roman.location, "Hyderabad");
    assert.equal(read("Hyderabad me delivery boy chahiye").category, "Delivery Executive");
  });

  it("extracts Tamil, Kannada, and Malayalam searches", () => {
    const tamil = read("ஹைதராபாத்தில் டிரைவர் வேலை வேண்டும்");
    assert.equal(tamil.language, "ta");
    assert.equal(tamil.intent, "JOB_SEARCH");
    assert.equal(tamil.category, "Driver");
    assert.equal(tamil.location, "Hyderabad");
    assert.equal(read("ஹைதராபாத் எலக்ட்ரீஷியன் வேலை வேண்டும்").category, "Electrician");
    assert.equal(read("ஹைதராபாத் டெலிவரி பாய் வேலை வேண்டும்").category, "Delivery Executive");
    assert.equal(read("ஹைதராபாத் அக்கவுண்டன்ட் வேலை வேண்டும்").category, "Accountant");
    assert.equal(read("ஹைதராபாத் டெவலப்பர் வேலை வேண்டும்").category, "Software Developer");
    assert.equal(read("ஹைதராபாத் சேல்ஸ் எக்சிகியூட்டிவ் வேலை").category, "Sales Executive");

    const kannada = read("ಹೈದರಾಬಾದ್‌ನಲ್ಲಿ ಡ್ರೈವರ್ ಕೆಲಸ ಬೇಕು");
    assert.equal(kannada.language, "kn");
    assert.equal(kannada.intent, "JOB_SEARCH");
    assert.equal(kannada.category, "Driver");
    assert.equal(kannada.location, "Hyderabad");
    assert.equal(read("ಹೈದರಾಬಾದ್ ಎಲೆಕ್ಟ್ರಿಷಿಯನ್ ಕೆಲಸ ಬೇಕು").category, "Electrician");
    assert.equal(read("ಹೈದರಾಬಾದ್ ಡೆಲಿವರಿ ಬಾಯ್ ಕೆಲಸ ಬೇಕು").category, "Delivery Executive");
    assert.equal(read("ಹೈದರಾಬಾದ್ ಅಕೌಂಟೆಂಟ್ ಕೆಲಸ").category, "Accountant");
    assert.equal(read("ಹೈದರಾಬಾದ್ ಡೆವಲಪರ್ ಕೆಲಸ ಬೇಕು").category, "Software Developer");

    const malayalam = read("ഹൈദരാബാദിൽ ഡ്രൈവർ ജോലി വേണം");
    assert.equal(malayalam.language, "ml");
    assert.equal(malayalam.intent, "JOB_SEARCH");
    assert.equal(malayalam.category, "Driver");
    assert.equal(malayalam.location, "Hyderabad");
    assert.equal(read("ഹൈദരാബാദ് ഇലക്ട്രീഷ്യൻ ജോലി വേണം").category, "Electrician");
    assert.equal(read("ഹൈദരാബാദ് ഡെലിവറി ബോയ് ജോലി വേണം").category, "Delivery Executive");
    assert.equal(read("ഹൈദരാബാദ് അക്കൗണ്ടന്റ് ജോലി വേണം").category, "Accountant");
    assert.equal(read("ഹൈദരാബാദ് ഡെവലപ്പർ ജോലി വേണം").category, "Software Developer");
  });

  it("keeps a mixed Telugu-English search on the Telugu role, city, and salary", () => {
    const mixed = read("driver jobs kavali in Hyderabad salary 20k");
    assert.equal(mixed.language, "te");
    assert.equal(mixed.intent, "JOB_SEARCH");
    assert.equal(mixed.category, "Driver");
    assert.equal(mixed.location, "Hyderabad");
    assert.equal(mixed.minSalary, 20000);
    const filters = publicJobFilters(mixed);
    assert.equal(filters.search, "Driver");
    assert.equal(filters.city, "Hyderabad");
    assert.equal(filters.minSalary, 20000);
  });

  it("understands fresher, experienced, years, and salary in each language family", () => {
    assert.equal(read("fresher driver jobs in Hyderabad").experienceLevel, "fresher");
    assert.equal(read("2 years experience electrician in Hyderabad").experienceLevel, "2_year");
    assert.equal(read("experienced driver jobs in Hyderabad").experienceLevel, EXPERIENCED_SEARCH_LEVEL);
    assert.equal(read("salary 20000 driver jobs in Hyderabad").minSalary, 20000);
    assert.equal(read("driver jobs in Hyderabad salary 20k to 30k").minSalary, 20000);
    assert.equal(read("driver jobs in Hyderabad salary 20k to 30k").maxSalary, 30000);

    assert.equal(read("ఫ్రెషర్ డ్రైవర్ జాబ్స్ హైదరాబాద్").experienceLevel, "fresher");
    assert.equal(read("2 సంవత్సరాలు అనుభవం ఉన్న ఎలక్ట్రీషియన్ హైదరాబాద్").experienceLevel, "2_year");
    assert.equal(read("జీతం 20000 డ్రైవర్ హైదరాబాద్").minSalary, 20000);

    assert.equal(read("फ्रेशर ड्राइवर जॉब हैदराबाद").experienceLevel, "fresher");
    assert.equal(read("2 साल अनुभव ड्राइवर हैदराबाद").experienceLevel, "2_year");
    assert.equal(read("सैलरी 20000 ड्राइवर हैदराबाद").minSalary, 20000);
    assert.equal(read("2 saal ka experience driver Hyderabad mein").experienceLevel, "2_year");

    assert.equal(read("புதிய டிரைவர் வேலை ஹைதராபாத்").experienceLevel, "fresher");
    assert.equal(read("2 வருடம் அனுபவம் டிரைவர் ஹைதராபாத்").experienceLevel, "2_year");
    assert.equal(read("ಫ್ರೆಶರ್ ಡ್ರೈವರ್ ಕೆಲಸ ಹೈದರಾಬಾದ್").experienceLevel, "fresher");
    assert.equal(read("2 ವರ್ಷ ಅನುಭವ ಡ್ರೈವರ್ ಹೈದರಾಬಾದ್").experienceLevel, "2_year");
    assert.equal(read("ഫ്രഷർ ഡ്രൈവർ ജോലി ഹൈദരാബാദ്").experienceLevel, "fresher");
    assert.equal(read("2 വർഷം പരിചയം ഡ്രൈവർ ഹൈദരാബാദ്").experienceLevel, "2_year");

    const experienced = publicJobFilters(read("experienced driver jobs in Hyderabad"));
    assert.equal(experienced.search, "Driver");
    assert.equal(experienced.city, "Hyderabad");
    assert.equal(experienced.experience, EXPERIENCED_SEARCH_LEVEL);
    assert.equal(experienced.experience.includes("fresher"), false);
  });

  it("keeps the previous search on follow-up messages", () => {
    const fresher = resolveTurnUnderstanding(
      "Only fresher jobs",
      read("Only fresher jobs"),
      previousSearch,
      "JOB_SEARCH",
    );
    assert.equal(fresher.intent, "JOB_SEARCH");
    assert.equal(fresher.category, "Driver");
    assert.equal(fresher.location, "Hyderabad");
    assert.equal(fresher.experienceLevel, "fresher");

    const salary = resolveTurnUnderstanding("Salary 20k", read("Salary 20k"), previousSearch, "JOB_SEARCH");
    assert.equal(salary.category, "Driver");
    assert.equal(salary.location, "Hyderabad");
    assert.equal(salary.minSalary, 20000);

    const react = resolveTurnUnderstanding("React jobs", read("React jobs"), previousSearch, "JOB_SEARCH");
    assert.equal(react.category, "React");
    assert.equal(react.location, "Hyderabad");

    const city = resolveTurnUnderstanding(
      "Hyderabad only",
      read("Hyderabad only"),
      previousSearch,
      "JOB_SEARCH",
    );
    assert.equal(city.category, "Driver");
    assert.equal(city.location, "Hyderabad");

    const more = resolveTurnUnderstanding("Show more", read("Show more"), previousSearch, "JOB_SEARCH");
    assert.equal(more.showMore, true);
    assert.equal(more.category, "Driver");
    assert.equal(more.location, "Hyderabad");

    const teluguMore = resolveTurnUnderstanding("inka jobs", read("inka jobs"), previousSearch, "JOB_SEARCH");
    assert.equal(teluguMore.showMore, true);
    assert.equal(teluguMore.category, "Driver");

    const hindiSalary = resolveTurnUnderstanding(
      "सैलरी 20000",
      read("सैलरी 20000"),
      previousSearch,
      "JOB_SEARCH",
    );
    assert.equal(hindiSalary.category, "Driver");
    assert.equal(hindiSalary.location, "Hyderabad");
    assert.equal(hindiSalary.minSalary, 20000);
  });

  it("answers an empty search in the conversation language with a next step", () => {
    for (const language of ["en", "te", "hi", "ta", "kn", "ml"] as const) {
      const copy = jobSearchNoMatchCopy({
        language,
        location: "Hyderabad",
        role: "Driver",
        minSalary: 20000,
        lowerSalaryCount: 2,
        undisclosedCount: 1,
        nearbyCity: "",
      });
      assert.match(copy, /Hyderabad/);
      assert.match(copy, /Driver/);
      assert.match(copy, /1\./);
      if (language === "ta") assert.match(copy, /மன்னிக்கவும்/);
      if (language === "kn") assert.match(copy, /ಕ್ಷಮಿಸಿ/);
      if (language === "ml") assert.match(copy, /ക്ഷമിക്കണം/);
      const more = jobSearchNoMoreCopy({
        language,
        location: "Hyderabad",
        role: "Driver",
        minSalary: null,
      });
      if (language === "ta") assert.match(more, /வேலை/);
      if (language === "kn") assert.match(more, /ಕೆಲಸ/);
      if (language === "ml") assert.match(more, /ജോലി/);
    }
  });
});
