"use client";

// Admin-only. Every milestone belongs to ONE member — each project manager
// runs their own project. A room is optional grouping context for people
// whose projects are similar in scope, never ownership.
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
import { dueLabel, dueState, DUE_META } from "@/lib/dates";
import { downloadCsv, todayStamp, toCsv } from "@/lib/csv";
import {
  MILESTONE_STATUS,
  MILESTONE_STATUS_ORDER,
  type Milestone,
  type MilestoneStatus,
  type Room,
  type UserProfile,
} from "@/lib/types";
import AppShell from "@/components/AppShell";

const inputCls =
  "w-full rounded-xl border border-black/10 bg-background px-3 py-2.5 text-sm outline-none focus:border-brand dark:border-white/10";

export default function AdminMilestonesPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [people, setPeople] = useState<UserProfile[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  // New-milestone form
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [ownerUid, setOwnerUid] = useState("");
  const [roomId, setRoomId] = useState("");
  const [funded, setFunded] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [busy, setBusy] = useState(false);

  // Filter
  const [filterOwner, setFilterOwner] = useState("");

  useEffect(() => {
    const unsubRooms = onSnapshot(
      query(collection(db(), "rooms"), orderBy("createdAt", "desc")),
      (snap) => setRooms(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Room)),
    );
    const unsubUsers = onSnapshot(
      query(collection(db(), "users"), orderBy("createdAt", "desc")),
      (snap) => setPeople(snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as UserProfile)),
    );
    const unsubMs = onSnapshot(
      query(collection(db(), "milestones"), orderBy("createdAt", "desc")),
      (snap) => setMilestones(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Milestone)),
    );
    return () => {
      unsubRooms();
      unsubUsers();
      unsubMs();
    };
  }, []);

  // Only real members run projects. Staff Handles are operator accounts
  // driven by the SuperAdmin, and Admins manage rather than deliver.
  const owners = people.filter((p) => p.role === "member");

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !title.trim() || !ownerUid) return;
    setBusy(true);
    try {
      const room = rooms.find((r) => r.id === roomId);
      const owner = people.find((p) => p.uid === ownerUid);
      await addDoc(collection(db(), "milestones"), {
        title: title.trim(),
        ownerUid,
        ownerHandle: owner?.handle ?? "",
        roomId: roomId || "",
        roomName: room?.name ?? "",
        status: "planned" as MilestoneStatus,
        fundedAmount: Number(funded) || 0,
        spentAmount: 0,
        dueDate,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });
      logEvent(user.uid, "milestone_created", { ownerUid, roomId: roomId || "none" });
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

  /** Assign or move a milestone to a different member. */
  async function reassign(m: Milestone, uid: string) {
    const owner = people.find((p) => p.uid === uid);
    if (!owner) return;
    await updateDoc(doc(db(), "milestones", m.id), {
      ownerUid: uid,
      ownerHandle: owner.handle,
    });
    if (user) logEvent(user.uid, "milestone_reassigned", { milestoneId: m.id, ownerUid: uid });
  }

  const visible = filterOwner
    ? milestones.filter((m) => m.ownerUid === filterOwner)
    : milestones;

  function exportCsv() {
    const csv = toCsv(
      [
        "Member",
        "Milestone",
        "Room (grouping)",
        "Status",
        "Due date",
        "Due state",
        "Funding committed",
        "Funding released",
        "Hindrance",
      ],
      visible.map((m) => [
        m.ownerHandle || "Unassigned",
        m.title,
        m.roomName ?? "",
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
            {visible.length > 0 && (
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
            <select
              className={inputCls}
              required
              value={ownerUid}
              onChange={(e) => setOwnerUid(e.target.value)}
            >
              <option value="">Whose project is this? (required)</option>
              {owners.map((p) => (
                <option key={p.uid} value={p.uid}>
                  {p.handle}
                </option>
              ))}
            </select>
            <input
              className={inputCls}
              placeholder="Milestone (e.g. Borehole drilling completed)"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <select className={inputCls} value={roomId} onChange={(e) => setRoomId(e.target.value)}>
              <option value="">Group under a room (optional)</option>
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
                disabled={busy || !title.trim() || !ownerUid}
                className="app-chrome flex-1 rounded-xl bg-brand py-2.5 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50"
              >
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        )}

        {milestones.length > 0 && (
          <select
            className={`${inputCls} bg-surface`}
            value={filterOwner}
            onChange={(e) => setFilterOwner(e.target.value)}
          >
            <option value="">All members ({milestones.length})</option>
            {owners.map((p) => {
              const n = milestones.filter((m) => m.ownerUid === p.uid).length;
              return (
                <option key={p.uid} value={p.uid}>
                  {p.handle} ({n})
                </option>
              );
            })}
          </select>
        )}

        {visible.length === 0 && (
          <p className="pt-10 text-center text-sm opacity-50">
            No milestones yet. Record one against a member to start tracking their
            project delivery and funding.
          </p>
        )}

        {visible.map((m) => {
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

              {/* Owner — the member whose project this is */}
              {m.ownerUid ? (
                <p className="text-[11px] font-semibold text-brand">👤 {m.ownerHandle}</p>
              ) : (
                <select
                  className={`${inputCls} border-amber-500`}
                  value=""
                  onChange={(e) => reassign(m, e.target.value)}
                >
                  <option value="">⚠️ Unassigned — choose the member…</option>
                  {owners.map((p) => (
                    <option key={p.uid} value={p.uid}>
                      {p.handle}
                    </option>
                  ))}
                </select>
              )}

              <p className="text-[11px] opacity-50">
                {m.roomName ? `🔐 ${m.roomName}` : "No room grouping"}
                {m.dueDate ? ` · due ${m.dueDate}` : ""}
              </p>
              {(() => {
                const state = dueState(m.dueDate, m.status === "completed");
                const dm = DUE_META[state];
                if (!dm || !m.dueDate) return null;
                return (
                  <p className="text-[11px] font-bold" style={{ color: dm.color }}>
                    {dm.icon} {dueLabel(m.dueDate)}
                  </p>
                );
              })()}

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
