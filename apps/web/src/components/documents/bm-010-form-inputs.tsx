"use client";

/**
 * BM-010 — Quyết định tạm đình chỉ giải quyết nguồn tin về tội phạm
 * Stage: TIEP_NHAN, Group: G01. TT 03/2026-VKSTC, Mẫu số 10/HS.
 *
 * Căn cứ: Điều 41, 42 và 160 BLTTHS.
 * Nghiệp vụ: Tạm đình chỉ giải quyết nguồn tin khi chưa có đủ kết quả giám định,
 * định giá hoặc tài liệu cần thiết để làm căn cứ khởi tố / không khởi tố.
 */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BmFormSection,
  BmFieldText,
  BmFieldTextarea,
  BmFormMetaBar,
  BmFormStatus,
} from "@/components/documents/bm-form";
import { BmFormCasePayloadButton } from "./bm-form/case-payload-button";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

type JsonObject = Record<string, unknown>;

type Bm010Form = {
  agency: {
    parentName: string;
    name: string;
    bodyName: string;
    shortName: string;
  };
  document: {
    documentCode: string;
    issuePlace: string;
    issueDate: string;
    issuePlaceAndDateLine: string;
  };
  official: {
    issuerTitle: string;
  };
  sourceSuspension: {
    reasonLine: string;
    caseSummary: string;
    receivedDate: string;
    receivedDateLine: string;
    article2Line: string;
    article3Line: string;
  };
  recipients: {
    primaryLine: string;
  };
  signature: {
    signMode: string;
    positionTitle: string;
    signerName: string;
  };
  updatedByName: string;
  renderedByName: string;
  convertedByName: string;
};

type Bm010FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void;
};

function asRecord(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

function readPath(root: unknown, path: string): { found: boolean; value: unknown } {
  const parts = path.split(".");
  let current: unknown = root;

  for (const part of parts) {
    const obj = asRecord(current);
    if (!Object.prototype.hasOwnProperty.call(obj, part)) {
      return { found: false, value: undefined };
    }
    current = obj[part];
  }

  return { found: true, value: current };
}

function firstExistingRecord(payload: unknown, paths: string[]): JsonObject {
  for (const path of paths) {
    const result = readPath(payload, path);
    if (result.found) {
      const obj = asRecord(result.value);
      if (Object.keys(obj).length > 0) return obj;
    }
  }

  return {};
}

function pickString(
  formInputs: unknown,
  payload: unknown,
  path: string,
  fallback = "",
): string {
  const saved = readPath(formInputs, path);
  if (saved.found) {
    return saved.value == null ? "" : String(saved.value);
  }

  const root = readPath(payload, path);
  if (root.found) {
    return root.value == null ? "" : String(root.value);
  }

  return fallback;
}

function getBm010TodayDisplayDate(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();

  return `${day}/${month}/${year}`;
}

function normalizeBm010DateForDisplay(value: string): string {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return getBm010TodayDisplayDate();
  }

  // Demo seed cũ. Khi mở document cũ mà chưa sửa ngày, UI phải dùng ngày hiện tại.
  if (raw === "2026-05-30" || raw === "30/05/2026") {
    return getBm010TodayDisplayDate();
  }

  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    return `${String(iso[3]).padStart(2, "0")}/${String(iso[2]).padStart(2, "0")}/${iso[1]}`;
  }

  const display = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (display) {
    return `${String(display[1]).padStart(2, "0")}/${String(display[2]).padStart(2, "0")}/${display[3]}`;
  }

  return raw;
}

function normalizeBm010IssueDateFromBackend(value: string): string {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return getBm010TodayDisplayDate();
  }

  if (raw === "2026-05-30" || raw === "30/05/2026") {
    return getBm010TodayDisplayDate();
  }

  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    return `${String(iso[3]).padStart(2, "0")}/${String(iso[2]).padStart(2, "0")}/${iso[1]}`;
  }

  const display = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (display) {
    return `${String(display[1]).padStart(2, "0")}/${String(display[2]).padStart(2, "0")}/${display[3]}`;
  }

  return raw;
}

