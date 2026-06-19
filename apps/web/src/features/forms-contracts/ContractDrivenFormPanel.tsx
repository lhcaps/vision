"use client";

/**
 * Phase D — Contract-driven form panel.
 *
 * Renders a generated form schema from a `LoadedFormContract` using existing
 * `bm-form/` components. No BM-specific JSX, no manual components.
 *
 * Supports:
 * - text, textarea, date, select, number, checkbox, readonly inputs
 * - validation error display
 * - required field markers
 * - disabled draft/generic field state
 * - Review warning banner for draft contracts
 * - Form state sync upward via `onChange`
 */

import { useCallback, useState } from "react";
import type {
  LoadedFormContract,
  GeneratedFormSchema,
  GeneratedFormSection,
  GeneratedFormField,
} from "./contract-types";
import {
  generateFormSchema,
  deriveSectionTitle,
} from "./form-schema-generator";
import {
  BmFieldText,
  BmFieldTextarea,
  BmFieldDate,
  BmFieldSelect,
  BmFieldCheckbox,
} from "@/components/documents/bm-form";
import { BmFormSection } from "@/components/documents/bm-form";
import { BmFormStatus } from "@/components/documents/bm-form";
import { BmFormActions } from "@/components/documents/bm-form";
import { BM_FORM_CLASSES } from "@/components/documents/bm-form/classes";

type FormStatus = "idle" | "loading" | "success" | "error" | "warning";

export interface ContractDrivenFormPanelProps {
  /** The loaded contract to render. */
  contract: LoadedFormContract;
  /** Initial form data (persisted state). */
  initialData?: Record<string, unknown>;
  /** Allow editing draft/generic fields for preview. Default: false. */
  allowDraftPreview?: boolean;
  /** Called when form data changes. */
  onChange?: (data: Record<string, unknown>) => void;
  /** Called when user requests save. */
  onSave?: (data: Record<string, unknown>) => Promise<void>;
  /** Read-only mode (e.g. for preview panel). Default: false. */
  readOnly?: boolean;
}

export interface ContractDrivenFormPanelState {
  data: Record<string, unknown>;
  errors: Record<string, string>;
  status: FormStatus;
  statusMessage: string;
}

/**
 * Main contract-driven form panel component.
 * Does NOT hard-code any BM-specific JSX.
 */
export function ContractDrivenFormPanel({
  contract,
  initialData = {},
  allowDraftPreview = false,
  onChange,
  onSave,
  readOnly = false,
}: ContractDrivenFormPanelProps) {
  const [data, setData] = useState<Record<string, unknown>>({ ...initialData });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<FormStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const isReadOnly = readOnly || !contract.runtimeEligible;
  const showReviewWarning =
    !contract.runtimeEligible && !allowDraftPreview;

  // Generate schema (memoized per contract)
  const schema = generateFormSchema(contract, { allowDraftPreview });

  const handleFieldChange = useCallback(
    (path: string, value: unknown) => {
      setData((prev) => {
        const next = { ...prev, [path]: value };
        onChange?.(next);
        return next;
      });
      // Clear error for this field
      if (errors[path]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[path];
          return next;
        });
      }
    },
    [onChange, errors],
  );

  const handleSave = useCallback(async () => {
    if (!onSave) return;

    // Validate required fields
    const newErrors: Record<string, string> = {};
    for (const section of schema.sections) {
      for (const field of section.fields) {
        if (field.required) {
          const val = data[field.path];
          if (val === undefined || val === null || val === "") {
            newErrors[field.path] = `Trường "${field.label}" là bắt buộc.`;
          }
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstError = Object.values(newErrors)[0];
      setStatusMessage(firstError);
      setStatus("error");
      return;
    }

    setStatus("loading");
    try {
      await onSave(data);
      setStatus("success");
      setStatusMessage("Lưu thành công.");
    } catch (err) {
      setStatus("error");
      setStatusMessage(
        err instanceof Error ? err.message : "Lưu thất bại.",
      );
    }
  }, [data, onSave, schema]);

  const handleClearErrors = useCallback(() => {
    setErrors({});
    setStatus("idle");
    setStatusMessage("");
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Contract status banner */}
      {showReviewWarning && (
        <div className={BM_FORM_CLASSES.statusWarning} role="alert">
          <span className="font-semibold">Cảnh báo:</span>{" "}
          Hợp đồng biểu mẫu này ở trạng thái{" "}
          <strong>draft</strong> — chưa được khóa bởi human review. Dữ liệu
          được nhập ở đây <strong>không được lưu vào production</strong>.
          Sử dụng chế độ preview để kiểm tra.
        </div>
      )}

      {/* Review badge for draft contract */}
      {contract.needsReview && (
        <div className="rounded border border-yellow-400 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
          Biểu mẫu này có {contract.genericFieldCount} trường generic (`.field#`)
          cần human review trước khi khóa.
        </div>
      )}

      {/* Form header */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold">{contract.templateCode}</h1>
        <p className="text-muted-foreground">{contract.title}</p>
        {contract.stage && (
          <p className="text-sm text-muted-foreground">
            Giai đoạn: {contract.stage.code} — {contract.stage.label}
          </p>
        )}
      </div>

      {/* Status banner */}
      <BmFormStatus kind={status} title={statusMessage} />

      {/* Form sections */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!isReadOnly) handleSave();
        }}
      >
        <div className="flex flex-col gap-6">
          {schema.sections.map((section) => (
            <ContractFormSection
              key={section.sectionId}
              section={section}
              data={data}
              errors={errors}
              onFieldChange={handleFieldChange}
              isReadOnly={isReadOnly}
            />
          ))}
        </div>

        {/* Actions */}
        {!isReadOnly && (
          <div className="mt-6 border-t pt-4">
            <BmFormActions
              primaryLabel="Lưu"
              onPrimary={handleSave}
              primaryDisabled={status === "loading"}
              secondaryLabel="Hủy"
              onSecondary={handleClearErrors}
              secondaryDisabled={status === "loading"}
            />
          </div>
        )}
      </form>
    </div>
  );
}

