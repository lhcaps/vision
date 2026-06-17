"use client";

import { useEffect, useState, type ReactNode } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

type Bm155Form = {
  agency: { parentName: string; name: string; issuePlace: string };
  document: { documentCode: string; issueDate: string };
  official: { issuerTitle: string };
  legalBasis: { procedureArticlesLine: string; suspensionDecisionLine: string };
  content: { suspensionDecisionCode: string; suspensionDecisionDate: string; accusedName: string; caseName: string; reasonLine: string; article1Line: string; article2Line: string };
  recipients: { line1: string; line2: string; archiveLine: string };
  signature: { signMode: string; positionTitle: string; signerName: string };
};

type Bm155Props = { documentId: string | number; onSaved?: () => void };

const EMPTY_FORM: Bm155Form = {
  agency: { parentName: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH", name: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7", issuePlace: "TP. Hồ Chí Minh" },
  document: { documentCode: "QĐ-VKSKV7-PHUCHOIBican", issueDate: "" },
  official: { issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7" },
  legalBasis: { procedureArticlesLine: "Căn cứ Điều 41 và Điều 251 của Bộ luật Tố tụng hình sự;", suspensionDecisionLine: "" },
  content: { suspensionDecisionCode: "", suspensionDecisionDate: "", accusedName: "", caseName: "", reasonLine: "", article1Line: "", article2Line: "" },
  recipients: { line1: "", line2: "", archiveLine: "- Lưu: HSVA, HSKS, VP." },
  signature: { signMode: "KT. VIỆN TRƯỞNG", positionTitle: "PHÓ VIỆN TRƯỞNG", signerName: "" },
};

function cleanText(v: unknown): string { return v === null || v === undefined ? "" : String(v).trim(); }
function nested(payload: Record<string, unknown> | null, path: string): string {
  if (!payload) return "";
  const parts = path.split(".").filter(Boolean);
  let cur: unknown = payload;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return "";
    cur = (cur as Record<string, unknown>)[p];
  }
  return cleanText(cur);
}
function normalizeForm(payload: Record<string, unknown> | null): Bm155Form {
  if (!payload) return EMPTY_FORM;
  return {
    agency: { parentName: nested(payload, "agency.parentName") || EMPTY_FORM.agency.parentName, name: nested(payload, "agency.name") || EMPTY_FORM.agency.name, issuePlace: nested(payload, "agency.issuePlace") || EMPTY_FORM.agency.issuePlace },
    document: { documentCode: nested(payload, "document.documentCode") || EMPTY_FORM.document.documentCode, issueDate: nested(payload, "document.issueDate") || EMPTY_FORM.document.issueDate },
    official: { issuerTitle: nested(payload, "official.issuerTitle") || EMPTY_FORM.official.issuerTitle },
    legalBasis: { procedureArticlesLine: nested(payload, "legalBasis.procedureArticlesLine") || EMPTY_FORM.legalBasis.procedureArticlesLine, suspensionDecisionLine: nested(payload, "legalBasis.suspensionDecisionLine") || EMPTY_FORM.legalBasis.suspensionDecisionLine },
    content: { suspensionDecisionCode: nested(payload, "content.suspensionDecisionCode") || "", suspensionDecisionDate: nested(payload, "content.suspensionDecisionDate") || "", accusedName: nested(payload, "content.accusedName") || "", caseName: nested(payload, "content.caseName") || "", reasonLine: nested(payload, "content.reasonLine") || "", article1Line: nested(payload, "content.article1Line") || "", article2Line: nested(payload, "content.article2Line") || "" },
    recipients: { line1: nested(payload, "recipients.line1") || "", line2: nested(payload, "recipients.line2") || "", archiveLine: nested(payload, "recipients.archiveLine") || EMPTY_FORM.recipients.archiveLine },
    signature: { signMode: nested(payload, "signature.signMode") || EMPTY_FORM.signature.signMode, positionTitle: nested(payload, "signature.positionTitle") || EMPTY_FORM.signature.positionTitle, signerName: nested(payload, "signature.signerName") || "" },
  };
}
function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-800 mb-4">{title}</h3><div className="grid gap-4 md:grid-cols-2">{children}</div></section>);
}
function Field({ label, value, onChange, required, multiline, type = "text", className = "" }: { label: string; value: string; onChange?: (v: string) => void; required?: boolean; multiline?: boolean; type?: "text" | "date"; className?: string }) {
  const cls = "rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 bg-white";
  return (<label className={`grid gap-1.5 ${className}`}><span className="text-sm font-semibold text-slate-700">{label}{required ? <span className="text-red-500"> *</span> : null}</span>{multiline ? <textarea className={`${cls} min-h-[88px]`} value={value} onChange={e => onChange?.(e.target.value)} /> : <input className={cls} value={value} type={type} onChange={e => onChange?.(e.target.value)} />}</label>);
}
export function Bm155FormInputsPanel({ documentId, onSaved }: Bm155Props) {
  const [form, setForm] = useState<Bm155Form>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const patch = (section: keyof Bm155Form, key: string, value: string) => setForm(f => ({ ...f, [section]: { ...f[section], [key]: value } }));
  const reload = async () => { try { const res = await fetch(`${API_BASE_URL}/documents/generated/${documentId}/render-payload`); if (res.ok) setForm(normalizeForm(await res.json())); } catch { /* ignore */ } };
  const handleSave = async () => { setSaving(true); setError(null); setMsg(null); try { const res = await fetch(`${API_BASE_URL}/documents/generated/${documentId}/form-inputs`, { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify(form) }); if (!res.ok) throw new Error(`HTTP ${res.status}`); await reload(); setMsg("Đã lưu thành công."); onSaved?.(); } catch (e) { setError(e instanceof Error ? e.message : "Lỗi khi lưu."); } finally { setSaving(false); } };
  useEffect(() => { void reload(); }, [documentId]);
  return (<div className="space-y-5 rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm"><div className="flex items-center justify-between border-b border-slate-200 pb-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">BM-155</p><h2 className="mt-1 text-xl font-bold text-slate-950">Quyết định phục hồi vụ án đối với bị can</h2></div><div className="flex gap-2"><button className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => void reload()}>Tải lại</button><button className="rounded-xl bg-blue-600 px-3.5 py-2.5 text-sm font-bold text-white hover:bg-blue-700" onClick={() => void handleSave()} disabled={saving}>{saving ? "Đang lưu..." : "Lưu dữ liệu"}</button></div></div>{msg ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{msg}</div> : null}{error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div> : null}<SectionCard title="1. Header biểu mẫu"><Field label="Viện kiểm sát cấp trên" value={form.agency.parentName} onChange={v => patch("agency", "parentName", v)} /><Field label="Viện kiểm sát ban hành" value={form.agency.name} onChange={v => patch("agency", "name", v)} /><Field label="Số quyết định" value={form.document.documentCode} onChange={v => patch("document", "documentCode", v)} /><Field label="Địa danh" value={form.agency.issuePlace} onChange={v => patch("agency", "issuePlace", v)} /><Field label="Ngày ban hành" type="date" value={form.document.issueDate} onChange={v => patch("document", "issueDate", v)} /><Field label="Chủ thể ban hành" value={form.official.issuerTitle} onChange={v => patch("official", "issuerTitle", v)} className="md:col-span-2" /></SectionCard><SectionCard title="2. Căn cứ pháp lý"><Field label="Căn cứ BLTTHS" multiline value={form.legalBasis.procedureArticlesLine} onChange={v => patch("legalBasis", "procedureArticlesLine", v)} className="md:col-span-2" /><Field label="Căn cứ QĐ đình chỉ bị huỷ" multiline value={form.legalBasis.suspensionDecisionLine} onChange={v => patch("legalBasis", "suspensionDecisionLine", v)} className="md:col-span-2" /></SectionCard><SectionCard title="3. Nội dung phục hồi"><Field label="Số QĐ đình chỉ bị huỷ" value={form.content.suspensionDecisionCode} onChange={v => patch("content", "suspensionDecisionCode", v)} /><Field label="Ngày QĐ đình chỉ bị huỷ" type="date" value={form.content.suspensionDecisionDate} onChange={v => patch("content", "suspensionDecisionDate", v)} /><Field label="Tên bị can" value={form.content.accusedName} onChange={v => patch("content", "accusedName", v)} /><Field label="Tên vụ án" value={form.content.caseName} onChange={v => patch("content", "caseName", v)} /><Field label="Lý do phục hồi" multiline value={form.content.reasonLine} onChange={v => patch("content", "reasonLine", v)} className="md:col-span-2" /><Field label="Điều 1" multiline value={form.content.article1Line} onChange={v => patch("content", "article1Line", v)} className="md:col-span-2" /><Field label="Điều 2" multiline value={form.content.article2Line} onChange={v => patch("content", "article2Line", v)} className="md:col-span-2" /></SectionCard><SectionCard title="4. Nơi nhận"><Field label="Nơi nhận 1" value={form.recipients.line1} onChange={v => patch("recipients", "line1", v)} /><Field label="Nơi nhận 2" value={form.recipients.line2} onChange={v => patch("recipients", "line2", v)} /><Field label="Lưu hồ sơ" value={form.recipients.archiveLine} onChange={v => patch("recipients", "archiveLine", v)} className="md:col-span-2" /></SectionCard><SectionCard title="5. Chữ ký"><Field label="Chế độ ký" value={form.signature.signMode} onChange={v => patch("signature", "signMode", v)} /><Field label="Chức vụ ký" value={form.signature.positionTitle} onChange={v => patch("signature", "positionTitle", v)} /><Field label="Người ký" value={form.signature.signerName} onChange={v => patch("signature", "signerName", v)} /></SectionCard></div>);
}
