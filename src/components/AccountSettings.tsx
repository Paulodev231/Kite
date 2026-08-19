"use client";

// Self-service account settings: change your handle (Admins are notified
// via the compliance log) and change your password (asks for the current
// one first — Firebase requires a fresh sign-in for password changes).
import { useState } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { logEvent } from "@/lib/log";

const inputCls =
  "w-full rounded-xl border border-black/10 bg-background px-3 py-2.5 text-sm outline-none focus:border-brand dark:border-white/10";

export default function AccountSettings() {
  const { user, profile } = useAuth();

  const [handle, setHandle] = useState("");
  const [handleBusy, setHandleBusy] = useState(false);
  const [handleNotice, setHandleNotice] = useState<string | null>(null);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwNotice, setPwNotice] = useState<string | null>(null);

  async function saveHandle(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile) return;
    const next = handle.trim();
    if (next.length < 2 || next.length > 24) {
      setHandleNotice("❌ Handle must be 2–24 characters.");
      return;
    }
    setHandleBusy(true);
    setHandleNotice(null);
    try {
      await updateDoc(doc(db(), "users", user.uid), { handle: next });
      // Admins are notified through the compliance log (old → new).
      logEvent(user.uid, "handle_changed", { from: profile.handle, to: next });
      setHandleNotice("✅ Handle updated everywhere.");
      setHandle("");
    } catch {
      setHandleNotice("❌ Could not update the handle. Try again.");
    } finally {
      setHandleBusy(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.email) return;
    if (newPw.length < 6) {
      setPwNotice("❌ New password must be at least 6 characters.");
      return;
    }
    setPwBusy(true);
    setPwNotice(null);
    try {
      const cred = EmailAuthProvider.credential(user.email, currentPw);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPw);
      setPwNotice("✅ Password changed. Use it next time you sign in.");
      setCurrentPw("");
      setNewPw("");
    } catch {
      setPwNotice("❌ Check the current password and try again.");
    } finally {
      setPwBusy(false);
    }
  }

  return (
    <>
      <form onSubmit={saveHandle} className="space-y-2 rounded-3xl bg-surface p-4 shadow-sm">
        <p className="text-sm font-bold">📝 Change my handle</p>
        <p className="text-[11px] leading-relaxed opacity-50">
          This is the name others see. Admins are notified of handle changes.
        </p>
        <input
          className={inputCls}
          placeholder={`Current: ${profile?.handle ?? ""}`}
          value={handle}
          minLength={2}
          maxLength={24}
          onChange={(e) => setHandle(e.target.value)}
        />
        <button
          type="submit"
          disabled={handleBusy || handle.trim().length < 2}
          className="app-chrome w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-40"
        >
          {handleBusy ? "Saving…" : "Save handle"}
        </button>
        {handleNotice && (
          <p className="rounded-xl bg-brand-soft px-3 py-2 text-xs font-medium">{handleNotice}</p>
        )}
      </form>

      <form onSubmit={savePassword} className="space-y-2 rounded-3xl bg-surface p-4 shadow-sm">
        <p className="text-sm font-bold">🔑 Change my password</p>
        <input
          className={inputCls}
          type="password"
          autoComplete="current-password"
          placeholder="Current password"
          required
          value={currentPw}
          onChange={(e) => setCurrentPw(e.target.value)}
        />
        <input
          className={inputCls}
          type="password"
          autoComplete="new-password"
          placeholder="New password (min 6 characters)"
          required
          minLength={6}
          value={newPw}
          onChange={(e) => setNewPw(e.target.value)}
        />
        <button
          type="submit"
          disabled={pwBusy || !currentPw || newPw.length < 6}
          className="app-chrome w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-40"
        >
          {pwBusy ? "Updating…" : "Update password"}
        </button>
        {pwNotice && (
          <p className="rounded-xl bg-brand-soft px-3 py-2 text-xs font-medium">{pwNotice}</p>
        )}
      </form>
    </>
  );
}
