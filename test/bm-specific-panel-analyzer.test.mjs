import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  analyzeSpecificPanelSource,
  summarizeSpecificPanelAnalysis,
} from "../scripts/lib/bm-specific-panel-analyzer.mjs";

describe("analyzeSpecificPanelSource", () => {
  it("detects a specific panel that can be auto-wired through form/setForm", () => {
    const result = analyzeSpecificPanelSource({
      code: "BM-999",
      text: `
        export function Bm999FormInputsPanel() {
          const [form, setForm] = useState(EMPTY_BM999_FORM_INPUTS);
          function patch() {}
          return <button onClick={fillCustomerSample}>Điền dữ liệu mẫu BM-999</button>;
        }
      `,
    });

    assert.equal(result.kind, "specific");
    assert.equal(result.canAutoWireGenericCaseAdapter, true);
    assert.equal(result.stateVariable, "form");
    assert.equal(result.setterName, "setForm");
  });

  it("classifies generic wrappers separately from specific panels", () => {
    const result = analyzeSpecificPanelSource({
      code: "BM-998",
      text: `
        export function Bm998FormInputsPanel() {
          return <GenericTemplateFormInputsPanel documentId={documentId} />;
        }
      `,
    });

    assert.equal(result.kind, "generic-wrapper");
    assert.equal(result.canAutoWireGenericCaseAdapter, false);
  });

  it("reports why a specific panel cannot be auto-wired safely", () => {
    const result = analyzeSpecificPanelSource({
      code: "BM-997",
      text: `
        export function Bm997FormInputsPanel() {
          const [draft, setDraft] = useState({});
          return <div />;
        }
      `,
    });

    assert.equal(result.kind, "specific");
    assert.equal(result.canAutoWireGenericCaseAdapter, false);
    assert.ok(result.risks.includes("missing form state variable named form"));
  });

  it("does not report already-wired specific panels as blocked", () => {
    const summary = summarizeSpecificPanelAnalysis([
      analyzeSpecificPanelSource({
        code: "BM-996",
        text: `
          export function Bm996FormInputsPanel() {
            const casePayload = useCasePayload();
            const [form, setForm] = useState(EMPTY_FORM);
            return <button>Lấy từ vụ án</button>;
          }
        `,
      }),
    ]);

    assert.equal(summary.alreadyHasCasePathCount, 1);
    assert.equal(summary.blockedSpecificCount, 0);
    assert.deepEqual(summary.blockedSpecific, []);
  });
});
