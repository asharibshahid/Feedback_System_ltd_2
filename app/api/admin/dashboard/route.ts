import { NextResponse } from "next/server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { DashboardResponse } from "@/lib/types/dashboard";
import { normalizeStatus } from "@/lib/status";

export const dynamic = "force-static";

function startOfTodayIso() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString();
}

async function countVisits(
  supabase: SupabaseClient,
  startOfDay: string,
  filter?: { column: string; values: string[] },
) {
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

function buildHourlyTrend(rows: Array<{ created_at: string | null }>) {
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

async function fetchTrend(supabase: SupabaseClient, startOfDay: string) {
  const { data, error } = await supabase
    .from("visits")
    .select("created_at")
    .gte("created_at", startOfDay)
    .order("created_at", { ascending: true })
    .limit(10000);

  if (error) {
    throw error;
  }

  return buildHourlyTrend(data ?? []);
}

export async function GET() {
  const supabase = getSupabaseAdmin();
  const todayStart = startOfTodayIso();

  try {
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

    const trend = await fetchTrend(supabase, todayStart);

    const response: DashboardResponse = {
      kpis: {
        total_today,
        approved_today,
        blocked_today,
        review_today,
        checked_in_today,
        health_blocked_today,
        gate_readiness_pct: gateReadinessPct,
      },
      live_stream: Array.isArray(liveStream)
        ? liveStream.map((item) => ({
            ...item,
            status: normalizeStatus(
              typeof item.status === "string"
                ? item.status
                : typeof item.health_status === "string"
                  ? item.health_status
                  : null,
            ),
          }))
        : [],
      trend,
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch dashboard data.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
