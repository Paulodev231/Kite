"use client";

// SuperAdmin only: Managed Staff Handles — real-time On-Call/Off-Call
// presence control. On-Call handles are counted in the public anonymous
// "Active Now" indicator. Create new handles from Members & Accounts
// (role: Staff Handle).
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { setStaffOnCall } from "@/lib/adminActions";
import type { UserProfile } from "@/lib/types";
import AppShell from "@/components/AppShell";
import SplashScreen from "@/components/SplashScreen";

export default function AdminStaffPage() {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const [staff, setStaff] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (!loading && profile?.role !== "superadmin") router.replace("/admin");
  }, [loading, profile, router]);

  useEffect(() => {
    if (profile?.role !== "superadmin") return;
    const q = query(collection(db(), "users"), where("role", "==", "staff"));
    return onSnapshot(q, (snap) =>
      setStaff(snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as UserProfile)),
    );
  }, [profile]);

  if (loading || profile?.role !== "superadmin") return <SplashScreen />;

  const onCallCount = staff.filter((s) => s.onCall).length;

  return (
    <AppShell title="🎧 Staff Handles">
      <div className="mx-auto max-w-lg space-y-3 p-3">
        <div className="rounded-2xl bg-surface p-4 shadow-sm">
          <p className="text-sm font-bold">Presence control</p>
          <p className="text-xs opacity-50">
            {onCallCount} of {staff.length} handles On-Call — each On-Call handle adds
            +1 to the public “⚡ Active Now” counter.
          </p>
        </div>

        {staff.length === 0 && (
          <p className="pt-8 text-center text-sm opacity-50">
            No Staff Handles yet.{" "}
            <Link href="/admin/users" className="font-bold text-brand">
              Create one →
            </Link>
          </p>
        )}

        {staff.map((s) => (
          <div key={s.uid} className="flex items-center gap-3 rounded-2xl bg-surface p-3.5 shadow-sm">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                s.onCall ? "bg-emerald-500" : "bg-gray-400/50"
              }`}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{s.handle}</p>
              <p className="text-[10px] opacity-50">
                {s.onCall ? "On-Call · shown as active" : "Off-Call · offline"}
                {s.active === false ? " · deactivated" : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStaffOnCall(s.uid, !s.onCall, Boolean(s.onCall))}
              className={`app-chrome relative h-7 w-12 rounded-full transition-colors ${
                s.onCall ? "bg-emerald-500" : "bg-gray-400/40"
              }`}
              aria-label={`Toggle ${s.handle} on-call`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                  s.onCall ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </div>
        ))}

        <p className="px-2 text-[10px] leading-relaxed opacity-40">
          To operate as a handle, sign in with that handle’s credentials (account
          switching). The centralized master inbox arrives in the next phase.
        </p>
      </div>
    </AppShell>
  );
}
