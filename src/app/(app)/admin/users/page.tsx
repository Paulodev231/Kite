"use client";

// Admin-only: the FULL user directory (hidden from standard members) plus
// invite-only account creation. SuperAdmins can also mint Admins and Staff
// Handles (bulk-friendly: the form stays filled-in ready for the next one).
import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { createManagedAccount, deleteUserAccount, setAccountActive } from "@/lib/adminActions";
import { formatFunding, fundingBadge, type Role, type UserProfile } from "@/lib/types";
import AppShell from "@/components/AppShell";
import FundingEditor from "@/components/FundingEditor";

export default function AdminUsersPage() {
  const { profile } = useAuth();
  const superadmin = profile?.role === "superadmin";
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [fundingFor, setFundingFor] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db(), "users"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) =>
      setUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as UserProfile)),
    );
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    setBusy(true);
    try {
      await createManagedAccount(email.trim(), password, handle.trim(), role);
      setNotice(
        `✅ Account created. Share these credentials privately: ${email.trim()} / ${password}`,
      );
      setHandle("");
      setEmail("");
      setPassword("");
    } catch (err) {
      setNotice(`❌ ${err instanceof Error ? err.message : "Could not create account."}`);
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-black/10 bg-background px-3 py-2.5 text-sm outline-none focus:border-brand dark:border-white/10";

  return (
    <AppShell title="👥 Members & Accounts">
      <div className="mx-auto max-w-lg space-y-4 p-3">
        <form onSubmit={handleCreate} className="space-y-2 rounded-2xl bg-surface p-4 shadow-sm">
          <p className="text-sm font-bold">➕ Create account (invite-only)</p>
          <input
            className={inputCls}
            placeholder="Handle (e.g. PM_Ade)"
            required
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
          />
          <input
            className={inputCls}
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className={inputCls}
            placeholder="Temporary password (min 6 chars)"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <select
            className={inputCls}
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            <option value="member">Member (Project Manager)</option>
            {superadmin && <option value="staff">Staff Handle (managed)</option>}
            {superadmin && <option value="admin">Admin</option>}
          </select>
          <button
            type="submit"
            disabled={busy}
            className="app-chrome w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create Account"}
          </button>
          {notice && (
            <p className="break-words rounded-xl bg-brand-soft px-3 py-2 text-xs">{notice}</p>
          )}
        </form>

        <div className="space-y-2">
          {/* Funding roll-up across the directory */}
          {(() => {
            const fundedUsers = users.filter((u) => u.funded);
            if (fundedUsers.length === 0) return null;
            const byCurrency = fundedUsers.reduce<Record<string, number>>((acc, u) => {
              const cur = u.fundedCurrency || "$";
              acc[cur] = (acc[cur] ?? 0) + (u.fundedAmount ?? 0);
              return acc;
            }, {});
            return (
              <div className="rounded-2xl bg-surface p-4 shadow-sm">
                <p className="text-sm font-bold">💰 Funded members</p>
                <p className="text-[11px] opacity-50">
                  {fundedUsers.length} of {users.length} tagged as funded
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(byCurrency).map(([cur, sum]) => (
                    <span
                      key={cur}
                      className="rounded-full bg-brand-soft px-3 py-1 text-xs font-bold tabular-nums text-brand"
                    >
                      {formatFunding(sum, cur)} total
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}

          <p className="px-2 text-xs font-semibold uppercase tracking-wide opacity-40">
            Directory ({users.length}) — visible to Admins only
          </p>
          {users.map((u) => (
            <div key={u.uid} className="rounded-2xl bg-surface p-3 shadow-sm">
              <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                {u.handle?.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{u.handle}</p>
                <p className="text-[10px] capitalize opacity-50">
                  {u.role}
                  {u.active === false ? " · deactivated" : ""}
                </p>
                {u.role !== "superadmin" &&
                  (() => {
                    const badge = fundingBadge(u);
                    return (
                      <p
                        className="text-[10px] font-bold"
                        style={{ color: u.funded ? badge.color : undefined }}
                      >
                        <span className={u.funded ? "" : "opacity-50"}>
                          {badge.icon} {badge.label}
                          {u.funded && u.fundedNote ? ` · ${u.fundedNote}` : ""}
                        </span>
                      </p>
                    );
                  })()}
              </div>
              {u.uid !== profile?.uid && u.role !== "superadmin" && (
                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAccountActive(u.uid, u.active === false)}
                    className={`app-chrome rounded-full px-3 py-1.5 text-[11px] font-bold ${
                      u.active === false
                        ? "bg-emerald-500/15 text-emerald-600"
                        : "bg-amber-500/15 text-amber-600"
                    }`}
                  >
                    {u.active === false ? "Unban" : "Ban"}
                  </button>
                  {(superadmin || u.role === "member") && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (
                          !window.confirm(
                            `Permanently delete ${u.handle}? They lose all room access immediately. This cannot be undone.`,
                          )
                        )
                          return;
                        try {
                          await deleteUserAccount(u.uid);
                          window.alert(
                            `${u.handle} deleted. To reuse their email later, also remove them in Firebase Console → Authentication → Users.`,
                          );
                        } catch {
                          window.alert("Could not delete that account.");
                        }
                      }}
                      className="app-chrome rounded-full bg-red-500/10 px-3 py-1.5 text-[11px] font-bold text-red-500"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
              </div>

              {/* Funding tag — admins only; members see it read-only on their profile */}
              {u.role !== "superadmin" && (
                <>
                  {fundingFor === u.uid ? (
                    <FundingEditor user={u} onDone={() => setFundingFor(null)} />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setFundingFor(u.uid)}
                      className="app-chrome mt-2 w-full rounded-xl bg-background py-2 text-[11px] font-bold active:scale-[0.99]"
                    >
                      💰 {u.funded ? "Edit funding" : "Set funding status"}
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
