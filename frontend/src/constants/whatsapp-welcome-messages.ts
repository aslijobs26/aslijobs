import { WHATSAPP_CONTACT_URL, WHATSAPP_JOIN_URL } from "@/constants/cta";
import {
  normalizeSiteLanguageCode,
  type SiteLanguageCode,
} from "@/constants/site-language";

export type WhatsAppWelcomeRole = "seeker" | "employer";

export type WhatsAppFabActionId =
  | "find_job"
  | "hire_staff"
  | "find_jobs"
  | "profile_jobs"
  | "application_status"
  | "seeker_help"
  | "post_job"
  | "my_jobs"
  | "employer_applications"
  | "employer_help";

export type WhatsAppFabActionAudience = "guest" | "jobseeker" | "employer";

const MESSAGES_FIND_JOB: Record<SiteLanguageCode, string> = {
  en: "Hi AsliJobs! I am looking for a job. Please help me find suitable jobs.",
  te: "నమస్కారం AsliJobs! నాకు ఉద్యోగం కావాలి. సరైన ఉద్యోగాలను కనుగొనడంలో సహాయం చేయండి.",
  hi: "नमस्ते AsliJobs! मुझे नौकरी ढूंढनी है। कृपया मुझे सही नौकरी खोजने में मदद करें।",
  ta: "வணக்கம் AsliJobs! எனக்கு வேலை தேவை. பொருத்தமான வேலையைக் கண்டறிய உதவுங்கள்.",
  kn: "ನಮಸ್ಕಾರ AsliJobs! ನನಗೆ ಉದ್ಯೋಗ ಬೇಕು. ಸೂಕ್ತವಾದ ಉದ್ಯೋಗವನ್ನು ಹುಡುಕಲು ಸಹಾಯ ಮಾಡಿ.",
  ml: "നമസ്കാരം AsliJobs! എനിക്ക് ജോലി വേണം. അനുയോജ്യമായ ജോലി കണ്ടെത്താൻ സഹായിക്കൂ.",
};
const MESSAGES_HIRE_STAFF: Record<SiteLanguageCode, string> = {
  en: "Hi AsliJobs! I want to hire staff for my business. Please help me with recruitment.",
  te: "నమస్కారం AsliJobs! మా వ్యాపారం కోసం సిబ్బందిని నియమించుకోవాలి. రిక్రూట్‌మెంట్‌లో సహాయం చేయండి.",
  hi: "नमस्ते AsliJobs! मुझे अपने व्यवसाय के लिए कर्मचारी चाहिए। कृपया भर्ती करने में मेरी मदद करें।",
  ta: "வணக்கம் AsliJobs! என் நிறுவனத்திற்கு ஊழியர்கள் தேவை. ஆட்களைத் தேர்வு செய்ய உதவுங்கள்.",
  kn: "ನಮಸ್ಕಾರ AsliJobs! ನನ್ನ ವ್ಯವಹಾರಕ್ಕೆ ಸಿಬ್ಬಂದಿ ಬೇಕು. ನೇಮಕಾತಿಯಲ್ಲಿ ಸಹಾಯ ಮಾಡಿ.",
  ml: "നമസ്കാരം AsliJobs! എന്റെ സ്ഥാപനത്തിലേക്ക് ജീവനക്കാരെ നിയമിക്കണം. നിയമനത്തിൽ സഹായിക്കൂ.",
};
const MESSAGES_FIND_JOBS: Record<SiteLanguageCode, string> = {
  en: "Hi AsliJobs! I am looking for a job. Please help me find suitable jobs.",
  te: "నమస్కారం AsliJobs! నాకు ఉద్యోగం కావాలి. సరైన ఉద్యోగాలను కనుగొనడంలో సహాయం చేయండి.",
  hi: "नमस्ते AsliJobs! मुझे नौकरी ढूंढनी है। कृपया मुझे सही नौकरी खोजने में मदद करें।",
  ta: "வணக்கம் AsliJobs! எனக்கு வேலை தேவை. பொருத்தமான வேலையைக் கண்டறிய உதவுங்கள்.",
  kn: "ನಮಸ್ಕಾರ AsliJobs! ನನಗೆ ಉದ್ಯೋಗ ಬೇಕು. ಸೂಕ್ತವಾದ ಉದ್ಯೋಗವನ್ನು ಹುಡುಕಲು ಸಹಾಯ ಮಾಡಿ.",
  ml: "നമസ്കാരം AsliJobs! എനിക്ക് ജോലി വേണം. അനുയോജ്യമായ ജോലി കണ്ടെത്താൻ സഹായിക്കൂ.",
};
const MESSAGES_PROFILE_JOBS: Record<SiteLanguageCode, string> = {
  en: "Hi AsliJobs! Please recommend suitable jobs based on my profile.",
  te: "నమస్కారం AsliJobs! నా profile కి సరిపోయే jobs సిఫార్సు చేయండి.",
  hi: "नमस्ते AsliJobs! कृपया मेरे profile के आधार पर suitable jobs सुझाएं।",
  ta: "வணக்கம் AsliJobs! என் profile அடிய்ய suitable jobs பரிந்துரைக்கவும்.",
  kn: "ನಮಸ್ಕಾರ AsliJobs! ನನ್ನ profile ಆಧಾರಿತ suitable jobs ಶಿಫಾರಸು ಮಾಡಿ.",
  ml: "നമസ്കാരം AsliJobs! എന്റെ profile അടിസ്ഥിച്ച് suitable jobs ശിപാര്ശ് ചെയ്യൂ.",
};
const MESSAGES_APPLICATION_STATUS: Record<SiteLanguageCode, string> = {
  en: "Hi AsliJobs! I want to check the status of my applications.",
  te: "నమస్కారం AsliJobs! నా applications status చూడాలి.",
  hi: "नमस्ते AsliJobs! मैं अपने applications की status जाँचना चाहता/चाहती हूँ।",
  ta: "வணக்கம் AsliJobs! என் applications status-ஐப் பார்க்க விரும்புகிறேன்.",
  kn: "ನಮಸ್ಕಾರ AsliJobs! ನನ್ನ applications status ಪರಿಶಿಸಬೇಕು.",
  ml: "നമസ്കാരം AsliJobs! എന്റെ applications status പരിശോധിക്കണം.",
};
const MESSAGES_SEEKER_HELP: Record<SiteLanguageCode, string> = {
  en: "Hi AsliJobs! What can you do? Please help me with my account.",
  te: "నమస్కారం AsliJobs! What can you do? దయచేసి నా account కి సహాయం చేయండి.",
  hi: "नमस्ते AsliJobs! What can you do? कृपया मेरे account में मदद करें।",
  ta: "வணக்கம் AsliJobs! What can you do? என் account-க்கு உதவவும்.",
  kn: "ನಮಸ್ಕಾರ AsliJobs! What can you do? ದಯವಿಟ್ಟು ನನ್ನ accountಗೆ ಸಹಾಯ ಮಾಡಿ.",
  ml: "നമസ്കാരം AsliJobs! What can you do? എന്റെ account-ില് സഹായിക്കൂ.",
};
const MESSAGES_POST_JOB: Record<SiteLanguageCode, string> = {
  en: "Hi AsliJobs! I want to post a job and hire suitable candidates.",
  te: "నమస్కారం AsliJobs! నేను job post చేసి suitable candidates hire చేయాలి.",
  hi: "नमस्ते AsliJobs! मैं job post करके suitable candidates hire करना चाहता/चाहती हूँ।",
  ta: "வணக்கம் AsliJobs! நான் job post செய்து suitable candidates-ஐ hire செய்ய விரும்புகிறேன்.",
  kn: "ನಮಸ್ಕಾರ AsliJobs! ನಾನು job post ಮಾಡಿ suitable candidates hire ಮಾಡಬೇಕು.",
  ml: "നമസ്കാരം AsliJobs! ഞാൻ job post ചെയ്തു suitable candidates hire ചെയ്യണം.",
};
const MESSAGES_MY_JOBS: Record<SiteLanguageCode, string> = {
  en: "Hi AsliJobs! I want to check my posted jobs.",
  te: "నమస్కారం AsliJobs! నా posted jobs / my jobs చూడాలి.",
  hi: "नमस्ते AsliJobs! मैं अपनी posted jobs / my jobs जाँचना चाहता/चाहती हूँ।",
  ta: "வணக்கம் AsliJobs! என் posted jobs / my jobs-ஐப் பார்க்க விரும்புகிறேன்.",
  kn: "ನಮಸ್ಕಾರ AsliJobs! ನನ್ನ posted jobs / my jobs ಪರಿಶಿಸಬೇಕು.",
  ml: "നമസ്കാരം AsliJobs! എന്റെ posted jobs / my jobs പരിശോധിക്കണം.",
};
const MESSAGES_EMPLOYER_APPLICATIONS: Record<SiteLanguageCode, string> = {
  en: "Hi AsliJobs! How many applications did I get for my jobs?",
  te: "నమస్కారం AsliJobs! నా jobs కి how many applications వచ్చాయి?",
  hi: "नमस्ते AsliJobs! मेरे my jobs पर how many applications आए?",
  ta: "வணக்கம் AsliJobs! என் my jobs-க்கு how many applications வந்து?",
  kn: "ನಮಸ್ಕಾರ AsliJobs! ನನ್ನ my jobs ಗೆ how many applications ಬಂದಿವೆ?",
  ml: "നമസ്കാരം AsliJobs! എന്റെ my jobs-നു how many applications ലഭിച്ചു?",
};
const MESSAGES_EMPLOYER_HELP: Record<SiteLanguageCode, string> = {
  en: "Hi AsliJobs! What can you do? Please help me with my account.",
  te: "నమస్కారం AsliJobs! What can you do? దయచేసి నా account కి సహాయం చేయండి.",
  hi: "नमस्ते AsliJobs! What can you do? कृपया मेरे account में मदद करें।",
  ta: "வணக்கம் AsliJobs! What can you do? என் account-க்கு உதவவும்.",
  kn: "ನಮಸ್ಕಾರ AsliJobs! What can you do? ದಯವಿಟ್ಟು ನನ್ನ accountಗೆ ಸಹಾಯ ಮಾಡಿ.",
  ml: "നമസ്കാരം AsliJobs! What can you do? എന്റെ account-ില് സഹായിക്കൂ.",
};

