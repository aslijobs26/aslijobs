import { config } from "dotenv";

config({ override: true });

const key = (process.env.OPENAI_API_KEY || "").trim();
const model = (process.env.OPENAI_MODEL || "gpt-6-luna").trim();

console.log(`openai_key_present=${key ? "yes" : "no"}`);
console.log(`openai_model_configured=${model || "(empty)"}`);

if (!key) {
  console.log("openai_live=skipped_missing_key");
  process.exit(0);
}

const started = Date.now();
try {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      reasoning_effort: "none",
      max_completion_tokens: 40,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: 'Return JSON {"ok":true,"ping":"pong"} only.',
        },
        { role: "user", content: "ping" },
      ],
    }),
    signal: AbortSignal.timeout(20_000),
  });
  let detail = "";
  try {
    const json = (await res.json()) as {
      error?: { code?: string; type?: string; message?: string };
      choices?: Array<{ message?: { content?: string } }>;
    };
    if (json.error) {
      detail = `error_code=${json.error.code || json.error.type || "unknown"}`;
    } else {
      const content = json.choices?.[0]?.message?.content ?? "";
      detail = `content_chars=${content.length}`;
    }
  } catch {
    detail = "unreadable_body";
  }
  console.log(`openai_live_status=${res.status}`);
  console.log(`openai_live_detail=${detail}`);
  console.log(`openai_live_ms=${Date.now() - started}`);
  console.log(
    `openai_live=${res.status >= 200 && res.status < 300 ? "ok" : "failed"}`,
  );
} catch (error) {
  console.log("openai_live=failed");
  console.log(
    `openai_live_error=${error instanceof Error ? error.name : "unknown"}`,
  );
}
