"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

type Bm132Form = {
  agency: { parentName: string; name: string };
  document: { documentCode: string; issuePlace: string; issueDateIso: string };
  official: { issuerTitle: string };
  decision: { procedureArticlesLine: string; caseTitle: string; offenseName: string; propertyDescription: string; originalAppraisalValue: string; originalAppraisalDate: string; originalAppraisalAgency: string; specialReason: string; reasonLine: string };
  recipients: { archiveLine: string };
  signature: { signMode: string; positionTitle: string; signerName: string };
};

const EMPTY_FORM: Bm132Form = {
  agency: { parentName: "VIỆN KIỂM SÁT NHÂN DÂN CẤP CAO TẠI TP. HỒ CHÍ MINH", name: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7" },
  document: { documentCode: "132/QĐ-VKSKV7", issuePlace: "TP. Hồ Chí Minh", issueDateIso: "" },
  official: { issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7" },
  decision: { procedureArticlesLine: "Căn cứ các điều 36, 37 và 50 của Bộ luật Tố tụng hình sự;", caseTitle: "", offenseName: "", propertyDescription: "", originalAppraisalValue: "", originalAppraisalDate: "", originalAppraisalAgency: "", specialReason: "", reasonLine: "" },
  recipients: { archiveLine: "- Lưu: HSVA, HSKS, VP." },
  signature: { signMode: "KT. VIỆN TRƯỞNG", positionTitle: "PHÓ VIỆN TRƯỞNG", signerName: "" },
};

function cleanText(v: unknown): string { return v == null ? "" : String(v).trim(); }
function nested(payload: any, path: string): string { if (!payload) return ""; const parts = path.split(".").filter(Boolean); let cur: any = payload; for (const p of parts) { if (!cur || typeof cur !== "object") return ""; cur = cur[p]; } return cleanText(cur); }
function parseDateToIso(v: string): string { const raw = cleanText(v); if (!raw) return ""; const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/); if (iso) return raw; const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); if (slash) return slash[3] + "-" + String(slash[2]).padStart(2,"0") + "-" + String(slash[1]).padStart(2,"0"); return ""; }
function toVietnameseDateText(isoDate: string): string { const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/); if (!m) return isoDate || ""; return "ngày " + Number(m[3]) + " tháng " + Number(m[2]) + " năm " + m[1]; }
function toSlashDateText(isoDate: string): string { const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/); if (!m) return isoDate || ""; return m[3] + "/" + m[2] + "/" + m[1]; }
function buildIssuePlaceAndDateLine(form: Bm132Form): string { const place = form.document.issuePlace.trim(); const dateText = toVietnameseDateText(form.document.issueDateIso); return place ? place + ", " + dateText : dateText; }
function buildReasonLine(form: Bm132Form): string { const d = form.decision; if (!d.propertyDescription || !d.caseTitle) return ""; return "Qua xét nội dung vụ án " + d.caseTitle.trim() + (d.offenseName ? " về tội \"" + d.offenseName.trim() + "\"" : "") + ", tài sản " + d.propertyDescription.trim() + (d.originalAppraisalValue ? " đã được định giá với giá trị " + d.originalAppraisalValue.trim() : "") + (d.originalAppraisalDate ? " theo kết luận ngày " + cleanText(d.originalAppraisalDate) : "") + (d.originalAppraisalAgency ? " của " + d.originalAppraisalAgency.trim() : "") + ". Trong trường hợp đặc biệt, cần định giá lại vì " + d.specialReason.trim() + "."; }

function normalizeFormInputs(payload: any): Bm132Form {
  const f = EMPTY_FORM;
  return {
    agency: { parentName: nested(payload, "agency.parentName") || f.agency.parentName, name: nested(payload, "agency.name") || f.agency.name },
    document: { documentCode: nested(payload, "document.documentCode") || f.document.documentCode, issuePlace: nested(payload, "document.issuePlace") || nested(payload, "agency.issuePlace") || f.document.issuePlace, issueDateIso: parseDateToIso(nested(payload, "document.issueDate")) || f.document.issueDateIso },
    official: { issuerTitle: nested(payload, "official.issuerTitle") || f.official.issuerTitle },
    decision: { procedureArticlesLine: nested(payload, "decision.procedureArticlesLine") || f.decision.procedureArticlesLine, caseTitle: nested(payload, "decision.caseTitle") || nested(payload, "case.caseTitle") || "", offenseName: nested(payload, "decision.offenseName") || nested(payload, "offense.offenseName") || "", propertyDescription: nested(payload, "decision.propertyDescription") || "", originalAppraisalValue: nested(payload, "decision.originalAppraisalValue") || "", originalAppraisalDate: nested(payload, "decision.originalAppraisalDate") || "", originalAppraisalAgency: nested(payload, "decision.originalAppraisalAgency") || "", specialReason: nested(payload, "decision.specialReason") || "", reasonLine: nested(payload, "decision.reasonLine") || "" },
    recipients: { archiveLine: nested(payload, "recipients.archiveLine") || f.recipients.archiveLine },
    signature: { signMode: nested(payload, "signature.signMode") || f.signature.signMode, positionTitle: nested(payload, "signature.positionTitle") || f.signature.positionTitle, signerName: nested(payload, "signature.signerName") || "" },
  };
}