function parseBm010DisplayDateParts(value: string): {
  day: string;
  month: string;
  year: string;
} {
  const raw = String(value ?? "").trim();

  const display = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (display) {
    return {
      day: display[1].padStart(2, "0"),
      month: display[2].padStart(2, "0"),
      year: display[3],
    };
  }

  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    return {
      day: iso[3].padStart(2, "0"),
      month: iso[2].padStart(2, "0"),
      year: iso[1],
    };
  }

  return {
    day: "",
    month: "",
    year: "",
  };
}

function buildBm010DisplayDate(day: string, month: string, year: string): string {
  if (!day || !month || !year) {
    return "";
  }

  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

function dateToVietnameseLine(value: string): string {
  const normalized = normalizeBm010DateForDisplay(value);
  if (!normalized) return "";

  const display = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(normalized);
  if (display) {
    return `${Number(display[1])} tháng ${Number(display[2])} năm ${display[3]}`;
  }

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(normalized);
  if (iso) {
    return `${Number(iso[3])} tháng ${Number(iso[2])} năm ${iso[1]}`;
  }

  return normalized;
}

function buildBm010IssuePlaceAndDateLine(issuePlace: string, issueDateText: string): string {
  const place = String(issuePlace ?? "").trim() || "TP. Hồ Chí Minh";
  const parts = parseBm010DisplayDateParts(issueDateText || getBm010TodayDisplayDate());

  if (!parts.day || !parts.month || !parts.year) {
    return "";
  }

  return `${place}, ngày ${Number(parts.day)} tháng ${Number(parts.month)} năm ${parts.year}`;
}

/**
 * Bm010DateSelectField — 3 select day/month/year giúp nhập nhanh ngày tháng.
 * Giữ nguyên local để giữ UX cũ (BM-010 yêu cầu ngày slash DD/MM/YYYY ở mọi nơi).
 */
function Bm010DateSelectField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const parsed = parseBm010DisplayDateParts(value || getBm010TodayDisplayDate());

  const dayOptions = Array.from({ length: 31 }, (_, index) =>
    String(index + 1).padStart(2, "0"),
  );

  const monthOptions = Array.from({ length: 12 }, (_, index) =>
    String(index + 1).padStart(2, "0"),
  );

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 21 }, (_, index) =>
    String(currentYear - 10 + index),
  );

  const updatePart = (
    patch: Partial<{
      day: string;
      month: string;
      year: string;
    }>,
  ) => {
    const next = {
      ...parsed,
      ...patch,
    };

    if (next.day && next.month && next.year) {
      onChange(buildBm010DisplayDate(next.day, next.month, next.year));
    }
  };

  const selectClass =
    "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  return (
    <div className="grid gap-2 md:grid-cols-3">
      <select
        className={selectClass}
        value={parsed.day}
        onChange={(event) => updatePart({ day: event.target.value })}
      >
        <option value="">Ngày</option>
        {dayOptions.map((day) => (
          <option key={day} value={day}>
            {Number(day)}
          </option>
        ))}
      </select>

      <select
        className={selectClass}
        value={parsed.month}
        onChange={(event) => updatePart({ month: event.target.value })}
      >
        <option value="">Tháng</option>
        {monthOptions.map((month) => (
          <option key={month} value={month}>
            {Number(month)}
          </option>
        ))}
      </select>

      <select
        className={selectClass}
        value={parsed.year}
        onChange={(event) => updatePart({ year: event.target.value })}
      >
        <option value="">Năm</option>
        {yearOptions.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  );
}

