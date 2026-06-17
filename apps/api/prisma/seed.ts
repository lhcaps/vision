/**
 * QUANLYVKS - seed dữ liệu NGHIỆP VỤ cho môi trường dev.
 *
 * Nguyên tắc:
 *  - Chỉ seed dữ liệu nghiệp vụ THẬT (template metadata, danh mục tội danh theo BLHS,
 *    ward địa bàn, storage_settings, agency duy nhất).
 *  - KHÔNG seed case / people / bị can demo — user phải tự nhập từ UI.
 *  - 1 official "admin" được tạo từ env (SEED_ADMIN_FULL_NAME) để đăng nhập.
 *
 * Chạy: pnpm db:seed
 * Hoặc:  pnpm --filter api exec tsx prisma/seed.ts
 */

import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PrismaClient, Prisma } from '@prisma/client';
import { hashPassword } from '../src/modules/auth/password.util';
import {
  buildSeedTemplates,
  discoverImplementedTemplateCodes,
  discoverNormalizedDocxByCode,
  discoverOriginalTemplateFilesByCode,
  getSeedAdminConfig,
} from '../src/seed/seed-config';

// Load env từ root (file chính) rồi apps/api/.env (override nếu cần).
loadEnv({ path: resolve(__dirname, '..', '..', '..', '..', '.env') });
loadEnv({ path: resolve(__dirname, '..', '..', '..', '.env') });
loadEnv({ path: resolve(__dirname, '..', '..', '.env') });

const prisma = new PrismaClient();
const REPO_ROOT = resolve(__dirname, '..', '..', '..');

// ============================================================================
// 1. AGENCY (1 bản ghi duy nhất - lấy từ env)
// ============================================================================

interface SeedAgency {
  agency_code: string;
  agency_name: string;
  agency_type: 'VKS' | 'VKS_KV' | 'VKS_TINH' | 'VKS_CAP_CAO';
  parent_agency_name: string | null;
  address: string | null;
  phone: string | null;
}

function getSeedAgency(): SeedAgency {
  return {
    agency_code: process.env.SEED_AGENCY_CODE || 'VKS-DEFAULT',
    agency_name: process.env.SEED_AGENCY_NAME || 'Viện kiểm sát',
    agency_type: 'VKS_KV',
    parent_agency_name: process.env.SEED_PARENT_AGENCY_NAME || null,
    address: null,
    phone: null,
  };
}

async function seedAgencies(): Promise<bigint> {
  const seed = getSeedAgency();
  const existing = await prisma.agencies.findFirst({
    where: { agency_code: seed.agency_code },
  });
  if (existing) {
    console.log(`[seed] agencies: ${seed.agency_code} đã có (id=${existing.id}), bỏ qua.`);
    return existing.id;
  }

  let parentId: bigint | null = null;
  if (seed.parent_agency_name) {
    const parent = await prisma.agencies.findFirst({
      where: { agency_name: seed.parent_agency_name },
    });
    if (parent) parentId = parent.id;
    else {
      const created = await prisma.agencies.create({
        data: {
          agency_name: seed.parent_agency_name,
          agency_type: 'VKS_TINH',
        },
      });
      parentId = created.id;
      console.log(`[seed] agencies: tạo parent '${seed.parent_agency_name}' id=${parentId}`);
    }
  }

  const created = await prisma.agencies.create({
    data: {
      agency_code: seed.agency_code,
      agency_name: seed.agency_name,
      agency_type: seed.agency_type,
      parent_agency_id: parentId,
      address: seed.address,
      phone: seed.phone,
    },
  });
  console.log(`[seed] agencies: tạo '${seed.agency_name}' (${seed.agency_code}) id=${created.id}`);
  return created.id;
}

// ============================================================================
// 2. OFFICIALS (1 official "admin" lấy tên từ env SEED_ADMIN_FULL_NAME)
// ============================================================================

