"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { IconRailItem } from "@/lib/dashboardData";

type ControlRailProps = {
  items: IconRailItem[];
  activeIndex: number;
  onHover: (index: number) => void;
};

export function ControlRail({ items, activeIndex, onHover }: ControlRailProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const isExpandedIndex = (index: number) => hoveredIndex === index || activeIndex === index;

  return (
    <motion.aside
      className="relative flex h-screen w-20 flex-col items-center justify-between border-r border-[color:var(--bm-border)] bg-white/70 px-3 py-6 shadow-[0_40px_120px_rgba(31,27,24,0.22)] backdrop-blur-2xl"
      initial={{ opacity: 0, x: -32 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 85, damping: 16 }}
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        {items.map((item, index) => {
          const isActive = activeIndex === index;
          const showLabel = isExpandedIndex(index);

          const IconComponent = item.icon;
          return (
            <div key={item.label} className="relative w-full">
              <motion.button
                type="button"
                aria-label={item.label}
                onHoverStart={() => {
                  setHoveredIndex(index);
                  onHover(index);
                }}
                onHoverEnd={() => setHoveredIndex(null)}
                onFocus={() => setHoveredIndex(index)}
                onBlur={() => setHoveredIndex(null)}
                className="relative flex w-full items-center justify-center rounded-[20px] border border-transparent bg-white/80 p-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--bm-accent)]"
                whileHover={{
                  scale: 1.04,
                  translateX: -3,
                  boxShadow: "0 20px 40px rgba(222,66,38,0.25)",
                }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <div
                  className={`relative flex h-12 w-12 items-center justify-center rounded-[16px] border transition ${
                    isActive
                      ? "border-transparent bg-[color:var(--bm-accent)] text-white shadow-[0_20px_50px_rgba(222,66,38,0.35)]"
                      : "border-white/80 bg-white text-[color:var(--bm-primary)] shadow-[0_18px_30px_rgba(31,27,24,0.12)]"
                  }`}
                >
                  <IconComponent size={20} />
                  {isActive && (
                    <motion.span
                      layoutId="rail-indicator"
                      className="absolute inset-y-2 -right-2 h-[70%] w-1 rounded-full bg-[color:var(--bm-accent)]"
                    />
                  )}
                </div>
              </motion.button>

              <AnimatePresence>
                {showLabel && (
                  <motion.span
                    layout
                    initial={{ opacity: 0, x: -36 }}
                    animate={{ opacity: 1, x: -16 }}
                    exit={{ opacity: 0, x: -36 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute left-full top-1/2 mt-[-0.75rem] rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-[color:var(--bm-text-muted)] shadow-[0_10px_25px_rgba(31,27,24,0.16)]"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
      <p className="text-center text-xs font-semibold uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">
        Command
      </p>
    </motion.aside>
  );
}
