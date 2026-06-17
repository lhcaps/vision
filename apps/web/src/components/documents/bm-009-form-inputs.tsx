"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

type AgencyForm = {
  parentName: string;
  name: string;
};

type DocumentForm = {
  documentCode: string;
  issuePlace: string;
  issueDateIso: string;
};

type OfficialForm = {
  issuerTitle: string;
};

type SourceResolutionExtensionForm = {
  procedureArticlesLine: string;
  investigatingAgencyName: string;
  caseSummary: string;
  sourceReceivedDateIso: string;
  proposalNo: string;
  proposalDateIso: string;
  reasonLine: string;
  durationText: string;
  fromDateIso: string;
  toDateIso: string;
};

type RecipientsForm = {
  archiveLine: string;
};

type SignatureForm = {
  signMode: string;
  positionTitle: string;
  signerName: string;
};

type Bm009Form = {
  agency: AgencyForm;
  document: DocumentForm;
  official: OfficialForm;
  sourceResolutionExtension: SourceResolutionExtensionForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
};

type RenderPayload = Record<string, any>;

type Bm009FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const DEFAULT_SIGNER_NAME = '';

const EMPTY_FORM: Bm009Form = {
  agency: {
    parentName: "",
    name: "",
  },
  document: {
    documentCode: "09/QĐ-VKSKV7",
    issuePlace: "TP. Hồ Chí Minh",
    issueDateIso: getBm009TodayIsoDate(),
  },
  official: {
    issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  sourceResolutionExtension: {
    procedureArticlesLine:
      "Căn cứ các điều 41, 147 và 159 của Bộ luật Tố tụng hình sự;",
    investigatingAgencyName:
      "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
    caseSummary: "vụ việc có dấu hiệu tội “Đánh bạc”",
    sourceReceivedDateIso: getBm009TodayIsoDate(),
    proposalNo: "01/ĐN-ĐT",
    proposalDateIso: getBm009TodayIsoDate(),
    reasonLine:
      "Nhận thấy việc gia hạn thời hạn giải quyết nguồn tin về tội phạm là có căn cứ,",
    durationText: "02 tháng",
    fromDateIso: getBm009TodayIsoDate(),
    toDateIso: addMonthsToIsoDate(getBm009TodayIsoDate(), 2),
  },
  recipients: {
    archiveLine: "- Lưu: HSVV, HSKS, VP.",
  },
  signature: {
    signMode: "KT. VIỆN TRƯỞNG",
    positionTitle: "PHÓ VIỆN TRƯỞNG",
    signerName: DEFAULT_SIGNER_NAME,
  },
};

function text(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function cleanText(value: unknown): string {
  return text(value).trim();
}

function nested(payload: RenderPayload | null, path: string): string {
  if (!payload) return "";

  const parts = path.split(".").filter(Boolean);
  let current: any = payload;

  for (const part of parts) {
    if (!current || typeof current !== "object") return "";
    current = current[part];
  }

  return cleanText(current);
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function getBm009TodayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

function addMonthsToIsoDate(isoDate: string, months: number): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const base = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date();

  base.setMonth(base.getMonth() + months);

  return `${base.getFullYear()}-${pad2(base.getMonth() + 1)}-${pad2(base.getDate())}`;
}

function parseBm009IsoDateParts(value: string): {
  day: string;
  month: string;
  year: string;
} {
  const iso = cleanText(value).match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

  if (iso) {
    return {
      day: pad2(Number(iso[3])),
      month: pad2(Number(iso[2])),
      year: iso[1],
    };
  }

  const slash = cleanText(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (slash) {
    return {
      day: pad2(Number(slash[1])),
      month: pad2(Number(slash[2])),
      year: slash[3],
    };
  }

  return { day: "", month: "", year: "" };
}

function buildBm009IsoDate(day: string, month: string, year: string): string {
  if (!day || !month || !year) return "";
  return `${year}-${pad2(Number(month))}-${pad2(Number(day))}`;
}

function Bm009DateSelectField({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const parsed = parseBm009IsoDateParts(value || getBm009TodayIsoDate());

  const dayOptions = Array.from({ length: 31 }, (_, index) =>
    pad2(index + 1),
  );

  const monthOptions = Array.from({ length: 12 }, (_, index) =>
    pad2(index + 1),
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
      onChange(buildBm009IsoDate(next.day, next.month, next.year));
    }
  };

  const selectClass =
    "h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>

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
    </label>
  );
}

function parseDateToIso(value: string): string {
  const raw = cleanText(value);
  if (!raw) return "";

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return raw;

  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    return `${slash[3]}-${pad2(Number(slash[2]))}-${pad2(Number(slash[1]))}`;
  }

  const vn = raw.match(
    /ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/iu,
  );
  if (vn) {
    return `${vn[3]}-${pad2(Number(vn[2]))}-${pad2(Number(vn[1]))}`;
  }

  return "";
}

function parseFirstVietnameseDateToIso(value: string): string {
  return parseDateToIso(value);
}

function toVietnameseDateText(isoDate: string): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return isoDate || "";

  return `ngày ${Number(match[3])} tháng ${Number(match[2])} năm ${match[1]}`;
}

