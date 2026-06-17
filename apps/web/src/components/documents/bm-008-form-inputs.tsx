"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

type JsonObject = Record<string, unknown>;

type Bm008Form = {
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
  sourceTransfer: {
    caseSummary: string;
    reasonLine: string;
    senderName: string;
    receiverName: string;
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

type Bm008FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void;
};

const inputClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

const textareaClass =
  "min-h-[88px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

const labelClass = "text-xs font-medium text-slate-600";

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


function isoDateToDisplayDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return "";

  return `${match[3]}/${match[2]}/${match[1]}`;
}

function displayDateToIsoDate(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());

  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (year < 1900 || year > 2100) return null;
  if (month < 1 || month > 12) return null;

  const maxDay = new Date(year, month, 0).getDate();
  if (day < 1 || day > maxDay) return null;

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function normalizeDisplayDateInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function DateTextField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [draft, setDraft] = useState(() => isoDateToDisplayDate(value));

  useEffect(() => {
    setDraft(isoDateToDisplayDate(value));
  }, [value]);

  return (
    <input
      className={inputClass}
      inputMode="numeric"
      placeholder="dd/mm/yyyy"
      value={draft}
      onChange={(event) => {
        const nextDisplayValue = normalizeDisplayDateInput(event.target.value);
        setDraft(nextDisplayValue);

        const nextIsoDate = displayDateToIsoDate(nextDisplayValue);
        if (nextIsoDate) {
          onChange(nextIsoDate);
        }
      }}
      onBlur={() => {
        const nextIsoDate = displayDateToIsoDate(draft);

        if (nextIsoDate) {
          onChange(nextIsoDate);
          setDraft(isoDateToDisplayDate(nextIsoDate));
          return;
        }

        setDraft(isoDateToDisplayDate(value));
      }}
    />
  );
}

function dateToVietnameseLine(value: string): string {
  if (!value) return "";

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;

  const year = match[1];
  const month = Number(match[2]);
  const day = Number(match[3]);

  return `${day} tháng ${month} năm ${year}`;
}


function getBm008TodayDisplayDate(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();

  return `${day}/${month}/${year}`;
}

