"use client";

// Inside a private room: real-time chat. Participant lists are never shown
// to standard members. Media attachments are Admin/Staff only.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useT } from "@/context/LanguageContext";
import {
  isAdmin,
  type QuotedMessage,
  type Room,
  type RoomForm,
  type RoomMessage,
} from "@/lib/types";
import { uploadFile } from "@/lib/upload";
import { deleteRoomMessage, editRoomMessage } from "@/lib/adminActions";
import AppShell from "@/components/AppShell";
import Composer from "@/components/Composer";
import MediaAttachment from "@/components/MediaAttachment";
import UserBadge from "@/components/UserBadge";

export default function RoomPage() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const { t } = useT();
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [forms, setForms] = useState<RoomForm[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<QuotedMessage | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const elevated = isAdmin(profile?.role) || profile?.role === "staff";

  useEffect(() => {
    if (!id) return;
    const unsubRoom = onSnapshot(doc(db(), "rooms", id), (snap) =>
      setRoom(snap.exists() ? ({ id: snap.id, ...snap.data() } as Room) : null),
    );
    const q = query(
      collection(db(), "rooms", id, "messages"),
      orderBy("createdAt", "asc"),
      limit(200),
    );
    const unsubMsgs = onSnapshot(q, (snap) =>
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as RoomMessage)),
    );
    // Open forms pinned at the top of the room.
    const unsubForms = onSnapshot(
      query(collection(db(), "rooms", id, "forms"), where("open", "==", true)),
      (snap) => setForms(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as RoomForm)),
      () => {},
    );
    return () => {
      unsubRoom();
      unsubMsgs();
      unsubForms();
    };
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(text: string, file: File | null) {
    if (!user || !profile || !id) return;
    const media = file && elevated ? await uploadFile(`rooms/${id}`, file) : null;
    await addDoc(collection(db(), "rooms", id, "messages"), {
      authorUid: user.uid,
      authorHandle: profile.handle,
      text,
      ...(replyTo ? { replyTo } : {}),
      ...(media ? { mediaUrl: media.url, mediaType: media.kind, mediaName: media.name } : {}),
      createdAt: serverTimestamp(),
    });
    setReplyTo(null);
  }

  return (
    <AppShell title={room ? `🔐 ${room.name}` : t("room")}>
      <div className="mx-auto flex min-h-full max-w-lg flex-col">
        {forms.length > 0 && (
          <div className="app-chrome flex gap-2 overflow-x-auto p-3 pb-1 no-scrollbar">
            {forms.map((form) => (
              <Link
                key={form.id}
                href={`/rooms/${id}/forms/${form.id}`}
                className="flex shrink-0 items-center gap-2 rounded-2xl border border-brand/30 bg-brand-soft px-3.5 py-2.5 shadow-sm active:scale-[0.98]"
              >
                <span>📋</span>
                <span className="text-xs font-bold text-brand">{form.title}</span>
                <span className="text-[10px] font-semibold text-brand opacity-60">
                  {t("fillIn")}
                </span>
              </Link>
            ))}
          </div>
        )}
        <div className="flex-1 space-y-2 p-3">
          {messages.map((m) => {
            const mine = m.authorUid === user?.uid;
            const canModerate = isAdmin(profile?.role);
            const canDelete = canModerate || mine;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`group relative max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                    mine ? "rounded-br-md bg-brand text-white" : "rounded-bl-md bg-surface"
                  }`}
                >
                  {id && editingId !== m.id && (
                    <div
                      className={`absolute -top-2 flex gap-1 ${mine ? "-left-2" : "-right-2"}`}
                    >
                      <button
                        type="button"
                        aria-label={t("quote")}
                        onClick={() =>
                          setReplyTo({
                            id: m.id,
                            handle: m.authorHandle,
                            text: (m.text || t("attachment")).slice(0, 140),
                          })
                        }
                        className="app-chrome flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[10px] text-white shadow"
                      >
                        ↩︎
                      </button>
                      {canModerate && (
                        <button
                          type="button"
                          aria-label={t("editMessage")}
                          onClick={() => {
                            setDraft(m.text ?? "");
                            setEditingId(m.id);
                          }}
                          className="app-chrome flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[9px] text-white shadow"
                        >
                          ✏️
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          aria-label={t("deleteMessage")}
                          onClick={() => {
                            if (window.confirm(t("deleteMessageConfirm")))
                              deleteRoomMessage(id, m.id);
                          }}
                          className="app-chrome flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[10px] text-white shadow"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  )}
                  {!mine && (
                    <div className="mb-1">
                      <UserBadge uid={m.authorUid} handle={m.authorHandle} />
                    </div>
                  )}
                  {/* Quoted message this reply is answering */}
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
                  {editingId === m.id && id ? (
                    <div className="space-y-1.5">
                      <textarea
                        rows={3}
                        className="w-full rounded-xl border border-black/10 bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-brand dark:border-white/10"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                      />
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="app-chrome flex-1 rounded-lg bg-background py-1 text-[11px] font-bold text-foreground"
                        >
                          {t("cancel")}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await editRoomMessage(id, m.id, draft);
                            setEditingId(null);
                          }}
                          className="app-chrome flex-1 rounded-lg bg-brand py-1 text-[11px] font-bold text-white"
                        >
                          {t("save")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {m.text && (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.text}</p>
                      )}
                      {m.mediaUrl && (
                        <MediaAttachment url={m.mediaUrl} type={m.mediaType} name={m.mediaName} />
                      )}
                    </>
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
          placeholder={t("messagePlaceholder", { name: room?.name ?? t("room") })}
          allowMedia={elevated}
          onSend={send}
        />
      </div>
    </AppShell>
  );
}
