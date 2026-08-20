"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { formatFunding, isAdmin, roleTag } from "@/lib/types";
import AppShell from "@/components/AppShell";
import AccountSettings from "@/components/AccountSettings";
import NotificationSettings from "@/components/NotificationSettings";
import MyMilestones from "@/components/MyMilestones";

export default function ProfilePage() {
  const { user, profile, logout } = useAuth();
  const router = useRouter();

  return (
    <AppShell title="👤 My Profile">
      <div className="mx-auto max-w-lg space-y-4 p-4">
        <div className="flex flex-col items-center gap-2 rounded-3xl bg-surface p-6 shadow-sm">
          <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand text-3xl font-bold text-white">
            {(profile?.handle ?? "?").slice(0, 1).toUpperCase()}
          </span>
          <p className="text-lg font-extrabold">{profile?.handle}</p>
          {roleTag(profile?.role) && (
            <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand">
              {roleTag(profile?.role)}
            </span>
          )}
          <p className="text-xs opacity-50">{user?.email}</p>
        </div>

        {/* Funding status — set by Admins, read-only here */}
        {profile && profile.role !== "superadmin" && (
          <div className="rounded-3xl bg-surface p-4 shadow-sm">
            <p className="text-sm font-bold">💰 Funding status</p>
            {profile.funded ? (
              <>
                <p
                  className="mt-1 text-2xl font-extrabold tabular-nums"
                  style={{ color: "#0ca30c" }}
                >
                  {formatFunding(profile.fundedAmount, profile.fundedCurrency)}
                </p>
                <p className="text-xs font-semibold text-emerald-600">✅ Funded</p>
                {profile.fundedNote && (
                  <p className="mt-1 text-[11px] opacity-60">{profile.fundedNote}</p>
                )}
                {profile.fundedAt && (
                  <p className="mt-1 text-[10px] opacity-40">
                    Updated {profile.fundedAt.toDate().toLocaleDateString()}
                  </p>
                )}
              </>
            ) : (
              <p className="mt-1 text-sm font-semibold opacity-60">○ Not funded</p>
            )}
            <p className="mt-2 text-[10px] leading-relaxed opacity-40">
              Your funding status is set by an administrator. Contact them if
              something looks wrong.
            </p>
          </div>
        )}

        <MyMilestones />

        <NotificationSettings />

        <AccountSettings />

        <div className="overflow-hidden rounded-3xl bg-surface shadow-sm">
          {isAdmin(profile?.role) && (
            <Link
              href="/admin"
              className="app-chrome flex items-center gap-3 border-b border-black/5 px-5 py-4 text-sm font-semibold active:bg-brand-soft dark:border-white/10"
            >
              🛡️ Admin Panel <span className="ml-auto opacity-30">›</span>
            </Link>
          )}
          <button
            type="button"
            onClick={async () => {
              await logout();
              router.replace("/login");
            }}
            className="app-chrome flex w-full items-center gap-3 px-5 py-4 text-left text-sm font-semibold text-red-500 active:bg-red-500/10"
          >
            🚪 Sign out
          </button>
        </div>

        <p className="text-center text-[10px] leading-relaxed opacity-40">
          Kite · Closed enterprise workspace
          <br />
          Your directory visibility is protected. Other members cannot look you up.
        </p>
      </div>
    </AppShell>
  );
}
