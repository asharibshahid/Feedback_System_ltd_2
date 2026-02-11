"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import type { KpiStat } from "@/lib/types/dashboard";

const AnimatedNumber = ({ value }: { value: number }) => {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 120, damping: 20 });
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      setDisplay(Math.round(latest));
    });
    motionValue.set(value);
    return () => unsubscribe();
  }, [motionValue, spring, value]);

  return <motion.span className="text-3xl font-semibold text-[color:var(--bm-text)]">{display}</motion.span>;
};

export function KpiGrid({ stats }: { stats: KpiStat[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <GlassPanel
          key={stat.label}
          className="flex flex-col gap-3 bg-white/90"
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">
            <span>{stat.label}</span>
            <span className="text-[color:var(--bm-accent)]">{stat.delta}</span>
          </div>
          <div className="flex items-center justify-between">
            <AnimatedNumber value={stat.value} />
            <motion.div
              className="h-3 w-16 rounded-full bg-[color:var(--bm-accent)]"
              animate={{ scaleX: [0.8, 1.05, 0.9] }}
              transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
            />
          </div>
        </GlassPanel>
      ))}
    </div>
  );
}