async function seedOfficials(agencyId: bigint): Promise<bigint> {
  const admin = getSeedAdminConfig();
  const passwordHash = hashPassword(admin.password);

  const existing = await prisma.officials.findFirst({
    where: {
      OR: [{ username: admin.username }, { full_name: admin.fullName }],
    },
  });
  if (existing) {
    const updated = await prisma.officials.update({
      where: { id: existing.id },
      data: {
        full_name: admin.fullName,
        username: admin.username,
        password_hash: passwordHash,
        position_title: admin.positionTitle,
        agency_id: agencyId,
        role: 'ADMIN',
        is_active: true,
      },
    });
    console.log(`[seed] officials: admin '${admin.username}' ready (id=${updated.id}).`);
    return updated.id;
  }

  const created = await prisma.officials.create({
    data: {
      full_name: admin.fullName,
      username: admin.username,
      password_hash: passwordHash,
      position_title: admin.positionTitle,
      rank_title: null,
      agency_id: agencyId,
      role: 'ADMIN',
      is_active: true,
    },
  });
  console.log(`[seed] officials: created admin '${admin.username}' at agency id=${agencyId}.`);
  return created.id;
}

async function seedLegacyOfficialsUnused(agencyId: bigint): Promise<void> {
  const adminName = process.env.SEED_ADMIN_FULL_NAME?.trim();
  const adminUsername = (
    process.env.SEED_ADMIN_USERNAME?.trim() || 'admin'
  ).toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD?.trim();
  if (!adminName) {
    console.log('[seed] officials: bỏ qua (chưa cấu hình SEED_ADMIN_FULL_NAME trong .env).');
    return;
  }

  if (!adminPassword) {
    console.log('[seed] officials: bo qua admin credential (chua cau hinh SEED_ADMIN_PASSWORD).');
    return;
  }

  const passwordHash = hashPassword(adminPassword);

  const existing = await prisma.officials.findFirst({
    where: {
      OR: [{ username: adminUsername }, { full_name: adminName }],
    },
  });
  if (existing) {
    await prisma.officials.update({
      where: { id: existing.id },
      data: {
        full_name: adminName,
        username: adminUsername,
        password_hash: passwordHash,
        position_title:
          process.env.SEED_ADMIN_POSITION?.trim() || existing.position_title,
        agency_id: agencyId,
        role: 'ADMIN',
        is_active: true,
      },
    });
    console.log(`[seed] officials: '${adminName}' đã có (id=${existing.id}), bỏ qua.`);
    return;
  }

  await prisma.officials.create({
    data: {
      full_name: adminName,
      username: adminUsername,
      password_hash: passwordHash,
      position_title: process.env.SEED_ADMIN_POSITION?.trim() || 'Kiểm sát viên',
      rank_title: null,
      agency_id: agencyId,
      role: 'ADMIN',
      is_active: true,
    },
  });
  console.log(`[seed] officials: tạo admin '${adminName}' tại agency id=${agencyId}.`);
}

// ============================================================================
// 3. WARDS (1 ward mẫu — địa bàn hành chính chuẩn)
// ============================================================================

async function seedWards(): Promise<void> {
  const sampleWards = [
    { ward_code: 'Q1-BN', ward_name: 'Phường Bến Nghé', district_name: 'Quận 1', province_name: 'TP. Hồ Chí Minh' },
    { ward_code: 'Q1-NCT', ward_name: 'Phường Nguyễn Cư Trinh', district_name: 'Quận 1', province_name: 'TP. Hồ Chí Minh' },
  ];

  for (const w of sampleWards) {
    const existing = await prisma.wards.findFirst({ where: { ward_code: w.ward_code } });
    if (existing) continue;
    await prisma.wards.create({ data: w });
    console.log(`[seed] wards: tạo '${w.ward_name}' (${w.ward_code}).`);
  }
}

// ============================================================================
// 4. OFFENSES (Danh mục tội danh theo Bộ luật Hình sự 2015 - THẬT)
// ============================================================================

interface SeedOffense {
  offense_code: string;
  offense_name: string;
  offense_group: string;
  description: string;
  legal_article_no?: string;
  legal_article_text?: string;
}

