"use client";

// Shown when someone signs in successfully but their users/{uid} profile
// document is missing or unreadable. Without this screen the app would sit
// on the splash forever. It updates LIVE: the moment the document is created
// correctly in Firestore, the app continues by itself.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AccountNotReady({ reason }: { reason: "missing" | "error" }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  async function copyUid() {
    if (!user) return;
    try {
      await navigator.clipboard.writeText(user.uid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <span className="text-5xl" aria-hidden>
        {reason === "missing" ? "🪪" : "🚧"}
      </span>

      {reason === "missing" ? (
        <>
          <h1 className="text-lg font-bold">Signed in — but this account isn’t set up yet</h1>
          <p className="max-w-sm text-sm leading-relaxed opacity-70">
            Your login works, but there is no profile document for it in
            Firestore, so the app can’t know your role. In the Firebase Console
            open <b>Firestore Database → Data</b> and check the{" "}
            <code className="rounded bg-brand-soft px-1 font-mono text-brand">users</code>{" "}
            collection (all lowercase) for a document whose <b>Document ID</b>{" "}
            is exactly:
          </p>
          <button
            type="button"
            onClick={copyUid}
            className="app-chrome max-w-full break-all rounded-xl bg-surface px-4 py-3 font-mono text-xs font-semibold shadow-sm active:scale-[0.98]"
          >
            {user?.uid}
            <span className="mt-1 block text-[10px] font-sans font-medium text-brand">
              {copied ? "✅ Copied!" : "Tap to copy"}
            </span>
          </button>
          <div className="max-w-sm rounded-2xl bg-surface p-4 text-left text-xs leading-relaxed shadow-sm">
            <p className="mb-1 font-bold">That document needs exactly these fields:</p>
            <ul className="list-disc space-y-1 pl-4 opacity-80">
              <li>
                <code className="font-mono">handle</code> — type <b>string</b> — your display name
              </li>
              <li>
                <code className="font-mono">role</code> — type <b>string</b> — e.g.{" "}
                <code className="font-mono">superadmin</code> (lowercase)
              </li>
              <li>
                <code className="font-mono">active</code> — type <b>boolean</b> — true
                (not the text “true”)
              </li>
            </ul>
            <p className="mt-2 opacity-60">
              Fix it and this screen will disappear on its own — no refresh needed.
            </p>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-lg font-bold">Signed in — but the database refused the app</h1>
          <p className="max-w-sm text-sm leading-relaxed opacity-70">
            Reading your profile from Firestore failed. This usually means one
            of these, in order of likelihood:
          </p>
          <div className="max-w-sm rounded-2xl bg-surface p-4 text-left text-xs leading-relaxed shadow-sm">
            <ul className="list-disc space-y-1.5 pl-4 opacity-80">
              <li>
                The security rules weren’t published: Firebase Console →
                <b> Firestore Database → Rules</b> — paste the whole{" "}
                <code className="font-mono">firestore.rules</code> file from the
                repo and press <b>Publish</b>.
              </li>
              <li>
                The Firestore database was never created:{" "}
                <b>Build → Firestore Database → Create database</b>.
              </li>
            </ul>
            <p className="mt-2 opacity-60">
              Once fixed, this screen clears by itself within a few seconds.
            </p>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={async () => {
          await logout();
          router.replace("/login");
        }}
        className="app-chrome mt-2 rounded-2xl bg-brand px-6 py-3 text-sm font-bold text-white shadow-md active:scale-[0.98]"
      >
        Sign out & try again
      </button>
    </div>
  );
}
