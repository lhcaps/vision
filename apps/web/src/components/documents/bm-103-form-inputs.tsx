"use client";

import { useEffect, useMemo, useState } from "react";

type Bm103FormInputsPanelProps = {
  documentId: string;
  onSaved?: () => void;
};

type FormSection = Record<string, string>;

type Bm103FormState = {
  document: FormSection;
  legalBasis: FormSection;
  caseDecision: FormSection;
  investigationExtension: FormSection;
  proposal: FormSection;
  recipients: FormSection;
  signature: FormSection;
};

type JsonObject = Record<string, unknown>;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const EMPTY_FORM: Bm103FormState = {
  document: {
    documentCode: "",
    issueDate: "",
    issuePlace: "TP. Hồ Chí Minh",
    issuePlaceAndDateLine: "",
  },
  legalBasis: {
    procedureArticlesLine:
      "Căn cứ Điều 41 và Điều 172 của Bộ luật Tố tụng hình sự;",
  },
  caseDecision: {
    prosecutionDecisionLegalBasisLine: "",
    prosecutionDecisionSummaryLine: "",
  },
  investigationExtension: {
    previousDecisionLegalBasisLine: "",
    requestRoundText: "lần thứ hai",
    durationText: "02 tháng",
    fromDateText: "",
    toDateText: "",
  },
  proposal: {
    requestingDocumentLine: "",
    proposingProcuracyName: "",
  },
  recipients: {
    superiorProcuracyName: "",
    superiorProcuracyLine: "",
    investigatingAgencyLine: "",
    archiveLine: "Lưu: HSVA, HSKS, VP",
  },
  signature: {
    signMode: "KT. VIỆN TRƯỞNG",
    positionTitle: "PHÓ VIỆN TRƯỞNG",
    signerName: "",
  },
};

const CUSTOMER_SAMPLE: Bm103FormState = {
  document: {
    documentCode: "103/DN-VKSKV7",
    issueDate: "2026-05-14",
    issuePlace: "TP. Hồ Chí Minh",
    issuePlaceAndDateLine: "TP. Hồ Chí Minh, ngày 14 tháng 5 năm 2026",
  },
  legalBasis: {
    procedureArticlesLine:
      "Căn cứ Điều 41 và Điều 172 của Bộ luật Tố tụng hình sự;",
  },
  caseDecision: {
    prosecutionDecisionLegalBasisLine:
      'Căn cứ Quyết định khởi tố vụ án hình sự số  ngày 06 tháng 5 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh về tội "Đánh bạc" quy định tại khoản 1 Điều 321 của Bộ luật Hình sự;',
    prosecutionDecisionSummaryLine:
      'Quyết định khởi tố vụ án hình sự số  ngày 06 tháng 5 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh về tội "Đánh bạc" quy định tại khoản 1 Điều 321 của Bộ luật Hình sự',
  },
  investigationExtension: {
    previousDecisionLegalBasisLine:
      "Căn cứ Quyết định gia hạn thời hạn điều tra vụ án hình sự lần thứ nhất số 02/QĐ-VKS ngày 10 tháng 5 năm 2026 của Viện kiểm sát nhân dân khu vực 7;",
    requestRoundText: "lần thứ hai",
    durationText: "02 tháng",
    fromDateText: "ngày 14 tháng 5 năm 2026",
    toDateText: "ngày 14 tháng 7 năm 2026",
  },
  proposal: {
    requestingDocumentLine:
      "Xét văn bản đề nghị gia hạn thời hạn điều tra vụ án hình sự của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh, nhận thấy việc gia hạn thời hạn điều tra là có căn cứ và cần thiết,",
    proposingProcuracyName: "Viện kiểm sát nhân dân khu vực 7",
  },
  recipients: {
    superiorProcuracyName: "Viện kiểm sát nhân dân Thành phố Hồ Chí Minh",
    superiorProcuracyLine: "Viện kiểm sát nhân dân Thành phố Hồ Chí Minh",
    investigatingAgencyLine:
      "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
    archiveLine: "Lưu: HSVA, HSKS, VP",
  },
  signature: {
    signMode: "KT. VIỆN TRƯỞNG",
    positionTitle: "PHÓ VIỆN TRƯỞNG",
    signerName: "",
  },
};

const REQUIRED_FIELDS = [
  "document.documentCode",
  "document.issuePlaceAndDateLine",
  "legalBasis.procedureArticlesLine",
  "caseDecision.prosecutionDecisionLegalBasisLine",
  "caseDecision.prosecutionDecisionSummaryLine",
  "investigationExtension.previousDecisionLegalBasisLine",
  "investigationExtension.requestRoundText",
  "investigationExtension.durationText",
  "investigationExtension.fromDateText",
  "investigationExtension.toDateText",
  "proposal.requestingDocumentLine",
  "proposal.proposingProcuracyName",
  "recipients.superiorProcuracyName",
  "recipients.superiorProcuracyLine",
  "recipients.investigatingAgencyLine",
  "recipients.archiveLine",
  "signature.signMode",
  "signature.positionTitle",
  "signature.signerName",
] as const;