const OFFENSES: SeedOffense[] = [
  // Trật tự quản lý kinh tế
  { offense_code: 'TDS_TROM_TS', offense_name: 'Trộm cắp tài sản', offense_group: 'TTQLKT', description: 'Điều 173 BLHS 2015', legal_article_no: '173', legal_article_text: 'Tội trộm cắp tài sản' },
  { offense_code: 'TDS_LUA_DAO', offense_name: 'Lừa đảo chiếm đoạt tài sản', offense_group: 'TTQLKT', description: 'Điều 174 BLHS 2015', legal_article_no: '174', legal_article_text: 'Tội lừa đảo chiếm đoạt tài sản' },
  { offense_code: 'TDS_LAM_DUNG_TIN_NHIEM', offense_name: 'Lạm dụng tín nhiệm chiếm đoạt tài sản', offense_group: 'TTQLKT', description: 'Điều 175 BLHS 2015', legal_article_no: '175', legal_article_text: 'Tội lạm dụng tín nhiệm chiếm đoạt tài sản' },
  { offense_code: 'TDS_CHIEM_DOAT_TS', offense_name: 'Chiếm đoạt tài sản', offense_group: 'TTQLKT', description: 'Điều 176 BLHS 2015', legal_article_no: '176', legal_article_text: 'Tội chiếm đoạt tài sản' },
  { offense_code: 'TDS_DANH_BAC', offense_name: 'Đánh bạc', offense_group: 'TTQLKT', description: 'Điều 321 BLHS 2015', legal_article_no: '321', legal_article_text: 'Tội đánh bạc' },
  { offense_code: 'TDS_TO_CHUC_DANH_BAC', offense_name: 'Tổ chức đánh bạc', offense_group: 'TTQLKT', description: 'Điều 322 BLHS 2015', legal_article_no: '322', legal_article_text: 'Tội tổ chức đánh bạc' },
  { offense_code: 'TDS_CHOI_MA_TUY', offense_name: 'Tàng trữ trái phép chất ma túy', offense_group: 'TTQLKT', description: 'Điều 249 BLHS 2015', legal_article_no: '249', legal_article_text: 'Tội tàng trữ trái phép chất ma túy' },
  { offense_code: 'TDS_MUA_BAN_MA_TUY', offense_name: 'Mua bán trái phép chất ma túy', offense_group: 'TTQLKT', description: 'Điều 251 BLHS 2015', legal_article_no: '251', legal_article_text: 'Tội mua bán trái phép chất ma túy' },
  { offense_code: 'TDS_VAN_CHUYEN_MA_TUY', offense_name: 'Vận chuyển trái phép chất ma túy', offense_group: 'TTQLKT', description: 'Điều 250 BLHS 2015', legal_article_no: '250', legal_article_text: 'Tội vận chuyển trái phép chất ma túy' },
  // Tội xâm phạm tính mạng, sức khỏe
  { offense_code: 'TDS_GIET_NGUOI', offense_name: 'Giết người', offense_group: 'XP_TM_SK', description: 'Điều 123 BLHS 2015', legal_article_no: '123', legal_article_text: 'Tội giết người' },
  { offense_code: 'TDS_CO_Y_GAY_THUONG_TICH', offense_name: 'Cố ý gây thương tích', offense_group: 'XP_TM_SK', description: 'Điều 134 BLHS 2015', legal_article_no: '134', legal_article_text: 'Tội cố ý gây thương tích' },
  // Xâm phạm nhân phẩm
  { offense_code: 'TDS_HIEPC_DAM', offense_name: 'Hiếp dâm', offense_group: 'XP_NP_TD', description: 'Điều 141 BLHS 2015', legal_article_no: '141', legal_article_text: 'Tội hiếp dâm' },
  { offense_code: 'TDS_DAM_O', offense_name: 'Dâm ô với người dưới 16 tuổi', offense_group: 'XP_NP_TD', description: 'Điều 146 BLHS 2015', legal_article_no: '146', legal_article_text: 'Tội dâm ô với người dưới 16 tuổi' },
  // Tội về ma túy bổ sung
  { offense_code: 'TDS_SAN_XUAT_MA_TUY', offense_name: 'Sản xuất trái phép chất ma túy', offense_group: 'XP_PL_MT', description: 'Điều 248 BLHS 2015', legal_article_no: '248', legal_article_text: 'Tội sản xuất trái phép chất ma túy' },
  { offense_code: 'TDS_CHE_BIEN_MA_TUY', offense_name: 'Chế biến trái phép chất ma túy', offense_group: 'XP_PL_MT', description: 'Điều 248 BLHS 2015', legal_article_no: '248', legal_article_text: 'Tội chế biến trái phép chất ma túy' },
  // Xâm phạm sở hữu bổ sung
  { offense_code: 'TDS_HUY_HOAI_TS', offense_name: 'Hủy hoại hoặc cố ý làm hư hỏng tài sản', offense_group: 'XP_SH', description: 'Điều 178 BLHS 2015', legal_article_no: '178', legal_article_text: 'Tội hủy hoại hoặc cố ý làm hư hỏng tài sản' },
  { offense_code: 'TDS_CUOP_TS', offense_name: 'Cướp tài sản', offense_group: 'XP_SH', description: 'Điều 168 BLHS 2015', legal_article_no: '168', legal_article_text: 'Tội cướp tài sản' },
  { offense_code: 'TDS_CUOP_GIAT_TS', offense_name: 'Cướp giật tài sản', offense_group: 'XP_SH', description: 'Điều 171 BLHS 2015', legal_article_no: '171', legal_article_text: 'Tội cướp giật tài sản' },
  // An toàn giao thông
  { offense_code: 'TDS_VI_PHAM_ATGT', offense_name: 'Vi phạm quy định về tham gia giao thông đường bộ', offense_group: 'XP_ATGT', description: 'Điều 260 BLHS 2015', legal_article_no: '260', legal_article_text: 'Tội vi phạm quy định về tham gia giao thông đường bộ' },
  // Trốn thuế
  { offense_code: 'TDS_TRON_THUE', offense_name: 'Trốn thuế', offense_group: 'TTQLKT', description: 'Điều 200 BLHS 2015', legal_article_no: '200', legal_article_text: 'Tội trốn thuế' },
  // Tham nhũng
  { offense_code: 'TDS_THAM_O_TS', offense_name: 'Tham ô tài sản', offense_group: 'CHUC_VU', description: 'Điều 353 BLHS 2015', legal_article_no: '353', legal_article_text: 'Tội tham ô tài sản' },
  { offense_code: 'TDS_NHAN_HOI_LO', offense_name: 'Nhận hối lộ', offense_group: 'CHUC_VU', description: 'Điều 354 BLHS 2015', legal_article_no: '354', legal_article_text: 'Tội nhận hối lộ' },
  // Tội về thông tin
  { offense_code: 'TDS_DANG_TIN_SAI_SUThat', offense_name: 'Đăng tải thông tin sai sự thật trên mạng', offense_group: 'CNTT', description: 'Điều 288 BLHS 2015', legal_article_no: '288', legal_article_text: 'Tội đăng tải thông tin sai sự thật trên mạng' },
  // Tội về môi trường
  { offense_code: 'TDS_O_NHIEM_MOI_TRUONG', offense_name: 'Gây ô nhiễm môi trường', offense_group: 'MOI_TRUONG', description: 'Điều 235 BLHS 2015', legal_article_no: '235', legal_article_text: 'Tội gây ô nhiễm môi trường' },
  // Tội phá hoại
  { offense_code: 'TDS_PHA_HOAI_TS_CN', offense_name: 'Phá hoại tài sản công', offense_group: 'XP_SH', description: 'Điều 339 BLHS 2015', legal_article_no: '339', legal_article_text: 'Tội phá hoại tài sản' },
  // Tội về quyền tự do
  { offense_code: 'TDS_BAT_GIU_NGUOI_TRAI_PHEP', offense_name: 'Bắt, giữ hoặc giam người trái pháp luật', offense_group: 'XP_TU_DO', description: 'Điều 157 BLHS 2015', legal_article_no: '157', legal_article_text: 'Tội bắt, giữ hoặc giam người trái pháp luật' },
  // Tội về tài sản bổ sung
  { offense_code: 'TDS_BUOC_TS', offense_name: 'Cưỡng đoạt tài sản', offense_group: 'XP_SH', description: 'Điều 170 BLHS 2015', legal_article_no: '170', legal_article_text: 'Tội cưỡng đoạt tài sản' },
  { offense_code: 'TDS_SAN_XUAT_KINH_DOANH_HANG_GIA', offense_name: 'Sản xuất, buôn bán hàng giả', offense_group: 'TTQLKT', description: 'Điều 192 BLHS 2015', legal_article_no: '192', legal_article_text: 'Tội sản xuất, buôn bán hàng giả' },
  { offense_code: 'TDS_VAN_CHUYEN_HANG_GIA', offense_name: 'Vận chuyển hàng hóa trái phép', offense_group: 'TTQLKT', description: 'Điều 188 BLHS 2015', legal_article_no: '188', legal_article_text: 'Tội vận chuyển hàng hóa trái phép' },
  { offense_code: 'TDS_CHEM_GIET_DONG_VAT_HOANG_DA', offense_name: 'Săn bắt, giết động vật hoang dã trái phép', offense_group: 'MOI_TRUONG', description: 'Điều 234 BLHS 2015', legal_article_no: '234', legal_article_text: 'Tội săn bắt, giết động vật hoang dã trái phép' },
];

