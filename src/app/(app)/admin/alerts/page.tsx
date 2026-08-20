"use client";

// Admin-only: write a timing alert to ONE member about their own milestones,
// e.g. "20 days to Milestone 2 — you should finish the survey in 19 days".
// It lands on that member's dashboard (and notifies them). Staff Handles are
// operator accounts and are never targeted.
import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { logEvent } from "@/lib/log";
import { daysUntil } from "@/lib/dates";
import type { MemberAlert, Milestone, UserProfile } from "@/lib/types";
import AppShell from "@/components/AppShell";

const inputCls =
  "w-full rounded-xl border border-black/10 bg-background px-3 py-2.5 text-sm outline-none focus:border-brand dark:border-white/10";

export default function AdminAlertsPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [sent, setSent] = useState<MemberAlert[]>([]);

  const [targetUid, setTargetUid] = useState("");
  const [milestoneId, setMilestoneId] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const unsubUsers = onSnapshot(
      query(collection(db(), "users"), orderBy("createdAt", "desc")),
      (snap) =>
        setMembers(
          snap.docs
            .map((d) => ({ uid: d.id, ...d.data() }) as UserProfile)
            // Real members only — Staff Handles don't run projects.
            .filter((u) => u.role === "member"),
        ),
    );
    const unsubMs = onSnapshot(
      query(collection(db(), "milestones"), orderBy("createdAt", "desc")),
      (snap) => setMilestones(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Milestone)),
    );
    const unsubAlerts = onSnapshot(
      query(collection(db(), "alerts"), orderBy("createdAt", "desc"), limit(40)),
      (snap) => setSent(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as MemberAlert)),
    );
    return () => {
      unsubUsers();
      unsubMs();
      unsubAlerts();
    };
  }, []);

  // Only the chosen member's own milestones can be referenced.
  const theirMilestones = milestones.filter((m) => m.ownerUid === targetUid);

  /** Pre-writes the countdown sentence so you only tweak the wording. */
  function suggest(m: Milestone) {
    setMilestoneId(m.id);
    if (!m.dueDate) {
      setMessage(`Reminder about “${m.title}” — please share your progress.`);
      return;
    }
    const days = daysUntil(m.dueDate);
    if (days < 0) {
      setMessage(
        `“${m.title}” is ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue. Please update me on where it stands and what you need.`,
      );
    } else {
      setMessage(
        `${days} day${days === 1 ? "" : "s"} to “${m.title}” — you should be finishing this within ${Math.max(1, days - 1)} day${Math.max(1, days - 1) === 1 ? "" : "s"}.`,
      );
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !targetUid || !message.trim()) return;
    setBusy(true);
    setNotice(null);
    try {
      const target = members.find((m) => m.uid === targetUid);
      const milestone = theirMilestones.find((m) => m.id === milestoneId);
      await addDoc(collection(db(), "alerts"), {
        targetUid,
        targetHandle: target?.handle ?? "",
        message: message.trim(),
        milestoneId: milestone?.id ?? "",
        milestoneTitle: milestone?.title ?? "",
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        read: false,
      });
      logEvent(user.uid, "alert_sent", { targetUid });
      setNotice(`✅ Alert sent to ${target?.handle ?? "member"}.`);
      setMessage("");
      setMilestoneId("");
    } catch {
      setNotice("❌ Could not send the alert. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="🔔 Member Alerts">
      <div className="mx-auto max-w-lg space-y-3 p-3">
        <form onSubmit={send} className="space-y-2 rounded-2xl bg-surface p-4 shadow-sm">
          <p className="text-sm font-bold">✍️ Write an alert</p>
          <p className="text-[11px] leading-relaxed opacity-50">
            Goes to one member’s dashboard and notifies them. Only real members
            appear here — Staff Handles don’t run projects.
          </p>

          <select
            className={inputCls}
            required
            value={targetUid}
            onChange={(e) => {
              setTargetUid(e.target.value);
              setMilestoneId("");
            }}
          >
            <option value="">Which member?</option>
            {members.map((m) => (
              <option key={m.uid} value={m.uid}>
                {m.handle}
              </option>
            ))}
          </select>

          {targetUid && theirMilestones.length > 0 && (
            <div>
              <p className="mb-1 text-[11px] font-semibold opacity-60">
                Tap a milestone to auto-write the countdown:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {theirMilestones.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => suggest(m)}
                    className={`app-chrome rounded-full px-2.5 py-1 text-[11px] font-bold active:scale-95 ${
                      milestoneId === m.id ? "bg-brand text-white" : "bg-background opacity-70"
                    }`}
                  >
                    🎯 {m.title}
                    {m.dueDate ? ` · ${daysUntil(m.dueDate)}d` : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          {targetUid && theirMilestones.length === 0 && (
            <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-[11px] font-medium text-amber-600">
              This member has no milestones yet. You can still send a free-text
              alert, or record a milestone first.
            </p>
          )}

          <textarea
            className={inputCls}
            rows={4}
            required
            placeholder="e.g. 20 days to Milestone 2 — you should finish the site survey in 19 days."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <button
            type="submit"
            disabled={busy || !targetUid || !message.trim()}
            className="app-chrome w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? "Sending…" : "🔔 Send alert"}
          </button>
          {notice && (
            <p className="rounded-xl bg-brand-soft px-3 py-2 text-xs font-medium">{notice}</p>
          )}
        </form>

        {sent.length > 0 && (
          <div className="space-y-2">
            <p className="px-2 text-xs font-semibold uppercase tracking-wide opacity-40">
              Recently sent
            </p>
            {sent.map((a) => (
              <div key={a.id} className="rounded-2xl bg-surface p-3.5 shadow-sm">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-brand">👤 {a.targetHandle}</p>
                    <p className="mt-0.5 text-sm leading-relaxed">{a.message}</p>
                    <p className="mt-1 text-[10px] opacity-40">
                      {a.createdAt?.toDate().toLocaleString() ?? "Sending…"}
                      {a.milestoneTitle ? ` · 🎯 ${a.milestoneTitle}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Delete this alert?"))
                        deleteDoc(doc(db(), "alerts", a.id));
                    }}
                    aria-label="Delete alert"
                    className="app-chrome text-sm text-red-500"
                  >
                    🗑️
                  </button>
                </div>
                <p
                  className={`mt-1 text-[10px] font-bold ${
                    a.read ? "text-emerald-600" : "opacity-40"
                  }`}
                >
                  {a.read ? "✅ Read by member" : "○ Not read yet"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