function asJsonObject(value: unknown): JsonObject {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as JsonObject;
  }

  return {};
}

function readString(object: JsonObject, key: string): string {
  const value = object[key];

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

function getNestedValue(form: Bm103FormState, path: string): string {
  const [section, field] = path.split(".");

  if (!section || !field) {
    return "";
  }

  return form[section as keyof Bm103FormState]?.[field] ?? "";
}

function normalizeFormInputs(payload: JsonObject): Bm103FormState {
  const document = asJsonObject(payload.document);
  const legalBasis = asJsonObject(payload.legalBasis);
  const caseDecision = asJsonObject(payload.caseDecision);
  const investigationExtension = asJsonObject(payload.investigationExtension);
  const proposal = asJsonObject(payload.proposal);
  const recipients = asJsonObject(payload.recipients);
  const signature = asJsonObject(payload.signature);

  return {
    document: {
      documentCode:
        readString(document, "documentCode") ||
        readString(document, "documentNo") ||
        EMPTY_FORM.document.documentCode,
      issueDate:
        readString(document, "issueDate") || EMPTY_FORM.document.issueDate,
      issuePlace:
        readString(document, "issuePlace") || EMPTY_FORM.document.issuePlace,
      issuePlaceAndDateLine:
        readString(document, "issuePlaceAndDateLine") ||
        readString(document, "issuePlaceDateLine") ||
        EMPTY_FORM.document.issuePlaceAndDateLine,
    },
    legalBasis: {
      procedureArticlesLine:
        readString(legalBasis, "procedureArticlesLine") ||
        EMPTY_FORM.legalBasis.procedureArticlesLine,
    },
    caseDecision: {
      prosecutionDecisionLegalBasisLine:
        readString(caseDecision, "prosecutionDecisionLegalBasisLine") ||
        EMPTY_FORM.caseDecision.prosecutionDecisionLegalBasisLine,
      prosecutionDecisionSummaryLine:
        readString(caseDecision, "prosecutionDecisionSummaryLine") ||
        EMPTY_FORM.caseDecision.prosecutionDecisionSummaryLine,
    },
    investigationExtension: {
      previousDecisionLegalBasisLine:
        readString(investigationExtension, "previousDecisionLegalBasisLine") ||
        EMPTY_FORM.investigationExtension.previousDecisionLegalBasisLine,
      requestRoundText:
        readString(investigationExtension, "requestRoundText") ||
        EMPTY_FORM.investigationExtension.requestRoundText,
      durationText:
        readString(investigationExtension, "durationText") ||
        EMPTY_FORM.investigationExtension.durationText,
      fromDateText:
        readString(investigationExtension, "fromDateText") ||
        EMPTY_FORM.investigationExtension.fromDateText,
      toDateText:
        readString(investigationExtension, "toDateText") ||
        EMPTY_FORM.investigationExtension.toDateText,
    },
    proposal: {
      requestingDocumentLine:
        readString(proposal, "requestingDocumentLine") ||
        EMPTY_FORM.proposal.requestingDocumentLine,
      proposingProcuracyName:
        readString(proposal, "proposingProcuracyName") ||
        EMPTY_FORM.proposal.proposingProcuracyName,
    },
    recipients: {
      superiorProcuracyName:
        readString(recipients, "superiorProcuracyName") ||
        EMPTY_FORM.recipients.superiorProcuracyName,
      superiorProcuracyLine:
        readString(recipients, "superiorProcuracyLine") ||
        EMPTY_FORM.recipients.superiorProcuracyLine,
      investigatingAgencyLine:
        readString(recipients, "investigatingAgencyLine") ||
        EMPTY_FORM.recipients.investigatingAgencyLine,
      archiveLine:
        readString(recipients, "archiveLine") ||
        EMPTY_FORM.recipients.archiveLine,
    },
    signature: {
      signMode:
        readString(signature, "signMode") || EMPTY_FORM.signature.signMode,
      positionTitle:
        readString(signature, "positionTitle") ||
        EMPTY_FORM.signature.positionTitle,
      signerName:
        readString(signature, "signerName") || EMPTY_FORM.signature.signerName,
    },
  };
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
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
  placeholder,
  required,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
}) {
  const className =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>

      {multiline ? (
        <textarea
          className={`${className} min-h-24 resize-y`}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          className={className}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}


function buildBm103RenderReadyForm(form: Bm103FormState): Bm103FormState {
  const next = JSON.parse(JSON.stringify(form)) as Bm103FormState;
  const data = next as any;

  data.document = data.document ?? {};
  data.investigationExtension = data.investigationExtension ?? {};
  data.proposal = data.proposal ?? {};
  data.recipients = data.recipients ?? {};
  data.signature = data.signature ?? {};

  const documentCode = String(data.document.documentCode ?? "").trim();
  if (documentCode) {
    data.document.documentCode = documentCode;
    data.document.fullDocumentCode = String(data.document.fullDocumentCode ?? "").trim() || documentCode;
  }

  data.signature.signMode = data.signature.signMode || "KT. VIỆN TRƯỞNG";
  data.signature.positionTitle = data.signature.positionTitle || "PHÓ VIỆN TRƯỞNG";
  data.signature.signerName = data.signature.signerName || "";

  return next;
}

async function forceRenderBm103Files(documentId: string | number): Promise<void> {
  const renderResponse = await fetch(
    `${API_BASE_URL}/documents/generated/${documentId}/render-docx`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        force: true,
        renderedByName: "",
      }),
    },
  );

  if (!renderResponse.ok) {
    const message = await renderResponse.text().catch(() => "");
    throw new Error(
      message || "Đã lưu dữ liệu nhưng không render lại được DOCX.",
    );
  }

  const convertResponse = await fetch(
    `${API_BASE_URL}/documents/generated/${documentId}/convert-pdf`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        force: true,
        convertedByName: "",
      }),
    },
  );

  if (!convertResponse.ok) {
    const message = await convertResponse.text().catch(() => "");
    throw new Error(
      message || "Đã render DOCX nhưng không convert lại được PDF.",
    );
  }
}

