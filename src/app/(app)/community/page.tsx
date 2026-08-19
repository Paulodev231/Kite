"use client";

// General Community Room: EMOJI REACTIONS ONLY. No text, photos or videos.
// Reactions display anonymously to protect member privacy.
import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { COMMUNITY_EMOJIS, type CommunityReaction } from "@/lib/types";
import AppShell from "@/components/AppShell";

export default function CommunityPage() {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<CommunityReaction[]>([]);
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db(), "community"), orderBy("createdAt", "desc"), limit(120));
    return onSnapshot(q, (snap) =>
      setReactions(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CommunityReaction)),
    );
  }, []);

  async function react(emoji: string) {
    if (!user || sending) return;
    setSending(emoji);
    try {
      await addDoc(collection(db(), "community"), {
        uid: user.uid,
        emoji,
        createdAt: serverTimestamp(),
      });
    } finally {
      setSending(null);
    }
  }

  // Tally for the header strip
  const tally = new Map<string, number>();
  for (const r of reactions) tally.set(r.emoji, (tally.get(r.emoji) ?? 0) + 1);

  return (
    <AppShell title="🫶 Community Room">
      <div className="mx-auto flex min-h-full max-w-lg flex-col">
        <p className="app-chrome px-4 pt-3 text-center text-[11px] font-medium opacity-50">
          Emoji reactions only · identities stay private
        </p>

        {/* Live tally */}
        <div className="app-chrome flex flex-wrap justify-center gap-2 p-3">
          {[...tally.entries()].map(([emoji, count]) => (
            <span
              key={emoji}
              className="rounded-full bg-surface px-3 py-1.5 text-sm font-semibold shadow-sm"
            >
              {emoji} {count}
            </span>
          ))}
        </div>

        {/* Reaction stream */}
        <div className="flex flex-1 flex-wrap content-start justify-center gap-1.5 p-4">
          {reactions.length === 0 && (
            <p className="pt-12 text-center text-sm opacity-50">
              Be the first to send some encouragement 👇
            </p>
          )}
          {reactions.map((r) => (
            <span key={r.id} className="animate-[screen-in_.3s_ease-out] text-2xl">
              {r.emoji}
            </span>
          ))}
        </div>

        {/* Emoji bar (the ONLY way to post here) */}
        <div className="app-chrome safe-bottom border-t border-black/5 bg-surface p-2 dark:border-white/10">
          <div className="flex justify-around">
            {COMMUNITY_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => react(emoji)}
                disabled={sending !== null}
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl transition active:scale-125 active:bg-brand-soft disabled:opacity-40"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
