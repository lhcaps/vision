"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

type Bm137Form = {
  agency: { parentName: string; name: string };
  document: { documentCode: string; issuePlace: string; issueDateIso: string };
  verification: {
    caseTitle: string;
    offenseName: string;
    verificationTime: string;
    verificationLocation: string;
    subjectOfVerification: string;
    verificationMethod: string;
    findings: string;
    conclusionLine: string;
  };
  participants: {
    investigatorName: string;
    investigatorPosition: string;
    recordKeeperName: string;
    recordKeeperPosition: string;
    personContactedName: string;
    personContactedRole: string;
  };
};

const EMPTY: Bm137Form = {
  agency: { parentName: "", name: "" },
  document: { documentCode: "", issuePlace: "", issueDateIso: "" },
  verification: {
    caseTitle: "", offenseName: "", verificationTime: "", verificationLocation: "",
    subjectOfVerification: "", verificationMethod: "", findings: "", conclusionLine: "",
  },
  participants: {
    investigatorName: "", investigatorPosition: "", recordKeeperName: "", recordKeeperPosition: "",
    personContactedName: "", personContactedRole: "",
  },
};

function parseDateToIso(val: string): string {
  if (!val) return "";
  const d = new Date(val);
  return isNaN(d.getTime()) ? "" : d.toISOString();
}

function normalizeFormInputs(form: Bm137Form): Bm137Form {
  return {
    ...form,
    document: { ...form.document, issueDateIso: parseDateToIso(form.document.issueDateIso as unknown as string) },
  };
}

function validateForm(form: Bm137Form): string[] {
  const errors: string[] = [];
  if (!form.agency.parentName) errors.push("Tên Viện kiểm sát (cấp trên) là bắt buộc.");
  if (!form.agency.name) errors.push("Tên Viện kiểm sát là bắt buộc.");
  if (!form.document.documentCode) errors.push("Số biên bản là bắt buộc.");
  if (!form.verification.caseTitle) errors.push("Tên vụ án là bắt buộc.");
  if (!form.participants.investigatorName) errors.push("Tên người làm việc là bắt buộc.");
  return errors;
}

function buildSaveBody(form: Bm137Form, documentId: string) {
  return { documentId, formData: normalizeFormInputs(form) };
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      </div>
      <div className="space-y-4 p-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-slate-600">{label}</label>{children}</div>;
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input type="text" value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
  );
}

type RenderPayload = Record<string, any>;
type Bm137Props = { documentId: string; onSaved?: () => void | Promise<void> };

