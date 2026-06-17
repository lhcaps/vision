# BM-141 PLACEHOLDER CONTRACT

Template code: BM-141
Template name: Quyết định chuyển vụ án để truy tố
Stage: PROSECUTION
Render scope: CASE_LEVEL
Output strategy: ONE_FILE_PER_CASE
Generated document test ID: 40
Case: VKS-2026-0001

Required payload groups:
- agency
- document
- case
- offense
- caseDecision
- accusedDecision
- investigationConclusion
- prosecutionTransfer
- recipients
- signature
- official
- template

Backend group required: prosecutionTransfer

Required prosecutionTransfer fields:
- procedureArticlesLine
- caseDecisionLegalBasisLine
- accusedDecisionLegalBasisLine
- investigationConclusionLegalBasisLine
- fromProcuracyName
- toProcuracyName
- toProcuracyRecipientLine
- detentionFacilityRecipientLine
- transferReasonLine
- article1Line

Required DOCX placeholders:

Header:
{{agency.parentName}}
{{agency.name}}
{{document.documentCode}}
{{document.issuePlaceAndDateLine}}

Issuer:
{{official.issuerTitle}}

Legal basis:
{{prosecutionTransfer.procedureArticlesLine}}
{{prosecutionTransfer.caseDecisionLegalBasisLine}}
{{prosecutionTransfer.accusedDecisionLegalBasisLine}}
{{prosecutionTransfer.investigationConclusionLegalBasisLine}}

Decision:
{{prosecutionTransfer.transferReasonLine}}
{{prosecutionTransfer.article1Line}}

Recipients:
{{recipients.investigatingAgencyLine}}
{{recipients.accusedLine}}
{{prosecutionTransfer.toProcuracyRecipientLine}}
{{prosecutionTransfer.detentionFacilityRecipientLine}}
{{recipients.archiveLine}}

Signature:
{{signature.signMode}}
{{signature.positionTitle}}
{{signature.signerName}}

Mapping notes:
- Original lines 007-011: agency header
- Original lines 012-013: document code
- Original lines 017-019: issue place/date
- Original lines 022-024: issuer title
- Original line 025: procedure legal basis
- Original lines 026-031: case prosecution decision basis
- Original lines 032-038: accused prosecution decision basis
- Original lines 039-042: investigation conclusion basis
- Original lines 043-045: transfer reason
- Original lines 047-050: decision article
- Original lines 051-062: recipients
- Original lines 063-066: signature

Definition of done:
- render-payload has prosecutionTransfer
- DOCX mapped with all required placeholders
- missing placeholder count = 0
- template_versions status = PLACEHOLDERS_MAPPED
- render DOCX succeeds
- convert PDF succeeds
- FE form BM-141 saves formInputs correctly
