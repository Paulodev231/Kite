"use client";

// Anonymous "Active Now" indicator: counts recent presence heartbeats plus
// staff handles currently toggled On-Call — never exposes who is online.
import { useEffect, useState } from "react";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

const FRESH_MS = 2.5 * 60_000; // heartbeat is every 60s; allow some slack

export default function PresenceCounter() {
  const [liveUsers, setLiveUsers] = useState(0);
  const [onCallStaff, setOnCallStaff] = useState(0);
  const [, forceTick] = useState(0);

  useEffect(() => {
    const unsubPresence = onSnapshot(
      collection(db(), "presence"),
      (snap) => {
        const cutoff = Date.now() - FRESH_MS;
        setLiveUsers(
          snap.docs.filter((d) => {
            const t = d.data().lastActive;
            return t?.toMillis ? t.toMillis() > cutoff : true;
          }).length,
        );
      },
      () => {},
    );
    const unsubStaff = onSnapshot(
      doc(db(), "status", "staff"),
      (snap) => setOnCallStaff(snap.exists() ? (snap.data().onCallCount ?? 0) : 0),
      () => {},
    );
    // Re-evaluate staleness every 30s even without snapshot updates.
    const timer = setInterval(() => forceTick((n) => n + 1), 30_000);
    return () => {
      unsubPresence();
      unsubStaff();
      clearInterval(timer);
    };
  }, []);

  const total = liveUsers + onCallStaff;

  return (
    <span className="app-chrome inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white">
      <span aria-hidden>⚡</span>
      Active Now: {total}
    </span>
  );
}
