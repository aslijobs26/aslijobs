import fs from "node:fs";

const path = "src/modules/whatsapp/whatsapp-bot.logic.ts";
const src = fs.readFileSync(path, "utf8");
const start = src.indexOf("export function chooseAccountRole");
const end = src.indexOf("export function looksLikePostJobRequest");
if (start < 0 || end < 0) {
  throw new Error("markers not found");
}

const replacement = `export function chooseAccountRole(text: string): "seeker" | "employer" | null {
  const trimmed = text.trim();
  const posting =
    looksLikePostJobRequest(trimmed) ||
    /\\b(employer|hiring|hire|recruit|workers?|staff needed|need staff|hire staff)\\b|నియమించ|సిబ్బంది|రిక్రూట్|మనిషి కావాలి|వర్కర్స్ కావాలి|भर्ती|कर्मचारी चाहिए|मुझे कर्मचारी|ஊழியர்|ஆட்களை|ஆள் எடுக்க|வேலை போஸ்ட்|ನೇಮಕ|ಸಿಬ್ಬಂದಿ|ನೌಕರ ಬೇಕು|നിയമിക്ക|ജീവനക്കാര്|തൊഴിലാളി/i.test(
      trimmed,
    );
  // Typo-tolerant seeker cues (wnat→want) and compacted "jobseeker".
  const seekerPhrase =
    /\\b(job[-\\s]?seeker|jobseeker|looking for (a )?job|looking for work|need (a )?job|find (a )?job|want (a )?job|wnat (a )?job|want work|need work|suitable jobs?|match(ing)? (my )?resume|jobs? (for|matching) me)\\b|ఉద్యోగం కావాలి|ఉద్యోగాలను|జాబ్ కావాలి|పని కావాలి|नौकरी चाहिए|नौकरी ढूंढ|सही नौकरी|काम चाहिए|जॉब चाहिए|வேலை தேவை|வேலை வேண்டும்|ಉದ್ಯೋಗ ಬೇಕು|ಕೆಲಸ ಬೇಕು|ജോലി വേണം|job kavali|jobs kavali|naaku job|naku job|pani kavali|job chupinchu|jobs chupinchu/i.test(
      trimmed,
    );
  // Role + job = seeker only when not posting ("post electrician job" stays employer).
  const rolePlusJob =
    !posting &&
    /\\b(electrician|driver|helper|plumber|carpenter|cook|mason|welder|painter|mechanic|labour|labor|watchman|security|delivery|sales)\\b/i.test(
      trimmed,
    ) &&
    /\\b(job|jobs|work|kavali|chahiye|naukri|udyog|வேலை|ಕೆಲಸ|ജോലി)\\b/i.test(trimmed);
  const seeker = seekerPhrase || rolePlusJob;
  if (posting && !seekerPhrase) return "employer";
  if (seeker && !posting) return "seeker";
  if (posting && seekerPhrase) {
    return /post|hire|hiring|recruit|workers|कर्मचारी|నియమించ|సిబ్బంది|ஊழியர்|ಸಿಬ್ಬಂದಿ|ജീവനക്കാര്/i.test(
      trimmed,
    )
      ? "employer"
      : "seeker";
  }
  if (posting) return "employer";
  return null;
}

`;

fs.writeFileSync(path, src.slice(0, start) + replacement + src.slice(end));
console.log("patched chooseAccountRole bytes", replacement.length);
