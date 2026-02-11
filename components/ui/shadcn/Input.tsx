"use client";

import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  helperText?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, className = "", ...props }, ref) => (
    <label className="grid gap-2 text-sm font-semibold text-[color:var(--bm-text)]">
      <span className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">{label}</span>
      <input
        {...props}
        ref={ref}
        className={`w-full rounded-[12px] border border-[color:var(--bm-border)] bg-white/80 px-3 py-2 text-sm text-[color:var(--bm-text)] outline-none transition ring-accent focus:ring-2 ${className}`}
      />
      {error ? (
        <span className="text-xs text-[color:var(--bm-accent)]">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-[color:var(--bm-text-muted)]">{helperText}</span>
      ) : null}
    </label>
  ),
);

Input.displayName = "Input";
