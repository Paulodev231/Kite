"use client";

// Admin-only: the FULL user directory (hidden from standard members) plus
// invite-only account creation. SuperAdmins can also mint Admins and Staff
// Handles (bulk-friendly: the form stays filled-in ready for the next one).
import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useT } from "@/context/LanguageContext";
import { ROLE_KEYS } from "@/lib/i18n";
import { createManagedAccount, deleteUserAccount, setAccountActive } from "@/lib/adminActions";
import { normalizeUsername } from "@/lib/usernames";
import { formatFunding, fundingBadge, type Role, type UserProfile } from "@/lib/types";
import AppShell from "@/components/AppShell";
import FundingEditor from "@/components/FundingEditor";

export default function AdminUsersPage() {
  const { profile } = useAuth();
  const { t } = useT();
  const superadmin = profile?.role === "superadmin";
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [handle, setHandle] = useState("");
  const [username, setUsername] = useState("");
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
      await createManagedAccount(username, email.trim(), password, handle.trim(), role);
      setNotice(t("usrCreated", { username: normalizeUsername(username), password }));
      setHandle("");
      setUsername("");
      setEmail("");
      setPassword("");
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      if (code === "username-invalid") setNotice(t("usernameInvalid"));
      else if (code === "username-taken") setNotice(t("usernameTaken"));
      else setNotice(`❌ ${code || t("usrCreateFailed")}`);
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-black/10 bg-background px-3 py-2.5 text-sm outline-none focus:border-brand dark:border-white/10";

  return (
    <AppShell title={`👥 ${t("admUsers")}`}>
      <div className="mx-auto max-w-lg space-y-4 p-3">
        <form onSubmit={handleCreate} className="space-y-2 rounded-2xl bg-surface p-4 shadow-sm">
          <p className="text-sm font-bold">{t("usrCreateTitle")}</p>
          <input
            className={inputCls}
            placeholder={t("usrHandlePlaceholder")}
            required
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
          />
          <input
            className={inputCls}
            placeholder={t("usrUsernamePlaceholder")}
            required
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            className={inputCls}
            type="email"
            placeholder={t("usrEmailOptional")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className={inputCls}
            placeholder={t("usrTempPassword")}
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
            <option value="member">{t("usrRoleMember")}</option>
            {superadmin && <option value="admin">{t("usrRoleAdmin")}</option>}
          </select>
          <button
            type="submit"
            disabled={busy}
            className="app-chrome w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? t("usrCreating") : t("usrCreate")}
          </button>
          {notice && (
            <p className="break-words rounded-xl bg-brand-soft px-3 py-2 text-xs">{notice}</p>
          )}
          {superadmin && (
            <p className="text-[11px] leading-relaxed opacity-50">
              {t("usrStaffHint")}
            </p>
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
                <p className="text-sm font-bold">{t("usrFundedMembers")}</p>
                <p className="text-[11px] opacity-50">
                  {t("usrFundedCount", {
                    funded: fundedUsers.length,
                    total: users.length,
                  })}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(byCurrency).map(([cur, sum]) => (
                    <span
                      key={cur}
                      className="rounded-full bg-brand-soft px-3 py-1 text-xs font-bold tabular-nums text-brand"
                    >
                      {t("usrTotalSuffix", { amount: formatFunding(sum, cur) })}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}

          <p className="px-2 text-xs font-semibold uppercase tracking-wide opacity-40">
            {t("usrDirectory", { n: users.length })}
          </p>
          {users.map((u) => (
            <div key={u.uid} className="rounded-2xl bg-surface p-3 shadow-sm">
              <div className="flex items-center gap-3">
              <Link
                href={`/admin/users/${u.uid}`}
                className="app-chrome flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white active:scale-95"
              >
                {u.handle?.slice(0, 1).toUpperCase()}
              </Link>
              <Link href={`/admin/users/${u.uid}`} className="min-w-0 flex-1 active:opacity-70">
                <p className="truncate text-sm font-bold">
                  {u.handle} <span className="text-[10px] font-normal opacity-30">›</span>
                </p>
                <p className="truncate text-[10px] opacity-50">
                  {u.username ? `@${u.username}` : t("usrNoUsername")}
                  {u.email ? ` · ${u.email}` : ""}
                </p>
                <p className="text-[10px] opacity-50">
                  {t(ROLE_KEYS[u.role])}
                  {u.active === false ? ` · ${t("usrBanned")}` : ""}
                </p>
                {u.role === "member" &&
                  (() => {
                    const badge = fundingBadge(u);
                    return (
                      <p
                        className="text-[10px] font-bold"
                        style={{ color: u.funded ? badge.color : undefined }}
                      >
                        <span className={u.funded ? "" : "opacity-50"}>
                          {badge.icon}{" "}
                          {u.funded
                            ? t("fundedWithAmount", {
                                amount: formatFunding(u.fundedAmount, u.fundedCurrency),
                              })
                            : t("notFunded")}
                          {u.funded && u.fundedNote ? ` · ${u.fundedNote}` : ""}
                        </span>
                      </p>
                    );
                  })()}
              </Link>
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
                    {u.active === false ? t("usrUnban") : t("usrBan")}
                  </button>
                  {(superadmin || u.role === "member") && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (
                          !window.confirm(t("usrDeleteConfirm", { handle: u.handle }))
                        )
                          return;
                        try {
                          await deleteUserAccount(u.uid);
                          window.alert(t("usrDeleted", { handle: u.handle }));
                        } catch {
                          window.alert(t("usrDeleteFailed"));
                        }
                      }}
                      className="app-chrome rounded-full bg-red-500/10 px-3 py-1.5 text-[11px] font-bold text-red-500"
                    >
                      {t("delete")}
                    </button>
                  )}
                </div>
              )}
              </div>

              {/* Funding tags apply to real members only — Staff Handles and
                  Admins don't run funded projects. */}
              {u.role === "member" && (
                <>
                  {fundingFor === u.uid ? (
                    <FundingEditor user={u} onDone={() => setFundingFor(null)} />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setFundingFor(u.uid)}
                      className="app-chrome mt-2 w-full rounded-xl bg-background py-2 text-[11px] font-bold active:scale-[0.99]"
                    >
                      {u.funded ? t("usrEditFunding") : t("usrSetFunding")}
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
