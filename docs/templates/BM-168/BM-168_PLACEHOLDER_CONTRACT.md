# BM-168 Placeholder Contract

## Template

- Code: BM-168
- Template no: 168/HS
- Name: Biên bản giao nhận hồ sơ vụ án, vụ việc
- Render scope: CASE_LEVEL
- Output strategy: ONE_FILE_PER_CASE
- Test generated document: document_id = 72

## Critical rules

BM-168 là biên bản giao nhận, không phải quyết định.
Không dùng signature.signMode / signature.positionTitle.
Không dùng prosecutionTransfer hoặc caseInvestigationTransfer.

Group riêng:

caseFileHandover.*

## Official placeholders

{{agency.parentName}}
{{agency.name}}

{{caseFileHandover.startedAtLine}}
{{caseFileHandover.giverName}}
{{caseFileHandover.giverPositionTitle}}
{{caseFileHandover.receiverName}}
{{caseFileHandover.receiverPositionTitle}}
{{caseFileHandover.caseFileTitle}}
{{caseFileHandover.handoverReasonLine}}
{{caseFileHandover.fileStatsLine}}
{{caseFileHandover.evidenceLine}}
{{caseFileHandover.endedAtLine}}
{{caseFileHandover.receiverSignerName}}
{{caseFileHandover.giverSignerName}}

## Mapping

VIỆN KIỂM SÁT cấp trên
=> {{agency.parentName}}

VIỆN KIỂM SÁT ban hành
=> {{agency.name}}

Vào hồi...
=> {{caseFileHandover.startedAtLine}}

Bên giao:
=> Bên giao: {{caseFileHandover.giverName}}

Chức danh:
=> Chức danh: {{caseFileHandover.giverPositionTitle}}

Bên nhận:
=> Bên nhận: {{caseFileHandover.receiverName}}

Chức danh:
=> Chức danh: {{caseFileHandover.receiverPositionTitle}}

Bàn giao hồ sơ vụ việc/vụ án:
=> Bàn giao hồ sơ vụ việc/vụ án: {{caseFileHandover.caseFileTitle}}

Lý do bàn giao:
=> Lý do bàn giao: {{caseFileHandover.handoverReasonLine}}

Hồ sơ gồm...
=> {{caseFileHandover.fileStatsLine}}

Vật chứng...
=> {{caseFileHandover.evidenceLine}}

Việc giao, nhận kết thúc...
=> {{caseFileHandover.endedAtLine}}

Dưới NGƯỜI NHẬN
=> {{caseFileHandover.receiverSignerName}}

Dưới NGƯỜI GIAO
=> {{caseFileHandover.giverSignerName}}
