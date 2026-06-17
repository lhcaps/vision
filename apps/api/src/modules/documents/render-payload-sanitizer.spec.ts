import { sanitizeRenderPayloadRuntimeDefaults } from './render-payload-sanitizer';

describe('sanitizeRenderPayloadRuntimeDefaults', () => {
  it('replaces legacy actor, agency and fixed VKS code defaults with runtime context', () => {
    const payload = {
      agency: {
        parentName: 'VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ Hồ CHÍ MINH',
        name: 'VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7',
      },
      document: {
        documentCode: '03/QĐ-VKSKV7',
      },
      signature: {
        signerName: 'Trần Thanh Nam',
      },
      updatedByName: 'Nguyễn Thị Thanh Huyền',
      narrative:
        'Đoàn Văn Dũng thực hiện hành vi đánh bạc tại phường Trung Mỹ Tây.',
    };

    const sanitized = sanitizeRenderPayloadRuntimeDefaults(payload, {
      actorName: 'Admin',
      agencyName: 'Viện kiểm sát',
      parentAgencyName: 'Viện kiểm sát nhân dân cấp trên',
      agencyCode: 'VKS-DEFAULT',
    }) as typeof payload;

    expect(sanitized.agency.parentName).toBe(
      'Viện kiểm sát nhân dân cấp trên',
    );
    expect(sanitized.agency.name).toBe('Viện kiểm sát');
    expect(sanitized.document.documentCode).toBe('03/QĐ-VKS-DEFAULT');
    expect(sanitized.signature.signerName).toBe('Admin');
    expect(sanitized.updatedByName).toBe('Admin');
    expect(sanitized.narrative).not.toContain('Đoàn Văn Dũng');
    expect(sanitized.narrative).not.toContain('Trung Mỹ Tây');
  });
});
