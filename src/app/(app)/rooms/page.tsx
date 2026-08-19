"use client";

// Private workspaces. Members only ever see rooms an Admin added them to
// (their own membership records) — never the global room directory.
// Admins & Staff Handles see all rooms.
import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { isAdmin } from "@/lib/types";
import AppShell from "@/components/AppShell";

interface RoomListing {
  id: string;
  name: string;
  topic?: string;
}

export default function RoomsPage() {
  const { user, profile } = useAuth();
  const [rooms, setRooms] = useState<RoomListing[]>([]);
  const elevated = isAdmin(profile?.role) || profile?.role === "staff";

  useEffect(() => {
    if (!user || !profile) return;
    if (elevated) {
      const q = query(collection(db(), "rooms"), orderBy("createdAt", "desc"));
      return onSnapshot(q, (snap) =>
        setRooms(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as RoomListing)),
      );
    }
    // Standard members: read only their own membership records.
    const q = collection(db(), "users", user.uid, "memberships");
    return onSnapshot(q, (snap) =>
      setRooms(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as RoomListing)),
    );
  }, [user, profile, elevated]);

  return (
    <AppShell title="🗂️ Project Rooms">
      <div className="mx-auto max-w-lg space-y-2 p-3">
        {rooms.length === 0 && (
          <p className="pt-16 text-center text-sm opacity-50">
            You haven’t been added to any project rooms yet.
            <br />
            Your Admin controls room access.
          </p>
        )}
        {rooms.map((room) => (
          <Link
            key={room.id}
            href={`/rooms/${room.id}`}
            className="app-chrome flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-sm active:scale-[0.99]"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-xl">
              🔐
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{room.name}</p>
              {room.topic && <p className="truncate text-xs opacity-50">{room.topic}</p>}
            </div>
            <span className="opacity-30">›</span>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
