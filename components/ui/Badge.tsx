import { motion } from "framer-motion";
import type { ReactNode } from "react";

type BadgeVariant = "success" | "danger" | "warning" | "neutral";

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

const styles: Record<BadgeVariant, string> = {
  success: "bg-[#DCFCE7] text-[#15803D]",
  danger: "bg-[#FEE2E2] text-[#B91C1C]",
  warning: "bg-[#FFFBEB] text-[#B45309]",
  neutral: "bg-[color:var(--bm-accent-soft)] text-[color:var(--bm-accent)]",
};

export function Badge({ children, variant = "neutral", className = "" }: BadgeProps) {
  return (
    <motion.span
      className={`inline-flex items-center justify-center rounded-full border border-white/80 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.5em] shadow-[0_5px_12px_rgba(31,27,24,0.1)] ${styles[variant]} ${className}`}
      initial={{ scale: 0.95, opacity: 0.85 }}
      animate={{ scale: [0.95, 1], opacity: [0.85, 1] }}
      transition={{ duration: 1.8, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
    >
      {children}
    </motion.span>
  );
}
