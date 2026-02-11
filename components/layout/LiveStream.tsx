"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { FeedItem } from "@/lib/dashboardData";
import { getSupabaseClient } from "@/lib/supabaseClient";

type LiveStreamProps = {
  items: FeedItem[];
};

export function LiveStream({ items }: LiveStreamProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [localItems, setLocalItems] = useState<FeedItem[]>(items);
  const marqueeItems = useMemo(() => [...localItems, ...localItems], [localItems]);
  const supabase = useMemo(() => getSupabaseClient(), []);

  useEffect(() => {
    const el = scrollRef.current;
    const prevTop = el?.scrollTop ?? 0;
    setLocalItems(items);
    requestAnimationFrame(() => {
      if (el) el.scrollTop = prevTop;
    });
  }, [items]);

  const normalizeStatus = (value: string | null): FeedItem["status"] =>
    value === "complete" ? "complete" : "pending";

  const refreshList = async () => {
    const { data, error } = await supabase
      .from("visits")
      .select("id, full_name, purpose, status, entry_lane, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error || !data) {
      console.error("REFRESH FAILED:", error?.message ?? "unknown error");
      return;
    }
    setLocalItems(
      data.map((entry) => ({
        id: entry.id,
        name: entry.full_name ?? "Visitor",
        status: normalizeStatus(typeof entry.status === "string" ? entry.status : null),
        purpose: entry.purpose ?? entry.entry_lane ?? "Standby",
        time: entry.created_at
          ? new Date(entry.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
          : "--",
      })),
    );
  };

  const onChangeStatus = async (visitId: string, nextStatus: FeedItem["status"]) => {
    const previous = localItems;
    setLocalItems((prev) => prev.map((r) => (r.id === visitId ? { ...r, status: nextStatus } : r)));

    const { error } = await supabase.from("visits").update({ status: nextStatus }).eq("id", visitId);

    if (error) {
      console.error("STATUS UPDATE FAILED:", error.message);
      alert("DB update failed: " + error.message);
      setLocalItems(previous);
      return;
    }

    await refreshList();
  };

  return (
    <motion.section
      className="w-96 max-w-[340px] border-l border-[color:var(--bm-border)] bg-white/90 px-6 py-6 shadow-[0_30px_60px_rgba(31,27,24,0.18)] backdrop-blur-xl"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 85, damping: 16 }}
    >
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Live stream</p>
        <h2 className="text-2xl font-semibold text-[color:var(--bm-text)]">Visitor horizon</h2>
        <p className="text-sm text-[color:var(--bm-text-muted)]">Realtime arrivals & health status.</p>
      </div>
      <div
        ref={scrollRef}
        className="mt-6 h-[80vh] max-h-[560px] overflow-y-auto rounded-[22px] border border-[color:var(--bm-border)] bg-[color:var(--bm-primary-soft)] p-4"
      >
        <motion.div className="space-y-4">
          {marqueeItems.map((item, index) => (
            <motion.article
              key={`${item.name}-${index}`}
              className="rounded-[18px] border border-[color:var(--bm-border)] bg-white/80 p-4 shadow-[0_20px_40px_rgba(31,27,24,0.12)] backdrop-blur"
              whileHover={{ translateY: -4, boxShadow: "0 25px 45px rgba(31,27,24,0.25)" }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              layout
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-[color:var(--bm-text)]">{item.name}</p>
                  <p className="text-xs text-[color:var(--bm-text-muted)]">{item.purpose}</p>
                </div>
                <span className="rounded-full border border-[color:var(--bm-border)] bg-white px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-transparent shadow-[0_5px_12px_rgba(31,27,24,0.08)] select-none">
                  &nbsp;
                </span>
              </div>
              <p className="mt-2 text-[0.65rem] text-[color:var(--bm-text-soft)]">{item.time}</p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}

