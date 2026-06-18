"""
Generate bespoke TSX files for G05 LEGACY forms (BM-147, 151, 149, 152, 153, 154).

All these forms share a common structure:
  - agency (parentName, name, issuePlace)
  - document (documentCode, issueDate)
  - official (issuerTitle)
  - legalBasis (procedureArticlesLine + 1-2 line)
  - content (variable fields)
  - recipients (line1, line2, archiveLine)
  - signature (signMode, positionTitle, signerName)

Differences are in:
  - title/subtitle
  - legalBasis default line
  - content field names + labels
  - section structure
"""
import re
import sys
from pathlib import Path

ROOT = Path(r"D:\Study\Project\QLLaw-main\apps\web\src\components\documents")

# Form configurations: each is a dict describing a form's bespoke structure.
# `header_section_extra` = content key to put in section 1 (after the standard 5)
# `legal_basis_fields` = list of (key, label, default_value) for legalBasis fields
# `content_sections` = list of section dicts: { title, fields: [(key, label, kind)] }
# `kind` in: "text", "textarea", "date"
FORMS = [
    {
        "code": "147",
        "title_vn": "Quyết định huỷ bỏ QĐ tạm đình chỉ vụ án",
        "subtitle": "Biểu mẫu TT 03/2026-VKSTC · Mẫu số 147/HS · Căn cứ Điều 41, 249, 250 BLTTHS 2015.",
        "default_procedure": "Căn cứ Điều 41, Điều 249 và Điều 250 của Bộ luật Tố tụng hình sự;",
        "default_doc_code": "QĐ-VKSKV7-HUYBO",
        "legal_basis_fields": [
            ("procedureArticlesLine", "Căn cứ BLTTHS", "default_procedure"),
            ("annulledDecisionLine", "Căn cứ QĐ tạm đình chỉ bị huỷ", ""),
        ],
        "content_sections": [
            {
                "title": "3. Nội dung huỷ bỏ",
                "fields": [
                    ("annulledDecisionCode", "Số QĐ tạm đình chỉ bị huỷ", "text"),
                    ("annulledDecisionDate", "Ngày QĐ tạm đình chỉ bị huỷ", "date"),
                    ("caseName", "Tên vụ án", "text", True),
                    ("reasonLine", "Lý do huỷ bỏ", "textarea", True),
                    ("article1Line", "Điều 1", "textarea", True),
                    ("article2Line", "Điều 2", "textarea", True),
                ],
            },
        ],
    },
    {
        "code": "151",
        "title_vn": "Quyết định huỷ bỏ QĐ đình chỉ vụ án",
        "subtitle": "Biểu mẫu TT 03/2026-VKSTC · Mẫu số 151/HS · Căn cứ Điều 41, 250 BLTTHS 2015.",
        "default_procedure": "Căn cứ Điều 41 và Điều 250 của Bộ luật Tố tụng hình sự;",
        "default_doc_code": "QĐ-VKSKV7-HUYBO",
        "legal_basis_fields": [
            ("procedureArticlesLine", "Căn cứ BLTTHS", "default_procedure"),
            ("annulledDecisionLine", "Căn cứ QĐ đình chỉ bị huỷ", ""),
        ],
        "content_sections": [
            {
                "title": "3. Nội dung huỷ bỏ",
                "fields": [
                    ("annulledDecisionCode", "Số QĐ đình chỉ bị huỷ", "text"),
                    ("annulledDecisionDate", "Ngày QĐ đình chỉ bị huỷ", "date"),
                    ("caseName", "Tên vụ án", "text", True),
                    ("reasonLine", "Lý do huỷ bỏ", "textarea", True),
                    ("article1Line", "Điều 1", "textarea", True),
                    ("article2Line", "Điều 2", "textarea", True),
                ],
            },
        ],
    },
    {
        "code": "149",
        "title_vn": "Quyết định huỷ bỏ QĐ tạm đình chỉ vụ án đối với bị can",
        "subtitle": "Biểu mẫu TT 03/2026-VKSTC · Mẫu số 149/HS · Căn cứ Điều 41, 249, 250 BLTTHS 2015.",
        "default_procedure": "Căn cứ Điều 41, Điều 249 và Điều 250 của Bộ luật Tố tụng hình sự;",
        "default_doc_code": "QĐ-VKSKV7-HUYBO",
        "legal_basis_fields": [
            ("procedureArticlesLine", "Căn cứ BLTTHS", "default_procedure"),
            ("annulledDecisionLine", "Căn cứ QĐ tạm đình chỉ bị huỷ", ""),
        ],
        "content_sections": [
            {
                "title": "3. Nội dung huỷ bỏ",
                "fields": [
                    ("annulledDecisionCode", "Số QĐ tạm đình chỉ bị huỷ", "text"),
                    ("annulledDecisionDate", "Ngày QĐ tạm đình chỉ bị huỷ", "date"),
                    ("accusedName", "Tên bị can", "text"),
                    ("caseName", "Tên vụ án", "text"),
                    ("reasonLine", "Lý do huỷ bỏ", "textarea", True),
                    ("article1Line", "Điều 1", "textarea", True),
                    ("article2Line", "Điều 2", "textarea", True),
                ],
            },
        ],
    },
    {
        "code": "152",
        "title_vn": "Quyết định đình chỉ vụ án đối với bị can",
        "subtitle": "Biểu mẫu TT 03/2026-VKSTC · Mẫu số 152/HS · Căn cứ Điều 41, 248 BLTTHS 2015.",
        "default_procedure": "Căn cứ Điều 41 và Điều 248 của Bộ luật Tố tụng hình sự;",
        "default_doc_code": "QĐ-VKSKV7-DINHCHI",
        "legal_basis_fields": [
            ("procedureArticlesLine", "Căn cứ BLTTHS", "default_procedure"),
            ("caseDecisionLine", "Căn cứ QĐ khởi tố vụ án", ""),
            ("accusedDecisionLine", "Căn cứ QĐ khởi tố bị can", ""),
        ],
        "content_sections": [
            {
                "title": "3. Thông tin bị can",
                "fields": [
                    ("accusedName", "Tên bị can", "text"),
                    ("offenseName", "Tội danh", "text"),
                    ("legalArticle", "Điều luật", "text"),
                    ("caseName", "Tên vụ án", "text", True),
                ],
            },
            {
                "title": "4. Nội dung đình chỉ",
                "fields": [
                    ("reasonLine", "Lý do đình chỉ", "textarea", True),
                    ("article1Line", "Điều 1", "textarea", True),
                    ("article2Line", "Điều 2", "textarea", True),
                ],
            },
        ],
    },
    {
        "code": "153",
        "title_vn": "Quyết định huỷ bỏ QĐ đình chỉ vụ án đối với bị can",
        "subtitle": "Biểu mẫu TT 03/2026-VKSTC · Mẫu số 153/HS · Căn cứ Điều 41, 250 BLTTHS 2015.",
        "default_procedure": "Căn cứ Điều 41 và Điều 250 của Bộ luật Tố tụng hình sự;",
        "default_doc_code": "QĐ-VKSKV7-HUYBO",
        "legal_basis_fields": [
            ("procedureArticlesLine", "Căn cứ BLTTHS", "default_procedure"),
            ("annulledDecisionLine", "Căn cứ QĐ đình chỉ bị huỷ", ""),
        ],
        "content_sections": [
            {
                "title": "3. Nội dung huỷ bỏ",
                "fields": [
                    ("annulledDecisionCode", "Số QĐ đình chỉ bị huỷ", "text"),
                    ("annulledDecisionDate", "Ngày QĐ đình chỉ bị huỷ", "date"),
                    ("accusedName", "Tên bị can", "text"),
                    ("caseName", "Tên vụ án", "text"),
                    ("reasonLine", "Lý do huỷ bỏ", "textarea", True),
                    ("article1Line", "Điều 1", "textarea", True),
                    ("article2Line", "Điều 2", "textarea", True),
                ],
            },
        ],
    },
    {
        "code": "154",
        "title_vn": "Quyết định phục hồi vụ án",
        "subtitle": "Biểu mẫu TT 03/2026-VKSTC · Mẫu số 154/HS · Căn cứ Điều 41, 251 BLTTHS 2015.",
        "default_procedure": "Căn cứ Điều 41 và Điều 251 của Bộ luật Tố tụng hình sự;",
        "default_doc_code": "QĐ-VKSKV7-PHUCHOIVAN",
        "legal_basis_fields": [
            ("procedureArticlesLine", "Căn cứ BLTTHS", "default_procedure"),
            ("suspensionDecisionLine", "Căn cứ QĐ đình chỉ bị huỷ", ""),
        ],
        "content_sections": [
            {
                "title": "3. Nội dung phục hồi",
                "fields": [
                    ("suspensionDecisionCode", "Số QĐ đình chỉ bị huỷ", "text"),
                    ("suspensionDecisionDate", "Ngày QĐ đình chỉ bị huỷ", "date"),
                    ("caseName", "Tên vụ án", "text", True),
                    ("reasonLine", "Lý do phục hồi", "textarea", True),
                    ("article1Line", "Điều 1", "textarea", True),
                    ("article2Line", "Điều 2", "textarea", True),
                ],
            },
        ],
    },
]


