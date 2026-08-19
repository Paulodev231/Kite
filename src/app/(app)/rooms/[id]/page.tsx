"use client";

// Inside a private room: real-time chat. Participant lists are never shown
// to standard members. Media attachments are Admin/Staff only.
import { useEffect, useRef, useState } from "react";
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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { isAdmin, type Room, type RoomMessage } from "@/lib/types";
import { uploadFile } from "@/lib/upload";
import AppShell from "@/components/AppShell";
import Composer from "@/components/Composer";
import MediaAttachment from "@/components/MediaAttachment";
import UserBadge from "@/components/UserBadge";

export default function RoomPage() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
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
    return () => {
      unsubRoom();
      unsubMsgs();
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
      ...(media ? { mediaUrl: media.url, mediaType: media.kind, mediaName: media.name } : {}),
      createdAt: serverTimestamp(),
    });
  }

  return (
    <AppShell title={room ? `🔐 ${room.name}` : "Room"}>
      <div className="mx-auto flex min-h-full max-w-lg flex-col">
        <div className="flex-1 space-y-2 p-3">
          {messages.map((m) => {
            const mine = m.authorUid === user?.uid;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                    mine ? "rounded-br-md bg-brand text-white" : "rounded-bl-md bg-surface"
                  }`}
                >
                  {!mine && (
                    <div className="mb-1">
                      <UserBadge uid={m.authorUid} handle={m.authorHandle} />
                    </div>
                  )}
                  {m.text && (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.text}</p>
                  )}
                  {m.mediaUrl && (
                    <MediaAttachment url={m.mediaUrl} type={m.mediaType} name={m.mediaName} />
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
          placeholder={`Message ${room?.name ?? "room"}…`}
          allowMedia={elevated}
          onSend={send}
        />
      </div>
    </AppShell>
  );
}
