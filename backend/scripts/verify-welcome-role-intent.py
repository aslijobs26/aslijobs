# -*- coding: utf-8 -*-
"""Verify website WhatsApp welcome prefills map to seeker/employer roles."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
logic = (ROOT / "backend/src/modules/whatsapp/whatsapp-bot.logic.ts").read_text(encoding="utf-8")
welcome = (ROOT / "frontend/src/constants/whatsapp-welcome-messages.ts").read_text(encoding="utf-8")


def parse_message_map(source: str, const_name: str) -> dict[str, str]:
    block = re.search(
        rf"const {const_name}: Record<SiteLanguageCode, string> = \{{([\s\S]*?)\n\}};",
        source,
    )
    assert block, f"{const_name} not found"
    return {
        lang: msg
        for lang, msg in re.findall(r'(\w+):\s*"((?:\\.|[^"\\])*)"', block.group(1))
    }


fn_match = re.search(
    r"export function chooseAccountRole\(text: string\):[\s\S]*?return null;\n\}",
    logic,
)
assert fn_match, "chooseAccountRole not found"
fn = fn_match.group(0)

employer_re = re.search(
    r"const employer = looksLikePostJobRequest\(trimmed\) \|\|\s*/(.+)/i\.test",
    fn,
)
seeker_re = re.search(r"const seeker =\s*/(.+)/i\.test", fn)
assert employer_re and seeker_re

employer_pat = re.compile(employer_re.group(1), re.I)
seeker_pat = re.compile(seeker_re.group(1), re.I)
post_job = re.compile(
    r"want to post|\bpost(?:ing)?\b.{0,40}\bjobs?\b|\bjobs?\s*post|post cheyy|"
    r"పోస్ట్ చేయ|नौकरी पोस्ट|जॉब पोस्ट|வேலை போஸ்ட்|ಜಾಬ್ ಪೋಸ್ಟ್|ജോലി പോസ്റ്റ്",
    re.I,
)
tie = re.search(r"return /(.+)/i\.test\(trimmed\)\s*\n\s*\? \"employer\"", fn)
assert tie
tie_pat = re.compile(tie.group(1), re.I)


def choose(text: str) -> str | None:
    trimmed = text.strip()
    employer = bool(post_job.search(trimmed) or employer_pat.search(trimmed))
    seeker = bool(seeker_pat.search(trimmed))
    if employer and not seeker:
        return "employer"
    if seeker and not employer:
        return "seeker"
    if employer and seeker:
        return "employer" if tie_pat.search(trimmed) else "seeker"
    return None


SEEKER = parse_message_map(welcome, "SEEKER_MESSAGES")
EMPLOYER = parse_message_map(welcome, "EMPLOYER_MESSAGES")

failed = []
for lang, msg in SEEKER.items():
    role = choose(msg)
    if role != "seeker":
        failed.append(("seeker", lang, role, msg))
for lang, msg in EMPLOYER.items():
    role = choose(msg)
    if role != "employer":
        failed.append(("employer", lang, role, msg))

if failed:
    for row in failed:
        print("FAIL", row[0], row[1], "got", row[2])
        print(" ", row[3])
    raise SystemExit(1)
print("all welcome prefills classified correctly")
