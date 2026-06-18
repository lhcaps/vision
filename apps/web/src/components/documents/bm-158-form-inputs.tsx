"use client";

/**
 * BM-158 — Danh sách đề nghị triệu tập đến phiên tòa
 * Stage: XET_XU, Group: G99. TT 03/2026-VKSTC, Mẫu số 158/HS.
 *
 * Căn cứ: Điều 41, 252 BLTTHS 2015.
 * Nghiệp vụ: VKS lập danh sách đề nghị Tòa án triệu tập những người tham gia phiên tòa.
 */

import { useEffect, useState } from "react";

import {
  BmFieldDate,
  BmFieldText,
  BmFormActions,
  BmFormMetaBar,
  BmFormSection,
  BmFormStatus,
} from "@/components/documents/bm-form";

type AgencyForm = { parentName: string; name: string; issuePlace: string };
type DocumentForm = { documentCode: string; issueDate: string };
type OfficialForm = { issuerTitle: string };
type LegalBasisForm = { procedureArticlesLine: string };
type ContentForm = {
  courtName: string;
  indictmentCode: string;
  caseName: string;
  offenseName: string;
  legalArticle: string;
  trialDate: string;
  trialTime: string;
  trialLocation: string;
};
type SummonItem = {
  stt: string;
  hoTen: string;
  cmnd: string;
  diaChi: string;
  vaiTro: string;
  ghiChu: string;
};
type SummonsForm = { items: SummonItem[] };
type RecipientsForm = { line1: string; archiveLine: string };
type SignatureForm = { signMode: string; positionTitle: string; signerName: string };

type Bm158Form = {
  agency: AgencyForm;
  document: DocumentForm;
  official: OfficialForm;
  legalBasis: LegalBasisForm;
  content: ContentForm;
  summons: SummonsForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
};

type RenderPayload = Record<string, unknown>;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const EMPTY_SUMMON: SummonItem = {
  stt: "1",
  hoTen: "",
  cmnd: "",
  diaChi: "",
  vaiTro: "Bị cáo",
  ghiChu: "",
};

