"use client";

import { forwardRef } from "react";
import type { CSSProperties, ReactNode } from "react";

type ScrollPanelProps = {
  children: ReactNode;
  className?: string;
  panelClassName?: string;
  panelStyle?: CSSProperties;
};

export const ScrollPanel = forwardRef<HTMLDivElement, ScrollPanelProps>(
  ({ children, className = "", panelClassName = "", panelStyle }, ref) => (
    <div
      className={`relative w-full overflow-hidden rounded-[32px] border border-[color:var(--bm-border)] bg-white/80 shadow-[0_30px_80px_rgba(31,27,24,0.15)] backdrop-blur-3xl ${className}`}
    >
      <div
        ref={ref}
        style={panelStyle}
        className={`custom-scrollbar h-full w-full overflow-y-auto px-5 py-6 ${panelClassName}`}
      >
        {children}
      </div>
    </div>
  ),
);

ScrollPanel.displayName = "ScrollPanel";
