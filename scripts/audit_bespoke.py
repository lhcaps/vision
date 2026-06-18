"""Audit 213 bm-XXX-form-inputs.tsx files. Classify into 4 groups.

- BESPOKE:    uses BmFormSection + BmField* primitives from bm-form/
- WRAPPER:    falls back to GenericTemplateFormInputsPanel (stub)
- LEGACY:     self-defined Field/SelectField/SectionCard with inputClass/labelClass
- CUSTOM_LOCAL: self-defined TextInput/TextArea/SectionBox/etc. (BM-156 style — not a stub,
  but does not use the shared bm-form/ primitives; needs refactor in Phase 5/6)
- EMPTY:      file exists but is broken / unparseable
"""
import os
import re
import sys
from pathlib import Path

ROOT = Path(r"D:\Study\Project\QLLaw-main\apps\web\src\components\documents")

PATTERN_GENERIC = re.compile(r"GenericTemplateFormInputsPanel")
PATTERN_PRIMITIVES = re.compile(r"\bBmFormSection\b|\bBmFieldText\b|\bBmFieldDate\b|\bBmFieldTextarea\b|\bBmFieldSelect\b|\bBmFieldCheckbox\b|\bBmFormStatus\b|\bBmFormActions\b")
PATTERN_LEGACY = re.compile(r"function Field\b|function SelectField\b|function SectionCard\b|const inputClass\s*=|const labelClass\s*=")
PATTERN_CUSTOM_LOCAL = re.compile(
    r"function\s+(TextInput|TextArea|SectionBox|OptionalTextArea|DateSelectField|PreviewBox)\b"
)


def classify(text: str) -> str:
    if len(text) < 800:
        return "EMPTY"
    if PATTERN_GENERIC.search(text):
        return "WRAPPER"
    if PATTERN_CUSTOM_LOCAL.search(text) and not PATTERN_PRIMITIVES.search(text):
        return "CUSTOM_LOCAL"
    if PATTERN_LEGACY.search(text) and not PATTERN_PRIMITIVES.search(text):
        return "LEGACY"
    if PATTERN_PRIMITIVES.search(text):
        return "BESPOKE"
    return "EMPTY"


def main() -> None:
    files = sorted(ROOT.glob("bm-*-form-inputs.tsx"))
    print(f"Total files: {len(files)}")
    print()
    groups: dict[str, list[str]] = {
        "BESPOKE": [],
        "WRAPPER": [],
        "LEGACY": [],
        "CUSTOM_LOCAL": [],
        "EMPTY": [],
    }
    for f in files:
        text = f.read_text(encoding="utf-8", errors="ignore")
        kind = classify(text)
        groups[kind].append(f.name)
    for kind in ("BESPOKE", "WRAPPER", "LEGACY", "CUSTOM_LOCAL", "EMPTY"):
        print(f"{kind:>13}: {len(groups[kind])}")
        for name in groups[kind]:
            print(f"  - {name}")


if __name__ == "__main__":
    main()
