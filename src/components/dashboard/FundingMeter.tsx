"use client";

import { useT } from "@/context/LanguageContext";

// A single ratio against a limit — released vs committed funding.
// A meter, not a two-slice pie.
export function formatMoney(amount: number): string {
  return amount.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default function FundingMeter({
  funded,
  spent,
}: {
  funded: number;
  spent: number;
}) {
  const { t } = useT();
  const pct = funded > 0 ? Math.min(100, Math.round((spent / funded) * 100)) : 0;
  const remaining = Math.max(0, funded - spent);

  return (
    <div className="rounded-2xl bg-surface p-4 shadow-sm">
      <p className="text-sm font-bold">{t("fmrTitle")}</p>
      <p className="mb-3 text-[11px] opacity-50">{t("fmrSub")}</p>

      <p className="text-3xl font-extrabold tabular-nums">{pct}%</p>

      <div className="mt-2 h-3 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/10">
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide opacity-50">{t("fmrReleased")}</p>
          <p className="text-sm font-bold tabular-nums">{formatMoney(spent)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide opacity-50">{t("fmrRemaining")}</p>
          <p className="text-sm font-bold tabular-nums">{formatMoney(remaining)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide opacity-50">{t("fmrCommitted")}</p>
          <p className="text-sm font-bold tabular-nums">{formatMoney(funded)}</p>
        </div>
      </div>
    </div>
  );
}
