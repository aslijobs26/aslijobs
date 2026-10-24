# -*- coding: utf-8 -*-
"""Inject website WhatsApp FAB action intent regression tests."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
test_path = ROOT / "backend/src/modules/whatsapp/whatsapp-bot.test.ts"
welcome = (ROOT / "frontend/src/constants/whatsapp-welcome-messages.ts").read_text(
    encoding="utf-8"
)
text = test_path.read_text(encoding="utf-8")

MARKER = "identifies website WhatsApp FAB role actions with supported intents"


def parse_message_map(const_name: str) -> dict[str, str]:
    block = re.search(
        rf"const {const_name}: Record<SiteLanguageCode, string> = \{{([\s\S]*?)\n\}};",
        welcome,
    )
    assert block, f"{const_name} not found"
    return {
        lang: msg
        for lang, msg in re.findall(r'(\w+):\s*"((?:\\.|[^"\\])*)"', block.group(1))
    }


def ts_string(value: str) -> str:
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"'


langs = ["en", "te", "hi", "ta", "kn", "ml"]
cases = [
    ("MESSAGES_FIND_JOB", "JOB_SEARCH"),
    ("MESSAGES_HIRE_STAFF", "POST_JOB"),
    ("MESSAGES_PROFILE_JOBS", "PROFILE_JOBS"),
    ("MESSAGES_APPLICATION_STATUS", "APPLICATION_STATUS"),
    ("MESSAGES_SEEKER_HELP", "HELP"),
    ("MESSAGES_POST_JOB", "POST_JOB"),
    ("MESSAGES_MY_JOBS", "EMPLOYER_JOBS"),
    ("MESSAGES_EMPLOYER_APPLICATIONS", "EMPLOYER_APPLICATION_COUNT"),
    ("MESSAGES_EMPLOYER_HELP", "HELP"),
]

blocks: list[str] = []
for const_name, intent in cases:
    messages = parse_message_map(const_name)
    for lang in langs:
        message = messages[lang]
        blocks.append(
            f"""    {{
      const message = {ts_string(message)};
      const local = understandLocally(message);
      const hinted = applyRoleHints(message, local, "none");
      assert.equal(hinted.intent, "{intent}");
      assert.equal(detectLanguage(message), "{lang}");
    }}"""
        )

new_test = (
    f'\n  it("{MARKER}", () => {{\n'
    + "\n".join(blocks)
    + "\n  });\n"
)

remove_pat = re.compile(r'\n  it\("' + re.escape(MARKER) + r'"[\s\S]*?\n  \}\);\n')
text = remove_pat.sub("\n", text, count=1)

# Also remove the older welcome-only marker if present; keep both if different
old_marker = "identifies website WhatsApp welcome prefills as seeker or employer"
# Keep old test; inject new one before hire-vs-seeker test
anchor = '  it("identifies hire vs job-seeker intent without an LLM"'
assert anchor in text, "anchor not found"
if MARKER not in text:
    text = text.replace(anchor, new_test + "\n" + anchor, 1)
else:
    text = remove_pat.sub("\n", text, count=1)
    text = text.replace(anchor, new_test + "\n" + anchor, 1)

test_path.write_text(text, encoding="utf-8")
print("injected", test_path, "cases", len(blocks))
