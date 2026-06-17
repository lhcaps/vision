"use client";

import * as React from "react";

type SaveStatus = "idle" | "saving" | "success" | "error";

type Bm172FormState = {
  documentCode: string;
  issueDate: string;

  issuingAgencyParent: string;
  issuingAgency: string;
  issuingPlace: string;

  caseInitiationNumber: string;
  caseInitiationDate: string;
  caseInitiationAgency: string;
  crimeName: string;
  crimeClause: string;
  crimeArticle: string;

  defendantInitiationNumber: string;
  defendantInitiationDate: string;
  defendantInitiationAgency: string;
  defendantName: string;

  propertyReturnDecisionNumber: string;
  propertyReturnDecisionDate: string;
  propertyReturnDecisionAgency: string;
  propertyName: string;
  propertyRecoveryAgency: string;

  propertyRecipientName: string;
  propertyRecipientGender: string;
  propertyRecipientAliasName: string;
  propertyRecipientBirthDate: string;
  propertyRecipientBirthPlace: string;
  propertyRecipientNationality: string;
  propertyRecipientEthnicity: string;
  propertyRecipientReligion: string;
  propertyRecipientOccupation: string;
  propertyRecipientIdentityNumber: string;
  propertyRecipientIdentityIssueDate: string;
  propertyRecipientIdentityIssuePlace: string;
  propertyRecipientPermanentResidence: string;
  propertyRecipientTemporaryResidence: string;
  propertyRecipientCurrentResidence: string;

  recipientsPrimaryLine: string;
  recipientsPropertyRecipientLine: string;
  recipientsArchiveLine: string;

  signMode: string;
  positionTitle: string;
  signerName: string;

  updatedByName: string;
  renderedByName: string;
  convertedByName: string;
};

