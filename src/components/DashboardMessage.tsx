"use client";

// A note an Admin pinned to this member's dashboard. Private to them.
import { useAuth } from "@/context/AuthContext";
import { useT } from "@/context/LanguageContext";

export default function DashboardMessage() {
  const { profile } = useAuth();
  const { t } = useT();
  const message = profile?.dashboardMessage?.trim();
  if (!message) return null;

  return (
    <div className="rounded-3xl bg-brand-soft p-4 shadow-sm ring-1 ring-brand/30">
      <p className="text-sm font-bold text-brand">📌 {t("noteForYou")}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{message}</p>
      {profile?.dashboardMessageAt && (
        <p className="mt-1 text-[10px] opacity-50">
          {t("fromAdmin")} ·{" "}
          {profile.dashboardMessageAt.toDate().toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
