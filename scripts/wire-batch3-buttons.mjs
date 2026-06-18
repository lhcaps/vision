// Wire BmFormCasePayloadButton into 20 batch-3 form files (Batch 3).
//
// Two surgical edits per file (idempotent):
//   1. Insert `import { BmFormCasePayloadButton } from "./bm-form/case-payload-button";`
//      after the existing `import ... from "react";` line.
//   2. Insert the button JSX as the FIRST CHILD of the outermost
//      <div/section className=...> wrapper of the panel's main
//      `return (`. The button sits at 6-space indent — one level
//      deeper than the 4-space outer wrapper — and uses
//      `setForm(next as typeof form)` so the typed form state
//      round-trips through the apply callback.
//
// Re-running this script on already-wired files is a no-op (each
// edit checks for the inserted text first).

import fs from "node:fs";
import path from "node:path";

const CODES = [
  "007", "009", "011", "014", "015", "016", "017", "018", "023",
  "030", "031", "033", "037", "038", "040", "042", "043", "044",
  "141", "144",
];
const FORM_DIR = "apps/web/src/components/documents";

let touched = 0;
let skipped = 0;

for (const code of CODES) {
  const fp = path.join(FORM_DIR, `bm-${code}-form-inputs.tsx`);
  let text = fs.readFileSync(fp, "utf8");
  let edited = false;

  // ---- 1. Import line ----
  const importLine = `import { BmFormCasePayloadButton } from "./bm-form/case-payload-button";`;
  if (!text.includes(importLine)) {
    const m = text.match(/^(import[^\n]*from "react";\s*\n)/mu);
    if (!m) {
      console.error(`BM-${code}: cannot find react import`);
      continue;
    }
    text = text.replace(m[1], `${m[1]}${importLine}\n`);
    edited = true;
  }

  // ---- 2. Button JSX as first child of outer wrapper ----
  // Indent: 6 spaces (outer wrapper is at 4 spaces).
  const buttonJsx = `      <BmFormCasePayloadButton templateCode="BM-${code}" form={form} onApply={(next) => setForm(next as typeof form)} />`;

  if (!text.includes(buttonJsx)) {
    const lines = text.split(/\r?\n/);
    // Locate the panel export to bound the search for the main return.
    const panelIdx = lines.findIndex((l) => /export function Bm\d+FormInputsPanel/.test(l));
    if (panelIdx < 0) {
      console.error(`BM-${code}: panel not found`);
      continue;
    }
    // The panel's main return is the LAST `  return (` in the file
    // (the deepest one). We assume all `  return (` lines after the
    // panel declaration belong to helper components inside the panel
    // body; the deepest one is the panel's actual render.
    let retIdx = -1;
    for (let i = panelIdx; i < lines.length; i++) {
      if (/^  return \(/.test(lines[i])) retIdx = i;
    }
    if (retIdx < 0) {
      console.error(`BM-${code}: main return not found`);
      continue;
    }
    // Insert the button on a new line right after the outer wrapper's
    // open tag (which is at retIdx + 1). The button becomes the first
    // child of the outer wrapper.
    lines.splice(retIdx + 2, 0, buttonJsx);
    text = lines.join("\n");
    edited = true;
  }

  if (edited) {
    fs.writeFileSync(fp, text, "utf8");
    touched++;
    console.log(`BM-${code}: wired`);
  } else {
    skipped++;
    console.log(`BM-${code}: already wired (skipped)`);
  }
}

console.log(`\nDone. touched=${touched} skipped=${skipped}`);