function defaultForm(): Bm010Form {
  return {
    agency: {
      parentName: "",
      name: "",
      bodyName: "",
      shortName: "VKSKV7",
    },
    document: {
      documentCode: "10/QĐ-VKSKV7",
      issuePlace: "TP. Hồ Chí Minh",
      issueDate: getBm010TodayDisplayDate(),
      issuePlaceAndDateLine: buildBm010IssuePlaceAndDateLine("TP. Hồ Chí Minh", getBm010TodayDisplayDate()),
    },
    official: {
      issuerTitle: "VIỆN TRƯỞNG",
    },
    sourceSuspension: {
      reasonLine:
        "vụ việc có dấu hiệu tội phạm cần tạm đình chỉ việc giải quyết do chưa có kết quả giám định, định giá tài sản hoặc chưa có tài liệu, đồ vật cần thiết để làm căn cứ giải quyết",
      caseSummary:
        "có dấu hiệu tội phạm xảy ra trên địa bàn Thành phố Hồ Chí Minh",
      receivedDate: getBm010TodayDisplayDate(),
      receivedDateLine: `ngày ${dateToVietnameseLine(getBm010TodayDisplayDate())}`,
      article2Line:
        "Việc giám định, định giá tài sản, yêu cầu cơ quan, tổ chức, cá nhân cung cấp tài liệu, đồ vật hoặc tương trợ tư pháp tiếp tục được tiến hành cho đến khi có kết quả.",
      article3Line:
        "Tài liệu, đồ vật, tài sản liên quan đến giải quyết nguồn tin về tội phạm được bảo quản, lưu trữ theo quy định của pháp luật./.",
    },
    recipients: {
      primaryLine:
        "Cơ quan, tổ chức, cá nhân đã cung cấp nguồn tin về tội phạm",
    },
    signature: {
      signMode: "KT. VIỆN TRƯỞNG",
      positionTitle: "PHÓ VIỆN TRƯỞNG",
      signerName: "",
    },
    updatedByName: "",
    renderedByName: "",
    convertedByName: "",
  };
}

function hydrateForm(payload: unknown): Bm010Form {
  const fallback = defaultForm();

  const formInputs = firstExistingRecord(payload, [
    "formInputs",
    "renderPayloadSnapshot.formInputs",
    "render_payload_snapshot.formInputs",
    "payloadOverrides",
    "renderPayloadOverrides",
  ]);

  return {
    agency: {
      parentName: pickString(formInputs, payload, "agency.parentName", fallback.agency.parentName),
      name: pickString(formInputs, payload, "agency.name", fallback.agency.name),
      bodyName: pickString(formInputs, payload, "agency.bodyName", fallback.agency.bodyName),
      shortName: pickString(formInputs, payload, "agency.shortName", fallback.agency.shortName),
    },
    document: {
      documentCode: pickString(formInputs, payload, "document.documentCode", fallback.document.documentCode),
      issuePlace: pickString(formInputs, payload, "document.issuePlace", fallback.document.issuePlace),
      issueDate: normalizeBm010IssueDateFromBackend(
        pickString(formInputs, payload, "document.issueDate", fallback.document.issueDate),
      ),
      issuePlaceAndDateLine: pickString(
        formInputs,
        payload,
        "document.issuePlaceAndDateLine",
        fallback.document.issuePlaceAndDateLine,
      ),
    },
    official: {
      issuerTitle: pickString(formInputs, payload, "official.issuerTitle", fallback.official.issuerTitle),
    },
    sourceSuspension: {
      reasonLine: pickString(formInputs, payload, "sourceSuspension.reasonLine", fallback.sourceSuspension.reasonLine),
      caseSummary: pickString(formInputs, payload, "sourceSuspension.caseSummary", fallback.sourceSuspension.caseSummary),
      receivedDate: normalizeBm010DateForDisplay(
        pickString(
          formInputs,
          payload,
          "sourceSuspension.receivedDate",
          fallback.sourceSuspension.receivedDate,
        ),
      ),
      receivedDateLine: pickString(
        formInputs,
        payload,
        "sourceSuspension.receivedDateLine",
        fallback.sourceSuspension.receivedDateLine,
      ),
      article2Line: pickString(formInputs, payload, "sourceSuspension.article2Line", fallback.sourceSuspension.article2Line),
      article3Line: pickString(formInputs, payload, "sourceSuspension.article3Line", fallback.sourceSuspension.article3Line),
    },
    recipients: {
      primaryLine: pickString(formInputs, payload, "recipients.primaryLine", fallback.recipients.primaryLine),
    },
    signature: {
      signMode: pickString(formInputs, payload, "signature.signMode", fallback.signature.signMode),
      positionTitle: pickString(formInputs, payload, "signature.positionTitle", fallback.signature.positionTitle),
      signerName: pickString(formInputs, payload, "signature.signerName", fallback.signature.signerName),
    },
    updatedByName: pickString(formInputs, payload, "updatedByName", fallback.updatedByName),
    renderedByName: pickString(formInputs, payload, "renderedByName", fallback.renderedByName),
    convertedByName: pickString(formInputs, payload, "convertedByName", fallback.convertedByName),
  };
}

