/**
 * Phase D — Forms contracts feature module.
 * Barrel export for all public types and utilities.
 *
 * NOTE: `contract-loader.ts` uses Node.js `fs` and is SERVER-SIDE ONLY.
 * Do NOT import it in client components. Use the API endpoints instead.
 */

// Types (safe for client and server)
export type {
  ContractStatus,
  RuntimeStatus,
  FieldSource,
  SlotType,
  UiComponentHint,
  DocxSlot,
  CanonicalField,
  RenderBinding,
  FormInputHints,
  RenderFormatHints,
  ReportingHints,
  FormContract,
  LoadedFormContract,
  FormCatalogItem,
  FormCatalogQuery,
  FormInstance,
  FormInstanceStatus,
  FormInstanceReportingIndex,
  FormStage,
} from "./contract-types";

export {
  FORM_STAGES,
  getStageForBm,
} from "./contract-types";

// Pure normalization (safe for client and server)
export {
  normalizeContract,
  buildFormCatalog,
} from "./contract-normalizer";

// Form schema generator (safe for client and server)
export {
  generateFormSchema,
  deriveLabel,
  deriveSectionTitle,
  resolveRenderBinding,
  type FormSchemaOptions,
  type ResolvedBinding,
} from "./form-schema-generator";

// Sample data (safe for client and server)
export {
  getSampleData,
  mergeWithSampleData,
  clearSampleData,
  hasUserData,
  extractReportingIndex,
  type SampleDataKey,
  type SampleData,
} from "./sample-data";
