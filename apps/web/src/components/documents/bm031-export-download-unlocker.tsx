"use client";

import { useEffect } from "react";

function getApiBaseUrl(): string {
  const envValue =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "";

  if (envValue.trim()) {
    return envValue.replace(/\/$/, "");
  }

  if (typeof window === "undefined") {
    return "http://localhost:3001/api/v1";
  }

  const { protocol, hostname } = window.location;

  return `${protocol}//${hostname}:3001/api/v1`;
}

function getGeneratedDocumentId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const match = window.location.pathname.match(/\/documents\/(\d+)/);

  return match?.[1] ?? null;
}

async function renderAndDownloadLatestFile(
  documentId: string,
  format: "DOCX" | "PDF",
): Promise<void> {
  const apiBaseUrl = getApiBaseUrl();
  const endpoint = format === "DOCX" ? "render-docx" : "convert-pdf";
  const extension = format === "DOCX" ? "docx" : "pdf";

  const response = await fetch(
    `${apiBaseUrl}/documents/generated/${documentId}/${endpoint}?force=true`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Accept: "application/json",
      },
      body: JSON.stringify({ force: true }),
    },
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");

    throw new Error(
      text ||
        `Không ${format === "DOCX" ? "tạo DOCX" : "xuất PDF"} được. HTTP ${response.status}`,
    );
  }

  const result = await response.json();

  const file = result?.file ?? result?.data?.file ?? result;
  const fileId =
    file?.id ??
    file?.fileId ??
    file?.storedFileId ??
    result?.fileId ??
    result?.storedFileId;

  const fileName =
    file?.fileName ??
    file?.originalName ??
    file?.name ??
    `BM-031-${documentId}.${extension}`;

  if (!fileId) {
    throw new Error(
      `API đã ${format === "DOCX" ? "tạo DOCX" : "xuất PDF"} nhưng không trả file id để tải.`,
    );
  }

  const downloadUrl = `${apiBaseUrl}/documents/generated/${documentId}/files/${fileId}/download`;

  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = fileName;
  link.rel = "noopener noreferrer";

  document.body.appendChild(link);
  link.click();
  link.remove();
}

function isButtonLike(element: Element): element is HTMLButtonElement {
  return element instanceof HTMLButtonElement;
}

function getButtonText(button: HTMLButtonElement): string {
  return (button.textContent ?? "").replace(/\s+/g, " ").trim();
}

function unlockButton(button: HTMLButtonElement, format: "DOCX" | "PDF"): void {
  if (button.dataset.bm031DownloadUnlocked === format) {
    return;
  }

  button.dataset.bm031DownloadUnlocked = format;
  button.disabled = false;
  button.removeAttribute("disabled");
  button.removeAttribute("aria-disabled");
  button.title = "";

  button.style.cursor = "pointer";
  button.style.opacity = "1";
  button.style.pointerEvents = "auto";

  button.addEventListener(
    "click",
    async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const documentId = getGeneratedDocumentId();

      if (!documentId) {
        window.alert("Không xác định được mã biểu mẫu để tải file.");
        return;
      }

      const originalText = button.textContent ?? "";

      try {
        button.disabled = true;
        button.textContent =
          format === "DOCX" ? "Đang tạo/tải DOCX..." : "Đang xuất/tải PDF...";

        await renderAndDownloadLatestFile(documentId, format);
      } catch (error) {
        window.alert(
          error instanceof Error
            ? error.message
            : `Không tải được ${format}.`,
        );
      } finally {
        button.disabled = false;
        button.textContent = originalText;
      }
    },
    true,
  );
}

function unlockExportDownloadButtons(): void {
  if (typeof document === "undefined") {
    return;
  }

  if (!/\/documents\/\d+/.test(window.location.pathname)) {
    return;
  }

  const buttons = Array.from(document.querySelectorAll("button")).filter(
    isButtonLike,
  );

  for (const button of buttons) {
    const text = getButtonText(button);

    if (text === "Tải DOCX mới nhất") {
      unlockButton(button, "DOCX");
    }

    if (text === "Tải PDF mới nhất") {
      unlockButton(button, "PDF");
    }
  }
}

export function Bm031ExportDownloadUnlocker(): null {
  useEffect(() => {
    unlockExportDownloadButtons();

    const interval = window.setInterval(unlockExportDownloadButtons, 700);

    const observer = new MutationObserver(() => {
      unlockExportDownloadButtons();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["disabled", "aria-disabled", "class", "style"],
    });

    return () => {
      window.clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  return null;
}