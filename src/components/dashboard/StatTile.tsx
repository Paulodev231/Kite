"use client";

// A single headline number. A one-value figure belongs in a stat tile,
// not in a one-bar chart.
export default function StatTile({
  label,
  value,
  sub,
  icon,
  hero = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: string;
  hero?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-surface p-3.5 shadow-sm">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide opacity-50">
        {icon && <span aria-hidden>{icon}</span>}
        {label}
      </p>
      <p className={`mt-1 font-extrabold tabular-nums ${hero ? "text-4xl" : "text-2xl"}`}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-[11px] opacity-50">{sub}</p>}
    </div>
  );
}
