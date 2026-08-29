"use client";

// Anonymous "Active Now" indicator. Never names anyone — it only counts.
//
// Platform-wide (Noticeboard, DMs, Dashboard):
//   people active anywhere + every Staff Handle toggled On-Call.
// Inside a room:
//   only people currently viewing THAT room + On-Call Staff Handles that have
//   actually been added to it. So a room's number is its own, and is normally
//   smaller than the platform total.
import { useEffect, useState } from "react";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useT } from "@/context/LanguageContext";

const FRESH_MS = 2.5 * 60_000; // heartbeat is every 60s; allow some slack

export default function PresenceCounter({ roomId }: { roomId?: string }) {
  const [livePeople, setLivePeople] = useState(0);
  const [onCallStaff, setOnCallStaff] = useState(0);
  const [, forceTick] = useState(0);
  const { t } = useT();

  useEffect(() => {
    const unsubPresence = onSnapshot(
      collection(db(), "presence"),
      (snap) => {
        const cutoff = Date.now() - FRESH_MS;
        setLivePeople(
          snap.docs.filter((d) => {
            const data = d.data();
            const t = data.lastActive;
            const fresh = t?.toMillis ? t.toMillis() > cutoff : true;
            if (!fresh) return false;
            // In a room, count only people viewing that same room.
            return roomId ? data.roomId === roomId : true;
          }).length,
        );
      },
      () => {},
    );

    // On-call handles: platform-wide total, or just those added to this room.
    const unsubStaff = roomId
      ? onSnapshot(
          doc(db(), "rooms", roomId),
          (snap) => setOnCallStaff(snap.data()?.onCallStaffCount ?? 0),
          () => {},
        )
      : onSnapshot(
          doc(db(), "status", "staff"),
          (snap) => setOnCallStaff(snap.data()?.onCallCount ?? 0),
          () => {},
        );

    // Re-evaluate staleness every 30s even without snapshot updates.
    const timer = setInterval(() => forceTick((n) => n + 1), 30_000);
    return () => {
      unsubPresence();
      unsubStaff();
      clearInterval(timer);
    };
  }, [roomId]);

  const total = livePeople + onCallStaff;

  return (
    <span
      className="app-chrome inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white"
      title={roomId ? "Active in this room" : "Active on the platform"}
    >
      <span aria-hidden>⚡</span>
      {roomId ? `${t("inRoom")}: ` : `${t("activeNow")}: `}
      {total}
    </span>
  );
}
