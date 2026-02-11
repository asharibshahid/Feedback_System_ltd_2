import { useEffect, useState } from "react";

type HygieneRulesModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
};

const RULES = [
  { en: "WEAR COMPANY HAIR & BEARD COVERS", ar: "لبس طاقية الرأس وغطاء الدقن" },
  { en: "WASH AND SANITIZE HANDS AT ENTRANCE", ar: "غسيل وتعقيم الأيدي قبل الدخول" },
  { en: "REMOVE ALL JEWELRY AND WATCHES", ar: "خلع الخواتم و ساعة اليد" },
  { en: "NO DRINKING OR EATING (INCLUDING CHEWING GUM)", ar: "ممنوع الأكل والشرب (بالأضافة إلى مضغ العلكة)" },
  { en: "NO SMOKING", ar: "ممنوع التدخين" },
  { en: "ALL CUTS TO BE COVERED WITH A SUITABLE PLASTER", ar: "في حالة وجود إصابة او جرح يجب تغطيتها بطريقة مناسبة" },
];

export function HygieneRulesModal({ open, onClose, onConfirm, isSubmitting = false }: HygieneRulesModalProps) {
  const [checked, setChecked] = useState(false);
  const [ruleChecks, setRuleChecks] = useState<boolean[]>(() => Array(RULES.length).fill(false));

  useEffect(() => {
    if (open) {
      setChecked(false);
      setRuleChecks(Array(RULES.length).fill(false));
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const toggleRule = (index: number) => {
    setRuleChecks((prev) => prev.map((value, idx) => (idx === index ? !value : value)));
  };

  const allRulesChecked = ruleChecks.every(Boolean);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hygiene-rules-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-[color:var(--bm-border)] bg-white/95 p-6 shadow-[0_35px_90px_rgba(31,27,24,0.25)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Site norms</p>
            <h2 id="hygiene-rules-title" className="text-xl font-semibold text-[color:var(--bm-text)]">
              Hygiene rules
            </h2>
          </div>
          <div className="space-y-3">
            {RULES.map((rule, index) => {
              const isChecked = ruleChecks[index];
              return (
              <div
                key={rule.en}
                role="checkbox"
                aria-checked={isChecked}
                tabIndex={0}
                onClick={() => toggleRule(index)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggleRule(index);
                  }
                }}
                className="flex cursor-pointer items-start gap-4 rounded-xl border border-[color:var(--bm-border)] bg-white/80 px-4 py-3 transition hover:border-[color:var(--bm-accent)] hover:bg-[color:var(--bm-accent-soft)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--bm-accent)]"
              >
                <div
                  className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold transition ${
                    isChecked
                      ? "border-[color:var(--bm-accent)] bg-[color:var(--bm-accent-soft)] text-[color:var(--bm-accent)]"
                      : "border-[color:var(--bm-accent)] bg-white text-transparent"
                  }`}
                >
                  ✓
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[color:var(--bm-text)]">{rule.en}</p>
                  <p className="text-xs text-[color:var(--bm-text-muted)]" dir="rtl">
                    {rule.ar}
                  </p>
                </div>
              </div>
            );
            })}
          </div>
          <label className="flex items-start gap-3 rounded-[16px] border border-[color:var(--bm-border)] bg-white/80 px-4 py-3">
            <input
              type="checkbox"
              checked={checked}
              onChange={(event) => setChecked(event.target.checked)}
              className="mt-1 h-5 w-5 rounded border border-[color:var(--bm-border)] text-[color:var(--bm-accent)] focus:ring-[color:var(--bm-accent)]"
            />
            <span className="text-sm text-[color:var(--bm-text-muted)]">
              I confirm I have read and will follow these hygiene rules.
            </span>
          </label>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[14px] border border-[color:var(--bm-primary)] bg-white px-5 py-2 text-sm font-semibold uppercase tracking-[0.4em] text-[color:var(--bm-primary)] transition hover:bg-[color:var(--bm-primary-soft)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!checked || !allRulesChecked || isSubmitting}
            className="rounded-[14px] bg-[color:var(--bm-accent)] px-6 py-2 text-sm font-semibold uppercase tracking-[0.4em] text-white shadow-[0_15px_45px_rgba(222,66,38,0.35)] transition hover:bg-[color:var(--bm-accent-hover)] disabled:cursor-not-allowed disabled:bg-[color:var(--bm-border)]"
          >
            {isSubmitting ? "Submitting..." : "Confirm & Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