type Bm172FormInputsProps = {
  value?: Partial<Bm172FormState> | null;
  initialValue?: Partial<Bm172FormState> | null;
  disabled?: boolean;
  isSaving?: boolean;
  onChange?: (value: any) => void;
  onSave?: (value: any) => void | Promise<void>;
  onReload?: () => void | Promise<void>;
};

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function todayYmd(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

function parseYmd(value?: string): { year: number; month: number; day: number } {
  const today = todayYmd();
  const source = value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : today;
  const [year, month, day] = source.split("-").map(Number);
  return { year, month, day };
}

function toYmd(year: number, month: number, day: number): string {
  const safeDay = Math.min(day, daysInMonth(year, month));
  return `${year}-${pad2(month)}-${pad2(safeDay)}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function ymdToVietnameseDateLine(value?: string): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const { year, month, day } = parseYmd(value);
  return `ngày ${pad2(day)} tháng ${month} năm ${year}`;
}

function issuePlaceAndDateLine(place: string, issueDate: string): string {
  return `${place || "TP. Hồ Chí Minh"}, ${ymdToVietnameseDateLine(issueDate)}`;
}

function getDocumentIdFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const match = window.location.pathname.match(/\/documents\/([^/?#]+)/);
  return match?.[1] ?? null;
}

function apiBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return "http://localhost:3001/api/v1";
}

function defaultState(): Bm172FormState {
  const today = todayYmd();

  return {
    documentCode: `172/${Date.now()}/VKSKV7`,
    issueDate: today,

    issuingAgencyParent: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
    issuingAgency: "Viện kiểm sát nhân dân khu vực 7",
    issuingPlace: "TP. Hồ Chí Minh",

    caseInitiationNumber: "172/QĐ-VKSKV7",
    caseInitiationDate: today,
    caseInitiationAgency: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
    crimeName: "Chơi ma túy",
    crimeClause: "1",
    crimeArticle: "321",

    defendantInitiationNumber: "172/QĐ-VKSKV7",
    defendantInitiationDate: today,
    defendantInitiationAgency: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
    defendantName: "",

    propertyReturnDecisionNumber: "171/QĐ-VKSKV7",
    propertyReturnDecisionDate: today,
    propertyReturnDecisionAgency: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
    propertyName: "tài sản đã trả lại",
    propertyRecoveryAgency: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",

    propertyRecipientName: "",
    propertyRecipientGender: "Nam",
    propertyRecipientAliasName: "Không",
    propertyRecipientBirthDate: "1990-01-01",
    propertyRecipientBirthPlace: "Thành phố Hồ Chí Minh",
    propertyRecipientNationality: "Việt Nam",
    propertyRecipientEthnicity: "Kinh",
    propertyRecipientReligion: "Không",
    propertyRecipientOccupation: "Lao động tự do",
    propertyRecipientIdentityNumber: "079090000001",
    propertyRecipientIdentityIssueDate: "2020-01-01",
    propertyRecipientIdentityIssuePlace: "Cục Cảnh sát quản lý hành chính về trật tự xã hội",
    propertyRecipientPermanentResidence: "số 13/4A, Ấp 107, xã Đông Thạnh, Thành phố Hồ Chí Minh",
    propertyRecipientTemporaryResidence: "số 13/4A, Ấp 107, xã Đông Thạnh, Thành phố Hồ Chí Minh",
    propertyRecipientCurrentResidence: "số 13/4A, Ấp 107, xã Đông Thạnh, Thành phố Hồ Chí Minh",

    recipientsPrimaryLine: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
    recipientsPropertyRecipientLine: ";",
    recipientsArchiveLine: "Lưu: HSVA, HSKS, VP.",

    signMode: "KT. VIỆN TRƯỞNG",
    positionTitle: "PHÓ VIỆN TRƯỞNG",
    signerName: "",

    updatedByName: "",
    renderedByName: "",
    convertedByName: "",
  };
}

function buildPayload(state: Bm172FormState) {
  const caseInitiationDateLine = ymdToVietnameseDateLine(state.caseInitiationDate);
  const defendantInitiationDateLine = ymdToVietnameseDateLine(state.defendantInitiationDate);
  const propertyReturnDecisionDateLine = ymdToVietnameseDateLine(state.propertyReturnDecisionDate);

  const birthDateLine = ymdToVietnameseDateLine(state.propertyRecipientBirthDate).replace(/^ngày\s+/i, "");
  const identityIssueDateLine = ymdToVietnameseDateLine(state.propertyRecipientIdentityIssueDate).replace(/^ngày\s+/i, "");

  const ready = {
    templateCode: "BM-172",

    documentCode: state.documentCode,
    issueDate: state.issueDate,

    agency: {
      parentName: state.issuingAgencyParent,
      name: state.issuingAgency,
    },

    document: {
      documentCode: state.documentCode,
      issueDate: state.issueDate,
      issuePlaceAndDateLine: issuePlaceAndDateLine(state.issuingPlace, state.issueDate),
    },

    legalBasis: {
      procedureArticlesLine: "Căn cứ các điều 41, 106 và 165 của Bộ luật Tố tụng hình sự;",
    },

    official: {
      issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
    },

    propertyReturnCancellation: {
      caseInitiationLine:
        `Căn cứ Quyết định khởi tố vụ án hình sự số ${state.caseInitiationNumber} ` +
        `${caseInitiationDateLine} của ${state.caseInitiationAgency} ` +
        `về tội ${state.crimeName} quy định tại khoản ${state.crimeClause} ` +
        `Điều ${state.crimeArticle} của Bộ luật Hình sự;`,

      defendantInitiationLine:
        `Căn cứ Quyết định khởi tố bị can số ${state.defendantInitiationNumber} ` +
        `${defendantInitiationDateLine} của ${state.defendantInitiationAgency} ` +
        `đối với ${state.defendantName} về tội ${state.crimeName} ` +
        `quy định tại khoản ${state.crimeClause} Điều ${state.crimeArticle} của Bộ luật Hình sự;`,

      propertyReturnDecisionReviewLine:
        `Xét Quyết định trả lại tài sản số ${state.propertyReturnDecisionNumber} ` +
        `${propertyReturnDecisionDateLine} của ${state.propertyReturnDecisionAgency} ` +
        `đối với ${state.propertyRecipientName};`,

      unlawfulReasonLine:
        "Nhận thấy việc trả lại tài sản là không có căn cứ và trái pháp luật,",

      article1Line:
        `Hủy bỏ Quyết định trả lại tài sản số ${state.propertyReturnDecisionNumber} ` +
        `${propertyReturnDecisionDateLine} của ${state.propertyReturnDecisionAgency} ` +
        `đối với ${state.propertyRecipientName}.`,

      article2Line:
        `Yêu cầu ${state.propertyRecoveryAgency} thu hồi ${state.propertyName} ` +
        `theo quy định của Bộ luật Tố tụng hình sự.`,

      article3RequestLine: `Yêu cầu ông/bà ${state.propertyRecipientName}`,

      article3ExecutionLine:
        "thi hành Quyết định này và trả lại tài sản theo quy định của Bộ luật Tố tụng hình sự./.",
    },

    propertyRecipient: {
      gender: state.propertyRecipientGender,
      aliasName: state.propertyRecipientAliasName,
      birthDateLine,
      birthPlace: state.propertyRecipientBirthPlace,
      nationality: state.propertyRecipientNationality,
      ethnicity: state.propertyRecipientEthnicity,
      religion: state.propertyRecipientReligion,
      occupation: state.propertyRecipientOccupation,
      identityNumber: state.propertyRecipientIdentityNumber,
      identityIssueDateLine,
      identityIssuePlace: state.propertyRecipientIdentityIssuePlace,
      permanentResidence: state.propertyRecipientPermanentResidence,
      temporaryResidence: state.propertyRecipientTemporaryResidence,
      currentResidence: state.propertyRecipientCurrentResidence,
    },

    recipients: {
      primaryLine: state.recipientsPrimaryLine,
      propertyRecipientLine: state.recipientsPropertyRecipientLine,
      archiveLine: state.recipientsArchiveLine,
    },

    signature: {
      signMode: state.signMode,
      positionTitle: state.positionTitle,
      signerName: state.signerName,
    },

    updatedByName: state.updatedByName || "",
    renderedByName: state.renderedByName || "",
    convertedByName: state.convertedByName || "",
  };

  return {
    ...ready,
    formInputs: ready,
    payloadOverrides: ready,
    renderPayloadOverrides: ready,
  };
}

async function trySaveToBackend(documentId: string, payload: any) {
  const base = apiBase();

  const bodies = [
    payload,
    {
      templateCode: "BM-172",
      formInputs: payload,
      payloadOverrides: payload,
      renderPayloadOverrides: payload,
      updatedByName: payload.updatedByName || "",
      renderedByName: payload.renderedByName || "",
      convertedByName: payload.convertedByName || "",
    },
  ];

  const attempts: Array<{ method: string; url: string; body: any }> = [];

  for (const body of bodies) {
    attempts.push(
      { method: "PATCH", url: `${base}/documents/generated/${documentId}/form-inputs`, body },
      { method: "PUT", url: `${base}/documents/generated/${documentId}/form-inputs`, body },
      { method: "POST", url: `${base}/documents/generated/${documentId}/form-inputs`, body },
      { method: "PATCH", url: `${base}/documents/generated/${documentId}`, body },
      { method: "PUT", url: `${base}/documents/generated/${documentId}`, body },
      { method: "POST", url: `${base}/documents/generated/${documentId}/render-payload`, body },
    );
  }

  let lastError = "";

  for (const attempt of attempts) {
    try {
      const response = await fetch(attempt.url, {
        method: attempt.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attempt.body),
      });

      const text = await response.text();

      if (response.ok) {
        return {
          ok: true,
          method: attempt.method,
          url: attempt.url,
          responseText: text,
        };
      }

      lastError = `${attempt.method} ${attempt.url} -> ${response.status}: ${text}`;
    } catch (error) {
      lastError = `${attempt.method} ${attempt.url} -> ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  throw new Error(lastError || "Không tìm thấy endpoint lưu phù hợp.");
}

function TextField(props: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-slate-700">{props.label}</span>
      <input
        className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
        value={props.value}
        disabled={props.disabled}
        placeholder={props.placeholder}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </label>
  );
}

