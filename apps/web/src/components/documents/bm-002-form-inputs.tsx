"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

type JsonObject = Record<string, unknown>;

type Bm002Form = {
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
  receiver: {
    name: string;
  };
  sourceReport: {
    receivedDate: string;
    receivedDateLine: string;
    content: string;
  };
  sourceTransfer: {
    attachedItemsDescription: string;
  };
  recipients: {
    primaryLine: string;
    archiveLine: string;
  };
  reporter: {
    fullName: string;
    genderText: string;
    otherName: string;
    birthDate: string;
    birthDateLine: string;
    birthPlace: string;
    nationality: string;
    ethnicity: string;
    religion: string;
    occupation: string;
    identityNumber: string;
    identityIssueDate: string;
    identityIssueDateLine: string;
    identityIssuePlace: string;
    permanentResidence: string;
    temporaryResidence: string;
    currentResidence: string;
    phoneNumber: string;
    organizationRepresentative: string;
  };
  signature: {
    positionTitle: string;
    signerName: string;
  };
  updatedByName: string;
  renderedByName: string;
  convertedByName: string;
};

type Bm002FormInputsPanelProps = {
  documentId: string | number;
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


function getBm002TodayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseBm002DateParts(value: string): {
  day: string;
  month: string;
  year: string;
} {
  const raw = String(value ?? "").trim();

  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    return {
      year: iso[1],
      month: iso[2].padStart(2, "0"),
      day: iso[3].padStart(2, "0"),
    };
  }

  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    return {
      day: slash[1].padStart(2, "0"),
      month: slash[2].padStart(2, "0"),
      year: slash[3],
    };
  }

  return {
    day: "",
    month: "",
    year: "",
  };
}

