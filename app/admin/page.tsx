"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useMemo } from "react";

import { LiveStream } from "@/components/layout/LiveStream";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { VisitorLineChart } from "@/components/charts/VisitorLineChart";
import { StatusDonut } from "@/components/charts/StatusDonut";
import { FeedItem, liveFeed } from "@/lib/dashboardData";
import { getVisitorsByDay } from "@/lib/mockVisitors";
import type { KpiStat } from "@/lib/types/dashboard";
import { useAdminDashboard } from "@/lib/hooks/useAdminDashboard";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.18,
    },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

const chartVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

export default function AdminPage() {
  const { data, loading, error, refetch } = useAdminDashboard();
  const dailyStats = useMemo(() => getVisitorsByDay(7), []);
  const fallbackLineData = useMemo(
    () => dailyStats.map((entry) => ({ day: entry.day, value: Math.max(entry.total, 3) })),
    [dailyStats],
  );

  const computedStats: KpiStat[] = useMemo(() => {
    const kpis = data?.kpis;
    return [
      { label: "Today visitors", value: kpis?.total_today ?? 0, delta: "+0.0%" },
      { label: "Blocked (health)", value: kpis?.health_blocked_today ?? 0, delta: "-0.0%" },
    ];
  }, [data]);

  const liveStreamItems = useMemo<FeedItem[]>(() => {
    if (data?.live_stream?.length) {
      return data.live_stream.map((entry) => ({
        id: entry.id ?? undefined,
        name: entry.full_name ?? "Visitor",
        status: "complete",
        purpose: entry.purpose ?? "Standby",
        time: entry.created_at
          ? new Date(entry.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
          : "--",
      }));
    }
    return liveFeed;
  }, [data]);

  const donutData = useMemo(() => {
    const kpis = data?.kpis;
    const total = kpis?.total_today ?? 0;
    const healthBlocked = kpis?.health_blocked_today ?? 0;
    const completed = Math.max(total - healthBlocked, 0);
    return [
      { name: "Complete", value: completed, color: "#16A34A" },
      { name: "Health blocks", value: healthBlocked, color: "#DC2626" },
    ];
  }, [data]);

  const chartData = data?.trend?.length
    ? data.trend.map((item) => ({ day: item.hour ?? "--", value: item.count ?? 0 }))
    : fallbackLineData;

  const nextArrival = liveStreamItems[0];

  return (
    <div className="relative flex min-h-screen w-screen overflow-hidden bg-[color:var(--bm-bg)]">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white to-[color:var(--bm-primary-soft)]" />
      <motion.main
        className="relative z-10 flex h-full w-full overflow-hidden"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <section className="flex flex-1 flex-col gap-6 px-6 py-8">
          <motion.header variants={sectionVariants} className="space-y-3">
            <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Command center</p>
            <h1 className="text-4xl font-semibold text-[color:var(--bm-text)]">Immersive intelligence grid</h1>
            <p className="max-w-2xl text-sm text-[color:var(--bm-text-muted)]">
              Single-pane control view for visitor intake, health telemetry, and gate readiness. Every pulse and badge is live.
            </p>
          </motion.header>
          <div className="flex flex-wrap gap-3 rounded-[20px] border border-[color:var(--bm-border)] bg-white/80 px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--bm-text-muted)] shadow-sm">
            <Link
              href="/admin"
              className="rounded-full border border-[color:var(--bm-primary)] bg-white px-4 py-2 text-[0.65rem] text-[color:var(--bm-primary)] transition hover:bg-[color:var(--bm-primary-soft)]"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/visitors"
              className="rounded-full border border-[color:var(--bm-accent)] px-4 py-2 text-[0.65rem] text-[color:var(--bm-accent)] transition hover:bg-[color:var(--bm-accent-soft)]"
            >
              Visitors
            </Link>
            <Link
              href="/visitor/checkin"
              className="rounded-full border border-[color:var(--bm-primary)] bg-white px-4 py-2 text-[0.65rem] text-[color:var(--bm-primary)] transition hover:bg-[color:var(--bm-primary-soft)]"
            >
              New Check-in
            </Link>
          </div>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[18px] border border-[color:var(--bm-accent)] bg-[color:var(--bm-accent-soft)] px-5 py-3 text-sm font-semibold text-[color:var(--bm-accent)]"
            >
              <p>{error}</p>
              <button
                type="button"
                onClick={refetch}
                className="mt-2 text-xs font-semibold text-[color:var(--bm-accent)] underline underline-offset-2"
              >
                Retry
              </button>
            </motion.div>
          )}

          <motion.article
            variants={sectionVariants}
            className="flex flex-wrap items-center justify-between gap-4 rounded-[30px] border border-[color:var(--bm-border)] bg-[color:var(--bm-primary-soft)] p-5 shadow-[0_30px_60px_rgba(31,27,24,0.18)] backdrop-blur-xl"
            whileHover={{ translateY: -2, boxShadow: "0 35px 80px rgba(31,27,24,0.3)" }}
          >
            {loading ? (
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 rounded-full bg-[color:var(--bm-border)]" />
                <div className="h-6 w-48 rounded-full bg-[color:var(--bm-border)]" />
                <div className="h-3 w-40 rounded-full bg-[color:var(--bm-border)]" />
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Next arrival</p>
                <p className="text-2xl font-semibold text-[color:var(--bm-text)]">
                  {nextArrival?.name ?? "Awaiting crew"}
                </p>
                <p className="text-sm text-[color:var(--bm-text-muted)]">
                  {nextArrival?.purpose ?? "Standby"}
                </p>
              </div>
            )}
            <div className="text-right">
              {loading ? (
                <div className="space-y-1 text-right">
                  <div className="mx-auto h-3 w-10 rounded-full bg-[color:var(--bm-border)]" />
                  <div className="mx-auto h-6 w-20 rounded-full bg-[color:var(--bm-border)]" />
                </div>
              ) : (
                <>
                  <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">ETA</p>
                  <p className="text-3xl font-semibold text-[color:var(--bm-accent)]">
                    {nextArrival?.time ?? "-"}
                  </p>
                  <p className="text-xs text-[color:var(--bm-text-muted)]">Live stream arrival</p>
                </>
              )}
            </div>
          </motion.article>

          <motion.div variants={sectionVariants}>
            <KpiGrid stats={computedStats} />
          </motion.div>

          <div className="grid flex-1 gap-6 lg:grid-cols-2">
            <motion.div
              variants={chartVariants}
              initial="hidden"
              animate="visible"
              className="rounded-[28px] border border-[color:var(--bm-border)] bg-white/80 p-5 shadow-[0_35px_60px_rgba(31,27,24,0.18)] backdrop-blur-3xl"
              whileHover={{ y: -3, boxShadow: "0 40px 85px rgba(31,27,24,0.25)" }}
            >
              <VisitorLineChart data={chartData} />
            </motion.div>

            <motion.div
              variants={chartVariants}
              initial="hidden"
              animate="visible"
              className="rounded-[28px] border border-[color:var(--bm-border)] bg-[color:var(--bm-primary-soft)] p-5 shadow-[0_35px_60px_rgba(31,27,24,0.18)] backdrop-blur-3xl"
              whileHover={{ y: -3, boxShadow: "0 40px 85px rgba(31,27,24,0.25)" }}
            >
              <StatusDonut data={donutData} />
            </motion.div>

          </div>
        </section>

        <LiveStream items={liveStreamItems} />
      </motion.main>
    </div>
  );
}

