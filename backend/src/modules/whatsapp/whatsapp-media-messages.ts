import type { BotLanguage } from "./whatsapp-bot.logic.js";

export function mediaReceivedAskIntentCopy(language: BotLanguage): string {
  if (language === "te") {
    return "మీ ఫైల్ అందింది. ఇది రెజ్యూమ్‌నా, లేక జాబ్ స్క్రీన్‌షాట్‌నా? చెప్పండి — లేదా aslijobs.com లో ప్రొఫైల్ అప్‌డేట్ చేయండి.";
  }
  if (language === "hi") {
    return "फ़ाइल मिल गई। क्या यह रिज़्यूमे है या जॉब स्क्रीनशॉट? बताएं — या aslijobs.com पर प्रोफ़ाइल अपडेट करें।";
  }
  if (language === "ta") {
    return "உங்கள் கோப்பு கிடைத்தது. இது ரெஸ்யூமா அல்லது வேலை ஸ்கிரீன்ஷாட்டா? சொல்லுங்கள் — அல்லது aslijobs.com இல் சுயவிவரத்தை புதுப்பிக்கவும்.";
  }
  if (language === "kn") {
    return "ನಿಮ್ಮ ಫೈಲ್ ಸಿಕ್ಕಿದೆ. ಇದು ರೆಸ್ಯೂಮ್ ಅಥವಾ ಜಾಬ್ ಸ್ಕ್ರೀನ್‌ಶಾಟ್? ಹೇಳಿ — ಅಥವಾ aslijobs.com ನಲ್ಲಿ ಪ್ರೊಫೈಲ್ ಅಪ್‌ಡೇಟ್ ಮಾಡಿ.";
  }
  if (language === "ml") {
    return "നിങ്ങളുടെ ഫയൽ ലഭിച്ചു. ഇത് റെസ്യൂമോ ജോബ് സ്ക്രീൻഷോട്ടോ? പറയൂ — അല്ലെങ്കിൽ aslijobs.com-ൽ പ്രൊഫൈൽ അപ്‌ഡേറ്റ് ചെയ്യുക.";
  }
  return "Got your file. Is this a resume or a job screenshot? Tell me — or update your profile on aslijobs.com.";
}

export function mediaUnsupportedCopy(language: BotLanguage): string {
  if (language === "te") {
    return "ఈ ఫైల్ రకం మద్దతు లేదు. PDF, DOCX లేదా TXT రెజ్యూమ్ పంపండి — లేదా aslijobs.com లో అప్‌లోడ్ చేయండి.";
  }
  if (language === "hi") {
    return "यह फ़ाइल प्रकार समर्थित नहीं है. PDF, DOCX या TXT रिज़्यूमे भेजें — या aslijobs.com पर अपलोड करें.";
  }
  if (language === "ta") {
    return "இந்த கோப்பு வகை ஆதரிக்கப்படவில்லை. PDF, DOCX அல்லது TXT ரெஸ்யூம் அனுப்புங்கள்.";
  }
  if (language === "kn") {
    return "ಈ ಫೈಲ್ ಪ್ರಕಾರ ಬೆಂಬಲಿತವಲ್ಲ. PDF, DOCX ಅಥವಾ TXT ರೆಸ್ಯೂಮ್ ಕಳುಹಿಸಿ.";
  }
  if (language === "ml") {
    return "ഈ ഫയൽ തരം പിന്തുണയ്ക്കുന്നില്ല. PDF, DOCX അല്ലെങ്കിൽ TXT റെസ്യൂം അയയ്ക്കുക.";
  }
  return "That file type is not supported here. Send a PDF, DOCX, or TXT resume — or upload on aslijobs.com.";
}

export function mediaEmptyOrFailedCopy(language: BotLanguage): string {
  if (language === "te") {
    return "ఫైల్ చదవలేకపోయాను (స్కాన్/ఖాళీ కావచ్చు). టెక్స్ట్ ఉన్న PDF/DOCX పంపండి లేదా aslijobs.com లో అప్‌లోడ్ చేయండి.";
  }
  if (language === "hi") {
    return "फ़ाइल पढ़ नहीं पाए (स्कैन/खाली हो सकती है). टेक्स्ट वाला PDF/DOCX भेजें या aslijobs.com पर अपलोड करें.";
  }
  if (language === "ta") {
    return "கோப்பைப் படிக்க முடியவில்லை. உரை உள்ள PDF/DOCX அனுப்புங்கள் அல்லது aslijobs.com இல் பதிவேற்றுங்கள்.";
  }
  if (language === "kn") {
    return "ಫೈಲ್ ಓದಲಾಗಲಿಲ್ಲ. ಪಠ್ಯವಿರುವ PDF/DOCX ಕಳುಹಿಸಿ ಅಥವಾ aslijobs.com ನಲ್ಲಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.";
  }
  if (language === "ml") {
    return "ഫയൽ വായിക്കാനായില്ല. ടെക്സ്റ്റ് ഉള്ള PDF/DOCX അയയ്ക്കുക അല്ലെങ്കിൽ aslijobs.com-ൽ അപ്‌ലോഡ് ചെയ്യുക.";
  }
  return "I couldn't read that file (it may be scanned or empty). Send a text PDF/DOCX or upload on aslijobs.com.";
}

