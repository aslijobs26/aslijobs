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
    return "ఫైల్ చదవలేకపోయాను (స్కాన్/ఖాళీ కావచ్చు). క్లియర్ PDF/DOCX లేదా టెక్స్ట్ పంపండి.";
  }
  if (language === "hi") {
    return "फ़ाइल पढ़ नहीं पाए (स्कैन/खाली हो सकती है). साफ़ PDF/DOCX या टेक्स्ट भेजें.";
  }
  if (language === "ta") {
    return "கோப்பைப் படிக்க முடியவில்லை. தெளிவான PDF/DOCX அல்லது உரை அனுப்புங்கள்.";
  }
  if (language === "kn") {
    return "ಫೈಲ್ ಓದಲಾಗಲಿಲ್ಲ. ಸ್ಪಷ್ಟ PDF/DOCX ಅಥವಾ ಪಠ್ಯ ಕಳುಹಿಸಿ.";
  }
  if (language === "ml") {
    return "ഫയൽ വായിക്കാനായില്ല. വ്യക്തമായ PDF/DOCX അല്ലെങ്കിൽ ടെക്സ്റ്റ് അയയ്ക്കുക.";
  }
  return "I couldn't read that file (it may be scanned or empty). Please send a clearer PDF/DOCX or type the text.";
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

export function mediaProgressCopy(
  language: BotLanguage,
  kind: "image" | "document" | "audio",
): string {
  if (kind === "audio") {
    if (language === "te") return "వాయిస్ మెసేజ్ అందింది. విని అర్థం చేసుకుంటున్నాను…";
    if (language === "hi") return "वॉइस मैसेज मिल गया. सुनकर समझ रहा हूँ…";
    return "Got your voice message. Listening now…";
  }
  if (kind === "image") {
    if (language === "te") return "చిత్రం అందింది. టెక్స్ట్ చదువుతున్నాను…";
    if (language === "hi") return "इमेज मिल गई. टेक्स्ट पढ़ रहा हूँ…";
    if (language === "ta") return "படம் கிடைத்தது. உரையைப் படிக்கிறேன்…";
    if (language === "kn") return "ಚಿತ್ರ ಸಿಕ್ಕಿದೆ. ಪಠ್ಯ ಓದುತ್ತಿದ್ದೇನೆ…";
    if (language === "ml") return "ചിത്രം ലഭിച്ചു. ടെക്സ്റ്റ് വായിക്കുന്നു…";
    return "I've received your image. Reading the text now…";
  }
  if (language === "te") return "మీ డాక్యుమెంట్ అందింది. చదువుతున్నాను — కొద్ది సేపు పట్టవచ్చు.";
  if (language === "hi") return "दस्तावेज़ मिल गया. पढ़ रहा हूँ — इसमें कुछ पल लग सकते हैं.";
  if (language === "ta") return "உங்கள் ஆவணம் கிடைத்தது. படிக்கிறேன் — சிறிது நேரம் ஆகலாம்.";
  if (language === "kn") return "ನಿಮ್ಮ ಡಾಕ್ಯುಮೆಂಟ್ ಸಿಕ್ಕಿದೆ. ಓದುತ್ತಿದ್ದೇನೆ — ಸ್ವಲ್ಪ ಸಮಯ ಬೇಕಾಗಬಹುದು.";
  if (language === "ml") return "നിങ്ങളുടെ ഡോക്യുമെന്റ് ലഭിച്ചു. വായിക്കുന്നു — കുറച്ച് സമയം എടുത്തേക്കാം.";
  return "Your document has been received. I'm reading it now — this may take a few moments.";
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
      "జాబ్ వివరాలు చదివాను (స్క్రీన్‌షాట్ టెక్స్ట్ మాత్రమే — AsliJobs ఖాళీ కాదు).",
      skillLine ? `గుర్తించిన స్కిల్స్: ${skillLine}` : "",
      "మీకు సరిపోయే జాబ్‌లు కావాలా? రోల్ లేదా ఏరియా చెప్పండి.",
    ]
      .filter(Boolean)
      .join("\n");
  }
  if (input.language === "hi") {
    return [
      "जॉब विवरण पढ़ा (केवल स्क्रीनशॉट — AsliJobs वैकेंसी नहीं).",
      skillLine ? `मिले कौशल: ${skillLine}` : "",
      "मैचिंग जॉब चाहिए? भूमिका या इलाका बताएं.",
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

/**
 * Natural resume follow-up. Does not push profile completion as the only next step.
 * Never claims the profile was updated.
 */
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
  if (input.language === "te") {
    return [
      "మీ రెజ్యూమ్ అందింది, చదివాను. ప్రొఫైల్ ఆటోమేటిక్‌గా మారలేదు.",
      skillLine ? `కనిపించిన స్కిల్స్: ${skillLine}` : "స్పష్టమైన స్కిల్స్ జాబితా కనపడలేదు.",
      input.truncated ? "ఫైల్ పొడవుగా ఉంది — కొంత భాగం మాత్రమే చదివాను." : "",
      "తర్వాత ఏం చేయాలి?",
      "1. రెజ్యూమ్‌కు సరిపోయే జాబ్‌లు చూపించు",
      "2. నేను చెప్పే రోల్ కోసం సెర్చ్ చేయి (ఉదా: Electrician Hyderabad)",
      "3. రెజ్యూమ్ లేకుండా జాబ్‌లు చూపించు",
    ]
      .filter(Boolean)
      .join("\n");
  }
  if (input.language === "hi") {
    return [
      "आपका रिज़्यूमे मिल गया और पढ़ लिया. प्रोफ़ाइल अपने-आप नहीं बदली.",
      skillLine ? `मिले कौशल: ${skillLine}` : "स्पष्ट कौशल सूची नहीं मिली.",
      "आगे क्या करना है?",
      "1. रिज़्यूमे के अनुसार जॉब दिखाओ",
      "2. मैं जो भूमिका बताऊँ उसके लिए खोजो (जैसे Electrician Hyderabad)",
      "3. बिना रिज़्यूमे जॉब दिखाओ",
    ]
      .filter(Boolean)
      .join("\n");
  }
  return [
    "Your resume has been received and scanned.",
    "Your profile was not changed automatically.",
    skillLine
      ? `Skills I could spot: ${skillLine}`
      : "I could not spot a clear skills list from the text.",
    input.truncated ? "The file was long, so only part of it was read." : "",
    "What would you like to do next?",
    "1. Find jobs matching my resume",
    "2. Search for a specific job (e.g. Electrician in Hyderabad)",
    "3. Browse jobs without using the resume",
  ]
    .filter(Boolean)
    .join("\n");
}