function validateForm(form: Bm132Form): string[] {
  const reqs: [string, string][] = [["Viện kiểm sát cấp trên", form.agency.parentName], ["Viện kiểm sát ban hành", form.agency.name], ["Số quyết định", form.document.documentCode], ["Địa danh", form.document.issuePlace], ["Ngày ban hành", form.document.issueDateIso], ["Chủ thể ban hành", form.official.issuerTitle], ["Căn cứ pháp luật", form.decision.procedureArticlesLine], ["Tên vụ án", form.decision.caseTitle], ["Mô tả tài sản", form.decision.propertyDescription], ["Lý do đặc biệt", form.decision.specialReason], ["Chế độ ký", form.signature.signMode], ["Chức vụ ký", form.signature.positionTitle], ["Người ký", form.signature.signerName]];
  return reqs.filter(([, v]) => !String(v ?? "").trim()).map(([l]) => l);
}

function buildSaveBody(form: Bm132Form) {
  return {
    agency: { parentName: form.agency.parentName, name: form.agency.name, issuePlace: form.document.issuePlace },
    document: { documentCode: form.document.documentCode, issueDate: toSlashDateText(form.document.issueDateIso), issueDateText: toVietnameseDateText(form.document.issueDateIso).replace(/^ngày\s+/iu, ""), issuePlaceAndDateLine: buildIssuePlaceAndDateLine(form) },
    official: { issuerTitle: form.official.issuerTitle },
    decision: { procedureArticlesLine: form.decision.procedureArticlesLine, caseTitle: form.decision.caseTitle, offenseName: form.decision.offenseName, propertyDescription: form.decision.propertyDescription, originalAppraisalValue: form.decision.originalAppraisalValue, originalAppraisalDate: form.decision.originalAppraisalDate, originalAppraisalAgency: form.decision.originalAppraisalAgency, specialReason: form.decision.specialReason, reasonLine: buildReasonLine(form) },
    recipients: { archiveLine: form.recipients.archiveLine },
    signature: { signMode: form.signature.signMode, positionTitle: form.signature.positionTitle, signerName: form.signature.signerName || "" },
    formInputs: {}, payloadOverrides: {}, renderPayloadOverrides: {},
  };
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4"><h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-800">{title}</h3>{description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}</div><div className="grid gap-4">{children}</div></section>);
}

function Field({ label, value, onChange, required, multiline, type, readOnly }: { label: string; value: string; onChange?: (v: string) => void; required?: boolean; multiline?: boolean; type?: "text" | "date"; readOnly?: boolean; }) {
  const cls = "rounded-xl border border-slate-300 px-3 py-2.5 text-sm leading-6 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
  return (<label className="grid gap-1.5"><span className="text-sm font-semibold text-slate-700">{label}{required ? <span className="text-red-500"> *</span> : null}</span>{multiline ? <textarea className={cls + " min-h-[88px] " + (readOnly ? "bg-slate-100 text-slate-700" : "bg-white")} value={value} readOnly={readOnly} onChange={(e) => onChange?.(e.target.value)} /> : <input className={cls + " " + (readOnly ? "bg-slate-100 text-slate-700" : "bg-white")} value={value} type={type || "text"} readOnly={readOnly} onChange={(e) => onChange?.(e.target.value)} />}</label>);
}

