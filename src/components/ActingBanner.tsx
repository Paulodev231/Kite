"use client";

// Persistent reminder of which Staff Handle the SuperAdmin is currently
// operating, with one tap to return to themselves. Without this it is far too
// easy to post as the wrong identity.
import { useActing } from "@/context/ActingContext";

export default function ActingBanner() {
  const { acting, switchTo } = useActing();
  if (!acting) return null;

  return (
    <div className="app-chrome flex items-center gap-2 bg-amber-500 px-3 py-1.5 text-black">
      <span className="text-[11px] font-bold">
        🎭 Acting as {acting.handle} — posts &amp; DMs go out as this handle
      </span>
      <button
        type="button"
        onClick={() => switchTo(null)}
        className="ml-auto shrink-0 rounded-full bg-black/15 px-2.5 py-1 text-[10px] font-bold active:scale-95"
      >
        Switch back
      </button>
    </div>
  );
}
