"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { isAdmin } from "@/lib/types";
import AppShell from "@/components/AppShell";

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
          <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-bold capitalize text-brand">
            {profile?.role}
          </span>
          <p className="text-xs opacity-50">{user?.email}</p>
        </div>

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
