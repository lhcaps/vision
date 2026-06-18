"use client";

/**
 * BM-157 — Bản kê vật chứng kèm theo Cáo trạng
 * Stage: XET_XU, Group: G99. TT 03/2026-VKSTC, Mẫu số 157/HS.
 *
 * Căn cứ: Điều 41, 252 BLTTHS 2015.
 * Nghiệp vụ: VKS lập bản kê vật chứng kèm theo Cáo trạng gửi Tòa án.
 */

import { useEffect, useState } from "react";

import {
  BmFieldDate,
  BmFieldText,
  BmFieldTextarea,
  BmFormActions,
  BmFormMetaBar,
  BmFormSection,
  BmFormStatus,
} from "@/components/documents/bm-form";

type AgencyForm = { parentName: string; name: string; issuePlace: string };
type DocumentForm = { documentCode: string; issueDate: string };
type OfficialForm = { issuerTitle: string };
type LegalBasisForm = { procedureArticlesLine: string };
type IndictmentForm = {
  indictmentCode: string;
  indictmentDate: string;
  caseName: string;
  offenseName: string;
  legalArticle: string;
};
type ContentForm = { article1Line: string };
type EvidenceItem = {
  stt: string;
  tenVatChung: string;
  donViTinh: string;
  soLuong: string;
  dacDiem: string;
  tinhTrang: string;
  ghiChu: string;
};
type EvidenceForm = { items: EvidenceItem[] };
type RecipientsForm = { line1: string; line2: string; archiveLine: string };
type SignatureForm = { signMode: string; positionTitle: string; signerName: string };

type Bm157Form = {
  agency: AgencyForm;
  document: DocumentForm;
  official: OfficialForm;
  legalBasis: LegalBasisForm;
  indictment: IndictmentForm;
  content: ContentForm;
  evidence: EvidenceForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
};

type RenderPayload = Record<string, unknown>;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const EMPTY_EVIDENCE: EvidenceItem = {
  stt: "1",
  tenVatChung: "",
  donViTinh: "Chiếc",
  soLuong: "1",
  dacDiem: "",
  tinhTrang: "Tốt",
  ghiChu: "",
};

const EMPTY_FORM: Bm157Form = {
  agency: {
    parentName: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
    name: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
    issuePlace: "TP. Hồ Chí Minh",
  },
  document: { documentCode: "BKVC-CT-VKSKV7", issueDate: "" },
  official: { issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7" },
  legalBasis: { procedureArticlesLine: "Căn cứ Điều 41 và Điều 252 của Bộ luật Tố tụng hình sự;" },
  indictment: {
    indictmentCode: "",
    indictmentDate: "",
    caseName: "",
    offenseName: "",
    legalArticle: "",
  },
  content: { article1Line: "" },
  evidence: { items: [EMPTY_EVIDENCE] },
  recipients: {
    line1: "Tòa án có thẩm quyền xét xử",
    line2: "",
    archiveLine: "- Lưu: HSVA, HSKS, VP.",
  },
  signature: {
    signMode: "KT. VIỆN TRƯỞNG",
    positionTitle: "PHÓ VIỆN TRƯỞNG",
    signerName: "",
  },
};

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

function parseItems(raw: string): EvidenceItem[] {
  if (Array.isArray(raw)) return raw as EvidenceItem[];
  if (typeof raw === "string" && raw.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as EvidenceItem[];
    } catch {
      /* ignore */
    }
  }
  return EMPTY_FORM.evidence.items;
}

function normalizeForm(payload: RenderPayload | null): Bm157Form {
  if (!payload) return EMPTY_FORM;
  const items = parseItems(nested(payload, "evidence.items"));
  return {
    agency: {
      parentName: nested(payload, "agency.parentName") || EMPTY_FORM.agency.parentName,
      name: nested(payload, "agency.name") || EMPTY_FORM.agency.name,
      issuePlace: nested(payload, "agency.issuePlace") || EMPTY_FORM.agency.issuePlace,
    },
    document: {
      documentCode: nested(payload, "document.documentCode") || EMPTY_FORM.document.documentCode,
      issueDate: nested(payload, "document.issueDate") || EMPTY_FORM.document.issueDate,
    },
    official: {
      issuerTitle: nested(payload, "official.issuerTitle") || EMPTY_FORM.official.issuerTitle,
    },
    legalBasis: {
      procedureArticlesLine:
        nested(payload, "legalBasis.procedureArticlesLine") ||
        EMPTY_FORM.legalBasis.procedureArticlesLine,
    },
    indictment: {
      indictmentCode: nested(payload, "indictment.indictmentCode") || "",
      indictmentDate: nested(payload, "indictment.indictmentDate") || "",
      caseName: nested(payload, "indictment.caseName") || "",
      offenseName: nested(payload, "indictment.offenseName") || "",
      legalArticle: nested(payload, "indictment.legalArticle") || "",
    },
    content: {
      article1Line: nested(payload, "content.article1Line") || "",
    },
    evidence: { items },
    recipients: {
      line1: nested(payload, "recipients.line1") || EMPTY_FORM.recipients.line1,
      line2: nested(payload, "recipients.line2") || "",
      archiveLine: nested(payload, "recipients.archiveLine") || EMPTY_FORM.recipients.archiveLine,
    },
    signature: {
      signMode: nested(payload, "signature.signMode") || EMPTY_FORM.signature.signMode,
      positionTitle:
        nested(payload, "signature.positionTitle") || EMPTY_FORM.signature.positionTitle,
      signerName: nested(payload, "signature.signerName") || "",
    },
  };
}