function buildDerivedFields(form: Bm010Form): Bm010Form {
  const issueDateLine = dateToVietnameseLine(form.document.issueDate);
  const receivedDateLine = dateToVietnameseLine(form.sourceSuspension.receivedDate);
  const signerName = form.signature.signerName.trim() || "";

  return {
    ...form,
    document: {
      ...form.document,
      issuePlaceAndDateLine: issueDateLine
        ? `${form.document.issuePlace || "TP. Hồ Chí Minh"}, ngày ${issueDateLine}`
        : "",
    },
    agency: {
      ...form.agency,
      bodyName: form.agency.bodyName.trim() || "Viện kiểm sát nhân dân khu vực 7",
    },
    official: {
      issuerTitle: form.official.issuerTitle.trim() || "VIỆN TRƯỞNG",
    },
    sourceSuspension: {
      ...form.sourceSuspension,
      receivedDateLine: receivedDateLine ? `ngày ${receivedDateLine}` : "",
      reasonLine: form.sourceSuspension.reasonLine.trim(),
      caseSummary: form.sourceSuspension.caseSummary.trim(),
      article2Line: form.sourceSuspension.article2Line.trim(),
      article3Line: form.sourceSuspension.article3Line.trim(),
    },
    recipients: {
      primaryLine:
        form.recipients.primaryLine.trim() ||
        "Cơ quan, tổ chức, cá nhân đã cung cấp nguồn tin về tội phạm",
    },
    signature: {
      signMode: form.signature.signMode.trim() || "KT. VIỆN TRƯỞNG",
      positionTitle: form.signature.positionTitle.trim() || "PHÓ VIỆN TRƯỞNG",
      signerName,
    },
    updatedByName: signerName,
    renderedByName: signerName,
    convertedByName: signerName,
  };
}

function buildSaveBody(form: Bm010Form): JsonObject {
  const ready = buildDerivedFields(form);

  return {
    ...ready,
    templateCode: "BM-010",
    formInputs: ready,
    payloadOverrides: ready,
    renderPayloadOverrides: ready,
    updatedByName: ready.updatedByName,
    renderedByName: ready.renderedByName,
    convertedByName: ready.convertedByName,
  };
}

function PreviewSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold text-slate-900">{title}</h3>
      <div className="grid gap-2">{children}</div>
    </section>
  );
}

