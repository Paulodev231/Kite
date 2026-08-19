"use client";

// Admin-only: the FULL user directory (hidden from standard members) plus
// invite-only account creation. SuperAdmins can also mint Admins and Staff
// Handles (bulk-friendly: the form stays filled-in ready for the next one).
import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { createManagedAccount, setAccountActive } from "@/lib/adminActions";
import type { Role, UserProfile } from "@/lib/types";
import AppShell from "@/components/AppShell";

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
          <p className="px-2 text-xs font-semibold uppercase tracking-wide opacity-40">
            Directory ({users.length}) — visible to Admins only
          </p>
          {users.map((u) => (
            <div
              key={u.uid}
              className="flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-sm"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                {u.handle?.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{u.handle}</p>
                <p className="text-[10px] capitalize opacity-50">
                  {u.role}
                  {u.active === false ? " · deactivated" : ""}
                </p>
              </div>
              {u.uid !== profile?.uid && u.role !== "superadmin" && (
                <button
                  type="button"
                  onClick={() => setAccountActive(u.uid, u.active === false)}
                  className={`app-chrome rounded-full px-3 py-1.5 text-[11px] font-bold ${
                    u.active === false
                      ? "bg-emerald-500/15 text-emerald-600"
                      : "bg-red-500/10 text-red-500"
                  }`}
                >
                  {u.active === false ? "Activate" : "Deactivate"}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