const ACTION_MESSAGE_MAP: Record<WhatsAppFabActionId, Record<SiteLanguageCode, string>> = {
  find_job: MESSAGES_FIND_JOB,
  hire_staff: MESSAGES_HIRE_STAFF,
  find_jobs: MESSAGES_FIND_JOBS,
  profile_jobs: MESSAGES_PROFILE_JOBS,
  application_status: MESSAGES_APPLICATION_STATUS,
  seeker_help: MESSAGES_SEEKER_HELP,
  post_job: MESSAGES_POST_JOB,
  my_jobs: MESSAGES_MY_JOBS,
  employer_applications: MESSAGES_EMPLOYER_APPLICATIONS,
  employer_help: MESSAGES_EMPLOYER_HELP,
};

export const WHATSAPP_FAB_ACTION_DEFINITIONS = [
  { id: "find_job" as const, audiences: ["guest"] as const, intent: "JOB_SEARCH" as const, icon: "search" as const },
  { id: "hire_staff" as const, audiences: ["guest"] as const, intent: "POST_JOB" as const, icon: "briefcase" as const },
  { id: "find_jobs" as const, audiences: ["jobseeker"] as const, intent: "JOB_SEARCH" as const, icon: "search" as const },
  { id: "profile_jobs" as const, audiences: ["jobseeker"] as const, intent: "PROFILE_JOBS" as const, icon: "sparkles" as const },
  { id: "application_status" as const, audiences: ["jobseeker"] as const, intent: "APPLICATION_STATUS" as const, icon: "clipboard" as const },
  { id: "seeker_help" as const, audiences: ["jobseeker"] as const, intent: "HELP" as const, icon: "help" as const },
  { id: "post_job" as const, audiences: ["employer"] as const, intent: "POST_JOB" as const, icon: "briefcase" as const },
  { id: "my_jobs" as const, audiences: ["employer"] as const, intent: "EMPLOYER_JOBS" as const, icon: "building" as const },
  { id: "employer_applications" as const, audiences: ["employer"] as const, intent: "EMPLOYER_APPLICATION_COUNT" as const, icon: "users" as const },
  { id: "employer_help" as const, audiences: ["employer"] as const, intent: "HELP" as const, icon: "help" as const },
] as const;