export function mediaImageAskCopy(language: BotLanguage): string {
  if (language === "te") {
    return "చిత్రం అందింది. రెజ్యూమ్ స్క్రీన్‌షాట్‌నా లేక జాబ్ పోస్ట్‌నా? చెప్పండి.";
  }
  if (language === "hi") {
    return "इमेज मिल गई. रिज़्यूमे स्क्रीनशॉट है या जॉब पोस्ट? बताएं.";
  }
  if (language === "ta") {
    return "படம் கிடைத்தது. ரெஸ்யூம் ஸ்கிரீன்ஷாட்டா அல்லது வேலை இடுகையா? சொல்லுங்கள்.";
  }
  if (language === "kn") {
    return "ಚಿತ್ರ ಸಿಕ್ಕಿದೆ. ರೆಸ್ಯೂಮ್ ಸ್ಕ್ರೀನ್‌ಶಾಟ್ ಅಥವಾ ಜಾಬ್ ಪೋಸ್ಟ್? ಹೇಳಿ.";
  }
  if (language === "ml") {
    return "ചിത്രം ലഭിച്ചു. റെസ്യൂം സ്ക്രീൻഷോട്ടോ ജോബ് പോസ്റ്റോ? പറയൂ.";
  }
  return "Got your image. Is it a resume screenshot or a job post? Tell me what you need.";
}

export function mediaOcrEmptyCopy(language: BotLanguage): string {
  if (language === "te") {
    return "చిత్రంలో చదవగలిగే టెక్స్ట్ కనపడలేదు. క్లియర్ ఫోటో పంపండి లేదా టెక్స్ట్ టైప్ చేయండి.";
  }
  if (language === "hi") {
    return "इमेज में पढ़ने लायक टेक्स्ट नहीं मिला. साफ़ फ़ोटो भेजें या टेक्स्ट लिखें.";
  }
  if (language === "ta") {
    return "படத்தில் வாசிக்கக்கூடிய உரை இல்லை. தெளிவான புகைப்படம் அனுப்புங்கள் அல்லது உரையை தட்டச்சு செய்யுங்கள்.";
  }
  if (language === "kn") {
    return "ಚಿತ್ರದಲ್ಲಿ ಓದಬಹುದಾದ ಪಠ್ಯ ಕಾಣಲಿಲ್ಲ. ಸ್ಪಷ್ಟ ಫೋಟೋ ಕಳುಹಿಸಿ ಅಥವಾ ಪಠ್ಯ ಟೈಪ್ ಮಾಡಿ.";
  }
  if (language === "ml") {
    return "ചിത്രത്തിൽ വായിക്കാവുന്ന ടെക്സ്റ്റ് കണ്ടെത്തിയില്ല. വ്യക്തമായ ഫോട്ടോ അയയ്ക്കുക അല്ലെങ്കിൽ ടെക്സ്റ്റ് ടൈപ്പ് ചെയ്യുക.";
  }
  return "I couldn't find readable text in that image. Send a clearer photo or type the text.";
}

export function mediaEncryptedCopy(language: BotLanguage): string {
  if (language === "te") {
    return "ఈ PDF పాస్‌వర్డ్‌తో లాక్ అయి ఉంది. అన్‌లాక్ చేసి మళ్లీ పంపండి.";
  }
  if (language === "hi") {
    return "यह PDF पासवर्ड से लॉक है. अनलॉक करके फिर भेजें.";
  }
  return "This PDF is password-protected. Unlock it and send it again.";
}