function buildBm002IsoDate(day: string, month: string, year: string): string {
  if (!day || !month || !year) {
    return "";
  }

  const dayNumber = Number(day);
  const monthNumber = Number(month);
  const yearNumber = Number(year);

  if (!Number.isFinite(dayNumber) || !Number.isFinite(monthNumber) || !Number.isFinite(yearNumber)) {
    return "";
  }

  if (yearNumber < 1900 || yearNumber > 2100) return "";
  if (monthNumber < 1 || monthNumber > 12) return "";

  const maxDay = new Date(yearNumber, monthNumber, 0).getDate();
  if (dayNumber < 1 || dayNumber > maxDay) return "";

  return `${yearNumber}-${String(monthNumber).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
}

function Bm002DateSelectField({
  value,
  onChange,
  minYear = 1900,
  maxYear = new Date().getFullYear() + 10,
}: {
  value: string;
  onChange: (value: string) => void;
  minYear?: number;
  maxYear?: number;
}) {
  const parsed = parseBm002DateParts(value);

  const dayOptions = Array.from({ length: 31 }, (_, index) =>
    String(index + 1).padStart(2, "0"),
  );

  const monthOptions = Array.from({ length: 12 }, (_, index) =>
    String(index + 1).padStart(2, "0"),
  );

  const safeMinYear = Math.min(minYear, maxYear);
  const safeMaxYear = Math.max(minYear, maxYear);
  const yearOptions = Array.from(
    { length: safeMaxYear - safeMinYear + 1 },
    (_, index) => String(safeMinYear + index),
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
      const nextIsoDate = buildBm002IsoDate(next.day, next.month, next.year);
      if (nextIsoDate) {
        onChange(nextIsoDate);
      }
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


function buildBm002IssuePlaceAndDateLine(issuePlace: string, issueDate: string): string {
  const place = String(issuePlace ?? "").trim() || "TP. Hồ Chí Minh";
  const line = dateToVietnameseLine(issueDate);

  return line ? `${place}, ngày ${line}` : "";
}

function defaultForm(): Bm002Form {
  return {
    agency: {
      parentName: "",
      name: "",
      bodyName: "",
      shortName: "VKSKV7",
    },
    document: {
      documentCode: "02/PC-VKSKV7",
      issuePlace: "TP. Hồ Chí Minh",
      issueDate: getBm002TodayIso(),
      issuePlaceAndDateLine: `TP. Hồ Chí Minh, ngày ${dateToVietnameseLine(getBm002TodayIso())}`,
    },
    receiver: {
      name: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
    },
    sourceReport: {
      receivedDate: "2026-05-30",
      receivedDateLine: "30 tháng 5 năm 2026",
      content:
        "Tố giác về hành vi có dấu hiệu tội phạm xảy ra trên địa bàn Thành phố Hồ Chí Minh, cần được chuyển đến cơ quan có thẩm quyền để tiếp nhận, kiểm tra, xác minh và giải quyết theo quy định của pháp luật.",
    },
    sourceTransfer: {
      attachedItemsDescription:
        "tài liệu, đồ vật kèm theo gồm đơn trình báo, bản tường trình và các tài liệu liên quan",
    },
    recipients: {
      primaryLine: "- Như trên;",
      archiveLine: "- Lưu: HSKS, VP.",
    },
    reporter: {
      fullName: "Nguyễn Thị Hồng Hạnh",
      genderText: "Nữ",
      otherName: "Không",
      birthDate: "1990-05-12",
      birthDateLine: "12 tháng 5 năm 1990",
      birthPlace: "Thành phố Hồ Chí Minh",
      nationality: "Việt Nam",
      ethnicity: "Kinh",
      religion: "Không",
      occupation: "Lao động tự do",
      identityNumber: "079190000001",
      identityIssueDate: "2021-06-15",
      identityIssueDateLine: "15 tháng 6 năm 2021",
      identityIssuePlace: "Cục Cảnh sát quản lý hành chính về trật tự xã hội",
      permanentResidence:
        "Số 13/4A, Ấp 107, xã Đông Thạnh, Thành phố Hồ Chí Minh",
      temporaryResidence: "Không",
      currentResidence:
        "Số 13/4A, Ấp 107, xã Đông Thạnh, Thành phố Hồ Chí Minh",
      phoneNumber: "",
      organizationRepresentative: "Không",
    },
    signature: {
      positionTitle: "KIỂM SÁT VIÊN",
      signerName: "",
    },
    updatedByName: "",
    renderedByName: "",
    convertedByName: "",
  };
}

function hydrateForm(payload: unknown): Bm002Form {
  const fallback = defaultForm();
  const formInputs = asRecord(readPath(payload, "formInputs").value);

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
      issueDate: pickString(formInputs, { document: {} }, "document.issueDate", getBm002TodayIso()),
      issuePlaceAndDateLine: buildBm002IssuePlaceAndDateLine(
        pickString(formInputs, payload, "document.issuePlace", fallback.document.issuePlace),
        pickString(formInputs, { document: {} }, "document.issueDate", getBm002TodayIso()),
      ),
    },
    receiver: {
      name: pickString(formInputs, payload, "receiver.name", fallback.receiver.name),
    },
    sourceReport: {
      receivedDate: pickString(formInputs, payload, "sourceReport.receivedDate", fallback.sourceReport.receivedDate),
      receivedDateLine: pickString(
        formInputs,
        payload,
        "sourceReport.receivedDateLine",
        fallback.sourceReport.receivedDateLine,
      ),
      content: pickString(formInputs, payload, "sourceReport.content", fallback.sourceReport.content),
    },
    sourceTransfer: {
      attachedItemsDescription: pickString(
        formInputs,
        payload,
        "sourceTransfer.attachedItemsDescription",
        fallback.sourceTransfer.attachedItemsDescription,
      ),
    },
    recipients: {
      primaryLine: pickString(
        formInputs,
        payload,
        "recipients.primaryLine",
        fallback.recipients.primaryLine,
      ),
      archiveLine: pickString(
        formInputs,
        payload,
        "recipients.archiveLine",
        fallback.recipients.archiveLine,
      ),
    },
    reporter: {
      fullName: pickString(formInputs, payload, "reporter.fullName", fallback.reporter.fullName),
      genderText: pickString(formInputs, payload, "reporter.genderText", fallback.reporter.genderText),
      otherName: pickString(formInputs, payload, "reporter.otherName", fallback.reporter.otherName),
      birthDate: pickString(formInputs, payload, "reporter.birthDate", fallback.reporter.birthDate),
      birthDateLine: pickString(formInputs, payload, "reporter.birthDateLine", fallback.reporter.birthDateLine),
      birthPlace: pickString(formInputs, payload, "reporter.birthPlace", fallback.reporter.birthPlace),
      nationality: pickString(formInputs, payload, "reporter.nationality", fallback.reporter.nationality),
      ethnicity: pickString(formInputs, payload, "reporter.ethnicity", fallback.reporter.ethnicity),
      religion: pickString(formInputs, payload, "reporter.religion", fallback.reporter.religion),
      occupation: pickString(formInputs, payload, "reporter.occupation", fallback.reporter.occupation),
      identityNumber: pickString(formInputs, payload, "reporter.identityNumber", fallback.reporter.identityNumber),
      identityIssueDate: pickString(formInputs, payload, "reporter.identityIssueDate", fallback.reporter.identityIssueDate),
      identityIssueDateLine: pickString(
        formInputs,
        payload,
        "reporter.identityIssueDateLine",
        fallback.reporter.identityIssueDateLine,
      ),
      identityIssuePlace: pickString(
        formInputs,
        payload,
        "reporter.identityIssuePlace",
        fallback.reporter.identityIssuePlace,
      ),
      permanentResidence: pickString(
        formInputs,
        payload,
        "reporter.permanentResidence",
        fallback.reporter.permanentResidence,
      ),
      temporaryResidence: pickString(
        formInputs,
        payload,
        "reporter.temporaryResidence",
        fallback.reporter.temporaryResidence,
      ),
      currentResidence: pickString(
        formInputs,
        payload,
        "reporter.currentResidence",
        fallback.reporter.currentResidence,
      ),
      phoneNumber: pickString(formInputs, payload, "reporter.phoneNumber", fallback.reporter.phoneNumber),
      organizationRepresentative: pickString(
        formInputs,
        payload,
        "reporter.organizationRepresentative",
        fallback.reporter.organizationRepresentative,
      ),
    },
    signature: {
      positionTitle: pickString(formInputs, payload, "signature.positionTitle", fallback.signature.positionTitle),
      signerName: pickString(formInputs, payload, "signature.signerName", fallback.signature.signerName),
    },
    updatedByName: pickString(formInputs, payload, "updatedByName", fallback.updatedByName),
    renderedByName: pickString(formInputs, payload, "renderedByName", fallback.renderedByName),
    convertedByName: pickString(formInputs, payload, "convertedByName", fallback.convertedByName),
  };
}

function buildDerivedFields(form: Bm002Form): Bm002Form {
  const issueDateLine = dateToVietnameseLine(form.document.issueDate);
  const receivedDateLine = dateToVietnameseLine(form.sourceReport.receivedDate);
  const birthDateLine = dateToVietnameseLine(form.reporter.birthDate);
  const identityIssueDateLine = dateToVietnameseLine(form.reporter.identityIssueDate);

  const signerName = form.signature.signerName.trim() || "";

  return {
    ...form,
    document: {
      ...form.document,
      issuePlaceAndDateLine: buildBm002IssuePlaceAndDateLine(
        form.document.issuePlace,
        form.document.issueDate || getBm002TodayIso(),
      ),
    },
    sourceReport: {
      ...form.sourceReport,
      receivedDateLine,
    },
    reporter: {
      ...form.reporter,
      birthDateLine,
      identityIssueDateLine,
    },
    recipients: {
      primaryLine: form.recipients.primaryLine.trim() || "- Như trên;",
      archiveLine: form.recipients.archiveLine.trim() || "- Lưu: HSKS, VP.",
    },
    signature: {
      positionTitle: form.signature.positionTitle.trim() || "KIỂM SÁT VIÊN",
      signerName,
    },
    updatedByName: signerName,
    renderedByName: signerName,
    convertedByName: signerName,
  };
}

function buildSaveBody(form: Bm002Form): JsonObject {
  const ready = buildDerivedFields(form);

  // BM-002 không dùng signature.signMode.
  const payload: JsonObject = {
    ...ready,
    templateCode: "BM-002",
    formInputs: ready,
    payloadOverrides: ready,
    renderPayloadOverrides: ready,
    updatedByName: ready.updatedByName,
    renderedByName: ready.renderedByName,
    convertedByName: ready.convertedByName,
  };

  return payload;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
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
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

export function Bm002FormInputsPanel({ documentId }: Bm002FormInputsPanelProps) {
  const [form, setForm] = useState<Bm002Form>(() => defaultForm());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [message, setMessage] = useState<string>("");

  const readyForm = useMemo(() => buildDerivedFields(form), [form]);

  function updateGroup<K extends keyof Bm002Form>(
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
      } as Bm002Form;
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
              `Không tải được render-payload BM-002. HTTP ${response.status}`,
          );
        }

        const payload = (await response.json()) as JsonObject;
        if (!cancelled) {
          setForm(hydrateForm(payload));
          setIsDirty(false);
          setMessage("Đã tải dữ liệu BM-002.");
        }
      } catch (error) {
        if (!cancelled) {
          setForm(defaultForm());
          setIsDirty(true);
          setMessage(
            error instanceof Error
              ? error.message
              : "Không tải được dữ liệu BM-002.",
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

  async function handleSave() {
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
            `Không lưu được BM-002. HTTP ${response.status}`,
        );
      }

      // Source of truth sau khi bấm Lưu là state vừa nhập, không lấy response seed cũ.
      setForm(finalForm);
      setIsDirty(false);
      setMessage("Đã lưu BM-002. Render-payload sẽ ưu tiên dữ liệu vừa nhập.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không lưu được BM-002.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRender() {
    setIsRendering(true);
    setMessage("");

    try {
      await handleSave();

      const renderResponse = await fetch(
        `${API_BASE_URL}/documents/generated/${documentId}/render-docx`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({
            force: true,
            renderedByName: readyForm.signature.signerName,
          }),
        },
      );

      if (!renderResponse.ok) {
        throw new Error(
          (await renderResponse.text()) ||
            `Không render được DOCX BM-002. HTTP ${renderResponse.status}`,
        );
      }

      const pdfResponse = await fetch(
        `${API_BASE_URL}/documents/generated/${documentId}/convert-pdf`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({
            force: true,
            convertedByName: readyForm.signature.signerName,
          }),
        },
      );

      if (!pdfResponse.ok) {
        throw new Error(
          (await pdfResponse.text()) ||
            `Không convert được PDF BM-002. HTTP ${pdfResponse.status}`,
        );
      }

      setMessage("Đã lưu và xuất lại DOCX/PDF BM-002.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Không xuất được BM-002.",
      );
    } finally {
      setIsRendering(false);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Đang tải dữ liệu BM-002...
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
              BM-002
            </p>
            <h2 className="mt-1 text-lg font-semibold">
              Phiếu chuyển nguồn tin về tội phạm
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

      <Section title="Cơ quan / số phiếu">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Cơ quan cấp trên">
            <input className={inputClass} value={form.agency.parentName} onChange={(e) => updateGroup("agency", "parentName", e.target.value)} />
          </Field>
          <Field label="Viện kiểm sát">
            <input className={inputClass} value={form.agency.name} onChange={(e) => updateGroup("agency", "name", e.target.value)} />
          </Field>
          <Field label="Tên trong thân văn bản">
            <input className={inputClass} value={form.agency.bodyName} onChange={(e) => updateGroup("agency", "bodyName", e.target.value)} />
          </Field>
          <Field label="Số phiếu">
            <input className={inputClass} value={form.document.documentCode} onChange={(e) => updateGroup("document", "documentCode", e.target.value)} />
          </Field>
          <Field label="Địa danh">
            <input className={inputClass} value={form.document.issuePlace} onChange={(e) => updateGroup("document", "issuePlace", e.target.value)} />
          </Field>
          <Field label="Ngày ban hành">
            <Bm002DateSelectField
              value={form.document.issueDate}
              onChange={(value) => updateGroup("document", "issueDate", value)}
            />
            <p className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
              {readyForm.document.issuePlaceAndDateLine || "Chưa có dòng địa danh, ngày tháng"}
            </p>
          </Field>
        </div>
      </Section>

      <Section title="Nguồn tin">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Kính gửi">
            <input className={inputClass} value={form.receiver.name} onChange={(e) => updateGroup("receiver", "name", e.target.value)} />
          </Field>
          <Field label="Ngày nhận nguồn tin">
            <Bm002DateSelectField
              value={form.sourceReport.receivedDate}
              onChange={(value) => updateGroup("sourceReport", "receivedDate", value)}
              minYear={1900}
              maxYear={new Date().getFullYear() + 10}
            />
          </Field>
        </div>
        <div className="mt-3 grid gap-3">
          <Field label="Nội dung nguồn tin">
            <textarea className={textareaClass} value={form.sourceReport.content} onChange={(e) => updateGroup("sourceReport", "content", e.target.value)} />
          </Field>
          <Field label="Tài liệu / đồ vật kèm theo">
            <textarea className={textareaClass} value={form.sourceTransfer.attachedItemsDescription} onChange={(e) => updateGroup("sourceTransfer", "attachedItemsDescription", e.target.value)} />
          </Field>
        </div>
      </Section>

      <Section title="Người cung cấp nguồn tin">
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Họ tên">
            <input className={inputClass} value={form.reporter.fullName} onChange={(e) => updateGroup("reporter", "fullName", e.target.value)} />
          </Field>
          <Field label="Giới tính">
            <input className={inputClass} value={form.reporter.genderText} onChange={(e) => updateGroup("reporter", "genderText", e.target.value)} />
          </Field>
          <Field label="Tên gọi khác">
            <input className={inputClass} value={form.reporter.otherName} onChange={(e) => updateGroup("reporter", "otherName", e.target.value)} />
          </Field>
          <Field label="Ngày sinh">
            <Bm002DateSelectField
              value={form.reporter.birthDate}
              onChange={(value) => updateGroup("reporter", "birthDate", value)}
              minYear={1900}
              maxYear={new Date().getFullYear()}
            />
          </Field>
          <Field label="Nơi sinh">
            <input className={inputClass} value={form.reporter.birthPlace} onChange={(e) => updateGroup("reporter", "birthPlace", e.target.value)} />
          </Field>
          <Field label="Nghề nghiệp">
            <input className={inputClass} value={form.reporter.occupation} onChange={(e) => updateGroup("reporter", "occupation", e.target.value)} />
          </Field>
          <Field label="Quốc tịch">
            <input className={inputClass} value={form.reporter.nationality} onChange={(e) => updateGroup("reporter", "nationality", e.target.value)} />
          </Field>
          <Field label="Dân tộc">
            <input className={inputClass} value={form.reporter.ethnicity} onChange={(e) => updateGroup("reporter", "ethnicity", e.target.value)} />
          </Field>
          <Field label="Tôn giáo">
            <input className={inputClass} value={form.reporter.religion} onChange={(e) => updateGroup("reporter", "religion", e.target.value)} />
          </Field>
          <Field label="Số CMND/CCCD/Hộ chiếu">
            <input className={inputClass} value={form.reporter.identityNumber} onChange={(e) => updateGroup("reporter", "identityNumber", e.target.value)} />
          </Field>
          <Field label="Ngày cấp">
            <Bm002DateSelectField
              value={form.reporter.identityIssueDate}
              onChange={(value) => updateGroup("reporter", "identityIssueDate", value)}
              minYear={1900}
              maxYear={new Date().getFullYear() + 10}
            />
          </Field>
          <Field label="Nơi cấp">
            <input className={inputClass} value={form.reporter.identityIssuePlace} onChange={(e) => updateGroup("reporter", "identityIssuePlace", e.target.value)} />
          </Field>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Field label="Nơi thường trú">
            <textarea className={textareaClass} value={form.reporter.permanentResidence} onChange={(e) => updateGroup("reporter", "permanentResidence", e.target.value)} />
          </Field>
          <Field label="Nơi tạm trú">
            <textarea className={textareaClass} value={form.reporter.temporaryResidence} onChange={(e) => updateGroup("reporter", "temporaryResidence", e.target.value)} />
          </Field>
          <Field label="Nơi ở hiện tại">
            <textarea className={textareaClass} value={form.reporter.currentResidence} onChange={(e) => updateGroup("reporter", "currentResidence", e.target.value)} />
          </Field>
          <div className="grid gap-3">
            <Field label="Số điện thoại">
              <input className={inputClass} value={form.reporter.phoneNumber} onChange={(e) => updateGroup("reporter", "phoneNumber", e.target.value)} />
            </Field>
            <Field label="Đại diện tổ chức nếu có">
              <input className={inputClass} value={form.reporter.organizationRepresentative} onChange={(e) => updateGroup("reporter", "organizationRepresentative", e.target.value)} />
            </Field>
          </div>
        </div>
      </Section>

      <Section title="Nơi nhận">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Dòng người nhận chính">
            <input
              className={inputClass}
              value={form.recipients.primaryLine}
              onChange={(e) => updateGroup("recipients", "primaryLine", e.target.value)}
            />
          </Field>
          <Field label="Dòng lưu hồ sơ">
            <input
              className={inputClass}
              value={form.recipients.archiveLine}
              onChange={(e) => updateGroup("recipients", "archiveLine", e.target.value)}
            />
          </Field>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Lưu ý: template BM-002 hiện chưa có placeholder recipients.*, nên block này trước mắt phục vụ lưu dữ liệu FE/snapshot. Nếu muốn in ra DOCX/PDF, cần patch template hoặc renderer ở bước kế tiếp.
        </p>
      </Section>

      <Section title="Ký tên">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Chức danh">
            <input className={inputClass} value={form.signature.positionTitle} onChange={(e) => updateGroup("signature", "positionTitle", e.target.value)} />
          </Field>
          <Field label="Người ký">
            <input className={inputClass} value={form.signature.signerName} onChange={(e) => updateGroup("signature", "signerName", e.target.value)} />
          </Field>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          BM-002 không dùng KT. VIỆN TRƯỞNG / PHÓ VIỆN TRƯỞNG.
        </p>
      </Section>

      <Section title="Preview dữ liệu dài">
        <div className="grid gap-2 text-sm text-slate-700">
          <p>
            <span className="font-semibold">Dòng ngày nhận:</span>{" "}
            Ngày {readyForm.sourceReport.receivedDateLine}, {readyForm.agency.bodyName}
          </p>
          <p>
            <span className="font-semibold">Nội dung:</span>{" "}
            {readyForm.sourceReport.content}
          </p>
          <p>
            <span className="font-semibold">Đoạn chuyển nguồn tin:</span>{" "}
            Căn cứ quy định tại khoản 2 Điều 146 của Bộ luật Tố tụng hình sự,{" "}
            {readyForm.agency.bodyName} chuyển nguồn tin về tội phạm, kèm theo{" "}
            {readyForm.sourceTransfer.attachedItemsDescription} đến{" "}
            {readyForm.receiver.name} để giải quyết theo thẩm quyền và thông báo kết quả đến{" "}
            {readyForm.agency.bodyName}./.
          </p>
          <p>
            <span className="font-semibold">Nơi nhận:</span>{" "}
            {readyForm.recipients.primaryLine} {readyForm.recipients.archiveLine}
          </p>
          <p>
            <span className="font-semibold">Chữ ký:</span>{" "}
            {readyForm.signature.positionTitle} — {readyForm.signature.signerName}
          </p>
        </div>
      </Section>
    </div>
  );
}

