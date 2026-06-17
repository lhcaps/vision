"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

type AgencyForm = {
  parentName: string;
  name: string;
};

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

type Bm168FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const EMPTY_FORM: Bm168Form = {
  agency: {
    parentName: "",
    name: "",
  },
  caseFileHandover: {
    startedAtTime: "08:00",
    startedAtDateIso: "2026-05-27",
    endedAtTime: "08:30",
    endedAtDateIso: "2026-05-27",
    locationName: "Viện kiểm sát nhân dân khu vực 7",

    giverName: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
    giverPositionTitle: "Điều tra viên",
    receiverName: "",
    receiverPositionTitle: "Kiểm sát viên",

    caseFileTitle: "Vụ án đánh bạc tại phường Trung Mỹ Tây",
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

function parseVietnameseTimeToInput(value: string): string {
  const raw = cleanText(value);

  if (!raw) return "";

  const normalized = raw
    .replace(/\s+/g, " ")
    .replace(/\s*h\s*/iu, " giờ ")
    .trim();

  const inputTime = normalized.match(/^(\d{1,2}):(\d{1,2})$/);
  if (inputTime) {
    return `${pad2(Number(inputTime[1]))}:${pad2(Number(inputTime[2]))}`;
  }

  const compact = normalized.match(/^(\d{1,2})h(\d{1,2})$/iu);
  if (compact) {
    return `${pad2(Number(compact[1]))}:${pad2(Number(compact[2]))}`;
  }

  const vn = normalized.match(/(\d{1,2})\s*giờ\s*(\d{1,2})?\s*phút?/iu);
  if (vn) {
    return `${pad2(Number(vn[1]))}:${pad2(Number(vn[2] ?? 0))}`;
  }

  const hourOnly = normalized.match(/^(\d{1,2})$/);
  if (hourOnly) {
    return `${pad2(Number(hourOnly[1]))}:00`;
  }

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
  const data = form.caseFileHandover;

  return `Vào hồi ${toVietnameseTimeText(data.startedAtTime)}, ${toVietnameseDateText(
    data.startedAtDateIso,
  )} tại ${data.locationName.trim()}.`;
}

function buildEndedAtLine(form: Bm168Form): string {
  const data = form.caseFileHandover;

  return `Việc giao, nhận kết thúc hồi ${toVietnameseTimeText(
    data.endedAtTime,
  )}, ${toVietnameseDateText(data.endedAtDateIso)}.`;
}

function buildFileStatsLine(form: Bm168Form): string {
  const data = form.caseFileHandover;

  return `${data.fileVolumeText.trim()}, tổng số ${data.totalPageText.trim()} bút lục, đánh số từ ${data.fromPageText.trim()} đến ${data.toPageText.trim()}.`;
}

function buildEvidenceLine(form: Bm168Form): string {
  return form.caseFileHandover.evidenceDescription.trim();
}

function normalizeFormInputs(payload: RenderPayload | null): Bm168Form {
  const startedAtTimeText = nested(
    payload,
    "caseFileHandover.startedAtTimeText",
  );
  const startedAtDateText = nested(
    payload,
    "caseFileHandover.startedAtDateText",
  );
  const endedAtTimeText = nested(payload, "caseFileHandover.endedAtTimeText");
  const endedAtDateText = nested(payload, "caseFileHandover.endedAtDateText");

  const giverName =
    nested(payload, "caseFileHandover.giverName") ||
    EMPTY_FORM.caseFileHandover.giverName;

  const receiverName =
    nested(payload, "caseFileHandover.receiverName") ||
    EMPTY_FORM.caseFileHandover.receiverName;

  return {
    agency: {
      parentName:
        nested(payload, "agency.parentName") || EMPTY_FORM.agency.parentName,
      name: nested(payload, "agency.name") || EMPTY_FORM.agency.name,
    },
    caseFileHandover: {
      startedAtTime:
        parseVietnameseTimeToInput(startedAtTimeText) ||
        EMPTY_FORM.caseFileHandover.startedAtTime,
      startedAtDateIso:
        parseVietnameseDateToIso(startedAtDateText) ||
        EMPTY_FORM.caseFileHandover.startedAtDateIso,
      endedAtTime:
        parseVietnameseTimeToInput(endedAtTimeText) ||
        EMPTY_FORM.caseFileHandover.endedAtTime,
      endedAtDateIso:
        parseVietnameseDateToIso(endedAtDateText) ||
        EMPTY_FORM.caseFileHandover.endedAtDateIso,
      locationName:
        nested(payload, "caseFileHandover.locationName") ||
        EMPTY_FORM.caseFileHandover.locationName,

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
        nested(payload, "caseFileHandover.fileVolumeText") ||
        EMPTY_FORM.caseFileHandover.fileVolumeText,
      totalPageText:
        nested(payload, "caseFileHandover.totalPageText") ||
        EMPTY_FORM.caseFileHandover.totalPageText,
      fromPageText:
        nested(payload, "caseFileHandover.fromPageText") ||
        EMPTY_FORM.caseFileHandover.fromPageText,
      toPageText:
        nested(payload, "caseFileHandover.toPageText") ||
        EMPTY_FORM.caseFileHandover.toPageText,
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

function validateForm(form: Bm168Form): string[] {
  const data = form.caseFileHandover;

  const required = [
    ["Viện kiểm sát cấp trên", form.agency.parentName],
    ["Viện kiểm sát ban hành", form.agency.name],
    ["Giờ bắt đầu", data.startedAtTime],
    ["Ngày bắt đầu", data.startedAtDateIso],
    ["Địa điểm giao nhận", data.locationName],
    ["Bên giao", data.giverName],
    ["Chức danh bên giao", data.giverPositionTitle],
    ["Bên nhận", data.receiverName],
    ["Chức danh bên nhận", data.receiverPositionTitle],
    ["Hồ sơ bàn giao", data.caseFileTitle],
    ["Lý do bàn giao", data.handoverReasonLine],
    ["Số tập hồ sơ", data.fileVolumeText],
    ["Tổng số bút lục", data.totalPageText],
    ["Bút lục từ", data.fromPageText],
    ["Bút lục đến", data.toPageText],
    ["Giờ kết thúc", data.endedAtTime],
    ["Ngày kết thúc", data.endedAtDateIso],
    ["Người nhận ký", data.receiverSignerName],
    ["Người giao ký", data.giverSignerName],
  ];

  return required
    .filter(([, value]) => !String(value ?? "").trim())
    .map(([label]) => label);
}

function buildSaveBody(form: Bm168Form) {
  const data = form.caseFileHandover;

  const agency = {
    parentName: form.agency.parentName,
    name: form.agency.name,
  };

  const startedAtTimeText = toVietnameseTimeText(data.startedAtTime);
  const startedAtDateText = toVietnameseDateText(data.startedAtDateIso);
  const endedAtTimeText = toVietnameseTimeText(data.endedAtTime);
  const endedAtDateText = toVietnameseDateText(data.endedAtDateIso);

  const caseFileHandover = {
    startedAtTimeText,
    startedAtDateText,
    endedAtTimeText,
    endedAtDateText,
    locationName: data.locationName,

    giverName: data.giverName,
    giverPositionTitle: data.giverPositionTitle,
    receiverName: data.receiverName,
    receiverPositionTitle: data.receiverPositionTitle,

    caseFileTitle: data.caseFileTitle,
    handoverReasonLine: data.handoverReasonLine,

    fileVolumeText: data.fileVolumeText,
    totalPageText: data.totalPageText,
    fromPageText: data.fromPageText,
    toPageText: data.toPageText,
    evidenceDescription: data.evidenceDescription,

    startedAtLine: buildStartedAtLine(form),
    fileStatsLine: buildFileStatsLine(form),
    evidenceLine: buildEvidenceLine(form),
    endedAtLine: buildEndedAtLine(form),

    receiverSignerName: data.receiverSignerName || data.receiverName,
    giverSignerName: data.giverSignerName || data.giverName,
  };

  const savedInputs = {
    agency,
    caseFileHandover,
  };

  return {
    ...savedInputs,
    formInputs: savedInputs,
    payloadOverrides: savedInputs,
    renderPayloadOverrides: savedInputs,
    updatedByName:
      caseFileHandover.receiverSignerName || caseFileHandover.receiverName,
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
  type?: "text" | "date" | "time";
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

export function Bm168FormInputsPanel({
  documentId,
  onSaved,
}: Bm168FormInputsPanelProps) {
  const [form, setForm] = useState<Bm168Form>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validationErrors = useMemo(() => validateForm(form), [form]);

  const patchAgency = (key: keyof AgencyForm, value: string) => {
    setForm((current) => ({
      ...current,
      agency: {
        ...current.agency,
        [key]: value,
      },
    }));
  };

  const patchHandover = (key: keyof CaseFileHandoverForm, value: string) => {
    setForm((current) => ({
      ...current,
      caseFileHandover: {
        ...current.caseFileHandover,
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
      setMessage("Đã tải lại dữ liệu BM-168 từ backend.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  const handleFillSample = () => {
    setForm({
      agency: { ...EMPTY_FORM.agency },
      caseFileHandover: { ...EMPTY_FORM.caseFileHandover },
    });
    setError(null);
    setMessage("Đã điền dữ liệu mẫu BM-168.");
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

  return (
    <div className="space-y-5 rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
            BM-168
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">
            Dữ liệu Biên bản giao nhận hồ sơ vụ án, vụ việc
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Form gom dữ liệu chính thành các ô dễ đọc. Các dòng thời gian, hồ
            sơ, vật chứng và chữ ký được tự sinh để tránh nhập lặp trong mẫu.
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
          onChange={(value) => patchAgency("parentName", value)}
        />

        <Field
          label="Viện kiểm sát ban hành"
          required
          value={form.agency.name}
          onChange={(value) => patchAgency("name", value)}
        />
      </SectionCard>

      <SectionCard
        title="2. Thời gian và địa điểm giao nhận"
        description="Địa điểm trong thân biên bản nên viết thường đẹp, ví dụ: Viện kiểm sát nhân dân khu vực 7."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Giờ bắt đầu"
            required
            type="text"
            value={form.caseFileHandover.startedAtTime}
            onChange={(value) => patchHandover("startedAtTime", value)}
          />

          <Field
            label="Ngày bắt đầu"
            required
            type="date"
            value={form.caseFileHandover.startedAtDateIso}
            onChange={(value) => patchHandover("startedAtDateIso", value)}
          />
        </div>

        <Field
          label="Địa điểm giao nhận"
          required
          value={form.caseFileHandover.locationName}
          onChange={(value) => patchHandover("locationName", value)}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Giờ kết thúc"
            required
            type="text"
            value={form.caseFileHandover.endedAtTime}
            onChange={(value) => patchHandover("endedAtTime", value)}
          />

          <Field
            label="Ngày kết thúc"
            required
            type="date"
            value={form.caseFileHandover.endedAtDateIso}
            onChange={(value) => patchHandover("endedAtDateIso", value)}
          />
        </div>
      </SectionCard>

      <SectionCard title="3. Bên giao / bên nhận">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Bên giao"
            required
            value={form.caseFileHandover.giverName}
            onChange={(value) => patchHandover("giverName", value)}
          />

          <Field
            label="Chức danh bên giao"
            required
            value={form.caseFileHandover.giverPositionTitle}
            onChange={(value) => patchHandover("giverPositionTitle", value)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Bên nhận"
            required
            value={form.caseFileHandover.receiverName}
            onChange={(value) => patchHandover("receiverName", value)}
          />

          <Field
            label="Chức danh bên nhận"
            required
            value={form.caseFileHandover.receiverPositionTitle}
            onChange={(value) => patchHandover("receiverPositionTitle", value)}
          />
        </div>
      </SectionCard>

      <SectionCard title="4. Nội dung hồ sơ bàn giao">
        <Field
          label="Hồ sơ vụ việc/vụ án"
          required
          value={form.caseFileHandover.caseFileTitle}
          onChange={(value) => patchHandover("caseFileTitle", value)}
        />

        <Field
          label="Lý do bàn giao"
          required
          multiline
          value={form.caseFileHandover.handoverReasonLine}
          onChange={(value) => patchHandover("handoverReasonLine", value)}
        />

        <div className="grid gap-4 md:grid-cols-4">
          <Field
            label="Số tập"
            required
            value={form.caseFileHandover.fileVolumeText}
            onChange={(value) => patchHandover("fileVolumeText", value)}
          />

          <Field
            label="Tổng bút lục"
            required
            value={form.caseFileHandover.totalPageText}
            onChange={(value) => patchHandover("totalPageText", value)}
          />

          <Field
            label="Từ bút lục"
            required
            value={form.caseFileHandover.fromPageText}
            onChange={(value) => patchHandover("fromPageText", value)}
          />

          <Field
            label="Đến bút lục"
            required
            value={form.caseFileHandover.toPageText}
            onChange={(value) => patchHandover("toPageText", value)}
          />
        </div>

        <Field
          label="Vật chứng / bảng kê vật chứng"
          multiline
          value={form.caseFileHandover.evidenceDescription}
          onChange={(value) => patchHandover("evidenceDescription", value)}
        />
      </SectionCard>

      <SectionCard title="5. Chữ ký">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Người nhận ký"
            required
            value={form.caseFileHandover.receiverSignerName}
            onChange={(value) => patchHandover("receiverSignerName", value)}
          />

          <Field
            label="Người giao ký"
            required
            value={form.caseFileHandover.giverSignerName}
            onChange={(value) => patchHandover("giverSignerName", value)}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="6. Nội dung tự sinh"
        description="Các dòng này sẽ render vào DOCX. Không cần nhập tay trong template."
      >
        <Field
          label="Dòng bắt đầu tự sinh"
          multiline
          readOnly
          value={buildStartedAtLine(form)}
        />

        <Field
          label="Dòng hồ sơ gồm tự sinh"
          readOnly
          value={buildFileStatsLine(form)}
        />

        <Field
          label="Dòng vật chứng tự sinh"
          multiline
          readOnly
          value={buildEvidenceLine(form)}
        />

        <Field
          label="Dòng kết thúc tự sinh"
          multiline
          readOnly
          value={buildEndedAtLine(form)}
        />
      </SectionCard>
    </div>
  );
}
