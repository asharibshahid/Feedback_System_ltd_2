"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

export type SiteNormItem = {
  id: string;
  label: string;
  image: string;
};

type SiteNormsChecklistProps = {
  onAllAcceptedChange?: (accepted: boolean) => void;
  className?: string;
};

const SITE_NORMS: SiteNormItem[] = [
  { id: "hair", label: "Wear company hair and beard covers", image: "/hair_cover.png" },
  { id: "hands", label: "Wash and sanitize hands at entrance", image: "/hand_cover.png" },
  { id: "jewelry", label: "Remove all jewelry and watches", image: "/jewelry_cover.png" },
  { id: "drink", label: "No drinking or eating (including chewing gum)", image: "/drink_cover.png" },
  { id: "smoking", label: "No smoking", image: "/smoking_cover.png" },
  { id: "cuts", label: "All cuts must be covered with a suitable plaster", image: "/cuts_cover.png" },
];

export function SiteNormsChecklist({ onAllAcceptedChange, className = "" }: SiteNormsChecklistProps) {
  const [checked, setChecked] = useState<boolean[]>(() => SITE_NORMS.map(() => false));

  const allAccepted = useMemo(() => checked.every(Boolean), [checked]);

  useEffect(() => {
    onAllAcceptedChange?.(allAccepted);
  }, [allAccepted, onAllAcceptedChange]);

  const toggle = (index: number) => {
    setChecked((prev) => prev.map((value, idx) => (idx === index ? !value : value)));
  };

  return (
    <div className={className}>
      <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Site norms</p>
      <h2 className="text-xl font-semibold text-[color:var(--bm-text)]">Site Norms</h2>
      <p className="mt-1 text-sm text-[color:var(--bm-text-muted)]">
        Please confirm each safety norm before continuing.
      </p>

      <div className="mt-4 space-y-3">
        {SITE_NORMS.map((item, index) => {
          const isChecked = checked[index];
          return (
            <label
              key={item.id}
              className="flex items-center gap-4 rounded-[18px] border border-[color:var(--bm-border)] bg-white/80 px-4 py-3 shadow-sm"
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggle(index)}
                className="h-5 w-5 rounded border border-[color:var(--bm-border)] text-[color:var(--bm-accent)] focus:ring-[color:var(--bm-accent)]"
              />
              <span className="flex-1 text-sm font-semibold text-[color:var(--bm-text)]">
                {item.label}
              </span>
              <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-[12px] bg-[color:var(--bm-primary-soft)]">
                <Image
                  src={item.image}
                  alt={item.label}
                  fill
                  sizes="48px"
                  className="object-contain p-2"
                />
              </div>
            </label>
          );
        })}
      </div>

      {!allAccepted && (
        <p className="mt-3 text-xs text-[color:var(--bm-text-soft)]">
          All site norms must be checked to proceed.
        </p>
      )}
    </div>
  );
}
