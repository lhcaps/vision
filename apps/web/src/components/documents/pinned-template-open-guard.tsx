"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const PINNED_TEMPLATE_DOCUMENTS: Record<string, number> = {
  "BM-090": 140,
  "BM-097": 144,
  "BM-156": 119,
};

const PINNED_CODES = Object.keys(PINNED_TEMPLATE_DOCUMENTS);

function isDocumentDetailPage(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return /^\/documents\/\d+(\/)?$/u.test(window.location.pathname);
}

function isUnsafeDownloadOrFileLink(anchor: HTMLAnchorElement): boolean {
  const href = anchor.getAttribute("href") || "";

  return (
    anchor.hasAttribute("download") ||
    /\.(docx|pdf)(\?|#|$)/iu.test(href) ||
    href.includes("/api/") ||
    href.includes("/storage/") ||
    href.includes("render-docx") ||
    href.includes("convert-pdf") ||
    href.includes("download")
  );
}

function getPinnedCodesFromText(text: string): string[] {
  return PINNED_CODES.filter((code) => text.includes(code));
}

function isSmallTemplateCard(element: HTMLElement): boolean {
  const text = (element.textContent || "").replace(/\s+/gu, " ").trim();

  if (!text) {
    return false;
  }

  // Card biểu mẫu thường ngắn. Section/giai đoạn chứa nhiều card rất dài.
  // Guard cũ sai vì đọc text ở container lớn chứa BM-090 nên mọi click đều về BM-090.
  if (text.length > 450) {
    return false;
  }

  if (!text.includes("Mở biểu mẫu") && !text.includes("Có thể mở")) {
    return false;
  }

  const matchedCodes = getPinnedCodesFromText(text);

  // Chỉ pin khi card nhỏ chứa đúng 1 BM pinned.
  return matchedCodes.length === 1;
}

function findPinnedTemplateCodeFromClick(target: HTMLElement | null): string | null {
  if (!target) {
    return null;
  }

  const directCode =
    target.getAttribute("data-template-code") ||
    target.getAttribute("data-template") ||
    target.getAttribute("data-code") ||
    "";

  if (PINNED_TEMPLATE_DOCUMENTS[directCode]) {
    return directCode;
  }

  let current: HTMLElement | null = target;

  for (let depth = 0; current && depth < 8; depth += 1) {
    const codeAttr =
      current.getAttribute("data-template-code") ||
      current.getAttribute("data-template") ||
      current.getAttribute("data-code") ||
      "";

    if (PINNED_TEMPLATE_DOCUMENTS[codeAttr]) {
      return codeAttr;
    }

    if (isSmallTemplateCard(current)) {
      const text = current.textContent || "";
      const matchedCodes = getPinnedCodesFromText(text);
      return matchedCodes[0] ?? null;
    }

    current = current.parentElement;
  }

  return null;
}

function findPinnedTemplateCodeForAnchor(anchor: HTMLAnchorElement): string | null {
  if (isUnsafeDownloadOrFileLink(anchor)) {
    return null;
  }

  let current: HTMLElement | null = anchor;

  for (let depth = 0; current && depth < 8; depth += 1) {
    const codeAttr =
      current.getAttribute("data-template-code") ||
      current.getAttribute("data-template") ||
      current.getAttribute("data-code") ||
      "";

    if (PINNED_TEMPLATE_DOCUMENTS[codeAttr]) {
      return codeAttr;
    }

    if (isSmallTemplateCard(current)) {
      const matchedCodes = getPinnedCodesFromText(current.textContent || "");
      return matchedCodes[0] ?? null;
    }

    current = current.parentElement;
  }

  return null;
}

function rewritePinnedAnchors() {
  // Tuyệt đối không rewrite trong trang chi tiết biểu mẫu.
  // Nếu không, link tải DOCX/PDF có text chứa BM-156 cũng bị đổi thành /documents/119.
  if (isDocumentDetailPage()) {
    return;
  }

  const anchors = Array.from(document.querySelectorAll("a"));

  for (const anchor of anchors) {
    const code = findPinnedTemplateCodeForAnchor(anchor);

    if (!code) {
      continue;
    }

    const pinnedId = PINNED_TEMPLATE_DOCUMENTS[code];

    if (!pinnedId) {
      continue;
    }

    const href = `/documents/${pinnedId}`;

    if (anchor.getAttribute("href") !== href) {
      anchor.setAttribute("href", href);
    }
  }
}

export function PinnedTemplateOpenGuard() {
  const router = useRouter();

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented) {
        return;
      }

      if (isDocumentDetailPage()) {
        return;
      }

      const target = event.target instanceof HTMLElement ? event.target : null;

      if (!target) {
        return;
      }

      const clickable = target.closest(
        "a,button,[role='button'],[data-template-code],[data-template],[data-code]",
      ) as HTMLElement | null;

      const code = findPinnedTemplateCodeFromClick(clickable || target);

      if (!code) {
        return;
      }

      const pinnedId = PINNED_TEMPLATE_DOCUMENTS[code];

      if (!pinnedId) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      router.push(`/documents/${pinnedId}`);
    }

    rewritePinnedAnchors();

    const observer = new MutationObserver(() => {
      rewritePinnedAnchors();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    document.addEventListener("click", handleClick, true);

    return () => {
      observer.disconnect();
      document.removeEventListener("click", handleClick, true);
    };
  }, [router]);

  return null;
}