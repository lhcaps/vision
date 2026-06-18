"use client";

/**
 * BM-137 — Biên bản xác minh/làm việc
 * Stage: DIEU_TRA, Group: G04. TT 03/2026-VKSTC, Mẫu số 137/HS.
 *
 * Căn cứ: Điều 41 BLTTHS 2015; yêu cầu xác minh làm rõ nội dung vụ án.
 * Nghiệp vụ: KSV làm việc với cá nhân/tổ chức để xác minh thông tin phục vụ điều tra,
 * truy tố.
 */

import { useEffect, useMemo, useState } from "react";

import {
  BmFieldDate,
  BmFieldText,
  BmFieldTextarea,
  BmFormActions,
  BmFormMetaBar,
  BmFormSection,
  BmFormStatus,
  issuePlaceDateLine,
} from "@/components/documents/bm-form";

type AgencyForm = { parentName: string; name: string };
type DocumentForm = { documentCode: string; issuePlace: string; issueDateIso: string };
type VerificationForm = {
  caseTitle: string;
  offenseName: string;
  verificationTime: string;
  verificationLocation: string;
  subjectOfVerification: string;
  verificationMethod: string;
  findings: string;
  conclusionLine: string;
};
type ParticipantsForm = {
  investigatorName: string;
  investigatorPosition: string;
  recordKeeperName: string;
  recordKeeperPosition: string;
  personContactedName: string;
  personContactedRole: string;
};

type Bm137Form = {
  agency: AgencyForm;
  document: DocumentForm;
  verification: VerificationForm;
  participants: ParticipantsForm;
};

type RenderPayload = Record<string, unknown>;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const EMPTY_FORM: Bm137Form = {
  agency: {
    parentName: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
    name: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  document: {
    documentCode: "137/BBXM-VKSKV7",
    issuePlace: "TP. Hồ Chí Minh",
    issueDateIso: "",
  },
  verification: {
    caseTitle: "",
    offenseName: "",
    verificationTime: "",
    verificationLocation: "",
    subjectOfVerification: "",
    verificationMethod: "",
    findings: "",
    conclusionLine: "",
  },
  participants: {
    investigatorName: "",
    investigatorPosition: "Kiểm sát viên",
    recordKeeperName: "",
    recordKeeperPosition: "Điều tra viên",
    personContactedName: "",
    personContactedRole: "",
  },
};

const REQUIRED_FIELDS: ReadonlyArray<[string, string]> = [
  ["Viện kiểm sát cấp trên", "agency.parentName"],
  ["Viện kiểm sát ban hành", "agency.name"],
  ["Số biên bản", "document.documentCode"],
  ["Địa danh", "document.issuePlace"],
  ["Ngày lập", "document.issueDateIso"],
  ["Tên vụ án", "verification.caseTitle"],
  ["Tên người làm việc", "participants.investigatorName"],
];

function cleanText(v: unknown): string {
  return v == null ? "" : String(v).trim();
}

function nested(payload: RenderPayload | null, path: string): string {
  if (!payload) return "";
  const parts = path.split(".").filter(Boolean);
  let cur: unknown = payload;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return "";
    cur = (cur as Record<string, unknown>)[p];
  }
  return cleanText(cur);
}

function parseDateToIso(v: string): string {
  const raw = cleanText(v);
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return "";
}

function toVietnameseDateText(isoDate: string): string {
  const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return isoDate || "";
  return `ngày ${Number(m[3])} tháng ${Number(m[2])} năm ${m[1]}`;
}

function toSlashDateText(isoDate: string): string {
  const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return isoDate || "";
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function buildIssuePlaceAndDateLine(form: Bm137Form): string {
  return issuePlaceDateLine(form.document.issuePlace, form.document.issueDateIso);
}

function buildFindingsLine(form: Bm137Form): string {
  const v = form.verification;
  return `Tại ${v.verificationLocation.trim()} vào ${v.verificationTime.trim()}, chúng tôi làm việc với ${v.subjectOfVerification.trim()} bằng phương pháp ${v.verificationMethod.trim()}. Kết quả: ${v.findings.trim()}`;
}

function buildConclusionLine(form: Bm137Form): string {
  return form.verification.conclusionLine.trim();
}

function normalizeFormInputs(payload: RenderPayload | null): Bm137Form {
  const f = EMPTY_FORM;
  if (!payload) return f;
  return {
    agency: {
      parentName: nested(payload, "agency.parentName") || f.agency.parentName,
      name: nested(payload, "agency.name") || f.agency.name,
    },
    document: {
      documentCode:
        nested(payload, "document.documentCode") || f.document.documentCode,
      issuePlace:
        nested(payload, "document.issuePlace") || f.document.issuePlace,
      issueDateIso:
        parseDateToIso(nested(payload, "document.issueDate")) ||
        f.document.issueDateIso,
    },
    verification: {
      caseTitle: nested(payload, "verification.caseTitle") || "",
      offenseName: nested(payload, "verification.offenseName") || "",
      verificationTime: nested(payload, "verification.verificationTime") || "",
      verificationLocation:
        nested(payload, "verification.verificationLocation") || "",
      subjectOfVerification:
        nested(payload, "verification.subjectOfVerification") || "",
      verificationMethod:
        nested(payload, "verification.verificationMethod") || "",
      findings: nested(payload, "verification.findings") || "",
      conclusionLine: nested(payload, "verification.conclusionLine") || "",
    },
    participants: {
      investigatorName:
        nested(payload, "participants.investigatorName") || "",
      investigatorPosition:
        nested(payload, "participants.investigatorPosition") ||
        f.participants.investigatorPosition,
      recordKeeperName:
        nested(payload, "participants.recordKeeperName") || "",
      recordKeeperPosition:
        nested(payload, "participants.recordKeeperPosition") ||
        f.participants.recordKeeperPosition,
      personContactedName:
        nested(payload, "participants.personContactedName") || "",
      personContactedRole:
        nested(payload, "participants.personContactedRole") || "",
    },
  };
}

function lookupValue(form: Bm137Form, path: string): string {
  const parts = path.split(".").filter(Boolean);
  let cur: unknown = form;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return "";
    cur = (cur as Record<string, unknown>)[p];
  }
  return cleanText(cur);
}