export function Bm103FormInputsPanel({
  documentId,
  onSaved,
}: Bm103FormInputsPanelProps) {
  const [form, setForm] = useState<Bm103FormState>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const missingFields = useMemo(() => {
    return REQUIRED_FIELDS.filter((path) => !getNestedValue(form, path).trim());
  }, [form]);

  const canSave = missingFields.length === 0 && !isSaving;

  useEffect(() => {
    let isMounted = true;

    async function loadPayload() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/documents/generated/${documentId}/render-payload`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error(`Không tải được render-payload: ${response.status}`);
        }

        const payload = (await response.json()) as JsonObject;

        if (isMounted) {
          setForm(normalizeFormInputs(payload));
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Không tải được dữ liệu biểu mẫu BM-103.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadPayload();

    return () => {
      isMounted = false;
    };
  }, [documentId]);

  function updateField(
    section: keyof Bm103FormState,
    field: string,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));

    setMessage("");
    setErrorMessage("");
  }

  async function handleSave() {
    setIsSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      const renderReadyForm = buildBm103RenderReadyForm(form);

      const response = await fetch(
        `${API_BASE_URL}/documents/generated/${documentId}/form-inputs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
          body: JSON.stringify({
            ...renderReadyForm,
            formInputs: renderReadyForm,
            payloadOverrides: renderReadyForm,
            renderPayloadOverrides: renderReadyForm,
            updatedByName: "",
          }),
        },
      );

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          body || `Không lưu được dữ liệu BM-103: ${response.status}`,
        );
      }

      await forceRenderBm103Files(documentId);

      setForm(renderReadyForm);
      setMessage("Đã lưu dữ liệu BM-103 và render lại DOCX/PDF.");
      onSaved?.();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không lưu được dữ liệu BM-103.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
        Đang tải dữ liệu biểu mẫu BM-103...
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-blue-950">
              Dữ liệu biểu mẫu BM-103
            </h2>
            <p className="mt-1 text-sm text-blue-800">
              Đề nghị gia hạn thời hạn điều tra vụ án hình sự.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              onClick={() => {
                setForm(CUSTOMER_SAMPLE);
                setMessage("Đã điền dữ liệu mẫu BM-103.");
                setErrorMessage("");
              }}
            >
              Điền dữ liệu mẫu BM-103
            </button>

            <button
              type="button"
              className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={!canSave}
              onClick={() => void handleSave()}
            >
              {isSaving ? "Đang lưu..." : "Lưu dữ liệu BM-103"}
            </button>
          </div>
        </div>

        {missingFields.length > 0 ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Còn thiếu {missingFields.length} trường bắt buộc. Hãy điền đủ trước
            khi lưu.
          </div>
        ) : null}

        {message ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {message}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}
      </div>

      <SectionCard title="1. Thông tin văn bản">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Số văn bản"
            required
            value={form.document.documentCode}
            onChange={(value) => updateField("document", "documentCode", value)}
          />
          <Field
            label="Ngày ban hành"
            value={form.document.issueDate}
            placeholder="2026-05-14"
            onChange={(value) => updateField("document", "issueDate", value)}
          />
        </div>

        <Field
          label="Địa danh, ngày tháng năm"
          required
          value={form.document.issuePlaceAndDateLine}
          onChange={(value) =>
            updateField("document", "issuePlaceAndDateLine", value)
          }
        />
      </SectionCard>

      <SectionCard title="2. Căn cứ pháp lý">
        <Field
          label="Căn cứ Điều 41 và Điều 172 BLTTHS"
          required
          multiline
          value={form.legalBasis.procedureArticlesLine}
          onChange={(value) =>
            updateField("legalBasis", "procedureArticlesLine", value)
          }
        />
      </SectionCard>

      <SectionCard title="3. Quyết định khởi tố vụ án">
        <Field
          label="Dòng căn cứ quyết định khởi tố vụ án"
          required
          multiline
          value={form.caseDecision.prosecutionDecisionLegalBasisLine}
          onChange={(value) =>
            updateField(
              "caseDecision",
              "prosecutionDecisionLegalBasisLine",
              value,
            )
          }
        />

        <Field
          label="Tóm tắt quyết định khởi tố vụ án"
          required
          multiline
          value={form.caseDecision.prosecutionDecisionSummaryLine}
          onChange={(value) =>
            updateField("caseDecision", "prosecutionDecisionSummaryLine", value)
          }
        />
      </SectionCard>

      <SectionCard title="4. Gia hạn thời hạn điều tra">
        <Field
          label="Căn cứ quyết định gia hạn lần trước"
          required
          multiline
          value={form.investigationExtension.previousDecisionLegalBasisLine}
          onChange={(value) =>
            updateField(
              "investigationExtension",
              "previousDecisionLegalBasisLine",
              value,
            )
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Field
            label="Lần đề nghị gia hạn"
            required
            value={form.investigationExtension.requestRoundText}
            onChange={(value) =>
              updateField("investigationExtension", "requestRoundText", value)
            }
          />
          <Field
            label="Thời hạn gia hạn"
            required
            value={form.investigationExtension.durationText}
            onChange={(value) =>
              updateField("investigationExtension", "durationText", value)
            }
          />
          <Field
            label="Từ ngày"
            required
            value={form.investigationExtension.fromDateText}
            onChange={(value) =>
              updateField("investigationExtension", "fromDateText", value)
            }
          />
        </div>

        <Field
          label="Đến ngày"
          required
          value={form.investigationExtension.toDateText}
          onChange={(value) =>
            updateField("investigationExtension", "toDateText", value)
          }
        />
      </SectionCard>

      <SectionCard title="5. Nội dung đề nghị">
        <Field
          label="Dòng xét văn bản đề nghị"
          required
          multiline
          value={form.proposal.requestingDocumentLine}
          onChange={(value) =>
            updateField("proposal", "requestingDocumentLine", value)
          }
        />

        <Field
          label="Viện kiểm sát đề nghị"
          required
          value={form.proposal.proposingProcuracyName}
          onChange={(value) =>
            updateField("proposal", "proposingProcuracyName", value)
          }
        />
      </SectionCard>

      <SectionCard title="6. Nơi nhận">
        <Field
          label="Kính gửi"
          required
          value={form.recipients.superiorProcuracyName}
          onChange={(value) =>
            updateField("recipients", "superiorProcuracyName", value)
          }
        />

        <Field
          label="Nơi nhận - VKS cấp trên"
          required
          value={form.recipients.superiorProcuracyLine}
          onChange={(value) =>
            updateField("recipients", "superiorProcuracyLine", value)
          }
        />

        <Field
          label="Nơi nhận - Cơ quan điều tra"
          required
          value={form.recipients.investigatingAgencyLine}
          onChange={(value) =>
            updateField("recipients", "investigatingAgencyLine", value)
          }
        />

        <Field
          label="Lưu hồ sơ"
          required
          value={form.recipients.archiveLine}
          onChange={(value) => updateField("recipients", "archiveLine", value)}
        />
      </SectionCard>

      <SectionCard title="7. Chữ ký">
        <div className="grid gap-4 md:grid-cols-3">
          <Field
            label="Chế độ ký"
            required
            value={form.signature.signMode}
            onChange={(value) => updateField("signature", "signMode", value)}
          />
          <Field
            label="Chức vụ"
            required
            value={form.signature.positionTitle}
            onChange={(value) =>
              updateField("signature", "positionTitle", value)
            }
          />
          <Field
            label="Người ký"
            required
            value={form.signature.signerName}
            onChange={(value) => updateField("signature", "signerName", value)}
          />
        </div>
      </SectionCard>
    </div>
  );
}