function toSlashDateText(isoDate: string): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return isoDate || "";

  return `${match[3]}/${match[2]}/${match[1]}`;
}

function issuePlaceFromLine(value: string): string {
  const raw = cleanText(value);
  const index = raw.toLowerCase().indexOf(", ngày");
  return index > 0 ? raw.slice(0, index).trim() : "";
}

function parseProposalNo(value: string): string {
  const match = cleanText(value).match(/số\s+(.+?)\s+ngày/iu);
  return match?.[1]?.trim() ?? "";
}

function buildIssuePlaceAndDateLine(form: Bm009Form): string {
  const dateText = toVietnameseDateText(form.document.issueDateIso);
  const place = form.document.issuePlace.trim();

  return place ? `${place}, ${dateText}` : dateText;
}

function buildReceptionLegalBasisLine(form: Bm009Form): string {
  const src = form.sourceResolutionExtension;

  return `Căn cứ việc tiếp nhận nguồn tin về tội phạm ${toVietnameseDateText(
    src.sourceReceivedDateIso,
  )} của ${src.investigatingAgencyName.trim()} đối với ${src.caseSummary.trim()};`;
}

function buildProposalLegalBasisLine(form: Bm009Form): string {
  const src = form.sourceResolutionExtension;

  return `Xét văn bản đề nghị gia hạn thời hạn giải quyết nguồn tin về tội phạm số ${src.proposalNo.trim()} ${toVietnameseDateText(
    src.proposalDateIso,
  )} của ${src.investigatingAgencyName.trim()};`;
}

function buildArticle1Line(form: Bm009Form): string {
  const src = form.sourceResolutionExtension;

  return `Gia hạn thời hạn giải quyết nguồn tin về tội phạm trong thời hạn ${src.durationText.trim()}, kể từ ${toVietnameseDateText(
    src.fromDateIso,
  )} đến ${toVietnameseDateText(src.toDateIso)}.`;
}

function buildArticle2Line(form: Bm009Form): string {
  const src = form.sourceResolutionExtension;

  return `Yêu cầu ${src.investigatingAgencyName.trim()} thực hiện Quyết định này theo quy định của Bộ luật Tố tụng hình sự./.`;
}

function buildRequestingAgencyRecipientLine(form: Bm009Form): string {
  return `- ${form.sourceResolutionExtension.investigatingAgencyName.trim()};`;
}

