const fs = require('node:fs');
const path = require('node:path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

const projectRoot = path.resolve(process.cwd(), '..', '..');

const templatePath = path.join(
  projectRoot,
  'storage',
  'templates',
  'normalized-docx',
  'BM-053',
  'BM-053_Lenh-cam-di-khoi-noi-cu-tru.docx',
);

const outputDir = path.join(projectRoot, 'storage', 'temp', 'debug-render');
fs.mkdirSync(outputDir, { recursive: true });

const outputPath = path.join(outputDir, `debug-BM-053-${Date.now()}.docx`);

const payload = {
  agency: {
    parentName: 'VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH',
    name: 'VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 1',
    shortName: 'VKSND KV1',
    issuePlace: 'Thành phố Hồ Chí Minh',
    phone: '028.0000.0000',
    monitoringUnitName: 'Ủy ban nhân dân phường Trung Mỹ Tây',
  },
  official: {
    fullName: 'Nguyễn T. H. Hạnh',
    positionTitle: 'VIỆN TRƯỞNG',
    prosecutorName: 'Nguyễn T. H. Hạnh',
  },
  document: {
    documentNo: '12',
    documentCode: '12/LCCT-VKS',
    issueDate: '06/05/2026',
    issueDay: '06',
    issueMonth: '05',
    issueYear: '2026',
    documentTitle: 'Lệnh cấm đi khỏi nơi cư trú - Nguyễn Văn A - VKS-2026-0001',
    generatedAt: '06/05/2026',
  },
  case: {
    caseCode: 'VKS-2026-0001',
    caseTitle: 'Vụ án đánh bạc tại phường Trung Mỹ Tây',
    receivedDate: '06/05/2026',
  },
  caseDecision: {
    decisionNo: '01/QĐ-KTVA',
    issueDay: '06',
    issueMonth: '05',
    issueYear: '2026',
    issuedBy: 'Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh',
  },
  accusedDecision: {
    decisionNo: '02/QĐ-KTBC',
    issueDay: '06',
    issueMonth: '05',
    issueYear: '2026',
    issuedBy: 'Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh',
  },
  person: {
    fullName: 'Nguyễn Văn A',
    gender: 'MALE',
    genderLabel: 'Nam',
    otherName: '',
    dateOfBirth: '',
    birthDay: '',
    birthMonth: '',
    birthYear: '1998',
    placeOfBirth: '',
    nationality: 'Việt Nam',
    ethnicity: '',
    religion: '',
    occupation: 'Kinh doanh',
    identityNo: '',
    identityIssuedDay: '',
    identityIssuedMonth: '',
    identityIssuedYear: '',
    identityIssuedPlace: '',
    permanentAddress: '',
    currentAddress: 'Phường Trung Mỹ Tây, Thành phố Hồ Chí Minh',
    residenceAddress: 'Phường Trung Mỹ Tây, Thành phố Hồ Chí Minh',
  },
  offense: {
    offenseName: 'Đánh bạc',
    legalArticle: 'khoản 1 Điều 321 Bộ luật Hình sự',
  },
  measure: {
    durationText: '02 tháng',
    fromDay: '06',
    fromMonth: '05',
    fromYear: '2026',
    toDay: '06',
    toMonth: '07',
    toYear: '2026',
    residencePlace: 'Phường Trung Mỹ Tây, Thành phố Hồ Chí Minh',
  },
};

function printDocxError(error) {
  console.error('\n=== DOCXTEMPLATER ERROR ===');

  if (error && error.properties) {
    console.error('id:', error.properties.id);
    console.error('explanation:', error.properties.explanation);
    console.error('tag:', error.properties.xtag);
    console.error('context:', error.properties.context);

    if (Array.isArray(error.properties.errors)) {
      for (const item of error.properties.errors) {
        console.error('\n--- nested error ---');
        console.error('id:', item.properties && item.properties.id);
        console.error(
          'explanation:',
          item.properties && item.properties.explanation,
        );
        console.error('tag:', item.properties && item.properties.xtag);
        console.error('context:', item.properties && item.properties.context);
      }
    }
  }

  console.error(
    '\nraw message:',
    error && error.message ? error.message : error,
  );
}

try {
  console.log('[INFO] cwd:', process.cwd());
  console.log('[INFO] projectRoot:', projectRoot);
  console.log('[INFO] templatePath:', templatePath);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  const binary = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(binary);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: {
      start: '{{',
      end: '}}',
    },
    nullGetter: () => '',
  });

  doc.render(payload);

  const buffer = doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });

  fs.writeFileSync(outputPath, buffer);

  console.log('[OK] Render test success');
  console.log('[OK] Output:', outputPath);
} catch (error) {
  printDocxError(error);
  process.exit(1);
}