function parseBm008DisplayDateParts(value: string): {
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

function buildBm008DisplayDate(day: string, month: string, year: string): string {
  if (!day || !month || !year) {
    return "";
  }

  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

function buildBm008IssuePlaceAndDateLine(issuePlace: string, issueDateText: string): string {
  const place = String(issuePlace ?? "").trim() || "TP. Hồ Chí Minh";
  const parts = parseBm008DisplayDateParts(issueDateText || getBm008TodayDisplayDate());

  if (!parts.day || !parts.month || !parts.year) {
    return "";
  }

  return `${place}, ngày ${Number(parts.day)} tháng ${Number(parts.month)} năm ${parts.year}`;
}

function Bm008DateSelectField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const parsed = parseBm008DisplayDateParts(value || getBm008TodayDisplayDate());

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
      onChange(buildBm008DisplayDate(next.day, next.month, next.year));
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

function defaultForm(): Bm008Form {
  return {
    agency: {
      parentName: "",
      name: "",
      bodyName: "",
      shortName: "VKSKV7",
    },
    document: {
      documentCode: "08/YC-VKSKV7",
      issuePlace: "TP. Hồ Chí Minh",
      issueDate: getBm008TodayDisplayDate(),
      issuePlaceAndDateLine: buildBm008IssuePlaceAndDateLine("TP. Hồ Chí Minh", getBm008TodayDisplayDate()),
    },
    official: {
      issuerTitle: "VIỆN TRƯỞNG",
    },
    sourceTransfer: {
      caseSummary:
        "về việc có dấu hiệu tội phạm xảy ra trên địa bàn Thành phố Hồ Chí Minh",
      reasonLine:
        "nguồn tin về tội phạm nêu trên không thuộc thẩm quyền giải quyết của Viện kiểm sát nhân dân khu vực 7, cần chuyển đến cơ quan, người có thẩm quyền để giải quyết theo quy định của pháp luật",
      senderName: "",
      receiverName:
        "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
    },
    recipients: {
      primaryLine:
        "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
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

function hydrateForm(payload: unknown): Bm008Form {
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
      issueDate: pickString(formInputs, payload, "document.issueDate", fallback.document.issueDate),
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
    sourceTransfer: {
      caseSummary: pickString(formInputs, payload, "sourceTransfer.caseSummary", fallback.sourceTransfer.caseSummary),
      reasonLine: pickString(formInputs, payload, "sourceTransfer.reasonLine", fallback.sourceTransfer.reasonLine),
      senderName: pickString(formInputs, payload, "sourceTransfer.senderName", fallback.sourceTransfer.senderName),
      receiverName: pickString(formInputs, payload, "sourceTransfer.receiverName", fallback.sourceTransfer.receiverName),
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

function buildDerivedFields(form: Bm008Form): Bm008Form {
  const issueDateLine = dateToVietnameseLine(form.document.issueDate);
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
    sourceTransfer: {
      ...form.sourceTransfer,
      senderName:
        form.sourceTransfer.senderName.trim() ||
        "Viện kiểm sát nhân dân khu vực 7",
      receiverName:
        form.sourceTransfer.receiverName.trim() ||
        "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
    },
    recipients: {
      primaryLine:
        form.recipients.primaryLine.trim() ||
        form.sourceTransfer.receiverName.trim() ||
        "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
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

function buildSaveBody(form: Bm008Form): JsonObject {
  const ready = buildDerivedFields(form);

  return {
    ...ready,
    templateCode: "BM-008",
    formInputs: ready,
    payloadOverrides: ready,
    renderPayloadOverrides: ready,
    updatedByName: ready.updatedByName,
    renderedByName: ready.renderedByName,
    convertedByName: ready.convertedByName,
  };
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">{title}</h3>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

export function Bm008FormInputsPanel({
  documentId,
  onSaved,
}: Bm008FormInputsPanelProps) {
  const [form, setForm] = useState<Bm008Form>(() => defaultForm());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [message, setMessage] = useState<string>("");

  const readyForm = useMemo(() => buildDerivedFields(form), [form]);

  function updateGroup<K extends keyof Bm008Form>(
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
      } as Bm008Form;
    });
    setIsDirty(true);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setMessage("");

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
              `Không tải được render-payload BM-008. HTTP ${response.status}`,
          );
        }

        const payload = (await response.json()) as JsonObject;

        if (!cancelled) {
          setForm(hydrateForm(payload));
          setIsDirty(false);
          setMessage("Đã tải dữ liệu BM-008.");
        }
      } catch (error) {
        if (!cancelled) {
          setForm(defaultForm());
          setIsDirty(true);
          setMessage(
            error instanceof Error
              ? error.message
              : "Không tải được dữ liệu BM-008.",
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

  async function handleSave(): Promise<Bm008Form> {
    setIsSaving(true);
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
            `Không lưu được BM-008. HTTP ${response.status}`,
        );
      }

      setForm(finalForm);
      setIsDirty(false);
      setMessage("Đã lưu BM-008. Dữ liệu vừa nhập sẽ ưu tiên khi render.");
      onSaved?.();

      return finalForm;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không lưu được BM-008.");
      throw error;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRender() {
    setIsRendering(true);
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
            `Không render được DOCX BM-008. HTTP ${renderResponse.status}`,
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
            `Không convert được PDF BM-008. HTTP ${pdfResponse.status}`,
        );
      }

      setMessage("Đã lưu và xuất lại DOCX/PDF BM-008.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Không xuất được BM-008.",
      );
    } finally {
      setIsRendering(false);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Đang tải dữ liệu BM-008...
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
              BM-008
            </p>
            <h2 className="mt-1 text-lg font-semibold">
              Yêu cầu chuyển nguồn tin về tội phạm
            </h2>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !isDirty}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-500 disabled:text-slate-300"
            >
              {isSaving ? "Đang lưu..." : "Lưu"}
            </button>

            <button
              type="button"
              onClick={handleRender}
              disabled={isSaving || isRendering}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-500"
            >
              {isRendering ? "Đang xuất..." : "Lưu & xuất"}
            </button>
          </div>
        </div>

        {message ? (
          <p className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-sm text-slate-100">
            {message}
          </p>
        ) : null}
      </div>

      <Section title="Cơ quan / số văn bản">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Cơ quan cấp trên">
            <input
              className={inputClass}
              value={form.agency.parentName}
              onChange={(e) => updateGroup("agency", "parentName", e.target.value)}
            />
          </Field>

          <Field label="Viện kiểm sát">
            <input
              className={inputClass}
              value={form.agency.name}
              onChange={(e) => updateGroup("agency", "name", e.target.value)}
            />
          </Field>

          <Field label="Tên trong thân văn bản">
            <input
              className={inputClass}
              value={form.agency.bodyName}
              onChange={(e) => updateGroup("agency", "bodyName", e.target.value)}
            />
          </Field>

          <Field label="Số yêu cầu">
            <input
              className={inputClass}
              value={form.document.documentCode}
              onChange={(e) => updateGroup("document", "documentCode", e.target.value)}
            />
          </Field>

          <Field label="Địa danh">
            <input
              className={inputClass}
              value={form.document.issuePlace}
              onChange={(e) => updateGroup("document", "issuePlace", e.target.value)}
            />
          </Field>

          <Field label="Ngày ban hành">
            <Bm008DateSelectField
              value={form.document.issueDate || getBm008TodayDisplayDate()}
              onChange={(value) => updateGroup("document", "issueDate", value)}
            />
            <p className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
              {buildBm008IssuePlaceAndDateLine(form.document.issuePlace, form.document.issueDate || getBm008TodayDisplayDate()) || "Chưa có dòng địa danh, ngày tháng"}
            </p>
          </Field>
        </div>
      </Section>

      <Section title="Nội dung chuyển nguồn tin">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Chủ thể ban hành">
            <input
              className={inputClass}
              value={form.official.issuerTitle}
              onChange={(e) => updateGroup("official", "issuerTitle", e.target.value)}
            />
          </Field>

          <Field label="Nơi nhận chính">
            <input
              className={inputClass}
              value={form.recipients.primaryLine}
              onChange={(e) => updateGroup("recipients", "primaryLine", e.target.value)}
            />
          </Field>
        </div>

        <div className="mt-3 grid gap-3">
          <Field label="Hồ sơ vụ việc">
            <textarea
              className={textareaClass}
              value={form.sourceTransfer.caseSummary}
              onChange={(e) => updateGroup("sourceTransfer", "caseSummary", e.target.value)}
            />
          </Field>

          <Field label="Lý do chuyển">
            <textarea
              className={textareaClass}
              value={form.sourceTransfer.reasonLine}
              onChange={(e) => updateGroup("sourceTransfer", "reasonLine", e.target.value)}
            />
          </Field>

          <Field label="Cơ quan/người chuyển">
            <input
              className={inputClass}
              value={form.sourceTransfer.senderName}
              onChange={(e) => updateGroup("sourceTransfer", "senderName", e.target.value)}
            />
          </Field>

          <Field label="Cơ quan/người tiếp nhận">
            <input
              className={inputClass}
              value={form.sourceTransfer.receiverName}
              onChange={(e) => updateGroup("sourceTransfer", "receiverName", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title="Ký tên">
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Ký thay">
            <input
              className={inputClass}
              value={form.signature.signMode}
              onChange={(e) => updateGroup("signature", "signMode", e.target.value)}
            />
          </Field>

          <Field label="Chức danh">
            <input
              className={inputClass}
              value={form.signature.positionTitle}
              onChange={(e) => updateGroup("signature", "positionTitle", e.target.value)}
            />
          </Field>

          <Field label="Người ký">
            <input
              className={inputClass}
              value={form.signature.signerName}
              onChange={(e) => updateGroup("signature", "signerName", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title="Preview dữ liệu dài">
        <div className="grid gap-2 text-sm text-slate-700">
          <p>
            <span className="font-semibold">Ngày ban hành:</span>{" "}
            {readyForm.document.issuePlaceAndDateLine}
          </p>

          <p>
            <span className="font-semibold">Sau khi nghiên cứu:</span>{" "}
            Sau khi nghiên cứu hồ sơ vụ việc {readyForm.sourceTransfer.caseSummary};
          </p>

          <p>
            <span className="font-semibold">Xét thấy:</span>{" "}
            Xét thấy {readyForm.sourceTransfer.reasonLine},
          </p>

          <p>
            <span className="font-semibold">Điều 1:</span>{" "}
            {readyForm.sourceTransfer.senderName} chuyển nguồn tin về tội phạm nêu trên và tài liệu, đồ vật kèm theo đến{" "}
            {readyForm.sourceTransfer.receiverName} để giải quyết theo thẩm quyền.
          </p>

          <p>
            <span className="font-semibold">Điều 2:</span>{" "}
            {readyForm.sourceTransfer.senderName} và {readyForm.sourceTransfer.receiverName} thực hiện việc chuyển và tiếp nhận, giải quyết nguồn tin về tội phạm theo đúng quy định của pháp luật và thông báo kết quả đến{" "}
            {readyForm.agency.bodyName}./.
          </p>

          <p>
            <span className="font-semibold">Chữ ký:</span>{" "}
            {readyForm.signature.signMode} — {readyForm.signature.positionTitle} — {readyForm.signature.signerName}
          </p>
        </div>
      </Section>
    </div>
  );
}

