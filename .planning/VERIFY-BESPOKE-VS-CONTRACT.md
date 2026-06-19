# So sánh BESPOKE vs PLACEHOLDER_CONTRACT

## BM-001

- Contract sections: 8
- BESPOKE sections: 7
- Matching sections: 7
- Contract only (missing in BESPOKE): ['Danh sách placeholder cần có trong DOCX']
- Contract fields missing in BESPOKE:
  - {'document': ['issuePlaceDateLine']}
  - {'reception': ['endedAtDay', 'endedAtMonth', 'endedAtYear', 'startedAtDay', 'startedAtMonth', 'startedAtYear']}
  - {'informant': ['birthDay', 'birthMonth', 'identityIssuedDay', 'identityIssuedMonth', 'identityIssuedYear']}
  - {'crimeReport': ['attachedItemsDescription', 'content']}
- BESPOKE fields extra (not in contract):
  - {'agency': ['parentName']}
  - {'document': ['issueDate']}
  - {'reception': ['endedAtDate', 'startedAtDate']}
  - {'informant': ['dateOfBirth', 'identityIssuedDate']}

## BM-003

- Contract sections: 5
- BESPOKE sections: 7
- Matching sections: 5
- BESPOKE only (extra): ['legalBasis', 'sourceAssignment']
- Contract fields missing in BESPOKE:
  - {'Signature': ['..']}
- BESPOKE fields extra (not in contract):
  - {'Agency': ['bodyName', 'shortName']}
  - {'Document': ['issueDateText', 'issuePlace']}

## BM-005

- Contract sections: 1
- BESPOKE sections: 7
- Matching sections: 0
- Contract only (missing in BESPOKE): ['Header']
- BESPOKE only (extra): ['agency', 'document', 'official', 'sourceVerification', 'recipients', 'signature', 'receiver']

## BM-017

- Contract sections: 2
- BESPOKE sections: 6
- Matching sections: 0
- Contract only (missing in BESPOKE): ['Template', 'Mapping']
- BESPOKE only (extra): ['agency', 'document', 'official', 'caseInitiationRequest', 'recipients', 'signature']

## BM-023

- Contract sections: 1
- BESPOKE sections: 10
- Matching sections: 0
- Contract only (missing in BESPOKE): ['Placeholder mapping plan']
- BESPOKE only (extra): ['agency', 'official', 'document', 'legalBasis', 'crimeReport', 'case', 'offense', 'investigation', 'recipients', 'signature']

## BM-033

- Contract sections: 7
- BESPOKE sections: 8
- Matching sections: 2
- Contract only (missing in BESPOKE): ['Header', 'Title', 'Reason', 'Placeholder list v1', 'Rules']
- BESPOKE only (extra): ['agency', 'document', 'person', 'investigation', 'legalBasis', 'custody']

## BM-053

- Contract sections: 0
- BESPOKE sections: 12
- Matching sections: 0
- BESPOKE only (extra): ['agency', 'official', 'document', 'caseDecision', 'accusedDecision', 'offense', 'person', 'measure', 'monitoring', 'recipients', 'signature', 'delivery']

## BM-070

- Contract sections: 1
- BESPOKE sections: 1
- Matching sections: 0
- Contract only (missing in BESPOKE): ['Mapping đề xuất vào DOCX']
- BESPOKE only (extra): ['_flat']

## BM-085

- Contract sections: 2
- BESPOKE sections: 6
- Matching sections: 0
- Contract only (missing in BESPOKE): ['Template', 'Mapping']
- BESPOKE only (extra): ['agency', 'document', 'official', 'caseInvestigationTransfer', 'recipients', 'signature']

## BM-090

- Contract sections: 0
- BESPOKE sections: 1
- Matching sections: 0
- BESPOKE only (extra): ['_flat']

## BM-097

- Contract sections: 0
- BESPOKE sections: 9
- Matching sections: 0
- BESPOKE only (extra): ['agency', 'official', 'document', 'caseDecision', 'accusedDecision', 'offense', 'person', 'recipients', 'signature']

## BM-103

- Contract sections: 1
- BESPOKE sections: 6
- Matching sections: 0
- Contract only (missing in BESPOKE): ['Required placeholders']
- BESPOKE only (extra): ['agency', 'document', 'official', 'cancelledDecision', 'recipients', 'signature']

## BM-104

- Contract sections: 0
- BESPOKE sections: 6
- Matching sections: 0
- BESPOKE only (extra): ['agency', 'document', 'official', 'cancelledDecision', 'recipients', 'signature']

