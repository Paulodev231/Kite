"use client";

// SuperAdmin triage view of one Staff Handle conversation.
// Replies are sent AS the managed handle — the member simply sees the
// handle responding. Opening the thread marks it read in the master inbox.
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import type { DmMessage, DmThread } from "@/lib/types";
import AppShell from "@/components/AppShell";
import Composer from "@/components/Composer";
import MediaAttachment from "@/components/MediaAttachment";
import SplashScreen from "@/components/SplashScreen";

export default function InboxThreadPage() {
  const { threadId } = useParams<{ threadId: string }>();
  const { user, profile, loading } = useAuth();
  const [thread, setThread] = useState<DmThread | null>(null);
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [staffUid, setStaffUid] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const superadmin = profile?.role === "superadmin";

  useEffect(() => {
    if (!threadId || !superadmin) return;
    const unsubThread = onSnapshot(doc(db(), "dms", threadId), (snap) =>
      setThread(snap.exists() ? ({ id: snap.id, ...snap.data() } as DmThread) : null),
    );
    const q = query(
      collection(db(), "dms", threadId, "messages"),
      orderBy("createdAt", "asc"),
      limit(200),
    );
    const unsubMsgs = onSnapshot(q, (snap) =>
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DmMessage)),
    );
    return () => {
      unsubThread();
      unsubMsgs();
    };
  }, [threadId, superadmin]);

  // Work out which participant is the managed Staff Handle.
  useEffect(() => {
    if (!thread || !superadmin) return;
    let cancelled = false;
    (async () => {
      const snap = await getDocs(query(collection(db(), "users"), where("role", "==", "staff")));
      const staffUids = new Set(snap.docs.map((d) => d.id));
      const found = thread.participants.find((p) => staffUids.has(p)) ?? null;
      if (!cancelled) setStaffUid(found);
    })();
    return () => {
      cancelled = true;
    };
  }, [thread, superadmin]);

  // Mark the thread read for the master inbox badge. Guarded so it writes
  // only when genuinely unread (otherwise the write itself would re-trigger
  // the snapshot and loop forever).
  useEffect(() => {
    if (!threadId || !superadmin || !thread) return;
    const alreadyRead =
      thread.staffReadAt &&
      (!thread.updatedAt || thread.staffReadAt.toMillis() >= thread.updatedAt.toMillis());
    if (alreadyRead) return;
    updateDoc(doc(db(), "dms", threadId), { staffReadAt: serverTimestamp() }).catch(() => {});
  }, [threadId, superadmin, thread]);

  if (loading || !superadmin) return <SplashScreen />;

  const memberUid = thread?.participants.find((p) => p !== staffUid) ?? "";
  const memberHandle = thread?.handles?.[memberUid] ?? "Member";
  const staffHandle = staffUid ? (thread?.handles?.[staffUid] ?? "Staff") : "Staff";

  async function reply(text: string) {
    if (!user || !threadId || !staffUid || !thread) return;
    await addDoc(collection(db(), "dms", threadId, "messages"), {
      senderUid: staffUid, // sent AS the managed handle
      text,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db(), "dms", threadId), {
      lastText: text,
      lastSenderUid: staffUid,
      updatedAt: serverTimestamp(),
      staffReadAt: serverTimestamp(),
    });
  }

  return (
    <AppShell title={`📥 ${memberHandle} → 🎧 ${staffHandle}`}>
      <div className="mx-auto flex min-h-full max-w-lg flex-col">
        <div className="flex-1 space-y-2 p-3">
          <p className="py-2 text-center text-[10px] opacity-40">
            Triage mode — your replies appear as {staffHandle}
          </p>
          {messages.map((m) => {
            const fromStaff = m.senderUid === staffUid;
            return (
              <div key={m.id} className={`flex ${fromStaff ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                    fromStaff ? "rounded-br-md bg-brand text-white" : "rounded-bl-md bg-surface"
                  }`}
                >
                  {m.text && (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.text}</p>
                  )}
                  {m.fileUrl && <MediaAttachment url={m.fileUrl} type="file" name={m.fileName} />}
                  <p
                    className={`mt-1 text-right text-[9px] ${fromStaff ? "text-white/60" : "opacity-40"}`}
                  >
                    {m.createdAt?.toDate().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }) ?? "…"}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        {staffUid ? (
          <Composer placeholder={`Reply as ${staffHandle}…`} onSend={(text) => reply(text)} />
        ) : (
          <p className="app-chrome border-t border-black/5 bg-surface px-4 py-3 text-center text-[11px] opacity-50 dark:border-white/10">
            Identifying the staff handle…
          </p>
        )}
      </div>
    </AppShell>
  );
}
