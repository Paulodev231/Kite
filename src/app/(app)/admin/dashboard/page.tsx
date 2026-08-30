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
import { dueLabel, dueState, DUE_META, DUE_SOON_DAYS } from "@/lib/dates";
import AppShell from "@/components/AppShell";
import { useT } from "@/context/LanguageContext";
import StatTile from "@/components/dashboard/StatTile";
import StatusBars from "@/components/dashboard/StatusBars";
import FundingMeter, { formatMoney } from "@/components/dashboard/FundingMeter";

export default function AdminDashboardPage() {
  const { t } = useT();
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

  // Anything needing action: blocked, overdue, or due within a week.
  // Sorted most-urgent first so the top of the list is the thing to fix now.
  const rank = { overdue: 0, blocked: 1, due_soon: 2 } as const;
  const attention = milestones
    .map((m) => {
      const state = dueState(m.dueDate, m.status === "completed");
      const kind =
        state === "overdue"
          ? "overdue"
          : m.status === "blocked"
            ? "blocked"
            : state === "due_soon"
              ? "due_soon"
              : null;
      return kind ? { m, kind } : null;
    })
    .filter((x): x is { m: Milestone; kind: keyof typeof rank } => x !== null)
    .sort((a, b) => rank[a.kind] - rank[b.kind]);

  // Per-member roll-up: milestones are individual, so this is the primary
  // breakdown. Worst-first so struggling projects surface immediately.
  const byMember = [...new Set(milestones.map((m) => m.ownerUid))]
    .map((uid) => {
      const list = milestones.filter((m) => m.ownerUid === uid);
      return {
        uid,
        name: list[0]?.ownerHandle || t("csvUnassigned"),
        total: list.length,
        done: list.filter((m) => m.status === "completed").length,
        blocked: list.filter((m) => m.status === "blocked").length,
      };
    })
    .sort((a, b) => b.blocked - a.blocked || b.total - a.total);

  // Per-room roll-up: rooms group people whose projects are similar in scope.
  const rooms = [...new Set(milestones.map((m) => m.roomId).filter(Boolean))]
    .map((roomId) => {
      const list = milestones.filter((m) => m.roomId === roomId);
      return {
        roomId: roomId as string,
        name: list[0]?.roomName || t("room"),
        total: list.length,
        members: new Set(list.map((m) => m.ownerUid)).size,
        done: list.filter((m) => m.status === "completed").length,
        blocked: list.filter((m) => m.status === "blocked").length,
      };
    })
    .sort((a, b) => b.blocked - a.blocked || b.total - a.total);

  return (
    <AppShell title={`📊 ${t("admDashboard")}`}>
      <div className="mx-auto max-w-lg space-y-3 p-3">
        {/* Hero figure: the one number the dashboard leads with */}
        <div className="rounded-2xl bg-surface p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wide opacity-50">
            {t("dshCompletion")}
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
          <StatTile label={t("dshMilestones")} value={total} icon="🎯" />
          <StatTile
            label={t("dshBlocked")}
            value={blocked}
            icon="⛔"
            sub={blocked > 0 ? t("dshNeedsAttention") : t("dshNothingBlocked")}
          />
          <StatTile label={t("dshCommitted")} value={formatMoney(funded)} icon="💰" />
          <StatTile label={t("dshReleased")} value={formatMoney(spent)} icon="✅" />
        </div>

        {/* Needs attention — the working list, above the summaries */}
        {attention.length > 0 && (
          <div className="rounded-2xl bg-surface p-4 shadow-sm">
            <p className="text-sm font-bold">🚩 Needs attention</p>
            <p className="mb-1 text-[11px] opacity-50">
              Overdue, blocked, or due within {DUE_SOON_DAYS} days — most urgent first
            </p>
            {attention.map(({ m, kind }) => {
              const meta =
                kind === "blocked" ? MILESTONE_STATUS.blocked : DUE_META[kind] ?? null;
              return (
                <div
                  key={m.id}
                  className="flex items-start gap-2 border-t border-black/5 py-2.5 dark:border-white/10"
                >
                  <span aria-hidden className="text-sm">
                    {kind === "blocked" ? "⛔" : kind === "overdue" ? "🔴" : "⏰"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{m.title}</p>
                    <p className="truncate text-[10px] opacity-50">
                      👤 {m.ownerHandle || t("csvUnassigned")}
                      {m.roomName ? ` · 🔐 ${m.roomName}` : ""}
                    </p>
                    {kind === "blocked" && m.hindrance && (
                      <p className="text-[10px] font-medium text-red-500">⛔ {m.hindrance}</p>
                    )}
                  </div>
                  <span
                    className="shrink-0 text-[10px] font-bold"
                    style={{ color: meta && "color" in meta ? meta.color : undefined }}
                  >
                    {kind === "blocked" ? t("msBlocked") : m.dueDate ? dueLabel(m.dueDate) : ""}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <StatusBars counts={counts} title={t("dshByStatus")} />

        <FundingMeter funded={funded} spent={spent} />

        {/* Per-member table — milestones are individual, so this is the primary view */}
        <div className="rounded-2xl bg-surface p-4 shadow-sm">
          <p className="text-sm font-bold">{t("dshByMember")}</p>
          <p className="mb-2 text-[11px] opacity-50">
            {t("dshByMemberSub")}
          </p>
          {byMember.length === 0 && (
            <p className="py-4 text-center text-xs opacity-50">{t("dshNoMilestonesYet")}</p>
          )}
          {byMember.map((p) => (
            <div
              key={p.uid || "unassigned"}
              className="flex items-center gap-2 border-t border-black/5 py-2.5 text-xs dark:border-white/10"
            >
              <span className="min-w-0 flex-1 truncate font-semibold">👤 {p.name}</span>
              {p.blocked > 0 && (
                <span className="shrink-0 rounded-full bg-red-500/10 px-2 py-0.5 font-bold text-red-500">
                  ⛔ {p.blocked}
                </span>
              )}
              <span className="shrink-0 tabular-nums opacity-60">
                {p.done}/{p.total} done
              </span>
            </div>
          ))}
        </div>

        {/* Per-room table — rooms group people with similar project scope */}
        <div className="rounded-2xl bg-surface p-4 shadow-sm">
          <p className="text-sm font-bold">{t("dshByRoom")}</p>
          <p className="mb-2 text-[11px] opacity-50">
            {t("dshByRoomSub")}
          </p>
          {rooms.length === 0 && (
            <p className="py-4 text-center text-xs opacity-50">{t("dshNoMilestonesYet")}</p>
          )}
          {rooms.map((r) => (
            <div
              key={r.roomId}
              className="flex items-center gap-2 border-t border-black/5 py-2.5 text-xs dark:border-white/10"
            >
              <span className="min-w-0 flex-1 truncate font-semibold">
                🔐 {r.name}
                <span className="block text-[10px] font-normal opacity-50">
                  {r.members} member{r.members === 1 ? "" : "s"}
                </span>
              </span>
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
          {t("manageMilestones")}
        </Link>

        <p className="px-2 text-[10px] leading-relaxed opacity-40">
          {t("dshFootnote")}
        </p>
      </div>
    </AppShell>
  );
}
