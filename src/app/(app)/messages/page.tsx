"use client";

// Direct Messages inbox: your private 1-on-1 threads.
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import type { DmThread } from "@/lib/types";
import AppShell from "@/components/AppShell";

export default function MessagesPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<DmThread[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db(), "dms"),
      where("participants", "array-contains", user.uid),
      orderBy("updatedAt", "desc"),
    );
    return onSnapshot(q, (snap) =>
      setThreads(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DmThread)),
    );
  }, [user]);

  return (
    <AppShell title="💬 Direct Messages">
      <div className="mx-auto max-w-lg space-y-2 p-3">
        {threads.length === 0 && (
          <p className="pt-16 text-center text-sm opacity-50">
            No conversations yet. Tap any handle or avatar in a room to start a
            private chat.
          </p>
        )}
        {threads.map((t) => {
          const peerUid = t.participants.find((p) => p !== user?.uid) ?? "";
          const peerHandle = t.handles?.[peerUid] ?? "Member";
          return (
            <Link
              key={t.id}
              href={`/messages/with/${peerUid}?handle=${encodeURIComponent(peerHandle)}`}
              className="app-chrome flex items-center gap-3 rounded-2xl bg-surface p-3.5 shadow-sm active:scale-[0.99]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                {peerHandle.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{peerHandle}</p>
                <p className="truncate text-xs opacity-50">
                  {t.lastSenderUid === user?.uid ? "You: " : ""}
                  {t.lastText ?? ""}
                </p>
              </div>
              <span className="text-[10px] opacity-40">
                {t.updatedAt?.toDate().toLocaleDateString() ?? ""}
              </span>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
