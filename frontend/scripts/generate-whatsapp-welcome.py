# -*- coding: utf-8 -*-
"""Generate WhatsApp FAB message constants and i18n bundle."""
from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path

from whatsapp_fab_action_ui import ACTION_UI_OVERLAY
from whatsapp_fab_data import ACTION_MESSAGES, ACTION_META

ROOT = Path(__file__).resolve().parents[1]
LANGS = ("en", "te", "hi", "ta", "kn", "ml")


def js(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def write_messages() -> None:
    maps = []
    for action_id, mapping in ACTION_MESSAGES.items():
        lines = [f"const MESSAGES_{action_id.upper()}: Record<SiteLanguageCode, string> = {{"]
        for lang in LANGS:
            lines.append(f"  {lang}: {js(mapping[lang])},")
        lines.append("};")
        maps.append("\n".join(lines))

    meta = ["export const WHATSAPP_FAB_ACTION_DEFINITIONS = ["]
    for action_id, audiences, intent, icon in ACTION_META:
        aud = ", ".join(f'"{a}"' for a in audiences)
        meta.append(
            f'  {{ id: "{action_id}" as const, audiences: [{aud}] as const, '
            f'intent: "{intent}" as const, icon: "{icon}" as const }},'
        )
    meta.append("] as const;")

    content = f"""import {{ WHATSAPP_CONTACT_URL, WHATSAPP_JOIN_URL }} from "@/constants/cta";
import {{
  normalizeSiteLanguageCode,
  type SiteLanguageCode,
}} from "@/constants/site-language";

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

{chr(10).join(maps)}

const ACTION_MESSAGE_MAP: Record<WhatsAppFabActionId, Record<SiteLanguageCode, string>> = {{
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
}};

{chr(10).join(meta)}

export type WhatsAppFabActionDefinition =
  (typeof WHATSAPP_FAB_ACTION_DEFINITIONS)[number];

export function listWhatsAppFabActionIds(
  audience: WhatsAppFabActionAudience,
): WhatsAppFabActionId[] {{
  return WHATSAPP_FAB_ACTION_DEFINITIONS.filter((action) =>
    (action.audiences as readonly WhatsAppFabActionAudience[]).includes(audience),
  ).map((action) => action.id);
}}

export function getWhatsAppFabActionDefinition(
  actionId: WhatsAppFabActionId,
): WhatsAppFabActionDefinition {{
  const found = WHATSAPP_FAB_ACTION_DEFINITIONS.find((action) => action.id === actionId);
  if (!found) {{
    throw new Error(`Unknown WhatsApp FAB action: ${{actionId}}`);
  }}
  return found;
}}

/** Digits-only business number from the configured public wa.me link. */
export function getWhatsAppBusinessPhoneDigits(): string {{
  const candidates = [WHATSAPP_CONTACT_URL, WHATSAPP_JOIN_URL];
  for (const candidate of candidates) {{
    const match = candidate.match(/wa\\.me\\/(\\d{{10,15}})/i);
    if (match?.[1]) {{
      return match[1];
    }}
  }}
  return "";
}}

export function getWhatsAppActionMessage(
  actionId: WhatsAppFabActionId,
  language: string | null | undefined,
): string {{
  const code = normalizeSiteLanguageCode(language);
  return ACTION_MESSAGE_MAP[actionId][code];
}}

export function buildWhatsAppActionUrl(
  actionId: WhatsAppFabActionId,
  language: string | null | undefined,
): string {{
  const phone = getWhatsAppBusinessPhoneDigits();
  const message = getWhatsAppActionMessage(actionId, language);
  if (!phone) {{
    return WHATSAPP_CONTACT_URL;
  }}
  return `https://wa.me/${{phone}}?text=${{encodeURIComponent(message)}}`;
}}

export function getWhatsAppWelcomeMessage(
  role: WhatsAppWelcomeRole,
  language: string | null | undefined,
): string {{
  return getWhatsAppActionMessage(role === "employer" ? "hire_staff" : "find_job", language);
}}

export function buildWhatsAppWelcomeUrl(
  role: WhatsAppWelcomeRole,
  language: string | null | undefined,
): string {{
  return buildWhatsAppActionUrl(role === "employer" ? "hire_staff" : "find_job", language);
}}

export const WHATSAPP_WELCOME_SEEKER_MESSAGES = MESSAGES_FIND_JOB;
export const WHATSAPP_WELCOME_EMPLOYER_MESSAGES = MESSAGES_HIRE_STAFF;
export const WHATSAPP_FAB_ACTION_MESSAGES = ACTION_MESSAGE_MAP;
"""
    path = ROOT / "src/constants/whatsapp-welcome-messages.ts"
    path.write_text(content, encoding="utf-8")
    print("wrote", path)


EN_ACTIONS = {
    "find_job": ("Find a Job", "Explore jobs that match your skills.", "Open WhatsApp to find a job"),
    "hire_staff": ("Hire Staff", "Find suitable candidates for your business.", "Open WhatsApp to hire staff"),
    "find_jobs": ("Find Jobs", "Search jobs that match what you need.", "Open WhatsApp to find jobs"),
    "profile_jobs": ("Job Recommendations", "Get jobs suggested from your profile.", "Open WhatsApp for job recommendations"),
    "application_status": ("Application Status", "Check the status of your applications.", "Open WhatsApp to check application status"),
    "seeker_help": ("Talk to Support", "Get help with your Job Seeker account.", "Open WhatsApp for Job Seeker support"),
    "post_job": ("Post a Job", "Post a role and start hiring.", "Open WhatsApp to post a job"),
    "my_jobs": ("My Job Posts", "Review the jobs you have posted.", "Open WhatsApp to check your job posts"),
    "employer_applications": ("Applications Received", "See how many applications your jobs received.", "Open WhatsApp to check applications on your jobs"),
    "employer_help": ("Talk to Support", "Get help with your Employer account.", "Open WhatsApp for Employer support"),
}

SHELL = {
    "en": {
        "openAria": "Chat with AsliJobs on WhatsApp",
        "openTitle": "Chat with AsliJobs on WhatsApp",
        "closeAria": "Close WhatsApp options",
        "title": "How can we help you?",
        "subtitle": "Choose an option to continue on WhatsApp.",
        "loadingTitle": "Checking your account…",
        "loadingSubtitle": "Please wait a moment.",
        "unknownTitle": "We could not verify your account",
        "unknownSubtitle": "Try again, or continue from your account page.",
        "retryLabel": "Try again",
    },
    "hi": {
        "openAria": "AsliJobs \u0938\u0947 WhatsApp \u092a\u0930 \u091a\u0948\u091f \u0915\u0930\u0947\u0902",
        "openTitle": "AsliJobs \u0938\u0947 WhatsApp \u092a\u0930 \u091a\u0948\u091f \u0915\u0930\u0947\u0902",
        "closeAria": "WhatsApp \u0935\u093f\u0915\u0932\u094d\u092a \u092c\u0902\u0926 \u0915\u0930\u0947\u0902",
        "title": "\u0939\u092e \u0906\u092a\u0915\u0940 \u0915\u0948\u0938\u0947 \u092e\u0926\u0926 \u0915\u0930 \u0938\u0915\u0924\u0947 \u0939\u0948\u0902?",
        "subtitle": "WhatsApp \u092a\u0930 \u091c\u093e\u0930\u0940 \u0930\u0916\u0928\u0947 \u0915\u0947 \u0932\u093f\u090f \u090f\u0915 \u0935\u093f\u0915\u0932\u094d\u092a \u091a\u0941\u0928\u0947\u0902\u0964",
        "loadingTitle": "\u0906\u092a\u0915\u093e \u0916\u093e\u0924\u093e \u091c\u093e\u0901\u091a \u0930\u0939\u0947 \u0939\u0948\u0902\u2026",
        "loadingSubtitle": "\u0915\u0943\u092a\u092f\u093e \u0925\u094b\u0921\u093c\u093e \u092a\u094d\u0930\u0924\u0940\u0915\u094d\u0937\u093e \u0915\u0930\u0947\u0902\u0964",
        "unknownTitle": "\u0939\u092e \u0906\u092a\u0915\u093e \u0916\u093e\u0924\u093e \u0938\u0924\u094d\u092f\u093e\u092a\u093f\u0924 \u0928\u0939\u0940\u0902 \u0915\u0930 \u0938\u0915\u0947",
        "unknownSubtitle": "\u092b\u093f\u0930 \u0915\u094b\u0936\u093f\u0936 \u0915\u0930\u0947\u0902, \u092f\u093e \u0905\u092a\u0928\u0947 \u0916\u093e\u0924\u093e \u092a\u0943\u0937\u094d\u0920 \u0938\u0947 \u091c\u093e\u0930\u0940 \u0930\u0916\u0947\u0902\u0964",
        "retryLabel": "\u092b\u093f\u0930 \u0915\u094b\u0936\u093f\u0936 \u0915\u0930\u0947\u0902",
    },
    "te": {
        "openAria": "AsliJobs\u0c24\u0c4b WhatsApp\u0c32\u0c4b \u0c1a\u0c3e\u0c1f\u0c4d \u0c1a\u0c47\u0c2f\u0c02\u0c21\u0c3f",
        "openTitle": "AsliJobs\u0c24\u0c4b WhatsApp\u0c32\u0c4b \u0c1a\u0c3e\u0c1f\u0c4d \u0c1a\u0c47\u0c2f\u0c02\u0c21\u0c3f",
        "closeAria": "WhatsApp \u0c0e\u0c02\u0c2a\u0c3f\u0c15\u0c32\u0c28\u0c41 \u0c2e\u0c42\u0c38\u0c3f\u0c35\u0c47\u0c2f\u0c02\u0c21\u0c3f",
        "title": "\u0c2e\u0c47\u0c2e\u0c41 \u0c2e\u0c40\u0c15\u0c41 \u0c0e\u0c32\u0c3e \u0c38\u0c39\u0c3e\u0c2f\u0c02 \u0c1a\u0c47\u0c2f\u0c17\u0c32\u0c02?",
        "subtitle": "WhatsApp\u0c32\u0c4b \u0c15\u0c4a\u0c28\u0c38\u0c3e\u0c17\u0c3f\u0c02\u0c1a\u0c21\u0c3e\u0c28\u0c3f\u0c15\u0c3f \u0c12\u0c15 \u0c0e\u0c02\u0c2a\u0c3f\u0c15\u0c28\u0c41 \u0c0e\u0c02\u0c1a\u0c41\u0c15\u0c4b\u0c02\u0c21\u0c3f.",
        "loadingTitle": "\u0c2e\u0c40 \u0c16\u0c3e\u0c24\u0c3e\u0c28\u0c41 \u0c1a\u0c42\u0c38\u0c4d\u0c24\u0c41\u0c28\u0c4d\u0c28\u0c3e\u0c2e\u2026",
        "loadingSubtitle": "\u0c26\u0c2f\u0c1a\u0c47\u0c38\u0c3f \u0c15\u0c4a\u0c26\u0c4d\u0c26\u0c3f \u0c28\u0c3f\u0c32\u0c41\u0c2a\u0c02\u0c21\u0c3f.",
        "unknownTitle": "\u0c2e\u0c40 \u0c16\u0c3e\u0c24\u0c3e\u0c28\u0c41 \u0c28\u0c3f\u0c30\u0c4d\u0c27\u0c3e\u0c30\u0c3f\u0c02\u0c1a\u0c32\u0c47\u0c26\u0c41",
        "unknownSubtitle": "\u0c2e\u0c33\u0c4d\u0c32\u0c40 \u0c2a\u0c4d\u0c30\u0c2f\u0c24\u0c4d\u0c28 \u0c1a\u0c47\u0c2f\u0c02\u0c21\u0c3f, \u0c32\u0c47\u0c26\u0c3e \u0c16\u0c3e\u0c24\u0c3e \u0c2a\u0c47\u0c1c\u0c40 \u0c28\u0c41\u0c02\u0c21\u0c3f \u0c15\u0c4a\u0c28\u0c38\u0c3e\u0c02\u0c21\u0c3f.",
        "retryLabel": "\u0c2e\u0c33\u0c4d\u0c32\u0c40 \u0c2a\u0c4d\u0c30\u0c2f\u0c24\u0c4d\u0c28",
    },
    "ta": {
        "openAria": "AsliJobs \u0b89\u0b9f\u0ba9\u0bcd WhatsApp-\u0b87\u0bb2\u0bcd \u0b85\u0bb0\u0b9f\u0bcd\u0b9f\u0bc8\u0baf\u0b9f\u0bbf\u0b95\u0bcd\u0b95\u0bb5\u0bc1\u0bae\u0bcd",
        "openTitle": "AsliJobs \u0b89\u0b9f\u0ba9\u0bcd WhatsApp-\u0b87\u0bb2\u0bcd \u0b85\u0bb0\u0b9f\u0bcd\u0b9f\u0bc8\u0baf\u0b9f\u0bbf\u0b95\u0bcd\u0b95\u0bb5\u0bc1\u0bae\u0bcd",
        "closeAria": "WhatsApp \u0bb5\u0bbf\u0bb0\u0bc1\u0baa\u0bcd\u0baa\u0b99\u0bcd\u0b95\u0bb3\u0bc8 \u0bae\u0bc2\u0b9f\u0bc1",
        "title": "\u0ba8\u0bbe\u0b99\u0bcd\u0b95\u0bb3\u0bcd \u0b89\u0b99\u0bcd\u0b95\u0bb3\u0bc1\u0b95\u0bcd\u0b95\u0bc1 \u0b8e\u0baa\u0bcd\u0baa\u0b9f\u0bbf \u0b89\u0ba4\u0bb5\u0bb2\u0bbe\u0bae\u0bcd?",
        "subtitle": "WhatsApp-\u0b87\u0bb2\u0bcd \u0ba4\u0bca\u0b9f\u0bb0 \u0b92\u0bb0\u0bc1 \u0bb5\u0bbf\u0bb0\u0bc1\u0baa\u0bcd\u0baa\u0ba4\u0bcd\u0ba4\u0bc8\u0ba4\u0bcd \u0ba4\u0bc7\u0bb0\u0bcd\u0ba8\u0bcd\u0ba4\u0bc6\u0b9f\u0bc1\u0b95\u0bcd\u0b95\u0bb5\u0bc1\u0bae\u0bcd.",
        "loadingTitle": "\u0b89\u0b99\u0bcd\u0b95\u0bb3\u0bcd \u0b95\u0ba3\u0b95\u0bcd\u0b95\u0bc1 \u0b9a\u0bb0\u0bbf\u0baa\u0bbe\u0bb0\u0bcd\u0b95\u0bcd\u0b95\u0baa\u0bcd\u0baa\u0b9f\u0bc1\u0b95\u0bbf\u0bb1\u0ba4\u0bc1\u2026",
        "loadingSubtitle": "\u0b9a\u0bbf\u0bb1\u0bbf\u0ba4\u0bc1 \u0b95\u0bbe\u0ba4\u0bcd\u0ba4\u0bbf\u0bb0\u0bc1\u0b99\u0bcd\u0b95\u0bb3\u0bcd.",
        "unknownTitle": "\u0b89\u0b99\u0bcd\u0b95\u0bb3\u0bcd \u0b95\u0ba3\u0b95\u0bcd\u0b95\u0bc8 \u0b89\u0bb1\u0bc1\u0ba4\u0bbf\u0b9a\u0bc6\u0baf\u0bcd\u0baf \u0bae\u0bc1\u0b9f\u0bbf\u0baf\u0bb5\u0bbf\u0bb2\u0bcd\u0bb2\u0bc8",
        "unknownSubtitle": "\u0bae\u0bc0\u0ba3\u0bcd\u0b9f\u0bc1\u0bae\u0bcd \u0bae\u0bc1\u0baf\u0bb1\u0bcd\u0b9a\u0bbf\u0b95\u0bcd\u0b95\u0bb5\u0bc1\u0bae\u0bcd.",
        "retryLabel": "\u0bae\u0bc0\u0ba3\u0bcd\u0b9f\u0bc1\u0bae\u0bcd \u0bae\u0bc1\u0baf\u0bb1\u0bcd\u0b9a\u0bbf",
    },
    "kn": {
        "openAria": "AsliJobs \u0c9c\u0cca\u0ca4\u0cc6 WhatsApp\u0ca8\u0cb2\u0ccd\u0cb2\u0cbf \u0c9a\u0cbe\u0c9f\u0ccd \u0cae\u0cbe\u0ca1\u0cbf",
        "openTitle": "AsliJobs \u0c9c\u0cca\u0ca4\u0cc6 WhatsApp\u0ca8\u0cb2\u0ccd\u0cb2\u0cbf \u0c9a\u0cbe\u0c9f\u0ccd \u0cae\u0cbe\u0ca1\u0cbf",
        "closeAria": "WhatsApp \u0c86\u0caf\u0ccd\u0c95\u0cc6\u0c97\u0cb3\u0ca8\u0ccd\u0ca8\u0cc1 \u0cae\u0cc1\u0c9a\u0ccd\u0c9a\u0cbf",
        "title": "\u0ca8\u0cbe\u0cb5\u0cc1 \u0ca8\u0cbf\u0cae\u0c97\u0cc6 \u0cb9\u0cc7\u0c97\u0cc6 \u0cb8\u0cb9\u0cbe\u0caf \u0cae\u0cbe\u0ca1\u0cac\u0cb9\u0cc1\u0ca6\u0cc1?",
        "subtitle": "WhatsApp\u0ca8\u0cb2\u0ccd\u0cb2\u0cbf \u0cae\u0cc1\u0c82\u0ca6\u0cc1\u0cb5\u0cb0\u0cbf\u0cb8\u0cb2\u0cc1 \u0c92\u0c82\u0ca6\u0cc1 \u0c86\u0caf\u0ccd\u0c95\u0cc6\u0caf\u0ca8\u0ccd\u0ca8\u0cc1 \u0c86\u0cb0\u0cbf\u0cb8\u0cbf.",
        "loadingTitle": "\u0ca8\u0cbf\u0cae\u0ccd\u0cae \u0c96\u0cbe\u0ca4\u0cc6\u0caf\u0ca8\u0ccd\u0ca8\u0cc1 \u0caa\u0cb0\u0cbf\u0cb6\u0cbf\u0cb8\u0cb2\u0cbe\u0c97\u0cc1\u0ca4\u0ccd\u0ca4\u0cbf\u0ca6\u0cc6\u2026",
        "loadingSubtitle": "\u0ca6\u0caf\u0cb5\u0cbf\u0c9f\u0ccd\u0c9f\u0cc1 \u0c95\u0cbe\u0caf\u0cbf\u0cb0\u0cbf.",
        "unknownTitle": "\u0ca8\u0cbf\u0cae\u0ccd\u0cae \u0c96\u0cbe\u0ca4\u0cc6\u0caf\u0ca8\u0ccd\u0ca8\u0cc1 \u0ca6\u0cc3\u0ca2\u0cbf\u0c95\u0cb0\u0cbf\u0cb8\u0cb2\u0cbe\u0c97\u0cb2\u0cbf\u0cb2\u0ccd\u0cb2",
        "unknownSubtitle": "\u0cae\u0ca4\u0ccd\u0ca4\u0cc6 \u0caa\u0ccd\u0cb0\u0caf\u0ca4\u0ccd\u0ca8\u0cbf\u0cb8\u0cbf.",
        "retryLabel": "\u0cae\u0ca4\u0ccd\u0ca4\u0cc6 \u0caa\u0ccd\u0cb0\u0caf\u0ca4\u0ccd\u0ca8\u0cbf\u0cb8\u0cbf",
    },
    "ml": {
        "openAria": "AsliJobs-\u0d28\u0d4a\u0d2a\u0d4d\u0d2a\u0d02 WhatsApp-\u0d7d \u0d1a\u0d3e\u0d31\u0d4d\u0d31\u0d4d \u0d1a\u0d46\u0d2f\u0d4d\u0d2f\u0d41\u0d15",
        "openTitle": "AsliJobs-\u0d28\u0d4a\u0d2a\u0d4d\u0d2a\u0d02 WhatsApp-\u0d7d \u0d1a\u0d3e\u0d31\u0d4d\u0d31\u0d4d \u0d1a\u0d46\u0d2f\u0d4d\u0d2f\u0d41\u0d15",
        "closeAria": "WhatsApp \u0d13\u0d2a\u0d4d\u0d37\u0d28\u0d41\u0d15\u0d7e \u0d05\u0d1f\u0d2f\u0d4d\u0d15\u0d4d\u0d15\u0d41\u0d15",
        "title": "\u0d1e\u0d19\u0d4d\u0d19\u0d7e\u0d15\u0d4d\u0d15\u0d4d \u0d28\u0d3f\u0d19\u0d4d\u0d19\u0d33\u0d46 \u0d0e\u0d19\u0d4d\u0d19\u0d28\u0d46 \u0d38\u0d39\u0d3e\u0d2f\u0d3f\u0d15\u0d4d\u0d15\u0d3e\u0d28\u0d3e\u0d15\u0d41\u0d02?",
        "subtitle": "WhatsApp-\u0d7d \u0d24\u0d41\u0d1f\u0d30\u0d3e\u0d7b \u0d12\u0d30\u0d41 \u0d13\u0d2a\u0d4d\u0d37\u0d7b \u0d24\u0d3f\u0d30\u0d1e\u0d4d\u0d1e\u0d46\u0d1f\u0d41\u0d15\u0d4d\u0d15\u0d41\u0d15.",
        "loadingTitle": "\u0d28\u0d3f\u0d19\u0d4d\u0d19\u0d33\u0d41\u0d1f\u0d46 \u0d05\u0d15\u0d4d\u0d15\u0d57\u0d23\u0d4d\u0d1f\u0d4d \u0d2a\u0d30\u0d3f\u0d36\u0d4b\u0d27\u0d3f\u0d15\u0d4d\u0d15\u0d41\u0d28\u0d4d\u0d28\u0d41\u2026",
        "loadingSubtitle": "\u0d26\u0d2f\u0d35\u0d3e\u0d2f\u0d3f \u0d15\u0d3e\u0d24\u0d4d\u0d24\u0d3f\u0d30\u0d3f\u0d15\u0d4d\u0d15\u0d42.",
        "unknownTitle": "\u0d05\u0d15\u0d4d\u0d15\u0d57\u0d23\u0d4d\u0d1f\u0d4d \u0d32\u0d2d\u0d3f\u0d1a\u0d4d\u0d1a\u0d3e\u0d32\u0d3e\u0d2f\u0d3f\u0d32\u0d4d\u0d32",
        "unknownSubtitle": "\u0d35\u0d40\u0d23\u0d4d\u0d1f\u0d41\u0d02 \u0d36\u0d4d\u0d30\u0d2e\u0d3f\u0d15\u0d4d\u0d15\u0d42.",
        "retryLabel": "\u0d35\u0d40\u0d23\u0d4d\u0d1f\u0d41\u0d02 \u0d36\u0d4d\u0d30\u0d2e\u0d3f\u0d15\u0d4d\u0d15\u0d41\u0d15",
    },
}

def build_lang_catalog(lang: str) -> dict:
    shell = SHELL[lang]
    actions = {}
    for key, triple in EN_ACTIONS.items():
        overlay = ACTION_UI_OVERLAY.get(lang, {}).get(key)
        title, description, aria = overlay if overlay else triple
        actions[key] = {"title": title, "description": description, "aria": aria}
    return {**shell, "actions": actions}


def emit_actions(actions: dict) -> str:
    lines = ["    actions: {"]
    for key, value in actions.items():
        lines.append(f"      {key}: {{")
        lines.append(f"        title: {js(value['title'])},")
        lines.append(f"        description: {js(value['description'])},")
        lines.append(f"        aria: {js(value['aria'])},")
        lines.append("      },")
    lines.append("    },")
    return "\n".join(lines)


def write_fab() -> None:
    catalogs = {lang: build_lang_catalog(lang) for lang in LANGS}
    parts = [
        """type LocalizedShape<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : LocalizedShape<T[K]>;
};

const en = {
  whatsappFab: {"""
    ]
    en = catalogs["en"]
    for key in (
        "openAria",
        "openTitle",
        "closeAria",
        "title",
        "subtitle",
        "loadingTitle",
        "loadingSubtitle",
        "unknownTitle",
        "unknownSubtitle",
        "retryLabel",
    ):
        parts.append(f"    {key}: {js(en[key])},")
    parts.append(emit_actions(en["actions"]))
    parts.append(
        """  },
} as const;

type FabCatalog = LocalizedShape<typeof en>;
"""
    )
    for lang in ("hi", "te", "ta", "kn", "ml"):
        cat = catalogs[lang]
        parts.append(f"const {lang}: FabCatalog = {{")
        parts.append("  whatsappFab: {")
        for key in (
            "openAria",
            "openTitle",
            "closeAria",
            "title",
            "subtitle",
            "loadingTitle",
            "loadingSubtitle",
            "unknownTitle",
            "unknownSubtitle",
            "retryLabel",
        ):
            parts.append(f"    {key}: {js(cat[key])},")
        parts.append(emit_actions(cat["actions"]))
        parts.append("  },")
        parts.append("};")
        parts.append("")
    parts.append("export const whatsappFabBundle = { en, hi, te, ta, kn, ml } as const;\n")
    path = ROOT / "src/i18n/bundles/whatsapp-fab.ts"
    path.write_text("\n".join(parts), encoding="utf-8")
    print("wrote", path)


if __name__ == "__main__":
    write_messages()
    write_fab()
    print("ok", ACTION_MESSAGES["find_job"]["hi"][:24])