function validateForm(form: Bm137Form): string[] {
  return REQUIRED_FIELDS.filter(([, path]) => !lookupValue(form, path)).map(
    ([label]) => label,
  );
}

function buildSaveBody(form: Bm137Form) {
  return {
    agency: {
      parentName: form.agency.parentName,
      name: form.agency.name,
      issuePlace: form.document.issuePlace,
    },
    document: {
      documentCode: form.document.documentCode,
      issueDate: toSlashDateText(form.document.issueDateIso),
      issueDateText: toVietnameseDateText(form.document.issueDateIso).replace(
        /^ngày\s+/iu,
        "",
      ),
      issuePlaceAndDateLine: buildIssuePlaceAndDateLine(form),
    },
    verification: {
      caseTitle: form.verification.caseTitle,
      offenseName: form.verification.offenseName,
      verificationTime: form.verification.verificationTime,
      verificationLocation: form.verification.verificationLocation,
      subjectOfVerification: form.verification.subjectOfVerification,
      verificationMethod: form.verification.verificationMethod,
      findings: form.verification.findings,
      findingsLine: buildFindingsLine(form),
      conclusionLine: buildConclusionLine(form),
    },
    participants: {
      investigatorName: form.participants.investigatorName,
      investigatorPosition: form.participants.investigatorPosition,
      recordKeeperName: form.participants.recordKeeperName,
      recordKeeperPosition: form.participants.recordKeeperPosition,
      personContactedName: form.participants.personContactedName,
      personContactedRole: form.participants.personContactedRole,
    },
    formInputs: {},
    payloadOverrides: {},
    renderPayloadOverrides: {},
  };
}