export function Bm010FormInputsPanel({
  documentId,
  onSaved,
}: Bm010FormInputsPanelProps) {
  const [form, setForm] = useState<Bm010Form>(() => defaultForm());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  const readyForm = useMemo(() => buildDerivedFields(form), [form]);

  function updateGroup<K extends keyof Bm010Form>(
    group: K,
    field: string,
    value: string,
  ) {
    setForm((previous) => {
      const groupValue = asRecord(previous[group]);
      return {
        ...previous,
        [group]: {
          ...groupValue,
          [field]: value,
        },
      } as Bm010Form;
    });
    setIsDirty(true);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setMessage("");
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE_URL}/documents/generated/${documentId}/render-payload`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error(
            (await response.text()) ||
              `Không tải được render-payload BM-010. HTTP ${response.status}`,
          );
        }

        const payload = (await response.json()) as JsonObject;

        if (!cancelled) {
          setForm(hydrateForm(payload));
          setIsDirty(false);
          setMessage("Đã tải dữ liệu BM-010.");
        }
      } catch (loadError) {
        if (!cancelled) {
          setForm(defaultForm());
          setIsDirty(true);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Không tải được dữ liệu BM-010.",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [documentId]);

  async function handleSave(): Promise<Bm010Form> {
    setIsSaving(true);
    setError(null);
    setMessage("");

    const finalForm = buildDerivedFields(form);
    const body = buildSaveBody(finalForm);

    try {
      const response = await fetch(
        `${API_BASE_URL}/documents/generated/${documentId}/form-inputs`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json; charset=utf-8",
          },
          body: JSON.stringify(body),
        },
      );

      if (!response.ok) {
        throw new Error(
          (await response.text()) ||
            `Không lưu được BM-010. HTTP ${response.status}`,
        );
      }

      setForm(finalForm);
      setIsDirty(false);
      setMessage("Đã lưu BM-010. Dữ liệu vừa nhập sẽ ưu tiên khi render.");
      onSaved?.();

      return finalForm;
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Không lưu được BM-010.",
      );
      throw saveError;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRender() {
    setIsRendering(true);
    setError(null);
    setMessage("");

    try {
      const finalForm = await handleSave();

      const renderResponse = await fetch(
        `${API_BASE_URL}/documents/generated/${documentId}/render-docx`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({
            force: true,
            renderedByName: finalForm.signature.signerName,
          }),
        },
      );

      if (!renderResponse.ok) {
        throw new Error(
          (await renderResponse.text()) ||
            `Không render được DOCX BM-010. HTTP ${renderResponse.status}`,
        );
      }

      const pdfResponse = await fetch(
        `${API_BASE_URL}/documents/generated/${documentId}/convert-pdf`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({
            force: true,
            convertedByName: finalForm.signature.signerName,
          }),
        },
      );

      if (!pdfResponse.ok) {
        throw new Error(
          (await pdfResponse.text()) ||
            `Không convert được PDF BM-010. HTTP ${pdfResponse.status}`,
        );
      }

      setMessage("Đã lưu và xuất lại DOCX/PDF BM-010.");
    } catch (renderError) {
      setError(
        renderError instanceof Error
          ? renderError.message
          : "Không xuất được BM-010.",
      );
    } finally {
      setIsRendering(false);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Đang tải dữ liệu BM-010...
      </div>
    );
  }

  const status = error
    ? { kind: "error" as const, text: error }
    : message
      ? { kind: "success" as const, text: message }
      : isDirty
        ? {
            kind: "warning" as const,
            text: "Có thay đổi chưa lưu. Nhấn Lưu hoặc Lưu & xuất để đồng bộ.",
          }
        : { kind: "idle" as const, text: "" };

  return (
    <div className="space-y-5">
      <BmFormMetaBar
        templateCode="BM-010"
        title="Quyết định tạm đình chỉ giải quyết nguồn tin về tội phạm"
        subtitle="Biểu mẫu TT 03/2026-VKSTC · Mẫu số 10/HS · Stage TIEP_NHAN (G01). Căn cứ Điều 41, 42 và 160 BLTTHS."
        isDirty={isDirty}
        isLoading={isLoading}
        isSaving={isSaving}
        savedAt={null}
        errorMessage={error ?? undefined}
        warningMessage={status.kind === "warning" ? status.text : undefined}
        successMessage={status.kind === "success" ? status.text : undefined}
        primaryLabel="Lưu dữ liệu BM-010"
        onPrimary={handleSave}
        primaryDisabled={isSaving || isRendering || !isDirty}
        secondaryLabel="Lưu & xuất DOCX/PDF"
        onSecondary={handleRender}
        extraActions={
          <BmFormCasePayloadButton
            templateCode="BM-010"
            form={form}
            onApply={(next) => {
              setForm(next as typeof form);
              setIsDirty(true);
            }}
          />
        }
      />

      {status.kind === "idle" ? null : (
        <BmFormStatus
          kind={status.kind}
          title={
            status.kind === "success"
              ? "Thành công"
              : status.kind === "error"
                ? "Lỗi"
                : status.kind === "warning"
                  ? "Cảnh báo"
                  : undefined
          }
        >
          {status.text}
        </BmFormStatus>
      )}

      <BmFormSection
        title="1. Cơ quan / số quyết định"
        description="Phần header: cơ quan ban hành, số quyết định, địa danh, ngày ban hành."
      >
        <BmFieldText
          label="Cơ quan cấp trên"
          value={form.agency.parentName}
          onChange={(v) => updateGroup("agency", "parentName", v)}
        />

        <BmFieldText
          label="Viện kiểm sát"
          value={form.agency.name}
          onChange={(v) => updateGroup("agency", "name", v)}
        />

        <BmFieldText
          label="Tên trong thân văn bản"
          value={form.agency.bodyName}
          onChange={(v) => updateGroup("agency", "bodyName", v)}
        />

        <BmFieldText
          label="Số quyết định"
          value={form.document.documentCode}
          onChange={(v) => updateGroup("document", "documentCode", v)}
        />

        <BmFieldText
          label="Địa danh"
          value={form.document.issuePlace}
          onChange={(v) => updateGroup("document", "issuePlace", v)}
        />

        <div className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-700">
            Ngày ban hành
          </span>
          <Bm010DateSelectField
            value={form.document.issueDate || getBm010TodayDisplayDate()}
            onChange={(v) => updateGroup("document", "issueDate", v)}
          />
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
            {buildBm010IssuePlaceAndDateLine(
              form.document.issuePlace,
              form.document.issueDate || getBm010TodayDisplayDate(),
            ) || "Chưa có dòng địa danh, ngày tháng"}
          </p>
        </div>
      </BmFormSection>

      <BmFormSection
        title="2. Nội dung tạm đình chỉ"
        description="Lý do xét thấy, vụ việc, ngày tiếp nhận, Điều 2/3, nơi nhận chính."
        fullWidth
      >
        <BmFieldText
          label="Chủ thể ban hành"
          value={form.official.issuerTitle}
          onChange={(v) => updateGroup("official", "issuerTitle", v)}
        />

        <div className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-700">
            Ngày tiếp nhận nguồn tin
          </span>
          <Bm010DateSelectField
            value={form.sourceSuspension.receivedDate || getBm010TodayDisplayDate()}
            onChange={(v) => updateGroup("sourceSuspension", "receivedDate", v)}
          />
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
            {`ngày ${dateToVietnameseLine(form.sourceSuspension.receivedDate || getBm010TodayDisplayDate())}`}
          </p>
        </div>

        <BmFieldTextarea
          label="Lý do xét thấy"
          rows={2}
          value={form.sourceSuspension.reasonLine}
          onChange={(v) => updateGroup("sourceSuspension", "reasonLine", v)}
          fullWidth
        />

        <BmFieldTextarea
          label="Vụ việc"
          rows={2}
          value={form.sourceSuspension.caseSummary}
          onChange={(v) => updateGroup("sourceSuspension", "caseSummary", v)}
          fullWidth
        />

        <BmFieldTextarea
          label="Điều 2"
          rows={2}
          value={form.sourceSuspension.article2Line}
          onChange={(v) => updateGroup("sourceSuspension", "article2Line", v)}
          fullWidth
        />

        <BmFieldTextarea
          label="Điều 3"
          rows={2}
          value={form.sourceSuspension.article3Line}
          onChange={(v) => updateGroup("sourceSuspension", "article3Line", v)}
          fullWidth
        />

        <BmFieldText
          label="Nơi nhận chính"
          value={form.recipients.primaryLine}
          onChange={(v) => updateGroup("recipients", "primaryLine", v)}
          fullWidth
        />
      </BmFormSection>

      <BmFormSection title="3. Ký tên">
        <BmFieldText
          label="Ký thay"
          value={form.signature.signMode}
          onChange={(v) => updateGroup("signature", "signMode", v)}
        />

        <BmFieldText
          label="Chức danh"
          value={form.signature.positionTitle}
          onChange={(v) => updateGroup("signature", "positionTitle", v)}
        />

        <BmFieldText
          label="Người ký"
          value={form.signature.signerName}
          onChange={(v) => updateGroup("signature", "signerName", v)}
        />
      </BmFormSection>

      <PreviewSection title="Preview dữ liệu dài">
        <p>
          <span className="font-semibold">Ngày ban hành:</span>{" "}
          {readyForm.document.issuePlaceAndDateLine || "(trống)"}
        </p>

        <p>
          <span className="font-semibold">Xét thấy:</span> Xét thấy{" "}
          {readyForm.sourceSuspension.reasonLine || "(trống)"},
        </p>

        <p>
          <span className="font-semibold">Điều 1:</span> Tạm đình chỉ việc giải
          quyết nguồn tin về tội phạm đối với vụ việc{" "}
          {readyForm.sourceSuspension.caseSummary || "(trống)"} do{" "}
          {readyForm.agency.bodyName} tiếp nhận{" "}
          {readyForm.sourceSuspension.receivedDateLine || "(trống)"}.
        </p>

        <p>
          <span className="font-semibold">Điều 2:</span>{" "}
          {readyForm.sourceSuspension.article2Line || "(trống)"}
        </p>

        <p>
          <span className="font-semibold">Điều 3:</span>{" "}
          {readyForm.sourceSuspension.article3Line || "(trống)"}
        </p>

        <p>
          <span className="font-semibold">Chữ ký:</span>{" "}
          {readyForm.signature.signMode} — {readyForm.signature.positionTitle} —{" "}
          {readyForm.signature.signerName || "(trống)"}
        </p>
      </PreviewSection>
    </div>
  );
}
