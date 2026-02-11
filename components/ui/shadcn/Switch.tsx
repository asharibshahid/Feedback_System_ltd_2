"use client";

import { motion } from "framer-motion";

type SwitchProps = {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export function Switch({ label, description, checked, onCheckedChange }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className="flex w-full items-center justify-between rounded-[14px] border border-[color:var(--bm-border)] bg-white/90 px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--bm-accent)]"
    >
      <div>
        <p className="text-sm font-semibold text-[color:var(--bm-text)]">{label}</p>
        {description && <p className="text-xs text-[color:var(--bm-text-muted)]">{description}</p>}
      </div>
      <motion.span
        className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
          checked ? "bg-[color:var(--bm-accent)]" : "bg-[color:var(--bm-border)]"
        }`}
        layout
      >
        <motion.span
          className="absolute h-6 w-6 rounded-full bg-white shadow-[0_10px_20px_rgba(31,27,24,0.2)]"
          animate={{ x: checked ? 26 : 2 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
        />
      </motion.span>
    </button>
  );
}
