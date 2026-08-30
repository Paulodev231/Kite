"use client";

// 📣 Noticeboard — the single public channel. Admins (and Staff Handles, via
// the Handle Console) post here; everyone else responds with ONE emoji per
// post. There is no text replying by design: this is a broadcast channel with
// acknowledgement, not a chat room.
import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteField,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useT } from "@/context/LanguageContext";
import {
  isAdmin,
  REACTION_EMOJIS,
  tallyReactions,
  type BroadcastPost,
} from "@/lib/types";
import { uploadFile } from "@/lib/upload";
import { logEvent } from "@/lib/log";
import { deleteBroadcastPost, setPostPinned, editPostText } from "@/lib/adminActions";
import { markSeen, seenKeys } from "@/lib/seen";
import AppShell from "@/components/AppShell";
import Composer from "@/components/Composer";
import MediaAttachment from "@/components/MediaAttachment";
import UserBadge from "@/components/UserBadge";

export default function NoticeboardPage() {
  const { user, profile } = useAuth();
  const { t } = useT();
  const [posts, setPosts] = useState<BroadcastPost[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const admin = isAdmin(profile?.role);

  useEffect(() => {
    const q = query(collection(db(), "broadcast"), orderBy("createdAt", "desc"), limit(60));
    return onSnapshot(q, (snap) =>
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BroadcastPost)),
    );
  }, []);

  useEffect(() => {
    if (posts.length > 0) markSeen(seenKeys.broadcast);
  }, [posts]);

  async function post(text: string, file: File | null) {
    if (!user || !profile) return;
    const media = file ? await uploadFile("broadcast", file) : null;
    await addDoc(collection(db(), "broadcast"), {
      authorUid: user.uid,
      authorHandle: profile.handle,
      text,
      reactions: {},
      pinned: false,
      ...(media ? { mediaUrl: media.url, mediaType: media.kind, mediaName: media.name } : {}),
      createdAt: serverTimestamp(),
    });
    logEvent(user.uid, "broadcast_post", media ? { media: media.kind } : {});
  }

  /** One reaction per person per post: tapping the same emoji clears it. */
  async function react(post: BroadcastPost, emoji: string) {
    if (!user) return;
    const mine = post.reactions?.[user.uid];
    await updateDoc(doc(db(), "broadcast", post.id), {
      [`reactions.${user.uid}`]: mine === emoji ? deleteField() : emoji,
    }).catch(() => {});
  }

  // Pinned posts first, then newest.
  const ordered = [...posts].sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
    return (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0);
  });

  return (
    <AppShell title={`📣 ${t("noticeboard")}`}>
      <div className="mx-auto flex min-h-full max-w-lg flex-col">
        <div className="flex-1 space-y-3 p-3">
          {ordered.length === 0 && (
            <p className="pt-16 text-center text-sm opacity-50">
              {t("noticeboardEmpty")}
            </p>
          )}

          {ordered.map((p) => {
            const mine = user ? p.reactions?.[user.uid] : undefined;
            const tally = tallyReactions(p.reactions, p.handleReactions);
            return (
              <article
                key={p.id}
                className={`rounded-2xl bg-surface p-4 shadow-sm ${
                  p.pinned ? "ring-1 ring-brand" : ""
                }`}
              >
                {p.pinned && (
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-brand">
                    📌 {t("pinned")}
                  </p>
                )}

                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <UserBadge uid={p.authorUid} handle={p.authorHandle} />
                  <span className="text-[10px] opacity-40">
                    {p.createdAt?.toDate().toLocaleString() ?? ""}
                    {p.editedAt ? ` · ${t("edited")}` : ""}
                  </span>
                </div>

                {editingId === p.id ? (
                  <div className="space-y-2">
                    <textarea
                      rows={5}
                      className="w-full rounded-xl border border-black/10 bg-background px-3 py-2.5 text-sm outline-none focus:border-brand dark:border-white/10"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="app-chrome flex-1 rounded-xl bg-background py-2 text-xs font-bold"
                      >
                        {t("cancel")}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await editPostText(p.id, draft);
                          setEditingId(null);
                        }}
                        className="app-chrome flex-1 rounded-xl bg-brand py-2 text-xs font-bold text-white"
                      >
                        {t("saveChanges")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {p.text && (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{p.text}</p>
                    )}
                    {p.mediaUrl && (
                      <MediaAttachment url={p.mediaUrl} type={p.mediaType} name={p.mediaName} />
                    )}
                  </>
                )}

                {/* Reaction tally */}
                {tally.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {tally.map((t) => (
                      <span
                        key={t.emoji}
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          mine === t.emoji ? "bg-brand text-white" : "bg-background"
                        }`}
                      >
                        {t.emoji} {t.count}
                      </span>
                    ))}
                  </div>
                )}

                {/* Reaction bar — the only way anyone but an admin replies */}
                <div className="mt-2 flex flex-wrap gap-1 border-t border-black/5 pt-2 dark:border-white/10">
                  {REACTION_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => react(p, emoji)}
                      aria-label={t("cnReactAria", { emoji })}
                      className={`app-chrome flex h-9 w-9 items-center justify-center rounded-xl text-lg transition active:scale-125 ${
                        mine === emoji ? "bg-brand-soft ring-1 ring-brand" : "active:bg-brand-soft"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {/* Admin controls */}
                {admin && editingId !== p.id && (
                  <div className="mt-2 flex gap-1.5 border-t border-black/5 pt-2 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        setDraft(p.text ?? "");
                        setEditingId(p.id);
                      }}
                      className="app-chrome flex-1 rounded-lg bg-background py-1.5 text-[11px] font-bold"
                    >
                      {t("edit")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPostPinned(p.id, !p.pinned)}
                      className={`app-chrome flex-1 rounded-lg py-1.5 text-[11px] font-bold ${
                        p.pinned ? "bg-brand text-white" : "bg-background"
                      }`}
                    >
                      {p.pinned ? t("unpin") : t("pin")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(t("cnDeletePostConfirm")))
                          deleteBroadcastPost(p.id);
                      }}
                      className="app-chrome rounded-lg bg-red-500/10 px-3 py-1.5 text-[11px] font-bold text-red-500"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {admin ? (
          <Composer placeholder={t("postAnnouncement")} allowMedia onSend={post} />
        ) : (
          <p className="app-chrome border-t border-black/5 bg-surface px-4 py-3 text-center text-[11px] font-medium opacity-50 dark:border-white/10">
            {t("readOnlyNotice")}
          </p>
        )}
      </div>
    </AppShell>
  );
}
