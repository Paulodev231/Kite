"use client";

// Admin-only: append-only compliance & event log. High-level metadata
// (who / what kind of action / when) — never message or form content.
import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ComplianceLog } from "@/lib/types";
import AppShell from "@/components/AppShell";

const CATEGORY_META: Record<string, { icon: string; label: string }> = {
  account_created: { icon: "🪪", label: "Account created" },
  account_activated: { icon: "✅", label: "Account activated" },
  account_deactivated: { icon: "⛔", label: "Account deactivated" },
  room_created: { icon: "🔐", label: "Room created" },
  room_member_added: { icon: "➕", label: "Member added to room" },
  room_member_removed: { icon: "➖", label: "Member removed from room" },
  form_published: { icon: "📋", label: "Form published" },
  form_submission: { icon: "✍️", label: "Form submitted" },
  staff_oncall_on: { icon: "🟢", label: "Staff handle On-Call" },
  staff_oncall_off: { icon: "⚪", label: "Staff handle Off-Call" },
  broadcast_post: { icon: "📣", label: "Noticeboard post" },
  post_edited: { icon: "✏️", label: "Post edited" },
  post_pinned: { icon: "📌", label: "Post pinned" },
  post_unpinned: { icon: "📌", label: "Post unpinned" },
  message_edited: { icon: "✏️", label: "Room message edited" },
  posted_as_handle: { icon: "🎧", label: "Posted as a Staff Handle" },
  dm_as_handle: { icon: "🎧", label: "DM sent as a Staff Handle" },
  staff_handle_created: { icon: "🎧", label: "Staff Handle created" },
  staff_handle_renamed: { icon: "✏️", label: "Staff Handle renamed" },
  email_recorded: { icon: "✉️", label: "Email recorded" },
  role_changed: { icon: "🛡️", label: "Role changed" },
  dm_thread_started: { icon: "💬", label: "DM conversation started" },
  handle_changed: { icon: "📝", label: "User changed their handle" },
  account_deleted: { icon: "🗑️", label: "Account deleted" },
  post_deleted: { icon: "🧹", label: "Broadcast post deleted" },
  message_deleted: { icon: "🧹", label: "Room message deleted" },
  milestone_created: { icon: "🎯", label: "Milestone recorded" },
  milestone_planned: { icon: "📋", label: "Milestone set to Planned" },
  milestone_in_progress: { icon: "⏳", label: "Milestone in progress" },
  milestone_blocked: { icon: "⛔", label: "Milestone blocked" },
  milestone_completed: { icon: "✅", label: "Milestone completed" },
  funding_granted: { icon: "💰", label: "Member tagged as Funded" },
  funding_cleared: { icon: "○", label: "Member funding removed" },
  milestone_reassigned: { icon: "🔄", label: "Milestone reassigned" },
  alert_sent: { icon: "🔔", label: "Alert sent to member" },
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<ComplianceLog[]>([]);

  useEffect(() => {
    const q = query(collection(db(), "complianceLogs"), orderBy("at", "desc"), limit(150));
    return onSnapshot(q, (snap) =>
      setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ComplianceLog)),
    );
  }, []);

  return (
    <AppShell title="🧾 Compliance Logs">
      <div className="mx-auto max-w-lg space-y-1.5 p-3">
        <p className="px-2 py-1 text-[11px] leading-relaxed opacity-40">
          Append-only audit trail — entries can never be edited or deleted, by
          anyone. Newest first, latest 150 shown.
        </p>
        {logs.length === 0 && (
          <p className="pt-12 text-center text-sm opacity-50">
            No events logged yet. Actions across the platform will appear here.
          </p>
        )}
        {logs.map((log) => {
          const meta = CATEGORY_META[log.category] ?? { icon: "•", label: log.category };
          return (
            <div key={log.id} className="flex items-start gap-3 rounded-2xl bg-surface p-3 shadow-sm">
              <span className="mt-0.5 text-lg">{meta.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{meta.label}</p>
                <p className="break-all text-[10px] font-mono opacity-50">
                  actor {log.actorUid.slice(0, 8)}…
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
