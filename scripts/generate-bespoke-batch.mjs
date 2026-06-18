#!/usr/bin/env node
// Generate 10 bespoke biểu mẫu từ 1 template chung.
// Idempotent: chạy lại không phá nội dung hiện tại (chỉ skip nếu file đã BESPOKE).

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "apps", "web", "src", "components", "documents");

// 10 biểu cần viết bespoke.
// 5 G01 (BM-021, 022, 024, 025, 026) + 5 G02 (BM-032, 034, 035, 036, 041).
const BIEN = [
  {
    code: "BM-021",
    title: "Quyết định không khởi tố vụ án hình sự",
    group: "G01",
    stage: "TIEP_NHAN (Tiếp nhận, giải quyết nguồn tin về tội phạm)",
    docCode: "21/QĐ-VKS",
    legalBasisDefault: "Căn cứ các điều 36, 39 và 148 của Bộ luật Tố tụng hình sự;",
    decisionVerb: "không khởi tố vụ án hình sự",
  },
  {
    code: "BM-022",
    title: "Quyết định huỷ bỏ Quyết định không khởi tố vụ án hình sự",
    group: "G01",
    stage: "TIEP_NHAN (Tiếp nhận, giải quyết nguồn tin về tội phạm)",
    docCode: "22/QĐ-VKS",
    legalBasisDefault: "Căn cứ các điều 36, 39, 148 và 149 của Bộ luật Tố tụng hình sự;",
    decisionVerb: "huỷ bỏ Quyết định không khởi tố vụ án hình sự",
  },
  {
    code: "BM-024",
    title: "Quyết định thay đổi Quyết định khởi tố vụ án hình sự",
    group: "G01",
    stage: "TIEP_NHAN (Tiếp nhận, giải quyết nguồn tin về tội phạm)",
    docCode: "24/QĐ-VKS",
    legalBasisDefault: "Căn cứ các điều 36, 41 và 156 của Bộ luật Tố tụng hình sự;",
    decisionVerb: "thay đổi Quyết định khởi tố vụ án hình sự",
  },
  {
    code: "BM-025",
    title: "Quyết định bổ sung Quyết định khởi tố vụ án hình sự",
    group: "G01",
    stage: "TIEP_NHAN (Tiếp nhận, giải quyết nguồn tin về tội phạm)",
    docCode: "25/QĐ-VKS",
    legalBasisDefault: "Căn cứ các điều 36, 41 và 156 của Bộ luật Tố tụng hình sự;",
    decisionVerb: "bổ sung Quyết định khởi tố vụ án hình sự",
  },
  {
    code: "BM-026",
    title: "Quyết định huỷ bỏ Quyết định khởi tố vụ án hình sự",
    group: "G01",
    stage: "TIEP_NHAN (Tiếp nhận, giải quyết nguồn tin về tội phạm)",
    docCode: "26/QĐ-VKS",
    legalBasisDefault: "Căn cứ các điều 36, 41 và 157 của Bộ luật Tố tụng hình sự;",
    decisionVerb: "huỷ bỏ Quyết định khởi tố vụ án hình sự",
  },
  {
    code: "BM-032",
    title: "Quyết định không phê chuẩn Lệnh bắt người bị giữ trong trường hợp khẩn cấp",
    group: "G02",
    stage: "BP_NGAN_CHAN (Biện pháp ngăn chặn, bảo đảm)",
    docCode: "32/QĐ-VKS",
    legalBasisDefault: "Căn cứ các điều 36, 41, 110 và 113 của Bộ luật Tố tụng hình sự;",
    decisionVerb: "không phê chuẩn Lệnh bắt người bị giữ trong trường hợp khẩn cấp",
  },
  {
    code: "BM-034",
    title: "Quyết định không phê chuẩn Quyết định gia hạn tạm giữ",
    group: "G02",
    stage: "BP_NGAN_CHAN (Biện pháp ngăn chặn, bảo đảm)",
    docCode: "34/QĐ-VKS",
    legalBasisDefault: "Căn cứ các điều 36, 41, 110 và 118 của Bộ luật Tố tụng hình sự;",
    decisionVerb: "không phê chuẩn Quyết định gia hạn tạm giữ",
  },
  {
    code: "BM-035",
    title: "Quyết định huỷ bỏ Quyết định tạm giữ, quyết định gia hạn tạm giữ",
    group: "G02",
    stage: "BP_NGAN_CHAN (Biện pháp ngăn chặn, bảo đảm)",
    docCode: "35/QĐ-VKS",
    legalBasisDefault: "Căn cứ các điều 36, 41, 110 và 119 của Bộ luật Tố tụng hình sự;",
    decisionVerb: "huỷ bỏ Quyết định tạm giữ, quyết định gia hạn tạm giữ",
  },
  {
    code: "BM-036",
    title: "Quyết định trả tự do cho người bị tạm giữ",
    group: "G02",
    stage: "BP_NGAN_CHAN (Biện pháp ngăn chặn, bảo đảm)",
    docCode: "36/QĐ-VKS",
    legalBasisDefault: "Căn cứ các điều 36, 41, 110 và 120 của Bộ luật Tố tụng hình sự;",
    decisionVerb: "trả tự do cho người bị tạm giữ",
  },
  {
    code: "BM-041",
    title: "Quyết định không phê chuẩn Lệnh tạm giam",
    group: "G02",
    stage: "BP_NGAN_CHAN (Biện pháp ngăn chặn, bảo đảm)",
    docCode: "41/QĐ-VKS",
    legalBasisDefault: "Căn cứ các điều 36, 41, 110 và 122 của Bộ luật Tố tụng hình sự;",
    decisionVerb: "không phê chuẩn Lệnh tạm giam",
  },
];