function buildSaveBody(form: Bm157Form) {
  return {
    agency: form.agency,
    document: form.document,
    official: form.official,
    legalBasis: form.legalBasis,
    indictment: form.indictment,
    content: form.content,
    evidence: { items: form.evidence.items },
    recipients: form.recipients,
    signature: form.signature,
  };
}

export function Bm157FormInputsPanel({
  documentId,
  onSaved,
}: {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
}) {
  const [form, setForm] = useState<Bm157Form>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const patch = <S extends keyof Bm157Form, K extends keyof Bm157Form[S]>(
    section: S,
    key: K,
    value: Bm157Form[S][K],
  ) => {
    setForm((prev) => ({
      ...prev,
      [section]: { ...(prev[section] as Record<string, unknown>), [key]: value },
    }));
  };

  const patchEvidence = (idx: number, key: keyof EvidenceItem, value: string) => {
    setForm((prev) => ({
      ...prev,
      evidence: {
        items: prev.evidence.items.map((item, i) =>
          i === idx ? { ...item, [key]: value } : item,
        ),
      },
    }));
  };

  const addEvidence = () => {
    setForm((prev) => ({
      ...prev,
      evidence: {
        items: [
          ...prev.evidence.items,
          { ...EMPTY_EVIDENCE, stt: String(prev.evidence.items.length + 1) },
        ],
      },
    }));
  };

  const removeEvidence = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      evidence: {
        items: prev.evidence.items
          .filter((_, i) => i !== idx)
          .map((item, i) => ({ ...item, stt: String(i + 1) })),
      },
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
      if (res.ok) setForm(normalizeForm((await res.json()) as RenderPayload));
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
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
      setMessage("Đã lưu thành công.");
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
    if (error) return { kind: "error" as const, text: error };
    if (message) return { kind: "success" as const, text: message };
    return { kind: "idle" as const, text: "" };
  })();

  return (
    <div className="space-y-5">
      <BmFormMetaBar
        templateCode="BM-157"
        title="Dữ liệu biểu mẫu Bản kê vật chứng kèm theo Cáo trạng"
        subtitle="Biểu mẫu TT 03/2026-VKSTC · Mẫu số 157/HS · Stage XET_XU. Căn cứ Điều 41, 252 BLTTHS 2015."
        isDirty={false}
        isLoading={loading}
        isSaving={saving}
        savedAt={null}
        errorMessage={error ?? undefined}
        successMessage={status.kind === "success" ? status.text : undefined}
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-157"}
        onPrimary={handleSave}
        primaryDisabled={saving || loading}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
        onSecondary={reloadFromBackend}
      />

      {status.kind === "idle" ? null : (
        <BmFormStatus kind={status.kind}>
          {status.text}
        </BmFormStatus>
      )}

      <BmFormSection title="1. Header biểu mẫu">
        <BmFieldText
          label="Viện kiểm sát cấp trên"
          value={form.agency.parentName}
          onChange={(v) => patch("agency", "parentName", v)}
        />
        <BmFieldText
          label="Viện kiểm sát ban hành"
          value={form.agency.name}
          onChange={(v) => patch("agency", "name", v)}
        />
        <BmFieldText
          label="Số bản kê"
          value={form.document.documentCode}
          onChange={(v) => patch("document", "documentCode", v)}
        />
        <BmFieldText
          label="Địa danh"
          value={form.agency.issuePlace}
          onChange={(v) => patch("agency", "issuePlace", v)}
        />
        <BmFieldDate
          label="Ngày lập"
          value={form.document.issueDate}
          onChange={(v) => patch("document", "issueDate", v)}
        />
        <BmFieldText
          label="Chủ thể ban hành"
          fullWidth
          value={form.official.issuerTitle}
          onChange={(v) => patch("official", "issuerTitle", v)}
        />
      </BmFormSection>

      <BmFormSection title="2. Thông tin Cáo trạng">
        <BmFieldText
          label="Số cáo trạng"
          value={form.indictment.indictmentCode}
          onChange={(v) => patch("indictment", "indictmentCode", v)}
        />
        <BmFieldDate
          label="Ngày cáo trạng"
          value={form.indictment.indictmentDate}
          onChange={(v) => patch("indictment", "indictmentDate", v)}
        />
        <BmFieldText
          label="Tên vụ án"
          fullWidth
          value={form.indictment.caseName}
          onChange={(v) => patch("indictment", "caseName", v)}
        />
        <BmFieldText
          label="Tội danh"
          value={form.indictment.offenseName}
          onChange={(v) => patch("indictment", "offenseName", v)}
        />
        <BmFieldText
          label="Điều luật"
          value={form.indictment.legalArticle}
          onChange={(v) => patch("indictment", "legalArticle", v)}
        />
      </BmFormSection>

      <BmFormSection title="3. Danh sách vật chứng">
        <div className="md:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100">
                  <th className="rounded-tl-lg px-2 py-1 text-left font-semibold text-slate-700">
                    STT
                  </th>
                  <th className="px-2 py-1 text-left font-semibold text-slate-700">Tên vật chứng</th>
                  <th className="px-2 py-1 text-left font-semibold text-slate-700">Đơn vị</th>
                  <th className="px-2 py-1 text-left font-semibold text-slate-700">Số lượng</th>
                  <th className="px-2 py-1 text-left font-semibold text-slate-700">Đặc điểm</th>
                  <th className="px-2 py-1 text-left font-semibold text-slate-700">Tình trạng</th>
                  <th className="px-2 py-1 text-left font-semibold text-slate-700">Ghi chú</th>
                  <th className="rounded-tr-lg px-2 py-1"></th>
                </tr>
              </thead>
              <tbody>
                {form.evidence.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-200">
                    <td className="px-2 py-1">
                      <input
                        className="w-12 rounded border border-slate-300 px-2 py-1 text-sm"
                        value={item.stt}
                        readOnly
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                        value={item.tenVatChung}
                        onChange={(e) => patchEvidence(idx, "tenVatChung", e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        className="w-20 rounded border border-slate-300 px-2 py-1 text-sm"
                        value={item.donViTinh}
                        onChange={(e) => patchEvidence(idx, "donViTinh", e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        className="w-16 rounded border border-slate-300 px-2 py-1 text-sm"
                        value={item.soLuong}
                        onChange={(e) => patchEvidence(idx, "soLuong", e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        className="w-32 rounded border border-slate-300 px-2 py-1 text-sm"
                        value={item.dacDiem}
                        onChange={(e) => patchEvidence(idx, "dacDiem", e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        className="w-24 rounded border border-slate-300 px-2 py-1 text-sm"
                        value={item.tinhTrang}
                        onChange={(e) => patchEvidence(idx, "tinhTrang", e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        className="w-24 rounded border border-slate-300 px-2 py-1 text-sm"
                        value={item.ghiChu}
                        onChange={(e) => patchEvidence(idx, "ghiChu", e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <button
                        type="button"
                        className="rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-200"
                        onClick={() => removeEvidence(idx)}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            className="mt-2 rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-100"
            onClick={addEvidence}
          >
            + Thêm vật chứng
          </button>
        </div>
      </BmFormSection>

      <BmFormSection title="4. Nội dung bản kê">
        <BmFieldTextarea
          label="Điều khoản"
          fullWidth
          value={form.content.article1Line}
          onChange={(v) => patch("content", "article1Line", v)}
          rows={2}
        />
      </BmFormSection>

      <BmFormSection title="5. Nơi nhận">
        <BmFieldText
          label="Nơi nhận 1"
          value={form.recipients.line1}
          onChange={(v) => patch("recipients", "line1", v)}
        />
        <BmFieldText
          label="Nơi nhận 2"
          value={form.recipients.line2}
          onChange={(v) => patch("recipients", "line2", v)}
        />
        <BmFieldText
          label="Lưu hồ sơ"
          fullWidth
          value={form.recipients.archiveLine}
          onChange={(v) => patch("recipients", "archiveLine", v)}
        />
      </BmFormSection>

      <BmFormSection title="6. Chữ ký">
        <BmFieldText
          label="Chế độ ký"
          value={form.signature.signMode}
          onChange={(v) => patch("signature", "signMode", v)}
        />
        <BmFieldText
          label="Chức vụ ký"
          value={form.signature.positionTitle}
          onChange={(v) => patch("signature", "positionTitle", v)}
        />
        <BmFieldText
          label="Người ký"
          value={form.signature.signerName}
          onChange={(v) => patch("signature", "signerName", v)}
        />
      </BmFormSection>

      <BmFormActions
        onPrimary={handleSave}
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-157"}
        primaryDisabled={saving || loading}
        onSecondary={reloadFromBackend}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
      />
    </div>
  );
}
