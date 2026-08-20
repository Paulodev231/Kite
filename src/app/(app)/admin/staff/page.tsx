"use client";

// SuperAdmin only: Managed Staff Handles.
//
// A handle has NO email, NO password and never signs in. You create it with a
// name, then SWITCH INTO it from here — while still signed in as yourself —
// and post, react, reply and DM as that handle. Members just see a normal user.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useActing } from "@/context/ActingContext";
import {
  createStaffHandle,
  deleteUserAccount,
  renameStaffHandle,
  setStaffOnCall,
} from "@/lib/adminActions";
import AppShell from "@/components/AppShell";
import SplashScreen from "@/components/SplashScreen";

export default function AdminStaffPage() {
  const { profile, loading } = useAuth();
  const { handles, acting, switchTo } = useActing();
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (loading) return <SplashScreen />;
  if (profile?.role !== "superadmin") {
    return (
      <AppShell title="🎧 Staff Handles">
        <p className="p-8 text-center text-sm opacity-60">
          Only the SuperAdmin manages Staff Handles.
        </p>
      </AppShell>
    );
  }

  const onCallCount = handles.filter((s) => s.onCall).length;

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setNotice(null);
    try {
      await createStaffHandle(name.trim());
      setNotice(`✅ Handle “${name.trim()}” created. Tap “Switch into” to start using it.`);
      setName("");
    } catch {
      setNotice("❌ Could not create the handle.");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-black/10 bg-background px-3 py-2.5 text-sm outline-none focus:border-brand dark:border-white/10";

  return (
    <AppShell title="🎧 Staff Handles">
      <div className="mx-auto max-w-lg space-y-3 p-3">
        <form onSubmit={create} className="space-y-2 rounded-2xl bg-surface p-4 shadow-sm">
          <p className="text-sm font-bold">➕ Create a Staff Handle</p>
          <p className="text-[11px] leading-relaxed opacity-50">
            No email or password needed — a handle never signs in. You operate it
            yourself by switching into it below.
          </p>
          <input
            className={inputCls}
            placeholder="Handle name (e.g. Support_Desk)"
            required
            minLength={2}
            maxLength={24}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="app-chrome w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create handle"}
          </button>
          {notice && (
            <p className="rounded-xl bg-brand-soft px-3 py-2 text-xs font-medium">{notice}</p>
          )}
        </form>

        <div className="rounded-2xl bg-surface p-4 shadow-sm">
          <p className="text-sm font-bold">Presence</p>
          <p className="text-xs opacity-50">
            {onCallCount} of {handles.length} On-Call — each adds +1 to the public
            “⚡ Active Now” counter.
          </p>
        </div>

        {handles.length === 0 && (
          <p className="pt-6 text-center text-sm opacity-50">
            No Staff Handles yet. Create one above.
          </p>
        )}

        {handles.map((s) => {
          const isActive = acting?.uid === s.uid;
          return (
            <div key={s.uid} className="space-y-2 rounded-2xl bg-surface p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    s.onCall ? "bg-emerald-500" : "bg-gray-400/50"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{s.handle}</p>
                  <p className="text-[10px] opacity-50">
                    {s.onCall ? "On-Call · shown as active" : "Off-Call · offline"}
                    {isActive ? " · you are using this handle" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStaffOnCall(s.uid, !s.onCall, Boolean(s.onCall))}
                  className={`app-chrome relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                    s.onCall ? "bg-emerald-500" : "bg-gray-400/40"
                  }`}
                  aria-label={`Toggle ${s.handle} on-call`}
                >
                  <span
                    className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                      s.onCall ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="flex gap-2">
                {isActive ? (
                  <button
                    type="button"
                    onClick={() => switchTo(null)}
                    className="app-chrome flex-1 rounded-xl bg-amber-500/15 py-2.5 text-xs font-bold text-amber-600 active:scale-[0.98]"
                  >
                    ↩︎ Switch back to myself
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      switchTo(s.uid);
                      router.push("/messages");
                    }}
                    className="app-chrome flex-1 rounded-xl bg-brand py-2.5 text-xs font-bold text-white active:scale-[0.98]"
                  >
                    🎭 Switch into {s.handle}
                  </button>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    const next = window.prompt("Rename this handle:", s.handle);
                    if (next && next.trim()) await renameStaffHandle(s.uid, next);
                  }}
                  className="app-chrome rounded-xl bg-background px-3 py-2.5 text-xs font-bold active:scale-[0.98]"
                >
                  ✏️
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm(`Delete the handle “${s.handle}”? This cannot be undone.`))
                      return;
                    if (acting?.uid === s.uid) switchTo(null);
                    await deleteUserAccount(s.uid);
                  }}
                  className="app-chrome rounded-xl bg-red-500/10 px-3 py-2.5 text-xs font-bold text-red-500 active:scale-[0.98]"
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}

        <p className="px-2 text-[10px] leading-relaxed opacity-40">
          While a handle is active, everything you post, react to or send goes out
          under that handle&apos;s name, and its DMs appear in your Messages tab. A
          banner at the top of every screen shows which handle you are using, and
          one tap returns you to yourself.
        </p>
      </div>
    </AppShell>
  );
}
