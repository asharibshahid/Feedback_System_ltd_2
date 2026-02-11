"use client";

import { motion } from "framer-motion";

export type StatusChipProps = {
  label: string;
  value: string;
  detail: string;
  tone?: "success" | "warning" | "danger" | "neutral";
};

const toneStyles: Record<NonNullable<StatusChipProps["tone"]>, string> = {
  success: "from-[color:var(--bm-primary-soft)] to-white text-[color:var(--bm-text)]",
  warning: "from-[color:var(--bm-accent-soft)] to-white text-[color:var(--bm-text)]",
  danger: "from-[color:var(--bm-accent-soft)] to-white text-[color:var(--bm-text)]",
  neutral: "from-[color:var(--bm-primary-soft)] to-white text-[color:var(--bm-text)]",
};

export function StatusChip({ label, value, detail, tone = "neutral" }: StatusChipProps) {
  return (
    <motion.div
      className={`flex flex-col rounded-[24px] border border-[color:var(--bm-border)] bg-gradient-to-br px-5 py-4 shadow-[0_25px_50px_rgba(31,27,24,0.15)] backdrop-blur-3xl ${toneStyles[tone]}`}
      initial={{ scale: 0.96, opacity: 0.85 }}
      animate={{ scale: [0.96, 1], opacity: [0.85, 1], y: [0, -2, 0] }}
      transition={{ duration: 2.4, repeat: Infinity, repeatType: "mirror", ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="text-xs font-semibold uppercase tracking-[0.4em]">{label}</span>
      <span className="text-3xl font-semibold">{value}</span>
      <span className="text-xs text-[color:var(--bm-text-muted)]">{detail}</span>
    </motion.div>
  );
}
