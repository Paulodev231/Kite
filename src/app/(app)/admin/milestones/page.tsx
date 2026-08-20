"use client";

// Admin-only: record project milestones, log operational hindrances and
// track the funding committed and released against each one.
import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { logEvent } from "@/lib/log";
import {
  MILESTONE_STATUS,
  MILESTONE_STATUS_ORDER,
  type Milestone,
  type MilestoneStatus,
  type Room,
} from "@/lib/types";
import { dueLabel, dueState, DUE_META } from "@/lib/dates";
import { downloadCsv, todayStamp, toCsv } from "@/lib/csv";
import AppShell from "@/components/AppShell";

const inputCls =
  "w-full rounded-xl border border-black/10 bg-background px-3 py-2.5 text-sm outline-none focus:border-brand dark:border-white/10";

export default function AdminMilestonesPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [roomId, setRoomId] = useState("");
  const [funded, setFunded] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const unsubRooms = onSnapshot(
      query(collection(db(), "rooms"), orderBy("createdAt", "desc")),
      (snap) => setRooms(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Room)),
    );
    const unsubMs = onSnapshot(
      query(collection(db(), "milestones"), orderBy("createdAt", "desc")),
      (snap) => setMilestones(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Milestone)),
    );
    return () => {
      unsubRooms();
      unsubMs();
    };
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !title.trim() || !roomId) return;
    setBusy(true);
    try {
      const room = rooms.find((r) => r.id === roomId);
      await addDoc(collection(db(), "milestones"), {
        title: title.trim(),
        roomId,
        roomName: room?.name ?? "",
        status: "planned" as MilestoneStatus,
        fundedAmount: Number(funded) || 0,
        spentAmount: 0,
        dueDate,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });
      logEvent(user.uid, "milestone_created", { roomId });
      setTitle("");
      setFunded("");
      setDueDate("");
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(m: Milestone, status: MilestoneStatus) {
    let hindrance = m.hindrance ?? "";
    if (status === "blocked") {
      hindrance = window.prompt("What is blocking this milestone?", hindrance) ?? hindrance;
    }
    await updateDoc(doc(db(), "milestones", m.id), { status, hindrance });
    if (user) logEvent(user.uid, `milestone_${status}`, { milestoneId: m.id });
  }

  async function setSpent(m: Milestone) {
    const input = window.prompt(
      `Funding released so far for “${m.title}” (committed: ${m.fundedAmount}):`,
      String(m.spentAmount ?? 0),
    );
    if (input === null) return;
    await updateDoc(doc(db(), "milestones", m.id), { spentAmount: Number(input) || 0 });
  }

  function exportCsv() {
    const csv = toCsv(
      [
        "Milestone",
        "Room",
        "Status",
        "Due date",
        "Due state",
        "Funding committed",
        "Funding released",
        "Hindrance",
      ],
      milestones.map((m) => [
        m.title,
        m.roomName,
        MILESTONE_STATUS[m.status]?.label ?? m.status,
        m.dueDate ?? "",
        m.dueDate ? dueLabel(m.dueDate) : "",
        m.fundedAmount ?? 0,
        m.spentAmount ?? 0,
        m.hindrance ?? "",
      ]),
    );
    downloadCsv(`kite-milestones-${todayStamp()}`, csv);
  }

  return (
    <AppShell title="🎯 Milestones">
      <div className="mx-auto max-w-lg space-y-3 p-3">
        {!open && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="app-chrome flex-1 rounded-2xl bg-brand py-3 text-sm font-bold text-white shadow-md active:scale-[0.98]"
            >
              ➕ Record a milestone
            </button>
            {milestones.length > 0 && (
              <button
                type="button"
                onClick={exportCsv}
                aria-label="Export milestones to spreadsheet"
                className="app-chrome rounded-2xl bg-surface px-4 py-3 text-sm font-bold shadow-sm active:scale-[0.98]"
              >
                ⬇️ CSV
              </button>
            )}
          </div>
        )}

        {open && (
          <form onSubmit={create} className="space-y-2 rounded-2xl bg-surface p-4 shadow-sm">
            <p className="text-sm font-bold">New milestone</p>
            <input
              className={inputCls}
              placeholder="Milestone (e.g. Borehole drilling completed)"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <select
              className={inputCls}
              required
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            >
              <option value="">Which project room?</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <input
              className={inputCls}
              type="number"
              inputMode="decimal"
              placeholder="Funding committed (numbers only)"
              value={funded}
              onChange={(e) => setFunded(e.target.value)}
            />
            <input
              className={inputCls}
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="app-chrome flex-1 rounded-xl bg-background py-2.5 text-sm font-bold active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy || !title.trim() || !roomId}
                className="app-chrome flex-1 rounded-xl bg-brand py-2.5 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50"
              >
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        )}

        {milestones.length === 0 && (
          <p className="pt-10 text-center text-sm opacity-50">
            No milestones yet. Record one to start tracking delivery and funding.
          </p>
        )}

        {milestones.map((m) => {
          const meta = MILESTONE_STATUS[m.status] ?? MILESTONE_STATUS.planned;
          return (
            <div key={m.id} className="space-y-2 rounded-2xl bg-surface p-4 shadow-sm">
              <div className="flex items-start gap-2">
                <span className="min-w-0 flex-1 text-sm font-bold">{m.title}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete milestone “${m.title}”?`))
                      deleteDoc(doc(db(), "milestones", m.id));
                  }}
                  aria-label="Delete milestone"
                  className="app-chrome text-sm text-red-500"
                >
                  🗑️
                </button>
              </div>
              <p className="text-[11px] opacity-50">
                🔐 {m.roomName}
                {m.dueDate ? ` · due ${m.dueDate}` : ""}
              </p>
              {(() => {
                // Due-date warning: icon + words, never colour alone.
                const state = dueState(m.dueDate, m.status === "completed");
                const meta = DUE_META[state];
                if (!meta || !m.dueDate) return null;
                return (
                  <p
                    className="text-[11px] font-bold"
                    style={{ color: meta.color }}
                  >
                    {meta.icon} {dueLabel(m.dueDate)}
                  </p>
                );
              })()}

              {/* Status: icon + label always, never colour alone */}
              <div className="flex flex-wrap gap-1.5">
                {MILESTONE_STATUS_ORDER.map((s) => {
                  const sm = MILESTONE_STATUS[s];
                  const active = m.status === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(m, s)}
                      className={`app-chrome rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                        active ? "text-white" : "bg-background opacity-60"
                      }`}
                      style={active ? { backgroundColor: sm.color } : undefined}
                    >
                      {sm.icon} {sm.label}
                    </button>
                  );
                })}
              </div>

              {m.status === "blocked" && m.hindrance && (
                <p className="rounded-xl bg-red-500/10 px-3 py-2 text-[11px] font-medium text-red-500">
                  ⛔ Hindrance: {m.hindrance}
                </p>
              )}

              <button
                type="button"
                onClick={() => setSpent(m)}
                className="app-chrome w-full rounded-xl bg-background px-3 py-2 text-left text-[11px] font-semibold active:scale-[0.99]"
              >
                💰 Released {m.spentAmount ?? 0} of {m.fundedAmount ?? 0} — tap to update
              </button>
              <p className="text-[10px] opacity-40">
                Current status: {meta.icon} {meta.label}
              </p>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