## BM-141

- Contract sections: 0
- BESPOKE sections: 6
- Matching sections: 0
- BESPOKE only (extra): ['agency', 'document', 'official', 'prosecutionTransfer', 'recipients', 'signature']

## BM-144

- Contract sections: 0
- BESPOKE sections: 6
- Matching sections: 0
- BESPOKE only (extra): ['agency', 'document', 'official', 'prosecutionExtension', 'recipients', 'signature']

## BM-145

- Contract sections: 1
- BESPOKE sections: 1
- Matching sections: 0
- Contract only (missing in BESPOKE): ['Template']
- BESPOKE only (extra): ['_flat']

## BM-146

- Contract sections: 1
- BESPOKE sections: 1
- Matching sections: 0
- Contract only (missing in BESPOKE): ['Template']
- BESPOKE only (extra): ['_flat']

## BM-148

- Contract sections: 9
- BESPOKE sections: 11
- Matching sections: 9
- BESPOKE only (extra): ['official', 'helper']
- Contract fields missing in BESPOKE:
  - {'document': ['documentCode', 'issuePlaceAndDateLine']}
  - {'agency': ['name', 'parentName']}
  - {'legalBasis': ['juvenileJusticeLine', 'procedureArticlesLine']}
  - {'caseDecision': ['prosecutionDecisionLegalBasisLine']}
  - {'accusedDecision': ['prosecutionDecisionLegalBasisLine']}
  - {'suspension': ['article1Line', 'article2ActionLine', 'executionRequestLine', 'reasonLine']}
  - {'person': ['birthDateLine', 'currentResidence', 'fullName', 'genderText', 'identityDocumentLine', 'identityIssueLine', 'nationalityEthnicityReligionLine', 'occupation', 'otherName', 'permanentResidence', 'temporaryResidence']}
  - {'recipients': ['archiveLine', 'line1', 'line2']}
  - {'signature': ['positionTitle', 'signMode', 'signerName']}
- BESPOKE fields extra (not in contract):
  - {'document': ['<loose>']}
  - {'agency': ['<loose>']}
  - {'suspension': ['<loose>']}
  - {'person': ['<loose>']}
  - {'recipients': ['<loose>']}
  - {'signature': ['<loose>']}

## BM-150

- Contract sections: 1
- BESPOKE sections: 1
- Matching sections: 0
- Contract only (missing in BESPOKE): ['Template']
- BESPOKE only (extra): ['_flat']

## BM-156

- Contract sections: 14
- BESPOKE sections: 13
- Matching sections: 12
- Contract only (missing in BESPOKE): ['attachments', 'Danh sách placeholder cần cấy trong DOCX']
- BESPOKE only (extra): ['caseInfo']
- Contract fields missing in BESPOKE:
  - {'agency': ['issuePlace', 'name', 'parentName', 'shortName']}
  - {'document': ['fullDocumentCode', 'issuePlaceDateLine']}
  - {'official': ['issuerTitle']}
  - {'legalBasis': ['procedureArticlesLine']}
  - {'caseDecision': ['legalBasisLine']}
  - {'accusedDecision': ['legalBasisLine']}
  - {'caseJoinder': ['legalBasisLine']}
  - {'caseRecovery': ['legalBasisLine']}
  - {'investigationConclusion': ['legalBasisLine']}
  - {'indictment': ['conclusionSection', 'evidenceConclusionLine', 'factFindingsSection', 'prosecutionDecisionLine', 'replacementLine']}
  - {'recipients': ['accusedLine', 'archiveLine', 'courtLine', 'investigationUnitLine', 'otherRecipientsLine', 'superiorProcuracyLine']}
  - {'signature': ['positionTitle', 'signMode', 'signerName']}
- BESPOKE fields extra (not in contract):
  - {'agency': ['<loose>']}
  - {'document': ['<loose>']}
  - {'official': ['<loose>']}
  - {'indictment': ['<loose>']}
  - {'recipients': ['<loose>']}
  - {'signature': ['<loose>']}

## BM-168

- Contract sections: 2
- BESPOKE sections: 2
- Matching sections: 0
- Contract only (missing in BESPOKE): ['Template', 'Mapping']
- BESPOKE only (extra): ['agency', 'caseFileHandover']

## Tổng kết
- Tổng file so sánh: 21
- Match hoàn toàn: 0
- Có khác biệt: 21