function normalizeFormInputs(payload: RenderPayload | null): Bm009Form {
  const issuePlaceAndDateLine = nested(payload, "document.issuePlaceAndDateLine");

  const offenseName = nested(payload, "offense.offenseName");
  const receptionLine = nested(
    payload,
    "sourceResolutionExtension.receptionLegalBasisLine",
  );
  const proposalLine = nested(
    payload,
    "sourceResolutionExtension.proposalLegalBasisLine",
  );

  const signerName =
    nested(payload, "signature.signerName") || DEFAULT_SIGNER_NAME;

  return {
    agency: {
      parentName:
        nested(payload, "agency.parentName") || EMPTY_FORM.agency.parentName,
      name: nested(payload, "agency.name") || EMPTY_FORM.agency.name,
    },
    document: {
      documentCode:
        nested(payload, "document.documentCode") ||
        EMPTY_FORM.document.documentCode,
      issuePlace:
        nested(payload, "agency.issuePlace") ||
        issuePlaceFromLine(issuePlaceAndDateLine) ||
        EMPTY_FORM.document.issuePlace,
      issueDateIso:
        parseDateToIso(nested(payload, "document.issueDate")) ||
        parseDateToIso(nested(payload, "document.issueDateText")) ||
        parseFirstVietnameseDateToIso(issuePlaceAndDateLine) ||
        EMPTY_FORM.document.issueDateIso,
    },
    official: {
      issuerTitle:
        nested(payload, "official.issuerTitle") ||
        EMPTY_FORM.official.issuerTitle,
    },
    sourceResolutionExtension: {
      procedureArticlesLine:
        nested(payload, "sourceResolutionExtension.procedureArticlesLine") ||
        EMPTY_FORM.sourceResolutionExtension.procedureArticlesLine,

      investigatingAgencyName:
        nested(payload, "sourceResolutionExtension.investigatingAgencyName") ||
        nested(payload, "recipients.investigatingAgencyLine") ||
        EMPTY_FORM.sourceResolutionExtension.investigatingAgencyName,

      caseSummary:
        nested(payload, "sourceResolutionExtension.caseSummary") ||
        (offenseName ? `vụ việc có dấu hiệu tội “${offenseName}”` : "") ||
        EMPTY_FORM.sourceResolutionExtension.caseSummary,

      sourceReceivedDateIso:
        parseDateToIso(
          nested(payload, "sourceResolutionExtension.sourceReceivedDateIso"),
        ) ||
        parseFirstVietnameseDateToIso(receptionLine) ||
        EMPTY_FORM.sourceResolutionExtension.sourceReceivedDateIso,

      proposalNo:
        nested(payload, "sourceResolutionExtension.proposalNo") ||
        parseProposalNo(proposalLine) ||
        EMPTY_FORM.sourceResolutionExtension.proposalNo,

      proposalDateIso:
        parseDateToIso(
          nested(payload, "sourceResolutionExtension.proposalDateIso"),
        ) ||
        parseFirstVietnameseDateToIso(proposalLine) ||
        EMPTY_FORM.sourceResolutionExtension.proposalDateIso,

      reasonLine:
        nested(payload, "sourceResolutionExtension.reasonLine") ||
        EMPTY_FORM.sourceResolutionExtension.reasonLine,

      durationText:
        nested(payload, "sourceResolutionExtension.durationText") ||
        EMPTY_FORM.sourceResolutionExtension.durationText,

      fromDateIso:
        parseDateToIso(nested(payload, "sourceResolutionExtension.fromDateIso")) ||
        parseDateToIso(nested(payload, "sourceResolutionExtension.fromDateText")) ||
        EMPTY_FORM.sourceResolutionExtension.fromDateIso,

      toDateIso:
        parseDateToIso(nested(payload, "sourceResolutionExtension.toDateIso")) ||
        parseDateToIso(nested(payload, "sourceResolutionExtension.toDateText")) ||
        EMPTY_FORM.sourceResolutionExtension.toDateIso,
    },
    recipients: {
      archiveLine:
        nested(payload, "recipients.archiveLine") ||
        EMPTY_FORM.recipients.archiveLine,
    },
    signature: {
      signMode:
        nested(payload, "signature.signMode") ||
        EMPTY_FORM.signature.signMode,
      positionTitle:
        nested(payload, "signature.positionTitle") ||
        EMPTY_FORM.signature.positionTitle,
      signerName,
    },
  };
}

function validateForm(form: Bm009Form): string[] {
  const required = [
    ["agency.parentName", form.agency.parentName],
    ["agency.name", form.agency.name],
    ["document.documentCode", form.document.documentCode],
    ["document.issuePlace", form.document.issuePlace],
    ["document.issueDateIso", form.document.issueDateIso],
    ["official.issuerTitle", form.official.issuerTitle],
    ["procedureArticlesLine", form.sourceResolutionExtension.procedureArticlesLine],
    ["investigatingAgencyName", form.sourceResolutionExtension.investigatingAgencyName],
    ["caseSummary", form.sourceResolutionExtension.caseSummary],
    ["sourceReceivedDateIso", form.sourceResolutionExtension.sourceReceivedDateIso],
    ["proposalNo", form.sourceResolutionExtension.proposalNo],
    ["proposalDateIso", form.sourceResolutionExtension.proposalDateIso],
    ["reasonLine", form.sourceResolutionExtension.reasonLine],
    ["durationText", form.sourceResolutionExtension.durationText],
    ["fromDateIso", form.sourceResolutionExtension.fromDateIso],
    ["toDateIso", form.sourceResolutionExtension.toDateIso],
    ["archiveLine", form.recipients.archiveLine],
    ["signMode", form.signature.signMode],
    ["positionTitle", form.signature.positionTitle],
    ["signerName", form.signature.signerName],
  ];

  return required
    .filter(([, value]) => !String(value ?? "").trim())
    .map(([label]) => label);
}

