"use client";

// Self-service account settings: change your handle (Admins are notified
// via the compliance log), your sign-in username, your contact email, and
// your password (asks for the current one first — Firebase requires a fresh
// sign-in for password changes).
import { useState } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useT } from "@/context/LanguageContext";
import { logEvent } from "@/lib/log";
import { changeOwnUsername, normalizeUsername } from "@/lib/usernames";

const inputCls =
  "w-full rounded-xl border border-black/10 bg-background px-3 py-2.5 text-sm outline-none focus:border-brand dark:border-white/10";

export default function AccountSettings() {
  const { user, profile } = useAuth();
  const { t } = useT();

  const [handle, setHandle] = useState("");
  const [handleBusy, setHandleBusy] = useState(false);
  const [handleNotice, setHandleNotice] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [usernameBusy, setUsernameBusy] = useState(false);
  const [usernameNotice, setUsernameNotice] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailNotice, setEmailNotice] = useState<string | null>(null);

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

  async function saveUsername(e: React.FormEvent) {
    e.preventDefault();
    // user.email is the account's login address (hidden for username accounts).
    if (!user?.email || !profile) return;
    const next = normalizeUsername(username);
    setUsernameBusy(true);
    setUsernameNotice(null);
    try {
      await changeOwnUsername(user.uid, user.email, profile.username, next);
      logEvent(user.uid, "username_changed", { from: profile.username ?? "", to: next });
      setUsernameNotice(t("usernameSaved"));
      setUsername("");
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      setUsernameNotice(
        code === "username-invalid"
          ? t("usernameInvalid")
          : code === "username-taken"
            ? t("usernameTaken")
            : `❌ ${t("saveFailed")}`,
      );
    } finally {
      setUsernameBusy(false);
    }
  }

  async function saveEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setEmailBusy(true);
    setEmailNotice(null);
    try {
      await updateDoc(doc(db(), "users", user.uid), { email: email.trim() });
      logEvent(user.uid, "email_changed", {});
      setEmailNotice(t("emailSaved"));
      setEmail("");
    } catch {
      setEmailNotice(`❌ ${t("saveFailed")}`);
    } finally {
      setEmailBusy(false);
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
        <p className="text-sm font-bold">📝 {t("changeHandle")}</p>
        <p className="text-[11px] leading-relaxed opacity-50">
          {t("changeHandleHint")}
        </p>
        <input
          className={inputCls}
          placeholder={t("currentValue", { value: profile?.handle ?? "" })}
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
          {handleBusy ? "…" : t("saveHandle")}
        </button>
        {handleNotice && (
          <p className="rounded-xl bg-brand-soft px-3 py-2 text-xs font-medium">{handleNotice}</p>
        )}
      </form>

      <form onSubmit={saveUsername} className="space-y-2 rounded-3xl bg-surface p-4 shadow-sm">
        <p className="text-sm font-bold">👤 {t("changeUsername")}</p>
        <p className="text-[11px] leading-relaxed opacity-50">{t("changeUsernameHint")}</p>
        <input
          className={inputCls}
          placeholder={
            profile?.username
              ? t("currentValue", { value: `@${profile.username}` })
              : t("username")
          }
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={25}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button
          type="submit"
          disabled={usernameBusy || normalizeUsername(username).length < 3}
          className="app-chrome w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-40"
        >
          {usernameBusy ? "…" : t("saveUsername")}
        </button>
        {usernameNotice && (
          <p className="rounded-xl bg-brand-soft px-3 py-2 text-xs font-medium">{usernameNotice}</p>
        )}
      </form>

      <form onSubmit={saveEmail} className="space-y-2 rounded-3xl bg-surface p-4 shadow-sm">
        <p className="text-sm font-bold">✉️ {t("changeEmail")}</p>
        <p className="text-[11px] leading-relaxed opacity-50">{t("changeEmailHint")}</p>
        <input
          className={inputCls}
          type="email"
          autoComplete="email"
          placeholder={
            profile?.email ? t("currentValue", { value: profile.email }) : t("email")
          }
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          type="submit"
          disabled={emailBusy || !email.trim()}
          className="app-chrome w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-40"
        >
          {emailBusy ? "…" : t("saveEmail")}
        </button>
        {emailNotice && (
          <p className="rounded-xl bg-brand-soft px-3 py-2 text-xs font-medium">{emailNotice}</p>
        )}
      </form>

      <form onSubmit={savePassword} className="space-y-2 rounded-3xl bg-surface p-4 shadow-sm">
        <p className="text-sm font-bold">🔑 {t("changePassword")}</p>
        <input
          className={inputCls}
          type="password"
          autoComplete="current-password"
          placeholder={t("currentPassword")}
          required
          value={currentPw}
          onChange={(e) => setCurrentPw(e.target.value)}
        />
        <input
          className={inputCls}
          type="password"
          autoComplete="new-password"
          placeholder={t("newPassword")}
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
          {pwBusy ? "…" : t("updatePassword")}
        </button>
        {pwNotice && (
          <p className="rounded-xl bg-brand-soft px-3 py-2 text-xs font-medium">{pwNotice}</p>
        )}
      </form>
    </>
  );
}
