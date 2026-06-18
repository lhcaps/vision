"use client";

import {
  BmFieldText,
  BmFieldTextarea,
  BmFieldSelect,
  BmFormSection,
} from "@/components/documents/bm-form";

import { useEffect, useMemo, useState, type ReactNode } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

type TextRecord = Record<string, string>;

type Bm059FormInputs = {
  agency: TextRecord;
  official: TextRecord;
  document: TextRecord;
  legalBasis: TextRecord;
  caseDecision: TextRecord;
  accusedDecision: TextRecord;
  investigation: TextRecord;
  person: TextRecord;
  measure: TextRecord;
  recipients: TextRecord;
  signature: TextRecord;
  delivery: TextRecord;
};

type SectionKey = keyof Bm059FormInputs;

type RequiredField = {
  section: SectionKey;
  field: string;
  label: string;
};

type Bm059FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void;
};

const EMPTY_FORM: Bm059FormInputs = {
  agency: {
    parentName: "",
    name: "",
    shortName: "",
    issuePlace: "",
    phone: "",
  },
  official: {
    fullName: "",
    positionTitle: "",
    issuerTitle: "",
    prosecutorName: "",
  },
  document: {
    documentCode: "",
    issueDate: "",
  },
  legalBasis: {
    isJuvenile: "false",
  },
  caseDecision: {
    decisionNo: "",
    issueDate: "",
    issuedBy: "",
    legalBasisLine: "",
  },
  accusedDecision: {
    decisionNo: "",
    issueDate: "",
    issuedBy: "",
    legalBasisLine: "",
  },
  investigation: {
    investigationUnitName: "",
    detentionExecutionUnitName: "",
  },
  person: {
    fullName: "",
    genderLabel: "",
    otherName: "",
    dateOfBirth: "",
    birthDay: "",
    birthMonth: "",
    birthYear: "",
    placeOfBirth: "",
    nationality: "",
    ethnicity: "",
    religion: "",
    occupation: "",
    identityType: "",
    identityNo: "",
    identityIssuedDate: "",
    identityIssuedPlace: "",
    permanentAddress: "",
    temporaryAddress: "",
    currentAddress: "",
  },
  measure: {
    fromDate: "",
    toDate: "",
    durationText: "",
    detentionOrderCode: "",
    detentionOrderIssueDate: "",
    detentionOrderLegalBasisLine: "",
    prosecutionExtensionDecisionCode: "",
    prosecutionExtensionDecisionIssueDate: "",
    prosecutionExtensionDecisionLegalBasisLine: "",
    detentionExtensionDurationText: "",
    detentionExtensionFromDateText: "",
    detentionExtensionToDateText: "",
    detentionExtensionReasonLine: "",
    detentionExtensionArticle1Line: "",
    detentionExtensionArticle2Line: "",
    detentionExecutionUnitName: "",
  },
  recipients: {
    personLine: "",
    detentionExecutionUnitLine: "",
    investigationUnitLine: "",
    archiveLine: "",
  },
  signature: {
    signMode: "",
    positionTitle: "",
    signerName: "",
  },
  delivery: {
    deliveredAtText: "",
    receiverTitle: "",
  },
};

