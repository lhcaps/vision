#!/usr/bin/env python3
"""
Audit auto-populate map coverage for all BMs that use BmFormCasePayloadButton
or BmFlatFormCasePayloadButton. Cross-references against BM_FIELD_MAP and
BM_FLAT_FIELD_MAP.

Exits non-zero if any BMs that render the button lack a mapping entry.
"""
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
WEB_COMPONENTS = REPO_ROOT / "apps/web/src/components/documents"
FIELD_MAP_FILE = REPO_ROOT / "apps/web/src/lib/bm-auto-populate/bm-field-map.ts"

BM_CODE_RE = re.compile(r"BM-(\d{3})", re.IGNORECASE)
USES_BUTTON_RE = re.compile(r"BmFormCasePayloadButton|BmFlatFormCasePayloadButton")

def extract_bm_codes_from_map(text: str) -> tuple[set[str], set[str], set[str]]:
    """Return (nested_codes, flat_codes, intentionally_no_autofill_codes)."""
    nested = set()
    flat = set()
    nofill: set[str] = set()
    in_nested = False
    in_flat = False
    in_nofill = False

    for line in text.splitlines():
        stripped = line.strip()
        if "BM_FIELD_MAP:" in line or "BM_FIELD_MAP = " in line:
            in_nested = True
            in_flat = False
            in_nofill = False
            continue
        if "BM_FLAT_FIELD_MAP:" in line or "BM_FLAT_FIELD_MAP = " in line:
            in_nested = False
            in_flat = True
            in_nofill = False
            continue
        if "INTENTIONALLY_NO_AUTOFILL" in line and "new Set" in line:
            in_nested = False
            in_flat = False
            in_nofill = True
            continue
        if stripped.startswith("})") or stripped.startswith("};"):
            in_nested = False
            in_flat = False
            in_nofill = False
            continue
        if in_nofill:
            m = re.match(r'^\s*"(BM-\d{3})"', stripped)
            if m:
                nofill.add(m.group(1))
        if in_nested or in_flat:
            m = re.match(r'^\s*"(BM-\d{3})"\s*:\s*\[', line)
            if m:
                code = m.group(1)
                if in_nested:
                    nested.add(code)
                else:
                    flat.add(code)
    return nested, flat, nofill


def main() -> int:
    if not FIELD_MAP_FILE.is_file():
        print(f"Field map file not found: {FIELD_MAP_FILE}", file=sys.stderr)
        return 2

    map_text = FIELD_MAP_FILE.read_text(encoding="utf-8")
    nested, flat, nofill = extract_bm_codes_from_map(map_text)

    files_with_button: set[str] = set()
    for tsx in WEB_COMPONENTS.glob("bm-*-form-inputs.tsx"):
        try:
            text = tsx.read_text(encoding="utf-8")
        except OSError:
            continue
        if USES_BUTTON_RE.search(text):
            m = BM_CODE_RE.search(tsx.name)
            if m:
                files_with_button.add(f"BM-{m.group(1)}")

    all_mapped = nested | flat | nofill
    missing = sorted(c for c in files_with_button if c not in all_mapped)

    print("=== Auto-populate map coverage ===")
    print(f"BMs with case-payload button:  {len(files_with_button)}")
    print(f"BM_FIELD_MAP entries:          {len(nested)}")
    print(f"BM_FLAT_FIELD_MAP entries:     {len(flat)}")
    print(f"INTENTIONALLY_NO_AUTOFILL set: {len(nofill)}")
    print(f"Total covered:                 {len(all_mapped)}")
    print()
    if missing:
        print("MISSING (button renders but no mapping or nofill entry):")
        for c in missing:
            print(f"  - {c}")
        return 1
    print("All BMs with case-payload button have a mapping or nofill entry.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
