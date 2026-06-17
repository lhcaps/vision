/**
 * QUANLYVKS - seed dữ liệu nghiệp vụ DEMO để dự án có thể "chạm vào dùng được",
 * không phải vỏ rỗng.
 *
 * Phạm vi:
 *  - 5 vụ án mẫu trải đủ 3 giai đoạn (RECEPTION / INVESTIGATION / PROSECUTION)
 *    và nhiều trạng thái (DRAFT / RECEIVED / IN_PROGRESS / WAITING_REVIEW).
 *  - 10+ người liên quan (bị can, bị hại, người bảo chữa) với thông tin hợp lệ.
 *  - Tội danh đã có trong seed chính (BLHS 2015).
 *  - Một số generated_documents ở trạng thái WAITING_REVIEW / APPROVED để
 *    trang /templates (review queue) có dữ liệu hiển thị.
 *
 * Nguyên tắc:
 *  - Idempotent: chạy nhiều lần vẫn an toàn (bỏ qua nếu case_code đã tồn tại).
 *  - Không seed dữ liệu ngẫu nhiên: tên/địa chỉ/CCCD là dữ liệu giả định hợp lệ.
 *  - Không đụng chạm templates/offenses đã có; chỉ thêm case + người + document.
 *
 * Chạy:
 *   cd apps/api && pnpm exec tsx prisma/seed-demo-cases.ts
 */

import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { PrismaClient, Prisma } from '@prisma/client';

// Load env giống seed chính.
loadEnv({ path: resolve(__dirname, '..', '..', '..', '..', '.env') });
loadEnv({ path: resolve(__dirname, '..', '..', '..', '.env') });
loadEnv({ path: resolve(__dirname, '..', '..', '.env') });

const prisma = new PrismaClient();

