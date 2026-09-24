import { env } from "../../config/env.js";
import {
  parseUnderstanding,
  understandLocally,
  type BotLanguage,
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

  const attempts = [
    { model: "saaras:v3", mode: "transcribe" },
    { model: "saarika:v2.5", mode: "" },
  ];

  let lastStatus = 0;
  for (const attempt of attempts) {
    const started = Date.now();
    const response = await fetch(SARVAM_STT_URL, {
      method: "POST",
      headers: { "api-subscription-key": env.SARVAM_API_KEY },
      body: buildAudioForm(input, attempt),
      signal: AbortSignal.timeout(25_000),
    });
    lastStatus = response.status;
    if (!response.ok) {
      console.error(
        `[Sarvam] speech-to-text failed model=${attempt.model} status=${response.status} latencyMs=${Date.now() - started}`,
      );
      continue;
    }

    const body = (await response.json()) as {
      transcript?: string;
      language_code?: string | null;
    };
    const transcript = body.transcript?.trim() ?? "";
    if (!transcript) {
      console.error(
        `[Sarvam] speech-to-text empty model=${attempt.model} latencyMs=${Date.now() - started}`,
      );
      continue;
    }

    console.info(
      `[Sarvam] speech-to-text ok model=${attempt.model} latencyMs=${Date.now() - started}`,
    );
    return {
      transcript,
      languageHint: body.language_code?.trim() ?? "",
    };
  }

  throw new Error(`Sarvam speech-to-text failed status=${lastStatus}`);
}

function buildAudioForm(
  input: { buffer: Buffer; mimeType: string },
  attempt: { model: string; mode: string },
): FormData {
  const mime = (input.mimeType.split(";")[0] ?? "audio/ogg").trim() || "audio/ogg";
  const extension = mime.includes("mpeg")
    ? "mp3"
    : mime.includes("mp4") || mime.includes("m4a")
      ? "m4a"
      : mime.includes("wav")
        ? "wav"
        : "ogg";
  const form = new FormData();
  form.append(
    "file",
    new Blob([new Uint8Array(input.buffer)], { type: mime }),
    `voice.${extension}`,
  );
  form.append("model", attempt.model);
  form.append("language_code", "unknown");
  if (attempt.mode) {
    form.append("mode", attempt.mode);
  }
  return form;
}

export async function understandMessage(
  text: string,
  previous?: BotLanguage | null,
  hint?: BotLanguage | null,
): Promise<BotUnderstanding> {
  if (!env.SARVAM_API_KEY.trim()) {
    return understandLocally(text, previous, hint);
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
              "You only classify a WhatsApp message for AsliJobs. Do not answer the user and do not invent jobs, companies, salaries, or counts. Reply with JSON only: {\"intent\":\"GREETING|HELP|CLARIFY|JOB_SEARCH|JOB_DETAILS|PROFILE_JOBS|MY_APPLICATIONS|APPLICATION_COUNT|APPLICATION_STATUS|APPLIED_COVERAGE|EMPLOYER_JOBS|EMPLOYER_JOB_STATUS|EMPLOYER_APPLICATION_COUNT|UNRELATED|UNKNOWN\",\"language\":\"en|hi|te|ta|kn|ml\",\"location\":\"\",\"category\":\"\",\"jobQuery\":\"\",\"openSearch\":false,\"confidence\":0.0,\"focus\":\"\"}. language is the language of THIS message, including romanized Telugu or Hindi. category and location are canonical English names such as Driver or Hyderabad. openSearch is true only when the user wants any job, not a specific role. Use UNRELATED for weather, sports, jokes, and general knowledge. Use CLARIFY only when the request is ambiguous.",
          },
          { role: "user", content: text.slice(0, 500) },
        ],
      }),
    });

    if (!response.ok) {
      console.error(
        `[Sarvam] intent failed status=${response.status} latencyMs=${Date.now() - started}`,
      );
      return understandLocally(text, previous, hint);
    }

    const body = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = body.choices?.[0]?.message?.content?.trim() ?? "";
    const json = content.match(/\{[\s\S]*\}/)?.[0] ?? content;
    console.info(`[Sarvam] intent ok latencyMs=${Date.now() - started}`);
    return parseUnderstanding(json, text, previous, hint);
  } catch (error) {
    console.error(
      `[Sarvam] intent error latencyMs=${Date.now() - started} reason=${
        error instanceof Error ? error.name : "unknown"
      }`,
    );
    return understandLocally(text, previous, hint);
  }
}
