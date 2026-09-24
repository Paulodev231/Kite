"use client";

// Admin-only per-room report: delivery, funding, blockers and how many of a
// room's members have actually responded to each published form.
import { useEffect, useState } from "react";
import { collection, doc, getDocs, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { dueLabel, dueState, DUE_META } from "@/lib/dates";
import { downloadCsv, todayStamp, toCsv } from "@/lib/csv";
import {
  MILESTONE_STATUS,
  MILESTONE_STATUS_ORDER,
  type Milestone,
  type MilestoneStatus,
  type Room,
  type RoomForm,
} from "@/lib/types";
import AppShell from "@/components/AppShell";
import { useT } from "@/context/LanguageContext";
import { MILESTONE_STATUS_KEYS } from "@/lib/i18n";
import StatTile from "@/components/dashboard/StatTile";
import StatusBars from "@/components/dashboard/StatusBars";
import FundingMeter, { formatMoney } from "@/components/dashboard/FundingMeter";

interface FormStat {
  form: RoomForm;
  responses: number;
}

export default function AdminReportsPage() {
  const { t } = useT();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomId, setRoomId] = useState("");
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  // Stamped with the room it belongs to, so "still loading" is derived rather
  // than tracked in a second state.
  const [formData, setFormData] = useState<{ forRoom: string; stats: FormStat[] } | null>(null);

  useEffect(() => {
    return onSnapshot(query(collection(db(), "rooms"), orderBy("createdAt", "desc")), (snap) =>
      setRooms(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Room)),
    );
  }, []);

  // Milestones + participant count for the chosen room.
  useEffect(() => {
    if (!roomId) return;
    const unsubMs = onSnapshot(
      query(collection(db(), "milestones"), where("roomId", "==", roomId)),
      (snap) => setMilestones(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Milestone)),
      () => {},
    );
    const unsubAcl = onSnapshot(
      doc(db(), "rooms", roomId, "acl", "members"),
      (snap) => setMemberCount(snap.exists() ? (snap.data().uids?.length ?? 0) : 0),
      () => {},
    );
    return () => {
      unsubMs();
      unsubAcl();
    };
  }, [roomId]);

  // Response counts per form (one read per form, on demand — not a live listener).
  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;
    (async () => {
      const [formsSnap, subsSnap] = await Promise.all([
        getDocs(collection(db(), "rooms", roomId, "forms")),
        getDocs(collection(db(), "rooms", roomId, "submissions")),
      ]);
      const stats = formsSnap.docs.map((d) => {
        const form = { id: d.id, ...d.data() } as RoomForm;
        return {
          form,
          responses: subsSnap.docs.filter((s) => s.data().formId === form.id).length,
        };
      });
      if (!cancelled) setFormData({ forRoom: roomId, stats });
    })();
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  const room = rooms.find((r) => r.id === roomId);
  const loadingForms = !formData || formData.forRoom !== roomId;
  const formStats = loadingForms ? [] : formData.stats;
  const counts = MILESTONE_STATUS_ORDER.reduce(
    (acc, s) => ({ ...acc, [s]: milestones.filter((m) => m.status === s).length }),
    {} as Record<MilestoneStatus, number>,
  );
  const total = milestones.length;
  const done = counts.completed ?? 0;
  const funded = milestones.reduce((sum, m) => sum + (m.fundedAmount ?? 0), 0);
  const spent = milestones.reduce((sum, m) => sum + (m.spentAmount ?? 0), 0);
  const overdue = milestones.filter(
    (m) => dueState(m.dueDate, m.status === "completed") === "overdue",
  ).length;

  // Members grouped inside this room — each runs their own project.
  const byMember = [...new Set(milestones.map((m) => m.ownerUid))]
    .map((uid) => {
      const list = milestones.filter((m) => m.ownerUid === uid);
      return {
        uid,
        name: list[0]?.ownerHandle || "Unassigned",
        total: list.length,
        done: list.filter((m) => m.status === "completed").length,
        blocked: list.filter((m) => m.status === "blocked").length,
        overdue: list.filter(
          (m) => dueState(m.dueDate, m.status === "completed") === "overdue",
        ).length,
        funded: list.reduce((s, m) => s + (m.fundedAmount ?? 0), 0),
        spent: list.reduce((s, m) => s + (m.spentAmount ?? 0), 0),
      };
    })
    .sort((a, b) => b.blocked - a.blocked || b.total - a.total);

  function exportReport() {
    if (!room) return;
    const csv = toCsv(
      [t("csvSection"), t("csvItem"), t("csvDetail"), t("csvValue")],
      [
        [t("csvSummary"), t("csvRoom"), room.name, ""],
        [t("csvSummary"), t("csvMember"), "", memberCount],
        [t("csvSummary"), t("csvMilestonesTotal"), "", total],
        [t("csvSummary"), t("csvMilestonesCompleted"), "", done],
        [t("csvSummary"), t("csvMilestonesOverdue"), "", overdue],
        [t("csvSummary"), t("csvFundingCommitted"), "", funded],
        [t("csvSummary"), t("csvFundingReleased"), "", spent],
        ...byMember.map((p) => [
          t("csvMember"),
          p.name,
          t("csvMemberSummary", {
            done: p.done,
            total: p.total,
            blocked: p.blocked,
            overdue: p.overdue,
          }),
          t("csvReleasedOf", { spent: p.spent, funded: p.funded }),
        ]),
        ...milestones.map((m) => [
          t("csvMilestone"),
          `${m.ownerHandle || t("csvUnassigned")} — ${m.title}`,
          `${t(MILESTONE_STATUS_KEYS[m.status])}${
            m.dueDate ? ` · ${dueLabel(m.dueDate)}` : ""
          }${m.hindrance ? ` · ${t("csvBlockedBy", { text: m.hindrance })}` : ""}`,
          t("csvSpentOf", { spent: m.spentAmount ?? 0, funded: m.fundedAmount ?? 0 }),
        ]),
        ...formStats.map((f) => [
          t("csvForm"),
          f.form.title,
          f.form.open ? t("fmOpen") : t("fmClosed"),
          t("csvResponded", { responses: f.responses, members: memberCount }),
        ]),
      ],
    );
    downloadCsv(`community-report-${room.name.replace(/[^\w-]+/g, "_").slice(0, 30)}-${todayStamp()}`, csv);
  }

  const inputCls =
    "w-full rounded-xl border border-black/10 bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand dark:border-white/10";

  return (
    <AppShell title={`📑 ${t("admReports")}`}>
      <div className="mx-auto max-w-lg space-y-3 p-3">
        <select className={inputCls} value={roomId} onChange={(e) => setRoomId(e.target.value)}>
          <option value="">{t("rpChooseRoom")}</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        {!roomId && (
          <p className="pt-12 text-center text-sm opacity-50">
            {t("rpPickRoom")}
          </p>
        )}

        {roomId && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <StatTile label={t("rpMembers")} value={memberCount} icon="👥" />
              <StatTile
                label={t("rpCompleted")}
                value={`${done}/${total}`}
                icon="✅"
                sub={
                  total > 0
                    ? t("rpPctDelivered", { pct: Math.round((done / total) * 100) })
                    : t("rpNoMilestones")
                }
              />
              <StatTile
                label={t("rpOverdue")}
                value={overdue}
                icon="🔴"
                sub={overdue > 0 ? t("rpPastDue") : t("rpNothingOverdue")}
              />
              <StatTile label={t("rpReleased")} value={formatMoney(spent)} icon="💰" />
            </div>

            {/* Each member's own project inside this room */}
            {byMember.length > 0 && (
              <div className="rounded-2xl bg-surface p-4 shadow-sm">
                <p className="text-sm font-bold">{t("rpMembersInRoom")}</p>
                <p className="mb-1 text-[11px] opacity-50">
                  {t("rpMembersSub")}
                </p>
                {byMember.map((p) => (
                  <div
                    key={p.uid || "unassigned"}
                    className="flex items-center gap-2 border-t border-black/5 py-2.5 text-xs dark:border-white/10"
                  >
                    <span className="min-w-0 flex-1 truncate font-semibold">
                      👤 {p.name}
                      <span className="block text-[10px] font-normal opacity-50">
                        {t("rpReleasedOf", {
                          spent: formatMoney(p.spent),
                          funded: formatMoney(p.funded),
                        })}
                      </span>
                    </span>
                    {p.blocked > 0 && (
                      <span className="shrink-0 rounded-full bg-red-500/10 px-2 py-0.5 font-bold text-red-500">
                        ⛔ {p.blocked}
                      </span>
                    )}
                    {p.overdue > 0 && (
                      <span className="shrink-0 rounded-full bg-red-500/10 px-2 py-0.5 font-bold text-red-500">
                        🔴 {p.overdue}
                      </span>
                    )}
                    <span className="shrink-0 tabular-nums opacity-60">
                      {p.done}/{p.total}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {total > 0 && <StatusBars counts={counts} title={t("rpMilestonesInRoom")} />}
            {funded > 0 && <FundingMeter funded={funded} spent={spent} />}

            {/* Form response rates — a meter per form, against room size */}
            <div className="rounded-2xl bg-surface p-4 shadow-sm">
              <p className="text-sm font-bold">{t("rpFormResponses")}</p>
              <p className="mb-2 text-[11px] opacity-50">
                {t("rpFormResponsesSub", { n: memberCount })}
              </p>
              {loadingForms && <p className="py-3 text-center text-xs opacity-50">{t("loading")}</p>}
              {!loadingForms && formStats.length === 0 && (
                <p className="py-3 text-center text-xs opacity-50">
                  {t("rpNoForms")}
                </p>
              )}
              {formStats.map(({ form, responses }) => {
                const pct = memberCount > 0 ? Math.round((responses / memberCount) * 100) : 0;
                return (
                  <div key={form.id} className="mt-2.5">
                    <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold">
                      <span aria-hidden>📋</span>
                      <span className="min-w-0 flex-1 truncate">{form.title}</span>
                      <span className="tabular-nums opacity-60">
                        {responses}/{memberCount}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-brand transition-all"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Milestone detail with due-date warnings */}
            {milestones.length > 0 && (
              <div className="rounded-2xl bg-surface p-4 shadow-sm">
                <p className="text-sm font-bold">{t("rpMilestoneDetail")}</p>
                {milestones.map((m) => {
                  const meta = MILESTONE_STATUS[m.status] ?? MILESTONE_STATUS.planned;
                  const dm = DUE_META[dueState(m.dueDate, m.status === "completed")];
                  return (
                    <div
                      key={m.id}
                      className="flex items-start gap-2 border-t border-black/5 py-2.5 text-xs dark:border-white/10"
                    >
                      <span aria-hidden>{meta.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{m.title}</p>
                        <p className="truncate text-[10px] font-semibold text-brand">
                          👤 {m.ownerHandle || t("csvUnassigned")}
                        </p>
                        <p className="text-[10px] opacity-50">
                          {t(MILESTONE_STATUS_KEYS[m.status])}
                          {m.dueDate ? ` · ${t("mlDueOn", { date: m.dueDate })}` : ""}
                        </p>
                        {dm && m.dueDate && (
                          <p className="text-[10px] font-bold" style={{ color: dm.color }}>
                            {dm.icon} {dueLabel(m.dueDate)}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 tabular-nums text-[10px] opacity-60">
                        {formatMoney(m.spentAmount ?? 0)}/{formatMoney(m.fundedAmount ?? 0)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={exportReport}
              className="app-chrome w-full rounded-2xl bg-brand py-3 text-sm font-bold text-white shadow-md active:scale-[0.98]"
            >
              {t("rpExport")}
            </button>
          </>
        )}
      </div>
    </AppShell>
  );
}
