# BESPOKE vs DOCX Contract — Comparison Report

Sinh lúc: 2026-06-19T07:39:34.644Z

## Tổng quan

- Tổng BESPOKE files: **213**
- Có contract tương ứng: **213**
- Không có contract: **0**
- Dùng GenericTemplateFormInputsPanel (stub): **68**
- Tổng field tương đương (slot coverage OK): **35**
- Tổng field nghi ngờ thiếu trong BESPOKE: **1486**
- Tổng field thừa/suspicious trong BESPOKE: **1336**
- Tổng UI gene violation: **481**

## UI Gene Violations (top 30)

| BM | File | Violations |
|---|---|---|
| BM-003 | apps/web/src/components/documents/bm-003-form-inputs.tsx | local-inputClass, local-textareaClass, local-labelClass, local-SectionCard-component, local-Field-component, local-TextAreaField-component, local-StatusMessage-component, direct-fetch, API_BASE_URL, bg-slate-950-custom, bg-blue-50-custom |
| BM-006 | apps/web/src/components/documents/bm-006-form-inputs.tsx | local-inputClass, local-textareaClass, local-labelClass, local-SectionCard-component, local-Field-component, local-TextAreaField-component, local-StatusMessage-component, direct-fetch, API_BASE_URL, bg-slate-950-custom, bg-blue-50-custom |
| BM-007 | apps/web/src/components/documents/bm-007-form-inputs.tsx | local-inputClass, local-textareaClass, local-labelClass, local-SectionCard-component, local-Field-component, local-TextAreaField-component, local-StatusMessage-component, direct-fetch, API_BASE_URL, bg-slate-950-custom, bg-blue-50-custom |
| BM-011 | apps/web/src/components/documents/bm-011-form-inputs.tsx | local-inputClass, local-textareaClass, local-labelClass, local-SectionCard-component, local-Field-component, local-TextAreaField-component, local-StatusMessage-component, direct-fetch, API_BASE_URL, bg-slate-950-custom, bg-blue-50-custom |
| BM-014 | apps/web/src/components/documents/bm-014-form-inputs.tsx | local-inputClass, local-textareaClass, local-labelClass, local-SectionCard-component, local-Field-component, local-TextAreaField-component, local-StatusMessage-component, direct-fetch, API_BASE_URL, bg-slate-950-custom, bg-blue-50-custom |
| BM-016 | apps/web/src/components/documents/bm-016-form-inputs.tsx | local-inputClass, local-textareaClass, local-labelClass, local-SectionCard-component, local-Field-component, local-TextAreaField-component, local-StatusMessage-component, direct-fetch, API_BASE_URL, bg-slate-950-custom, bg-blue-50-custom |
| BM-018 | apps/web/src/components/documents/bm-018-form-inputs.tsx | local-inputClass, local-textareaClass, local-labelClass, local-SectionCard-component, local-Field-component, local-TextAreaField-component, local-StatusMessage-component, direct-fetch, API_BASE_URL, bg-slate-950-custom, bg-blue-50-custom |
| BM-046 | apps/web/src/components/documents/bm-046-form-inputs.tsx | local-inputClass, local-textareaClass, local-labelClass, local-SectionCard-component, local-Field-component, local-TextAreaField-component, local-StatusMessage-component, direct-fetch, API_BASE_URL, bg-slate-950-custom, bg-blue-50-custom |
| BM-086 | apps/web/src/components/documents/bm-086-form-inputs.tsx | local-inputClass, local-textareaClass, local-labelClass, local-SectionCard-component, local-Field-component, local-TextAreaField-component, local-StatusMessage-component, direct-fetch, API_BASE_URL, bg-slate-950-custom, bg-blue-50-custom |
| BM-170 | apps/web/src/components/documents/bm-170-form-inputs.tsx | local-inputClass, local-textareaClass, local-labelClass, local-SectionCard-component, local-Field-component, local-TextAreaField-component, local-StatusMessage-component, direct-fetch, API_BASE_URL, bg-slate-950-custom, bg-blue-50-custom |
| BM-002 | apps/web/src/components/documents/bm-002-form-inputs.tsx | local-inputClass, local-textareaClass, local-labelClass, local-Section-component, local-Field-component, direct-fetch, API_BASE_URL, bg-slate-950-custom |
| BM-008 | apps/web/src/components/documents/bm-008-form-inputs.tsx | local-inputClass, local-textareaClass, local-labelClass, local-Section-component, local-Field-component, direct-fetch, API_BASE_URL, bg-slate-950-custom |
| BM-012 | apps/web/src/components/documents/bm-012-form-inputs.tsx | local-inputClass, local-textareaClass, local-labelClass, local-Section-component, local-Field-component, direct-fetch, API_BASE_URL, bg-slate-950-custom |
| BM-015 | apps/web/src/components/documents/bm-015-form-inputs.tsx | local-inputClass, local-textareaClass, local-labelClass, local-StatusMessage-component, direct-fetch, API_BASE_URL, bg-slate-950-custom, bg-blue-50-custom |
| BM-030 | apps/web/src/components/documents/bm-030-form-inputs.tsx | local-inputClass, local-textareaClass, local-labelClass, local-StatusMessage-component, direct-fetch, API_BASE_URL, bg-slate-950-custom, bg-blue-50-custom |
| BM-150 | apps/web/src/components/documents/bm-150-form-inputs.tsx | local-inputClass, local-Section-component, local-Field-component, direct-fetch, API_BASE_URL, bg-slate-950-custom |
| BM-009 | apps/web/src/components/documents/bm-009-form-inputs.tsx | local-SectionCard-component, local-Field-component, direct-fetch, API_BASE_URL, bg-blue-50-custom |
| BM-023 | apps/web/src/components/documents/bm-023-form-inputs.tsx | local-SectionCard-component, local-Field-component, direct-fetch, API_BASE_URL, bg-slate-950-custom |
| BM-054 | apps/web/src/components/documents/bm-054-form-inputs.tsx | local-SectionCard-component, local-Field-component, direct-fetch, API_BASE_URL, bg-slate-950-custom |
| BM-055 | apps/web/src/components/documents/bm-055-form-inputs.tsx | local-SectionCard-component, local-Field-component, direct-fetch, API_BASE_URL, bg-slate-950-custom |
| BM-058 | apps/web/src/components/documents/bm-058-form-inputs.tsx | local-SectionCard-component, local-Field-component, direct-fetch, API_BASE_URL, bg-slate-950-custom |
| BM-047 | apps/web/src/components/documents/bm-047-form-inputs.tsx | direct-fetch, API_BASE_URL, bg-slate-950-custom, bg-blue-50-custom |
| BM-056 | apps/web/src/components/documents/bm-056-form-inputs.tsx | local-Field-component, direct-fetch, API_BASE_URL, bg-slate-950-custom |
| BM-057 | apps/web/src/components/documents/bm-057-form-inputs.tsx | local-Field-component, direct-fetch, API_BASE_URL, bg-slate-950-custom |
| BM-070 | apps/web/src/components/documents/bm-070-form-inputs.tsx | direct-fetch, API_BASE_URL, bg-slate-950-custom, bg-blue-50-custom |
| BM-148 | apps/web/src/components/documents/bm-148-form-inputs.tsx | local-Field-component, direct-fetch, API_BASE_URL, bg-slate-950-custom |
| BM-166 | apps/web/src/components/documents/bm-166-form-inputs.tsx | local-Field-component, direct-fetch, API_BASE_URL, bg-slate-950-custom |
| BM-169 | apps/web/src/components/documents/bm-169-form-inputs.tsx | local-Field-component, direct-fetch, API_BASE_URL, bg-slate-950-custom |
| BM-171 | apps/web/src/components/documents/bm-171-form-inputs.tsx | local-Field-component, direct-fetch, API_BASE_URL, bg-slate-950-custom |
| BM-172 | apps/web/src/components/documents/bm-172-form-inputs.tsx | local-Section-component, local-TextAreaField-component, bg-slate-950-custom, bg-blue-50-custom |

