"use client";

// Read any room and reply in it as yourself or as a Staff Handle. Tap a
// message to quote it — the reply carries the quoted text with it.
import { useEffect, useRef, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { postRoomMessageAs } from "@/lib/handleActions";
import { deleteRoomMessage } from "@/lib/adminActions";
import type { QuotedMessage, Room, RoomMessage, UserProfile } from "@/lib/types";
import HandlePicker from "@/components/console/HandlePicker";
import MediaAttachment from "@/components/MediaAttachment";
import { useT } from "@/context/LanguageContext";

export default function ConsoleRooms({
  handles,
  me,
  actorUid,
}: {
  handles: UserProfile[];
  me: UserProfile;
  actorUid: string;
}) {
  const { t } = useT();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomId, setRoomId] = useState("");
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [asUid, setAsUid] = useState("");
  const [text, setText] = useState("");
  const [quoted, setQuoted] = useState<QuotedMessage | null>(null);
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return onSnapshot(
      query(collection(db(), "rooms"), orderBy("createdAt", "desc")),
      (snap) => setRooms(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Room)),
      () => {},
    );
  }, []);

  useEffect(() => {
    if (!roomId) return;
    return onSnapshot(
      query(
        collection(db(), "rooms", roomId, "messages"),
        orderBy("createdAt", "asc"),
        limit(200),
      ),
      (snap) => setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as RoomMessage)),
      () => {},
    );
  }, [roomId]);

  useEffect(() => {
    if (roomId) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, roomId]);

  const speaking = asUid ? handles.find((h) => h.uid === asUid) : me;

  async function send() {
    if (!speaking || !roomId || !text.trim() || busy) return;
    setBusy(true);
    try {
      await postRoomMessageAs(
        { uid: speaking.uid, handle: speaking.handle },
        roomId,
        text.trim(),
        null,
        quoted,
        actorUid,
      );
      setText("");
      setQuoted(null);
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-black/10 bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand dark:border-white/10";

  return (
    <div className="space-y-2">
      <select className={inputCls} value={roomId} onChange={(e) => setRoomId(e.target.value)}>
        <option value="">{t("fmChooseRoom")}</option>
        {rooms.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>

      {!roomId && (
        <p className="pt-10 text-center text-sm opacity-50">
          {t("cnPickRoom")}
        </p>
      )}

      {roomId && (
        <>
          <div className="max-h-[45vh] space-y-2 overflow-y-auto rounded-2xl bg-surface p-3 no-scrollbar">
            {messages.length === 0 && (
              <p className="py-6 text-center text-xs opacity-50">{t("cnNoMessagesYet")}</p>
            )}
            {messages.map((m) => (
              <div key={m.id} className="rounded-xl bg-background p-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-brand">{m.authorHandle}</span>
                  <span className="ml-auto text-[9px] opacity-40">
                    {m.createdAt?.toDate().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }) ?? ""}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuoted({
                        id: m.id,
                        handle: m.authorHandle,
                        text: (m.text || "attachment").slice(0, 140),
                      })
                    }
                    className="app-chrome text-[10px] font-bold text-brand"
                  >
                    {t("quote")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(t("deleteMessageConfirm")))
                        deleteRoomMessage(roomId, m.id);
                    }}
                    aria-label={t("deleteMessage")}
                    className="app-chrome text-[11px] text-red-500"
                  >
                    🗑️
                  </button>
                </div>
                {m.replyTo && (
                  <div className="my-1 border-l-2 border-brand/40 pl-2">
                    <p className="text-[10px] font-bold text-brand">{m.replyTo.handle}</p>
                    <p className="text-[10px] opacity-60">{m.replyTo.text}</p>
                  </div>
                )}
                {m.text && (
                  <p className="whitespace-pre-wrap text-xs leading-relaxed">{m.text}</p>
                )}
                {m.mediaUrl && (
                  <MediaAttachment url={m.mediaUrl} type={m.mediaType} name={m.mediaName} />
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="space-y-2 rounded-2xl bg-surface p-4 shadow-sm">
            <HandlePicker
              handles={handles}
              value={asUid}
              onChange={setAsUid}
              selfLabel={me.handle}
            />
            {quoted && (
              <div className="flex items-start gap-2 rounded-xl bg-brand-soft p-2">
                <div className="min-w-0 flex-1 border-l-2 border-brand pl-2">
                  <p className="text-[10px] font-bold text-brand">
                    {t("cnReplyingTo", { handle: quoted.handle })}
                  </p>
                  <p className="truncate text-[10px] opacity-70">{quoted.text}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setQuoted(null)}
                  className="app-chrome text-xs font-bold text-red-500"
                >
                  ✕
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <textarea
                rows={2}
                className="max-h-28 flex-1 resize-none rounded-2xl border border-black/10 bg-background px-3 py-2 text-sm outline-none focus:border-brand dark:border-white/10"
                placeholder={t("cnMessageAs", { handle: speaking?.handle ?? "" })}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <button
                type="button"
                onClick={send}
                disabled={busy || !text.trim()}
                aria-label={t("send")}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow active:scale-95 disabled:opacity-40"
              >
                {busy ? "…" : "➤"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
