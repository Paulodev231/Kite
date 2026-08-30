"use client";

// Every DM sent to any Staff Handle, in one list, with the conversation and
// its reply box opening inline. The SuperAdmin replies as the handle the
// member wrote to, without leaving this screen.
import { useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { markThreadTriaged, sendDmAs } from "@/lib/handleActions";
import type { DmMessage, DmThread, UserProfile } from "@/lib/types";
import { useT } from "@/context/LanguageContext";

function isUnread(t: DmThread, staffUid: string): boolean {
  if (!t.lastSenderUid || t.lastSenderUid === staffUid) return false;
  if (!t.staffReadAt) return true;
  return (t.updatedAt?.toMillis() ?? 0) > t.staffReadAt.toMillis();
}

export default function ConsoleDms({
  handles,
  members,
  actorUid,
}: {
  handles: UserProfile[];
  members: UserProfile[];
  actorUid: string;
}) {
  const { t } = useT();
  const [threads, setThreads] = useState<DmThread[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Starting a brand-new conversation as a handle
  const [newAs, setNewAs] = useState("");
  const [newTo, setNewTo] = useState("");

  useEffect(() => {
    return onSnapshot(
      query(collection(db(), "dms"), orderBy("updatedAt", "desc"), limit(200)),
      (snap) => setThreads(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DmThread)),
      () => {},
    );
  }, []);

  useEffect(() => {
    if (!openId) return;
    return onSnapshot(
      query(collection(db(), "dms", openId, "messages"), orderBy("createdAt", "asc"), limit(200)),
      (snap) => setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DmMessage)),
      () => {},
    );
  }, [openId]);

  useEffect(() => {
    if (openId) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, openId]);

  const staffUids = useMemo(() => new Set(handles.map((h) => h.uid)), [handles]);

  // Only threads that involve one of the managed handles.
  const staffThreads = useMemo(
    () =>
      threads
        .map((t) => {
          const staffUid = t.participants?.find((p) => staffUids.has(p));
          return staffUid ? { t, staffUid } : null;
        })
        .filter((x): x is { t: DmThread; staffUid: string } => x !== null),
    [threads, staffUids],
  );

  async function reply(staffUid: string, peerUid: string, peerHandle: string) {
    const text = draft.trim();
    if (!text || busy) return;
    const as = handles.find((h) => h.uid === staffUid);
    if (!as) return;
    setBusy(true);
    try {
      await sendDmAs(
        { uid: as.uid, handle: as.handle },
        { uid: peerUid, handle: peerHandle },
        text,
        actorUid,
      );
      setDraft("");
    } finally {
      setBusy(false);
    }
  }

  async function startNew() {
    const as = handles.find((h) => h.uid === newAs);
    const to = members.find((m) => m.uid === newTo);
    const text = draft.trim();
    if (!as || !to || !text || busy) return;
    setBusy(true);
    try {
      const threadId = await sendDmAs(
        { uid: as.uid, handle: as.handle },
        { uid: to.uid, handle: to.handle },
        text,
        actorUid,
      );
      setDraft("");
      setNewTo("");
      setOpenId(threadId);
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-black/10 bg-background px-3 py-2.5 text-sm outline-none focus:border-brand dark:border-white/10";

  return (
    <div className="space-y-2">
      {/* Start a new conversation as a handle */}
      <details className="rounded-2xl bg-surface p-4 shadow-sm">
        <summary className="app-chrome cursor-pointer text-sm font-bold">
          {t("cnStartConversation")}
        </summary>
        <div className="mt-2 space-y-2">
          <select className={inputCls} value={newAs} onChange={(e) => setNewAs(e.target.value)}>
            <option value="">{t("cnSendAsWhich")}</option>
            {handles.map((h) => (
              <option key={h.uid} value={h.uid}>
                🎧 {h.handle}
              </option>
            ))}
          </select>
          <select className={inputCls} value={newTo} onChange={(e) => setNewTo(e.target.value)}>
            <option value="">{t("cnToWhichMember")}</option>
            {members.map((m) => (
              <option key={m.uid} value={m.uid}>
                {m.handle}
              </option>
            ))}
          </select>
          <textarea
            className={inputCls}
            rows={3}
            placeholder={t("cnMessagePlaceholder")}
            value={openId ? "" : draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button
            type="button"
            onClick={startNew}
            disabled={busy || !newAs || !newTo || !draft.trim()}
            className="app-chrome w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? t("altSending") : t("send")}
          </button>
        </div>
      </details>

      {staffThreads.length === 0 && (
        <p className="pt-10 text-center text-sm opacity-50">
          {t("cnNoStaffThreads")}
        </p>
      )}

      {staffThreads.map(({ t: thread, staffUid }) => {
        const peerUid = thread.participants.find((p) => p !== staffUid) ?? "";
        const peerHandle = thread.handles?.[peerUid] ?? t("member");
        const staffHandle = thread.handles?.[staffUid] ?? t("handle");
        const unread = isUnread(thread, staffUid);
        const open = openId === thread.id;

        return (
          <div key={thread.id} className="rounded-2xl bg-surface shadow-sm">
            <button
              type="button"
              onClick={() => {
                const next = open ? null : thread.id;
                setOpenId(next);
                setDraft("");
                if (next) markThreadTriaged(thread.id);
              }}
              className="app-chrome flex w-full items-center gap-3 p-3.5 text-left active:opacity-80"
            >
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                {peerHandle.slice(0, 1).toUpperCase()}
                {unread && (
                  <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-surface bg-red-500" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">
                  {peerHandle}
                  <span className="font-normal opacity-40"> → 🎧 {staffHandle}</span>
                </span>
                <span
                  className={`block truncate text-xs ${unread ? "font-bold" : "opacity-50"}`}
                >
                  {thread.lastSenderUid === staffUid ? `${staffHandle}: ` : ""}
                  {thread.lastText ?? ""}
                </span>
              </span>
              <span className="shrink-0 text-[10px] opacity-40">{open ? "▲" : "▼"}</span>
            </button>

            {open && (
              <div className="border-t border-black/5 p-3 dark:border-white/10">
                <div className="max-h-72 space-y-2 overflow-y-auto no-scrollbar">
                  {messages.map((m) => {
                    const fromStaff = m.senderUid === staffUid;
                    return (
                      <div
                        key={m.id}
                        className={`flex ${fromStaff ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                            fromStaff
                              ? "rounded-br-md bg-brand text-white"
                              : "rounded-bl-md bg-background"
                          }`}
                        >
                          <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                          <p
                            className={`mt-0.5 text-right text-[9px] ${
                              fromStaff ? "text-white/60" : "opacity-40"
                            }`}
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

                <div className="mt-2 flex items-end gap-2">
                  <textarea
                    rows={1}
                    className="max-h-24 flex-1 resize-none rounded-2xl border border-black/10 bg-background px-3 py-2 text-sm outline-none focus:border-brand dark:border-white/10"
                    placeholder={t("cnReplyAs", { handle: staffHandle })}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => reply(staffUid, peerUid, peerHandle)}
                    disabled={busy || !draft.trim()}
                    aria-label={t("cnSendReply")}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow active:scale-95 disabled:opacity-40"
                  >
                    {busy ? "…" : "➤"}
                  </button>
                </div>
                <p className="mt-1 text-center text-[10px] opacity-40">
                  {peerHandle} sees this coming from {staffHandle}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