export function Bm137FormInputsPanel({
  documentId,
  onSaved,
}: {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
}) {
  const [form, setForm] = useState<Bm137Form>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validation = useMemo(() => validateForm(form), [form]);

  const patch = <S extends keyof Bm137Form, K extends keyof Bm137Form[S]>(
    section: S,
    key: K,
    value: Bm137Form[S][K],
  ) => {
    setForm((prev) => ({
      ...prev,
      [section]: { ...(prev[section] as Record<string, unknown>), [key]: value },
    }));
  };

  const reloadFromBackend = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/documents/generated/${documentId}/render-payload`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setForm(normalizeFormInputs((await res.json()) as RenderPayload));
      setMessage("Đã tải dữ liệu BM-137 từ backend.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi khi tải.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const errs = validateForm(form);
    if (errs.length > 0) {
      setValidationErrors(errs);
      setError(`Thiếu: ${errs.join(", ")}`);
      return;
    }
    setValidationErrors([]);
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/documents/generated/${documentId}/form-inputs`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify(buildSaveBody(form)),
        },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await reloadFromBackend();
      setMessage("Đã lưu BM-137 thành công.");
      await onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi khi lưu.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    void reloadFromBackend();
  }, [documentId]);

  const status = (() => {
    if (loading) return { kind: "loading" as const, text: "Đang tải..." };
    if (saving) return { kind: "loading" as const, text: "Đang lưu..." };
    if (validationErrors.length > 0)
      return {
        kind: "warning" as const,
        text: `Còn thiếu: ${validationErrors.join(", ")}`,
      };
    if (error) return { kind: "error" as const, text: error };
    if (message) return { kind: "success" as const, text: message };
    return { kind: "idle" as const, text: "" };
  })();

  return (
    <div className="space-y-5">
      <BmFormMetaBar
        templateCode="BM-137"
        title="Dữ liệu biểu mẫu Biên bản xác minh/làm việc"
        subtitle="Biểu mẫu TT 03/2026-VKSTC · Mẫu số 137/HS · Căn cứ Điều 41 BLTTHS 2015."
        isDirty={false}
        isLoading={loading}
        isSaving={saving}
        savedAt={null}
        errorMessage={error ?? undefined}
        warningMessage={
          validationErrors.length > 0
            ? `Còn thiếu: ${validationErrors.join(", ")}`
            : undefined
        }
        successMessage={status.kind === "success" ? status.text : undefined}
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-137"}
        onPrimary={handleSave}
        primaryDisabled={saving || loading}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
        onSecondary={reloadFromBackend}
      />

      {status.kind === "idle" ? null : (
        <BmFormStatus kind={status.kind}>{status.text}</BmFormStatus>
      )}

      <BmFormSection
        title="1. Cơ quan / văn bản"
        description="Thông tin VKS lập biên bản."
        requiredCount={5}
      >
        <BmFieldText
          label="Viện kiểm sát cấp trên"
          required
          value={form.agency.parentName}
          onChange={(v) => patch("agency", "parentName", v)}
        />
        <BmFieldText
          label="Viện kiểm sát ban hành"
          required
          value={form.agency.name}
          onChange={(v) => patch("agency", "name", v)}
        />
        <BmFieldText
          label="Số biên bản"
          required
          value={form.document.documentCode}
          onChange={(v) => patch("document", "documentCode", v)}
        />
        <BmFieldText
          label="Nơi lập"
          required
          value={form.document.issuePlace}
          onChange={(v) => patch("document", "issuePlace", v)}
        />
        <BmFieldDate
          label="Ngày lập"
          required
          value={form.document.issueDateIso}
          onChange={(v) => patch("document", "issueDateIso", v)}
        />
        <BmFieldText
          label="Dòng địa danh/ngày tự sinh"
          fullWidth
          value={buildIssuePlaceAndDateLine(form)}
          readOnly
          onChange={() => undefined}
        />
      </BmFormSection>

      <BmFormSection
        title="2. Nội dung xác minh"
        description="Thông tin vụ án, thời gian/địa điểm và kết quả xác minh."
        requiredCount={1}
      >
        <BmFieldText
          label="Tên vụ án"
          required
          value={form.verification.caseTitle}
          onChange={(v) => patch("verification", "caseTitle", v)}
        />
        <BmFieldText
          label="Tội danh"
          value={form.verification.offenseName}
          onChange={(v) => patch("verification", "offenseName", v)}
        />
        <BmFieldText
          label="Thời gian xác minh"
          fullWidth
          value={form.verification.verificationTime}
          onChange={(v) => patch("verification", "verificationTime", v)}
        />
        <BmFieldText
          label="Địa điểm xác minh"
          fullWidth
          value={form.verification.verificationLocation}
          onChange={(v) => patch("verification", "verificationLocation", v)}
        />
        <BmFieldTextarea
          label="Nội dung cần xác minh"
          fullWidth
          value={form.verification.subjectOfVerification}
          onChange={(v) => patch("verification", "subjectOfVerification", v)}
          rows={2}
        />
        <BmFieldTextarea
          label="Phương pháp xác minh"
          fullWidth
          value={form.verification.verificationMethod}
          onChange={(v) => patch("verification", "verificationMethod", v)}
          rows={2}
        />
        <BmFieldTextarea
          label="Kết quả xác minh"
          fullWidth
          value={form.verification.findings}
          onChange={(v) => patch("verification", "findings", v)}
          rows={4}
        />
        <BmFieldTextarea
          label="Dòng kết quả tự sinh"
          fullWidth
          value={buildFindingsLine(form)}
          readOnly
          rows={3}
          onChange={() => undefined}
        />
        <BmFieldTextarea
          label="Kết luận"
          fullWidth
          value={form.verification.conclusionLine}
          onChange={(v) => patch("verification", "conclusionLine", v)}
          rows={2}
        />
      </BmFormSection>

      <BmFormSection
        title="3. Người làm việc và ghi biên bản"
        requiredCount={1}
      >
        <BmFieldText
          label="Tên người làm việc"
          required
          value={form.participants.investigatorName}
          onChange={(v) => patch("participants", "investigatorName", v)}
        />
        <BmFieldText
          label="Chức vụ người làm việc"
          value={form.participants.investigatorPosition}
          onChange={(v) => patch("participants", "investigatorPosition", v)}
        />
        <BmFieldText
          label="Tên người ghi biên bản"
          value={form.participants.recordKeeperName}
          onChange={(v) => patch("participants", "recordKeeperName", v)}
        />
        <BmFieldText
          label="Chức vụ người ghi"
          value={form.participants.recordKeeperPosition}
          onChange={(v) => patch("participants", "recordKeeperPosition", v)}
        />
        <BmFieldText
          label="Tên người được làm việc"
          value={form.participants.personContactedName}
          onChange={(v) => patch("participants", "personContactedName", v)}
        />
        <BmFieldText
          label="Vai trò người được làm việc"
          value={form.participants.personContactedRole}
          onChange={(v) => patch("participants", "personContactedRole", v)}
        />
      </BmFormSection>

      <BmFormActions
        onPrimary={handleSave}
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-137"}
        primaryDisabled={saving || loading}
        onSecondary={reloadFromBackend}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
      />
    </div>
  );
}
