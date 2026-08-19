"use client";

// Admin dashboard: delivery and funded-outcome overview across all rooms.
import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  MILESTONE_STATUS,
  MILESTONE_STATUS_ORDER,
  type Milestone,
  type MilestoneStatus,
} from "@/lib/types";
import AppShell from "@/components/AppShell";
import StatTile from "@/components/dashboard/StatTile";
import StatusBars from "@/components/dashboard/StatusBars";
import FundingMeter, { formatMoney } from "@/components/dashboard/FundingMeter";

export default function AdminDashboardPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  useEffect(() => {
    return onSnapshot(
      query(collection(db(), "milestones"), orderBy("createdAt", "desc")),
      (snap) => setMilestones(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Milestone)),
    );
  }, []);

  const counts = MILESTONE_STATUS_ORDER.reduce(
    (acc, s) => ({ ...acc, [s]: milestones.filter((m) => m.status === s).length }),
    {} as Record<MilestoneStatus, number>,
  );
  const total = milestones.length;
  const completed = counts.completed ?? 0;
  const blocked = counts.blocked ?? 0;
  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const funded = milestones.reduce((sum, m) => sum + (m.fundedAmount ?? 0), 0);
  const spent = milestones.reduce((sum, m) => sum + (m.spentAmount ?? 0), 0);

  // Per-room roll-up, worst-first so blocked projects surface immediately.
  const rooms = [...new Set(milestones.map((m) => m.roomId))]
    .map((roomId) => {
      const list = milestones.filter((m) => m.roomId === roomId);
      return {
        roomId,
        name: list[0]?.roomName || "Room",
        total: list.length,
        done: list.filter((m) => m.status === "completed").length,
        blocked: list.filter((m) => m.status === "blocked").length,
      };
    })
    .sort((a, b) => b.blocked - a.blocked || b.total - a.total);

  return (
    <AppShell title="📊 Dashboard">
      <div className="mx-auto max-w-lg space-y-3 p-3">
        {/* Hero figure: the one number the dashboard leads with */}
        <div className="rounded-2xl bg-surface p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wide opacity-50">
            Milestone completion
          </p>
          <p className="mt-1 text-5xl font-extrabold tabular-nums">{completionPct}%</p>
          <p className="mt-1 text-[11px] opacity-50">
            {completed} of {total} milestone{total === 1 ? "" : "s"} delivered
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/10">
            <div
              className="h-full rounded-full bg-brand transition-all"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 gap-2">
          <StatTile label="Milestones" value={total} icon="🎯" />
          <StatTile
            label="Blocked"
            value={blocked}
            icon="⛔"
            sub={blocked > 0 ? "Needs attention" : "Nothing blocked"}
          />
          <StatTile label="Committed" value={formatMoney(funded)} icon="💰" />
          <StatTile label="Released" value={formatMoney(spent)} icon="✅" />
        </div>

        <StatusBars counts={counts} title="Milestones by status" />

        <FundingMeter funded={funded} spent={spent} />

        {/* Per-room table — more than a few classes, so a table beats more colours */}
        <div className="rounded-2xl bg-surface p-4 shadow-sm">
          <p className="text-sm font-bold">By project room</p>
          <p className="mb-2 text-[11px] opacity-50">Rooms with blockers listed first</p>
          {rooms.length === 0 && (
            <p className="py-4 text-center text-xs opacity-50">No milestones recorded yet.</p>
          )}
          {rooms.map((r) => (
            <div
              key={r.roomId}
              className="flex items-center gap-2 border-t border-black/5 py-2.5 text-xs dark:border-white/10"
            >
              <span className="min-w-0 flex-1 truncate font-semibold">🔐 {r.name}</span>
              {r.blocked > 0 && (
                <span className="shrink-0 rounded-full bg-red-500/10 px-2 py-0.5 font-bold text-red-500">
                  ⛔ {r.blocked}
                </span>
              )}
              <span className="shrink-0 tabular-nums opacity-60">
                {r.done}/{r.total} done
              </span>
            </div>
          ))}
        </div>

        <Link
          href="/admin/milestones"
          className="app-chrome block rounded-2xl bg-brand py-3 text-center text-sm font-bold text-white shadow-md active:scale-[0.98]"
        >
          🎯 Manage milestones
        </Link>

        <p className="px-2 text-[10px] leading-relaxed opacity-40">
          Status is shown with an icon and label as well as colour, so it stays
          readable for colour-blind users and in print.{" "}
          {MILESTONE_STATUS.blocked.icon} Blocked milestones are the operational
          hindrances to resolve.
        </p>
      </div>
    </AppShell>
  );
}
