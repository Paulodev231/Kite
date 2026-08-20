"use client";

// The "Admin" chip shown beside a handle. Reads the public admin roster
// (status/admins), which is the only way members can tell who is an
// administrator — they cannot read anyone else's profile.
import { useAuth } from "@/context/AuthContext";

export default function AdminTag({ uid }: { uid: string }) {
  const { adminUids } = useAuth();
  if (!uid || !adminUids.has(uid)) return null;
  return (
    <span className="rounded-full bg-brand px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
      Admin
    </span>
  );
}
