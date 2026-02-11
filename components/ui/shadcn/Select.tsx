"use client";

import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";

type Option = {
  label: string;
  value: string;
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: Option[];
  helperText?: string;
  error?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, helperText, error, className = "", ...props }, ref) => (
    <label className="grid gap-2 text-sm font-semibold text-[color:var(--bm-text)]">
      <span className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">{label}</span>
      <div className="relative">
        <select
          {...props}
          ref={ref}
          className={`w-full appearance-none rounded-[12px] border border-[color:var(--bm-border)] bg-white/80 px-3 py-2 text-sm text-[color:var(--bm-text)] outline-none transition ring-accent focus:ring-2 ${className}`}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-2 text-xs text-[color:var(--bm-text-soft)]">v</span>
      </div>
      {error ? (
        <span className="text-xs text-[color:var(--bm-accent)]">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-[color:var(--bm-text-muted)]">{helperText}</span>
      ) : null}
    </label>
  ),
);

Select.displayName = "Select";
