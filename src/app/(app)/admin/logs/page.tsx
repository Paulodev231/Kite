"use client";

// Admin-only: append-only compliance & event log. High-level metadata
// (who / what kind of action / when) — never message or form content.
import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ComplianceLog } from "@/lib/types";
import AppShell from "@/components/AppShell";
import { useT } from "@/context/LanguageContext";
import type { TranslationKey } from "@/lib/i18n";

// Each log category renders as an icon plus a translated label.
const CATEGORY_META: Record<string, { icon: string; key: TranslationKey }> = {
  account_created: { icon: "🪪", key: "logAccountCreated" },
  account_activated: { icon: "✅", key: "logAccountActivated" },
  account_deactivated: { icon: "⛔", key: "logAccountDeactivated" },
  room_created: { icon: "🔐", key: "logRoomCreated" },
  room_member_added: { icon: "➕", key: "logRoomMemberAdded" },
  room_member_removed: { icon: "➖", key: "logRoomMemberRemoved" },
  form_published: { icon: "📋", key: "logFormPublished" },
  form_submission: { icon: "✍️", key: "logFormSubmission" },
  staff_oncall_on: { icon: "🟢", key: "logStaffOnCallOn" },
  staff_oncall_off: { icon: "⚪", key: "logStaffOnCallOff" },
  broadcast_post: { icon: "📣", key: "logBroadcastPost" },
  post_edited: { icon: "✏️", key: "logPostEdited" },
  post_pinned: { icon: "📌", key: "logPostPinned" },
  post_unpinned: { icon: "📌", key: "logPostUnpinned" },
  message_edited: { icon: "✏️", key: "logMessageEdited" },
  posted_as_handle: { icon: "🎧", key: "logPostedAsHandle" },
  dm_as_handle: { icon: "🎧", key: "logDmAsHandle" },
  staff_handle_created: { icon: "🎧", key: "logStaffHandleCreated" },
  staff_handle_renamed: { icon: "✏️", key: "logStaffHandleRenamed" },
  email_recorded: { icon: "✉️", key: "logEmailRecorded" },
  role_changed: { icon: "🛡️", key: "logRoleChanged" },
  dm_thread_started: { icon: "💬", key: "logDmThreadStarted" },
  handle_changed: { icon: "📝", key: "logHandleChanged" },
  username_changed: { icon: "👤", key: "logUsernameChanged" },
  email_changed: { icon: "✉️", key: "logEmailChanged" },
  account_deleted: { icon: "🗑️", key: "logAccountDeleted" },
  post_deleted: { icon: "🧹", key: "logPostDeleted" },
  message_deleted: { icon: "🧹", key: "logMessageDeleted" },
  milestone_created: { icon: "🎯", key: "logMilestoneCreated" },
  milestone_planned: { icon: "📋", key: "logMilestonePlanned" },
  milestone_in_progress: { icon: "⏳", key: "logMilestoneInProgress" },
  milestone_blocked: { icon: "⛔", key: "logMilestoneBlocked" },
  milestone_completed: { icon: "✅", key: "logMilestoneCompleted" },
  funding_granted: { icon: "💰", key: "logFundingGranted" },
  funding_cleared: { icon: "○", key: "logFundingCleared" },
  milestone_reassigned: { icon: "🔄", key: "logMilestoneReassigned" },
  alert_sent: { icon: "🔔", key: "logAlertSent" },
  // Kept so older entries still read properly; codes are no longer issued.
  funding_code_issued: { icon: "🔑", key: "logFundingCodeIssued" },
  funding_code_revoked: { icon: "🗝️", key: "logFundingCodeRevoked" },
  bank_details_updated: { icon: "🏦", key: "logBankDetailsUpdated" },
  dashboard_message_set: { icon: "📌", key: "logDashboardNoteSet" },
  dashboard_message_cleared: { icon: "📌", key: "logDashboardNoteCleared" },
};

export default function AdminLogsPage() {
  const { t } = useT();
  const [logs, setLogs] = useState<ComplianceLog[]>([]);

  useEffect(() => {
    const q = query(collection(db(), "complianceLogs"), orderBy("at", "desc"), limit(150));
    return onSnapshot(q, (snap) =>
      setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ComplianceLog)),
    );
  }, []);

  return (
    <AppShell title={`🧾 ${t("admLogs")}`}>
      <div className="mx-auto max-w-lg space-y-1.5 p-3">
        <p className="px-2 py-1 text-[11px] leading-relaxed opacity-40">
          {t("logsIntro")}
        </p>
        {logs.length === 0 && (
          <p className="pt-12 text-center text-sm opacity-50">
            {t("logsEmpty")}
          </p>
        )}
        {logs.map((log) => {
          const meta = CATEGORY_META[log.category];
          return (
            <div key={log.id} className="flex items-start gap-3 rounded-2xl bg-surface p-3 shadow-sm">
              <span className="mt-0.5 text-lg">{meta ? meta.icon : "•"}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{meta ? t(meta.key) : log.category}</p>
                <p className="break-all text-[10px] font-mono opacity-50">
                  {t("logActor")} {log.actorUid.slice(0, 8)}…
                  {Object.entries(log.meta ?? {}).map(
                    ([k, v]) => ` · ${k}: ${String(v).slice(0, 24)}`,
                  )}
                </p>
              </div>
              <span className="shrink-0 text-right text-[10px] leading-tight opacity-40">
                {log.at?.toDate().toLocaleDateString()}
                <br />
                {log.at?.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
