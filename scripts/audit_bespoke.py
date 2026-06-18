"""Audit 130 bm-XXX-form-inputs.tsx files. Classify into 3 groups.

- BESPOKE: uses BmFormSection + BmField* and does NOT call GenericTemplateFormInputsPanel
- WRAPPER: calls GenericTemplateFormInputsPanel (banner cam stub)
- LEGACY: self-defined Field/SelectField/SectionCard (BM-001 style, sai SPEC)
- EMPTY: file exists but < 30 lines (broken)
"""
import os
import re
import sys
from pathlib import Path

ROOT = Path(r"D:\Study\Project\QLLaw-main\apps\web\src\components\documents")

PATTERN_GENERIC = re.compile(r"GenericTemplateFormInputsPanel")
PATTERN_PRIMITIVES = re.compile(r"\bBmFormSection\b|\bBmFieldText\b|\bBmFieldDate\b|\bBmFieldTextarea\b|\bBmFieldSelect\b|\bBmFieldCheckbox\b|\bBmFormStatus\b|\bBmFormActions\b")
PATTERN_LEGACY = re.compile(r"function Field\b|function SelectField\b|function SectionCard\b|const inputClass\s*=|const labelClass\s*=")


def classify(text: str) -> str:
    if len(text) < 800:
        return "EMPTY"
    if PATTERN_GENERIC.search(text):
        return "WRAPPER"
    if PATTERN_LEGACY.search(text) and not PATTERN_PRIMITIVES.search(text):
        return "LEGACY"
    if PATTERN_PRIMITIVES.search(text):
        return "BESPOKE"
    return "EMPTY"


def main() -> None:
    files = sorted(ROOT.glob("bm-*-form-inputs.tsx"))
    print(f"Total files: {len(files)}")
    print()
    groups: dict[str, list[str]] = {"BESPOKE": [], "WRAPPER": [], "LEGACY": [], "EMPTY": []}
    for f in files:
        text = f.read_text(encoding="utf-8", errors="ignore")
        kind = classify(text)
        groups[kind].append(f.name)
    for kind in ("BESPOKE", "WRAPPER", "LEGACY", "EMPTY"):
        print(f"{kind:>9}: {len(groups[kind])}")
        for name in groups[kind]:
            print(f"  - {name}")


if __name__ == "__main__":
    main()
