export type DashboardKpis = {
  total_today: number;
  approved_today: number;
  blocked_today: number;
  review_today: number;
  checked_in_today: number;
  health_blocked_today: number;
  gate_readiness_pct: number;
};

export type LiveStreamItem = {
  id: string;
  full_name: string | null;
  purpose: string | null;
  status: import("@/lib/status").CanonicalStatus | null;
  health_status: string | null;
  created_at: string | null;
};

export type TrendPoint = {
  hour: string;
  count: number;
};

export type DashboardResponse = {
  kpis: DashboardKpis;
  live_stream: LiveStreamItem[];
  trend: TrendPoint[];
};

export type KpiStat = {
  label: string;
  value: number;
  delta: string;
};