## Missing fields vs DOCX contract (top 30)

Cảnh báo: BESPOKE không cover field mà contract đề xuất.

| BM | Missing fields |
|---|---|
| BM-004 | document.issueDate, document.field6, document.field7, agency.field8, agency.field9, document.field10, document.field11, document.field12, document.field13, document.field14 … |
| BM-167 | document.issueDate, agency.field6, agency.field7, document.field8, document.field9, document.field10, document.field11, document.field12, document.field13, document.field14 … |
| BM-001 | document.issuePlaceDateLine, receiver.fullName, receiver.positionTitle, receiver.departmentName, informant.fullName, informant.genderLabel, informant.otherName, informant.birthDay, informant.birthMonth, informant.birthYear … |
| BM-068 | informant.birthDate, informant.idDocument.issueDate, document.field7, document.field8, agency.field9, document.field10, informant.field11, informant.field12, document.field13, document.issueDate … |
| BM-184 | informant.birthDate, informant.idDocument.issueDate, document.field7, document.field8, document.field9, document.field10, decision.field11, document.field12, document.field13, document.field14 … |
| BM-062 | informant.birthDate, informant.idDocument.issueDate, document.field7, agency.field8, decision.field9, decision.field10, informant.field11, informant.field12, document.field13, document.issueDate … |
| BM-063 | informant.birthDate, informant.idDocument.issueDate, document.field7, document.field8, document.field9, document.field10, document.field11, document.field12, document.field13, document.field14 … |
| BM-191 | informant.birthDate, informant.idDocument.issueDate, document.field7, agency.field8, informant.field9, document.field10, document.issueDate, document.issuePlace, informant.field12, informant.field13 … |
| BM-196 | informant.birthDate, informant.idDocument.issueDate, document.field7, agency.field8, informant.field9, document.field10, document.issueDate, document.issuePlace, informant.field12, informant.field13 … |
| BM-209 | informant.idDocument.issueDate, document.field4, agency.field5, informant.field6, document.field7, document.field8, document.field9, document.field10, informant.field11, informant.field12 … |
| BM-060 | informant.birthDate, informant.idDocument.issueDate, document.dateCandidate, document.field9, document.field10, decision.field11, document.field12, document.issueDate, document.issuePlace, informant.field14 … |
| BM-190 | informant.birthDate, informant.idDocument.issueDate, document.field6, informant.field7, document.field8, document.issueDate, document.issuePlace, informant.field10, informant.field11, informant.field12 … |
| BM-192 | informant.birthDate, informant.idDocument.issueDate, document.field7, agency.field8, informant.field9, document.field10, document.issueDate, document.issuePlace, informant.field12, informant.field13 … |
| BM-203 | informant.birthDate, informant.idDocument.issueDate, document.field7, document.field8, document.field9, document.issueDate, document.issuePlace, informant.field11, informant.field12, informant.field13 … |
| BM-096 | informant.birthDate, informant.idDocument.issueDate, document.field7, document.field8, document.field9, informant.field10, document.field11, document.issueDate, document.issuePlace, informant.field13 … |
| BM-097 | informant.birthDate, informant.idDocument.issueDate, document.field7, document.field8, informant.field9, document.field10, document.issueDate, document.issuePlace, informant.field12, informant.field13 … |
| BM-135 | informant.birthDate, informant.idDocument.issueDate, document.field7, receiver.field8, document.field9, document.field10, document.field11, informant.field12, document.issueDate, document.issuePlace … |
| BM-136 | informant.birthDate, informant.idDocument.issueDate, document.field13, informant.field14, document.issueDate, document.issuePlace, informant.field16, informant.field17, document.field19, informant.field20 … |
| BM-155 | informant.birthDate, informant.idDocument.issueDate, document.field7, agency.field8, document.field9, informant.field10, document.issueDate, document.issuePlace, informant.field12, informant.field13 … |
| BM-193 | informant.birthDate, informant.idDocument.issueDate, document.field7, agency.field8, informant.field9, document.field10, document.issueDate, document.issuePlace, informant.field12, informant.field13 … |
| BM-211 | informant.birthDate, informant.idDocument.issueDate, document.field7, document.field8, document.field9, document.issueDate, document.issuePlace, informant.field11, informant.field12, informant.field13 … |
| BM-036 | informant.birthDate, informant.idDocument.issueDate, document.field7, decision.field8, document.field9, document.field10, informant.field11, document.issueDate, document.issuePlace, informant.field13 … |
| BM-066 | informant.birthDate, informant.idDocument.issueDate, document.field7, document.field8, agency.field9, document.field10, document.field11, document.issueDate, document.issuePlace, informant.field13 … |
| BM-069 | informant.birthDate, informant.idDocument.issueDate, document.field7, document.field8, document.field9, document.field10, document.issueDate, document.issuePlace, informant.field12, informant.field13 … |
| BM-137 | document.dateCandidate, document.completedAt, document.field7, document.issueDate, document.issuePlace, document.field9, document.field10, document.field11, document.field13, document.field14 … |
| BM-158 | document.issueDate, agency.field3, document.field4, document.field5, document.field6, document.field7, document.field8, document.field9, document.field10, document.field11 … |
| BM-174 | informant.birthDate, informant.idDocument.issueDate, document.field7, agency.field8, document.field9, document.field10, document.field11, document.issueDate, document.issuePlace, informant.field13 … |
| BM-186 | informant.birthDate, informant.idDocument.issueDate, document.field7, document.field8, informant.field9, document.field10, document.issueDate, document.issuePlace, informant.field12, informant.field13 … |
| BM-207 | informant.birthDate, informant.idDocument.issueDate, document.field7, agency.field8, document.field9, informant.field10, document.field11, document.issueDate, document.issuePlace, informant.field13 … |
| BM-208 | informant.birthDate, informant.idDocument.issueDate, document.field7, agency.field8, document.field9, informant.field10, document.field11, document.issueDate, document.issuePlace, informant.field13 … |

