"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./auth-context";
import { fetchCurrentAgency, fetchOfficials } from "./auth-client";

/**
 * Hook lấy danh sách KSV (officials) từ API thật.
 * Thay thế cho các BM*_OPTIONS hardcode.
 */
export function useSignerOptions(): {
  options: Array<{ id: string; label: string; fullName: string; positionTitle: string | null; agencyName: string | null }>;
  loading: boolean;
} {
  const [options, setOptions] = useState<
    Array<{ id: string; label: string; fullName: string; positionTitle: string | null; agencyName: string | null }>
  >([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await fetchOfficials();
        if (cancelled) return;
        setOptions(
          rows.map((o) => ({
            id: o.id,
            label: `${o.fullName}${o.positionTitle ? ` - ${o.positionTitle}` : ""}`,
            fullName: o.fullName,
            positionTitle: o.positionTitle,
            agencyName: o.agencyName,
          })),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return { options, loading };
}

/**
 * Hook lấy agency hiện tại (lấy từ official đầu tiên active — đơn giản cho dev).
 * Production nên có bảng `current_agency_config` riêng.
 */
export function useCurrentAgency(): {
  agency: { id: string; name: string; code: string | null; parentName: string | null } | null;
  loading: boolean;
} {
  const { user } = useAuth();
  const [fallback, setFallback] = useState<{
    id: string;
    name: string;
    code: string | null;
    parentName: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.agencyId) {
      setFallback({
        id: user.agencyId,
        name: user.agencyName ?? "",
        code: user.agencyCode,
        parentName: null,
      });
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchCurrentAgency()
      .then((data) => {
        if (!cancelled) setFallback(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return { agency: fallback, loading };
}