async function seedOffenses(): Promise<void> {
  let createdCount = 0;
  for (const o of OFFENSES) {
    const existing = await prisma.offenses.findFirst({
      where: { offense_code: o.offense_code },
    });
    if (existing) continue;

    await prisma.$transaction(async (tx) => {
      const offense = await tx.offenses.create({
        data: {
          offense_code: o.offense_code,
          offense_name: o.offense_name,
          offense_group: o.offense_group,
          description: `${o.description} - ${o.legal_article_text ?? ''}`,
        },
      });
      // Tạo kèm legal_article tương ứng (nếu có article_no).
      if (o.legal_article_no) {
        const existingArticle = await tx.legal_articles.findFirst({
          where: { article_no: o.legal_article_no },
        });
        if (!existingArticle) {
          await tx.legal_articles.create({
            data: {
              article_no: o.legal_article_no,
              display_text: o.legal_article_text ?? o.offense_name,
              description: o.legal_article_text ?? o.offense_name,
            },
          });
        }
      }
    });
    createdCount += 1;
  }
  console.log(`[seed] offenses: tạo ${createdCount} tội danh theo BLHS 2015.`);
}

// ============================================================================
// 5. TEMPLATE GROUPS (4 nhóm nghiệp vụ VKS)
// ============================================================================

