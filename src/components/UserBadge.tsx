"use client";

// One-touch DM: tapping any handle/avatar anywhere in the app opens a
// private 1-on-1 conversation with that user.
//
// Admins carry a visible "Admin" tag so everyone knows who speaks with
// authority. Members and Staff Handles carry none — a Staff Handle should
// read as an ordinary user.
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AdminTag from "@/components/AdminTag";

export default function UserBadge({
  uid,
  handle,
  subtle = false,
}: {
  uid: string;
  handle: string;
  subtle?: boolean;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const isSelf = user?.uid === uid;

  return (
    <button
      type="button"
      onClick={() => {
        if (!isSelf) router.push(`/messages/with/${uid}?handle=${encodeURIComponent(handle)}`);
      }}
      className={`app-chrome inline-flex items-center gap-1.5 ${
        isSelf ? "cursor-default" : "active:opacity-60"
      }`}
    >
      <span
        aria-hidden
        className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white"
      >
        {handle.slice(0, 1).toUpperCase()}
      </span>
      <span
        className={`text-xs font-semibold ${subtle ? "opacity-70" : "text-brand"}`}
      >
        {handle}
      </span>
      <AdminTag uid={uid} />
    </button>
  );
}
