"use client";

/**
 * BM-168 — Biên bản giao nhận hồ sơ vụ án, vụ việc
 * Stage: TRUY_TO, Group: G05. TT 03/2026-VKSTC, Mẫu số 168/HS.
 *
 * Căn cứ: Điều 41, 89 BLTTHS 2015; quy chế nghiệp vụ VKS.
 * Nghiệp vụ: Lập biên bản giao nhận hồ sơ giữa CQĐT và VKS.
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
} from "@/components/documents/bm-form";

type AgencyForm = { parentName: string; name: string };
type CaseFileHandoverForm = {
  startedAtTime: string;
  startedAtDateIso: string;
  endedAtTime: string;
  endedAtDateIso: string;
  locationName: string;
  giverName: string;
  giverPositionTitle: string;
  receiverName: string;
  receiverPositionTitle: string;
  caseFileTitle: string;
  handoverReasonLine: string;
  fileVolumeText: string;
  totalPageText: string;
  fromPageText: string;
  toPageText: string;
  evidenceDescription: string;
  receiverSignerName: string;
  giverSignerName: string;
};

type Bm168Form = {
  agency: AgencyForm;
  caseFileHandover: CaseFileHandoverForm;
};

type RenderPayload = Record<string, any>;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const EMPTY_FORM: Bm168Form = {
  agency: {
    parentName: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
    name: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  caseFileHandover: {
    startedAtTime: "08:00",
    startedAtDateIso: "",
    endedAtTime: "08:30",
    endedAtDateIso: "",
    locationName: "Viện kiểm sát nhân dân khu vực 7",
    giverName: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
    giverPositionTitle: "Điều tra viên",
    receiverName: "",
    receiverPositionTitle: "Kiểm sát viên",
    caseFileTitle: "Vụ án hình sự",
    handoverReasonLine:
      "Bàn giao hồ sơ vụ án để Viện kiểm sát kiểm sát việc giải quyết theo quy định của Bộ luật Tố tụng hình sự.",
    fileVolumeText: "01 tập",
    totalPageText: "120",
    fromPageText: "01",
    toPageText: "120",
    evidenceDescription: "Bản kê vật chứng kèm theo nếu có.",
    receiverSignerName: "",
    giverSignerName: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
  },
};

const REQUIRED_FIELDS: ReadonlyArray<[string, string]> = [
  ["Viện kiểm sát cấp trên", "agency.parentName"],
  ["Viện kiểm sát ban hành", "agency.name"],
  ["Giờ bắt đầu", "caseFileHandover.startedAtTime"],
  ["Ngày bắt đầu", "caseFileHandover.startedAtDateIso"],
  ["Địa điểm giao nhận", "caseFileHandover.locationName"],
  ["Bên giao", "caseFileHandover.giverName"],
  ["Chức danh bên giao", "caseFileHandover.giverPositionTitle"],
  ["Bên nhận", "caseFileHandover.receiverName"],
  ["Chức danh bên nhận", "caseFileHandover.receiverPositionTitle"],
  ["Hồ sơ bàn giao", "caseFileHandover.caseFileTitle"],
  ["Lý do bàn giao", "caseFileHandover.handoverReasonLine"],
  ["Số tập hồ sơ", "caseFileHandover.fileVolumeText"],
  ["Tổng số bút lục", "caseFileHandover.totalPageText"],
  ["Bút lục từ", "caseFileHandover.fromPageText"],
  ["Bút lục đến", "caseFileHandover.toPageText"],
  ["Giờ kết thúc", "caseFileHandover.endedAtTime"],
  ["Ngày kết thúc", "caseFileHandover.endedAtDateIso"],
  ["Người nhận ký", "caseFileHandover.receiverSignerName"],
  ["Người giao ký", "caseFileHandover.giverSignerName"],
];

function cleanText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
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

function parseVietnameseDateToIso(value: string): string {
  const raw = cleanText(value);
  if (!raw) return "";
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return raw;
  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) return `${slash[3]}-${pad2(Number(slash[2]))}-${pad2(Number(slash[1]))}`;
  const vn = raw.match(/ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/iu);
  if (vn) return `${vn[3]}-${pad2(Number(vn[2]))}-${pad2(Number(vn[1]))}`;
  return "";
}

function parseVietnameseTimeToInput(value: string): string {
  const raw = cleanText(value);
  if (!raw) return "";
  const normalized = raw.replace(/\s+/g, " ").replace(/\s*h\s*/iu, " giờ ").trim();
  const inputTime = normalized.match(/^(\d{1,2}):(\d{1,2})$/);
  if (inputTime) return `${pad2(Number(inputTime[1]))}:${pad2(Number(inputTime[2]))}`;
  const compact = normalized.match(/^(\d{1,2})h(\d{1,2})$/iu);
  if (compact) return `${pad2(Number(compact[1]))}:${pad2(Number(compact[2]))}`;
  const vn = normalized.match(/(\d{1,2})\s*giờ\s*(\d{1,2})?\s*phút?/iu);
  if (vn) return `${pad2(Number(vn[1]))}:${pad2(Number(vn[2] ?? 0))}`;
  const hourOnly = normalized.match(/^(\d{1,2})$/);
  if (hourOnly) return `${pad2(Number(hourOnly[1]))}:00`;
  return raw;
}