async function seedTemplateGroups(): Promise<Record<string, bigint>> {
  const groups = [
    { group_code: 'G01', group_name: 'Tiếp nhận - Phân công', group_order: 1, description: 'Giai đoạn tiếp nhận tin báo và phân công Kiểm sát viên' },
    { group_code: 'G02', group_name: 'Kiểm sát điều tra', group_order: 2, description: 'Giai đoạn kiểm sát việc khởi tố, điều tra vụ án' },
    { group_code: 'G03', group_name: 'Kiểm sát truy tố', group_order: 3, description: 'Giai đoạn kiểm sát việc ra Cáo trạng, Quyết định truy tố' },
    { group_code: 'G04', group_name: 'Kiểm sát xét xử', group_order: 4, description: 'Giai đoạn kiểm sát xét xử sơ thẩm, phúc thẩm' },
  ];

  const ids: Record<string, bigint> = {};
  for (const g of groups) {
    const existing = await prisma.template_groups.findFirst({ where: { group_code: g.group_code } });
    if (existing) {
      ids[g.group_code] = existing.id;
      continue;
    }
    const created = await prisma.template_groups.create({ data: g });
    ids[g.group_code] = created.id;
  }
  console.log(`[seed] template_groups: ${groups.length} nhóm nghiệp vụ.`);
  return ids;
}