// ─── Section renderer ─────────────────────────────────────────────────────────

interface ContractFormSectionProps {
  section: ReturnType<typeof generateFormSchema>["sections"][0];
  data: Record<string, unknown>;
  errors: Record<string, string>;
  onFieldChange: (path: string, value: unknown) => void;
  isReadOnly: boolean;
}

function ContractFormSection({
  section,
  data,
  errors,
  onFieldChange,
  isReadOnly,
}: ContractFormSectionProps) {
  const title = deriveSectionTitle(section.sectionId);
  const requiredCount = section.fields.filter((f) => f.required).length;
  const hasReviewFields = section.fields.some((f) => f.reviewRequired);

  return (
    <BmFormSection
      title={title}
      requiredCount={requiredCount}
      badge={hasReviewFields ? "Cần review" : undefined}
    >
      {section.fields.map((field) => (
        <ContractFormField
          key={field.path}
          field={field}
          value={data[field.path]}
          error={errors[field.path]}
          onChange={onFieldChange}
          disabled={isReadOnly || field.reviewRequired}
        />
      ))}
    </BmFormSection>
  );
}

// ─── Field renderer ─────────────────────────────────────────────────────────────

interface ContractFormFieldProps {
  field: ReturnType<typeof generateFormSchema>["fields"][0];
  value: unknown;
  error?: string;
  onChange: (path: string, value: unknown) => void;
  disabled?: boolean;
}

function ContractFormField({
  field,
  value,
  error,
  onChange,
  disabled,
}: ContractFormFieldProps) {
  const handleChange = (next: unknown) => {
    onChange(field.path, next);
  };

  const helperText = field.reviewRequired
    ? `[CẦN REVIEW] Trường generic — chưa xác nhận tên chính thức`
    : undefined;

  switch (field.type) {
    case "textarea":
      return (
        <BmFieldTextarea
          label={field.label}
          required={field.required}
          errorText={error}
          helperText={helperText}
          value={String(value ?? "")}
          onChange={handleChange}
          placeholder={field.placeholder}
          disabled={disabled}
          fullWidth
        />
      );

    case "date":
      return (
        <BmFieldDate
          label={field.label}
          required={field.required}
          errorText={error}
          helperText={helperText}
          value={String(value ?? "")}
          onChange={handleChange}
          disabled={disabled}
          fullWidth
        />
      );

    case "select":
      return (
        <BmFieldSelect
          label={field.label}
          required={field.required}
          errorText={error}
          helperText={helperText}
          value={String(value ?? "")}
          onChange={handleChange}
          disabled={disabled}
          options={field.options ?? []}
          fullWidth
        />
      );

    case "checkbox":
      return (
        <BmFieldCheckbox
          label={field.label}
          checked={Boolean(value)}
          onChange={handleChange}
          disabled={disabled}
        />
      );

    case "number":
      return (
        <BmFieldText
          label={field.label}
          required={field.required}
          errorText={error}
          helperText={helperText}
          value={String(value ?? "")}
          onChange={handleChange}
          placeholder={field.placeholder}
          disabled={disabled}
          type="number"
          fullWidth
        />
      );

    case "readonly":
      return (
        <BmFieldText
          label={field.label}
          required={field.required}
          errorText={error}
          value={String(value ?? field.placeholder ?? "")}
          onChange={handleChange}
          readOnly
          fullWidth
        />
      );

    case "text":
    default:
      return (
        <BmFieldText
          label={field.label}
          required={field.required}
          errorText={error}
          helperText={helperText}
          value={String(value ?? "")}
          onChange={handleChange}
          placeholder={field.placeholder}
          disabled={disabled}
          fullWidth
        />
      );
  }
}
