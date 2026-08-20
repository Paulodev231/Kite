"use client";

// Timing alerts written by an Admin for this member. Opening the dashboard
// marks them read, which the Admin can see on their side.
import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import type { MemberAlert } from "@/lib/types";

export default function MyAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<MemberAlert[]>([]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      query(
        collection(db(), "alerts"),
        where("targetUid", "==", user.uid),
        orderBy("createdAt", "desc"),
      ),
      (snap) => setAlerts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as MemberAlert)),
      () => {},
    );
  }, [user]);

  // Mark unread alerts as read once they have actually been shown.
  useEffect(() => {
    for (const a of alerts) {
      if (!a.read) {
        updateDoc(doc(db(), "alerts", a.id), {
          read: true,
          readAt: serverTimestamp(),
        }).catch(() => {});
      }
    }
  }, [alerts]);

  if (alerts.length === 0) return null;

  return (
    <div className="rounded-3xl bg-surface p-4 shadow-sm">
      <p className="text-sm font-bold">🔔 Alerts from your administrator</p>
      <div className="mt-2 space-y-2">
        {alerts.map((a) => (
          <div
            key={a.id}
            className={`rounded-2xl p-3 ${a.read ? "bg-background" : "bg-brand-soft"}`}
          >
            <p className="text-sm leading-relaxed">{a.message}</p>
            <p className="mt-1 text-[10px] opacity-50">
              {a.createdAt?.toDate().toLocaleString() ?? ""}
              {a.milestoneTitle ? ` · 🎯 ${a.milestoneTitle}` : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