// ============================================================================
// 6. TEMPLATES (14 biểu mẫu đã implement đầy đủ)
// ============================================================================

interface SeedTemplate {
  template_code: string;
  template_no: string;
  template_name: string;
  group_code: string;
  stage_code: string;
  source_file_name: string;
  render_scope?: string;
  output_strategy?: string;
  default_output_formats?: string[];
  description: string;
}

const TEMPLATES: SeedTemplate[] = [
  { template_code: 'BM-001', template_no: '01', template_name: 'Tin báo tố giác tội phạm', group_code: 'G01', stage_code: 'TIEP_NHAN', source_file_name: 'BM-001_TBTG.docx', description: 'Biên bản tiếp nhận tin báo tố giác tội phạm', default_output_formats: ['docx', 'pdf'] },
  { template_code: 'BM-031', template_no: '31', template_name: 'Lệnh bắt người bị giữ trong trường hợp khẩn cấp', group_code: 'G01', stage_code: 'BP_NGAN_CHAN', source_file_name: 'BM-031_LenhBatNguoiBiGiuKhanCap.docx', description: 'Lệnh bắt khẩn cấp', default_output_formats: ['docx', 'pdf'] },
  { template_code: 'BM-053', template_no: '53', template_name: 'Lệnh cấm đi khỏi nơi cư trú', group_code: 'G02', stage_code: 'BP_NGAN_CHAN', source_file_name: 'BM-053_LenhCamDiKhoiNoiCuTru.docx', description: 'Lệnh cấm đi khỏi nơi cư trú', default_output_formats: ['docx', 'pdf'] },
  { template_code: 'BM-054', template_no: '54', template_name: 'Lệnh bắt bị can để tạm giam', group_code: 'G02', stage_code: 'BP_NGAN_CHAN', source_file_name: 'BM-054_LenhBatBiCanDeTamGiam.docx', description: 'Lệnh bắt bị can để tạm giam', default_output_formats: ['docx', 'pdf'] },
  { template_code: 'BM-055', template_no: '55', template_name: 'Lệnh tạm giam', group_code: 'G02', stage_code: 'BP_NGAN_CHAN', source_file_name: 'BM-055_LenhTamGiam.docx', description: 'Lệnh tạm giam bị can', default_output_formats: ['docx', 'pdf'] },
  { template_code: 'BM-056', template_no: '56', template_name: 'Lệnh bảo lĩnh', group_code: 'G02', stage_code: 'BP_NGAN_CHAN', source_file_name: 'BM-056_LenhBaoLinh.docx', description: 'Lệnh bảo lĩnh', default_output_formats: ['docx', 'pdf'] },
  { template_code: 'BM-057', template_no: '57', template_name: 'Lệnh đặt tiền để bảo đảm', group_code: 'G02', stage_code: 'BP_NGAN_CHAN', source_file_name: 'BM-057_LenhDatTienBaoDam.docx', description: 'Lệnh đặt tiền bảo đảm', default_output_formats: ['docx', 'pdf'] },
  { template_code: 'BM-058', template_no: '58', template_name: 'Lệnh tạm hoãn xuất cảnh', group_code: 'G02', stage_code: 'BP_NGAN_CHAN', source_file_name: 'BM-058_LenhTamHoanXuatCanh.docx', description: 'Lệnh tạm hoãn xuất cảnh', default_output_formats: ['docx', 'pdf'] },
  { template_code: 'BM-059', template_no: '59', template_name: 'Lệnh kê biên tài sản', group_code: 'G02', stage_code: 'BP_NGAN_CHAN', source_file_name: 'BM-059_LenhKeBienTaiSan.docx', description: 'Lệnh kê biên tài sản', default_output_formats: ['docx', 'pdf'] },
  { template_code: 'BM-070', template_no: '70', template_name: 'Cáo trạng', group_code: 'G03', stage_code: 'TRUY_TO', source_file_name: 'BM-070_CaoTrang.docx', description: 'Cáo trạng truy tố bị can', default_output_formats: ['docx', 'pdf'] },
  { template_code: 'BM-071', template_no: '71', template_name: 'Quyết định đình chỉ điều tra', group_code: 'G02', stage_code: 'DIEU_TRA', source_file_name: 'BM-071_QDDinhChiDieuTra.docx', description: 'Quyết định đình chỉ điều tra vụ án', default_output_formats: ['docx', 'pdf'] },
  { template_code: 'BM-090', template_no: '90', template_name: 'Bản kết luận điều tra', group_code: 'G02', stage_code: 'DIEU_TRA', source_file_name: 'BM-090_BanKetLuanDieuTra.docx', description: 'Bản kết luận điều tra', default_output_formats: ['docx', 'pdf'] },
  { template_code: 'BM-097', template_no: '97', template_name: 'Bản yêu cầu điều tra bổ sung', group_code: 'G02', stage_code: 'DIEU_TRA', source_file_name: 'BM-097_BanYeuCauDieuTraBoSung.docx', description: 'Bản yêu cầu điều tra bổ sung', default_output_formats: ['docx', 'pdf'] },
  { template_code: 'BM-156', template_no: '156', template_name: 'Bản truy tố', group_code: 'G03', stage_code: 'TRUY_TO', source_file_name: 'BM-156_BanTruyTo.docx', description: 'Bản truy tố bị can trước Tòa', default_output_formats: ['docx', 'pdf'] },
];

