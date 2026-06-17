# BM-150 PLACEHOLDER CONTRACT

## Template

BM-150 — Quyết định đình chỉ vụ án hình sự

## Backend/Form group

prosecutionCaseTermination

## Required placeholders

{{agency.parentName}}
{{agency.name}}
{{document.documentCode}}
{{document.issuePlaceAndDateLine}}
{{official.issuerTitle}}
{{prosecutionCaseTermination.procedureArticlesLine}}
{{prosecutionCaseTermination.caseDecisionLegalBasisLine}}
{{prosecutionCaseTermination.accusedDecisionLegalBasisLine}}
{{prosecutionCaseTermination.reasonLine}}
{{prosecutionCaseTermination.article1Line}}
{{prosecutionCaseTermination.article2Line}}
{{prosecutionCaseTermination.article3Line}}
{{prosecutionCaseTermination.article4Line}}
{{prosecutionCaseTermination.superiorProcuracyRecipientLine}}
{{recipients.otherRecipientsLine}}
{{prosecutionCaseTermination.accusedOrRepresentativeRecipientLine}}
{{prosecutionCaseTermination.investigationAuthorityRecipientLine}}
{{prosecutionCaseTermination.defenseCounselRecipientLine}}
{{recipients.archiveLine}}
{{signature.signMode}}
{{signature.positionTitle}}
{{signature.signerName}}

## Expected count

Required count = 22

## Notes

- signerName must be Trần Thanh Nam.
- Use document.documentCode, not document.fullDocumentCode.
- Use prosecutionCaseTermination for BM-150.
- Do not use prosecutionCaseSuspension in BM-150.
- Do not use prosecutionSupplementReturn in BM-150.
- Do not use prosecutionTransfer in BM-150.