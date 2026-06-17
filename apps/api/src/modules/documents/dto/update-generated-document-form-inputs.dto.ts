import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

type JsonObject = Record<string, unknown>;

export class UpdateGeneratedDocumentFormInputsDto {
  @IsOptional()
  @IsObject()
  assignment?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  legalBasis?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Thông tin cơ quan ban hành biểu mẫu.',
    example: {
      parentName: 'VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH',
      name: 'VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7',
      shortName: 'VKSKV7',
      issuePlace: 'TP. Hồ Chí Minh',
      phone: '',
      monitoringUnitName:
        'Ủy ban nhân dân xã Đông Thạnh, Thành phố Hồ Chí Minh',
    },
  })
  @IsOptional()
  @IsObject()
  agency?: JsonObject;

  @ApiPropertyOptional({
    description: 'Thông tin người ký / kiểm sát viên.',
    example: {
      fullName: 'Tên người dùng từ phiên đăng nhập',
      positionTitle: 'PHÓ VIỆN TRƯỞNG',
      prosecutorName: 'thụ lý vụ án',
    },
  })
  @IsOptional()
  @IsObject()
  official?: JsonObject;

  @ApiPropertyOptional({
    description: 'Thông tin số, ký hiệu, ngày ban hành biểu mẫu.',
    example: {
      documentNo: '',
      documentCode: '/LCCT-VKSKV7',
      issueDate: '2026-03-04',
    },
  })
  @IsOptional()
  @IsObject()
  document?: JsonObject;

  @ApiPropertyOptional({
    description: 'Thông tin quyết định khởi tố vụ án.',
    example: {
      decisionNo: 'G505/QĐ-VPCQCSĐT',
      issueDate: '2025-10-15',
      issuedBy: 'Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh',
    },
  })
  @IsOptional()
  @IsObject()
  caseDecision?: JsonObject;

  @ApiPropertyOptional({
    description: 'Thông tin quyết định khởi tố bị can.',
    example: {
      decisionNo: '',
      issueDate: '2025-10-15',
      issuedBy: 'Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh',
    },
  })
  @IsOptional()
  @IsObject()
  accusedDecision?: JsonObject;

  @ApiPropertyOptional({
    description: 'Thông tin tội danh.',
    example: {
      offenseName: 'Đánh bạc',
      legalArticle: 'khoản 1 Điều 321',
      criminalCodeText: 'Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025',
    },
  })
  @IsOptional()
  @IsObject()
  offense?: JsonObject;

  @ApiPropertyOptional({
    description: 'Thông tin bị can / người bị áp dụng biện pháp.',
    example: {
      fullName: '',
      genderLabel: 'Nam',
      otherName: 'Không có',
      dateOfBirth: '',
      birthYear: '',
      placeOfBirth: 'tỉnh Quảng Ngãi',
      nationality: 'Việt Nam',
      ethnicity: 'Kinh',
      religion: 'Không',
      occupation: 'Kinh doanh',
      identityType: 'Thẻ CCCD',
      identityNo: '051080000314',
      identityIssuedDate: '2021-12-22',
      identityIssuedPlace: 'Cục Cảnh sát Quản lý hành chính về trật tự xã hội',
      permanentAddress:
        'số 49/37, đường TCH 16, Khu phố 45, phường Trung Mỹ Tây, Thành phố Hồ Chí Minh',
      temporaryAddress: '',
      currentAddress: 'số 13/4A, Ấp 107, xã Đông Thạnh, Thành phố Hồ Chí Minh',
      residenceAddress: 'xã Đông Thạnh, Thành phố Hồ Chí Minh',
    },
  })
  @IsOptional()
  @IsObject()
  person?: JsonObject;

  @ApiPropertyOptional({
    description: 'Thông tin biện pháp cấm đi khỏi nơi cư trú.',
    example: {
      durationText: '10 ngày',
      fromDate: '2026-03-05',
      toDate: '2026-03-14',
      residencePlace: 'xã Đông Thạnh, Thành phố Hồ Chí Minh',
    },
  })
  @IsOptional()
  @IsObject()
  measure?: JsonObject;

  @ApiPropertyOptional({
    description: 'Thông tin đơn vị quản lý, theo dõi bị can.',
    example: {
      unitName: 'Ủy ban nhân dân xã Đông Thạnh, Thành phố Hồ Chí Minh',
      phone: '',
      prosecutorName: 'thụ lý vụ án',
    },
  })
  @IsOptional()
  @IsObject()
  monitoring?: JsonObject;

  @ApiPropertyOptional({
    description: 'Thông tin nơi nhận.',
    example: {
      monitoringUnitLine: '- UBND xã Đông Thạnh, Thành phố Hồ Chí Minh;',
      personLine: '- ;',
      archiveLine: '- Lưu: HSVA, HSKS, VP.',
      noteLine: 'T. Huyền.05b',
    },
  })
  @IsOptional()
  @IsObject()
  recipients?: JsonObject;

  @ApiPropertyOptional({
    description: 'Thông tin chữ ký.',
    example: {
      signMode: 'KT. VIỆN TRƯỞNG',
      positionTitle: 'PHÓ VIỆN TRƯỞNG',
      signerName: 'Tên người dùng từ phiên đăng nhập',
    },
  })
  @IsOptional()
  @IsObject()
  signature?: JsonObject;
  @ApiPropertyOptional({
    description:
      'Thông tin riêng BM-145 - trả hồ sơ vụ án để điều tra bổ sung.',
    example: {
      returnRoundLine: '(Lần thứ nhất)',
      procedureArticlesLine:
        'Căn cứ các điều 41, 174, 240 và 245 của Bộ luật Tố tụng hình sự;',
      investigationConclusionLegalBasisLine:
        'Căn cứ Bản kết luận điều tra vụ án hình sự đề nghị truy tố số 01/KLĐT ngày 17 tháng 5 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;',
      courtReturnDecisionLegalBasisLine:
        'Căn cứ Quyết định trả hồ sơ vụ án để điều tra bổ sung số 01/2026/QĐST-HS ngày 17 tháng 5 năm 2026 của Tòa án nhân dân có thẩm quyền;',
      reasonLine:
        'Xét thấy cần điều tra bổ sung để làm rõ đầy đủ chứng cứ, tài liệu và các tình tiết có ý nghĩa đối với việc giải quyết vụ án,',
      article1IntroLine:
        'Trả hồ sơ vụ án hình sự Vụ án đánh bạc tại phường Trung Mỹ Tây về tội Đánh bạc cho Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh để điều tra bổ sung những vấn đề sau:',
      supplementIssue1Line:
        'Làm rõ vai trò, hành vi cụ thể của từng người tham gia trong vụ án.',
      supplementIssue2Line:
        'Bổ sung tài liệu, chứng cứ liên quan đến số tiền, phương tiện dùng vào việc phạm tội.',
      supplementIssue3Line:
        'Làm rõ các tình tiết tăng nặng, giảm nhẹ trách nhiệm hình sự nếu có.',
      article2Line:
        'Thời hạn điều tra bổ sung không quá 02 tháng, kể từ ngày Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh nhận hồ sơ vụ án và Quyết định này.',
      article3Line:
        'Yêu cầu Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh thực hiện Quyết định này theo quy định của Bộ luật Tố tụng hình sự.',
      investigationAuthorityRecipientLine:
        '- Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;',
    },
  })
  @IsOptional()
  @IsObject()
  prosecutionSupplementReturn?: JsonObject;

  @ApiPropertyOptional({
    description: 'Thông tin phần giao lệnh cuối văn bản.',
    example: {
      deliveredAtText:
        'Lệnh này đã được giao cho người bị cấm đi khỏi nơi cư trú một bản vào hồi …..giờ……phút, ngày…….tháng…….năm 2026',
      receiverTitle: 'NGƯỜI BỊ CẤM ĐI KHỎI NƠI CƯ TRÚ',
    },
  })
  @IsOptional()
  @IsObject()
  delivery?: JsonObject;

  @ApiPropertyOptional({
    example: 'Tên người dùng từ phiên đăng nhập',
  })
  @IsOptional()
  @IsOptional()
  @IsObject()
  reception?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  receiver?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  informant?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  crimeReport?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Thông tin gia hạn thời hạn điều tra dùng cho BM-103/BM-104.',
    example: {
      previousDecisionLegalBasisLine:
        'Căn cứ Quyết định gia hạn thời hạn điều tra vụ án hình sự lần thứ nhất số 02/QĐ-VKS ngày 10 tháng 5 năm 2026 của Viện kiểm sát nhân dân khu vực 7;',
      requestRoundText: 'lần thứ hai',
      durationText: '02 tháng',
      fromDateText: 'ngày 14 tháng 5 năm 2026',
      toDateText: 'ngày 14 tháng 7 năm 2026',
    },
  })
  @IsOptional()
  @IsObject()
  investigationRecovery?: JsonObject;

  @IsOptional()
  @IsObject()
  investigationExtension?: JsonObject;

  @ApiPropertyOptional({
    description:
      'Thông tin văn bản đề nghị và đơn vị đề nghị dùng cho BM-103/BM-104.',
    example: {
      requestingDocumentLine:
        'Xét văn bản đề nghị gia hạn thời hạn điều tra vụ án hình sự của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh, nhận thấy việc gia hạn thời hạn điều tra là có căn cứ và cần thiết,',
      proposingProcuracyName: 'Viện kiểm sát nhân dân khu vực 7',
    },
  })
  @IsOptional()
  @IsObject()
  proposal?: JsonObject;

  @ApiPropertyOptional({
    description: 'Thông tin chuyển vụ án để truy tố dùng cho BM-141.',
    example: {
      fromProcuracyName: 'VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7',
      toProcuracyName: 'VIỆN KIỂM SÁT NHÂN DÂN CÓ THẨM QUYỀN',
      transferReasonLine:
        'Xét thấy vụ án không thuộc thẩm quyền truy tố của Viện kiểm sát nhân dân khu vực 7 mà thuộc thẩm quyền truy tố của Viện kiểm sát nhân dân có thẩm quyền,',
      article1Line:
        'Chuyển vụ án Vụ án đánh bạc tại phường Trung Mỹ Tây đến Viện kiểm sát nhân dân có thẩm quyền để truy tố theo thẩm quyền./.',
    },
  })
  @IsOptional()
  @IsObject()
  prosecutionTransfer?: JsonObject;

  @ApiPropertyOptional({
    description:
      'Thông tin gia hạn thời hạn quyết định việc truy tố dùng cho BM-144.',
    example: {
      procedureArticlesLine:
        'Căn cứ các điều 41, 236 và 240 của Bộ luật Tố tụng hình sự;',
      juvenileJusticeLine:
        'Căn cứ Điều 129 của Luật Tư pháp người chưa thành niên;',
      durationDaysText: '15 ngày',
      fromDateText: 'ngày 16 tháng 5 năm 2026',
      toDateText: 'ngày 31 tháng 5 năm 2026',
      reasonLine:
        'Xét thấy cần gia hạn thời hạn quyết định việc truy tố để nghiên cứu, đánh giá đầy đủ hồ sơ vụ án,',
      article1Line:
        'Gia hạn thời hạn quyết định việc truy tố trong thời hạn 15 ngày, kể từ ngày 16 tháng 5 năm 2026 đến ngày 31 tháng 5 năm 2026./.',
    },
  })
  @IsOptional()
  @IsObject()
  prosecutionExtension?: JsonObject;
  prosecutionCaseSuspension?: JsonObject;
  prosecutionCaseTermination?: JsonObject;

  @IsString()
  updatedByName?: string;

  @IsOptional()
  @IsObject()
  caseJoinder?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  caseRecovery?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  investigationConclusion?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  indictment?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  attachments?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  notification?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  formInputs?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  detentionReplacement?: Record<string, unknown>;
  @IsOptional()
  @IsObject()
  bailApproval?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  sourceVerification?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  sourceResolutionExtension?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  sourceAssignment?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  caseInitiationRequest?: Record<string, unknown>;
  @IsOptional()
  @IsObject()
  caseInvestigationTransfer?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  caseFileHandover?: Record<string, unknown>;
}
