"use client";

// Post announcements as yourself or as any Staff Handle, without leaving
// the console.
import { useEffect, useRef, useState } from "react";
import {
  collection,
  deleteField,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  addHandleReaction,
  clearHandleReactions,
  postBroadcastAs,
} from "@/lib/handleActions";
import { deleteBroadcastPost } from "@/lib/adminActions";
import {
  REACTION_EMOJIS,
  tallyReactions,
  type BroadcastPost,
  type UserProfile,
} from "@/lib/types";
import HandlePicker from "@/components/console/HandlePicker";
import MediaAttachment from "@/components/MediaAttachment";

export default function ConsoleBroadcast({
  handles,
  me,
  actorUid,
}: {
  handles: UserProfile[];
  me: UserProfile;
  actorUid: string;
}) {
  const [posts, setPosts] = useState<BroadcastPost[]>([]);
  const [asUid, setAsUid] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return onSnapshot(
      query(collection(db(), "broadcast"), orderBy("createdAt", "desc"), limit(30)),
      (snap) => setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BroadcastPost)),
      () => {},
    );
  }, []);

  const speaking = asUid ? handles.find((h) => h.uid === asUid) : me;

  const speakingAsHandle = Boolean(asUid);

  /**
   * React as whoever is selected in "Speaking as".
   *  - As a Staff Handle: every tap ADDS one more, so you can stack them up.
   *  - As yourself: one reaction only, like any member; tap again to clear.
   */
  async function reactAs(post: BroadcastPost, emoji: string) {
    if (!speaking) return;
    if (speakingAsHandle) {
      await addHandleReaction(post.id, speaking.uid, emoji).catch(() => {});
      return;
    }
    const current = post.reactions?.[speaking.uid];
    await updateDoc(doc(db(), "broadcast", post.id), {
      [`reactions.${speaking.uid}`]: current === emoji ? deleteField() : emoji,
    }).catch(() => {});
  }

  async function send() {
    if (!speaking || (!text.trim() && !file) || busy) return;
    setBusy(true);
    try {
      await postBroadcastAs(
        { uid: speaking.uid, handle: speaking.handle },
        text.trim(),
        file,
        actorUid,
      );
      setText("");
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="space-y-2 rounded-2xl bg-surface p-4 shadow-sm">
        <p className="text-sm font-bold">📣 Post to the Noticeboard</p>
        <HandlePicker
          handles={handles}
          value={asUid}
          onChange={setAsUid}
          selfLabel={me.handle}
        />
        <textarea
          rows={4}
          className="w-full rounded-xl border border-black/10 bg-background px-3 py-2.5 text-sm outline-none focus:border-brand dark:border-white/10"
          placeholder={`Announcement from ${speaking?.handle ?? ""}…`}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {file && (
          <p className="truncate rounded-xl bg-brand-soft px-3 py-1.5 text-xs font-medium">
            📎 {file.name}
          </p>
        )}
        <div className="flex gap-2">
          <input
            ref={fileInput}
            type="file"
            hidden
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="app-chrome rounded-xl bg-background px-4 py-2.5 text-sm font-bold active:scale-[0.98]"
          >
            📎
          </button>
          <button
            type="button"
            onClick={send}
            disabled={busy || (!text.trim() && !file)}
            className="app-chrome flex-1 rounded-xl bg-brand py-2.5 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? "Posting…" : `Post as ${speaking?.handle ?? ""}`}
          </button>
        </div>
      </div>

      {posts.map((p) => {
        const mine = speaking ? p.reactions?.[speaking.uid] : undefined;
        const myStack = speaking ? (p.handleReactions?.[speaking.uid] ?? {}) : {};
        const myStackTotal = Object.values(myStack).reduce((a, b) => a + b, 0);
        const tally = tallyReactions(p.reactions, p.handleReactions);
        return (
          <article key={p.id} className="rounded-2xl bg-surface p-4 shadow-sm">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xs font-bold text-brand">{p.authorHandle}</span>
              {p.pinned && <span className="text-[10px] font-bold text-brand">📌</span>}
              <span className="ml-auto text-[10px] opacity-40">
                {p.createdAt?.toDate().toLocaleString() ?? ""}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Delete this announcement for everyone?"))
                    deleteBroadcastPost(p.id);
                }}
                aria-label="Delete post"
                className="app-chrome text-sm text-red-500"
              >
                🗑️
              </button>
            </div>
            {p.text && <p className="whitespace-pre-wrap text-sm leading-relaxed">{p.text}</p>}
            {p.mediaUrl && (
              <MediaAttachment url={p.mediaUrl} type={p.mediaType} name={p.mediaName} />
            )}

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

            {/* React as the selected identity — handles can stack */}
            <div className="mt-2 border-t border-black/5 pt-2 dark:border-white/10">
              <div className="mb-1 flex items-center gap-2">
                <p className="text-[10px] font-semibold opacity-50">
                  React as {speaking?.handle ?? "…"}
                  {speakingAsHandle ? " · tap repeatedly to add more" : ""}
                </p>
                {speakingAsHandle && myStackTotal > 0 && (
                  <button
                    type="button"
                    onClick={() => clearHandleReactions(p.id, speaking!.uid)}
                    className="app-chrome ml-auto text-[10px] font-bold text-red-500"
                  >
                    Clear {myStackTotal}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {REACTION_EMOJIS.map((emoji) => {
                  const stacked = myStack[emoji] ?? 0;
                  const active = speakingAsHandle ? stacked > 0 : mine === emoji;
                  return (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => reactAs(p, emoji)}
                      aria-label={`React ${emoji}`}
                      className={`app-chrome relative flex h-9 w-9 items-center justify-center rounded-xl text-lg transition active:scale-125 ${
                        active ? "bg-brand-soft ring-1 ring-brand" : "active:bg-brand-soft"
                      }`}
                    >
                      {emoji}
                      {stacked > 0 && (
                        <span className="absolute -right-1 -top-1 min-w-[15px] rounded-full bg-brand px-1 text-[9px] font-bold leading-4 text-white">
                          {stacked}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
