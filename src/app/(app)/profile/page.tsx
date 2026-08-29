"use client";

// The member's own dashboard: alerts from their administrator, their funding
// status, their individual project milestones with countdowns — plus account
// settings.
//
// Project sections are for REAL MEMBERS only. Staff Handles are operator
// accounts run by the SuperAdmin: they don't run projects, so they get no
// milestones, funding or alerts. Admins manage from the Admin Panel.
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useT } from "@/context/LanguageContext";
import { isAdmin, roleTag } from "@/lib/types";
import AppShell from "@/components/AppShell";
import AccountSettings from "@/components/AccountSettings";
import NotificationSettings from "@/components/NotificationSettings";
import MyAlerts from "@/components/MyAlerts";
import MyMilestones from "@/components/MyMilestones";
import FundingPanel from "@/components/FundingPanel";
import DashboardMessage from "@/components/DashboardMessage";
import BankDetails from "@/components/BankDetails";
import LanguagePicker from "@/components/LanguagePicker";

export default function DashboardPage() {
  const { user, profile, logout } = useAuth();
  const { t } = useT();
  const router = useRouter();
  // Only real members have a project to track.
  const runsAProject = profile?.role === "member";

  return (
    <AppShell title={runsAProject ? `📊 ${t("myDashboard")}` : `👤 ${t("myProfile")}`}>
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

        {runsAProject && (
          <>
            <DashboardMessage />
            <MyAlerts />
            <MyMilestones />

            <FundingPanel />
            <BankDetails />
          </>
        )}

        <LanguagePicker />

        <NotificationSettings />

        <AccountSettings />

        <div className="overflow-hidden rounded-3xl bg-surface shadow-sm">
          {isAdmin(profile?.role) && (
            <Link
              href="/admin"
              className="app-chrome flex items-center gap-3 border-b border-black/5 px-5 py-4 text-sm font-semibold active:bg-brand-soft dark:border-white/10"
            >
              🛡️ {t("adminPanel")} <span className="ml-auto opacity-30">›</span>
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
            🚪 {t("signOut")}
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
