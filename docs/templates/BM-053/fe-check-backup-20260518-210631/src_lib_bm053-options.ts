export type Bm053OffenseOption = {
  id: string;
  label: string;
  offenseName: string;
  legalArticle: string;
  criminalCodeText: string;
};

export type Bm053AgencyOption = {
  id: string;
  label: string;
  parentName: string;
  name: string;
  shortName: string;
  issuePlace: string;
  phone: string;
  monitoringUnitName?: string;
};

export type Bm053ResidenceOption = {
  id: string;
  label: string;
  residenceAddress: string;
  measureResidencePlace: string;
  monitoringUnitName: string;
  monitoringRecipientLine: string;
};

export type Bm053SignerOption = {
  id: string;
  label: string;
  signMode: string;
  positionTitle: string;
  signerName: string;
  officialFullName: string;
  officialPositionTitle: string;
  prosecutorName: string;
};

export const BM053_GENDER_OPTIONS = [
  { value: "Nam", label: "Nam" },
  { value: "Nữ", label: "Nữ" },
  { value: "Khác", label: "Khác" },
  { value: "", label: "Không xác định / để trống" },
];

export const BM053_IDENTITY_TYPE_OPTIONS = [
  { value: "Thẻ CCCD", label: "Thẻ CCCD" },
  { value: "CMND", label: "CMND" },
  { value: "Hộ chiếu", label: "Hộ chiếu" },
  { value: "Thẻ CC", label: "Thẻ căn cước" },
];

export const BM053_SIGN_MODE_OPTIONS = [
  { value: "VIỆN TRƯỞNG", label: "VIỆN TRƯỞNG" },
  { value: "KT. VIỆN TRƯỞNG", label: "KT. VIỆN TRƯỞNG" },
  { value: "TUQ. VIỆN TRƯỞNG", label: "TUQ. VIỆN TRƯỞNG" },
];

export const BM053_POSITION_OPTIONS = [
  { value: "VIỆN TRƯỞNG", label: "VIỆN TRƯỞNG" },
  { value: "PHÓ VIỆN TRƯỞNG", label: "PHÓ VIỆN TRƯỞNG" },
  { value: "KIỂM SÁT VIÊN", label: "KIỂM SÁT VIÊN" },
];

export const BM053_OFFENSE_OPTIONS: Bm053OffenseOption[] = [
  {
    id: "danh-bac-k1-d321",
    label: "Đánh bạc - khoản 1 Điều 321",
    offenseName: "Đánh bạc",
    legalArticle: "khoản 1 Điều 321",
    criminalCodeText:
      "Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025",
  },
  {
    id: "to-chuc-danh-bac-d322",
    label: "Tổ chức đánh bạc hoặc gá bạc - Điều 322",
    offenseName: "Tổ chức đánh bạc hoặc gá bạc",
    legalArticle: "Điều 322",
    criminalCodeText:
      "Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025",
  },
  {
    id: "trom-cap-d173",
    label: "Trộm cắp tài sản - Điều 173",
    offenseName: "Trộm cắp tài sản",
    legalArticle: "Điều 173",
    criminalCodeText:
      "Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025",
  },
  {
    id: "lua-dao-d174",
    label: "Lừa đảo chiếm đoạt tài sản - Điều 174",
    offenseName: "Lừa đảo chiếm đoạt tài sản",
    legalArticle: "Điều 174",
    criminalCodeText:
      "Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025",
  },
  {
    id: "ma-tuy-d249",
    label: "Tàng trữ trái phép chất ma túy - Điều 249",
    offenseName: "Tàng trữ trái phép chất ma túy",
    legalArticle: "Điều 249",
    criminalCodeText:
      "Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025",
  },
];

export const BM053_AGENCY_OPTIONS: Bm053AgencyOption[] = [
  {
    id: "vks-kv7-hcm",
    label: "VKSND Khu vực 7 - TP. Hồ Chí Minh",
    parentName: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
    name: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
    shortName: "VKSKV7",
    issuePlace: "TP. Hồ Chí Minh",
    phone: "0988027788",
    monitoringUnitName:
      "Ủy ban nhân dân xã Đông Thạnh, Thành phố Hồ Chí Minh",
  },
  {
    id: "vks-kv1-hcm",
    label: "VKSND Khu vực 1 - TP. Hồ Chí Minh",
    parentName: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
    name: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 1",
    shortName: "VKSKV1",
    issuePlace: "TP. Hồ Chí Minh",
    phone: "028.0000.0000",
  },
];

export const BM053_RESIDENCE_OPTIONS: Bm053ResidenceOption[] = [
  {
    id: "xa-dong-thanh-hcm",
    label: "xã Đông Thạnh, Thành phố Hồ Chí Minh",
    residenceAddress: "xã Đông Thạnh, Thành phố Hồ Chí Minh",
    measureResidencePlace: "xã Đông Thạnh, Thành phố Hồ Chí Minh",
    monitoringUnitName:
      "Ủy ban nhân dân xã Đông Thạnh, Thành phố Hồ Chí Minh",
    monitoringRecipientLine:
      "- UBND xã Đông Thạnh, Thành phố Hồ Chí Minh;",
  },
  {
    id: "phuong-trung-my-tay-hcm",
    label: "phường Trung Mỹ Tây, Thành phố Hồ Chí Minh",
    residenceAddress: "phường Trung Mỹ Tây, Thành phố Hồ Chí Minh",
    measureResidencePlace: "phường Trung Mỹ Tây, Thành phố Hồ Chí Minh",
    monitoringUnitName:
      "Ủy ban nhân dân phường Trung Mỹ Tây, Thành phố Hồ Chí Minh",
    monitoringRecipientLine:
      "- UBND phường Trung Mỹ Tây, Thành phố Hồ Chí Minh;",
  },
];

export const BM053_SIGNER_OPTIONS: Bm053SignerOption[] = [
  {
    id: "tran-thanh-nam",
    label: "Trần Thanh Nam - Phó Viện trưởng",
    signMode: "KT. VIỆN TRƯỞNG",
    positionTitle: "PHÓ VIỆN TRƯỞNG",
    signerName: "Trần Thanh Nam",
    officialFullName: "Trần Thanh Nam",
    officialPositionTitle: "PHÓ VIỆN TRƯỞNG",
    prosecutorName: "thụ lý vụ án",
  },
  {
    id: "vien-truong",
    label: "Viện trưởng",
    signMode: "VIỆN TRƯỞNG",
    positionTitle: "VIỆN TRƯỞNG",
    signerName: "",
    officialFullName: "",
    officialPositionTitle: "VIỆN TRƯỞNG",
    prosecutorName: "thụ lý vụ án",
  },
];