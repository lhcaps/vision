#!/usr/bin/env node
/**
 * Generate 83 stub form-inputs components for BM codes that don't have a dedicated panel.
 * Each stub:
 *  - Wraps GenericTemplateFormInputsPanel (already supports the smart-defaults + persistence)
 *  - Adds a BmFormMetaBar showing the BM code, stage, group, and render scope
 *  - Marks itself as a "stub" with a clear banner so the team knows which still need bespoke UI
 */
const fs = require('fs');
const path = require('path');

const MISSING = [
  { code: 'BM-004', stage: 'TIEP_NHAN',     group: 'G01', name: 'QĐ thay đổi người THQCT, KS việc giải quyết nguồn tin' },
  { code: 'BM-013', stage: 'TIEP_NHAN',     group: 'G01', name: 'QĐ giải quyết tranh chấp về thẩm quyền giải quyết nguồn tin' },
  { code: 'BM-019', stage: 'TIEP_NHAN',     group: 'G01', name: 'Yêu cầu ra QĐ bổ sung QĐ khởi tố vụ án hình sự' },
  { code: 'BM-020', stage: 'TIEP_NHAN',     group: 'G01', name: 'Yêu cầu ra QĐ hủy bỏ QĐ khởi tố, QĐ không khởi tố' },
  { code: 'BM-021', stage: 'TIEP_NHAN',     group: 'G01', name: 'QĐ không khởi tố vụ án hình sự' },
  { code: 'BM-022', stage: 'TIEP_NHAN',     group: 'G01', name: 'QĐ huỷ bỏ QĐ không khởi tố vụ án hình sự' },
  { code: 'BM-024', stage: 'TIEP_NHAN',     group: 'G01', name: 'QĐ thay đổi QĐ khởi tố vụ án hình sự' },
  { code: 'BM-025', stage: 'TIEP_NHAN',     group: 'G01', name: 'QĐ bổ sung QĐ khởi tố vụ án hình sự' },
  { code: 'BM-026', stage: 'TIEP_NHAN',     group: 'G01', name: 'QĐ huỷ bỏ QĐ khởi tố vụ án hình sự' },
  { code: 'BM-027', stage: 'TIEP_NHAN',     group: 'G01', name: 'Thông báo về việc huỷ bỏ QĐ khởi tố vụ án hình sự' },
  { code: 'BM-028', stage: 'TIEP_NHAN',     group: 'G01', name: 'QĐ huỷ bỏ QĐ thay đổi QĐ khởi tố vụ án hình sự' },
  { code: 'BM-029', stage: 'TIEP_NHAN',     group: 'G01', name: 'QĐ huỷ bỏ QĐ bổ sung QĐ khởi tố vụ án hình sự' },
  { code: 'BM-032', stage: 'BP_NGAN_CHAN',  group: 'G02', name: 'QĐ không phê chuẩn Lệnh bắt người bị giữ trong trường hợp khẩn cấp' },
  { code: 'BM-034', stage: 'BP_NGAN_CHAN',  group: 'G02', name: 'QĐ không phê chuẩn QĐ gia hạn tạm giữ' },
  { code: 'BM-035', stage: 'BP_NGAN_CHAN',  group: 'G02', name: 'QĐ huỷ bỏ QĐ tạm giữ, quyết định gia hạn tạm giữ' },
  { code: 'BM-036', stage: 'BP_NGAN_CHAN',  group: 'G02', name: 'QĐ trả tự do cho người bị tạm giữ' },
  { code: 'BM-041', stage: 'BP_NGAN_CHAN',  group: 'G02', name: 'QĐ không phê chuẩn Lệnh tạm giam' },
  { code: 'BM-048', stage: 'BP_NGAN_CHAN',  group: 'G02', name: 'QĐ huỷ bỏ biện pháp bảo lĩnh' },
  { code: 'BM-049', stage: 'BP_NGAN_CHAN',  group: 'G02', name: 'QĐ phê chuẩn QĐ về việc đặt tiền để bảo đảm' },
  { code: 'BM-050', stage: 'BP_NGAN_CHAN',  group: 'G02', name: 'QĐ không phê chuẩn QĐ về việc đặt tiền để bảo đảm' },
  { code: 'BM-051', stage: 'BP_NGAN_CHAN',  group: 'G02', name: 'QĐ về việc đặt tiền để bảo đảm' },
  { code: 'BM-052', stage: 'BP_NGAN_CHAN',  group: 'G02', name: 'QĐ huỷ bỏ biện pháp đặt tiền để bảo đảm' },
  { code: 'BM-060', stage: 'BP_NGAN_CHAN',  group: 'G02', name: 'QĐ áp giải bị can' },
  { code: 'BM-061', stage: 'BP_NGAN_CHAN',  group: 'G02', name: 'QĐ dẫn giải' },
  { code: 'BM-062', stage: 'BP_NGAN_CHAN',  group: 'G02', name: 'Lệnh kê biên tài sản' },
  { code: 'BM-063', stage: 'BP_NGAN_CHAN',  group: 'G02', name: 'Biên bản kê biên tài sản' },
  { code: 'BM-064', stage: 'BP_NGAN_CHAN',  group: 'G02', name: 'QĐ huỷ bỏ biện pháp kê biên tài sản' },
  { code: 'BM-065', stage: 'BP_NGAN_CHAN',  group: 'G02', name: 'BB về việc thi hành Quyết định hủy bỏ Lệnh kê biên tài sản' },
  { code: 'BM-066', stage: 'BP_NGAN_CHAN',  group: 'G02', name: 'Lệnh phong toả tài khoản' },
  { code: 'BM-067', stage: 'BP_NGAN_CHAN',  group: 'G02', name: 'Biên bản phong tỏa tài khoản' },
  { code: 'BM-068', stage: 'BP_NGAN_CHAN',  group: 'G02', name: 'QĐ huỷ bỏ biện pháp phong toả tài khoản' },
  { code: 'BM-069', stage: 'BP_NGAN_CHAN',  group: 'G02', name: 'BB về việc hủy bỏ biện pháp phong tỏa tài khoản' },
  { code: 'BM-073', stage: 'NGUOI_THAM_GIA', group: 'G02', name: 'Yêu cầu thay đổi Thủ trưởng, PTT, ĐTV cơ quan có thẩm quyền điều tra' },
  { code: 'BM-075', stage: 'NGUOI_THAM_GIA', group: 'G02', name: 'Đề nghị thay đổi người phiên dịch, người dịch thuật' },
  { code: 'BM-077', stage: 'NGUOI_THAM_GIA', group: 'G02', name: 'Yêu cầu, đề nghị cử người bào chữa' },
  { code: 'BM-079', stage: 'NGUOI_THAM_GIA', group: 'G02', name: 'Thông báo huỷ bỏ việc đăng ký bào chữa' },
  { code: 'BM-080', stage: 'NGUOI_THAM_GIA', group: 'G02', name: 'Thông báo từ chối việc đăng ký bào chữa' },
  { code: 'BM-082', stage: 'NGUOI_THAM_GIA', group: 'G02', name: 'Thông báo về thời gian, địa điểm tiến hành tố tụng cho người bào chữa' },
  { code: 'BM-162', stage: 'TRUY_TO',        group: 'G03', name: 'Giấy mời' },
  { code: 'BM-163', stage: 'TRUY_TO',        group: 'G03', name: 'Giấy triệu tập' },
  { code: 'BM-164', stage: 'TRUY_TO',        group: 'G03', name: 'BB giao nhận Cáo trạng, QĐ truy tố theo thủ tục rút gọn, QĐ tạm đình chỉ vụ án, đình chỉ vụ án' },
  { code: 'BM-165', stage: 'TRUY_TO',        group: 'G03', name: 'Thông báo về việc vụ án có bị can bị tạm giam' },
  { code: 'BM-167', stage: 'TRUY_TO',        group: 'G03', name: 'Thông báo về việc trả hồ sơ, ban hành cáo trạng' },
  { code: 'BM-174', stage: 'DIEU_TRA_DAC_BIET', group: 'G04', name: 'Yêu cầu áp dụng biện pháp điều tra tố tụng đặc biệt' },
  { code: 'BM-175', stage: 'DIEU_TRA_DAC_BIET', group: 'G04', name: 'QĐ phê chuẩn QĐ áp dụng biện pháp điều tra tố tụng đặc biệt' },
  { code: 'BM-176', stage: 'DIEU_TRA_DAC_BIET', group: 'G04', name: 'QĐ không phê chuẩn QĐ áp dụng biện pháp điều tra tố tụng đặc biệt' },
  { code: 'BM-177', stage: 'DIEU_TRA_DAC_BIET', group: 'G04', name: 'QĐ gia hạn thời hạn áp dụng biện pháp điều tra tố tụng đặc biệt' },
  { code: 'BM-178', stage: 'DIEU_TRA_DAC_BIET', group: 'G04', name: 'QĐ huỷ bỏ QĐ áp dụng biện pháp điều tra tố tụng đặc biệt' },
  { code: 'BM-179', stage: 'THU_TUC_DAC_BIET', group: 'G04', name: 'QĐ áp dụng biện pháp chữa bệnh' },
  { code: 'BM-180', stage: 'THU_TUC_DAC_BIET', group: 'G04', name: 'QĐ đình chỉ thi hành biện pháp bắt buộc chữa bệnh' },
  { code: 'BM-181', stage: 'THU_TUC_DAC_BIET', group: 'G04', name: 'QĐ áp dụng thủ tục rút gọn' },
  { code: 'BM-182', stage: 'THU_TUC_DAC_BIET', group: 'G04', name: 'QĐ huỷ bỏ QĐ áp dụng thủ tục rút gọn 1' },
  { code: 'BM-183', stage: 'THU_TUC_DAC_BIET', group: 'G04', name: 'QĐ truy tố theo thủ tục rút gọn' },
  { code: 'BM-184', stage: 'THU_TUC_DAC_BIET', group: 'G04', name: 'Đề nghị áp dụng biện pháp bảo vệ' },
  { code: 'BM-185', stage: 'NGUOI_CHUA_THANH_NIEN', group: 'G04', name: 'Yêu cầu lập Báo cáo điều tra xã hội bổ sung' },
  { code: 'BM-186', stage: 'NGUOI_CHUA_THANH_NIEN', group: 'G04', name: 'Thông báo áp dụng thủ tục xử lý chuyển hướng' },
  { code: 'BM-187', stage: 'NGUOI_CHUA_THANH_NIEN', group: 'G04', name: 'Yêu cầu NLCTXH xây dựng kế hoạch XLCH hoặc kế hoạch XLCH bổ sung' },
  { code: 'BM-188', stage: 'NGUOI_CHUA_THANH_NIEN', group: 'G04', name: 'Đề nghị Tòa án giải quyết vấn đề bồi thường thiệt hại' },
  { code: 'BM-189', stage: 'NGUOI_CHUA_THANH_NIEN', group: 'G04', name: 'Yêu cầu CQĐT đề nghị TA xem xét áp dụng biện pháp giáo dục tại trường giáo dưỡng' },
  { code: 'BM-190', stage: 'NGUOI_CHUA_THANH_NIEN', group: 'G04', name: 'Đề nghị Tòa án xem xét, quyết định áp dụng biện pháp giáo dục tại trường giáo dưỡng' },
  { code: 'BM-191', stage: 'NGUOI_CHUA_THANH_NIEN', group: 'G04', name: 'Quyết định áp dụng biện pháp xử lý chuyển hướng tại cộng đồng' },
  { code: 'BM-192', stage: 'NGUOI_CHUA_THANH_NIEN', group: 'G04', name: 'Quyết định không áp dụng biện pháp xử lý chuyển hướng tại cộng đồng' },
  { code: 'BM-193', stage: 'NGUOI_CHUA_THANH_NIEN', group: 'G04', name: 'Quyết định thay đổi biện pháp xử lý chuyển hướng tại cộng đồng' },
  { code: 'BM-194', stage: 'NGUOI_CHUA_THANH_NIEN', group: 'G04', name: 'Quyết định hủy bỏ quyết định áp dụng biện pháp xử lý chuyển hướng' },
  { code: 'BM-195', stage: 'NGUOI_CHUA_THANH_NIEN', group: 'G04', name: 'Quyết định hủy bỏ quyết định không áp dụng biện pháp xử lý chuyển hướng' },
  { code: 'BM-196', stage: 'NGUOI_CHUA_THANH_NIEN', group: 'G04', name: 'Quyết định mở phiên họp xem xét, áp dụng biện pháp xử lý chuyển hướng tại cộng đồng' },
  { code: 'BM-197', stage: 'NGUOI_CHUA_THANH_NIEN', group: 'G04', name: 'BB phiên họp xem xét, quyết định áp dụng BPXLCH tại cộng đồng' },
  { code: 'BM-198', stage: 'NGUOI_CHUA_THANH_NIEN', group: 'G04', name: 'Quyết định hoãn phiên họp xem xét, quyết định áp dụng BPXLCH tại cộng đồng' },
  { code: 'BM-199', stage: 'NGUOI_CHUA_THANH_NIEN', group: 'G04', name: 'Kiến nghị về quyết định áp dụng BPXLCH của Tòa án' },
  { code: 'BM-200', stage: 'NGUOI_CHUA_THANH_NIEN', group: 'G04', name: 'Thông báo tiếp nhận khiếu nại, kiến nghị cân nhắc tính cần thiết' },
  { code: 'BM-201', stage: 'NGUOI_CHUA_THANH_NIEN', group: 'G04', name: 'Quyết định giải quyết khiếu nại, kiến nghị' },
  { code: 'BM-202', stage: 'NGUOI_CHUA_THANH_NIEN', group: 'G04', name: 'Quyết định đình chỉ việc giải quyết khiếu nại, kiến nghị' },
  { code: 'BM-203', stage: 'NGUOI_CHUA_THANH_NIEN', group: 'G04', name: 'Thông báo về hoạt động tố tụng' },
  { code: 'BM-204', stage: 'NGUOI_CHUA_THANH_NIEN', group: 'G04', name: 'QĐ việc tham gia tố tụng của người đại diện, tổ chức' },
  { code: 'BM-205', stage: 'NGUOI_CHUA_THANH_NIEN', group: 'G04', name: 'Thông báo áp dụng biện pháp ngăn chặn đối với NCTN' },
  { code: 'BM-206', stage: 'NGUOI_CHUA_THANH_NIEN', group: 'G04', name: 'Quyết định áp dụng biện pháp giám sát điện tử đối với NCTN' },
  { code: 'BM-207', stage: 'NGUOI_CHUA_THANH_NIEN', group: 'G04', name: 'Quyết định phê chuẩn quyết định áp dụng biện pháp giám sát điện tử đối với NCTN' },
  { code: 'BM-208', stage: 'NGUOI_CHUA_THANH_NIEN', group: 'G04', name: 'Quyết định không phê chuẩn quyết định áp dụng biện pháp giám sát điện tử đối với NCTN' },
  { code: 'BM-209', stage: 'NGUOI_CHUA_THANH_NIEN', group: 'G04', name: 'Quyết định áp dụng biện pháp giám sát bởi người đại diện' },
  { code: 'BM-210', stage: 'NGUOI_CHUA_THANH_NIEN', group: 'G04', name: 'Quyết định thay đổi người đại diện' },
  { code: 'BM-211', stage: 'NGUOI_CHUA_THANH_NIEN', group: 'G04', name: 'Thông báo về việc thụ lý vụ án' },
  { code: 'BM-212', stage: 'NGUOI_CHUA_THANH_NIEN', group: 'G04', name: 'Đề nghị tham gia tố tụng để hướng dẫn, hỗ trợ cho người chưa thành niên' },
  { code: 'BM-213', stage: 'NGUOI_CHUA_THANH_NIEN', group: 'G04', name: 'Yêu cầu áp dụng các biện pháp kỹ thuật để bảo vệ NCTN' },
];