export function mediaJobAdSummaryCopy(input: {
  language: BotLanguage;
  skills: string[];
  truncated: boolean;
}): string {
  const skillLine =
    input.skills.length > 0
      ? input.skills.map((s) => s.replace(/\b\w/g, (c) => c.toUpperCase())).join(", ")
      : "";
  if (input.language === "te") {
    return [
      "జాబ్ వివరాలు చదివాను (AsliJobs డేటాబేస్ జాబ్ కాదు — స్క్రీన్‌షాట్ మాత్రమే).",
      skillLine ? `గుర్తించిన స్కిల్స్: ${skillLine}` : "",
      "మీకు సరిపోయే జాబ్‌లు కావాలా? రోల్ / ఏరియా చెప్పండి.",
    ]
      .filter(Boolean)
      .join("\n");
  }
  if (input.language === "hi") {
    return [
      "जॉब विवरण पढ़ा (यह AsliJobs डेटाबेस जॉब नहीं — केवल स्क्रीनशॉट).",
      skillLine ? `मिले कौशल: ${skillLine}` : "",
      "मैचिंग जॉब चाहिए? भूमिका / इलाका बताएं.",
    ]
      .filter(Boolean)
      .join("\n");
  }
  return [
    "I read a job description from your image (screenshot text only — not an AsliJobs vacancy).",
    skillLine ? `Skills spotted: ${skillLine}` : "",
    "Want matching jobs from AsliJobs? Tell me the role or area.",
    input.truncated ? "(Long text was truncated.)" : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function mediaNoResumeContinueCopy(language: BotLanguage): string {
  if (language === "te") {
    return "సరే — రెజ్యూమ్ లేకుండా కూడా జాబ్‌లు చూడవచ్చు. ఏ రోల్ / ఏ ఏరియా కావాలి?";
  }
  if (language === "hi") {
    return "ठीक है — बिना रिज़्यूमे भी जॉब देख सकते हैं. कौनसी भूमिका / इलाका चाहिए?";
  }
  if (language === "ta") {
    return "சரி — ரெஸ்யூம் இல்லாமலும் வேலைகளைப் பார்க்கலாம். எந்த பங்கு / பகுதி வேண்டும்?";
  }
  if (language === "kn") {
    return "ಸರಿ — ರೆಸ್ಯೂಮ್ ಇಲ್ಲದೆಯೂ ಉದ್ಯೋಗಗಳನ್ನು ನೋಡಬಹುದು. ಯಾವ ಪಾತ್ರ / ಪ್ರದೇಶ ಬೇಕು?";
  }
  if (language === "ml") {
    return "ശരി — റെസ്യൂം ഇല്ലാതെയും ജോലികൾ കാണാം. ഏത് റോൾ / ഏരിയ വേണം?";
  }
  return "No problem — you can still browse jobs without a resume. Which role or area are you looking for?";
}

export function buildResumeExtractSummary(input: {
  language: BotLanguage;
  skills: string[];
  missingHints: string[];
  truncated: boolean;
  profileUrl: string;
}): string {
  const skillLine =
    input.skills.length > 0
      ? input.skills.map((s) => s.replace(/\b\w/g, (c) => c.toUpperCase())).join(", ")
      : "";
  const missing =
    input.missingHints.length > 0 ? input.missingHints.join(", ") : "";
  if (input.language === "te") {
    return [
      "రెజ్యూమ్ నుంచి టెక్స్ట్ చదివాను (ఆటోమేటిక్‌గా ప్రొఫైల్ అప్‌డేట్ కాలేదు).",
      skillLine ? `గుర్తించిన స్కిల్స్: ${skillLine}` : "స్పష్టమైన స్కిల్స్ జాబితా కనపడలేదు.",
      missing ? `తనిఖీ చేయాల్సినవి: ${missing}` : "",
      input.truncated ? "(పొడవైన ఫైల్ — కొంత భాగం మాత్రమే.)" : "",
      `ప్రొఫైల్ పూర్తి చేయడానికి: ${input.profileUrl}`,
    ]
      .filter(Boolean)
      .join("\n");
  }
  if (input.language === "hi") {
    return [
      "रिज़्यूमे से टेक्स्ट पढ़ा (प्रोफ़ाइल अपने-आप अपडेट नहीं हुई).",
      skillLine ? `मिले कौशल: ${skillLine}` : "स्पष्ट कौशल सूची नहीं मिली.",
      missing ? `जाँचें: ${missing}` : "",
      `प्रोफ़ाइल पूरा करें: ${input.profileUrl}`,
    ]
      .filter(Boolean)
      .join("\n");
  }
  return [
    "I read text from your resume (your profile was not changed automatically).",
    skillLine ? `Skills spotted: ${skillLine}` : "No clear skills list was found.",
    missing ? `Please confirm: ${missing}` : "",
    input.truncated ? "(File was long — only part was read.)" : "",
    `Complete your profile: ${input.profileUrl}`,
  ]
    .filter(Boolean)
    .join("\n");
}