def field_name(s: str) -> str:
    return s[0].upper() + s[1:]


def build_field_tsx(key: str, label: str, kind: str, required: bool = False, full_width: bool = False) -> str:
    """Build a single BmField* JSX element."""
    if kind == "textarea":
        comp = "BmFieldTextarea"
        rows = " rows={2}" if not full_width else " rows={3}"
    elif kind == "date":
        comp = "BmFieldDate"
        rows = ""
    else:
        comp = "BmFieldText"
        rows = ""

    req = " required" if required else ""
    fw = "\n          fullWidth" if full_width else ""
    if comp == "BmFieldDate":
        return f"""<BmFieldDate
          label="{label}"{req}
          value={{form.document.issueDateIso}}
          onChange={{(v) => patch("document", "issueDateIso", v)}}
        />"""
    if comp == "BmFieldTextarea":
        return f"""<BmFieldTextarea
          label="{label}"{req}
{fw}
          value={{form.content.{key}}}
          onChange={{(v) => patch("content", "{key}", v)}}{rows}
        />"""
    return f"""<BmFieldText
          label="{label}"{req}
{fw}
          value={{form.content.{key}}}
          onChange={{(v) => patch("content", "{key}", v)}}
        />"""


def build_legal_basis_field_tsx(key: str, label: str, is_textarea: bool = True) -> str:
    if is_textarea:
        return (
            f'<BmFieldTextarea\n'
            f'          label="{label}"{(" required" if key == "procedureArticlesLine" else "")}\n'
            f'          fullWidth\n'
            f'          value={{form.legalBasis.{key}}}\n'
            f'          onChange={{(v) => patch("legalBasis", "{key}", v)}}\n'
            f'          rows={{2}}\n'
            f'        />'
        )
    return (
        f'<BmFieldText\n'
        f'          label="{label}"{(" required" if key == "procedureArticlesLine" else "")}\n'
        f'          fullWidth\n'
        f'          value={{form.legalBasis.{key}}}\n'
        f'          onChange={{(v) => patch("legalBasis", "{key}", v)}}\n'
        f'        />'
    )


