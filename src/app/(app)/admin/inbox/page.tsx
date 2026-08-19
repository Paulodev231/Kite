"use client";

// SuperAdmin Master Inbox: every DM sent to ANY Managed Staff Handle,
// unified in one place with 🔴 unread badges, for seamless triage.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import type { DmThread, UserProfile } from "@/lib/types";
import AppShell from "@/components/AppShell";
import SplashScreen from "@/components/SplashScreen";

function isUnread(t: DmThread, staffUid: string): boolean {
  if (!t.lastSenderUid || t.lastSenderUid === staffUid) return false;
  if (!t.staffReadAt) return true;
  return (t.updatedAt?.toMillis() ?? 0) > t.staffReadAt.toMillis();
}

export default function MasterInboxPage() {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [threads, setThreads] = useState<DmThread[]>([]);

  useEffect(() => {
    if (!loading && profile?.role !== "superadmin") router.replace("/admin");
  }, [loading, profile, router]);

  useEffect(() => {
    if (profile?.role !== "superadmin") return;
    const unsubStaff = onSnapshot(
      query(collection(db(), "users"), where("role", "==", "staff")),
      (snap) => setStaff(snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as UserProfile)),
    );
    const unsubThreads = onSnapshot(
      query(collection(db(), "dms"), orderBy("updatedAt", "desc"), limit(200)),
      (snap) => setThreads(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DmThread)),
    );
    return () => {
      unsubStaff();
      unsubThreads();
    };
  }, [profile]);

  if (loading || profile?.role !== "superadmin") return <SplashScreen />;

  const staffUids = new Set(staff.map((s) => s.uid));
  const staffThreads = threads
    .map((t) => {
      const staffUid = t.participants.find((p) => staffUids.has(p));
      return staffUid ? { thread: t, staffUid } : null;
    })
    .filter((x): x is { thread: DmThread; staffUid: string } => x !== null);
  const unreadTotal = staffThreads.filter(({ thread, staffUid }) =>
    isUnread(thread, staffUid),
  ).length;

  return (
    <AppShell title="📥 Master Inbox">
      <div className="mx-auto max-w-lg space-y-2 p-3">
        <div className="rounded-2xl bg-surface p-4 shadow-sm">
          <p className="text-sm font-bold">
            Staff Handle traffic{" "}
            {unreadTotal > 0 && (
              <span className="ml-1 rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white">
                🔴 {unreadTotal} unread
              </span>
            )}
          </p>
          <p className="text-xs opacity-50">
            Every DM sent to any of your {staff.length} managed handle
            {staff.length === 1 ? "" : "s"}, in one place. Tap to read & reply as
            that handle.
          </p>
        </div>

        {staffThreads.length === 0 && (
          <p className="pt-12 text-center text-sm opacity-50">
            No messages to your Staff Handles yet.
          </p>
        )}

        {staffThreads.map(({ thread, staffUid }) => {
          const memberUid = thread.participants.find((p) => p !== staffUid) ?? "";
          const memberHandle = thread.handles?.[memberUid] ?? "Member";
          const staffHandle = thread.handles?.[staffUid] ?? "Staff";
          const unread = isUnread(thread, staffUid);
          return (
            <Link
              key={thread.id}
              href={`/admin/inbox/${thread.id}`}
              className="app-chrome flex items-center gap-3 rounded-2xl bg-surface p-3.5 shadow-sm active:scale-[0.99]"
            >
              <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                {memberHandle.slice(0, 1).toUpperCase()}
                {unread && (
                  <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-surface bg-red-500" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">
                  {memberHandle}
                  <span className="font-normal opacity-40"> → 🎧 {staffHandle}</span>
                </p>
                <p className={`truncate text-xs ${unread ? "font-bold" : "opacity-50"}`}>
                  {thread.lastSenderUid === staffUid ? `${staffHandle}: ` : ""}
                  {thread.lastText ?? ""}
                </p>
              </div>
              <span className="text-[10px] opacity-40">
                {thread.updatedAt?.toDate().toLocaleDateString() ?? ""}
              </span>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
