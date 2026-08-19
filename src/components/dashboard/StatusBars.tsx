"use client";

// Milestone counts by status, as a horizontal bar set.
// Horizontal because the category names are long and this is a phone screen.
// Every row carries icon + label + number, so the status is never conveyed
// by colour alone (completed-green and blocked-red are nearly identical to
// red/green colour-blind readers).
import { MILESTONE_STATUS, MILESTONE_STATUS_ORDER, type MilestoneStatus } from "@/lib/types";

export default function StatusBars({
  counts,
  title,
}: {
  counts: Record<MilestoneStatus, number>;
  title: string;
}) {
  const total = MILESTONE_STATUS_ORDER.reduce((sum, s) => sum + (counts[s] ?? 0), 0);
  const max = Math.max(1, ...MILESTONE_STATUS_ORDER.map((s) => counts[s] ?? 0));

  return (
    <div className="rounded-2xl bg-surface p-4 shadow-sm">
      <p className="text-sm font-bold">{title}</p>
      <p className="mb-3 text-[11px] opacity-50">
        {total} milestone{total === 1 ? "" : "s"} in total
      </p>
      <div className="space-y-2.5">
        {MILESTONE_STATUS_ORDER.map((status) => {
          const meta = MILESTONE_STATUS[status];
          const count = counts[status] ?? 0;
          return (
            <div key={status}>
              <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold">
                <span aria-hidden>{meta.icon}</span>
                <span className="flex-1">{meta.label}</span>
                <span className="tabular-nums opacity-60">{count}</span>
              </div>
              {/* Recessive track, 4px rounded data end anchored to the baseline */}
              <div className="h-2 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/10">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(count / max) * 100}%`,
                    backgroundColor: meta.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
