"use client";

// Main Broadcast Channel: read-only system updates & announcements.
// Only Admins/SuperAdmins can post (text, photos, videos, files).
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
import { isAdmin, type BroadcastPost } from "@/lib/types";
import { uploadFile } from "@/lib/upload";
import AppShell from "@/components/AppShell";
import Composer from "@/components/Composer";
import MediaAttachment from "@/components/MediaAttachment";
import UserBadge from "@/components/UserBadge";

export default function BroadcastPage() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<BroadcastPost[]>([]);
  const admin = isAdmin(profile?.role);

  useEffect(() => {
    const q = query(collection(db(), "broadcast"), orderBy("createdAt", "desc"), limit(50));
    return onSnapshot(q, (snap) =>
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BroadcastPost)),
    );
  }, []);

  async function post(text: string, file: File | null) {
    if (!user || !profile) return;
    const media = file ? await uploadFile("broadcast", file) : null;
    await addDoc(collection(db(), "broadcast"), {
      authorUid: user.uid,
      authorHandle: profile.handle,
      text,
      ...(media ? { mediaUrl: media.url, mediaType: media.kind, mediaName: media.name } : {}),
      createdAt: serverTimestamp(),
    });
  }

  return (
    <AppShell title="📢 Main Broadcast">
      <div className="mx-auto flex min-h-full max-w-lg flex-col">
        <div className="flex-1 space-y-3 p-3">
          {posts.length === 0 && (
            <p className="pt-16 text-center text-sm opacity-50">
              Official announcements will appear here.
            </p>
          )}
          {posts.map((p) => (
            <article key={p.id} className="rounded-2xl bg-surface p-4 shadow-sm">
              <div className="mb-1.5 flex items-center justify-between">
                <UserBadge uid={p.authorUid} handle={p.authorHandle} />
                <span className="text-[10px] opacity-40">
                  {p.createdAt?.toDate().toLocaleString() ?? ""}
                </span>
              </div>
              {p.text && <p className="whitespace-pre-wrap text-sm leading-relaxed">{p.text}</p>}
              {p.mediaUrl && (
                <MediaAttachment url={p.mediaUrl} type={p.mediaType} name={p.mediaName} />
              )}
            </article>
          ))}
        </div>
        {admin ? (
          <Composer placeholder="Post an announcement…" allowMedia onSend={post} />
        ) : (
          <p className="app-chrome border-t border-black/5 bg-surface px-4 py-3 text-center text-[11px] font-medium opacity-50 dark:border-white/10">
            🔒 Read-only channel — only Admins can post here
          </p>
        )}
      </div>
    </AppShell>
  );
}
