"use client";

import { useEffect, useState } from "react";
import { fetchCurrentAgency, fetchOfficials, type AuthUser } from "@/lib/auth-client";
import { useAuth } from "@/lib/auth-context";
import { fetchMyTemplates, type TemplateSummary } from "@/lib/templates-api";

type Official = {
  id: string;
  fullName: string;
  positionTitle: string | null;
  agencyName: string | null;
};

type Agency = {
  id: string;
  name: string;
  code: string | null;
  parentName: string | null;
};

export default function SettingsPage() {
  const { user } = useAuth();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [officials, setOfficials] = useState<Official[]>([]);
  const [myTemplates, setMyTemplates] = useState<TemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadSettings() {
    setLoading(true);
    try {
      const [agencyData, officialsData, templateData] = await Promise.all([
        fetchCurrentAgency(),
        fetchOfficials(),
        fetchMyTemplates(),
      ]);
      setAgency(agencyData);
      setOfficials(officialsData);
      setMyTemplates(templateData);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSettings();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="flex flex-col gap-3 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-950">Cấu hình</h1>
            <p className="mt-1 text-sm text-slate-600">
              Thông tin phiên đăng nhập, cơ quan hiện tại và danh sách cán bộ đang hoạt động.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadSettings()}
            className="h-10 rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
          >
            {loading ? "Đang tải..." : "Tải lại"}
          </button>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <InfoPanel title="Người dùng hiện tại" user={user} />

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-base font-black text-slate-950">Cơ quan</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Row label="Tên cơ quan" value={agency?.name ?? "Chưa có"} />
              <Row label="Mã cơ quan" value={agency?.code ?? "Chưa có"} />
              <Row label="Cơ quan cấp trên" value={agency?.parentName ?? "Không có"} />
            </dl>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-base font-black text-slate-950">Trạng thái hệ thống</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Row label="Auth" value="Session cookie" />
              <Row label="Biểu mẫu của tài khoản" value={String(myTemplates.length)} />
              <Row label="Người dùng hoạt động" value={String(officials.length)} />
              <Row label="Quyền hiện tại" value={user?.role ?? "Chưa xác định"} />
            </dl>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-slate-950">Biểu mẫu của tài khoản</h2>
              <p className="mt-1 text-sm text-slate-600">
                Danh sách lấy từ owner account trong DB, không suy từ tên người tạo.
              </p>
            </div>
            <span className="rounded-md bg-blue-50 px-3 py-1 text-sm font-black text-blue-700">
              {myTemplates.length}
            </span>
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-black">Mã</th>
                  <th className="px-4 py-3 font-black">Tên biểu mẫu</th>
                  <th className="px-4 py-3 font-black">Giai đoạn</th>
                </tr>
              </thead>
              <tbody>
                {myTemplates.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                      Tài khoản này chưa có biểu mẫu được gắn owner.
                    </td>
                  </tr>
                ) : null}
                {myTemplates.slice(0, 12).map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-black text-slate-900">{item.templateCode}</td>
                    <td className="px-4 py-3 text-slate-700">{item.templateName}</td>
                    <td className="px-4 py-3 text-slate-600">{item.stageCode ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-base font-black text-slate-950">Cán bộ đang hoạt động</h2>
          <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-black">Họ tên</th>
                  <th className="px-4 py-3 font-black">Chức vụ</th>
                  <th className="px-4 py-3 font-black">Cơ quan</th>
                </tr>
              </thead>
              <tbody>
                {officials.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                      Chưa có dữ liệu cán bộ.
                    </td>
                  </tr>
                ) : null}
                {officials.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-semibold text-slate-900">{item.fullName}</td>
                    <td className="px-4 py-3 text-slate-600">{item.positionTitle ?? ""}</td>
                    <td className="px-4 py-3 text-slate-600">{item.agencyName ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoPanel({ title, user }: { title: string; user: AuthUser | null }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-base font-black text-slate-950">{title}</h2>
      <dl className="mt-4 space-y-3 text-sm">
        <Row label="Tên" value={user?.fullName ?? "Chưa đăng nhập"} />
        <Row label="Username" value={user?.username ?? "Chưa có"} />
        <Row label="Chức danh" value={user?.positionTitle ?? "Chưa có"} />
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-semibold text-slate-900">{value}</dd>
    </div>
  );
}