## Per-BM comparison

| BM | Field count | Equivalent | Missing | Extra | Gene | Stub |
|---|---:|---:|---:|---:|---:|:-:|
| BM-001 | 0 | 0 | 28 | 0 | 1 | no |
| BM-002 | 32 | 27 | 2 | 5 | 8 | no |
| BM-003 | 11 | 8 | 2 | 3 | 11 | no |
| BM-004 | 19 | 0 | 46 | 19 | 3 | no |
| BM-005 | 9 | 0 | 3 | 9 | 3 | no |
| BM-006 | 9 | 0 | 3 | 9 | 11 | no |
| BM-007 | 10 | 0 | 8 | 10 | 11 | no |
| BM-008 | 8 | 0 | 4 | 8 | 8 | no |
| BM-009 | 8 | 0 | 12 | 8 | 5 | no |
| BM-010 | 8 | 0 | 2 | 8 | 2 | no |
| BM-011 | 12 | 0 | 4 | 12 | 11 | no |
| BM-012 | 8 | 0 | 4 | 8 | 8 | no |
| BM-013 | 10 | 0 | 5 | 10 | 3 | no |
| BM-014 | 12 | 0 | 5 | 12 | 11 | no |
| BM-015 | 11 | 0 | 2 | 11 | 8 | no |
| BM-016 | 12 | 0 | 2 | 12 | 11 | no |
| BM-017 | 11 | 0 | 3 | 11 | 3 | no |
| BM-018 | 11 | 0 | 3 | 11 | 11 | no |
| BM-019 | 12 | 0 | 5 | 12 | 3 | no |
| BM-020 | 11 | 0 | 3 | 11 | 3 | no |
| BM-021 | 16 | 0 | 3 | 16 | 2 | no |
| BM-022 | 16 | 0 | 4 | 16 | 2 | no |
| BM-023 | 0 | 0 | 6 | 0 | 5 | no |
| BM-024 | 16 | 0 | 6 | 16 | 2 | no |
| BM-025 | 16 | 0 | 2 | 16 | 2 | no |
| BM-026 | 16 | 0 | 4 | 16 | 2 | no |
| BM-027 | 0 | 0 | 2 | 0 | 0 | yes |
| BM-028 | 0 | 0 | 5 | 0 | 0 | yes |
| BM-029 | 10 | 0 | 3 | 10 | 3 | no |
| BM-030 | 11 | 0 | 3 | 11 | 8 | no |
| BM-031 | 15 | 0 | 4 | 15 | 1 | no |
| BM-032 | 16 | 0 | 3 | 16 | 2 | no |
| BM-033 | 16 | 0 | 4 | 16 | 3 | no |
| BM-034 | 16 | 0 | 3 | 16 | 2 | no |
| BM-035 | 16 | 0 | 4 | 16 | 2 | no |
| BM-036 | 16 | 0 | 13 | 16 | 2 | no |
| BM-037 | 17 | 0 | 4 | 17 | 3 | no |
| BM-038 | 14 | 0 | 5 | 14 | 3 | no |
| BM-039 | 18 | 0 | 10 | 18 | 3 | no |
| BM-040 | 1 | 0 | 5 | 1 | 3 | no |
| BM-041 | 16 | 0 | 3 | 16 | 2 | no |
| BM-042 | 17 | 0 | 4 | 17 | 3 | no |
| BM-043 | 14 | 0 | 4 | 14 | 3 | no |
| BM-044 | 15 | 0 | 2 | 15 | 3 | no |
| BM-045 | 15 | 0 | 3 | 15 | 3 | no |
| BM-046 | 14 | 0 | 3 | 14 | 11 | no |
| BM-047 | 13 | 0 | 9 | 13 | 4 | no |
| BM-048 | 0 | 0 | 8 | 0 | 0 | yes |
| BM-049 | 0 | 0 | 1 | 0 | 0 | yes |
| BM-050 | 0 | 0 | 2 | 0 | 0 | yes |
| BM-051 | 0 | 0 | 3 | 0 | 0 | yes |
| BM-052 | 0 | 0 | 9 | 0 | 0 | yes |
| BM-053 | 3 | 0 | 12 | 3 | 1 | no |
| BM-054 | 0 | 0 | 9 | 0 | 5 | no |
| BM-055 | 0 | 0 | 9 | 0 | 5 | no |
| BM-056 | 4 | 0 | 10 | 4 | 4 | no |
| BM-057 | 0 | 0 | 11 | 0 | 4 | no |
| BM-058 | 0 | 0 | 12 | 0 | 5 | no |
| BM-059 | 0 | 0 | 12 | 0 | 3 | no |
| BM-060 | 0 | 0 | 15 | 0 | 0 | yes |
| BM-061 | 0 | 0 | 8 | 0 | 0 | yes |
| BM-062 | 0 | 0 | 17 | 0 | 0 | yes |
| BM-063 | 0 | 0 | 17 | 0 | 0 | yes |
| BM-064 | 0 | 0 | 4 | 0 | 0 | yes |
| BM-065 | 0 | 0 | 11 | 0 | 0 | yes |
| BM-066 | 0 | 0 | 13 | 0 | 0 | yes |
| BM-067 | 0 | 0 | 9 | 0 | 0 | yes |
| BM-068 | 0 | 0 | 21 | 0 | 0 | yes |
| BM-069 | 0 | 0 | 13 | 0 | 0 | yes |
| BM-070 | 0 | 0 | 4 | 0 | 4 | no |
| BM-071 | 0 | 0 | 3 | 0 | 3 | no |
| BM-072 | 11 | 0 | 5 | 11 | 3 | no |
| BM-073 | 0 | 0 | 4 | 0 | 0 | yes |
| BM-074 | 10 | 0 | 5 | 10 | 3 | no |
| BM-075 | 0 | 0 | 6 | 0 | 0 | yes |
| BM-076 | 11 | 0 | 5 | 11 | 3 | no |
| BM-077 | 0 | 0 | 3 | 0 | 0 | yes |
| BM-078 | 10 | 0 | 7 | 10 | 3 | no |
| BM-079 | 0 | 0 | 2 | 0 | 0 | yes |
| BM-080 | 0 | 0 | 9 | 0 | 0 | yes |
| BM-081 | 11 | 0 | 3 | 11 | 3 | no |
| BM-082 | 0 | 0 | 4 | 0 | 0 | yes |
| BM-083 | 10 | 0 | 4 | 10 | 3 | no |
| BM-084 | 11 | 0 | 2 | 11 | 3 | no |
| BM-085 | 9 | 0 | 6 | 9 | 3 | no |
| BM-086 | 15 | 0 | 3 | 15 | 11 | no |
| BM-087 | 9 | 0 | 5 | 9 | 3 | no |
| BM-088 | 8 | 0 | 2 | 8 | 3 | no |
| BM-089 | 8 | 0 | 1 | 8 | 3 | no |
| BM-090 | 0 | 0 | 3 | 0 | 2 | no |
| BM-091 | 7 | 0 | 4 | 7 | 3 | no |
| BM-092 | 7 | 0 | 4 | 7 | 3 | no |
| BM-093 | 8 | 0 | 4 | 8 | 2 | no |
| BM-094 | 8 | 0 | 5 | 8 | 2 | no |
| BM-095 | 8 | 0 | 4 | 8 | 2 | no |
| BM-096 | 8 | 0 | 14 | 8 | 2 | no |
| BM-097 | 0 | 0 | 14 | 0 | 2 | no |
| BM-098 | 8 | 0 | 3 | 8 | 2 | no |
| BM-099 | 7 | 0 | 2 | 7 | 3 | no |
| BM-100 | 8 | 0 | 2 | 8 | 2 | no |
| BM-101 | 7 | 0 | 5 | 7 | 3 | no |
| BM-102 | 7 | 0 | 5 | 7 | 3 | no |
| BM-103 | 7 | 0 | 3 | 7 | 2 | no |
| BM-104 | 7 | 0 | 2 | 7 | 2 | no |
| BM-105 | 13 | 0 | 5 | 13 | 2 | no |
| BM-106 | 11 | 0 | 8 | 11 | 2 | no |
| BM-107 | 11 | 0 | 4 | 11 | 2 | no |
| BM-108 | 7 | 0 | 6 | 7 | 2 | no |
| BM-109 | 7 | 0 | 6 | 7 | 2 | no |
| BM-110 | 7 | 0 | 4 | 7 | 2 | no |
| BM-111 | 13 | 0 | 5 | 13 | 2 | no |
| BM-112 | 13 | 0 | 6 | 13 | 2 | no |
| BM-113 | 7 | 0 | 7 | 7 | 2 | no |
| BM-114 | 7 | 0 | 7 | 7 | 2 | no |
| BM-115 | 7 | 0 | 7 | 7 | 2 | no |
| BM-116 | 14 | 0 | 4 | 14 | 2 | no |
| BM-117 | 13 | 0 | 12 | 13 | 2 | no |
| BM-118 | 12 | 0 | 12 | 12 | 2 | no |
| BM-119 | 14 | 0 | 4 | 14 | 2 | no |
| BM-120 | 14 | 0 | 2 | 14 | 2 | no |
| BM-121 | 7 | 0 | 2 | 7 | 2 | no |
| BM-122 | 14 | 0 | 1 | 14 | 2 | no |
| BM-123 | 7 | 0 | 1 | 7 | 2 | no |
| BM-124 | 7 | 0 | 2 | 7 | 2 | no |
| BM-125 | 7 | 0 | 6 | 7 | 2 | no |
| BM-126 | 15 | 0 | 3 | 15 | 2 | no |
| BM-127 | 7 | 0 | 4 | 7 | 2 | no |
| BM-128 | 7 | 0 | 7 | 7 | 2 | no |
| BM-129 | 14 | 0 | 2 | 14 | 2 | no |
| BM-130 | 16 | 0 | 4 | 16 | 2 | no |
| BM-131 | 7 | 0 | 5 | 7 | 2 | no |
| BM-132 | 17 | 0 | 3 | 17 | 2 | no |
| BM-133 | 17 | 0 | 5 | 17 | 2 | no |
| BM-134 | 14 | 0 | 12 | 14 | 2 | no |
| BM-135 | 13 | 0 | 14 | 13 | 2 | no |
| BM-136 | 7 | 0 | 14 | 7 | 2 | no |
| BM-137 | 2 | 0 | 13 | 2 | 2 | no |
| BM-138 | 7 | 0 | 8 | 7 | 2 | no |
| BM-139 | 7 | 0 | 5 | 7 | 2 | no |
| BM-140 | 6 | 0 | 6 | 6 | 2 | no |
| BM-141 | 8 | 0 | 4 | 8 | 2 | no |
| BM-142 | 11 | 0 | 3 | 11 | 2 | no |
| BM-143 | 11 | 0 | 1 | 11 | 2 | no |
| BM-144 | 8 | 0 | 4 | 8 | 2 | no |
| BM-145 | 0 | 0 | 10 | 0 | 2 | no |
| BM-146 | 5 | 0 | 9 | 5 | 2 | no |
| BM-147 | 11 | 0 | 4 | 11 | 2 | no |
| BM-148 | 0 | 0 | 10 | 0 | 4 | no |
| BM-149 | 11 | 0 | 6 | 11 | 2 | no |
| BM-150 | 5 | 0 | 3 | 5 | 6 | no |
| BM-151 | 11 | 0 | 3 | 11 | 2 | no |
| BM-152 | 12 | 0 | 12 | 12 | 2 | no |
| BM-153 | 11 | 0 | 5 | 11 | 2 | no |
| BM-154 | 11 | 0 | 7 | 11 | 2 | no |
| BM-155 | 11 | 0 | 14 | 11 | 2 | no |
| BM-156 | 14 | 0 | 11 | 14 | 1 | no |
| BM-157 | 10 | 0 | 1 | 10 | 3 | no |
| BM-158 | 9 | 0 | 13 | 9 | 3 | no |
| BM-159 | 11 | 0 | 6 | 11 | 2 | no |
| BM-160 | 9 | 0 | 2 | 9 | 2 | no |
| BM-161 | 9 | 0 | 12 | 9 | 2 | no |
| BM-162 | 0 | 0 | 5 | 0 | 0 | yes |
| BM-163 | 0 | 0 | 5 | 0 | 0 | yes |
| BM-164 | 0 | 0 | 11 | 0 | 0 | yes |
| BM-165 | 0 | 0 | 1 | 0 | 0 | yes |
| BM-166 | 0 | 0 | 4 | 0 | 4 | no |
| BM-167 | 0 | 0 | 29 | 0 | 0 | yes |
| BM-168 | 3 | 0 | 3 | 3 | 2 | no |
| BM-169 | 0 | 0 | 6 | 0 | 4 | no |
| BM-170 | 11 | 0 | 3 | 11 | 11 | no |
| BM-171 | 0 | 0 | 10 | 0 | 4 | no |
| BM-172 | 0 | 0 | 9 | 0 | 4 | no |
| BM-173 | 0 | 0 | 6 | 0 | 4 | no |
| BM-174 | 0 | 0 | 13 | 0 | 0 | yes |
| BM-175 | 0 | 0 | 4 | 0 | 0 | yes |
| BM-176 | 0 | 0 | 8 | 0 | 0 | yes |
| BM-177 | 0 | 0 | 3 | 0 | 0 | yes |
| BM-178 | 0 | 0 | 4 | 0 | 0 | yes |
| BM-179 | 0 | 0 | 10 | 0 | 0 | yes |
| BM-180 | 0 | 0 | 12 | 0 | 0 | yes |
| BM-181 | 0 | 0 | 5 | 0 | 0 | yes |
| BM-182 | 0 | 0 | 3 | 0 | 0 | yes |
| BM-183 | 0 | 0 | 8 | 0 | 0 | yes |
| BM-184 | 0 | 0 | 18 | 0 | 0 | yes |
| BM-185 | 0 | 0 | 2 | 0 | 0 | yes |
| BM-186 | 0 | 0 | 13 | 0 | 0 | yes |
| BM-187 | 0 | 0 | 11 | 0 | 0 | yes |
| BM-188 | 0 | 0 | 12 | 0 | 0 | yes |
| BM-189 | 0 | 0 | 12 | 0 | 0 | yes |
| BM-190 | 0 | 0 | 15 | 0 | 0 | yes |
| BM-191 | 0 | 0 | 16 | 0 | 0 | yes |
| BM-192 | 0 | 0 | 15 | 0 | 0 | yes |
| BM-193 | 0 | 0 | 14 | 0 | 0 | yes |
| BM-194 | 0 | 0 | 2 | 0 | 0 | yes |
| BM-195 | 0 | 0 | 2 | 0 | 0 | yes |
| BM-196 | 0 | 0 | 16 | 0 | 0 | yes |
| BM-197 | 0 | 0 | 1 | 0 | 0 | yes |
| BM-198 | 0 | 0 | 4 | 0 | 0 | yes |
| BM-199 | 0 | 0 | 12 | 0 | 0 | yes |
| BM-200 | 0 | 0 | 2 | 0 | 0 | yes |
| BM-201 | 0 | 0 | 12 | 0 | 0 | yes |
| BM-202 | 0 | 0 | 4 | 0 | 0 | yes |
| BM-203 | 0 | 0 | 15 | 0 | 0 | yes |
| BM-204 | 0 | 0 | 9 | 0 | 0 | yes |
| BM-205 | 0 | 0 | 11 | 0 | 0 | yes |
| BM-206 | 0 | 0 | 12 | 0 | 0 | yes |
| BM-207 | 0 | 0 | 13 | 0 | 0 | yes |
| BM-208 | 0 | 0 | 13 | 0 | 0 | yes |
| BM-209 | 0 | 0 | 16 | 0 | 0 | yes |
| BM-210 | 0 | 0 | 12 | 0 | 0 | yes |
| BM-211 | 0 | 0 | 14 | 0 | 0 | yes |
| BM-212 | 0 | 0 | 10 | 0 | 0 | yes |
| BM-213 | 0 | 0 | 10 | 0 | 0 | yes |