function toVietnameseDateText(isoDate: string): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return isoDate || "";
  return `ngày ${Number(match[3])} tháng ${Number(match[2])} năm ${match[1]}`;
}

function toVietnameseTimeText(time: string): string {
  const normalized = parseVietnameseTimeToInput(time);
  const match = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return cleanText(time);
  return `${Number(match[1])} giờ ${match[2]} phút`;
}

function buildStartedAtLine(form: Bm168Form): string {
  const d = form.caseFileHandover;
  return `Vào hồi ${toVietnameseTimeText(d.startedAtTime)}, ${toVietnameseDateText(d.startedAtDateIso)} tại ${d.locationName.trim()}.`;
}

function buildEndedAtLine(form: Bm168Form): string {
  const d = form.caseFileHandover;
  return `Việc giao, nhận kết thúc hồi ${toVietnameseTimeText(d.endedAtTime)}, ${toVietnameseDateText(d.endedAtDateIso)}.`;
}

function buildFileStatsLine(form: Bm168Form): string {
  const d = form.caseFileHandover;
  return `${d.fileVolumeText.trim()}, tổng số ${d.totalPageText.trim()} bút lục, đánh số từ ${d.fromPageText.trim()} đến ${d.toPageText.trim()}.`;
}

function buildEvidenceLine(form: Bm168Form): string {
  return form.caseFileHandover.evidenceDescription.trim();
}

