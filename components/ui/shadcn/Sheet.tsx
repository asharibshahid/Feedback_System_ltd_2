"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback } from "react";
import type { ReactNode } from "react";

type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  side?: "right" | "left";
  children: ReactNode;
  size?: "sm" | "md" | "lg";
};

const sizeClass: Record<NonNullable<SheetProps["size"]>, string> = {
  sm: "max-w-[320px]",
  md: "max-w-[420px]",
  lg: "max-w-[560px]",
};

export function Sheet({ open, onOpenChange, title, side = "right", children, size = "md" }: SheetProps) {
  const handleClose = useCallback(() => onOpenChange(false), [onOpenChange]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-stretch bg-black/30 backdrop-blur"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className={`relative flex h-full flex-col justify-between border border-[color:var(--bm-border)] bg-white shadow-[0_30px_80px_rgba(31,27,24,0.2)] ${sizeClass[size]} ${
              side === "right" ? "ml-auto" : "mr-auto"
            }`}
            initial={{ x: side === "right" ? 200 : -200 }}
            animate={{ x: 0 }}
            exit={{ x: side === "right" ? 200 : -200 }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-[color:var(--bm-border)] px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Sheet</p>
                {title && <h3 className="text-lg font-semibold text-[color:var(--bm-text)]">{title}</h3>}
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full border border-[color:var(--bm-primary)] bg-white p-2 text-xs font-semibold text-[color:var(--bm-primary)] transition hover:bg-[color:var(--bm-primary-soft)]"
              >
                Close
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
