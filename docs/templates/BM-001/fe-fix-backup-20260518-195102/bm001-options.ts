export const BM001_GENDER_OPTIONS = [
  { value: "Nam", label: "Nam" },
  { value: "Nữ", label: "Nữ" },
  { value: "Khác", label: "Khác" },
];

export type Bm001AgencyOption = {
  id: string;
  label: string;
  parentName: string;
  name: string;
  issuePlace: string;
};

export const BM001_AGENCY_OPTIONS: Bm001AgencyOption[] = [
  {
    id: "vks-kv7-hcm",
    label: "VKSND Khu vực 7 - TP. Hồ Chí Minh",
    parentName: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
    name: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
    issuePlace: "TP. Hồ Chí Minh",
  },
  {
    id: "vks-kv1-hcm",
    label: "VKSND Khu vực 1 - TP. Hồ Chí Minh",
    parentName: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
    name: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 1",
    issuePlace: "TP. Hồ Chí Minh",
  },
];

export type Bm001ReceiverOption = {
  id: string;
  label: string;
  fullName: string;
  positionTitle: string;
  signerName: string;
};

export const BM001_RECEIVER_OPTIONS: Bm001ReceiverOption[] = [
  {
    id: "nguyen-t-h-hanh",
    label: "Nguyễn T. H. Hạnh - Kiểm sát viên",
    fullName: "Nguyễn T. H. Hạnh",
    positionTitle: "Kiểm sát viên",
    signerName: "Nguyễn T. H. Hạnh",
  },
  {
    id: "tran-thanh-nam",
    label: "Trần Thanh Nam - Kiểm sát viên",
    fullName: "Trần Thanh Nam",
    positionTitle: "Kiểm sát viên",
    signerName: "Trần Thanh Nam",
  },
];
