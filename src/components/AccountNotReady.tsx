"use client";

// Shown when someone signs in successfully but their users/{uid} profile
// document is missing or unreadable. Without this screen the app would sit
// on the splash forever. It updates LIVE: the moment the document is created
// correctly in Firestore, the app continues by itself.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useT } from "@/context/LanguageContext";

export default function AccountNotReady({ reason }: { reason: "missing" | "error" }) {
  const { user, logout } = useAuth();
  const { t } = useT();
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
          <h1 className="text-lg font-bold">{t("notReadyMissingTitle")}</h1>
          <p className="max-w-sm text-sm leading-relaxed opacity-70">
            {t("notReadyMissingBody")}
          </p>
          <button
            type="button"
            onClick={copyUid}
            className="app-chrome max-w-full break-all rounded-xl bg-surface px-4 py-3 font-mono text-xs font-semibold shadow-sm active:scale-[0.98]"
          >
            {user?.uid}
            <span className="mt-1 block text-[10px] font-sans font-medium text-brand">
              {copied ? t("copiedExcl") : t("tapToCopy")}
            </span>
          </button>
          <div className="max-w-sm rounded-2xl bg-surface p-4 text-left text-xs leading-relaxed shadow-sm">
            <p className="mb-1 font-bold">{t("notReadyFields")}</p>
            <ul className="list-disc space-y-1 pl-4 opacity-80">
              <li>{t("notReadyHandleField")}</li>
              <li>{t("notReadyRoleField")}</li>
              <li>{t("notReadyActiveField")}</li>
            </ul>
            <p className="mt-2 opacity-60">
              {t("notReadyFixes")}
            </p>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-lg font-bold">{t("notReadyErrorTitle")}</h1>
          <p className="max-w-sm text-sm leading-relaxed opacity-70">
            {t("notReadyErrorBody")}
          </p>
          <div className="max-w-sm rounded-2xl bg-surface p-4 text-left text-xs leading-relaxed shadow-sm">
            <ul className="list-disc space-y-1.5 pl-4 opacity-80">
              <li>{t("notReadyRules")}</li>
              <li>{t("notReadyNoDb")}</li>
            </ul>
            <p className="mt-2 opacity-60">
              {t("notReadyClears")}
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
        {t("signOutTryAgain")}
      </button>
    </div>
  );
}