const EMPTY_FORM: Bm158Form = {
  agency: {
    parentName: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
    name: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
    issuePlace: "TP. Hồ Chí Minh",
  },
  document: { documentCode: "DS-TT-VKSKV7", issueDate: "" },
  official: { issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7" },
  legalBasis: { procedureArticlesLine: "Căn cứ Điều 41 và Điều 252 của Bộ luật Tố tụng hình sự;" },
  content: {
    courtName: "",
    indictmentCode: "",
    caseName: "",
    offenseName: "",
    legalArticle: "",
    trialDate: "",
    trialTime: "08:00",
    trialLocation: "",
  },
  summons: { items: [EMPTY_SUMMON] },
  recipients: { line1: "Tòa án có thẩm quyền xét xử", archiveLine: "- Lưu: HSVA, HSKS, VP." },
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

function parseItems(raw: string): SummonItem[] {
  if (Array.isArray(raw)) return raw as SummonItem[];
  if (typeof raw === "string" && raw.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as SummonItem[];
    } catch {
      /* ignore */
    }
  }
  return EMPTY_FORM.summons.items;
}

function normalizeForm(payload: RenderPayload | null): Bm158Form {
  if (!payload) return EMPTY_FORM;
  const items = parseItems(nested(payload, "summons.items"));
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
    content: {
      courtName: nested(payload, "content.courtName") || "",
      indictmentCode: nested(payload, "content.indictmentCode") || "",
      caseName: nested(payload, "content.caseName") || "",
      offenseName: nested(payload, "content.offenseName") || "",
      legalArticle: nested(payload, "content.legalArticle") || "",
      trialDate: nested(payload, "content.trialDate") || "",
      trialTime: nested(payload, "content.trialTime") || "08:00",
      trialLocation: nested(payload, "content.trialLocation") || "",
    },
    summons: { items },
    recipients: {
      line1: nested(payload, "recipients.line1") || EMPTY_FORM.recipients.line1,
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

function buildSaveBody(form: Bm158Form) {
  return {
    agency: form.agency,
    document: form.document,
    official: form.official,
    legalBasis: form.legalBasis,
    content: form.content,
    summons: { items: form.summons.items },
    recipients: form.recipients,
    signature: form.signature,
  };
}

export function Bm158FormInputsPanel({
  documentId,
  onSaved,
}: {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
}) {
  const [form, setForm] = useState<Bm158Form>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const patch = <S extends keyof Bm158Form, K extends keyof Bm158Form[S]>(
    section: S,
    key: K,
    value: Bm158Form[S][K],
  ) => {
    setForm((prev) => ({
      ...prev,
      [section]: { ...(prev[section] as Record<string, unknown>), [key]: value },
    }));
  };

  const patchSummon = (idx: number, key: keyof SummonItem, value: string) => {
    setForm((prev) => ({
      ...prev,
      summons: {
        items: prev.summons.items.map((item, i) =>
          i === idx ? { ...item, [key]: value } : item,
        ),
      },
    }));
  };

  const addSummon = () => {
    setForm((prev) => ({
      ...prev,
      summons: {
        items: [
          ...prev.summons.items,
          { ...EMPTY_SUMMON, stt: String(prev.summons.items.length + 1) },
        ],
      },
    }));
  };

  const removeSummon = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      summons: {
        items: prev.summons.items
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
        templateCode="BM-158"
        title="Dữ liệu biểu mẫu Danh sách đề nghị triệu tập đến phiên tòa"
        subtitle="Biểu mẫu TT 03/2026-VKSTC · Mẫu số 158/HS · Stage XET_XU. Căn cứ Điều 41, 252 BLTTHS 2015."
        isDirty={false}
        isLoading={loading}
        isSaving={saving}
        savedAt={null}
        errorMessage={error ?? undefined}
        successMessage={status.kind === "success" ? status.text : undefined}
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-158"}
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
          label="Số danh sách"
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

      <BmFormSection title="2. Thông tin phiên tòa">
        <BmFieldText
          label="Tòa án xét xử"
          fullWidth
          value={form.content.courtName}
          onChange={(v) => patch("content", "courtName", v)}
        />
        <BmFieldText
          label="Số cáo trạng"
          value={form.content.indictmentCode}
          onChange={(v) => patch("content", "indictmentCode", v)}
        />
        <BmFieldText
          label="Tên vụ án"
          value={form.content.caseName}
          onChange={(v) => patch("content", "caseName", v)}
        />
        <BmFieldText
          label="Tội danh"
          value={form.content.offenseName}
          onChange={(v) => patch("content", "offenseName", v)}
        />
        <BmFieldText
          label="Điều luật"
          value={form.content.legalArticle}
          onChange={(v) => patch("content", "legalArticle", v)}
        />
        <BmFieldDate
          label="Ngày xét xử"
          value={form.content.trialDate}
          onChange={(v) => patch("content", "trialDate", v)}
        />
        <BmFieldText
          label="Giờ xét xử"
          placeholder="HH:MM"
          value={form.content.trialTime}
          onChange={(v) => patch("content", "trialTime", v)}
        />
        <BmFieldText
          label="Địa điểm xét xử"
          fullWidth
          value={form.content.trialLocation}
          onChange={(v) => patch("content", "trialLocation", v)}
        />
      </BmFormSection>

      <BmFormSection title="3. Danh sách triệu tập">
        <div className="md:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100">
                  <th className="rounded-tl-lg px-2 py-1 text-left font-semibold text-slate-700">
                    STT
                  </th>
                  <th className="px-2 py-1 text-left font-semibold text-slate-700">Họ tên</th>
                  <th className="px-2 py-1 text-left font-semibold text-slate-700">CMND/CCCD</th>
                  <th className="px-2 py-1 text-left font-semibold text-slate-700">Địa chỉ</th>
                  <th className="px-2 py-1 text-left font-semibold text-slate-700">Vai trò</th>
                  <th className="px-2 py-1 text-left font-semibold text-slate-700">Ghi chú</th>
                  <th className="rounded-tr-lg px-2 py-1"></th>
                </tr>
              </thead>
              <tbody>
                {form.summons.items.map((item, idx) => (
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
                        className="w-40 rounded border border-slate-300 px-2 py-1 text-sm"
                        value={item.hoTen}
                        onChange={(e) => patchSummon(idx, "hoTen", e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        className="w-32 rounded border border-slate-300 px-2 py-1 text-sm"
                        value={item.cmnd}
                        onChange={(e) => patchSummon(idx, "cmnd", e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        className="w-48 rounded border border-slate-300 px-2 py-1 text-sm"
                        value={item.diaChi}
                        onChange={(e) => patchSummon(idx, "diaChi", e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        className="w-28 rounded border border-slate-300 px-2 py-1 text-sm"
                        value={item.vaiTro}
                        onChange={(e) => patchSummon(idx, "vaiTro", e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        className="w-28 rounded border border-slate-300 px-2 py-1 text-sm"
                        value={item.ghiChu}
                        onChange={(e) => patchSummon(idx, "ghiChu", e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <button
                        type="button"
                        className="rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-200"
                        onClick={() => removeSummon(idx)}
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
            onClick={addSummon}
          >
            + Thêm người
          </button>
        </div>
      </BmFormSection>

      <BmFormSection title="4. Chữ ký">
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
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-158"}
        primaryDisabled={saving || loading}
        onSecondary={reloadFromBackend}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
      />
    </div>
  );
}
