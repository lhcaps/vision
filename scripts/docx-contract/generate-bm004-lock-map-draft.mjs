#!/usr/bin/env node
// Phase C helper: generate a lock map draft for BM-004.
// Lists all 45 generic .field# slots with suggested semantic mappings.

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CONTRACTS_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts");
const OUTPUT = path.join(ROOT, "docs", "audit", "docx", "human-review", "BM-004.lock-map.draft.json");

const main = () => {
  const files = fs.readdirSync(CONTRACTS_DIR).filter(
    (n) => n.endsWith(".contract.draft.json") && n.includes("BM-004"),
  );
  if (files.length === 0) {
    console.error("No BM-004 draft contract found");
    process.exit(1);
  }

  const contract = JSON.parse(fs.readFileSync(path.join(CONTRACTS_DIR, files[0]), "utf8"));

  const genericSlots = (contract.docxSlots ?? []).filter(
    (s) => /^[a-z]+\.field\d+$/i.test(s.slotId),
  );
  const semanticSlots = (contract.docxSlots ?? []).filter(
    (s) => !/^[a-z]+\.field\d+$/i.test(s.slotId),
  );

  const genericMappings = genericSlots.map((s) => {
    const suggestedNs = s.suggestedNamespace ?? s.slotId.split(".")[0];
    const suggestedPath = suggestedNs + "." + s.slotId.split(".")[1].replace(/\d+$/, "semantic");
    return {
      oldSlotId: s.slotId,
      oldCanonicalPath: s.slotId,
      location: s.location,
      context: s.context ?? "",
      label: s.label ?? s.slotId,
      suggestedCanonicalPath: s.suggestedCanonicalPath ?? suggestedPath,
      suggestedTransform: s.slotType === "datePart" ? "date.day" : "identity",
      suggestedSource: "unknown",
      confidence: "LOW",
      reviewRequired: true,
      reviewNotes: "Auto-generated draft. Reviewer must confirm semantic path.",
    };
  });

  const nonGenericMappings = semanticSlots.map((s) => ({
    slotId: s.slotId,
    canonicalPath: s.slotId,
    transform: s.slotType === "datePart" ? "date.day" : "identity",
    source: "unknown",
    confidence: "MEDIUM",
    reviewRequired: true,
    reviewNotes: "Non-generic slot. Reviewer must confirm source.",
  }));

  const output = {
    generatedBy: "generate-bm004-lock-map-draft.mjs",
    generatedAt: new Date().toISOString(),
    sourceId: contract.sourceId,
    templateCode: contract.templateCode,
    totalGenericSlots: genericMappings.length,
    totalSemanticSlots: semanticSlots.length,
    totalSlots: (contract.docxSlots ?? []).length,
    genericFieldMappings: genericMappings,
    nonGenericSlots: nonGenericMappings,
    summary: {
      totalGeneric: genericMappings.length,
      highConfidence: 0,
      mediumConfidence: 0,
      lowConfidence: genericMappings.length,
      unresolvedQuestions: genericMappings.length,
    },
  };

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2), "utf8");
  console.log("BM-004 lock map draft written to: " + OUTPUT);
  console.log("Generic slots: " + genericMappings.length);
  console.log("Semantic slots: " + semanticSlots.length);
};

main();
