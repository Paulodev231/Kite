"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import type { DmThread } from "@/lib/types";
import AppShell from "@/components/AppShell";

export default function AdminHome() {
  const { profile } = useAuth();
  const superadmin = profile?.role === "superadmin";
  const [inboxUnread, setInboxUnread] = useState(0);

  // Live 🔴 badge for the master inbox (SuperAdmin only).
  useEffect(() => {
    if (!superadmin) return;
    let staffUids = new Set<string>();
    let threads: DmThread[] = [];
    const recount = () =>
      setInboxUnread(
        threads.filter((t) => {
          const staffUid = t.participants?.find((p) => staffUids.has(p));
          if (!staffUid || !t.lastSenderUid || t.lastSenderUid === staffUid) return false;
          if (!t.staffReadAt) return true;
          return (t.updatedAt?.toMillis() ?? 0) > t.staffReadAt.toMillis();
        }).length,
      );
    const unsubStaff = onSnapshot(
      query(collection(db(), "users"), where("role", "==", "staff")),
      (snap) => {
        staffUids = new Set(snap.docs.map((d) => d.id));
        recount();
      },
    );
    const unsubThreads = onSnapshot(
      query(collection(db(), "dms"), orderBy("updatedAt", "desc"), limit(200)),
      (snap) => {
        threads = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DmThread);
        recount();
      },
    );
    return () => {
      unsubStaff();
      unsubThreads();
    };
  }, [superadmin]);

  const items = [
    {
      href: "/admin/dashboard",
      icon: "📊",
      title: "Dashboard",
      desc: "Milestone delivery, blockers and funded-outcome tracking at a glance",
      badge: 0,
    },
    {
      href: "/admin/milestones",
      icon: "🎯",
      title: "Milestones",
      desc: "Record milestones, log hindrances, track committed vs released funding",
      badge: 0,
    },
    {
      href: "/admin/users",
      icon: "👥",
      title: "Members & Accounts",
      desc: "Invite-only account creation, full member directory, activate/deactivate",
      badge: 0,
    },
    {
      href: "/admin/rooms",
      icon: "🔐",
      title: "Private Rooms",
      desc: "Create Admin-locked workspaces and control exactly who is inside",
      badge: 0,
    },
    {
      href: "/admin/forms",
      icon: "📋",
      title: "Forms & Signatures",
      desc: "Publish milestone reports & signature fields into rooms; review private submissions",
      badge: 0,
    },
    ...(superadmin
      ? [
          {
            href: "/admin/inbox",
            icon: "📥",
            title: "Master Inbox",
            desc: "Every DM to your managed Staff Handles — triage and reply as the handle",
            badge: inboxUnread,
          },
          {
            href: "/admin/staff",
            icon: "🎧",
            title: "Staff Handles",
            desc: "Managed profiles, On-Call/Off-Call presence control",
            badge: 0,
          },
        ]
      : []),
    {
      href: "/admin/logs",
      icon: "🧾",
      title: "Compliance Logs",
      desc: "Append-only audit trail of platform activity metadata",
      badge: 0,
    },
  ];

  return (
    <AppShell title="🛡️ Admin Panel">
      <div className="mx-auto max-w-lg space-y-2 p-3">
        <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide opacity-40">
          {superadmin ? "SuperAdmin Command Center" : "Admin Console"}
        </p>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="app-chrome flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-sm active:scale-[0.99]"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-xl">
              {item.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">
                {item.title}
                {item.badge > 0 && (
                  <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    🔴 {item.badge} DM{item.badge === 1 ? "" : "s"}
                  </span>
                )}
              </p>
              <p className="text-xs leading-snug opacity-50">{item.desc}</p>
            </div>
            <span className="opacity-30">›</span>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
