/**
 * Auth events — global bus để các phần của app phản ứng với sự kiện auth
 * mà không cần React tree coupling.
 *
 * Hiện tại có 2 sự kiện:
 *  - "unauthorized"  : API trả 401 (session hết hạn / invalid). UI cần chuyển về /login.
 *  - "session-changed": session bị thay đổi (login, logout, refresh).
 *
 * Lý do có bus này: window.fetch được monkey-patch trong api-client.ts trước
 * khi React tree mount, nên cần cơ chế publish/subscribe đơn giản để
 * AuthProvider (mounted sau) lắng nghe sự kiện 401 từ mọi fetch.
 */

export type AuthEvent =
  | { type: "unauthorized"; url?: string }
  | { type: "session-changed" };

type Listener = (event: AuthEvent) => void;

const listeners = new Set<Listener>();

let warnedNoListener = false;

export function subscribeAuthEvents(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitAuthEvent(event: AuthEvent): void {
  if (listeners.size === 0 && !warnedNoListener && event.type === "unauthorized") {
    warnedNoListener = true;
    if (typeof console !== "undefined") {
      console.warn(
        "[auth] Nhận 401 nhưng chưa có listener. AuthProvider có còn mount?",
      );
    }
  }

  for (const listener of Array.from(listeners)) {
    try {
      listener(event);
    } catch (error) {
      if (typeof console !== "undefined") {
        console.error("[auth] Auth event listener threw:", error);
      }
    }
  }
}
