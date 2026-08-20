"use client";

// A private 1-on-1 conversation. Text + document attachments for everyone;
// photo/video attachments remain Admin/Staff only (enforced by rules too).
import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db, dmThreadId } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { isAdmin, type DmMessage, type DmThread } from "@/lib/types";
import { uploadFile } from "@/lib/upload";
import { logEvent } from "@/lib/log";
import { markSeen, seenKeys } from "@/lib/seen";
import AppShell from "@/components/AppShell";
import Composer from "@/components/Composer";
import MediaAttachment from "@/components/MediaAttachment";

function DmScreen() {
  const { uid: peerUid } = useParams<{ uid: string }>();
  const searchParams = useSearchParams();
  const { user, profile } = useAuth();
  const [thread, setThread] = useState<DmThread | null>(null);
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const threadId = user && peerUid ? dmThreadId(user.uid, peerUid) : null;
  const peerHandle =
    thread?.handles?.[peerUid] ?? searchParams.get("handle") ?? "Member";
  const elevated = isAdmin(profile?.role) || profile?.role === "staff";

  useEffect(() => {
    if (!threadId) return;
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
  }, [threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Reading the conversation clears its unread badge.
  useEffect(() => {
    if (threadId && messages.length > 0) markSeen(seenKeys.dmThread(threadId));
  }, [threadId, messages]);

  async function send(text: string, file: File | null) {
    if (!user || !profile || !threadId || !peerUid) return;
    const attached = file ? await uploadFile(`dms/${threadId}`, file) : null;
    // Compliance metadata: log when a brand-new conversation starts.
    if (!thread) logEvent(user.uid, "dm_thread_started", { threadId });
    // Create/update the thread summary first so security rules and the inbox
    // list both have a thread document to work with.
    await setDoc(
      doc(db(), "dms", threadId),
      {
        participants: [user.uid, peerUid].sort(),
        handles: { [user.uid]: profile.handle, [peerUid]: peerHandle },
        lastText: text || `📎 ${attached?.name ?? "Attachment"}`,
        lastSenderUid: user.uid,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    await addDoc(collection(db(), "dms", threadId, "messages"), {
      senderUid: user.uid,
      text,
      ...(attached ? { fileUrl: attached.url, fileName: attached.name } : {}),
      createdAt: serverTimestamp(),
    });
  }

  return (
    <AppShell title={`💬 ${peerHandle}`}>
      <div className="mx-auto flex min-h-full max-w-lg flex-col">
        <div className="flex-1 space-y-2 p-3">
          <p className="py-2 text-center text-[10px] opacity-40">
            🔒 Private conversation
          </p>
          {messages.map((m) => {
            const mine = m.senderUid === user?.uid;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                    mine ? "rounded-br-md bg-brand text-white" : "rounded-bl-md bg-surface"
                  }`}
                >
                  {m.text && (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.text}</p>
                  )}
                  {m.fileUrl && (
                    <MediaAttachment url={m.fileUrl} type="file" name={m.fileName} />
                  )}
                  <p className={`mt-1 text-right text-[9px] ${mine ? "text-white/60" : "opacity-40"}`}>
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
        <Composer
          placeholder={`Message ${peerHandle}…`}
          allowMedia={elevated}
          allowDocs
          onSend={send}
        />
      </div>
    </AppShell>
  );
}

export default function DmPage() {
  return (
    <Suspense>
      <DmScreen />
    </Suspense>
  );
}