function normalizeFormInputs(payload: RenderPayload | null): Bm168Form {
  const startedAtTimeText = nested(payload, "caseFileHandover.startedAtTimeText");
  const startedAtDateText = nested(payload, "caseFileHandover.startedAtDateText");
  const endedAtTimeText = nested(payload, "caseFileHandover.endedAtTimeText");
  const endedAtDateText = nested(payload, "caseFileHandover.endedAtDateText");

  const giverName =
    nested(payload, "caseFileHandover.giverName") || EMPTY_FORM.caseFileHandover.giverName;
  const receiverName =
    nested(payload, "caseFileHandover.receiverName") || EMPTY_FORM.caseFileHandover.receiverName;

  return {
    agency: {
      parentName: nested(payload, "agency.parentName") || EMPTY_FORM.agency.parentName,
      name: nested(payload, "agency.name") || EMPTY_FORM.agency.name,
    },
    caseFileHandover: {
      startedAtTime:
        parseVietnameseTimeToInput(startedAtTimeText) || EMPTY_FORM.caseFileHandover.startedAtTime,
      startedAtDateIso:
        parseVietnameseDateToIso(startedAtDateText) || EMPTY_FORM.caseFileHandover.startedAtDateIso,
      endedAtTime:
        parseVietnameseTimeToInput(endedAtTimeText) || EMPTY_FORM.caseFileHandover.endedAtTime,
      endedAtDateIso:
        parseVietnameseDateToIso(endedAtDateText) || EMPTY_FORM.caseFileHandover.endedAtDateIso,
      locationName:
        nested(payload, "caseFileHandover.locationName") || EMPTY_FORM.caseFileHandover.locationName,
      giverName,
      giverPositionTitle:
        nested(payload, "caseFileHandover.giverPositionTitle") ||
        EMPTY_FORM.caseFileHandover.giverPositionTitle,
      receiverName,
      receiverPositionTitle:
        nested(payload, "caseFileHandover.receiverPositionTitle") ||
        EMPTY_FORM.caseFileHandover.receiverPositionTitle,
      caseFileTitle:
        nested(payload, "caseFileHandover.caseFileTitle") ||
        nested(payload, "case.caseTitle") ||
        EMPTY_FORM.caseFileHandover.caseFileTitle,
      handoverReasonLine:
        nested(payload, "caseFileHandover.handoverReasonLine") ||
        EMPTY_FORM.caseFileHandover.handoverReasonLine,
      fileVolumeText:
        nested(payload, "caseFileHandover.fileVolumeText") || EMPTY_FORM.caseFileHandover.fileVolumeText,
      totalPageText:
        nested(payload, "caseFileHandover.totalPageText") || EMPTY_FORM.caseFileHandover.totalPageText,
      fromPageText:
        nested(payload, "caseFileHandover.fromPageText") || EMPTY_FORM.caseFileHandover.fromPageText,
      toPageText:
        nested(payload, "caseFileHandover.toPageText") || EMPTY_FORM.caseFileHandover.toPageText,
      evidenceDescription:
        nested(payload, "caseFileHandover.evidenceDescription") ||
        nested(payload, "caseFileHandover.evidenceLine") ||
        EMPTY_FORM.caseFileHandover.evidenceDescription,
      receiverSignerName:
        nested(payload, "caseFileHandover.receiverSignerName") || receiverName,
      giverSignerName:
        nested(payload, "caseFileHandover.giverSignerName") || giverName,
    },
  };
}

function lookupValue(form: Bm168Form, path: string): string {
  const parts = path.split(".").filter(Boolean);
  let current: any = form;
  for (const p of parts) {
    if (!current || typeof current !== "object") return "";
    current = current[p];
  }
  return cleanText(current);
}

function validateForm(form: Bm168Form): string[] {
  return REQUIRED_FIELDS.filter(([, p]) => !lookupValue(form, p)).map(([l]) => l);
}

function buildSaveBody(form: Bm168Form) {
  const d = form.caseFileHandover;
  const agency = {
    parentName: form.agency.parentName,
    name: form.agency.name,
  };
  const startedAtTimeText = toVietnameseTimeText(d.startedAtTime);
  const startedAtDateText = toVietnameseDateText(d.startedAtDateIso);
  const endedAtTimeText = toVietnameseTimeText(d.endedAtTime);
  const endedAtDateText = toVietnameseDateText(d.endedAtDateIso);

  const caseFileHandover = {
    startedAtTimeText,
    startedAtDateText,
    endedAtTimeText,
    endedAtDateText,
    locationName: d.locationName,
    giverName: d.giverName,
    giverPositionTitle: d.giverPositionTitle,
    receiverName: d.receiverName,
    receiverPositionTitle: d.receiverPositionTitle,
    caseFileTitle: d.caseFileTitle,
    handoverReasonLine: d.handoverReasonLine,
    fileVolumeText: d.fileVolumeText,
    totalPageText: d.totalPageText,
    fromPageText: d.fromPageText,
    toPageText: d.toPageText,
    evidenceDescription: d.evidenceDescription,
    startedAtLine: buildStartedAtLine(form),
    fileStatsLine: buildFileStatsLine(form),
    evidenceLine: buildEvidenceLine(form),
    endedAtLine: buildEndedAtLine(form),
    receiverSignerName: d.receiverSignerName || d.receiverName,
    giverSignerName: d.giverSignerName || d.giverName,
  };

  const savedInputs = { agency, caseFileHandover };

  return {
    ...savedInputs,
    formInputs: savedInputs,
    payloadOverrides: savedInputs,
    renderPayloadOverrides: savedInputs,
    updatedByName: caseFileHandover.receiverSignerName || caseFileHandover.receiverName,
  };
}

