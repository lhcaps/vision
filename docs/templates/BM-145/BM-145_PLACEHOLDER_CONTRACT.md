# BM-145 PLACEHOLDER CONTRACT

## Template

BM-145 — Quyết định trả hồ sơ vụ án để điều tra bổ sung

## Backend group

prosecutionSupplementReturn

## Required placeholders

{{agency.parentName}}
{{agency.name}}
{{document.documentCode}}
{{document.issuePlaceAndDateLine}}
{{official.issuerTitle}}
{{prosecutionSupplementReturn.returnRoundLine}}
{{prosecutionSupplementReturn.procedureArticlesLine}}
{{prosecutionSupplementReturn.investigationConclusionLegalBasisLine}}
{{prosecutionSupplementReturn.courtReturnDecisionLegalBasisLine}}
{{prosecutionSupplementReturn.reasonLine}}
{{prosecutionSupplementReturn.article1IntroLine}}
{{prosecutionSupplementReturn.supplementIssue1Line}}
{{prosecutionSupplementReturn.supplementIssue2Line}}
{{prosecutionSupplementReturn.supplementIssue3Line}}
{{prosecutionSupplementReturn.article2Line}}
{{prosecutionSupplementReturn.article3Line}}
{{prosecutionSupplementReturn.investigationAuthorityRecipientLine}}
{{recipients.archiveLine}}
{{signature.signMode}}
{{signature.positionTitle}}
{{signature.signerName}}

## Expected count

Required count = 21

## Important notes

- signerName must be Nguyễn Thanh Nam.
- Use returnRoundLine, not returnRoundText.
- Use investigationAuthorityRecipientLine, not investigatingAgencyRecipientLine.
- Use document.documentCode, not document.fullDocumentCode, because fullDocumentCode is currently duplicated in payload.
- Optional court return legal basis line is kept as official text with "(nếu có)" to avoid blank line issues.