async function seedTemplates(
  groupIds: Record<string, bigint>,
  adminOfficialId: bigint,
): Promise<void> {
  const implementedCodes = discoverImplementedTemplateCodes(
    resolve(REPO_ROOT, 'apps', 'web', 'src', 'components', 'documents'),
  );
  const normalizedDocxByCode = discoverNormalizedDocxByCode(
    resolve(REPO_ROOT, 'storage', 'templates', 'normalized-docx'),
    REPO_ROOT,
  );
  const originalPathByCode = discoverOriginalTemplateFilesByCode(
    resolve(REPO_ROOT, 'docs', 'Biểu mẫu', 'Biểu mẫu'),
    REPO_ROOT,
  );
  const catalogModule = (await import(
    pathToFileURL(
      resolve(REPO_ROOT, 'apps', 'web', 'src', 'lib', 'vks-template-catalog.ts'),
    ).href
  )) as { vksTemplateCatalog: Parameters<typeof buildSeedTemplates>[0]['catalog'] };
  const seedTemplates = buildSeedTemplates({
    implementedCodes,
    catalog: catalogModule.vksTemplateCatalog,
    normalizedDocxByCode,
    originalPathByCode,
  });

  let createdTemplateCount = 0;
  let updatedTemplateCount = 0;
  let createdVersionCount = 0;
  let updatedVersionCount = 0;

  for (const t of seedTemplates) {
    const existing = await prisma.templates.findFirst({
      where: { template_code: t.template_code },
    });

    const templateData = {
      template_no: t.template_no,
      template_name: t.template_name,
      group_id: groupIds[t.group_code] ?? null,
      source_file_name: t.source_file_name,
      original_ext: t.source_file_name.split('.').pop() ?? 'docx',
      stage_code: t.stage_code,
      render_scope: t.render_scope,
      output_strategy: t.output_strategy,
      default_output_formats: t.default_output_formats as unknown as Prisma.InputJsonValue,
      requires_review: true,
      description: t.description,
      is_active: true,
      created_by_official_id: adminOfficialId,
    };

    const template = existing
      ? await prisma.templates.update({
          where: { id: existing.id },
          data: templateData,
        })
      : await prisma.templates.create({
          data: {
            template_code: t.template_code,
            ...templateData,
          },
        });

    if (existing) updatedTemplateCount += 1;
    else createdTemplateCount += 1;

    if (!t.version) continue;

    const existingVersion = await prisma.template_versions.findFirst({
      where: {
        template_id: template.id,
        version_no: 1,
      },
    });
    const versionData = {
      original_file_path: t.version.original_file_path,
      normalized_docx_path: t.version.normalized_docx_path,
      output_name_pattern: t.version.output_name_pattern,
      is_default: true,
      is_active: true,
      created_by_name: getSeedAdminConfig().fullName,
      created_by_official_id: adminOfficialId,
    };

    if (existingVersion) {
      await prisma.template_versions.update({
        where: { id: existingVersion.id },
        data: versionData,
      });
      updatedVersionCount += 1;
    } else {
      await prisma.template_versions.create({
        data: {
          template_id: template.id,
          version_no: 1,
          ...versionData,
        },
      });
      createdVersionCount += 1;
    }
  }

  console.log(
    `[seed] templates: ${seedTemplates.length} implemented forms ready ` +
      `(${createdTemplateCount} created, ${updatedTemplateCount} updated); ` +
      `${createdVersionCount} versions created, ${updatedVersionCount} versions updated.`,
  );
}