function buildSaveBody(form: Bm009Form) {
  const signerName = form.signature.signerName.trim() || DEFAULT_SIGNER_NAME;
  const issuePlaceAndDateLine = buildIssuePlaceAndDateLine(form);

  const agency = {
    parentName: form.agency.parentName,
    name: form.agency.name,
    issuePlace: form.document.issuePlace,
  };

  const document = {
    documentCode: form.document.documentCode,
    documentNo: form.document.documentCode,
    issueDateIso: form.document.issueDateIso,
    issueDate: toSlashDateText(form.document.issueDateIso),
    issueDateText: toVietnameseDateText(form.document.issueDateIso).replace(
      /^ngày\s+/iu,
      "",
    ),
    issuePlaceAndDateLine,
    issuePlaceDateLine: issuePlaceAndDateLine,
  };

  const official = {
    issuerTitle: form.official.issuerTitle,
  };

  const sourceResolutionExtension = {
    procedureArticlesLine:
      form.sourceResolutionExtension.procedureArticlesLine,
    investigatingAgencyName:
      form.sourceResolutionExtension.investigatingAgencyName,
    requestingAgencyName:
      form.sourceResolutionExtension.investigatingAgencyName,
    caseSummary: form.sourceResolutionExtension.caseSummary,
    sourceReceivedDateIso:
      form.sourceResolutionExtension.sourceReceivedDateIso,
    proposalNo: form.sourceResolutionExtension.proposalNo,
    proposalDateIso: form.sourceResolutionExtension.proposalDateIso,
    receptionLegalBasisLine: buildReceptionLegalBasisLine(form),
    proposalLegalBasisLine: buildProposalLegalBasisLine(form),
    reasonLine: form.sourceResolutionExtension.reasonLine,
    durationText: form.sourceResolutionExtension.durationText,
    fromDateIso: form.sourceResolutionExtension.fromDateIso,
    toDateIso: form.sourceResolutionExtension.toDateIso,
    fromDateText: toVietnameseDateText(
      form.sourceResolutionExtension.fromDateIso,
    ),
    toDateText: toVietnameseDateText(form.sourceResolutionExtension.toDateIso),
    article1Line: buildArticle1Line(form),
    article2Line: buildArticle2Line(form),
    requestingAgencyRecipientLine: buildRequestingAgencyRecipientLine(form),
  };

  const recipients = {
    archiveLine: form.recipients.archiveLine,
  };

  const signature = {
    signMode: form.signature.signMode,
    positionTitle: form.signature.positionTitle,
    signerName,
  };

  const savedInputs = {
    agency,
    document,
    official,
    sourceResolutionExtension,
    recipients,
    signature,
  };

  return {
    ...savedInputs,
    formInputs: savedInputs,
    payloadOverrides: savedInputs,
    renderPayloadOverrides: savedInputs,
    updatedByName: signerName,
  };
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-800">
          {title}
        </h3>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        ) : null}
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  multiline,
  type = "text",
  readOnly,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  required?: boolean;
  multiline?: boolean;
  type?: "text" | "date";
  readOnly?: boolean;
}) {
  const cls =
    "rounded-xl border border-slate-300 px-3 py-2.5 text-sm leading-6 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>

      {multiline ? (
        <textarea
          className={`${cls} min-h-[88px] ${
            readOnly ? "bg-slate-100 text-slate-700" : "bg-white"
          }`}
          value={value}
          readOnly={readOnly}
          onChange={(event) => onChange?.(event.target.value)}
        />
      ) : (
        <input
          className={`${cls} ${
            readOnly ? "bg-slate-100 text-slate-700" : "bg-white"
          }`}
          value={value}
          type={type}
          readOnly={readOnly}
          onChange={(event) => onChange?.(event.target.value)}
        />
      )}
    </label>
  );
}