def build_required_fields(form_cfg: dict) -> list:
    """Build the REQUIRED_FIELDS tuple list (key, label, path)."""
    fields = [
        ("agency", "parentName", "Viện kiểm sát cấp trên"),
        ("agency", "name", "Viện kiểm sát ban hành"),
        ("agency", "issuePlace", "Địa danh ban hành"),
        ("document", "documentCode", "Số quyết định"),
        ("document", "issueDateIso", "Ngày ban hành"),
        ("official", "issuerTitle", "Chủ thể ban hành"),
    ]
    for key, label, _ in form_cfg["legal_basis_fields"]:
        if key == "procedureArticlesLine":
            fields.append(("legalBasis", key, label))
        else:
            fields.append(("legalBasis", key, label))
    for sec in form_cfg["content_sections"]:
        for f in sec["fields"]:
            key, label, kind = f[0], f[1], f[2]
            req = len(f) > 3 and f[3]
            if req:
                fields.append(("content", key, label))
    fields.extend([
        ("recipients", "archiveLine", "Lưu hồ sơ"),
        ("signature", "signMode", "Chế độ ký"),
        ("signature", "positionTitle", "Chức vụ ký"),
        ("signature", "signerName", "Người ký"),
    ])
    return fields


def render_form(form_cfg: dict) -> str:
    code = form_cfg["code"]
    title = form_cfg["title_vn"]
    subtitle = form_cfg["subtitle"]
    default_procedure = form_cfg["default_procedure"]
    default_doc_code = form_cfg["default_doc_code"]

    # Type for content (union of all section field keys)
    all_content_keys = []
    for sec in form_cfg["content_sections"]:
        for f in sec["fields"]:
            all_content_keys.append(f[0])
    all_lb_keys = [f[0] for f in form_cfg["legal_basis_fields"]]

    # Build legalBasis TypeScript type
    lb_type_lines = "  procedureArticlesLine: string;\n" + "".join(
        f"  {k}: string;\n" for k in all_lb_keys if k != "procedureArticlesLine"
    )

    # Build content TypeScript type
    content_type_lines = "".join(f"  {k}: string;\n" for k in all_content_keys)

    # Build EMPTY_FORM
    lb_empty = "  procedureArticlesLine: " + repr(default_procedure) + ",\n"
    for k in all_lb_keys:
        if k == "procedureArticlesLine":
            continue
        lb_empty += f"    {k}: \"\",\n"
    content_empty = "".join(f"    {k}: \"\",\n" for k in all_content_keys)

    # Build normalizeForm
    norm_lb_lines = ""
    for k in all_lb_keys:
        if k == "procedureArticlesLine":
            norm_lb_lines += f"        procedureArticlesLine:\n          nested(payload, \"legalBasis.procedureArticlesLine\") || f.legalBasis.procedureArticlesLine,\n"
        else:
            norm_lb_lines += f"        {k}: nested(payload, \"legalBasis.{k}\") || \"\",\n"
    norm_content_lines = "".join(f"      {k}: nested(payload, \"content.{k}\") || \"\",\n" for k in all_content_keys)

    # Build REQUIRED_FIELDS
    req_fields = build_required_fields(form_cfg)
    req_lines = "  [\n"
    for sec, key, label in req_fields:
        req_lines += f'    ["{label}", "{sec}.{key}"],\n'
    req_lines += "  ]"

    # Build body sections
    body_sections_tsx = []

    # Section 1: Header (always)
    body_sections_tsx.append(f"""      <BmFormSection
        title="1. Header biểu mẫu"
        description="Thông tin cơ quan ban hành và số hiệu văn bản."
        requiredCount={{{len([f for f in req_fields if f[0] in ('agency', 'document', 'official')])}}}
      >
        <BmFieldText
          label="Viện kiểm sát cấp trên"
          required
          value={{form.agency.parentName}}
          onChange={{(v) => patch("agency", "parentName", v)}}
        />
        <BmFieldText
          label="Viện kiểm sát ban hành"
          required
          value={{form.agency.name}}
          onChange={{(v) => patch("agency", "name", v)}}
        />
        <BmFieldText
          label="Số quyết định"
          required
          value={{form.document.documentCode}}
          onChange={{(v) => patch("document", "documentCode", v)}}
        />
        <BmFieldText
          label="Địa danh"
          required
          value={{form.agency.issuePlace}}
          onChange={{(v) => patch("agency", "issuePlace", v)}}
        />
        <BmFieldDate
          label="Ngày ban hành"
          required
          value={{form.document.issueDateIso}}
          onChange={{(v) => patch("document", "issueDateIso", v)}}
        />
        <BmFieldText
          label="Dòng địa danh/ngày tự sinh"
          fullWidth
          value={{buildIssuePlaceAndDateLine(form)}}
          readOnly
          onChange={{() => undefined}}
        />
        <BmFieldText
          label="Chủ thể ban hành"
          required
          fullWidth
          value={{form.official.issuerTitle}}
          onChange={{(v) => patch("official", "issuerTitle", v)}}
        />
      </BmFormSection>""")

    # Section 2: Căn cứ pháp lý
    lb_count = sum(1 for sec, key, _ in req_fields if sec == "legalBasis")
    body_sections_tsx.append(f"""      <BmFormSection
        title="2. Căn cứ pháp lý"
        description="Căn cứ BLTTHS và các văn bản liên quan."
        requiredCount={{{lb_count}}}
      >
{chr(10).join('        ' + build_legal_basis_field_tsx(k, l, is_textarea=True).replace(chr(10), chr(10) + '        ').strip() for k, l, _ in form_cfg["legal_basis_fields"])}
      </BmFormSection>""")

    # Section 3+: Content sections
    for idx, sec in enumerate(form_cfg["content_sections"]):
        sec_num = idx + 3
        sec_count = sum(1 for s, k, _ in req_fields if s == "content" and k in [f[0] for f in sec["fields"]])
        fields_tsx = []
        for f in sec["fields"]:
            key, label, kind = f[0], f[1], f[2]
            req = len(f) > 3 and f[3]
            full = kind == "textarea"
            fields_tsx.append(build_field_tsx(key, label, kind, req, full))
        body_sections_tsx.append(f"""      <BmFormSection
        title="{sec["title"]}"
        description=""
        requiredCount={{{sec_count}}}
      >
{chr(10).join('        ' + x.replace(chr(10), chr(10) + '        ').strip() for x in fields_tsx)}
      </BmFormSection>""")

    # Recipients section number
    rec_num = len(form_cfg["content_sections"]) + 3

    # Signature section number
    sig_num = rec_num + 1

    body_sections_tsx.append(f"""      <BmFormSection title="{rec_num}. Nơi nhận">
        <BmFieldText
          label="Nơi nhận 1"
          fullWidth
          value={{form.recipients.line1}}
          onChange={{(v) => patch("recipients", "line1", v)}}
        />
        <BmFieldText
          label="Nơi nhận 2"
          fullWidth
          value={{form.recipients.line2}}
          onChange={{(v) => patch("recipients", "line2", v)}}
        />
        <BmFieldText
          label="Lưu hồ sơ"
          fullWidth
          value={{form.recipients.archiveLine}}
          onChange={{(v) => patch("recipients", "archiveLine", v)}}
        />
      </BmFormSection>""")

    body_sections_tsx.append(f"""      <BmFormSection title="{sig_num}. Chữ ký" requiredCount={{3}}>
        <BmFieldText
          label="Chế độ ký"
          required
          value={{form.signature.signMode}}
          onChange={{(v) => patch("signature", "signMode", v)}}
        />
        <BmFieldText
          label="Chức vụ ký"
          required
          value={{form.signature.positionTitle}}
          onChange={{(v) => patch("signature", "positionTitle", v)}}
        />
        <BmFieldText
          label="Người ký"
          required
          value={{form.signature.signerName}}
          onChange={{(v) => patch("signature", "signerName", v)}}
        />
      </BmFormSection>""")

    body_sections_str = "\n\n".join(body_sections_tsx)

    template = f""""use client";

/**
 * BM-{code} — {title}
 * Stage: TRUY_TO, Group: G05. TT 03/2026-VKSTC, Mẫu số {code}/HS.
 *
 * Căn cứ: {default_procedure}
 * Nghiệp vụ: Biểu mẫu VKS trong giai đoạn truy tố.
 */

import {{ useEffect, useMemo, useState }} from "react";

import {{
  BmFieldDate,
  BmFieldText,
  BmFieldTextarea,
  BmFormActions,
  BmFormMetaBar,
  BmFormSection,
  BmFormStatus,
  issuePlaceDateLine,
}} from "@/components/documents/bm-form";

type AgencyForm = {{ parentName: string; name: string; issuePlace: string }};
type DocumentForm = {{ documentCode: string; issueDateIso: string }};
type OfficialForm = {{ issuerTitle: string }};
type LegalBasisForm = {{
{lb_type_lines}}};
type ContentForm = {{
{content_type_lines}}};
type RecipientsForm = {{ line1: string; line2: string; archiveLine: string }};
type SignatureForm = {{ signMode: string; positionTitle: string; signerName: string }};

type Bm{code}Form = {{
  agency: AgencyForm;
  document: DocumentForm;
  official: OfficialForm;
  legalBasis: LegalBasisForm;
  content: ContentForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
}};

type RenderPayload = Record<string, unknown>;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const EMPTY_FORM: Bm{code}Form = {{
  agency: {{
    parentName: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
    name: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
    issuePlace: "TP. Hồ Chí Minh",
  }},
  document: {{ documentCode: "{default_doc_code}", issueDateIso: "" }},
  official: {{
    issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  }},
  legalBasis: {{
{lb_empty}  }},
  content: {{
{content_empty}  }},
  recipients: {{ line1: "", line2: "", archiveLine: "- Lưu: HSVA, HSKS, VP." }},
  signature: {{
    signMode: "KT. VIỆN TRƯỞNG",
    positionTitle: "PHÓ VIỆN TRƯỞNG",
    signerName: "",
  }},
}};

const REQUIRED_FIELDS: ReadonlyArray<[string, string]> = {req_lines};

function cleanText(v: unknown): string {{
  return v == null ? "" : String(v).trim();
}}

function nested(payload: RenderPayload | null, path: string): string {{
  if (!payload) return "";
  const parts = path.split(".").filter(Boolean);
  let cur: unknown = payload;
  for (const p of parts) {{
    if (!cur || typeof cur !== "object") return "";
    cur = (cur as Record<string, unknown>)[p];
  }}
  return cleanText(cur);
}}

function parseDateToIso(v: string): string {{
  const raw = cleanText(v);
  if (!raw) return "";
  if (/^\\d{{4}}-\\d{{2}}-\\d{{2}}$/.test(raw)) return raw;
  const m = raw.match(/^(\\d{{1,2}})\\/(\\d{{1,2}})\\/(\\d{{4}})$/);
  if (m) return `${{m[3]}}-${{m[2].padStart(2, "0")}}-${{m[1].padStart(2, "0")}}`;
  return "";
}}

function toVietnameseDateText(isoDate: string): string {{
  const m = isoDate.match(/^(\\d{{4}})-(\\d{{2}})-(\\d{{2}})$/);
  if (!m) return isoDate || "";
  return `ngày ${{Number(m[3])}} tháng ${{Number(m[2])}} năm ${{m[1]}}`;
}}

function toSlashDateText(isoDate: string): string {{
  const m = isoDate.match(/^(\\d{{4}})-(\\d{{2}})-(\\d{{2}})$/);
  if (!m) return isoDate || "";
  return `${{m[3]}}/${{m[2]}}/${{m[1]}}`;
}}

function buildIssuePlaceAndDateLine(form: Bm{code}Form): string {{
  return issuePlaceDateLine(form.agency.issuePlace, form.document.issueDateIso);
}}

function normalizeFormInputs(payload: RenderPayload | null): Bm{code}Form {{
  const f = EMPTY_FORM;
  if (!payload) return f;
  return {{
    agency: {{
      parentName: nested(payload, "agency.parentName") || f.agency.parentName,
      name: nested(payload, "agency.name") || f.agency.name,
      issuePlace:
        nested(payload, "agency.issuePlace") ||
        nested(payload, "document.issuePlace") ||
        f.agency.issuePlace,
    }},
    document: {{
      documentCode: nested(payload, "document.documentCode") || f.document.documentCode,
      issueDateIso:
        parseDateToIso(nested(payload, "document.issueDate")) || f.document.issueDateIso,
    }},
    official: {{
      issuerTitle: nested(payload, "official.issuerTitle") || f.official.issuerTitle,
    }},
    legalBasis: {{
{norm_lb_lines}    }},
    content: {{
{norm_content_lines}    }},
    recipients: {{
      line1: nested(payload, "recipients.line1") || "",
      line2: nested(payload, "recipients.line2") || "",
      archiveLine: nested(payload, "recipients.archiveLine") || f.recipients.archiveLine,
    }},
    signature: {{
      signMode: nested(payload, "signature.signMode") || f.signature.signMode,
      positionTitle: nested(payload, "signature.positionTitle") || f.signature.positionTitle,
      signerName: nested(payload, "signature.signerName") || "",
    }},
  }};
}}

function lookupValue(form: Bm{code}Form, path: string): string {{
  const parts = path.split(".").filter(Boolean);
  let cur: unknown = form;
  for (const p of parts) {{
    if (!cur || typeof cur !== "object") return "";
    cur = (cur as Record<string, unknown>)[p];
  }}
  return cleanText(cur);
}}

function validateForm(form: Bm{code}Form): string[] {{
  return REQUIRED_FIELDS.filter(([, path]) => !lookupValue(form, path)).map(
    ([label]) => label,
  );
}}

function buildSaveBody(form: Bm{code}Form) {{
  return {{
    agency: {{
      parentName: form.agency.parentName,
      name: form.agency.name,
      issuePlace: form.agency.issuePlace,
    }},
    document: {{
      documentCode: form.document.documentCode,
      issueDate: toSlashDateText(form.document.issueDateIso),
      issueDateText: toVietnameseDateText(form.document.issueDateIso).replace(
        /^ngày\\s+/iu,
        "",
      ),
      issuePlaceAndDateLine: buildIssuePlaceAndDateLine(form),
    }},
    official: {{ issuerTitle: form.official.issuerTitle }},
    legalBasis: {{
{chr(10).join('      ' + k + ': form.legalBasis.' + k + ',' for k in all_lb_keys)}
    }},
    content: {{
{chr(10).join('      ' + k + ': form.content.' + k + ',' for k in all_content_keys)}
    }},
    recipients: {{
      line1: form.recipients.line1,
      line2: form.recipients.line2,
      archiveLine: form.recipients.archiveLine,
    }},
    signature: {{
      signMode: form.signature.signMode,
      positionTitle: form.signature.positionTitle,
      signerName: form.signature.signerName || "",
    }},
    formInputs: {{}},
    payloadOverrides: {{}},
    renderPayloadOverrides: {{}},
  }};
}}

export function Bm{code}FormInputsPanel({{
  documentId,
  onSaved,
}}: {{
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
}}) {{
  const [form, setForm] = useState<Bm{code}Form>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validation = useMemo(() => validateForm(form), [form]);

  const patch = <S extends keyof Bm{code}Form, K extends keyof Bm{code}Form[S]>(
    section: S,
    key: K,
    value: Bm{code}Form[S][K],
  ) => {{
    setForm((prev) => ({{
      ...prev,
      [section]: {{ ...(prev[section] as Record<string, unknown>), [key]: value }},
    }}));
  }};

  const reloadFromBackend = async () => {{
    setLoading(true);
    setError(null);
    setMessage(null);
    try {{
      const res = await fetch(
        `${{API_BASE_URL}}/documents/generated/${{documentId}}/render-payload`,
        {{ cache: "no-store" }},
      );
      if (!res.ok) throw new Error(`HTTP ${{res.status}}`);
      setForm(normalizeFormInputs((await res.json()) as RenderPayload));
      setMessage("Đã tải dữ liệu BM-{code} từ backend.");
    }} catch (e) {{
      setError(e instanceof Error ? e.message : "Lỗi khi tải.");
    }} finally {{
      setLoading(false);
    }}
  }};

  const handleSave = async () => {{
    const errs = validateForm(form);
    if (errs.length > 0) {{
      setValidationErrors(errs);
      setError(`Thiếu: ${{errs.join(", ")}}`);
      return;
    }}
    setValidationErrors([]);
    setSaving(true);
    setError(null);
    setMessage(null);
    try {{
      const res = await fetch(
        `${{API_BASE_URL}}/documents/generated/${{documentId}}/form-inputs`,
        {{
          method: "POST",
          headers: {{ "Content-Type": "application/json; charset=utf-8" }},
          body: JSON.stringify(buildSaveBody(form)),
        }},
      );
      if (!res.ok) throw new Error(`HTTP ${{res.status}}`);
      await reloadFromBackend();
      setMessage("Đã lưu BM-{code} thành công.");
      await onSaved?.();
    }} catch (e) {{
      setError(e instanceof Error ? e.message : "Lỗi khi lưu.");
    }} finally {{
      setSaving(false);
    }}
  }};

  useEffect(() => {{
    void reloadFromBackend();
  }}, [documentId]);

  const status = (() => {{
    if (loading) return {{ kind: "loading" as const, text: "Đang tải..." }};
    if (saving) return {{ kind: "loading" as const, text: "Đang lưu..." }};
    if (validationErrors.length > 0)
      return {{
        kind: "warning" as const,
        text: `Còn thiếu: ${{validationErrors.join(", ")}}`,
      }};
    if (error) return {{ kind: "error" as const, text: error }};
    if (message) return {{ kind: "success" as const, text: message }};
    return {{ kind: "idle" as const, text: "" }};
  }})();

  return (
    <div className="space-y-5">
      <BmFormMetaBar
        templateCode="BM-{code}"
        title="Dữ liệu biểu mẫu {title}"
        subtitle="{subtitle}"
        isDirty={{false}}
        isLoading={{loading}}
        isSaving={{saving}}
        savedAt={{null}}
        errorMessage={{error ?? undefined}}
        warningMessage={{
          validationErrors.length > 0
            ? `Còn thiếu: ${{validationErrors.join(", ")}}`
            : undefined
        }}
        successMessage={{status.kind === "success" ? status.text : undefined}}
        primaryLabel={{saving ? "Đang lưu..." : "Lưu dữ liệu BM-{code}"}}
        onPrimary={{handleSave}}
        primaryDisabled={{saving || loading}}
        secondaryLabel={{loading ? "Đang tải..." : "Tải lại từ backend"}}
        onSecondary={{reloadFromBackend}}
      />

      {{status.kind === "idle" ? null : (
        <BmFormStatus kind={{status.kind}}>{{status.text}}</BmFormStatus>
      )}}

{body_sections_str}

      <BmFormActions
        onPrimary={{handleSave}}
        primaryLabel={{saving ? "Đang lưu..." : "Lưu dữ liệu BM-{code}"}}
        primaryDisabled={{saving || loading}}
        onSecondary={{reloadFromBackend}}
        secondaryLabel={{loading ? "Đang tải..." : "Tải lại từ backend"}}
      />
    </div>
  );
}}
"""
    return template


def main() -> None:
    dry_run = "--dry-run" in sys.argv
    target = sys.argv[1] if not dry_run and len(sys.argv) > 1 and not sys.argv[1].startswith("--") else None

    written = []
    for cfg in FORMS:
        if target and cfg["code"] != target:
            continue
        code = cfg["code"]
        path = ROOT / f"bm-{code}-form-inputs.tsx"
        content = render_form(cfg)
        if dry_run:
            print(f"DRY: {path} ({len(content)} bytes)")
        else:
            path.write_text(content, encoding="utf-8")
            written.append(str(path))
            print(f"WROTE: {path} ({len(content)} bytes)")

    if not dry_run and not target:
        print(f"\nWrote {len(written)} files.")


if __name__ == "__main__":
    main()
