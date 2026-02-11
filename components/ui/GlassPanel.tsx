import { motion } from "framer-motion";
import type { ReactNode } from "react";

type GlassPanelProps = {
  children: ReactNode;
  className?: string;
};

export function GlassPanel({ children, className = "" }: GlassPanelProps) {
  return (
    <motion.div
      className={`rounded-[26px] border border-[color:var(--bm-border)] bg-white/80 px-6 py-5 shadow-[0_30px_70px_rgba(31,27,24,0.18)] backdrop-blur-3xl ${className}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, boxShadow: "0 40px 90px rgba(31,27,24,0.22)" }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
