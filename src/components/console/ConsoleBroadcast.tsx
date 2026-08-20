"use client";

// Post announcements as yourself or as any Staff Handle, without leaving
// the console.
import { useEffect, useRef, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { postBroadcastAs } from "@/lib/handleActions";
import { deleteBroadcastPost } from "@/lib/adminActions";
import type { BroadcastPost, UserProfile } from "@/lib/types";
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

      {posts.map((p) => (
        <article key={p.id} className="rounded-2xl bg-surface p-4 shadow-sm">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xs font-bold text-brand">{p.authorHandle}</span>
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
        </article>
      ))}
    </div>
  );
}
