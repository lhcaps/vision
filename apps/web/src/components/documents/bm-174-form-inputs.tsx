"use client";

/**
 * BM-174 — Yêu cầu áp dụng biện pháp điều tra tố tụng đặc biệt
 * Stage: DIEU_TRA_DAC_BIET (Điều tra tố tụng đặc biệt), Group: G04
 *
 * STUB: Component này hiện đang dùng GenericTemplateFormInputsPanel (đã có smart-defaults,
 * lưu/đọc payload đầy đủ, hỗ trợ placeholder replacement). Khi cần UI riêng cho biểu mẫu
 * này, thay thế phần render bên trong bằng BmFormSection + BmFieldText/Textarea theo
 * docs/BM_CANONICAL_SPEC.md.
 */
import { useEffect, useState } from "react";
import { absoluteApiUrl } from "@/lib/api-client";
import { BmFormMetaBar } from "@/components/documents/bm-form";
import { GenericTemplateFormInputsPanel } from "./generic-template-form-inputs";

type PayloadResponse = {
  document?: { id?: string | null; documentCode?: string | null } | null;
  template?: {
    templateCode?: string | null;
    templateName?: string | null;
    renderScope?: string | null;
  } | null;
};

type Props = {
  documentId: string | number;
  onSaved?: () => void;
};

export function Bm174FormInputsPanel({ documentId, onSaved }: Props) {
  const [payload, setPayload] = useState<PayloadResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(
    "Đây là form stub dùng GenericTemplateFormInputsPanel. Khi cần UI riêng, hãy thay phần render bên trong bằng BmFormSection + BmFieldText theo docs/BM_CANONICAL_SPEC.md.",
  );

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setIsLoading(true);
        const res = await fetch(
          absoluteApiUrl(`/documents/generated/${documentId}/render-payload`),
          { method: "GET", credentials: "include", headers: { Accept: "application/json" }, cache: "no-store" },
        );
        if (!res.ok) throw new Error(await res.text());
        if (isMounted) setPayload((await res.json()) as PayloadResponse);
      } catch (e) {
        if (isMounted) setError(e instanceof Error ? e.message : "Lỗi tải payload");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    void load();
    return () => { isMounted = false; };
  }, [documentId]);

  function handleSaved() {
    setIsDirty(false);
    setSavedAt(new Date());
    onSaved?.();
  }

  const scope = payload?.template?.renderScope ?? "UNKNOWN_SCOPE";

  return (
    <div className="space-y-4">
      <BmFormMetaBar
        title="Yêu cầu áp dụng biện pháp điều tra tố tụng đặc biệt"
        subtitle={`Biểu mẫu TT 03/2026-VKSTC · Stage: DIEU_TRA_DAC_BIET (Điều tra tố tụng đặc biệt) · Group: G04 · Scope: ${scope}`}
        templateCode="BM-174"
        isDirty={isDirty}
        isLoading={isLoading}
        errorMessage={error}
        warningMessage={warningMessage}
        savedAt={savedAt}
        meta={
          <div className="text-xs text-slate-500">
            <div>Stage: <span className="font-mono">DIEU_TRA_DAC_BIET</span></div>
            <div>Group: <span className="font-mono">G04</span></div>
          </div>
        }
      />
      <div onInput={() => setIsDirty(true)}>
        <GenericTemplateFormInputsPanel documentId={documentId} onSaved={handleSaved} />
      </div>
    </div>
  );
}