function gen(bm) {
  const fn = `bm-${bm.code.slice(3)}-form-inputs.tsx`;
  const upper = bm.code.replace(/-/g, "");
  const componentName = `Bm${upper.slice(2)}FormInputsPanel`;

  return `"use client";

/**
 * ${bm.code} — ${bm.title}
 * Stage: ${bm.stage}, Group: ${bm.group}
 *
 * BESPOKE form theo docs/BM_CANONICAL_SPEC.md (8 nhóm field chuẩn).
 * Section thực tế dùng: agency + document + person + legalBasis + decision + recipients + signature.
 * Ấn nút "Lấy từ vụ án" để auto-fill từ payload vụ án.
 */
import { useEffect, useMemo, useState } from "react";
import {
  BmFieldText,
  BmFieldTextarea,
  BmFieldDate,
  BmFormSection,
  BmFormMetaBar,
  defaultArchiveLine,
  todayIsoDate,
} from "./bm-form";
import { BmFormCasePayloadButton } from "./bm-form/case-payload-button";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

type ${upper}FormInputs = {
  agency: {
    parentNameUpper: string;
    nameUpper: string;
    issuePlace: string;
  };
  document: {
    documentCode: string;
    issueDate: string;
    issuePlaceAndDateLine: string;
  };
  person: {
    fullName: string;
  };
  legalBasis: {
    procedureArticlesLine: string;
  };
  decision: {
    summaryLine: string;
    decisionLine: string;
  };
  recipients: {
    executionAgencyLine: string;
    personLine: string;
    archiveLine: string;
  };
  signature: {
    signMode: string;
    positionTitle: string;
    signerName: string;
  };
};

type Props = {
  documentId: string | number;
  onSaved?: () => void;
};

const EMPTY_FORM: ${upper}FormInputs = {
  agency: {
    parentNameUpper: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
    nameUpper: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
    issuePlace: "TP. Hồ Chí Minh",
  },
  document: {
    documentCode: ${JSON.stringify(bm.docCode)},
    issueDate: todayIsoDate(),
    issuePlaceAndDateLine: "",
  },
  person: {
    fullName: "",
  },
  legalBasis: {
    procedureArticlesLine: ${JSON.stringify(bm.legalBasisDefault)},
  },
  decision: {
    summaryLine: "",
    decisionLine: "",
  },
  recipients: {
    executionAgencyLine: "",
    personLine: "",
    archiveLine: defaultArchiveLine(),
  },
  signature: {
    signMode: "KT. VIỆN TRƯỞNG",
    positionTitle: "PHÓ VIỆN TRƯỞNG",
    signerName: "",
  },
};

function asRecord(value: unknown): Record<string, string> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, string>)
    : {};
}

function pickString(...values: unknown[]): string {
  for (const v of values) {
    const s = String(v ?? "").trim();
    if (s) return s;
  }
  return "";
}

function buildIssuePlaceAndDateLine(place: string, date: string): string {
  const p = (place || "TP. Hồ Chí Minh").trim();
  const iso = /^(\\d{4})-(\\d{1,2})-(\\d{1,2})$/.exec(date);
  if (!iso) return \`\${p}, ngày ... tháng ... năm ......\`;
  return \`\${p}, ngày \${Number(iso[3])} tháng \${Number(iso[2])} năm \${iso[1]}\`;
}

function getSection(root: Record<string, unknown>, ...paths: string[]): Record<string, string> {
  for (const p of paths) {
    const v = p.includes(".")
      ? p.split(".").reduce<unknown>((acc, k) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[k] : undefined), root)
      : root[p];
    if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, string>;
  }
  return {};
}

function normalizeForm(source: unknown): ${upper}FormInputs {
  const root = (source && typeof source === "object" ? source : {}) as Record<string, unknown>;
  const fi = (root.formInputs && typeof root.formInputs === "object" ? root.formInputs : {}) as Record<string, unknown>;
  const find = (...names: string[]) =>
    getSection(root, ...names) || getSection(fi, ...names);

  const agency = find("agency");
  const document_ = find("document");
  const person = find("person");
  const legalBasis = find("legalBasis");
  const decision = find("decision");
  const recipients = find("recipients");
  const signature = find("signature");

  return {
    agency: {
      parentNameUpper: pickString(agency.parentNameUpper, agency.parentName) || EMPTY_FORM.agency.parentNameUpper,
      nameUpper: pickString(agency.nameUpper, agency.name) || EMPTY_FORM.agency.nameUpper,
      issuePlace: pickString(agency.issuePlace) || EMPTY_FORM.agency.issuePlace,
    },
    document: {
      documentCode: pickString(document_.documentCode, document_.documentNo, document_.fullDocumentCode) || EMPTY_FORM.document.documentCode,
      issueDate: pickString(document_.issueDate) || EMPTY_FORM.document.issueDate,
      issuePlaceAndDateLine: pickString(document_.issuePlaceAndDateLine),
    },
    person: {
      fullName: pickString(person.fullName, person.personName),
    },
    legalBasis: {
      procedureArticlesLine: pickString(legalBasis.procedureArticlesLine) || EMPTY_FORM.legalBasis.procedureArticlesLine,
    },
    decision: {
      summaryLine: pickString(decision.summaryLine),
      decisionLine: pickString(decision.decisionLine),
    },
    recipients: {
      executionAgencyLine: pickString(recipients.executionAgencyLine, recipients.investigatingAgencyLine),
      personLine: pickString(recipients.personLine, recipients.accusedLine),
      archiveLine: pickString(recipients.archiveLine) || EMPTY_FORM.recipients.archiveLine,
    },
    signature: {
      signMode: pickString(signature.signMode) || EMPTY_FORM.signature.signMode,
      positionTitle: pickString(signature.positionTitle) || EMPTY_FORM.signature.positionTitle,
      signerName: pickString(signature.signerName),
    },
  };
}

function derive(form: ${upper}FormInputs): ${upper}FormInputs {
  return {
    ...form,
    document: {
      ...form.document,
      issuePlaceAndDateLine: buildIssuePlaceAndDateLine(
        form.agency.issuePlace,
        form.document.issueDate,
      ),
    },
    recipients: {
      ...form.recipients,
      archiveLine: form.recipients.archiveLine || defaultArchiveLine(),
    },
  };
}

export function ${componentName}({ documentId, onSaved }: Props) {
  const [form, setForm] = useState<${upper}FormInputs>(EMPTY_FORM);
  const [initialSnapshot, setInitialSnapshot] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const ready = useMemo(() => derive(form), [form]);
  const currentSnapshot = useMemo(() => JSON.stringify(ready), [ready]);
  const isDirty = currentSnapshot !== initialSnapshot;

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const res = await fetch(
          \`\${API_BASE_URL}/documents/generated/\${documentId}/render-payload\`,
          { method: "GET", headers: { Accept: "application/json" }, cache: "no-store", credentials: "include" },
        );
        if (!res.ok) throw new Error(await res.text());
        const next = normalizeForm(await res.json());
        if (isMounted) {
          setForm(next);
          setInitialSnapshot(JSON.stringify(derive(next)));
          setSavedAt(null);
        }
      } catch (e) {
        if (isMounted) setErrorMessage(e instanceof Error ? e.message : "Lỗi tải payload");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    void load();
    return () => {
      isMounted = false;
    };
  }, [documentId]);

  function updateSection(sectionName: keyof ${upper}FormInputs, fieldName: string, value: string) {
    setForm((current) => {
      const section = asRecord((current as Record<string, unknown>)[sectionName]);
      return {
        ...current,
        [sectionName]: { ...section, [fieldName]: value },
      } as ${upper}FormInputs;
    });
  }

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    const final = derive(form);
    try {
      const res = await fetch(
        \`\${API_BASE_URL}/documents/generated/\${documentId}/form-inputs\`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8", Accept: "application/json" },
          body: JSON.stringify({
            ...final,
            formInputs: final,
            payloadOverrides: final,
            renderPayloadOverrides: final,
            templateCode: ${JSON.stringify(bm.code)},
            updatedByName: final.signature.signerName,
          }),
        },
      );
      if (!res.ok) throw new Error(await res.text());
      setForm(final);
      setInitialSnapshot(JSON.stringify(final));
      setSavedAt(new Date());
      setSuccessMessage(\`Đã lưu dữ liệu ${bm.code}. Có thể render lại DOCX/PDF.\`);
      onSaved?.();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : \`Lưu ${bm.code} thất bại\`);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReload() {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(
        \`\${API_BASE_URL}/documents/generated/\${documentId}/render-payload\`,
        { method: "GET", headers: { Accept: "application/json" }, cache: "no-store", credentials: "include" },
      );
      if (!res.ok) throw new Error(await res.text());
      const next = normalizeForm(await res.json());
      setForm(next);
      setInitialSnapshot(JSON.stringify(derive(next)));
      setSavedAt(null);
      setSuccessMessage(\`Đã tải lại dữ liệu ${bm.code}.\`);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : \`Tải lại ${bm.code} thất bại\`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <BmFormMetaBar
        templateCode=${JSON.stringify(bm.code)}
        title=${JSON.stringify(bm.title)}
        subtitle={\`Biểu mẫu TT 03/2026-VKSTC · Stage: \${${JSON.stringify(bm.stage)}} · Group: ${bm.group}\`}
        isDirty={isDirty}
        isLoading={isLoading}
        isSaving={isSaving}
        savedAt={savedAt}
        errorMessage={errorMessage}
        successMessage={successMessage}
        warningMessage={null}
        primaryLabel={\`Lưu dữ liệu ${bm.code}\`}
        onPrimary={() => void handleSave()}
        primaryDisabled={!isDirty || isSaving}
        secondaryLabel="Tải lại"
        onSecondary={() => void handleReload()}
        extraActions={
          <BmFormCasePayloadButton
            templateCode=${JSON.stringify(bm.code)}
            form={form}
            onApply={(next) => setForm(next as ${upper}FormInputs)}
          />
        }
      />

      <BmFormSection title="1. Cơ quan ban hành" requiredCount={3}>
        <BmFieldText
          label="Cơ quan cấp trên"
          value={ready.agency.parentNameUpper}
          onChange={(v) => updateSection("agency", "parentNameUpper", v)}
          required
        />
        <BmFieldText
          label="Viện kiểm sát ban hành"
          value={ready.agency.nameUpper}
          onChange={(v) => updateSection("agency", "nameUpper", v)}
          required
        />
        <BmFieldText
          label="Địa danh"
          value={ready.agency.issuePlace}
          onChange={(v) => updateSection("agency", "issuePlace", v)}
          required
        />
      </BmFormSection>

      <BmFormSection title="2. Số / ngày văn bản" requiredCount={2}>
        <BmFieldText
          label="Số quyết định"
          value={ready.document.documentCode}
          onChange={(v) => updateSection("document", "documentCode", v)}
          required
        />
        <BmFieldDate
          label="Ngày ban hành"
          value={ready.document.issueDate}
          onChange={(v) => updateSection("document", "issueDate", v)}
          required
        />
        <BmFieldText
          label="Dòng địa danh, ngày tháng"
          value={ready.document.issuePlaceAndDateLine}
          onChange={(v) => updateSection("document", "issuePlaceAndDateLine", v)}
          helperText="Tự sinh nếu để trống. Có thể ghi đè bằng tay."
          fullWidth
        />
      </BmFormSection>

      <BmFormSection title="3. Đối tượng áp dụng" requiredCount={1}>
        <BmFieldText
          label="Họ tên người bị áp dụng"
          value={ready.person.fullName}
          onChange={(v) => updateSection("person", "fullName", v)}
          required
          helperText="Bị can / người bị giữ / người bị tạm giam (tuỳ biểu)"
          fullWidth
        />
      </BmFormSection>

      <BmFormSection title="4. Căn cứ pháp lý" requiredCount={1}>
        <BmFieldTextarea
          label="Căn cứ Bộ luật Tố tụng hình sự"
          value={ready.legalBasis.procedureArticlesLine}
          onChange={(v) => updateSection("legalBasis", "procedureArticlesLine", v)}
          required
          rows={3}
          fullWidth
        />
      </BmFormSection>

      <BmFormSection title="5. Nội dung quyết định">
        <BmFieldTextarea
          label="Tóm tắt hồ sơ / diễn biến"
          value={ready.decision.summaryLine}
          onChange={(v) => updateSection("decision", "summaryLine", v)}
          rows={4}
          fullWidth
        />
        <BmFieldTextarea
          label={\`Nội dung quyết định (\${${JSON.stringify(bm.decisionVerb)}})\`}
          value={ready.decision.decisionLine}
          onChange={(v) => updateSection("decision", "decisionLine", v)}
          rows={4}
          helperText="Diễn giải lý do và nội dung cụ thể của quyết định"
          fullWidth
        />
      </BmFormSection>

      <BmFormSection title="6. Nơi nhận" requiredCount={3}>
        <BmFieldText
          label="Cơ quan thi hành"
          value={ready.recipients.executionAgencyLine}
          onChange={(v) => updateSection("recipients", "executionAgencyLine", v)}
          required
        />
        <BmFieldText
          label="Người bị áp dụng"
          value={ready.recipients.personLine}
          onChange={(v) => updateSection("recipients", "personLine", v)}
          required
        />
        <BmFieldText
          label="Dòng lưu hồ sơ"
          value={ready.recipients.archiveLine}
          onChange={(v) => updateSection("recipients", "archiveLine", v)}
          required
        />
      </BmFormSection>

      <BmFormSection title="7. Chữ ký" requiredCount={1}>
        <BmFieldText
          label="Chế độ ký"
          value={ready.signature.signMode}
          onChange={(v) => updateSection("signature", "signMode", v)}
        />
        <BmFieldText
          label="Chức danh"
          value={ready.signature.positionTitle}
          onChange={(v) => updateSection("signature", "positionTitle", v)}
        />
        <BmFieldText
          label="Người ký"
          value={ready.signature.signerName}
          onChange={(v) => updateSection("signature", "signerName", v)}
          required
        />
      </BmFormSection>
    </div>
  );
}
`;
}

let written = 0;
let skipped = 0;
for (const bm of BIEN) {
  const filename = `bm-${bm.code.slice(3)}-form-inputs.tsx`;
  const filepath = join(ROOT, filename);

  // Skip nếu file đã BESPOKE (đã dùng BmFormSection làm JSX element, không phải comment)
  try {
    const existing = readFileSync(filepath, "utf8");
    if (/<BmFormSection\b|import\s+\{[^}]*\bBmFormSection\b/.test(existing)) {
      console.log(`SKIP ${filename} (đã BESPOKE)`);
      skipped += 1;
      continue;
    }
  } catch {
    // File không tồn tại → sẽ tạo mới
  }

  const content = gen(bm);
  writeFileSync(filepath, content, "utf8");
  console.log(`WROTE ${filename} (${content.split("\n").length} dòng)`);
  written += 1;
}

console.log(`\nTổng: wrote=${written}, skipped=${skipped}`);