function SelectField(props: {
  label: string;
  value: string;
  disabled?: boolean;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-slate-700">{props.label}</span>
      <select
        className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
        value={props.value}
        disabled={props.disabled}
        onChange={(event) => props.onChange(event.target.value)}
      >
        {props.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function DateField(props: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const { year, month, day } = parseYmd(props.value);
  const currentDays = daysInMonth(year, month);
  const years = Array.from({ length: 91 }, (_, index) => new Date().getFullYear() + 5 - index);

  return (
    <div className="grid gap-1 text-sm">
      <span className="font-medium text-slate-700">{props.label}</span>

      <div className="grid grid-cols-3 gap-2">
        <select
          className="h-10 rounded-lg border border-slate-300 bg-white px-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
          value={day}
          disabled={props.disabled}
          onChange={(event) => props.onChange(toYmd(year, month, Number(event.target.value)))}
        >
          {Array.from({ length: currentDays }, (_, index) => index + 1).map((value) => (
            <option key={value} value={value}>
              Ngày {pad2(value)}
            </option>
          ))}
        </select>

        <select
          className="h-10 rounded-lg border border-slate-300 bg-white px-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
          value={month}
          disabled={props.disabled}
          onChange={(event) => props.onChange(toYmd(year, Number(event.target.value), day))}
        >
          {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
            <option key={value} value={value}>
              Tháng {value}
            </option>
          ))}
        </select>

        <select
          className="h-10 rounded-lg border border-slate-300 bg-white px-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
          value={year}
          disabled={props.disabled}
          onChange={(event) => props.onChange(toYmd(Number(event.target.value), month, day))}
        >
          {years.map((value) => (
            <option key={value} value={value}>
              Năm {value}
            </option>
          ))}
        </select>
      </div>

      <span className="text-xs text-slate-500">{ymdToVietnameseDateLine(props.value)}</span>
    </div>
  );
}

function TextAreaField(props: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-slate-700">{props.label}</span>
      <textarea
        className="min-h-20 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
        value={props.value}
        rows={props.rows ?? 3}
        disabled={props.disabled}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </label>
  );
}