const REQUIRED_FIELDS: RequiredField[] = [
  { section: "agency", field: "parentName", label: "Cơ quan cấp trên" },
  { section: "agency", field: "name", label: "Cơ quan ban hành" },
  { section: "agency", field: "issuePlace", label: "Địa danh ban hành" },
  { section: "official", field: "issuerTitle", label: "Thẩm quyền ban hành" },
  { section: "document", field: "documentCode", label: "Số quyết định" },
  { section: "document", field: "issueDate", label: "Ngày quyết định" },
  { section: "caseDecision", field: "decisionNo", label: "Số quyết định khởi tố vụ án" },
  { section: "caseDecision", field: "issuedBy", label: "Cơ quan khởi tố vụ án" },
  { section: "accusedDecision", field: "decisionNo", label: "Số quyết định khởi tố bị can" },
  { section: "accusedDecision", field: "issuedBy", label: "Cơ quan khởi tố bị can" },
  { section: "person", field: "fullName", label: "Họ tên bị can" },
  { section: "person", field: "genderLabel", label: "Giới tính" },
  { section: "person", field: "dateOfBirth", label: "Ngày sinh" },
  { section: "person", field: "placeOfBirth", label: "Nơi sinh" },
  { section: "person", field: "identityNo", label: "Số CMND/CCCD/Hộ chiếu" },
  { section: "person", field: "identityIssuedDate", label: "Ngày cấp giấy tờ" },
  { section: "person", field: "identityIssuedPlace", label: "Nơi cấp giấy tờ" },
  { section: "person", field: "permanentAddress", label: "Nơi thường trú" },
  { section: "person", field: "currentAddress", label: "Nơi ở hiện tại" },
  { section: "measure", field: "detentionOrderLegalBasisLine", label: "Căn cứ lệnh tạm giam" },
  { section: "measure", field: "prosecutionExtensionDecisionLegalBasisLine", label: "Căn cứ gia hạn truy tố" },
  { section: "measure", field: "detentionExtensionDurationText", label: "Thời hạn gia hạn tạm giam" },
  { section: "measure", field: "detentionExtensionFromDateText", label: "Ngày bắt đầu gia hạn" },
  { section: "measure", field: "detentionExtensionToDateText", label: "Ngày kết thúc gia hạn" },
  { section: "measure", field: "detentionExtensionReasonLine", label: "Lý do gia hạn" },
  { section: "measure", field: "detentionExecutionUnitName", label: "Cơ sở giam giữ/đơn vị thi hành" },
  { section: "recipients", field: "personLine", label: "Nơi nhận - bị can" },
  { section: "recipients", field: "detentionExecutionUnitLine", label: "Nơi nhận - cơ sở giam giữ" },
  { section: "signature", field: "positionTitle", label: "Chức vụ ký" },
  { section: "signature", field: "signerName", label: "Người ký" },
  { section: "delivery", field: "receiverTitle", label: "Chức danh người nhận quyết định" },
];

const GENDER_OPTIONS = [
  { value: "Nam", label: "Nam" },
  { value: "Nữ", label: "Nữ" },
  { value: "Khác", label: "Khác" },
];

const SIGN_MODE_OPTIONS = [
  { value: "KT. VIỆN TRƯỞNG", label: "KT. VIỆN TRƯỞNG" },
  { value: "VIỆN TRƯỞNG", label: "VIỆN TRƯỞNG" },
  { value: "TUQ. VIỆN TRƯỞNG", label: "TUQ. VIỆN TRƯỞNG" },
];