function dateOnly(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

interface CaseSpec {
  caseCode: string;
  nationalCaseCode: string;
  caseTitle: string;
  caseSummary: string;
  currentStage: 'RECEPTION' | 'INVESTIGATION' | 'PROSECUTION' | 'TRIAL_PREPARATION' | 'CLOSED';
  currentStatus: 'DRAFT' | 'RECEIVED' | 'IN_PROGRESS' | 'WAITING_REVIEW' | 'CLOSED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  wardCode: string | null;
  receivedDate: Date;
  acceptedDate: Date | null;
  prosecutedDate: Date | null;
  note: string | null;
  offenseCodes: string[];
  people: Array<{
    fullName: string;
    gender: 'MALE' | 'FEMALE' | 'UNKNOWN';
    birthYear: number;
    identityNo: string;
    occupation: string;
    permanentAddress: string;
    residenceAddress: string;
    roleType: 'ACCUSED' | 'VICTIM' | 'DEFENDANT_LAWYER' | 'INTERPRETER' | 'WITNESS';
    legalStatus: string | null;
    isPrimary: boolean;
  }>;
  documents: Array<{
    templateCode: string;
    documentTitle: string;
    reviewStatus: 'WAITING_REVIEW' | 'APPROVED' | 'NEEDS_REVISION' | 'GENERATED';
    targetPersonFullName: string | null;
    note: string;
  }>;
}

const CASES: CaseSpec[] = [
  {
    caseCode: 'VKS-2026-0001',
    nationalCaseCode: '01/2026/TM',
    caseTitle: 'Vụ án trộm cắp tài sản tại phường Bến Nghé',
    caseSummary:
      'Ngày 05/01/2026, Công an quận 1 tiếp nhận tin báo về vụ trộm cắp tài sản xảy ra tại phường Bến Nghé. Tài sản bị lấy gồm 1 laptop, 1 điện thoại, tổng giá trị khoảng 25 triệu đồng. Bị can khai nhận đã đột nhập vào nhà nạn nhân vào khoảng 2h sáng.',
    currentStage: 'RECEPTION',
    currentStatus: 'RECEIVED',
    priority: 'NORMAL',
    wardCode: 'Q1-BN',
    receivedDate: dateOnly(2026, 1, 5),
    acceptedDate: dateOnly(2026, 1, 8),
    prosecutedDate: null,
    note: 'Đã phân công KSV kiểm sát việc tiếp nhận, giải quyết nguồn tin.',
    offenseCodes: ['TDS_TROM_TS'],
    people: [
      {
        fullName: 'Trần Văn An',
        gender: 'MALE',
        birthYear: 1992,
        identityNo: '079092001234',
        occupation: 'Lao động tự do',
        permanentAddress: 'Số 12 đường Lê Lợi, phường Bến Nghé, quận 1, TP.HCM',
        residenceAddress: 'Số 12 đường Lê Lợi, phường Bến Nghé, quận 1, TP.HCM',
        roleType: 'ACCUSED',
        legalStatus: 'Bị can',
        isPrimary: true,
      },
      {
        fullName: 'Nguyễn Thị Bích Hà',
        gender: 'FEMALE',
        birthYear: 1988,
        identityNo: '079188005432',
        occupation: 'Nhân viên văn phòng',
        permanentAddress: 'Số 45 đường Nguyễn Huệ, phường Bến Nghé, quận 1, TP.HCM',
        residenceAddress: 'Số 45 đường Nguyễn Huệ, phường Bến Nghé, quận 1, TP.HCM',
        roleType: 'VICTIM',
        legalStatus: 'Người bị hại',
        isPrimary: false,
      },
    ],
    documents: [
      {
        templateCode: 'BM-001',
        documentTitle: 'Biên bản tiếp nhận nguồn tin về tội phạm',
        reviewStatus: 'APPROVED',
        targetPersonFullName: null,
        note: 'Biên bản do CAQ1 lập, VKS kiểm sát ngày 08/01/2026.',
      },
    ],
  },
  {
    caseCode: 'VKS-2026-0002',
    nationalCaseCode: '02/2026/TM',
    caseTitle: 'Vụ án lừa đảo chiếm đoạt tài sản qua mạng xã hội',
    caseSummary:
      'Bị can sử dụng tài khoản Facebook giả mạo để nhắn tin cho nhiều bị hại, nhận đặt cọc mua hàng điện tử với số tiền lớn rồi chiếm đoạt. Tổng số tiền chiếm đoạt khoảng 850 triệu đồng, có 7 bị hại trên địa bàn quận 1 và quận 3.',
    currentStage: 'INVESTIGATION',
    currentStatus: 'IN_PROGRESS',
    priority: 'HIGH',
    wardCode: 'Q1-NCT',
    receivedDate: dateOnly(2026, 2, 10),
    acceptedDate: dateOnly(2026, 2, 12),
    prosecutedDate: null,
    note: 'Bị can bị tạm giam, đang trong giai đoạn điều tra, KSV đã phê chuẩn lệnh bắt.',
    offenseCodes: ['TDS_LUA_DAO'],
    people: [
      {
        fullName: 'Lê Hoàng Nam',
        gender: 'MALE',
        birthYear: 1995,
        identityNo: '079095007654',
        occupation: 'Nhân viên kinh doanh',
        permanentAddress: 'Số 78 đường Cống Quỳnh, phường Nguyễn Cư Trinh, quận 1, TP.HCM',
        residenceAddress: 'Số 78 đường Cống Quỳnh, phường Nguyễn Cư Trinh, quận 1, TP.HCM',
        roleType: 'ACCUSED',
        legalStatus: 'Bị can - đang tạm giam',
        isPrimary: true,
      },
      {
        fullName: 'Phạm Thị Mai',
        gender: 'FEMALE',
        birthYear: 1990,
        identityNo: '079090003211',
        occupation: 'Kế toán',
        permanentAddress: 'Số 22 đường Trần Hưng Đạo, phường Nguyễn Cư Trinh, quận 1, TP.HCM',
        residenceAddress: 'Số 22 đường Trần Hưng Đạo, phường Nguyễn Cư Trinh, quận 1, TP.HCM',
        roleType: 'VICTIM',
        legalStatus: 'Người bị hại',
        isPrimary: false,
      },
      {
        fullName: 'Đỗ Quang Minh',
        gender: 'MALE',
        birthYear: 1975,
        identityNo: '079075001122',
        occupation: 'Luật sư',
        permanentAddress: 'Số 200 đường Nguyễn Thị Minh Khai, phường 6, quận 3, TP.HCM',
        residenceAddress: 'Số 200 đường Nguyễn Thị Minh Khai, phường 6, quận 3, TP.HCM',
        roleType: 'DEFENDANT_LAWYER',
        legalStatus: 'Người bào chữa',
        isPrimary: false,
      },
    ],
    documents: [
      {
        templateCode: 'BM-023',
        documentTitle: 'QĐ khởi tố vụ án hình sự',
        reviewStatus: 'APPROVED',
        targetPersonFullName: null,
        note: 'Đã khởi tố vụ án ngày 12/02/2026.',
      },
      {
        templateCode: 'BM-097',
        documentTitle: 'QĐ khởi tố bị can - Lê Hoàng Nam',
        reviewStatus: 'APPROVED',
        targetPersonFullName: 'Lê Hoàng Nam',
        note: 'Khởi tố bị can về tội Lừa đảo chiếm đoạt tài sản.',
      },
      {
        templateCode: 'BM-058',
        documentTitle: 'Lệnh tạm giam - Lê Hoàng Nam',
        reviewStatus: 'WAITING_REVIEW',
        targetPersonFullName: 'Lê Hoàng Nam',
        note: 'Lệnh tạm giam đang chờ phê chuẩn.',
      },
      {
        templateCode: 'BM-090',
        documentTitle: 'QĐ phê chuẩn QĐ khởi tố bị can',
        reviewStatus: 'WAITING_REVIEW',
        targetPersonFullName: 'Lê Hoàng Nam',
        note: 'QĐ phê chuẩn khởi tố bị can - chờ VKS trưởng duyệt.',
      },
    ],
  },
  {
    caseCode: 'VKS-2026-0003',
    nationalCaseCode: '03/2026/HC',
    caseTitle: 'Vụ án đánh bạc và tổ chức đánh bạc tại phường Bến Nghé',
    caseSummary:
      'Bị can tổ chức đánh bạc dưới hình thức số lô, số đề tại địa chỉ số 99 đường Pasteur, phường Bến Nghé, quận 1 với số tiền giao dịch khoảng 2,3 tỷ đồng trong 3 tháng. Bị can khác tham gia đánh bạc với vai trò người chơi.',
    currentStage: 'PROSECUTION',
    currentStatus: 'WAITING_REVIEW',
    priority: 'URGENT',
    wardCode: 'Q1-BN',
    receivedDate: dateOnly(2026, 3, 1),
    acceptedDate: dateOnly(2026, 3, 3),
    prosecutedDate: dateOnly(2026, 5, 15),
    note: 'Đã kết thúc điều tra, đang hoàn thiện cáo trạng để truy tố.',
    offenseCodes: ['TDS_DANH_BAC', 'TDS_TO_CHUC_DANH_BAC'],
    people: [
      {
        fullName: 'Võ Văn Cường',
        gender: 'MALE',
        birthYear: 1980,
        identityNo: '079080002233',
        occupation: 'Chủ cửa hàng',
        permanentAddress: 'Số 99 đường Pasteur, phường Bến Nghé, quận 1, TP.HCM',
        residenceAddress: 'Số 99 đường Pasteur, phường Bến Nghé, quận 1, TP.HCM',
        roleType: 'ACCUSED',
        legalStatus: 'Bị can - tổ chức đánh bạc',
        isPrimary: true,
      },
      {
        fullName: 'Ngô Thanh Hùng',
        gender: 'MALE',
        birthYear: 1985,
        identityNo: '079085004455',
        occupation: 'Tài xế',
        permanentAddress: 'Số 14 đường Đồng Khởi, phường Bến Nghé, quận 1, TP.HCM',
        residenceAddress: 'Số 14 đường Đồng Khởi, phường Bến Nghé, quận 1, TP.HCM',
        roleType: 'ACCUSED',
        legalStatus: 'Bị can - đánh bạc',
        isPrimary: false,
      },
    ],
    documents: [
      {
        templateCode: 'BM-023',
        documentTitle: 'QĐ khởi tố vụ án hình sự',
        reviewStatus: 'APPROVED',
        targetPersonFullName: null,
        note: 'Khởi tố vụ án đánh bạc.',
      },
      {
        templateCode: 'BM-097',
        documentTitle: 'QĐ khởi tố bị can - Võ Văn Cường',
        reviewStatus: 'APPROVED',
        targetPersonFullName: 'Võ Văn Cường',
        note: 'Khởi tố bị can về tội Tổ chức đánh bạc.',
      },
      {
        templateCode: 'BM-156',
        documentTitle: 'Cáo trạng truy tố Võ Văn Cường và đồng phạm',
        reviewStatus: 'WAITING_REVIEW',
        targetPersonFullName: 'Võ Văn Cường',
        note: 'Cáo trạng đã soạn xong, chờ Trưởng phòng duyệt.',
      },
    ],
  },
  {
    caseCode: 'VKS-2026-0004',
    nationalCaseCode: '04/2026/MT',
    caseTitle: 'Vụ án tàng trữ trái phép chất ma túy',
    caseSummary:
      'Bị can tàng trữ 0,8 gam heroin tại nơi cư trú. Bị phát hiện qua tin báo của quần chúng nhân dân. Bị can khai nhận mua ma túy từ một người không rõ lai lịch với giá 5 triệu đồng để sử dụng cá nhân.',
    currentStage: 'INVESTIGATION',
    currentStatus: 'IN_PROGRESS',
    priority: 'URGENT',
    wardCode: 'Q1-NCT',
    receivedDate: dateOnly(2026, 4, 18),
    acceptedDate: dateOnly(2026, 4, 20),
    prosecutedDate: null,
    note: 'Bị can đang bị tạm giam, chờ kết quả giám định ma túy.',
    offenseCodes: ['TDS_CHOI_MA_TUY'],
    people: [
      {
        fullName: 'Bùi Quốc Đạt',
        gender: 'MALE',
        birthYear: 1993,
        identityNo: '079093005566',
        occupation: 'Thợ sửa xe',
        permanentAddress: 'Số 56 đường Nguyễn Trãi, phường Nguyễn Cư Trinh, quận 1, TP.HCM',
        residenceAddress: 'Số 56 đường Nguyễn Trãi, phường Nguyễn Cư Trinh, quận 1, TP.HCM',
        roleType: 'ACCUSED',
        legalStatus: 'Bị can - tạm giam',
        isPrimary: true,
      },
    ],
    documents: [
      {
        templateCode: 'BM-023',
        documentTitle: 'QĐ khởi tố vụ án hình sự',
        reviewStatus: 'APPROVED',
        targetPersonFullName: null,
        note: 'Khởi tố vụ án ma túy.',
      },
      {
        templateCode: 'BM-097',
        documentTitle: 'QĐ khởi tố bị can - Bùi Quốc Đạt',
        reviewStatus: 'APPROVED',
        targetPersonFullName: 'Bùi Quốc Đạt',
        note: 'Khởi tố bị can tàng trữ trái phép chất ma túy.',
      },
      {
        templateCode: 'BM-053',
        documentTitle: 'Lệnh cấm đi khỏi nơi cư trú - Bùi Quốc Đạt',
        reviewStatus: 'WAITING_REVIEW',
        targetPersonFullName: 'Bùi Quốc Đạt',
        note: 'Đang xem xét biện pháp cấm đi khỏi nơi cư trú.',
      },
    ],
  },
  {
    caseCode: 'VKS-2026-0005',
    nationalCaseCode: '05/2026/HC',
    caseTitle: 'Vụ án cố ý gây thương tích trong mâu thuẫn gia đình',
    caseSummary:
      'Do mâu thuẫn về tài sản giữa anh em trong gia đình, bị can đã dùng dao tấn công bị hại gây thương tích 18% tỷ lệ tổn thương cơ thể. Vụ việc xảy ra tại phường Bến Nghé, quận 1. Hiện đang trong giai đoạn xác minh, giải quyết nguồn tin.',
    currentStage: 'RECEPTION',
    currentStatus: 'DRAFT',
    priority: 'NORMAL',
    wardCode: 'Q1-BN',
    receivedDate: dateOnly(2026, 6, 1),
    acceptedDate: null,
    prosecutedDate: null,
    note: 'Mới tiếp nhận, đang phân công KSV kiểm sát nguồn tin.',
    offenseCodes: ['TDS_CO_Y_GAY_THUONG_TICH'],
    people: [
      {
        fullName: 'Đặng Văn Hùng',
        gender: 'MALE',
        birthYear: 1987,
        identityNo: '079087006677',
        occupation: 'Kinh doanh',
        permanentAddress: 'Số 34 đường Hai Bà Trưng, phường Bến Nghé, quận 1, TP.HCM',
        residenceAddress: 'Số 34 đường Hai Bà Trưng, phường Bến Nghé, quận 1, TP.HCM',
        roleType: 'ACCUSED',
        legalStatus: 'Nghi phạm',
        isPrimary: true,
      },
      {
        fullName: 'Đặng Văn Khoa',
        gender: 'MALE',
        birthYear: 1985,
        identityNo: '079085007788',
        occupation: 'Công nhân',
        permanentAddress: 'Số 34 đường Hai Bà Trưng, phường Bến Nghé, quận 1, TP.HCM',
        residenceAddress: 'Số 34 đường Hai Bà Trưng, phường Bến Nghé, quận 1, TP.HCM',
        roleType: 'VICTIM',
        legalStatus: 'Người bị hại',
        isPrimary: false,
      },
    ],
    documents: [],
  },
];

async function main(): Promise<void> {
  console.log('[seed-demo] Bắt đầu seed dữ liệu demo vụ án.');
  console.log(`[seed-demo] DATABASE_URL: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@') ?? '(không có)'}`);

  const admin = await prisma.officials.findFirst({
    where: { username: 'admin' },
  });
  if (!admin) {
    throw new Error('Không tìm thấy official admin. Hãy chạy pnpm db:seed trước.');
  }

  const wards = await prisma.wards.findMany();
  const wardByCode = new Map(wards.map((w) => [w.ward_code ?? '', w]));

  const offenses = await prisma.offenses.findMany();
  const offenseByCode = new Map(offenses.map((o) => [o.offense_code ?? '', o]));

  const templates = await prisma.templates.findMany();
  const templateByCode = new Map(templates.map((t) => [t.template_code, t]));

  let caseCreated = 0;
  let caseSkipped = 0;
  let peopleCreated = 0;
  let peopleReused = 0;
  let caseOffenseCreated = 0;
  let assignmentCreated = 0;
  let documentCreated = 0;
  let documentSkipped = 0;
  let evidenceCreated = 0;

  for (const spec of CASES) {
    const existing = await prisma.cases.findFirst({
      where: { case_code: spec.caseCode },
    });
    if (existing) {
      console.log(`[seed-demo] case ${spec.caseCode} đã tồn tại (id=${existing.id}), bỏ qua.`);
      caseSkipped += 1;
      continue;
    }

    const ward = spec.wardCode ? wardByCode.get(spec.wardCode) ?? null : null;

    const created = await prisma.cases.create({
      data: {
        case_code: spec.caseCode,
        national_case_code: spec.nationalCaseCode,
        case_title: spec.caseTitle,
        case_summary: spec.caseSummary,
        case_type: 'CRIMINAL_CASE',
        source_type: 'REPORT_FROM_POLICE',
        current_stage: spec.currentStage,
        current_status: spec.currentStatus,
        ward_id: ward?.id ?? null,
        agency_id: admin.agency_id ?? null,
        received_date: spec.receivedDate,
        accepted_date: spec.acceptedDate,
        prosecuted_date: spec.prosecutedDate,
        priority: spec.priority,
        note: spec.note,
        created_by_name: admin.full_name,
        updated_by_name: admin.full_name,
      },
    });
    caseCreated += 1;
    console.log(`[seed-demo] tạo case ${spec.caseCode} (id=${created.id})`);

    await prisma.case_events.create({
      data: {
        case_id: created.id,
        event_type: 'CASE_CREATED',
        event_title: 'Tạo hồ sơ',
        event_description: `Tạo hồ sơ ${spec.caseCode}`,
        stage_code: spec.currentStage,
        status_after: spec.currentStatus,
        created_by_name: admin.full_name,
      },
    });

    let personOrder = 0;
    const personIdByFullName = new Map<string, bigint>();
    for (const p of spec.people) {
      personOrder += 1;
      const existingPerson = await prisma.people.findFirst({
        where: { full_name: p.fullName, is_deleted: false },
      });
      const person = existingPerson
        ? await prisma.people.update({
            where: { id: existingPerson.id },
            data: {
              gender: p.gender,
              birth_year: p.birthYear,
              identity_no: p.identityNo,
              occupation: p.occupation,
              permanent_address: p.permanentAddress,
              residence_address: p.residenceAddress,
              nationality: 'Việt Nam',
              updated_at: new Date(),
            },
          })
        : await prisma.people.create({
            data: {
              full_name: p.fullName,
              gender: p.gender,
              birth_year: p.birthYear,
              identity_no: p.identityNo,
              occupation: p.occupation,
              permanent_address: p.permanentAddress,
              residence_address: p.residenceAddress,
              nationality: 'Việt Nam',
            },
          });
      personIdByFullName.set(p.fullName, person.id);
      if (existingPerson) {
        peopleReused += 1;
      } else {
        peopleCreated += 1;
      }

      await prisma.case_people.create({
        data: {
          case_id: created.id,
          person_id: person.id,
          role_type: p.roleType,
          person_order: personOrder,
          legal_status: p.legalStatus,
          is_primary: p.isPrimary,
          is_active: true,
        },
      });

      await prisma.case_events.create({
        data: {
          case_id: created.id,
          event_type: 'CASE_PERSON_ADDED',
          event_title: 'Thêm người liên quan',
          event_description: `Thêm ${p.fullName} với vai trò ${p.roleType}`,
          stage_code: spec.currentStage,
          related_person_id: person.id,
          created_by_name: admin.full_name,
        },
      });
    }

    for (const offenseCode of spec.offenseCodes) {
      const offense = offenseByCode.get(offenseCode);
      if (!offense) {
        console.warn(`[seed-demo]   ! bỏ qua tội danh ${offenseCode} (chưa seed trong DB).`);
        continue;
      }
      const primaryAccused = spec.people.find((p) => p.roleType === 'ACCUSED' && p.isPrimary);
      const personId = primaryAccused
        ? personIdByFullName.get(primaryAccused.fullName) ?? null
        : null;
      await prisma.case_offenses.create({
        data: {
          case_id: created.id,
          person_id: personId,
          offense_id: offense.id,
          offense_description: `Hành vi phạm tội thuộc ${offense.offense_name}`,
          is_primary: true,
        },
      });
      caseOffenseCreated += 1;
    }

    await prisma.case_assignments.create({
      data: {
        case_id: created.id,
        official_id: admin.id,
        assignment_role: 'KIEM_SAT_VIEN',
        assigned_date: spec.acceptedDate ?? spec.receivedDate,
        decision_no: `QĐ-PC/${spec.caseCode}`,
        decision_date: spec.acceptedDate ?? spec.receivedDate,
        note: 'Phân công KSV xử lý hồ sơ.',
        is_active: true,
      },
    });
    assignmentCreated += 1;

    if (spec.currentStage === 'INVESTIGATION' || spec.currentStage === 'PROSECUTION') {
      const evidenceItems = [
        {
          evidence_code: `VC-${spec.caseCode}-01`,
          evidence_name:
            spec.offenseCodes[0] === 'TDS_LUA_DAO'
              ? 'Điện thoại di động iPhone 14 Pro Max (tang vật)'
              : spec.offenseCodes[0] === 'TDS_DANH_BAC'
                ? 'Sổ ghi số lô, số đề'
                : spec.offenseCodes[0] === 'TDS_CHOI_MA_TUY'
                  ? 'Túi nilon chứa chất bột trắng (ma túy)'
                  : 'Con dao nhọn (tang vật)',
          evidence_type: 'TANG_VAT',
          quantity: '1',
          unit: 'cái',
          description: 'Tang vật thu giữ tại hiện trường, đã niêm phong.',
          current_status: 'SEIZED',
          storage_location: 'Kho vật chứng Công an quận 1',
        },
      ];
      const ownerId = personIdByFullName.get(spec.people[0]?.fullName ?? '') ?? null;
      for (const e of evidenceItems) {
        await prisma.evidence_items.create({
          data: {
            case_id: created.id,
            evidence_code: e.evidence_code,
            evidence_name: e.evidence_name,
            evidence_type: e.evidence_type,
            quantity: e.quantity,
            unit: e.unit,
            description: e.description,
            current_status: e.current_status,
            storage_location: e.storage_location,
            owner_person_id: ownerId,
          },
        });
        evidenceCreated += 1;
      }
    }

    for (const doc of spec.documents) {
      const template = templateByCode.get(doc.templateCode);
      if (!template) {
        console.warn(`[seed-demo]   ! bỏ qua document ${doc.templateCode} (template chưa seed).`);
        documentSkipped += 1;
        continue;
      }
      const targetPersonId = doc.targetPersonFullName
        ? personIdByFullName.get(doc.targetPersonFullName) ?? null
        : null;
      const version = await prisma.template_versions.findFirst({
        where: { template_id: template.id, is_default: true },
        orderBy: { version_no: 'desc' },
      });
      const reviewStatus = doc.reviewStatus;
      const generatedDoc = await prisma.generated_documents.create({
        data: {
          case_id: created.id,
          template_id: template.id,
          template_version_id: version?.id ?? null,
          document_code: `${doc.templateCode}/${spec.caseCode}/01`,
          document_title: doc.documentTitle,
          target_scope: targetPersonId ? 'PERSON_LEVEL' : 'CASE_LEVEL',
          target_person_id: targetPersonId,
          review_status: reviewStatus,
          render_payload_snapshot: {
            caseCode: spec.caseCode,
            templateCode: doc.templateCode,
            targetPersonId: targetPersonId ? String(targetPersonId) : null,
            source: 'seed-demo-cases',
          } as Prisma.InputJsonValue,
          generated_by_name: admin.full_name,
          approved_by_name: reviewStatus === 'APPROVED' ? admin.full_name : null,
          approved_at: reviewStatus === 'APPROVED' ? new Date() : null,
          note: doc.note,
        },
      });
      documentCreated += 1;

      if (reviewStatus === 'APPROVED') {
        await prisma.document_reviews.create({
          data: {
            generated_document_id: generatedDoc.id,
            review_action: 'APPROVE',
            reviewer_name: admin.full_name,
            review_note: 'Phê duyệt biểu mẫu sau kiểm tra nội dung.',
            old_status: 'WAITING_REVIEW',
            new_status: 'APPROVED',
          },
        });
      }
    }
  }

  console.log(
    `[seed-demo] Done. ` +
      `cases: created=${caseCreated}, skipped=${caseSkipped}; ` +
      `people: created=${peopleCreated}, reused=${peopleReused}; ` +
      `case_offenses=${caseOffenseCreated}; ` +
      `assignments=${assignmentCreated}; ` +
      `evidence=${evidenceCreated}; ` +
      `generated_documents: created=${documentCreated}, skipped=${documentSkipped}.`,
  );
}

main()
  .catch((error) => {
    console.error('[seed-demo] Lỗi:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
