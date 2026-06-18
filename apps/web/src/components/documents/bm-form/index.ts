/**
 * BM form shared — barrel export.
 *
 * Dùng trong bm-XXX-form-inputs.tsx:
 *   import { BmFormSection, BmFieldText, BmFieldDate, BmFormActions, BmFormStatus } from "./bm-form";
 */

export { BM_FORM_CLASSES } from "./classes";
export {
  todayIsoDate,
  isoDateToVnSlash,
  vnSlashToIsoDate,
  vnDateLine,
  issuePlaceDateLine,
  defaultArchiveLine,
  todaySlashDate,
  normalizeSlashDate,
} from "./classes";
export { BmFormSection } from "./bm-form-section";
export {
  BmFieldText,
  BmFieldTextarea,
  BmFieldSelect,
  BmFieldDate,
  BmFieldCheckbox,
} from "./bm-field";
export { BmFormStatus, BmFormActions } from "./bm-form-status";
export { BmFormMetaBar } from "./bm-form-meta-bar";
