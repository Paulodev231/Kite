"use client";

// Admin view of one person's complete record: identity, email, role, funding,
// their individual project milestones, alerts sent to them, and the rooms
// they belong to — plus one-touch DM and the full set of admin actions.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  deleteUserAccount,
  setAccountActive,
  setUserEmailRecord,
  setUserRole,
} from "@/lib/adminActions";
import { dueLabel, dueState, DUE_META } from "@/lib/dates";
import {
  MILESTONE_STATUS,
  formatFunding,
  type MemberAlert,
  type Milestone,
  type Role,
  type UserProfile,
} from "@/lib/types";
import AppShell from "@/components/AppShell";
import FundingEditor from "@/components/FundingEditor";
import AdminMemberTools from "@/components/AdminMemberTools";
import SplashScreen from "@/components/SplashScreen";

interface Membership {
  id: string;
  name: string;
}

export default function AdminUserProfilePage() {
  const { uid } = useParams<{ uid: string }>();
  const { profile: me } = useAuth();
  const router = useRouter();
  const superadmin = me?.role === "superadmin";

  const [person, setPerson] = useState<UserProfile | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [alerts, setAlerts] = useState<MemberAlert[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [editingFunding, setEditingFunding] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailDraft, setEmailDraft] = useState("");

  useEffect(() => {
    if (!uid) return;
    const unsubUser = onSnapshot(doc(db(), "users", uid), (snap) =>
      setPerson(snap.exists() ? ({ uid: snap.id, ...snap.data() } as UserProfile) : null),
    );
    const unsubMs = onSnapshot(
      query(collection(db(), "milestones"), where("ownerUid", "==", uid)),
      (snap) => setMilestones(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Milestone)),
      () => {},
    );
    const unsubAlerts = onSnapshot(
      query(collection(db(), "alerts"), where("targetUid", "==", uid)),
      (snap) =>
        setAlerts(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }) as MemberAlert)
            .sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0)),
        ),
      () => {},
    );
    const unsubRooms = onSnapshot(
      collection(db(), "users", uid, "memberships"),
      (snap) => setMemberships(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Membership)),
      () => {},
    );
    return () => {
      unsubUser();
      unsubMs();
      unsubAlerts();
      unsubRooms();
    };
  }, [uid]);

  if (!person) return <SplashScreen />;

  const isMember = person.role === "member";
  const isSelf = me?.uid === person.uid;
  // A standard Admin cannot act on a SuperAdmin; the SuperAdmin has no limits.
  const canAct = superadmin || (person.role !== "superadmin" && !isSelf);
  const done = milestones.filter((m) => m.status === "completed").length;

  const rowCls =
    "flex items-center justify-between gap-3 border-t border-black/5 py-2.5 text-xs dark:border-white/10";

  return (
    <AppShell title={`👤 ${person.handle}`}>
      <div className="mx-auto max-w-lg space-y-3 p-3">
        {/* Identity */}
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-surface p-5 shadow-sm">
          <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand text-2xl font-bold text-white">
            {person.handle?.slice(0, 1).toUpperCase()}
          </span>
          <p className="text-lg font-extrabold">{person.handle}</p>
          <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-bold capitalize text-brand">
            {person.role}
          </span>
          {person.active === false && (
            <span className="rounded-full bg-red-500/10 px-3 py-1 text-[11px] font-bold text-red-500">
              ⛔ Banned
            </span>
          )}
        </div>

        {/* One-touch DM */}
        {!isSelf && (
          <Link
            href={`/messages/with/${person.uid}?handle=${encodeURIComponent(person.handle)}`}
            className="app-chrome block rounded-2xl bg-brand py-3 text-center text-sm font-bold text-white shadow-md active:scale-[0.98]"
          >
            💬 Send direct message
          </Link>
        )}

        {/* Account record */}
        <div className="rounded-2xl bg-surface p-4 shadow-sm">
          <p className="text-sm font-bold">Account</p>

          <div className={rowCls}>
            <span className="opacity-50">Email</span>
            <span className="min-w-0 flex-1 truncate text-right font-semibold">
              {person.email || <span className="opacity-40">Not recorded</span>}
            </span>
          </div>
          {editingEmail ? (
            <div className="space-y-2 py-2">
              <input
                className="w-full rounded-xl border border-black/10 bg-background px-3 py-2.5 text-sm outline-none focus:border-brand dark:border-white/10"
                type="email"
                placeholder="their@email.com"
                value={emailDraft}
                onChange={(e) => setEmailDraft(e.target.value)}
              />
              <p className="text-[10px] leading-relaxed opacity-50">
                This records the address for your reference. It does not change
                their actual sign-in — that lives in Firebase Console →
                Authentication → Users.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingEmail(false)}
                  className="app-chrome flex-1 rounded-xl bg-background py-2 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await setUserEmailRecord(person.uid, emailDraft);
                    setEditingEmail(false);
                  }}
                  className="app-chrome flex-1 rounded-xl bg-brand py-2 text-xs font-bold text-white"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEmailDraft(person.email ?? "");
                setEditingEmail(true);
              }}
              className="app-chrome mt-1 text-[11px] font-bold text-brand"
            >
              {person.email ? "Edit recorded email" : "➕ Record their email"}
            </button>
          )}

          <div className={rowCls}>
            <span className="opacity-50">User ID</span>
            <span className="min-w-0 flex-1 truncate text-right font-mono text-[10px]">
              {person.uid}
            </span>
          </div>
          <div className={rowCls}>
            <span className="opacity-50">Created</span>
            <span className="font-semibold">
              {person.createdAt?.toDate().toLocaleDateString() ?? "—"}
            </span>
          </div>
          {person.role === "staff" && (
            <div className={rowCls}>
              <span className="opacity-50">On-call</span>
              <span className="font-semibold">{person.onCall ? "🟢 On-Call" : "⚪ Off-Call"}</span>
            </div>
          )}
        </div>

        {/* Funding — real members only */}
        {isMember && (
          <div className="rounded-2xl bg-surface p-4 shadow-sm">
            <p className="text-sm font-bold">💰 Funding</p>
            <p className="mt-1 text-lg font-extrabold tabular-nums">
              {person.funded ? (
                <span style={{ color: "#0ca30c" }}>
                  {formatFunding(person.fundedAmount, person.fundedCurrency)}
                </span>
              ) : (
                <span className="text-sm font-semibold opacity-60">○ Not funded</span>
              )}
            </p>
            {person.fundedNote && (
              <p className="text-[11px] opacity-60">{person.fundedNote}</p>
            )}
            {editingFunding ? (
              <FundingEditor user={person} onDone={() => setEditingFunding(false)} />
            ) : (
              <button
                type="button"
                onClick={() => setEditingFunding(true)}
                className="app-chrome mt-2 w-full rounded-xl bg-background py-2 text-[11px] font-bold active:scale-[0.99]"
              >
                💰 {person.funded ? "Edit funding" : "Set funding status"}
              </button>
            )}
          </div>
        )}

        {/* Confirmation code + private dashboard note */}
        {isMember && <AdminMemberTools person={person} />}

        {/* Their individual project */}
        {isMember && (
          <div className="rounded-2xl bg-surface p-4 shadow-sm">
            <p className="text-sm font-bold">🎯 Their project</p>
            <p className="mb-1 text-[11px] opacity-50">
              {milestones.length === 0
                ? "No milestones recorded"
                : `${done} of ${milestones.length} delivered`}
            </p>
            {milestones.map((m) => {
              const meta = MILESTONE_STATUS[m.status] ?? MILESTONE_STATUS.planned;
              const dm = DUE_META[dueState(m.dueDate, m.status === "completed")];
              return (
                <div key={m.id} className="flex items-start gap-2 border-t border-black/5 py-2 text-xs dark:border-white/10">
                  <span aria-hidden>{meta.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{m.title}</p>
                    <p className="text-[10px] opacity-50">
                      {meta.label}
                      {m.roomName ? ` · 🔐 ${m.roomName}` : ""}
                    </p>
                    {dm && m.dueDate && (
                      <p className="text-[10px] font-bold" style={{ color: dm.color }}>
                        {dm.icon} {dueLabel(m.dueDate)}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 tabular-nums text-[10px] opacity-60">
                    {m.spentAmount ?? 0}/{m.fundedAmount ?? 0}
                  </span>
                </div>
              );
            })}
            <Link
              href="/admin/milestones"
              className="app-chrome mt-2 block rounded-xl bg-background py-2 text-center text-[11px] font-bold active:scale-[0.99]"
            >
              🎯 Manage milestones
            </Link>
          </div>
        )}

        {/* Alerts sent to them */}
        {isMember && (
          <div className="rounded-2xl bg-surface p-4 shadow-sm">
            <p className="text-sm font-bold">🔔 Alerts sent</p>
            {alerts.length === 0 ? (
              <p className="py-2 text-[11px] opacity-50">No alerts sent yet.</p>
            ) : (
              alerts.slice(0, 6).map((a) => (
                <div key={a.id} className="border-t border-black/5 py-2 text-xs dark:border-white/10">
                  <p className="leading-relaxed">{a.message}</p>
                  <p className="mt-0.5 text-[10px] opacity-40">
                    {a.createdAt?.toDate().toLocaleString() ?? ""} ·{" "}
                    {a.read ? "✅ Read" : "○ Not read"}
                  </p>
                </div>
              ))
            )}
            <Link
              href="/admin/alerts"
              className="app-chrome mt-2 block rounded-xl bg-background py-2 text-center text-[11px] font-bold active:scale-[0.99]"
            >
              🔔 Write an alert
            </Link>
          </div>
        )}

        {/* Rooms they belong to */}
        <div className="rounded-2xl bg-surface p-4 shadow-sm">
          <p className="text-sm font-bold">🔐 Rooms</p>
          {memberships.length === 0 ? (
            <p className="py-2 text-[11px] opacity-50">
              {person.role === "member"
                ? "Not in any room yet."
                : "Admins and Staff Handles reach every room automatically."}
            </p>
          ) : (
            memberships.map((r) => (
              <Link
                key={r.id}
                href={`/rooms/${r.id}`}
                className="app-chrome flex items-center gap-2 border-t border-black/5 py-2.5 text-xs font-semibold dark:border-white/10"
              >
                🔐 <span className="min-w-0 flex-1 truncate">{r.name}</span>
                <span className="opacity-30">›</span>
              </Link>
            ))
          )}
          <Link
            href="/admin/rooms"
            className="app-chrome mt-2 block rounded-xl bg-background py-2 text-center text-[11px] font-bold active:scale-[0.99]"
          >
            🔐 Manage room access
          </Link>
        </div>

        {/* Admin actions */}
        {canAct && (
          <div className="space-y-2 rounded-2xl bg-surface p-4 shadow-sm">
            <p className="text-sm font-bold">Actions</p>

            {superadmin && (
              <select
                className="w-full rounded-xl border border-black/10 bg-background px-3 py-2.5 text-sm outline-none focus:border-brand dark:border-white/10"
                value={person.role}
                onChange={(e) => setUserRole(person.uid, e.target.value as Role)}
              >
                <option value="member">Role: Member (project manager)</option>
                <option value="staff">Role: Staff Handle (managed)</option>
                <option value="admin">Role: Admin</option>
                <option value="superadmin">Role: SuperAdmin</option>
              </select>
            )}

            <button
              type="button"
              onClick={() => setAccountActive(person.uid, person.active === false)}
              className={`app-chrome w-full rounded-xl py-2.5 text-sm font-bold ${
                person.active === false
                  ? "bg-emerald-500/15 text-emerald-600"
                  : "bg-amber-500/15 text-amber-600"
              }`}
            >
              {person.active === false ? "✅ Unban this account" : "⛔ Ban this account"}
            </button>

            <button
              type="button"
              onClick={async () => {
                if (
                  !window.confirm(
                    `Permanently delete ${person.handle}? They lose all access immediately. This cannot be undone.`,
                  )
                )
                  return;
                try {
                  await deleteUserAccount(person.uid);
                  window.alert(
                    `${person.handle} deleted. To reuse their email later, also remove them in Firebase Console → Authentication → Users.`,
                  );
                  router.replace("/admin/users");
                } catch {
                  window.alert("Could not delete that account.");
                }
              }}
              className="app-chrome w-full rounded-xl bg-red-500/10 py-2.5 text-sm font-bold text-red-500"
            >
              🗑️ Delete this account
            </button>
          </div>
        )}

        {!canAct && (
          <p className="px-2 text-center text-[11px] leading-relaxed opacity-50">
            {isSelf
              ? "This is your own account — manage it from your Dashboard tab."
              : "Only the SuperAdmin can act on a SuperAdmin account."}
          </p>
        )}
      </div>
    </AppShell>
  );
}
