import { env } from "../../config/env.js";
import {
  JOBS_FOR_AI_LIMIT,
  parseUnderstanding,
  understandLocally,
  type BotLanguage,
  type BotUnderstanding,
} from "./whatsapp-bot.logic.js";

const SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text";
export const SARVAM_CHAT_URL = "https://api.sarvam.ai/v1/chat/completions";
export const SARVAM_CHAT_MODEL = "sarvam-105b";
const UNDERSTAND_TIMEOUT_MS = 20_000;

export const UNDERSTAND_SYSTEM =
  "AsliJobs classifier. JSON only. Fields: intent,language,location,category,openSearch,confidence. intent=GREETING|HELP|CLARIFY|JOB_SEARCH|JOB_DETAILS|PROFILE_JOBS|MY_SKILLS|MY_APPLICATIONS|APPLICATION_COUNT|APPLICATION_STATUS|APPLIED_COVERAGE|HOW_TO_APPLY|EMPLOYER_JOBS|EMPLOYER_JOB_STATUS|EMPLOYER_APPLICATION_COUNT|UNRELATED|UNKNOWN. language=en|hi|te|ta|kn|ml from THIS message only. Posted/my jobs + applications = EMPLOYER_APPLICATION_COUNT. Public job hunt = JOB_SEARCH. Ignore prev unless THIS message is only a role or place follow-up. Do not answer, authorize, or invent jobs.";

type SarvamUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
};

type ChatChoice = {
  message?: { content?: string | null; reasoning_content?: string | null };
};

function logSarvam(input: {
  stage: "UNDERSTAND" | "STT";
  model: string;
  latencyMs: number;
  ok: boolean;
  inChars: number;
  outChars: number;
  usage?: SarvamUsage;
  extra?: string;
}): void {
  const tokens =
    input.usage &&
    (input.usage.prompt_tokens != null || input.usage.completion_tokens != null)
      ? ` inTokens=${input.usage.prompt_tokens ?? "-"} outTokens=${input.usage.completion_tokens ?? "-"} totalTokens=${input.usage.total_tokens ?? "-"}`
      : " inTokens=- outTokens=- totalTokens=-";
  console.info(
    `[Sarvam] stage=${input.stage} model=${input.model} ok=${input.ok ? "yes" : "no"} latencyMs=${input.latencyMs} inChars=${input.inChars} outChars=${input.outChars}${tokens}${
      input.extra ? ` ${input.extra}` : ""
    }`,
  );
  const provider = input.stage === "STT" ? "sarvam-stt" : "sarvam";
  console.info(
    `[WA-AI-COST] stage=${input.stage} provider=${provider} model=${input.model} inputTokens=${input.usage?.prompt_tokens ?? "-"} outputTokens=${input.usage?.completion_tokens ?? "-"} totalTokens=${input.usage?.total_tokens ?? "-"} durationMs=${input.latencyMs}`,
  );
}

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
      logSarvam({
        stage: "STT",
        model: attempt.model,
        latencyMs: Date.now() - started,
        ok: false,
        inChars: input.buffer.length,
        outChars: 0,
        extra: `status=${response.status}`,
      });
      continue;
    }

    const body = (await response.json()) as {
      transcript?: string;
      language_code?: string | null;
    };
    const transcript = body.transcript?.trim() ?? "";
    if (!transcript) {
      logSarvam({
        stage: "STT",
        model: attempt.model,
        latencyMs: Date.now() - started,
        ok: false,
        inChars: input.buffer.length,
        outChars: 0,
        extra: "empty",
      });
      continue;
    }

    logSarvam({
      stage: "STT",
      model: attempt.model,
      latencyMs: Date.now() - started,
      ok: true,
      inChars: input.buffer.length,
      outChars: transcript.length,
    });
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

export type SarvamUnderstanding = {
  understanding: BotUnderstanding;
  source: "sarvam" | "fallback";
};