export type WhatsAppFabActionDefinition =
  (typeof WHATSAPP_FAB_ACTION_DEFINITIONS)[number];

export function listWhatsAppFabActionIds(
  audience: WhatsAppFabActionAudience,
): WhatsAppFabActionId[] {
  return WHATSAPP_FAB_ACTION_DEFINITIONS.filter((action) =>
    (action.audiences as readonly WhatsAppFabActionAudience[]).includes(audience),
  ).map((action) => action.id);
}

export function getWhatsAppFabActionDefinition(
  actionId: WhatsAppFabActionId,
): WhatsAppFabActionDefinition {
  const found = WHATSAPP_FAB_ACTION_DEFINITIONS.find((action) => action.id === actionId);
  if (!found) {
    throw new Error(`Unknown WhatsApp FAB action: ${actionId}`);
  }
  return found;
}

/** Digits-only business number from the configured public wa.me link. */
export function getWhatsAppBusinessPhoneDigits(): string {
  const candidates = [WHATSAPP_CONTACT_URL, WHATSAPP_JOIN_URL];
  for (const candidate of candidates) {
    const match = candidate.match(/wa\.me\/(\d{10,15})/i);
    if (match?.[1]) {
      return match[1];
    }
  }
  return "";
}

export function getWhatsAppActionMessage(
  actionId: WhatsAppFabActionId,
  language: string | null | undefined,
): string {
  const code = normalizeSiteLanguageCode(language);
  return ACTION_MESSAGE_MAP[actionId][code];
}

export function buildWhatsAppActionUrl(
  actionId: WhatsAppFabActionId,
  language: string | null | undefined,
): string {
  const phone = getWhatsAppBusinessPhoneDigits();
  const message = getWhatsAppActionMessage(actionId, language);
  if (!phone) {
    return WHATSAPP_CONTACT_URL;
  }
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function getWhatsAppWelcomeMessage(
  role: WhatsAppWelcomeRole,
  language: string | null | undefined,
): string {
  return getWhatsAppActionMessage(role === "employer" ? "hire_staff" : "find_job", language);
}

export function buildWhatsAppWelcomeUrl(
  role: WhatsAppWelcomeRole,
  language: string | null | undefined,
): string {
  return buildWhatsAppActionUrl(role === "employer" ? "hire_staff" : "find_job", language);
}

export const WHATSAPP_WELCOME_SEEKER_MESSAGES = MESSAGES_FIND_JOB;
export const WHATSAPP_WELCOME_EMPLOYER_MESSAGES = MESSAGES_HIRE_STAFF;
export const WHATSAPP_FAB_ACTION_MESSAGES = ACTION_MESSAGE_MAP;
