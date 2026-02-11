"use client";

import { motion } from "framer-motion";

type RadioOption = {
  label: string;
  value: string;
  helper?: string;
};

type RadioGroupProps = {
  label: string;
  value: string;
  options: RadioOption[];
  onValueChange: (value: string) => void;
};

export function RadioGroup({ label, value, options, onValueChange }: RadioGroupProps) {
  return (
    <div className="space-y-2">
      <div className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">{label}</div>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <motion.button
              key={option.value}
              type="button"
              onClick={() => onValueChange(option.value)}
              className={`flex min-w-[120px] flex-col items-start justify-center gap-1 rounded-[14px] border px-4 py-3 text-left transition ${
                isSelected
                  ? "border-[color:var(--bm-accent)] bg-white shadow-[0_20px_35px_rgba(222,66,38,0.22)]"
                  : "border-[color:var(--bm-border)] bg-white/80"
              }`}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-sm font-semibold text-[color:var(--bm-text)]">{option.label}</span>
              {option.helper && <span className="text-[0.7rem] text-[color:var(--bm-text-muted)]">{option.helper}</span>}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
