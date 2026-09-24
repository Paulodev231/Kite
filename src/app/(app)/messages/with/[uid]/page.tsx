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
import { useT } from "@/context/LanguageContext";
import { isAdmin, type DmMessage, type DmThread, type QuotedMessage } from "@/lib/types";
import { uploadFile } from "@/lib/upload";
import { deleteDmMessage } from "@/lib/adminActions";
import { logEvent } from "@/lib/log";
import { markSeen, seenKeys } from "@/lib/seen";
import AppShell from "@/components/AppShell";
import Composer from "@/components/Composer";
import MediaAttachment from "@/components/MediaAttachment";
import AdminTag from "@/components/AdminTag";

function DmScreen() {
  const { uid: peerUid } = useParams<{ uid: string }>();
  const searchParams = useSearchParams();
  const { user, profile } = useAuth();
  const { t } = useT();
  const [thread, setThread] = useState<DmThread | null>(null);
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [replyTo, setReplyTo] = useState<QuotedMessage | null>(null);
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
      ...(replyTo ? { replyTo } : {}),
      ...(attached ? { fileUrl: attached.url, fileName: attached.name } : {}),
      createdAt: serverTimestamp(),
    });
    setReplyTo(null);
  }

  return (
    <AppShell title={`💬 ${peerHandle}`}>
      <div className="mx-auto flex min-h-full max-w-lg flex-col">
        <div className="flex-1 space-y-2 p-3">
          <p className="flex items-center justify-center gap-1.5 py-2 text-center text-[10px] opacity-60">
            🔒 {t("privateConversation")} {peerHandle}
            <AdminTag uid={peerUid} />
          </p>
          {messages.map((m) => {
            const mine = m.senderUid === user?.uid;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`group relative max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                    mine ? "rounded-br-md bg-brand text-white" : "rounded-bl-md bg-surface"
                  }`}
                >
                  <div className={`absolute -top-2 flex gap-1 ${mine ? "-left-2" : "-right-2"}`}>
                    <button
                      type="button"
                      aria-label={t("quote")}
                      onClick={() =>
                        setReplyTo({
                          id: m.id,
                          handle: mine ? profile?.handle ?? "" : peerHandle,
                          text: (m.text || t("attachment")).slice(0, 140),
                        })
                      }
                      className="app-chrome flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[10px] text-white shadow"
                    >
                      ↩︎
                    </button>
                    {mine && (
                      <button
                        type="button"
                        aria-label={t("deleteMessage")}
                        onClick={() => {
                          if (window.confirm(t("deleteMessageConfirm")) && threadId)
                            deleteDmMessage(threadId, m.id);
                        }}
                        className="app-chrome flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[10px] text-white shadow"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {m.replyTo && (
                    <div
                      className={`mb-1.5 border-l-2 pl-2 ${
                        mine ? "border-white/50" : "border-brand/40"
                      }`}
                    >
                      <p
                        className={`text-[10px] font-bold ${
                          mine ? "text-white/80" : "text-brand"
                        }`}
                      >
                        {m.replyTo.handle}
                      </p>
                      <p className={`text-[10px] ${mine ? "text-white/70" : "opacity-60"}`}>
                        {m.replyTo.text}
                      </p>
                    </div>
                  )}
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
        {replyTo && (
          <div className="app-chrome mx-3 mb-1 flex items-start gap-2 rounded-xl bg-brand-soft p-2">
            <div className="min-w-0 flex-1 border-l-2 border-brand pl-2">
              <p className="text-[10px] font-bold text-brand">
                {t("cnReplyingTo", { handle: replyTo.handle })}
              </p>
              <p className="truncate text-[10px] opacity-70">{replyTo.text}</p>
            </div>
            <button
              type="button"
              aria-label={t("cancel")}
              onClick={() => setReplyTo(null)}
              className="text-xs font-bold text-red-500"
            >
              ✕
            </button>
          </div>
        )}
        <Composer
          placeholder={t("messagePlaceholder", { name: peerHandle })}
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