function Section(props: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 border-b border-slate-100 pb-3 text-base font-bold text-slate-950">
        {props.title}
      </h3>
      <div className="grid gap-4">{props.children}</div>
    </section>
  );
}

export function Bm172FormInputs({
  value,
  initialValue,
  disabled,
  isSaving,
  onChange,
  onSave,
  onReload,
}: Bm172FormInputsProps) {
  const [state, setState] = React.useState<Bm172FormState>(() => ({
    ...defaultState(),
    ...(initialValue ?? {}),
    ...(value ?? {}),
  }));

  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>("idle");
  const [saveMessage, setSaveMessage] = React.useState("");

  React.useEffect(() => {
    if (!value) return;
    setState((current) => ({
      ...current,
      ...value,
      issueDate: value.issueDate || current.issueDate || todayYmd(),
    }));
  }, [value]);

  const emitChange = React.useCallback(
    (next: Bm172FormState) => {
      onChange?.(buildPayload(next));
    },
    [onChange],
  );

  const update = React.useCallback(
    <K extends keyof Bm172FormState>(key: K, nextValue: Bm172FormState[K]) => {
      setSaveStatus("idle");
      setSaveMessage("");

      setState((current) => {
        const next = {
          ...current,
          [key]: nextValue,
        };

        if (key === "defendantName") {
          const name = String(nextValue || "").trim();
          next.propertyRecipientName = name;
          next.recipientsPropertyRecipientLine = name ? `${name};` : "";
        }

        if (key === "propertyRecipientName") {
          const name = String(nextValue || "").trim();
          next.recipientsPropertyRecipientLine = name ? `${name};` : "";
        }

        emitChange(next);
        return next;
      });
    },
    [emitChange],
  );

  const fillSample = React.useCallback(() => {
    const next = defaultState();
    setState(next);
    emitChange(next);
    setSaveStatus("idle");
    setSaveMessage("Đã điền dữ liệu mẫu. Bấm Lưu để ghi dữ liệu.");
  }, [emitChange]);

  const save = React.useCallback(async () => {
    const payload = buildPayload(state);
    const documentId = getDocumentIdFromUrl();

    setSaveStatus("saving");
    setSaveMessage("Đang lưu dữ liệu BM-172...");

    try {
      if (onSave) {
        await onSave(payload);
        setSaveStatus("success");
        setSaveMessage("Đã lưu dữ liệu BM-172 qua workspace.");
        return;
      }

      if (!documentId) {
        throw new Error("Không lấy được documentId từ URL.");
      }

      const result = await trySaveToBackend(documentId, payload);

      setSaveStatus("success");
      setSaveMessage(`Đã lưu dữ liệu BM-172. Endpoint: ${result.method} ${result.url}`);
    } catch (error) {
      setSaveStatus("error");
      setSaveMessage(error instanceof Error ? error.message : String(error));
    }
  }, [onSave, state]);

  const previewPayload = React.useMemo(() => buildPayload(state), [state]);

  const saveButtonClass =
    saveStatus === "saving"
      ? "scale-[0.99] bg-blue-500 shadow-inner"
      : saveStatus === "success"
        ? "bg-emerald-600 shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-[0.98]"
        : saveStatus === "error"
          ? "bg-red-600 shadow-lg shadow-red-200 hover:bg-red-700 active:scale-[0.98]"
          : "bg-blue-700 shadow-lg shadow-blue-200 hover:bg-blue-800 active:scale-[0.98]";

  return (
    <div className="grid gap-5">
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
        <div className="font-bold">BM-172 — Quyết định hủy bỏ Quyết định trả lại tài sản</div>
        <div>
          Ngày tháng hiển thị theo đúng thứ tự <b>Ngày - Tháng - Năm</b>. Trường tên bị can được đồng bộ xuống
          người được trả lại tài sản và nơi nhận liên quan.
        </div>
      </div>

      <div className="sticky top-3 z-10 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={disabled || isSaving || saveStatus === "saving"}
            onClick={fillSample}
          >
            Điền dữ liệu mẫu
          </button>

          <button
            type="button"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={disabled || isSaving || saveStatus === "saving"}
            onClick={() => onReload?.()}
          >
            Tải lại từ backend
          </button>

          <button
            type="button"
            className={`rounded-xl px-5 py-2 text-sm font-bold text-white transition ${saveButtonClass} disabled:cursor-not-allowed disabled:opacity-60`}
            disabled={disabled || isSaving || saveStatus === "saving"}
            onClick={save}
          >
            {saveStatus === "saving" ? "Đang lưu..." : saveStatus === "success" ? "Đã lưu ✓" : "Lưu dữ liệu BM-172"}
          </button>
        </div>

        {saveMessage ? (
          <div
            className={`mt-3 rounded-xl px-3 py-2 text-sm ${
              saveStatus === "success"
                ? "bg-emerald-50 text-emerald-800"
                : saveStatus === "error"
                  ? "bg-red-50 text-red-800"
                  : "bg-slate-50 text-slate-700"
            }`}
          >
            {saveMessage}
          </div>
        ) : null}
      </div>

      <Section title="1. Thông tin văn bản">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Số quyết định" value={state.documentCode} disabled={disabled} onChange={(v) => update("documentCode", v)} />
          <DateField label="Ngày ban hành" value={state.issueDate} disabled={disabled} onChange={(v) => update("issueDate", v)} />
          <TextField label="Địa danh" value={state.issuingPlace} disabled={disabled} onChange={(v) => update("issuingPlace", v)} />
          <TextField label="Viện kiểm sát cấp trên" value={state.issuingAgencyParent} disabled={disabled} onChange={(v) => update("issuingAgencyParent", v)} />
          <TextField label="Viện kiểm sát ban hành" value={state.issuingAgency} disabled={disabled} onChange={(v) => update("issuingAgency", v)} />
        </div>
      </Section>

      <Section title="2. Căn cứ khởi tố vụ án">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Số QĐ khởi tố vụ án" value={state.caseInitiationNumber} disabled={disabled} onChange={(v) => update("caseInitiationNumber", v)} />
          <DateField label="Ngày QĐ khởi tố vụ án" value={state.caseInitiationDate} disabled={disabled} onChange={(v) => update("caseInitiationDate", v)} />
          <TextAreaField label="Cơ quan ra QĐ khởi tố vụ án" value={state.caseInitiationAgency} disabled={disabled} onChange={(v) => update("caseInitiationAgency", v)} />
          <TextField label="Tội danh" value={state.crimeName} disabled={disabled} onChange={(v) => update("crimeName", v)} />
          <TextField label="Khoản" value={state.crimeClause} disabled={disabled} onChange={(v) => update("crimeClause", v)} />
          <TextField label="Điều" value={state.crimeArticle} disabled={disabled} onChange={(v) => update("crimeArticle", v)} />
        </div>
      </Section>

      <Section title="3. Căn cứ khởi tố bị can">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Số QĐ khởi tố bị can" value={state.defendantInitiationNumber} disabled={disabled} onChange={(v) => update("defendantInitiationNumber", v)} />
          <DateField label="Ngày QĐ khởi tố bị can" value={state.defendantInitiationDate} disabled={disabled} onChange={(v) => update("defendantInitiationDate", v)} />
          <TextAreaField label="Cơ quan ra QĐ khởi tố bị can" value={state.defendantInitiationAgency} disabled={disabled} onChange={(v) => update("defendantInitiationAgency", v)} />
          <TextField label="Tên bị can / người liên quan" value={state.defendantName} disabled={disabled} onChange={(v) => update("defendantName", v)} />
        </div>
      </Section>

      <Section title="4. Quyết định trả lại tài sản bị hủy bỏ">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Số QĐ trả lại tài sản" value={state.propertyReturnDecisionNumber} disabled={disabled} onChange={(v) => update("propertyReturnDecisionNumber", v)} />
          <DateField label="Ngày QĐ trả lại tài sản" value={state.propertyReturnDecisionDate} disabled={disabled} onChange={(v) => update("propertyReturnDecisionDate", v)} />
          <TextAreaField label="Cơ quan ra QĐ trả lại tài sản" value={state.propertyReturnDecisionAgency} disabled={disabled} onChange={(v) => update("propertyReturnDecisionAgency", v)} />
          <TextAreaField label="Tài sản cần thu hồi" value={state.propertyName} disabled={disabled} onChange={(v) => update("propertyName", v)} />
          <TextAreaField label="Cơ quan có trách nhiệm thu hồi tài sản" value={state.propertyRecoveryAgency} disabled={disabled} onChange={(v) => update("propertyRecoveryAgency", v)} />
        </div>
      </Section>

      <Section title="5. Người/cơ quan được trả lại tài sản">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Họ tên người được trả lại tài sản" value={state.propertyRecipientName} disabled={disabled} onChange={(v) => update("propertyRecipientName", v)} />
          <SelectField label="Giới tính" value={state.propertyRecipientGender} disabled={disabled} options={["Nam", "Nữ", "Khác"]} onChange={(v) => update("propertyRecipientGender", v)} />
          <TextField label="Tên gọi khác" value={state.propertyRecipientAliasName} disabled={disabled} onChange={(v) => update("propertyRecipientAliasName", v)} />
          <DateField label="Ngày sinh" value={state.propertyRecipientBirthDate} disabled={disabled} onChange={(v) => update("propertyRecipientBirthDate", v)} />
          <TextField label="Nơi sinh" value={state.propertyRecipientBirthPlace} disabled={disabled} onChange={(v) => update("propertyRecipientBirthPlace", v)} />
          <TextField label="Quốc tịch" value={state.propertyRecipientNationality} disabled={disabled} onChange={(v) => update("propertyRecipientNationality", v)} />
          <TextField label="Dân tộc" value={state.propertyRecipientEthnicity} disabled={disabled} onChange={(v) => update("propertyRecipientEthnicity", v)} />
          <TextField label="Tôn giáo" value={state.propertyRecipientReligion} disabled={disabled} onChange={(v) => update("propertyRecipientReligion", v)} />
          <TextField label="Nghề nghiệp" value={state.propertyRecipientOccupation} disabled={disabled} onChange={(v) => update("propertyRecipientOccupation", v)} />
          <TextField label="Số CMND/CCCD/Hộ chiếu" value={state.propertyRecipientIdentityNumber} disabled={disabled} onChange={(v) => update("propertyRecipientIdentityNumber", v)} />
          <DateField label="Ngày cấp giấy tờ" value={state.propertyRecipientIdentityIssueDate} disabled={disabled} onChange={(v) => update("propertyRecipientIdentityIssueDate", v)} />
          <TextField label="Nơi cấp giấy tờ" value={state.propertyRecipientIdentityIssuePlace} disabled={disabled} onChange={(v) => update("propertyRecipientIdentityIssuePlace", v)} />
        </div>

        <TextAreaField label="Nơi thường trú" value={state.propertyRecipientPermanentResidence} disabled={disabled} onChange={(v) => update("propertyRecipientPermanentResidence", v)} />
        <TextAreaField label="Nơi tạm trú" value={state.propertyRecipientTemporaryResidence} disabled={disabled} onChange={(v) => update("propertyRecipientTemporaryResidence", v)} />
        <TextAreaField label="Nơi ở hiện tại" value={state.propertyRecipientCurrentResidence} disabled={disabled} onChange={(v) => update("propertyRecipientCurrentResidence", v)} />
      </Section>

      <Section title="6. Nơi nhận và chữ ký">
        <TextAreaField label="Nơi nhận chính" value={state.recipientsPrimaryLine} disabled={disabled} onChange={(v) => update("recipientsPrimaryLine", v)} />
        <TextAreaField label="Người/cơ quan được trả lại tài sản" value={state.recipientsPropertyRecipientLine} disabled={disabled} onChange={(v) => update("recipientsPropertyRecipientLine", v)} />
        <TextField label="Lưu" value={state.recipientsArchiveLine} disabled={disabled} onChange={(v) => update("recipientsArchiveLine", v)} />

        <div className="grid gap-4 md:grid-cols-3">
          <TextField label="Chế độ ký" value={state.signMode} disabled={disabled} onChange={(v) => update("signMode", v)} />
          <TextField label="Chức danh" value={state.positionTitle} disabled={disabled} onChange={(v) => update("positionTitle", v)} />
          <TextField label="Người ký" value={state.signerName} disabled={disabled} onChange={(v) => update("signerName", v)} />
        </div>
      </Section>

      <details className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
        <summary className="cursor-pointer font-semibold">Xem payload render BM-172</summary>
        <pre className="mt-3 max-h-96 overflow-auto rounded-xl bg-slate-950 p-3 text-xs text-slate-50">
          {JSON.stringify(previewPayload, null, 2)}
        </pre>
      </details>
    </div>
  );
}

export default Bm172FormInputs;
