# BM-144 PLACEHOLDER CONTRACT

Template code: BM-144
Template name: Quyết định gia hạn thời hạn quyết định việc truy tố
Stage: PROSECUTION
Render scope: CASE_LEVEL
Output strategy: ONE_FILE_PER_CASE
Generated document test ID: 43
Case: VKS-2026-0001

Required payload groups:
- agency
- document
- official
- caseDecision
- accusedDecision
- investigationConclusion
- prosecutionExtension
- recipients
- signature
- template

Backend group required: prosecutionExtension

Required prosecutionExtension fields:
- procedureArticlesLine
- juvenileJusticeLine
- caseDecisionLegalBasisLine
- accusedDecisionLegalBasisLine
- investigationConclusionLegalBasisLine
- reasonLine
- durationDaysText
- fromDateText
- toDateText
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
{{prosecutionExtension.procedureArticlesLine}}
{{prosecutionExtension.juvenileJusticeLine}}
{{prosecutionExtension.caseDecisionLegalBasisLine}}
{{prosecutionExtension.accusedDecisionLegalBasisLine}}
{{prosecutionExtension.investigationConclusionLegalBasisLine}}

Reason and decision:
{{prosecutionExtension.reasonLine}}
{{prosecutionExtension.article1Line}}

Recipients:
{{recipients.investigatingAgencyLine}}
{{recipients.accusedLine}}
{{recipients.archiveLine}}

Signature:
{{signature.signMode}}
{{signature.positionTitle}}
{{signature.signerName}}

Mapping notes:
- Original lines 007-011: agency header
- Original lines 012-013: document code
- Original lines 018-020: issue place/date
- Original lines 023-025: issuer title
- Original line 026: procedure legal basis
- Original lines 027-028: juvenile justice legal basis, optional
- Original lines 029-034: case prosecution decision basis
- Original lines 035-041: accused prosecution decision basis
- Original lines 042-045: investigation conclusion basis
- Original lines 046-047: extension reason
- Original lines 049-053: decision content/article 1
- Original lines 054-059: recipients
- Original lines 060-063: signature

Definition of done:
- render-payload has prosecutionExtension
- DOCX mapped with all required placeholders
- missing placeholder count = 0
- template_versions status = PLACEHOLDERS_MAPPED
- render DOCX succeeds
- convert PDF succeeds
- FE form BM-144 saves formInputs correctly
