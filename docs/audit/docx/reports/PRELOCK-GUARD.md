# Prelock Guard Report

Generated: 2026-06-19T07:37:22.275Z
Target: BM-001, BM-002, BM-003, BM-004
Contracts checked: 4

## Summary

- **Pass: 90** / 92 (97.8%)
- **Fail: 2**
- **Warn: 0**

## Failed checks

- ❌ [BM-004] No generic .field# slotIds
  - Detail: document.field6, document.field7, agency.field8, agency.field9, document.field10, document.field11, document.field12, document.field13, document.field14, document.field15, document.field16, document.field17, agency.field18, agency.field20, agency.field21, document.field22, document.field23, agency.field24, agency.field25, agency.field26, agency.field27, agency.field28, agency.field29, agency.field30, agency.field31, agency.field32, document.field33, document.field34, document.field35, document.field36, document.field37, document.field38, document.field39, document.field40, document.field41, document.field42, document.field43, document.field44, document.field45, document.field46, document.field47, document.field48, document.field49, document.field50
- ❌ [BM-004] No generic .field# canonicalField paths
  - Detail: document.field6, document.field7, agency.field8, agency.field9, document.field10, document.field11, document.field12, document.field13, document.field14, document.field15, document.field16, document.field17, agency.field18, agency.field20, agency.field21, document.field22, document.field23, agency.field24, agency.field25, agency.field26, agency.field27, agency.field28, agency.field29, agency.field30, agency.field31, agency.field32, document.field33, document.field34, document.field35, document.field36, document.field37, document.field38, document.field39, document.field40, document.field41, document.field42, document.field43, document.field44, document.field45, document.field46, document.field47, document.field48, document.field49, document.field50

## Passed checks

- ✅ [BM-001] Contract exists
- ✅ [BM-001] extractionSource.kind === "normalized-docx"
- ✅ [BM-001] extraction format is docx (not fallback doc)
- ✅ [BM-001] No warnings
- ✅ [BM-001] sourceId present
- ✅ [BM-001] documentKind === "form"
- ✅ [BM-001] Not a reference document
- ✅ [BM-001] No generic .field# slotIds
- ✅ [BM-001] No generic .field# canonicalField paths
- ✅ [BM-001] "Sinh ngày" NOT bound to document.issueDate
- ✅ [BM-001] "Cấp ngày" NOT bound to document.issueDate
- ✅ [BM-001] No heuristic fields with reviewRequired=false
- ✅ [BM-001] Non-unknown source fields have review metadata
- ✅ [BM-001] productMetadata present
- ✅ [BM-001] productMetadata.stage.reviewRequired === true
- ✅ [BM-001] productMetadata.stage has code and label
- ✅ [BM-001] productMetadata.legalBasisLine present
- ✅ [BM-001] renderFormatHints present
- ✅ [BM-001] renderFormatHints.fontFamily === "Times New Roman"
- ✅ [BM-001] renderFormatHints.baseFontSize === 13
- ✅ [BM-001] formInputHints present
- ✅ [BM-001] reportingHints present
- ✅ [BM-001] reportingHints.dimensions includes time/ward/offense
- ✅ [BM-002] Contract exists
- ✅ [BM-002] extractionSource.kind === "normalized-docx"
- ✅ [BM-002] extraction format is docx (not fallback doc)
- ✅ [BM-002] No warnings
- ✅ [BM-002] sourceId present
- ✅ [BM-002] documentKind === "form"
- ✅ [BM-002] Not a reference document
- ✅ [BM-002] No generic .field# slotIds
- ✅ [BM-002] No generic .field# canonicalField paths
- ✅ [BM-002] "Sinh ngày" NOT bound to document.issueDate
- ✅ [BM-002] "Cấp ngày" NOT bound to document.issueDate
- ✅ [BM-002] No heuristic fields with reviewRequired=false
- ✅ [BM-002] Non-unknown source fields have review metadata
- ✅ [BM-002] productMetadata present
- ✅ [BM-002] productMetadata.stage.reviewRequired === true
- ✅ [BM-002] productMetadata.stage has code and label
- ✅ [BM-002] productMetadata.legalBasisLine present
- ✅ [BM-002] renderFormatHints present
- ✅ [BM-002] renderFormatHints.fontFamily === "Times New Roman"
- ✅ [BM-002] renderFormatHints.baseFontSize === 13
- ✅ [BM-002] formInputHints present
- ✅ [BM-002] reportingHints present
- ✅ [BM-002] reportingHints.dimensions includes time/ward/offense
- ✅ [BM-003] Contract exists
- ✅ [BM-003] extractionSource.kind === "normalized-docx"
- ✅ [BM-003] extraction format is docx (not fallback doc)
- ✅ [BM-003] No warnings
- ✅ [BM-003] sourceId present
- ✅ [BM-003] documentKind === "form"
- ✅ [BM-003] Not a reference document
- ✅ [BM-003] No generic .field# slotIds
- ✅ [BM-003] No generic .field# canonicalField paths
- ✅ [BM-003] "Sinh ngày" NOT bound to document.issueDate
- ✅ [BM-003] "Cấp ngày" NOT bound to document.issueDate
- ✅ [BM-003] No heuristic fields with reviewRequired=false
- ✅ [BM-003] Non-unknown source fields have review metadata
- ✅ [BM-003] productMetadata present
- ✅ [BM-003] productMetadata.stage.reviewRequired === true
- ✅ [BM-003] productMetadata.stage has code and label
- ✅ [BM-003] productMetadata.legalBasisLine present
- ✅ [BM-003] renderFormatHints present
- ✅ [BM-003] renderFormatHints.fontFamily === "Times New Roman"
- ✅ [BM-003] renderFormatHints.baseFontSize === 13
- ✅ [BM-003] formInputHints present
- ✅ [BM-003] reportingHints present
- ✅ [BM-003] reportingHints.dimensions includes time/ward/offense
- ✅ [BM-004] Contract exists
- ✅ [BM-004] extractionSource.kind === "normalized-docx"
- ✅ [BM-004] extraction format is docx (not fallback doc)
- ✅ [BM-004] No warnings
- ✅ [BM-004] sourceId present
- ✅ [BM-004] documentKind === "form"
- ✅ [BM-004] Not a reference document
- ✅ [BM-004] "Sinh ngày" NOT bound to document.issueDate
- ✅ [BM-004] "Cấp ngày" NOT bound to document.issueDate
- ✅ [BM-004] No heuristic fields with reviewRequired=false
- ✅ [BM-004] Non-unknown source fields have review metadata
- ✅ [BM-004] productMetadata present
- ✅ [BM-004] productMetadata.stage.reviewRequired === true
- ✅ [BM-004] productMetadata.stage has code and label
- ✅ [BM-004] productMetadata.legalBasisLine present
- ✅ [BM-004] renderFormatHints present
- ✅ [BM-004] renderFormatHints.fontFamily === "Times New Roman"
- ✅ [BM-004] renderFormatHints.baseFontSize === 13
- ✅ [BM-004] formInputHints present
- ✅ [BM-004] reportingHints present
- ✅ [BM-004] reportingHints.dimensions includes time/ward/offense

## Phase C readiness

**NOT ready for Phase C.** 2 blocking issue(s) must be fixed first.

### Blocking issues
- [BM-004] No generic .field# slotIds
- [BM-004] No generic .field# canonicalField paths