export function Bm132FormInputsPanel({ documentId, onSaved }: { documentId: string | number; onSaved?: () => void | Promise<void> }) {
  const [form, setForm] = useState<Bm132Form>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const validationErrors = useMemo(() => validateForm(form), [form]);

  const patch = (section: keyof Bm132Form, key: string, value: string) => setForm((f) => ({ ...f, [section]: { ...(f[section] as Record<string, string>), [key]: value } }));

  const reloadFromBackend = async () => {
    setLoading(true); setError(null); setMessage(null);
    try {
      const res = await fetch(API_BASE_URL + "/documents/generated/" + documentId + "/render-payload", { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const payload = await res.json();
      setForm(normalizeFormInputs(payload));
      setMessage("Đã tải dữ liệu BM-132 từ backend.");
    } catch (e) { setError(e instanceof Error ? e.message : "Lỗi khi tải."); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    const errors = validateForm(form);
    if (errors.length > 0) { setError("Thiếu: " + errors.join(", ")); return; }
    setSaving(true); setError(null); setMessage(null);
    try {
      const res = await fetch(API_BASE_URL + "/documents/generated/" + documentId + "/form-inputs", { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify(buildSaveBody(form)) });
      if (!res.ok) throw new Error("HTTP " + res.status);
      await reloadFromBackend();
      setMessage("Đã lưu BM-132 thành công.");
      await onSaved?.();
    } catch (e) { setError(e instanceof Error ? e.message : "Lỗi khi lưu."); }
    finally { setSaving(false); }
  };

  useEffect(() => { void reloadFromBackend(); }, [documentId]);

  return (
    <div className="space-y-5 rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-start md:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">BM-132</p><h2 className="mt-1 text-xl font-bold text-slate-950">QĐ định giá lại tài sản trong trường hợp đặc biệt</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Form nhập liệu placeholder cho BM-132.</p></div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60" onClick={() => void reloadFromBackend()} disabled={loading || saving}>{loading ? "Đang tải..." : "Tải lại"}</button>
          <button type="button" className="rounded-xl bg-blue-600 px-3.5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60" onClick={() => void handleSave()} disabled={loading || saving}>{saving ? "Đang lưu..." : "Lưu dữ liệu"}</button>
        </div>
      </div>
      {message ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</div> : null}
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div> : null}
      {validationErrors.length > 0 ? <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">Còn thiếu: {validationErrors.join(", ")}</div> : null}
      <SectionCard title="1. Header biểu mẫu">
        <Field label="Viện kiểm sát cấp trên" required value={form.agency.parentName} onChange={(v) => patch("agency", "parentName", v)} />
        <Field label="Viện kiểm sát ban hành" required value={form.agency.name} onChange={(v) => patch("agency", "name", v)} />
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Số quyết định" required value={form.document.documentCode} onChange={(v) => patch("document", "documentCode", v)} />
          <Field label="Địa danh" required value={form.document.issuePlace} onChange={(v) => patch("document", "issuePlace", v)} />
          <Field label="Ngày ban hành" required type="date" value={form.document.issueDateIso} onChange={(v) => patch("document", "issueDateIso", v)} />
        </div>
        <Field label="Dòng địa danh/ngày tự sinh" value={buildIssuePlaceAndDateLine(form)} readOnly />
        <Field label="Chủ thể ban hành" required value={form.official.issuerTitle} onChange={(v) => patch("official", "issuerTitle", v)} />
      </SectionCard>
      <SectionCard title="2. Thông tin định giá lại đặc biệt" description="Nhập thông tin định giá lại tài sản trong trường hợp đặc biệt.">
        <Field label="Căn cứ pháp luật" required multiline value={form.decision.procedureArticlesLine} onChange={(v) => patch("decision", "procedureArticlesLine", v)} />
        <Field label="Tên vụ án" required value={form.decision.caseTitle} onChange={(v) => patch("decision", "caseTitle", v)} />
        <Field label="Tội danh" value={form.decision.offenseName} onChange={(v) => patch("decision", "offenseName", v)} />
        <Field label="Mô tả tài sản cần định giá lại" required value={form.decision.propertyDescription} onChange={(v) => patch("decision", "propertyDescription", v)} />
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Giá trị định giá trước" value={form.decision.originalAppraisalValue} onChange={(v) => patch("decision", "originalAppraisalValue", v)} />
          <Field label="Ngày định giá trước" value={form.decision.originalAppraisalDate} onChange={(v) => patch("decision", "originalAppraisalDate", v)} />
          <Field label="Đơn vị định giá trước" value={form.decision.originalAppraisalAgency} onChange={(v) => patch("decision", "originalAppraisalAgency", v)} />
        </div>
        <Field label="Lý do đặc biệt cần định giá lại" required multiline value={form.decision.specialReason} onChange={(v) => patch("decision", "specialReason", v)} />
        <Field label="Nội dung QĐ tự sinh" multiline readOnly value={buildReasonLine(form)} />
      </SectionCard>
      <SectionCard title="3. Nơi nhận và chữ ký">
        <Field label="Lưu hồ sơ" value={form.recipients.archiveLine} onChange={(v) => patch("recipients", "archiveLine", v)} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Chế độ ký" required value={form.signature.signMode} onChange={(v) => patch("signature", "signMode", v)} />
          <Field label="Chức vụ ký" required value={form.signature.positionTitle} onChange={(v) => patch("signature", "positionTitle", v)} />
        </div>
        <Field label="Người ký" required value={form.signature.signerName} onChange={(v) => patch("signature", "signerName", v)} />
      </SectionCard>
    </div>
  );
}
