# Verify 145 BESPOKE forms vs DOCX

## Tổng quan
- BESPOKE files: 145
- Có contract: 6
- Không có contract: 139

## Stats per file

| BM | Group | Sections | Fields | Contract | Status |
|---|---|---|---|---|---|
| BM-001 | 01_TIEP_NHAN | 7 | 35 | ✓ | extra_groups=['reception', 'receiver', 'informant', 'crimeReport'] |
| BM-002 | 01_TIEP_NHAN | 8 | 36 | ✗ | extra_groups=['receiver', 'sourceReport', 'sourceTransfer', 'reporter'] |
| BM-003 | 01_TIEP_NHAN | 7 | 25 | ✗ | extra_groups=['official', 'legalBasis', 'sourceAssignment'] |
| BM-004 | 01_TIEP_NHAN | 6 | 23 | ✗ | extra_groups=['official', 'assignment'] |
| BM-005 | 01_TIEP_NHAN | 7 | 23 | ✗ | extra_groups=['official', 'sourceVerification', 'receiver'] |
| BM-006 | 01_TIEP_NHAN | 6 | 19 | ✗ | extra_groups=['official', 'sourceRequest'] |
| BM-007 | 01_TIEP_NHAN | 7 | 25 | ✗ | extra_groups=['official', 'legalBasis', 'sourceMaterialRequest'] |
| BM-008 | 01_TIEP_NHAN | 6 | 17 | ✗ | extra_groups=['official', 'sourceTransfer'] |
| BM-009 | 01_TIEP_NHAN | 6 | 20 | ✗ | extra_groups=['official', 'sourceResolutionExtension'] |
| BM-010 | 01_TIEP_NHAN | 6 | 19 | ✗ | extra_groups=['official', 'sourceSuspension'] |
| BM-011 | 01_TIEP_NHAN | 7 | 24 | ✗ | extra_groups=['official', 'legalBasis', 'sourceSuspensionCancellation'] |
| BM-012 | 01_TIEP_NHAN | 6 | 19 | ✗ | extra_groups=['official', 'sourceRecovery'] |
| BM-013 | 01_TIEP_NHAN | 6 | 21 | ✗ | extra_groups=['official', 'jurisdictionDispute'] |
| BM-014 | 01_TIEP_NHAN | 7 | 27 | ✗ | extra_groups=['official', 'legalBasis', 'sourceDirectInspection'] |
| BM-015 | 01_TIEP_NHAN | 5 | 40 | ✗ | extra_groups=['sourceDirectInspectionPlan'] |
| BM-016 | 01_TIEP_NHAN | 6 | 37 | ✗ | extra_groups=['legalBasis', 'sourceDirectInspectionConclusion'] |
| BM-017 | 01_TIEP_NHAN | 6 | 17 | ✗ | extra_groups=['official', 'caseInitiationRequest'] |
| BM-018 | 01_TIEP_NHAN | 7 | 26 | ✗ | extra_groups=['official', 'legalBasis', 'caseInitiationChangeRequest'] |
| BM-019 | 01_TIEP_NHAN | 6 | 22 | ✗ | extra_groups=['official', 'initiationRequest'] |
| BM-020 | 01_TIEP_NHAN | 6 | 22 | ✗ | extra_groups=['official', 'initiationRequest'] |
| BM-021 | 01_TIEP_NHAN | 7 | 16 | ✗ | extra_groups=['legalBasis', 'decision'] |
| BM-022 | 01_TIEP_NHAN | 7 | 16 | ✗ | extra_groups=['legalBasis', 'decision'] |
| BM-023 | 01_TIEP_NHAN | 10 | 0 | ✓ | extra_groups=['official', 'legalBasis', 'crimeReport', 'investigation'] |
| BM-024 | 01_TIEP_NHAN | 7 | 16 | ✗ | extra_groups=['legalBasis', 'decision'] |
| BM-025 | 01_TIEP_NHAN | 7 | 16 | ✗ | extra_groups=['legalBasis', 'decision'] |
| BM-026 | 01_TIEP_NHAN | 7 | 16 | ✗ | extra_groups=['legalBasis', 'decision'] |
| BM-029 | 01_TIEP_NHAN | 6 | 22 | ✗ | extra_groups=['official', 'supplementaryDecision'] |
| BM-030 | 01_TIEP_NHAN | 6 | 22 | ✗ | extra_groups=['legalBasis', 'sourceResolutionNotice'] |
| BM-031 | 02_BP_NGAN_CHAN | 8 | 0 | ✗ | extra_groups=['legalBasis', 'principal', 'measure'] |
| BM-032 | 02_BP_NGAN_CHAN | 7 | 16 | ✗ | extra_groups=['legalBasis', 'decision'] |
| BM-033 | 02_BP_NGAN_CHAN | 8 | 31 | ✓ | extra_groups=['investigation', 'legalBasis', 'custody'] |
| BM-034 | 02_BP_NGAN_CHAN | 7 | 16 | ✗ | extra_groups=['legalBasis', 'decision'] |
| BM-035 | 02_BP_NGAN_CHAN | 7 | 16 | ✗ | extra_groups=['legalBasis', 'decision'] |
| BM-036 | 02_BP_NGAN_CHAN | 7 | 16 | ✗ | extra_groups=['legalBasis', 'decision'] |
| BM-037 | 02_BP_NGAN_CHAN | 10 | 0 | ✗ | extra_groups=['legalBasis', 'caseDecision', 'accusedDecision', 'principal', 'measure'] |
| BM-038 | 02_BP_NGAN_CHAN | 9 | 32 | ✗ | extra_groups=['investigation', 'legalBasis', 'arrestNonApproval'] |
| BM-039 | 02_BP_NGAN_CHAN | 6 | 50 | ✗ | extra_groups=['legalBasis', 'detentionArrest'] |
| BM-040 | 02_BP_NGAN_CHAN | 10 | 0 | ✗ | extra_groups=['legalBasis', 'caseDecision', 'accusedDecision', 'measure', 'principal'] |
| BM-041 | 02_BP_NGAN_CHAN | 7 | 16 | ✗ | extra_groups=['legalBasis', 'decision'] |
| BM-042 | 02_BP_NGAN_CHAN | 7 | 0 | ✗ | extra_groups=['official', 'legalBasis', 'measure'] |
| BM-043 | 02_BP_NGAN_CHAN | 7 | 0 | ✗ | extra_groups=['official', 'legalBasis', 'measure'] |
| BM-044 | 02_BP_NGAN_CHAN | 6 | 40 | ✗ | extra_groups=['legalBasis', 'detentionReplacement'] |
| BM-045 | 02_BP_NGAN_CHAN | 6 | 34 | ✗ | extra_groups=['legalBasis', 'bailApproval'] |
| BM-046 | 02_BP_NGAN_CHAN | 7 | 34 | ✗ | extra_groups=['official', 'legalBasis', 'guaranteeNonApproval'] |
| BM-047 | 02_BP_NGAN_CHAN | 8 | 50 | ✗ | extra_groups=['official', 'legalBasis', 'guaranteeApproval', 'defendant'] |
| BM-053 | 02_BP_NGAN_CHAN | 12 | 55 | ✗ | extra_groups=['official', 'caseDecision', 'accusedDecision', 'measure', 'monitoring', 'delivery'] |
| BM-054 | 02_BP_NGAN_CHAN | 11 | 0 | ✗ | extra_groups=['caseDecision', 'accusedDecision', 'measure', 'monitoring', 'notification'] |
| BM-055 | 02_BP_NGAN_CHAN | 11 | 0 | ✗ | extra_groups=['caseDecision', 'accusedDecision', 'measure', 'monitoring', 'notification'] |
| BM-056 | 02_BP_NGAN_CHAN | 8 | 0 | ✗ | extra_groups=['official', 'measure', 'monitoring'] |
| BM-057 | 02_BP_NGAN_CHAN | 7 | 0 | ✗ | extra_groups=['official', 'measure'] |
| BM-058 | 02_BP_NGAN_CHAN | 11 | 0 | ✗ | extra_groups=['official', 'caseDecision', 'accusedDecision', 'investigation', 'measure', 'delivery'] |
| BM-059 | 02_BP_NGAN_CHAN | 12 | 0 | ✗ | extra_groups=['official', 'legalBasis', 'caseDecision', 'accusedDecision', 'investigation', 'measure', 'delivery'] |
| BM-070 | 03_NGUOI_THAM_GIA | 1 | 24 | ✓ | extra_groups=['_flat'] |
| BM-071 | 03_NGUOI_THAM_GIA | 1 | 27 | ✗ | extra_groups=['_flat'] |
| BM-072 | 03_NGUOI_THAM_GIA | 8 | 0 | ✗ | extra_groups=['caseInfo', 'changeInfo', 'legalBasis', 'measure'] |
| BM-074 | 03_NGUOI_THAM_GIA | 6 | 0 | ✗ | extra_groups=['request', 'interpreter'] |
| BM-076 | 03_NGUOI_THAM_GIA | 8 | 0 | ✗ | extra_groups=['caseInfo', 'changeInfo', 'legalBasis', 'measure'] |
| BM-078 | 03_NGUOI_THAM_GIA | 5 | 0 | ✗ | extra_groups=['notification'] |
| BM-081 | 03_NGUOI_THAM_GIA | 8 | 0 | ✗ | extra_groups=['caseInfo', 'defenseLawyer', 'legalBasis', 'measure'] |
| BM-083 | 03_NGUOI_THAM_GIA | 7 | 0 | ✗ | extra_groups=['request', 'caseInfo', 'expert'] |
| BM-084 | 03_NGUOI_THAM_GIA | 8 | 0 | ✗ | extra_groups=['caseInfo', 'changeInfo', 'legalBasis', 'measure'] |
| BM-085 | 04_DIEU_TRA | 6 | 11 | ✗ | extra_groups=['official', 'caseInvestigationTransfer'] |
| BM-086 | 04_DIEU_TRA | 7 | 28 | ✗ | extra_groups=['official', 'legalBasis', 'prosecutionJurisdictionTransfer'] |
| BM-087 | 04_DIEU_TRA | 6 | 15 | ✗ | extra_groups=['official', 'investigationRequest'] |
| BM-088 | 04_DIEU_TRA | 6 | 17 | ✗ | extra_groups=['official', 'cancelledDecision'] |
| BM-089 | 04_DIEU_TRA | 6 | 17 | ✗ | extra_groups=['official', 'cancelledDecision'] |
| BM-090 | 04_DIEU_TRA | 1 | 30 | ✗ | extra_groups=['_flat'] |
| BM-091 | 04_DIEU_TRA | 6 | 11 | ✗ | extra_groups=['official', 'decisionAmendmentApproval'] |
| BM-092 | 04_DIEU_TRA | 6 | 11 | ✗ | extra_groups=['official', 'decisionSupplementApproval'] |
| BM-093 | 04_DIEU_TRA | 6 | 11 | ✗ | extra_groups=['official', 'cancelledDecision'] |
| BM-094 | 04_DIEU_TRA | 6 | 11 | ✗ | extra_groups=['official', 'cancelledDecision'] |
| BM-095 | 04_DIEU_TRA | 6 | 11 | ✗ | extra_groups=['official', 'cancelledDecision'] |
| BM-096 | 04_DIEU_TRA | 6 | 11 | ✗ | extra_groups=['official', 'request'] |
| BM-097 | 04_DIEU_TRA | 9 | 47 | ✗ | extra_groups=['official', 'caseDecision', 'accusedDecision'] |
| BM-098 | 04_DIEU_TRA | 6 | 12 | ✗ | extra_groups=['official', 'request'] |
| BM-099 | 04_DIEU_TRA | 6 | 11 | ✗ | extra_groups=['official', 'decisionChange'] |
| BM-100 | 04_DIEU_TRA | 6 | 12 | ✗ | extra_groups=['official', 'request'] |
| BM-101 | 04_DIEU_TRA | 6 | 11 | ✗ | extra_groups=['official', 'decisionSupplement'] |
| BM-102 | 04_DIEU_TRA | 6 | 11 | ✗ | extra_groups=['official', 'decisionCancel'] |
| BM-103 | 04_DIEU_TRA | 6 | 11 | ✓ | extra_groups=['official', 'cancelledDecision'] |
| BM-104 | 04_DIEU_TRA | 6 | 10 | ✗ | extra_groups=['official', 'cancelledDecision'] |
| BM-105 | 04_DIEU_TRA | 6 | 10 | ✗ | extra_groups=['official', 'decision'] |
| BM-106 | 04_DIEU_TRA | 6 | 9 | ✗ | extra_groups=['official', 'decision'] |
| BM-107 | 04_DIEU_TRA | 6 | 9 | ✗ | extra_groups=['official', 'decision'] |
| BM-108 | 04_DIEU_TRA | 6 | 10 | ✗ | extra_groups=['official', 'cancelledDecision'] |
| BM-109 | 04_DIEU_TRA | 6 | 10 | ✗ | extra_groups=['official', 'cancelledDecision'] |
| BM-110 | 04_DIEU_TRA | 6 | 10 | ✗ | extra_groups=['official', 'cancelledDecision'] |
| BM-111 | 04_DIEU_TRA | 6 | 11 | ✗ | extra_groups=['official', 'decision'] |
| BM-112 | 04_DIEU_TRA | 6 | 11 | ✗ | extra_groups=['official', 'decision'] |
| BM-113 | 04_DIEU_TRA | 6 | 11 | ✗ | extra_groups=['official', 'detentionExtension'] |
| BM-114 | 04_DIEU_TRA | 6 | 10 | ✗ | extra_groups=['official', 'defender'] |
| BM-115 | 04_DIEU_TRA | 6 | 11 | ✗ | extra_groups=['official', 'interpreter'] |
| BM-116 | 04_DIEU_TRA | 6 | 12 | ✗ | extra_groups=['official', 'decision'] |
| BM-117 | 04_DIEU_TRA | 6 | 11 | ✗ | extra_groups=['official', 'decision'] |
| BM-118 | 04_DIEU_TRA | 6 | 10 | ✗ | extra_groups=['official', 'decision'] |
| BM-119 | 04_DIEU_TRA | 6 | 12 | ✗ | extra_groups=['official', 'decision'] |
| BM-120 | 04_DIEU_TRA | 6 | 12 | ✗ | extra_groups=['official', 'decision'] |
| BM-121 | 04_DIEU_TRA | 6 | 11 | ✗ | extra_groups=['official', 'measureChange'] |
| BM-122 | 04_DIEU_TRA | 6 | 12 | ✗ | extra_groups=['official', 'decision'] |
| BM-123 | 04_DIEU_TRA | 6 | 11 | ✗ | extra_groups=['official', 'propertyReturn'] |
| BM-124 | 04_DIEU_TRA | 6 | 16 | ✗ | extra_groups=['official', 'experiment'] |
| BM-125 | 04_DIEU_TRA | 6 | 10 | ✗ | extra_groups=['official', 'notification'] |
| BM-126 | 04_DIEU_TRA | 6 | 13 | ✗ | extra_groups=['official', 'decision'] |
| BM-127 | 04_DIEU_TRA | 6 | 10 | ✗ | extra_groups=['official', 'request'] |
| BM-128 | 04_DIEU_TRA | 6 | 10 | ✗ | extra_groups=['official', 'measureCancellation'] |
| BM-129 | 04_DIEU_TRA | 6 | 12 | ✗ | extra_groups=['official', 'decision'] |
| BM-130 | 04_DIEU_TRA | 6 | 13 | ✗ | extra_groups=['official', 'decision'] |
| BM-131 | 04_DIEU_TRA | 6 | 12 | ✗ | extra_groups=['official', 'request'] |
| BM-132 | 04_DIEU_TRA | 6 | 14 | ✗ | extra_groups=['official', 'decision'] |
| BM-133 | 04_DIEU_TRA | 6 | 14 | ✗ | extra_groups=['official', 'decision'] |
| BM-134 | 04_DIEU_TRA | 6 | 12 | ✗ | extra_groups=['official', 'decision'] |
| BM-135 | 04_DIEU_TRA | 6 | 11 | ✗ | extra_groups=['official', 'decision'] |
| BM-136 | 04_DIEU_TRA | 6 | 10 | ✗ | extra_groups=['official', 'moneyDeposit'] |
| BM-137 | 04_DIEU_TRA | 4 | 17 | ✗ | extra_groups=['verification', 'participants'] |
| BM-138 | 04_DIEU_TRA | 6 | 11 | ✗ | extra_groups=['official', 'residenceBan'] |
| BM-139 | 04_DIEU_TRA | 6 | 11 | ✗ | extra_groups=['official', 'surety'] |
| BM-140 | 04_DIEU_TRA | 6 | 14 | ✗ | extra_groups=['official', 'suggestion'] |
| BM-141 | 05_TRUY_TO | 6 | 20 | ✗ | extra_groups=['official', 'prosecutionTransfer'] |
| BM-142 | 05_TRUY_TO | 6 | 14 | ✗ | extra_groups=['legalBasis'] |
| BM-143 | 05_TRUY_TO | 6 | 16 | ✗ | extra_groups=['legalBasis'] |
| BM-144 | 05_TRUY_TO | 6 | 19 | ✗ | extra_groups=['official', 'prosecutionExtension'] |
| BM-145 | 05_TRUY_TO | 1 | 20 | ✗ | extra_groups=['_flat'] |
| BM-146 | 05_TRUY_TO | 1 | 13 | ✗ | extra_groups=['_flat'] |
| BM-147 | 05_TRUY_TO | 7 | 15 | ✗ | extra_groups=['official', 'legalBasis'] |
| BM-148 | 05_TRUY_TO | 11 | 0 | ✗ | extra_groups=['official', 'helper', 'legalBasis', 'caseDecision', 'accusedDecision', 'suspension'] |
| BM-149 | 05_TRUY_TO | 7 | 16 | ✗ | extra_groups=['official', 'legalBasis'] |
| BM-150 | 05_TRUY_TO | 1 | 36 | ✗ | extra_groups=['_flat'] |
| BM-151 | 05_TRUY_TO | 7 | 15 | ✗ | extra_groups=['official', 'legalBasis'] |
| BM-152 | 05_TRUY_TO | 7 | 17 | ✗ | extra_groups=['official', 'legalBasis'] |
| BM-153 | 05_TRUY_TO | 7 | 16 | ✗ | extra_groups=['official', 'legalBasis'] |
| BM-154 | 05_TRUY_TO | 7 | 15 | ✗ | extra_groups=['official', 'legalBasis'] |
| BM-155 | 05_TRUY_TO | 7 | 15 | ✗ | extra_groups=['official', 'legalBasis'] |
| BM-156 | 05_TRUY_TO | 13 | 0 | ✓ | extra_groups=['caseInfo', 'official', 'legalBasis', 'caseDecision', 'accusedDecision', 'caseJoinder', 'caseRecovery', 'investigationConclusion', 'indictment'] |
| BM-157 | 05_TRUY_TO | 9 | 12 | ✗ | extra_groups=['official', 'legalBasis', 'indictment', 'evidence'] |
| BM-158 | 05_TRUY_TO | 8 | 14 | ✗ | extra_groups=['official', 'legalBasis', 'summons'] |
| BM-159 | 05_TRUY_TO | 7 | 19 | ✗ | extra_groups=['official', 'legalBasis', 'subordinateProcuracyTrialAssignment'] |
| BM-160 | 05_TRUY_TO | 6 | 13 | ✗ | extra_groups=['official'] |
| BM-161 | 05_TRUY_TO | 6 | 13 | ✗ | extra_groups=['official'] |
| BM-166 | 05_TRUY_TO | 7 | 0 | ✗ | extra_groups=['official', 'legalBasis', 'returnInvestigation'] |
| BM-168 | 05_TRUY_TO | 2 | 19 | ✗ | extra_groups=['caseFileHandover'] |
| BM-169 | 06_VAT_CHUNG | 8 | 0 | ✗ | extra_groups=['official', 'legalBasis', 'caseDecision', 'accusedDecision'] |
| BM-170 | 06_VAT_CHUNG | 7 | 32 | ✗ | extra_groups=['official', 'legalBasis', 'evidenceHandlingCancellation'] |
| BM-171 | 06_VAT_CHUNG | 9 | 0 | ✗ | extra_groups=['official', 'legalBasis', 'caseDecision', 'accusedDecision', 'assetOwner'] |
| BM-172 | 06_VAT_CHUNG | 1 | 44 | ✗ | extra_groups=['_flat'] |
| BM-173 | 06_VAT_CHUNG | 7 | 0 | ✗ | extra_groups=['official', 'legalBasis', 'evidenceTransfer'] |

## Tổng kết
- Sections trung bình: 6.5
- Fields trung bình: 15.3
- Có contract: 6/145
- Không có contract: 139/145