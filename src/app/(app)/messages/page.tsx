"use client";

// Direct Messages inbox: your private 1-on-1 threads.
import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import type { DmThread } from "@/lib/types";
import { getSeen, seenKeys } from "@/lib/seen";
import AppShell from "@/components/AppShell";
import AdminTag from "@/components/AdminTag";

export default function MessagesPage() {
  const { user } = useAuth();
  const identityUid = user?.uid ?? "";
  const [threads, setThreads] = useState<DmThread[]>([]);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!identityUid) return;
    // No orderBy here on purpose: combining a filter with a sort on another
    // field would demand a composite Firestore index, and without it the whole
    // listener fails silently and the inbox looks empty. Sorted below instead.
    const q = query(
      collection(db(), "dms"),
      where("participants", "array-contains", identityUid),
    );
    return onSnapshot(
      q,
      (snap) => {
        setThreads(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }) as DmThread)
            .sort((a, b) => (b.updatedAt?.toMillis() ?? 0) - (a.updatedAt?.toMillis() ?? 0)),
        );
        setLoadError(false);
      },
      () => setLoadError(true),
    );
  }, [identityUid]);

  return (
    <AppShell title="💬 Direct Messages">
      <div className="mx-auto max-w-lg space-y-2 p-3">
        {loadError && (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs font-medium text-red-500">
            Could not load your conversations. Check your connection, and make
            sure the latest firestore.rules have been published.
          </p>
        )}
        {!loadError && threads.length === 0 && (
          <p className="pt-16 text-center text-sm opacity-50">
            No conversations yet. Tap any handle or avatar in a room to start a
            private chat.
          </p>
        )}
        {threads.map((t) => {
          const peerUid = t.participants.find((p) => p !== identityUid) ?? "";
          const peerHandle = t.handles?.[peerUid] ?? "Member";
          const unread =
            Boolean(t.lastSenderUid) &&
            t.lastSenderUid !== identityUid &&
            (t.updatedAt?.toMillis() ?? 0) > getSeen(seenKeys.dmThread(t.id));
          return (
            <Link
              key={t.id}
              href={`/messages/with/${peerUid}?handle=${encodeURIComponent(peerHandle)}`}
              className="app-chrome flex items-center gap-3 rounded-2xl bg-surface p-3.5 shadow-sm active:scale-[0.99]"
            >
              <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                {peerHandle.slice(0, 1).toUpperCase()}
                {unread && (
                  <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-surface bg-red-500" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm font-bold">
                  {peerHandle}
                  <AdminTag uid={peerUid} />
                </p>
                <p className={`truncate text-xs ${unread ? "font-bold" : "opacity-50"}`}>
                  {t.lastSenderUid === identityUid ? "You: " : ""}
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
