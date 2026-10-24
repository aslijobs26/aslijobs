# -*- coding: utf-8 -*-
"""Regenerate only the WhatsApp FAB i18n bundle with full action UI locales."""
from __future__ import annotations

import importlib.util
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent / "generate-whatsapp-welcome.py"


def main() -> None:
    spec = importlib.util.spec_from_file_location("generate_whatsapp_welcome", SCRIPT)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load {SCRIPT}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.write_fab()
    print("Regenerated WhatsApp FAB UI bundle.")


if __name__ == "__main__":
    main()
