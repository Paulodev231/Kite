"use client";

// One-touch DM: tapping any handle/avatar anywhere in the app opens a
// private 1-on-1 conversation with that user.
import { useRouter } from "next/navigation";
import { useActing } from "@/context/ActingContext";

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
  const { identityUid } = useActing();
  const isSelf = identityUid === uid;

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
    </button>
  );
}