export async function understandMessage(
  text: string,
  previous?: BotLanguage | null,
  hint?: BotLanguage | null,
  context?: {
    accountType?: string;
    priorLocation?: string;
    priorRole?: string;
  },
): Promise<SarvamUnderstanding> {
  const fallback = (): SarvamUnderstanding => ({
    understanding: understandLocally(text, previous, hint),
    source: "fallback",
  });
  if (!env.SARVAM_API_KEY.trim()) {
    console.error("[Sarvam] SARVAM_UNAVAILABLE reason=missing_key");
    return fallback();
  }

  const userContent = JSON.stringify({
    q: text.slice(0, 280),
    acct: context?.accountType || "NEW_USER",
    ...(context?.priorLocation || context?.priorRole
      ? { prev: { loc: context.priorLocation || "", role: context.priorRole || "" } }
      : {}),
  });
  const inChars = UNDERSTAND_SYSTEM.length + userContent.length;
  const started = Date.now();
  try {
    const response = await fetch(SARVAM_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.SARVAM_API_KEY}`,
        "api-subscription-key": env.SARVAM_API_KEY,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(UNDERSTAND_TIMEOUT_MS),
      body: JSON.stringify({
        model: SARVAM_CHAT_MODEL,
        temperature: 0,
        messages: [
          { role: "system", content: UNDERSTAND_SYSTEM },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      console.error(`[Sarvam] SARVAM_INVALID_RESPONSE status=${response.status}`);
      logSarvam({
        stage: "UNDERSTAND",
        model: SARVAM_CHAT_MODEL,
        latencyMs: Date.now() - started,
        ok: false,
        inChars,
        outChars: 0,
        extra: `status=${response.status}`,
      });
      return fallback();
    }

    const body = (await response.json()) as {
      choices?: ChatChoice[];
      usage?: SarvamUsage;
    };
    const message = body.choices?.[0]?.message;
    const content = (message?.content || message?.reasoning_content || "").trim();
    const json = content.match(/\{[\s\S]*\}/)?.[0] ?? content;
    if (!json.startsWith("{")) {
      console.error("[Sarvam] SARVAM_INVALID_RESPONSE reason=no_json");
      logSarvam({
        stage: "UNDERSTAND",
        model: SARVAM_CHAT_MODEL,
        latencyMs: Date.now() - started,
        ok: false,
        inChars,
        outChars: content.length,
        usage: body.usage,
        extra: "no_json",
      });
      return fallback();
    }
    const understanding = parseUnderstanding(json, text, previous, hint);
    if (understanding.intent === "UNKNOWN" && understanding.confidence === 0) {
      console.error("[Sarvam] SARVAM_INVALID_RESPONSE reason=schema");
      logSarvam({
        stage: "UNDERSTAND",
        model: SARVAM_CHAT_MODEL,
        latencyMs: Date.now() - started,
        ok: false,
        inChars,
        outChars: json.length,
        usage: body.usage,
        extra: "schema",
      });
      return fallback();
    }
    logSarvam({
      stage: "UNDERSTAND",
      model: SARVAM_CHAT_MODEL,
      latencyMs: Date.now() - started,
      ok: true,
      inChars,
      outChars: json.length,
      usage: body.usage,
      extra: `intent=${understanding.intent} language=${understanding.language}`,
    });
    return { understanding, source: "sarvam" };
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    console.error(
      `[Sarvam] ${timedOut ? "SARVAM_TIMEOUT" : "SARVAM_INVALID_RESPONSE"} reason=${
        error instanceof Error ? error.name : "unknown"
      }`,
    );
    logSarvam({
      stage: "UNDERSTAND",
      model: SARVAM_CHAT_MODEL,
      latencyMs: Date.now() - started,
      ok: false,
      inChars,
      outChars: 0,
      extra: timedOut ? "timeout" : "error",
    });
    return fallback();
  }
}

export function compactFacts(facts: Record<string, unknown>): Record<string, unknown> {
  const jobs = Array.isArray(facts.jobs)
    ? facts.jobs.slice(0, JOBS_FOR_AI_LIMIT).map((job) => {
        if (!job || typeof job !== "object") return job;
        const row = job as Record<string, unknown>;
        return {
          title: row.jobTitle ?? row.title,
          company: row.companyName ?? row.company,
          loc: row.cityName ?? row.location,
          salary: row.salary,
          status: row.status,
          apps: row.applications,
        };
      })
    : undefined;
  const applications = Array.isArray(facts.applications)
    ? facts.applications.slice(0, 3).map((item) => {
        if (!item || typeof item !== "object") return item;
        const row = item as Record<string, unknown>;
        return {
          title: row.jobTitle,
          company: row.companyName,
          status: row.status,
        };
      })
    : undefined;
  return {
    s: facts.situation,
    ...(facts.intent ? { intent: facts.intent } : {}),
    ...(facts.empty != null ? { empty: facts.empty } : {}),
    ...(facts.location ? { loc: facts.location } : {}),
    ...(facts.role ? { role: facts.role } : {}),
    ...(facts.widenedTo ? { widenedTo: facts.widenedTo } : {}),
    ...(facts.total != null ? { total: facts.total } : {}),
    ...(facts.more != null ? { more: facts.more } : {}),
    ...(facts.totalApplications != null ? { apps: facts.totalApplications } : {}),
    ...(facts.name ? { name: facts.name } : {}),
    ...(facts.reason ? { reason: facts.reason } : {}),
    ...(facts.missing ? { missing: facts.missing } : {}),
    ...(facts.accountType ? { acct: facts.accountType } : {}),
    ...(facts.registration ? { reg: facts.registration } : {}),
    ...(jobs ? { jobs } : {}),
    ...(applications ? { applications } : {}),
    ...(facts.applied != null
      ? {
          applied: facts.applied,
          matched: facts.matched,
          compared: facts.compared,
        }
      : {}),
  };
}