export function Bm168FormInputsPanel({
  documentId,
  onSaved,
}: {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
}) {
  const [form, setForm] = useState<Bm168Form>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const patch = <S extends keyof Bm168Form, K extends keyof Bm168Form[S]>(
    section: S,
    key: K,
    value: Bm168Form[S][K],
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
        { method: "GET", cache: "no-store" },
      );
      if (!res.ok) {
        const bodyText = await res.text();
        throw new Error(bodyText || `Không tải được render-payload. HTTP ${res.status}`);
      }
      setForm(normalizeFormInputs((await res.json()) as RenderPayload));
      setMessage("Đã tải lại dữ liệu BM-168 từ backend.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const errs = validateForm(form);
    if (errs.length > 0) {
      setValidationErrors(errs);
      setError(`Thiếu dữ liệu bắt buộc: ${errs.join(", ")}`);
      setMessage(null);
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
      if (!res.ok) {
        const bodyText = await res.text();
        throw new Error(bodyText || `Không lưu được dữ liệu biểu mẫu. HTTP ${res.status}`);
      }
      await reloadFromBackend();
      setMessage("Đã lưu dữ liệu BM-168. Các dòng tự sinh đã đồng bộ.");
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

  const status = (() => {
    if (loading) return { kind: "loading" as const, text: "Đang tải..." };
    if (saving) return { kind: "loading" as const, text: "Đang lưu..." };
    if (validationErrors.length > 0)
      return { kind: "warning" as const, text: `Còn thiếu: ${validationErrors.join(", ")}` };
    if (error) return { kind: "error" as const, text: error };
    if (message) return { kind: "success" as const, text: message };
    return { kind: "idle" as const, text: "" };
  })();

  return (
    <div className="space-y-5">
      <BmFormMetaBar
        templateCode="BM-168"
        title="Dữ liệu Biên bản giao nhận hồ sơ vụ án, vụ việc"
        subtitle="Biểu mẫu TT 03/2026-VKSTC · Mẫu số 168/HS · Căn cứ Điều 41, 89 BLTTHS 2015."
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
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-168"}
        onPrimary={handleSave}
        primaryDisabled={saving || loading}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
        onSecondary={reloadFromBackend}
      />

      {status.kind === "idle" ? null : (
        <BmFormStatus kind={status.kind}>{status.text}</BmFormStatus>
      )}

      <BmFormSection title="1. Header biểu mẫu" requiredCount={2}>
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
      </BmFormSection>

      <BmFormSection
        title="2. Thời gian và địa điểm giao nhận"
        description="Địa điểm trong thân biên bản nên viết thường đẹp, ví dụ: Viện kiểm sát nhân dân khu vực 7."
        requiredCount={5}
      >
        <BmFieldText
          label="Giờ bắt đầu"
          required
          value={form.caseFileHandover.startedAtTime}
          onChange={(v) => patch("caseFileHandover", "startedAtTime", v)}
        />
        <BmFieldDate
          label="Ngày bắt đầu"
          required
          value={form.caseFileHandover.startedAtDateIso}
          onChange={(v) => patch("caseFileHandover", "startedAtDateIso", v)}
        />
        <BmFieldText
          label="Địa điểm giao nhận"
          required
          fullWidth
          value={form.caseFileHandover.locationName}
          onChange={(v) => patch("caseFileHandover", "locationName", v)}
        />
        <BmFieldText
          label="Giờ kết thúc"
          required
          value={form.caseFileHandover.endedAtTime}
          onChange={(v) => patch("caseFileHandover", "endedAtTime", v)}
        />
        <BmFieldDate
          label="Ngày kết thúc"
          required
          value={form.caseFileHandover.endedAtDateIso}
          onChange={(v) => patch("caseFileHandover", "endedAtDateIso", v)}
        />
      </BmFormSection>

      <BmFormSection title="3. Bên giao / bên nhận" requiredCount={4}>
        <BmFieldText
          label="Bên giao"
          required
          value={form.caseFileHandover.giverName}
          onChange={(v) => patch("caseFileHandover", "giverName", v)}
        />
        <BmFieldText
          label="Chức danh bên giao"
          required
          value={form.caseFileHandover.giverPositionTitle}
          onChange={(v) => patch("caseFileHandover", "giverPositionTitle", v)}
        />
        <BmFieldText
          label="Bên nhận"
          required
          value={form.caseFileHandover.receiverName}
          onChange={(v) => patch("caseFileHandover", "receiverName", v)}
        />
        <BmFieldText
          label="Chức danh bên nhận"
          required
          value={form.caseFileHandover.receiverPositionTitle}
          onChange={(v) => patch("caseFileHandover", "receiverPositionTitle", v)}
        />
      </BmFormSection>

      <BmFormSection title="4. Nội dung hồ sơ bàn giao" requiredCount={7}>
        <BmFieldText
          label="Hồ sơ vụ việc/vụ án"
          required
          fullWidth
          value={form.caseFileHandover.caseFileTitle}
          onChange={(v) => patch("caseFileHandover", "caseFileTitle", v)}
        />
        <BmFieldTextarea
          label="Lý do bàn giao"
          required
          fullWidth
          value={form.caseFileHandover.handoverReasonLine}
          onChange={(v) => patch("caseFileHandover", "handoverReasonLine", v)}
          rows={2}
        />
        <BmFieldText
          label="Số tập"
          required
          value={form.caseFileHandover.fileVolumeText}
          onChange={(v) => patch("caseFileHandover", "fileVolumeText", v)}
        />
        <BmFieldText
          label="Tổng bút lục"
          required
          value={form.caseFileHandover.totalPageText}
          onChange={(v) => patch("caseFileHandover", "totalPageText", v)}
        />
        <BmFieldText
          label="Từ bút lục"
          required
          value={form.caseFileHandover.fromPageText}
          onChange={(v) => patch("caseFileHandover", "fromPageText", v)}
        />
        <BmFieldText
          label="Đến bút lục"
          required
          value={form.caseFileHandover.toPageText}
          onChange={(v) => patch("caseFileHandover", "toPageText", v)}
        />
        <BmFieldTextarea
          label="Vật chứng / bảng kê vật chứng"
          fullWidth
          value={form.caseFileHandover.evidenceDescription}
          onChange={(v) => patch("caseFileHandover", "evidenceDescription", v)}
          rows={2}
        />
      </BmFormSection>

      <BmFormSection title="5. Chữ ký" requiredCount={2}>
        <BmFieldText
          label="Người nhận ký"
          required
          value={form.caseFileHandover.receiverSignerName}
          onChange={(v) => patch("caseFileHandover", "receiverSignerName", v)}
        />
        <BmFieldText
          label="Người giao ký"
          required
          value={form.caseFileHandover.giverSignerName}
          onChange={(v) => patch("caseFileHandover", "giverSignerName", v)}
        />
      </BmFormSection>

      <BmFormSection
        title="6. Nội dung tự sinh"
        description="Các dòng này sẽ render vào DOCX. Không cần nhập tay trong template."
      >
        <BmFieldTextarea
          label="Dòng bắt đầu tự sinh"
          fullWidth
          readOnly
          value={buildStartedAtLine(form)}
          rows={2}
          onChange={() => undefined}
        />
        <BmFieldText
          label="Dòng hồ sơ gồm tự sinh"
          fullWidth
          readOnly
          value={buildFileStatsLine(form)}
          onChange={() => undefined}
        />
        <BmFieldTextarea
          label="Dòng vật chứng tự sinh"
          fullWidth
          readOnly
          value={buildEvidenceLine(form)}
          rows={2}
          onChange={() => undefined}
        />
        <BmFieldTextarea
          label="Dòng kết thúc tự sinh"
          fullWidth
          readOnly
          value={buildEndedAtLine(form)}
          rows={2}
          onChange={() => undefined}
        />
      </BmFormSection>

      <BmFormActions
        onPrimary={handleSave}
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-168"}
        primaryDisabled={saving || loading}
        onSecondary={reloadFromBackend}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
      />
    </div>
  );
}