const POSITION_OPTIONS = [
  { value: "VIỆN TRƯỞNG", label: "VIỆN TRƯỞNG" },
  { value: "PHÓ VIỆN TRƯỞNG", label: "PHÓ VIỆN TRƯỞNG" },
  { value: "KIỂM SÁT VIÊN", label: "KIỂM SÁT VIÊN" },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function section(payload: Record<string, unknown>, key: string): Record<string, unknown> {
  const value = payload[key];
  return isRecord(value) ? value : {};
}

function pick(record: Record<string, unknown>, key: string): string {
  return text(record[key]);
}

function toDateInput(value: unknown): string {
  const raw = text(value).trim();

  if (!raw) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return "";
}

function getValue(form: Bm059FormInputs, sectionKey: SectionKey, field: string): string {
  return form[sectionKey][field] ?? "";
}

function normalizeFormInputs(payload: Record<string, unknown>): Bm059FormInputs {
  const agency = section(payload, "agency");
  const official = section(payload, "official");
  const document = section(payload, "document");
  const legalBasis = section(payload, "legalBasis");
  const caseDecision = section(payload, "caseDecision");
  const accusedDecision = section(payload, "accusedDecision");
  const investigation = section(payload, "investigation");
  const person = section(payload, "person");
  const measure = section(payload, "measure");
  const recipients = section(payload, "recipients");
  const signature = section(payload, "signature");
  const delivery = section(payload, "delivery");

  return {
    agency: {
      parentName: pick(agency, "parentName"),
      name: pick(agency, "name"),
      shortName: pick(agency, "shortName"),
      issuePlace: pick(agency, "issuePlace"),
      phone: pick(agency, "phone"),
    },
    official: {
      fullName: pick(official, "fullName"),
      positionTitle: pick(official, "positionTitle"),
      issuerTitle: pick(official, "issuerTitle"),
      prosecutorName: pick(official, "prosecutorName"),
    },
    document: {
      documentCode: pick(document, "documentCode"),
      issueDate: toDateInput(document.issueDate),
    },
    legalBasis: {
      isJuvenile: pick(legalBasis, "isJuvenile") === "true" ? "true" : "false",
    },
    caseDecision: {
      decisionNo: pick(caseDecision, "decisionNo"),
      issueDate: toDateInput(caseDecision.issueDate),
      issuedBy: pick(caseDecision, "issuedBy"),
      legalBasisLine: pick(caseDecision, "legalBasisLine"),
    },
    accusedDecision: {
      decisionNo: pick(accusedDecision, "decisionNo"),
      issueDate: toDateInput(accusedDecision.issueDate),
      issuedBy: pick(accusedDecision, "issuedBy"),
      legalBasisLine: pick(accusedDecision, "legalBasisLine"),
    },
    investigation: {
      investigationUnitName: pick(investigation, "investigationUnitName"),
      detentionExecutionUnitName:
        pick(investigation, "detentionExecutionUnitName") ||
        pick(measure, "detentionExecutionUnitName"),
    },
    person: {
      fullName: pick(person, "fullName"),
      genderLabel: pick(person, "genderLabel"),
      otherName: pick(person, "otherName"),
      dateOfBirth: toDateInput(person.dateOfBirth),
      birthDay: pick(person, "birthDay"),
      birthMonth: pick(person, "birthMonth"),
      birthYear: pick(person, "birthYear"),
      placeOfBirth: pick(person, "placeOfBirth"),
      nationality: pick(person, "nationality"),
      ethnicity: pick(person, "ethnicity"),
      religion: pick(person, "religion"),
      occupation: pick(person, "occupation"),
      identityType: pick(person, "identityType") || "Thẻ CCCD",
      identityNo: pick(person, "identityNo"),
      identityIssuedDate: toDateInput(person.identityIssuedDate),
      identityIssuedPlace: pick(person, "identityIssuedPlace"),
      permanentAddress: pick(person, "permanentAddress"),
      temporaryAddress: pick(person, "temporaryAddress"),
      currentAddress: pick(person, "currentAddress"),
    },
    measure: {
      fromDate: toDateInput(measure.fromDate),
      toDate: toDateInput(measure.toDate),
      durationText: pick(measure, "durationText"),
      detentionOrderCode: pick(measure, "detentionOrderCode"),
      detentionOrderIssueDate: toDateInput(measure.detentionOrderIssueDate),
      detentionOrderLegalBasisLine: pick(measure, "detentionOrderLegalBasisLine"),
      prosecutionExtensionDecisionCode: pick(measure, "prosecutionExtensionDecisionCode"),
      prosecutionExtensionDecisionIssueDate: toDateInput(
        measure.prosecutionExtensionDecisionIssueDate,
      ),
      prosecutionExtensionDecisionLegalBasisLine: pick(
        measure,
        "prosecutionExtensionDecisionLegalBasisLine",
      ),
      detentionExtensionDurationText: pick(measure, "detentionExtensionDurationText"),
      detentionExtensionFromDateText: pick(measure, "detentionExtensionFromDateText"),
      detentionExtensionToDateText: pick(measure, "detentionExtensionToDateText"),
      detentionExtensionReasonLine: pick(measure, "detentionExtensionReasonLine"),
      detentionExtensionArticle1Line: pick(measure, "detentionExtensionArticle1Line"),
      detentionExtensionArticle2Line: pick(measure, "detentionExtensionArticle2Line"),
      detentionExecutionUnitName: pick(measure, "detentionExecutionUnitName"),
    },
    recipients: {
      personLine: pick(recipients, "personLine"),
      detentionExecutionUnitLine: pick(recipients, "detentionExecutionUnitLine"),
      investigationUnitLine: pick(recipients, "investigationUnitLine"),
      archiveLine: pick(recipients, "archiveLine"),
    },
    signature: {
      signMode: pick(signature, "signMode") || "KT. VIỆN TRƯỞNG",
      positionTitle: pick(signature, "positionTitle") || "PHÓ VIỆN TRƯỞNG",
      signerName: pick(signature, "signerName"),
    },
    delivery: {
      deliveredAtText: pick(delivery, "deliveredAtText"),
      receiverTitle: pick(delivery, "receiverTitle") || "NGƯỜI BỊ TẠM GIAM",
    },
  };
}

async function getBm059RenderPayload(documentId: string | number): Promise<Record<string, unknown>> {
  const response = await fetch(`${API_BASE_URL}/documents/generated/${documentId}/render-payload`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Không tải được payload BM-059. HTTP ${response.status}`);
  }

  return (await response.json()) as Record<string, unknown>;
}

async function saveBm059FormInputs(
  documentId: string | number,
  form: Bm059FormInputs,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/documents/generated/${documentId}/form-inputs`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      ...form,
      updatedByName: "",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Không lưu được dữ liệu BM-059. HTTP ${response.status}`);
  }
}

export function Bm059FormInputsPanel({
  documentId,
  onSaved,
}: Bm059FormInputsPanelProps) {
  const [form, setForm] = useState<Bm059FormInputs>(EMPTY_FORM);
  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const currentSnapshot = useMemo(() => JSON.stringify(form), [form]);
  const isDirty = currentSnapshot !== initialSnapshot;

  const missingFields = useMemo(() => {
    return REQUIRED_FIELDS.filter((item) => !getValue(form, item.section, item.field).trim());
  }, [form]);

  async function loadForm() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const payload = await getBm059RenderPayload(documentId);
      const nextForm = normalizeFormInputs(payload);

      setForm(nextForm);
      setInitialSnapshot(JSON.stringify(nextForm));
      setSavedAt(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Không tải được dữ liệu biểu mẫu BM-059.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadForm();
     
  }, [documentId]);

  function updateField(sectionKey: SectionKey, field: string, value: string) {
    setForm((current) => {
      const next: Bm059FormInputs = {
        ...current,
        [sectionKey]: {
          ...current[sectionKey],
          [field]: value,
        },
      };

      if (sectionKey === "person" && field === "fullName") {
        next.recipients = {
          ...next.recipients,
          personLine: value.trim() ? `- ${value.trim()};` : "",
        };
      }

      if (
        (sectionKey === "measure" && field === "detentionExecutionUnitName") ||
        (sectionKey === "investigation" && field === "detentionExecutionUnitName")
      ) {
        next.recipients = {
          ...next.recipients,
          detentionExecutionUnitLine: value.trim() ? `- ${value.trim()};` : "",
        };
      }

      return next;
    });
  }

  function fillCustomerSample() {
    const sample: Bm059FormInputs = {
      agency: {
        parentName: "",
        name: "",
        shortName: "VKSKV7",
        issuePlace: "TP. Hồ Chí Minh",
        phone: "",
      },
      official: {
        fullName: "",
        positionTitle: "VIỆN TRƯỞNG",
        issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
        prosecutorName: "",
      },
      document: {
        documentCode: "18/QĐ-VKSKV7",
        issueDate: "2026-05-11",
      },
      legalBasis: {
        isJuvenile: "false",
      },
      caseDecision: {
        decisionNo: "01/QĐ-VKSKV7",
        issueDate: "2026-05-06",
        issuedBy: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
        legalBasisLine:
          "Quyết định khởi tố vụ án hình sự số 01/QĐ-VKSKV7 ngày 06/5/2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh về tội “Đánh bạc” quy định tại khoản 1 Điều 321 Bộ luật Hình sự của Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025",
      },
      accusedDecision: {
        decisionNo: "02/QĐ-VKSKV7",
        issueDate: "2026-05-06",
        issuedBy: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
        legalBasisLine:
          "Quyết định khởi tố bị can số 02/QĐ-VKSKV7 ngày 06/5/2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh đối với , về tội “Đánh bạc” quy định tại khoản 1 Điều 321 Bộ luật Hình sự của Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025",
      },
      investigation: {
        investigationUnitName: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
        detentionExecutionUnitName: "Trại tạm giam Công an Thành phố Hồ Chí Minh",
      },
      person: {
        fullName: "",
        genderLabel: "Nam",
        otherName: "Không có",
        dateOfBirth: "1985-09-08",
        birthDay: "08",
        birthMonth: "09",
        birthYear: "1985",
        placeOfBirth: "tỉnh Quảng Ngãi",
        nationality: "Việt Nam",
        ethnicity: "Kinh",
        religion: "Không",
        occupation: "Kinh doanh",
        identityType: "Thẻ CCCD",
        identityNo: "051080000314",
        identityIssuedDate: "2021-12-22",
        identityIssuedPlace: "Cục Cảnh sát Quản lý hành chính về trật tự xã hội",
        permanentAddress:
          "số 49/37, đường TCH 16, Khu phố 45, phường Trung Mỹ Tây, Thành phố Hồ Chí Minh",
        temporaryAddress: "",
        currentAddress: "số 13/4A, Ấp 107, xã Đông Thạnh, Thành phố Hồ Chí Minh",
      },
      measure: {
        fromDate: "2026-07-11",
        toDate: "2026-07-26",
        durationText: "15 ngày",
        detentionOrderCode: "17/LTG-VKSKV7",
        detentionOrderIssueDate: "2026-05-11",
        detentionOrderLegalBasisLine:
          "Căn cứ Lệnh tạm giam số 17/LTG-VKSKV7 ngày 11 tháng 5 năm 2026 của Viện kiểm sát nhân dân khu vực 7;",
        prosecutionExtensionDecisionCode: "03/QĐ-VKSKV7",
        prosecutionExtensionDecisionIssueDate: "2026-07-10",
        prosecutionExtensionDecisionLegalBasisLine:
          "Căn cứ Quyết định gia hạn thời hạn quyết định việc truy tố số 03/QĐ-VKSKV7 ngày 10 tháng 7 năm 2026 của Viện kiểm sát nhân dân khu vực 7 đối với ;",
        detentionExtensionDurationText: "15 ngày",
        detentionExtensionFromDateText: "11/7/2026",
        detentionExtensionToDateText: "26/7/2026",
        detentionExtensionReasonLine:
          "việc gia hạn thời hạn tạm giam để quyết định việc truy tố đối với bị can  là có căn cứ và cần thiết,",
        detentionExtensionArticle1Line: "Gia hạn tạm giam đối với bị can .",
        detentionExtensionArticle2Line:
          "Yêu cầu Trại tạm giam Công an Thành phố Hồ Chí Minh thi hành Quyết định này theo quy định của Bộ luật Tố tụng hình sự.",
        detentionExecutionUnitName: "Trại tạm giam Công an Thành phố Hồ Chí Minh",
      },
      recipients: {
        personLine: "- ;",
        detentionExecutionUnitLine: "- Trại tạm giam Công an Thành phố Hồ Chí Minh;",
        investigationUnitLine: "- Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
        archiveLine: "- Lưu: HSVA, HSKS, VP.",
      },
      signature: {
        signMode: "KT. VIỆN TRƯỞNG",
        positionTitle: "PHÓ VIỆN TRƯỞNG",
        signerName: "",
      },
      delivery: {
        deliveredAtText:
          "Quyết định này đã được giao cho người bị tạm giam một bản vào hồi ... giờ ... ngày ... tháng ... năm 2026",
        receiverTitle: "NGƯỜI BỊ TẠM GIAM",
      },
    };

    setForm(sample);
  }

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage("");

    try {
      await saveBm059FormInputs(documentId, form);

      setInitialSnapshot(JSON.stringify(form));
      setSavedAt(new Date());
      onSaved?.();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Không lưu được dữ liệu biểu mẫu BM-059.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Đang tải dữ liệu BM-059...</p>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              BM-059
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Dữ liệu biểu mẫu Quyết định gia hạn thời hạn tạm giam để truy tố
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Form này lưu dữ liệu nghiệp vụ riêng cho BM-059: số quyết định,
              căn cứ lệnh tạm giam, căn cứ gia hạn truy tố, thời hạn gia hạn,
              cơ sở giam giữ, thông tin bị can, nơi nhận, giao nhận quyết định
              và chữ ký.
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm md:items-end">
            <span
              className={
                isDirty
                  ? "font-semibold text-amber-700"
                  : "font-semibold text-emerald-700"
              }
            >
              {isDirty ? "Có thay đổi chưa lưu" : "Đã đồng bộ"}
            </span>

            {savedAt ? (
              <span className="text-xs text-slate-500">
                Lưu lúc {savedAt.toLocaleTimeString("vi-VN")}
              </span>
            ) : null}
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {missingFields.length > 0 ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-800">
              Còn thiếu {missingFields.length} trường quan trọng:
            </p>
            <p className="mt-1 text-sm text-amber-700">
              {missingFields.map((item) => item.label).join(", ")}
            </p>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            Các trường quan trọng của BM-059 đã được nhập đủ.
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fillCustomerSample}
            className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
          >
            Điền dữ liệu mẫu BM-059
          </button>

          <button
            type="button"
            onClick={loadForm}
            disabled={isSaving}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Tải lại từ backend
          </button>
        </div>
      </section>

      <BmFormSection title="1. Cơ quan ban hành">
        <BmFieldText required label="Cơ quan cấp trên" value={form.agency.parentName} onChange={(value) => updateField("agency", "parentName", value)} />
        <BmFieldText required label="Cơ quan ban hành" value={form.agency.name} onChange={(value) => updateField("agency", "name", value)} />
        <BmFieldText label="Tên viết tắt" value={form.agency.shortName} onChange={(value) => updateField("agency", "shortName", value)} />
        <BmFieldText required label="Địa danh ban hành" value={form.agency.issuePlace} onChange={(value) => updateField("agency", "issuePlace", value)} />
      </BmFormSection>

      <BmFormSection title="2. Quyết định và thẩm quyền">
        <BmFieldText required label="Số quyết định gia hạn" value={form.document.documentCode} onChange={(value) => updateField("document", "documentCode", value)} />
        <BmFieldText required label="Ngày quyết định" value={form.document.issueDate} onChange={(value) => updateField("document", "issueDate", value)} />
        <BmFieldText required label="Dòng thẩm quyền" value={form.official.issuerTitle} onChange={(value) => updateField("official", "issuerTitle", value)} fullWidth />
      </BmFormSection>

      <BmFormSection title="3. Căn cứ tố tụng">
        <label className="md:col-span-2 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.legalBasis.isJuvenile === "true"}
            onChange={(event) =>
              updateField("legalBasis", "isJuvenile", event.target.checked ? "true" : "false")
            }
            className="mt-1 h-4 w-4 rounded border-slate-300"
          />
          <span>
            <span className="block font-semibold text-slate-900">
              Áp dụng căn cứ người chưa thành niên
            </span>
            <span className="mt-1 block text-xs leading-5 text-slate-500">
              Khi tick, backend sẽ tự sinh dòng căn cứ Luật Tư pháp người chưa thành niên. Không tick thì không sinh dòng này.
            </span>
          </span>
        </label>

        <BmFieldText required label="Số quyết định khởi tố vụ án" value={form.caseDecision.decisionNo} onChange={(value) => updateField("caseDecision", "decisionNo", value)} />
        <BmFieldText label="Ngày khởi tố vụ án" value={form.caseDecision.issueDate} onChange={(value) => updateField("caseDecision", "issueDate", value)} />
        <BmFieldTextarea required label="Cơ quan khởi tố vụ án" value={form.caseDecision.issuedBy} onChange={(value) => updateField("caseDecision", "issuedBy", value)} fullWidth/>
        <BmFieldTextarea label="Dòng căn cứ khởi tố vụ án" value={form.caseDecision.legalBasisLine} onChange={(value) => updateField("caseDecision", "legalBasisLine", value)} fullWidth/>

        <BmFieldText required label="Số quyết định khởi tố bị can" value={form.accusedDecision.decisionNo} onChange={(value) => updateField("accusedDecision", "decisionNo", value)} />
        <BmFieldText label="Ngày khởi tố bị can" value={form.accusedDecision.issueDate} onChange={(value) => updateField("accusedDecision", "issueDate", value)} />
        <BmFieldTextarea required label="Cơ quan khởi tố bị can" value={form.accusedDecision.issuedBy} onChange={(value) => updateField("accusedDecision", "issuedBy", value)} fullWidth/>
        <BmFieldTextarea label="Dòng căn cứ khởi tố bị can" value={form.accusedDecision.legalBasisLine} onChange={(value) => updateField("accusedDecision", "legalBasisLine", value)} fullWidth/>
      </BmFormSection>

      <BmFormSection title="4. Nội dung gia hạn tạm giam">
        <BmFieldTextarea required label="Căn cứ lệnh tạm giam" value={form.measure.detentionOrderLegalBasisLine} onChange={(value) => updateField("measure", "detentionOrderLegalBasisLine", value)} fullWidth/>
        <BmFieldTextarea required label="Căn cứ gia hạn thời hạn quyết định việc truy tố" value={form.measure.prosecutionExtensionDecisionLegalBasisLine} onChange={(value) => updateField("measure", "prosecutionExtensionDecisionLegalBasisLine", value)} fullWidth/>
        <BmFieldTextarea required label="Lý do gia hạn" value={form.measure.detentionExtensionReasonLine} onChange={(value) => updateField("measure", "detentionExtensionReasonLine", value)} fullWidth/>
        <BmFieldText required label="Thời hạn gia hạn" value={form.measure.detentionExtensionDurationText} onChange={(value) => updateField("measure", "detentionExtensionDurationText", value)} />
        <BmFieldText required label="Từ ngày" value={form.measure.detentionExtensionFromDateText} onChange={(value) => updateField("measure", "detentionExtensionFromDateText", value)} />
        <BmFieldText required label="Đến ngày" value={form.measure.detentionExtensionToDateText} onChange={(value) => updateField("measure", "detentionExtensionToDateText", value)} />
        <BmFieldText required label="Cơ sở giam giữ/đơn vị thi hành" value={form.measure.detentionExecutionUnitName} onChange={(value) => updateField("measure", "detentionExecutionUnitName", value)} />
        <BmFieldTextarea label="Nội dung Điều 1" value={form.measure.detentionExtensionArticle1Line} onChange={(value) => updateField("measure", "detentionExtensionArticle1Line", value)} fullWidth/>
        <BmFieldTextarea label="Nội dung Điều 2" value={form.measure.detentionExtensionArticle2Line} onChange={(value) => updateField("measure", "detentionExtensionArticle2Line", value)} fullWidth/>
      </BmFormSection>

      <BmFormSection title="5. Thông tin bị can">
        <BmFieldText required label="Họ tên" value={form.person.fullName} onChange={(value) => updateField("person", "fullName", value)} />
        <BmFieldSelect required label="Giới tính" value={form.person.genderLabel} onChange={(value) => updateField("person", "genderLabel", value)} options={GENDER_OPTIONS} />
        <BmFieldText label="Tên gọi khác" value={form.person.otherName} onChange={(value) => updateField("person", "otherName", value)} />
        <BmFieldText required label="Ngày sinh" value={form.person.dateOfBirth} onChange={(value) => updateField("person", "dateOfBirth", value)} />
        <BmFieldText required label="Nơi sinh" value={form.person.placeOfBirth} onChange={(value) => updateField("person", "placeOfBirth", value)} />
        <BmFieldText label="Quốc tịch" value={form.person.nationality} onChange={(value) => updateField("person", "nationality", value)} />
        <BmFieldText label="Dân tộc" value={form.person.ethnicity} onChange={(value) => updateField("person", "ethnicity", value)} />
        <BmFieldText label="Tôn giáo" value={form.person.religion} onChange={(value) => updateField("person", "religion", value)} />
        <BmFieldText label="Nghề nghiệp" value={form.person.occupation} onChange={(value) => updateField("person", "occupation", value)} />
        <BmFieldText label="Loại giấy tờ" value={form.person.identityType} onChange={(value) => updateField("person", "identityType", value)} />
        <BmFieldText required label="Số CMND/CCCD/Hộ chiếu" value={form.person.identityNo} onChange={(value) => updateField("person", "identityNo", value)} />
        <BmFieldText required label="Ngày cấp" value={form.person.identityIssuedDate} onChange={(value) => updateField("person", "identityIssuedDate", value)} />
        <BmFieldText required label="Nơi cấp" value={form.person.identityIssuedPlace} onChange={(value) => updateField("person", "identityIssuedPlace", value)} fullWidth />
        <BmFieldTextarea required label="Nơi thường trú" value={form.person.permanentAddress} onChange={(value) => updateField("person", "permanentAddress", value)} fullWidth/>
        <BmFieldTextarea label="Nơi tạm trú" value={form.person.temporaryAddress} onChange={(value) => updateField("person", "temporaryAddress", value)} fullWidth/>
        <BmFieldTextarea required label="Nơi ở hiện tại" value={form.person.currentAddress} onChange={(value) => updateField("person", "currentAddress", value)} fullWidth/>
      </BmFormSection>

      <BmFormSection title="6. Nơi nhận và giao nhận">
        <BmFieldText required label="Bị can/người bị tạm giam" value={form.recipients.personLine} onChange={(value) => updateField("recipients", "personLine", value)} />
        <BmFieldText required label="Cơ sở giam giữ/đơn vị thi hành" value={form.recipients.detentionExecutionUnitLine} onChange={(value) => updateField("recipients", "detentionExecutionUnitLine", value)} />
        <BmFieldText label="Cơ quan điều tra" value={form.recipients.investigationUnitLine} onChange={(value) => updateField("recipients", "investigationUnitLine", value)} />
        <BmFieldText label="Lưu hồ sơ" value={form.recipients.archiveLine} onChange={(value) => updateField("recipients", "archiveLine", value)} />
        <BmFieldTextarea label="Dòng giao quyết định" value={form.delivery.deliveredAtText} onChange={(value) => updateField("delivery", "deliveredAtText", value)} fullWidth/>
        <BmFieldText required label="Chức danh người nhận" value={form.delivery.receiverTitle} onChange={(value) => updateField("delivery", "receiverTitle", value)} />
      </BmFormSection>

      <BmFormSection title="7. Chữ ký">
        <BmFieldSelect label="Chế độ ký" value={form.signature.signMode} onChange={(value) => updateField("signature", "signMode", value)} options={SIGN_MODE_OPTIONS} />
        <BmFieldSelect required label="Chức vụ ký" value={form.signature.positionTitle} onChange={(value) => updateField("signature", "positionTitle", value)} options={POSITION_OPTIONS} />
        <BmFieldText required label="Người ký" value={form.signature.signerName} onChange={(value) => updateField("signature", "signerName", value)} />
      </BmFormSection>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">
              Lưu dữ liệu BM-059
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Sau khi lưu, chuyển sang tab File đã xuất để render DOCX và convert PDF.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSaving ? "Đang lưu..." : "Lưu dữ liệu BM-059"}
          </button>
        </div>
      </section>
    </div>
  );
}

