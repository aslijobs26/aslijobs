import { env } from "../../config/env.js";
import {
  parseUnderstanding,
  understandLocally,
  type BotUnderstanding,
} from "./whatsapp-bot.logic.js";

const SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text";
const SARVAM_CHAT_URL = "https://api.sarvam.ai/v1/chat/completions";

export async function transcribeWhatsAppAudio(input: {
  buffer: Buffer;
  mimeType: string;
}): Promise<{ transcript: string; languageHint: string }> {
  if (!env.SARVAM_API_KEY.trim()) {
    throw new Error("Sarvam is not configured");
  }

  const form = new FormData();
  const blob = new Blob([new Uint8Array(input.buffer)], {
    type: input.mimeType || "audio/ogg",
  });
  form.append("file", blob, "voice.ogg");
  form.append("model", "saarika:v2.5");

  const started = Date.now();
  const response = await fetch(SARVAM_STT_URL, {
    method: "POST",
    headers: { "api-subscription-key": env.SARVAM_API_KEY },
    body: form,
    signal: AbortSignal.timeout(25_000),
  });

  if (!response.ok) {
    console.error(
      `[Sarvam] speech-to-text failed status=${response.status} latencyMs=${Date.now() - started}`,
    );
    throw new Error("Sarvam speech-to-text failed");
  }

  const body = (await response.json()) as {
    transcript?: string;
    language_code?: string;
  };
  const transcript = body.transcript?.trim() ?? "";
  if (!transcript) {
    throw new Error("Sarvam returned an empty transcript");
  }

  console.info(`[Sarvam] speech-to-text ok latencyMs=${Date.now() - started}`);
  return {
    transcript,
    languageHint: body.language_code?.trim() ?? "",
  };
}

export async function understandMessage(text: string): Promise<BotUnderstanding> {
  const local = understandLocally(text);
  if (!env.SARVAM_API_KEY.trim()) {
    return local;
  }

  const started = Date.now();
  try {
    const response = await fetch(SARVAM_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.SARVAM_API_KEY}`,
        "api-subscription-key": env.SARVAM_API_KEY,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(20_000),
      body: JSON.stringify({
        model: "sarvam-m",
        temperature: 0,
        messages: [
          {
            role: "system",
            content:
              "Extract WhatsApp job-assistant intent. Reply with JSON only: {\"intent\":\"GREETING|JOB_SEARCH|JOB_COUNT|PROFILE_MATCH|MY_SKILLS|MY_APPLICATIONS|APPLICATION_STATUS|HOW_TO_APPLY|EMPLOYER_JOBS|EMPLOYER_APPLICATION_COUNT|UNKNOWN\",\"language\":\"en|hi|te\",\"location\":\"\",\"category\":\"\",\"jobQuery\":\"\"}. Do not invent jobs.",
          },
          { role: "user", content: text.slice(0, 500) },
        ],
      }),
    });

    if (!response.ok) {
      console.error(
        `[Sarvam] intent failed status=${response.status} latencyMs=${Date.now() - started}`,
      );
      return local;
    }

    const body = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = body.choices?.[0]?.message?.content?.trim() ?? "";
    const json = content.match(/\{[\s\S]*\}/)?.[0] ?? content;
    console.info(`[Sarvam] intent ok latencyMs=${Date.now() - started}`);
    return parseUnderstanding(json, text);
  } catch (error) {
    console.error(
      `[Sarvam] intent error latencyMs=${Date.now() - started} reason=${
        error instanceof Error ? error.name : "unknown"
      }`,
    );
    return local;
  }
}