export function Bm137FormInputsPanel({ documentId, onSaved }: Bm137Props) {
  const [form, setForm] = useState<Bm137Form>(EMPTY);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!documentId || isLoaded) return;
    fetch(`${API_BASE_URL}/documents/${documentId}/render-payload`)
      .then((r) => r.json())
      .then((payload: RenderPayload) => {
        const d = payload?.data;
        if (d?.agency) setForm((f) => ({ ...f, agency: d.agency }));
        if (d?.document) setForm((f) => ({ ...f, document: d.document }));
        if (d?.verification) setForm((f) => ({ ...f, verification: { ...f.verification, ...d.verification } }));
        if (d?.participants) setForm((f) => ({ ...f, participants: { ...f.participants, ...d.participants } }));
        setIsLoaded(true);
      })
      .catch(() => {})
      .finally(() => setIsLoaded(false));
  }, [documentId, isLoaded]);

  const handleChange = useMemo(
    () => (path: string, value: string) => {
      setForm((f) => {
        const next = { ...f };
        const parts = path.split(".");
        let cur: Record<string, any> = next;
        for (let i = 0; i < parts.length - 1; i++) { cur[parts[i]] = { ...cur[parts[i]] }; cur = cur[parts[i]]; }
        cur[parts[parts.length - 1]] = value;
        return next;
      });
    }, []);

  const fillSample = () => {
    setForm({
      agency: { parentName: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH", name: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7" },
      document: { documentCode: "137/BBXM-VKSKV7", issuePlace: "Thành phố Hồ Chí Minh", issueDateIso: "2026-06-15" },
      verification: {
        caseTitle: "Vụ án hình sự ",
        offenseName: "Tội Cướp tài sản",
        verificationTime: "09 giờ 00 phút, ngày 15/6/2026",
        verificationLocation: "Tại Công ty TNHH Bình An, 789 Đường DEF, Quận 5, TP.HCM",
        subjectOfVerification: "Xác minh thông tin về việc bị can  làm việc tại Công ty TNHH Bình An từ tháng 01/2026 đến nay",
        verificationMethod: "Làm việc trực tiếp với đại diện công ty, kiểm tra hồ sơ nhân sự, hợp đồng lao động, bảng lương và các tài liệu liên quan",
        findings: " không làm việc tại Công ty TNHH Bình An. Công ty xác nhận không có hồ sơ nhân sự, hợp đồng lao động hay bất kỳ giao dịch nào liên quan đến cá nhân này.",
        conclusionLine: "Thông tin về việc  làm việc tại Công ty TNHH Bình An là không chính xác. Không có căn cứ để xác định nơi làm việc của bị can theo nguồn tin này.",
      },
      participants: {
        investigatorName: "",
        investigatorPosition: "Kiểm sát viên",
        recordKeeperName: "Lê Văn B",
        recordKeeperPosition: "Điều tra viên",
        personContactedName: "Phạm Thị C",
        personContactedRole: "Trưởng phòng nhân sự Công ty TNHH Bình An",
      },
    });
  };

  const handleSave = async () => {
    const errs = validateForm(form);
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);
    setIsSaving(true);
    try {
      await fetch(`${API_BASE_URL}/documents/${documentId}/form-inputs`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(buildSaveBody(form, documentId)) });
      onSaved?.();
    } catch { setErrors(["Lưu thất bại. Vui lòng thử lại."]); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">BM-137: Biên bản xác minh - làm việc</h2>
          <p className="text-xs text-slate-500">Nhập dữ liệu cho biểu mẫu Biên bản xác minh - làm việc</p>
        </div>
        <button onClick={fillSample} className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100">Điền mẫu</button>
      </div>
      {errors.length > 0 && <div className="rounded-lg border border-red-200 bg-red-50 p-3">{errors.map((e, i) => <p key={i} className="text-xs text-red-600">{e}</p>)}</div>}

      <SectionCard title="Cơ quan lập biên bản">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Tên Viện kiểm sát (cấp trên)"><Input value={form.agency.parentName} onChange={(v) => handleChange("agency.parentName", v)} placeholder="VIỆN KIỂM SÁT NHÂN DÂN..." /></Field>
          <Field label="Tên Viện kiểm sát"><Input value={form.agency.name} onChange={(v) => handleChange("agency.name", v)} placeholder="VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC..." /></Field>
        </div>
      </SectionCard>

      <SectionCard title="Thông tin biên bản">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Số biên bản"><Input value={form.document.documentCode} onChange={(v) => handleChange("document.documentCode", v)} placeholder="137/BBXM-VKSKV7" /></Field>
          <Field label="Nơi lập"><Input value={form.document.issuePlace} onChange={(v) => handleChange("document.issuePlace", v)} placeholder="Thành phố Hồ Chí Minh" /></Field>
          <Field label="Ngày lập">
            <input type="date" value={form.document.issueDateIso?.slice(0, 10) ?? ""} onChange={(e) => handleChange("document.issueDateIso", e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Nội dung xác minh">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Tên vụ án"><Input value={form.verification.caseTitle} onChange={(v) => handleChange("verification.caseTitle", v)} placeholder="Vụ án hình sự " /></Field>
          <Field label="Tội danh"><Input value={form.verification.offenseName} onChange={(v) => handleChange("verification.offenseName", v)} placeholder="Tội Cướp tài sản" /></Field>
          <Field label="Thời gian xác minh"><Input value={form.verification.verificationTime} onChange={(v) => handleChange("verification.verificationTime", v)} placeholder="09 giờ 00 phút, ngày 15/6/2026" /></Field>
          <Field label="Địa điểm xác minh"><Input value={form.verification.verificationLocation} onChange={(v) => handleChange("verification.verificationLocation", v)} placeholder="Tại Công ty TNHH Bình An..." /></Field>
        </div>
        <Field label="Nội dung cần xác minh"><Input value={form.verification.subjectOfVerification} onChange={(v) => handleChange("verification.subjectOfVerification", v)} placeholder="Xác minh thông tin về việc bị can..." /></Field>
        <Field label="Phương pháp xác minh"><Input value={form.verification.verificationMethod} onChange={(v) => handleChange("verification.verificationMethod", v)} placeholder="Làm việc trực tiếp với đại diện công ty..." /></Field>
        <Field label="Kết quả xác minh">
          <textarea value={form.verification.findings} onChange={(e) => handleChange("verification.findings", e.target.value)} rows={4}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder=" không làm việc tại Công ty..." />
        </Field>
        <Field label="Kết luận"><Input value={form.verification.conclusionLine} onChange={(v) => handleChange("verification.conclusionLine", v)} placeholder="Thông tin về việc  làm việc tại Công ty... là không chính xác." /></Field>
      </SectionCard>

      <SectionCard title="Người làm việc và ghi biên bản">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Tên người làm việc"><Input value={form.participants.investigatorName} onChange={(v) => handleChange("participants.investigatorName", v)} placeholder="" /></Field>
          <Field label="Chức vụ"><Input value={form.participants.investigatorPosition} onChange={(v) => handleChange("participants.investigatorPosition", v)} placeholder="Kiểm sát viên" /></Field>
          <Field label="Tên người ghi biên bản"><Input value={form.participants.recordKeeperName} onChange={(v) => handleChange("participants.recordKeeperName", v)} placeholder="Lê Văn B" /></Field>
          <Field label="Chức vụ người ghi"><Input value={form.participants.recordKeeperPosition} onChange={(v) => handleChange("participants.recordKeeperPosition", v)} placeholder="Điều tra viên" /></Field>
          <Field label="Tên người được làm việc"><Input value={form.participants.personContactedName} onChange={(v) => handleChange("participants.personContactedName", v)} placeholder="Phạm Thị C" /></Field>
          <Field label="Vai trò người được làm việc"><Input value={form.participants.personContactedRole} onChange={(v) => handleChange("participants.personContactedRole", v)} placeholder="Trưởng phòng nhân sự Công ty TNHH Bình An" /></Field>
        </div>
      </SectionCard>

      <div className="flex justify-end gap-3">
        <button onClick={handleSave} disabled={isSaving} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50">
          {isSaving ? "Đang lưu..." : "Lưu biểu mẫu"}
        </button>
      </div>
    </div>
  );
}
