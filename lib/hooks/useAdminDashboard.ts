import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseClient } from "@/lib/supabaseClient";
import type { DashboardResponse, LiveStreamItem, TrendPoint } from "@/lib/types/dashboard";
import { normalizeStatus } from "@/lib/status";

type UseAdminDashboard = {
  data: DashboardResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useAdminDashboard(): UseAdminDashboard {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      const todayStart = startOfTodayIso();

      const [total_today, approved_today, blocked_today, review_today, checked_in_today, health_blocked_today] =
        await Promise.all([
          countVisits(supabase, todayStart),
          countVisits(supabase, todayStart, { column: "status", values: ["approved", "allowed"] }),
          countVisits(supabase, todayStart, { column: "status", values: ["blocked", "denied", "rejected"] }),
          countVisits(supabase, todayStart, { column: "status", values: ["review", "pending", "needs review"] }),
          countVisits(supabase, todayStart, { column: "status", values: ["checked-in", "checked in", "arrived"] }),
          countVisits(supabase, todayStart, { column: "health_status", values: ["blocked"] }),
        ]);

      const gateReadinessPct =
        total_today === 0 ? 0 : Math.round((approved_today / Math.max(1, total_today)) * 10000) / 100;

      const { data: liveStream, error: liveError } = await supabase
        .from("visits")
        .select("id, full_name, purpose, status, health_status, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

      if (liveError) {
        throw liveError;
      }

      const live_stream = normalizeLiveStream(liveStream);
      const trend = await fetchTrend(supabase, todayStart);

      const payload: DashboardResponse = {
        kpis: {
          total_today,
        approved_today,
        blocked_today,
        review_today,
        checked_in_today,
        health_blocked_today,
        gate_readiness_pct: gateReadinessPct,
      },
        live_stream,
        trend,
      };

      setData(payload);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    void fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

function startOfTodayIso(): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString();
}

async function countVisits(
  supabase: SupabaseClient,
  startOfDay: string,
  filter?: { column: string; values: string[] },
): Promise<number> {
  let query = supabase
    .from("visits")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startOfDay);

  if (filter?.values?.length) {
    const orFilter = filter.values.map((value) => `${filter.column}.ilike.${value}`).join(",");
    query = query.or(orFilter);
  }

  const { count, error } = await query;
  if (error) {
    throw error;
  }

  return count ?? 0;
}

function buildHourlyTrend(rows: Array<{ created_at: string | null }>): TrendPoint[] {
  const hours = new Map<string, number>();
  for (let i = 0; i < 24; i += 1) {
    const label = `${String(i).padStart(2, "0")}:00`;
    hours.set(label, 0);
  }

  rows.forEach((row) => {
    if (!row.created_at) return;
    const parsed = new Date(row.created_at);
    if (Number.isNaN(parsed.getTime())) {
      return;
    }
    const hour = `${String(parsed.getHours()).padStart(2, "0")}:00`;
    hours.set(hour, (hours.get(hour) ?? 0) + 1);
  });

  return Array.from(hours.entries()).map(([hour, count]) => ({ hour, count }));
}

async function fetchTrend(supabase: SupabaseClient, startOfDay: string): Promise<TrendPoint[]> {
  const { data, error } = await supabase
    .from("visits")
    .select("created_at")
    .gte("created_at", startOfDay)
    .order("created_at", { ascending: true })
    .limit(10000);

  if (error) {
    throw error;
  }

  const normalized = Array.isArray(data)
    ? data
        .filter(isRecord)
        .map((row) => ({
          created_at: typeof row.created_at === "string" ? row.created_at : null,
        }))
    : [];

  return buildHourlyTrend(normalized);
}

function normalizeLiveStream(raw: unknown): LiveStreamItem[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter(isRecord).map((row) => ({
    id: typeof row.id === "string" ? row.id : "",
    full_name: typeof row.full_name === "string" ? row.full_name : null,
    purpose: typeof row.purpose === "string" ? row.purpose : null,
    status: normalizeStatus(
      typeof row.status === "string"
        ? row.status
        : typeof row.health_status === "string"
          ? row.health_status
          : null,
    ),
    health_status: typeof row.health_status === "string" ? row.health_status : null,
    created_at: typeof row.created_at === "string" ? row.created_at : null,
  }));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