async function seedLegacyTemplatesUnused(groupIds: Record<string, bigint>): Promise<void> {
  let createdCount = 0;
  for (const t of TEMPLATES) {
    const existing = await prisma.templates.findFirst({
      where: { template_code: t.template_code },
    });
    if (existing) continue;

    await prisma.templates.create({
      data: {
        template_code: t.template_code,
        template_no: t.template_no,
        template_name: t.template_name,
        group_id: groupIds[t.group_code] ?? null,
        source_file_name: t.source_file_name,
        original_ext: 'docx',
        stage_code: t.stage_code,
        render_scope: t.render_scope ?? 'CASE_LEVEL',
        output_strategy: t.output_strategy ?? 'ONE_FILE_PER_CASE',
        default_output_formats: t.default_output_formats
          ? (t.default_output_formats as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        requires_review: true,
        description: t.description,
        is_active: true,
      },
    });
    createdCount += 1;
  }
  console.log(`[seed] templates: tạo ${createdCount} biểu mẫu đã implement đầy đủ.`);
}

// ============================================================================
// 7. STORAGE SETTINGS (1 record mặc định)
// ============================================================================

async function seedStorageSettings(): Promise<void> {
  const existing = await prisma.storage_settings.findFirst({ where: { is_active: true } });
  if (existing) {
    console.log('[seed] storage_settings: đã có, bỏ qua.');
    return;
  }

  const storageRoot = process.env.STORAGE_ROOT
    ? resolve(process.cwd(), process.env.STORAGE_ROOT)
    : resolve(process.cwd(), '..', 'storage');

  await prisma.storage_settings.create({
    data: {
      storage_root_path: storageRoot,
      max_storage_gb: 500,
      used_storage_bytes: BigInt(0),
      warning_threshold_percent: 85,
      allow_large_upload: true,
      is_active: true,
    },
  });
  console.log(`[seed] storage_settings: tạo mặc định (root=${storageRoot}).`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  console.log('[seed] Bắt đầu seed dữ liệu nghiệp vụ QUANLYVKS.');
  console.log(`[seed] DATABASE_URL: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@') ?? '(không có)'}`);

  const agencyId = await seedAgencies();
  const adminOfficialId = await seedOfficials(agencyId);
  await seedWards();
  await seedOffenses();
  const groupIds = await seedTemplateGroups();
  await seedTemplates(groupIds, adminOfficialId);
  await seedStorageSettings();

  console.log('[seed] Done. Login with username SEED_ADMIN_USERNAME (default: admin).');
}

main()
  .catch((error) => {
    console.error('[seed] Lỗi:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