export function Bm009FormInputsPanel({
  documentId,
  onSaved,
}: Bm009FormInputsPanelProps) {
  const [form, setForm] = useState<Bm009Form>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validationErrors = useMemo(() => validateForm(form), [form]);

  const patch = <T extends keyof Bm009Form>(
    section: T,
    key: keyof Bm009Form[T],
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [section]: {
        ...(current[section] as Record<string, string>),
        [key]: value,
      },
    }));
  };

  const reloadFromBackend = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/documents/generated/${documentId}/render-payload`,
        { method: "GET", cache: "no-store" },
      );

      if (!response.ok) {
        const bodyText = await response.text();
        throw new Error(
          bodyText || `Không tải được render-payload. HTTP ${response.status}`,
        );
      }

      const payload = (await response.json()) as RenderPayload;
      setForm(normalizeFormInputs(payload));
      setMessage("Đã tải lại dữ liệu BM-009 từ backend.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  const handleFillSample = () => {
    setForm({
      agency: { ...EMPTY_FORM.agency },
      document: { ...EMPTY_FORM.document },
      official: { ...EMPTY_FORM.official },
      sourceResolutionExtension: {
        ...EMPTY_FORM.sourceResolutionExtension,
      },
      recipients: { ...EMPTY_FORM.recipients },
      signature: { ...EMPTY_FORM.signature },
    });
    setError(null);
    setMessage("Đã điền dữ liệu mẫu BM-009.");
  };

  const handleSave = async () => {
    const errors = validateForm(form);

    if (errors.length > 0) {
      setError(`Thiếu dữ liệu bắt buộc: ${errors.join(", ")}`);
      setMessage(null);
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/documents/generated/${documentId}/form-inputs`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify(buildSaveBody(form)),
        },
      );

      if (!response.ok) {
        const bodyText = await response.text();
        throw new Error(
          bodyText || `Không lưu được dữ liệu biểu mẫu. HTTP ${response.status}`,
        );
      }

      await reloadFromBackend();
      setMessage("Đã lưu dữ liệu BM-009. Các câu tự sinh đã đồng bộ.");
      await onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được dữ liệu.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    void reloadFromBackend();
     
  }, [documentId]);

  return (
    <div className="space-y-5 rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
            BM-009
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">
            Dữ liệu biểu mẫu Quyết định gia hạn thời hạn giải quyết nguồn tin
            về tội phạm
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Có header, chọn ngày bằng dropdown Ngày/Tháng/Năm, tự sinh câu căn cứ và Điều 1/Điều 2.
            Không hiển thị Người cập nhật.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
            onClick={reloadFromBackend}
            disabled={loading || saving}
          >
            {loading ? "Đang tải..." : "Tải lại từ backend"}
          </button>

          <button
            type="button"
            className="rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-100 disabled:opacity-60"
            onClick={handleFillSample}
            disabled={loading || saving}
          >
            Điền dữ liệu mẫu
          </button>

          <button
            type="button"
            className="rounded-xl bg-blue-600 px-3.5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
            onClick={handleSave}
            disabled={loading || saving}
          >
            {saving ? "Đang lưu..." : "Lưu dữ liệu"}
          </button>
        </div>
      </div>

      {message ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {validationErrors.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          Còn thiếu: {validationErrors.join(", ")}
        </div>
      ) : null}

      <SectionCard title="1. Header biểu mẫu">
        <Field
          label="Viện kiểm sát cấp trên"
          required
          value={form.agency.parentName}
          onChange={(value) => patch("agency", "parentName", value)}
        />

        <Field
          label="Viện kiểm sát ban hành"
          required
          value={form.agency.name}
          onChange={(value) => patch("agency", "name", value)}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Field
            label="Số quyết định"
            required
            value={form.document.documentCode}
            onChange={(value) => patch("document", "documentCode", value)}
          />

          <Field
            label="Địa danh ban hành"
            required
            value={form.document.issuePlace}
            onChange={(value) => patch("document", "issuePlace", value)}
          />

          <Bm009DateSelectField
            label="Ngày ban hành"
            required
            value={form.document.issueDateIso}
            onChange={(value) => patch("document", "issueDateIso", value)}
          />
        </div>

        <Field
          label="Dòng địa danh/ngày tháng tự sinh"
          value={buildIssuePlaceAndDateLine(form)}
          readOnly
        />

        <Field
          label="Chủ thể ban hành"
          required
          value={form.official.issuerTitle}
          onChange={(value) => patch("official", "issuerTitle", value)}
        />
      </SectionCard>

      <SectionCard
        title="2. Căn cứ và lý do gia hạn"
        description="Chọn ngày/cơ quan/vụ việc, hệ thống tự sinh câu căn cứ."
      >
        <Field
          label="Căn cứ tố tụng"
          required
          multiline
          value={form.sourceResolutionExtension.procedureArticlesLine}
          onChange={(value) =>
            patch("sourceResolutionExtension", "procedureArticlesLine", value)
          }
        />

        <Field
          label="Cơ quan điều tra"
          required
          value={form.sourceResolutionExtension.investigatingAgencyName}
          onChange={(value) =>
            patch("sourceResolutionExtension", "investigatingAgencyName", value)
          }
        />

        <Field
          label="Vụ việc / nguồn tin"
          required
          value={form.sourceResolutionExtension.caseSummary}
          onChange={(value) =>
            patch("sourceResolutionExtension", "caseSummary", value)
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Bm009DateSelectField
            label="Ngày tiếp nhận nguồn tin"
            required
            value={form.sourceResolutionExtension.sourceReceivedDateIso}
            onChange={(value) =>
              patch("sourceResolutionExtension", "sourceReceivedDateIso", value)
            }
          />

          <Field
            label="Số văn bản đề nghị"
            required
            value={form.sourceResolutionExtension.proposalNo}
            onChange={(value) =>
              patch("sourceResolutionExtension", "proposalNo", value)
            }
          />

          <Bm009DateSelectField
            label="Ngày văn bản đề nghị"
            required
            value={form.sourceResolutionExtension.proposalDateIso}
            onChange={(value) =>
              patch("sourceResolutionExtension", "proposalDateIso", value)
            }
          />
        </div>

        <Field
          label="Căn cứ tiếp nhận nguồn tin tự sinh"
          multiline
          readOnly
          value={buildReceptionLegalBasisLine(form)}
        />

        <Field
          label="Văn bản đề nghị gia hạn tự sinh"
          multiline
          readOnly
          value={buildProposalLegalBasisLine(form)}
        />

        <Field
          label="Nhận định gia hạn"
          required
          multiline
          value={form.sourceResolutionExtension.reasonLine}
          onChange={(value) =>
            patch("sourceResolutionExtension", "reasonLine", value)
          }
        />
      </SectionCard>

      <SectionCard
        title="3. Nội dung quyết định"
        description="Không nhập lại chữ Điều 1 hoặc Điều 2. Hai dòng dưới được tự sinh."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Field
            label="Thời hạn"
            required
            value={form.sourceResolutionExtension.durationText}
            onChange={(value) =>
              patch("sourceResolutionExtension", "durationText", value)
            }
          />

          <Bm009DateSelectField
            label="Từ ngày"
            required
            value={form.sourceResolutionExtension.fromDateIso}
            onChange={(value) =>
              patch("sourceResolutionExtension", "fromDateIso", value)
            }
          />

          <Bm009DateSelectField
            label="Đến ngày"
            required
            value={form.sourceResolutionExtension.toDateIso}
            onChange={(value) =>
              patch("sourceResolutionExtension", "toDateIso", value)
            }
          />
        </div>

        <Field
          label="Nội dung Điều 1 tự sinh"
          multiline
          readOnly
          value={buildArticle1Line(form)}
        />

        <Field
          label="Nội dung Điều 2 tự sinh"
          multiline
          readOnly
          value={buildArticle2Line(form)}
        />
      </SectionCard>

      <SectionCard title="4. Nơi nhận">
        <Field
          label="Cơ quan đề nghị / cơ quan điều tra tự sinh"
          value={buildRequestingAgencyRecipientLine(form)}
          readOnly
        />

        <Field
          label="Lưu hồ sơ"
          required
          value={form.recipients.archiveLine}
          onChange={(value) => patch("recipients", "archiveLine", value)}
        />
      </SectionCard>

      <SectionCard title="5. Chữ ký">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Chế độ ký"
            required
            value={form.signature.signMode}
            onChange={(value) => patch("signature", "signMode", value)}
          />

          <Field
            label="Chức vụ ký"
            required
            value={form.signature.positionTitle}
            onChange={(value) => patch("signature", "positionTitle", value)}
          />
        </div>

        <Field
          label="Người ký"
          required
          value={form.signature.signerName}
          onChange={(value) => patch("signature", "signerName", value)}
        />
      </SectionCard>
    </div>
  );
}
