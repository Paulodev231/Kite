"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import AppShell from "@/components/AppShell";

export default function AdminHome() {
  const { profile } = useAuth();
  const superadmin = profile?.role === "superadmin";

  const items = [
    {
      href: "/admin/users",
      icon: "👥",
      title: "Members & Accounts",
      desc: "Invite-only account creation, full member directory, activate/deactivate",
    },
    {
      href: "/admin/rooms",
      icon: "🔐",
      title: "Private Rooms",
      desc: "Create Admin-locked workspaces and control exactly who is inside",
    },
    ...(superadmin
      ? [
          {
            href: "/admin/staff",
            icon: "🎧",
            title: "Staff Handles",
            desc: "Managed profiles, On-Call/Off-Call presence control",
          },
        ]
      : []),
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
              <p className="text-sm font-bold">{item.title}</p>
              <p className="text-xs leading-snug opacity-50">{item.desc}</p>
            </div>
            <span className="opacity-30">›</span>
          </Link>
        ))}
        <p className="px-2 pt-2 text-[11px] leading-relaxed opacity-40">
          Coming in the next phase: embedded milestone forms & digital
          signatures, the centralized Staff master inbox, and compliance event
          logs.
        </p>
      </div>
    </AppShell>
  );
}
