/**
 * BM-090 options.
 *
 * @deprecated Lấy signers/agency từ `useSignerOptions()` và `useCurrentAgency()`
 * trong `@/lib/options-source`. Các constant dưới đây rỗng cố ý để tránh hiển thị
 * dữ liệu giả.
 */

export type Bm090OffenseOption = {
  id: string;
  label: string;
  offenseName: string;
  legalArticle?: string;
  criminalCodeText?: string;
  [key: string]: unknown;
};

export type Bm090AgencyOption = {
  id: string;
  label: string;
  name: string;
  shortName?: string | null;
  parentName?: string | null;
  parentAgencyName?: string | null;
  address?: string | null;
  phone?: string | null;
  monitoringUnitName?: string | null;
  issuePlace?: string | null;
  email?: string | null;
  fax?: string | null;
  short_name?: string | null;
  parent_name?: string | null;
  parent_agency_name?: string | null;
  monitoring_unit_name?: string | null;
  issue_place?: string | null;
};

export type Bm090GenderOption = { value: string; label: string };

/** @deprecated Dùng useSignerOptions() */
export const BM090_SIGNER_OPTIONS: Array<{
  id: string;
  label: string;
  fullName: string;
  positionTitle: string;
  signerName: string;
  officialFullName?: string;
  officialPositionTitle?: string;
  prosecutorName?: string;
  [key: string]: unknown;
}> = [];

/** @deprecated Dùng useCurrentAgency() */
export const BM090_AGENCY_OPTIONS: Bm090AgencyOption[] = [];

export const BM090_OFFENSE_OPTIONS: Bm090OffenseOption[] = [];
export const BM090_GENDER_OPTIONS: Bm090GenderOption[] = [];
export const BM090_POSITION_OPTIONS: { value: string; label: string }[] = [];