const OUT_DIR = path.join(__dirname, '..', 'apps', 'web', 'src', 'components', 'documents');

function makeComponent(m) {
  const num = m.code.split('-')[1];
  const componentName = `Bm${num}FormInputsPanel`;
  const displayName = m.name;
  const stageLabel = {
    TIEP_NHAN: 'Tiếp nhận, giải quyết nguồn tin về tội phạm',
    BP_NGAN_CHAN: 'Biện pháp ngăn chặn, bảo đảm',
    NGUOI_THAM_GIA: 'Người tham gia tố tụng',
    DIEU_TRA: 'Điều tra vụ án hình sự',
    TRUY_TO: 'Truy tố, chuyển hồ sơ',
    VAT_CHUNG: 'Vật chứng, tài sản',
    DIEU_TRA_DAC_BIET: 'Điều tra tố tụng đặc biệt',
    THU_TUC_DAC_BIET: 'Thủ tục đặc biệt, rút gọn',
    NGUOI_CHUA_THANH_NIEN: 'Thủ tục đối với người chưa thành niên',
  }[m.stage] || m.stage;
  return `"use client";

/**
 * ${m.code} — ${displayName}
 * Stage: ${m.stage} (${stageLabel}), Group: ${m.group}
 *
 * STUB: Component này hiện đang dùng GenericTemplateFormInputsPanel (đã có smart-defaults,
 * lưu/đọc payload đầy đủ, hỗ trợ placeholder replacement). Khi cần UI riêng cho biểu mẫu
 * này, thay thế phần render bên trong bằng BmFormSection + BmFieldText/Textarea theo
 * docs/BM_CANONICAL_SPEC.md.
 */
import { useEffect, useState } from "react";
import { absoluteApiUrl } from "@/lib/api-client";
import { BmFormMetaBar } from "@/components/documents/bm-form";
import { GenericTemplateFormInputsPanel } from "./generic-template-form-inputs";

type PayloadResponse = {
  document?: { id?: string | null; documentCode?: string | null } | null;
  template?: {
    templateCode?: string | null;
    templateName?: string | null;
    renderScope?: string | null;
  } | null;
};

type Props = {
  documentId: string | number;
  onSaved?: () => void;
};

export function ${componentName}({ documentId, onSaved }: Props) {
  const [payload, setPayload] = useState<PayloadResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(
    "Đây là form stub dùng GenericTemplateFormInputsPanel. Khi cần UI riêng, hãy thay phần render bên trong bằng BmFormSection + BmFieldText theo docs/BM_CANONICAL_SPEC.md.",
  );

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setIsLoading(true);
        const res = await fetch(
          absoluteApiUrl(\`/documents/generated/\${documentId}/render-payload\`),
          { method: "GET", credentials: "include", headers: { Accept: "application/json" }, cache: "no-store" },
        );
        if (!res.ok) throw new Error(await res.text());
        if (isMounted) setPayload((await res.json()) as PayloadResponse);
      } catch (e) {
        if (isMounted) setError(e instanceof Error ? e.message : "Lỗi tải payload");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    void load();
    return () => { isMounted = false; };
  }, [documentId]);

  function handleSaved() {
    setIsDirty(false);
    setSavedAt(new Date());
    onSaved?.();
  }

  const scope = payload?.template?.renderScope ?? "UNKNOWN_SCOPE";

  return (
    <div className="space-y-4">
      <BmFormMetaBar
        title="${displayName}"
        subtitle={\`Biểu mẫu TT 03/2026-VKSTC · Stage: ${m.stage} (${stageLabel}) · Group: ${m.group} · Scope: \${scope}\`}
        templateCode="${m.code}"
        isDirty={isDirty}
        isLoading={isLoading}
        errorMessage={error}
        warningMessage={warningMessage}
        savedAt={savedAt}
        meta={
          <div className="text-xs text-slate-500">
            <div>Stage: <span className="font-mono">${m.stage}</span></div>
            <div>Group: <span className="font-mono">${m.group}</span></div>
          </div>
        }
      />
      <div onInput={() => setIsDirty(true)}>
        <GenericTemplateFormInputsPanel documentId={documentId} onSaved={handleSaved} />
      </div>
    </div>
  );
}
`;
}

let created = 0;
let skipped = 0;
for (const m of MISSING) {
  const num = m.code.split('-')[1];
  const filename = `bm-${num}-form-inputs.tsx`;
  const outPath = path.join(OUT_DIR, filename);
  if (fs.existsSync(outPath)) {
    skipped += 1;
    continue;
  }
  fs.writeFileSync(outPath, makeComponent(m), 'utf8');
  created += 1;
}
console.log(`Created ${created} new stub components, skipped ${skipped} already-existing.`);
