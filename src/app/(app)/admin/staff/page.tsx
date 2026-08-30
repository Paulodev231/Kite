"use client";

// SuperAdmin only: Managed Staff Handles.
//
// A handle has NO email, NO password and never signs in. Create it here with
// just a name, then operate it from the 🎛️ Handle Console. Members see it as
// an ordinary user.
import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useT } from "@/context/LanguageContext";
import type { UserProfile } from "@/lib/types";
import {
  createStaffHandles,
  deleteUserAccount,
  renameStaffHandle,
  setStaffOnCall,
} from "@/lib/adminActions";
import AppShell from "@/components/AppShell";
import SplashScreen from "@/components/SplashScreen";

/** Skip reasons come back from adminActions as codes, translated here. */
const SKIP_REASONS = {
  length: "stfReasonLength",
  exists: "stfReasonExists",
  failed: "stfReasonFailed",
} as const;

export default function AdminStaffPage() {
  const { profile, loading } = useAuth();
  const { t } = useT();
  const [handles, setHandles] = useState<UserProfile[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const superadmin = profile?.role === "superadmin";

  useEffect(() => {
    if (!superadmin) return;
    return onSnapshot(
      query(collection(db(), "users"), where("role", "==", "staff")),
      (snap) => setHandles(snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as UserProfile)),
      () => {},
    );
  }, [superadmin]);

  if (loading) return <SplashScreen />;
  if (profile?.role !== "superadmin") {
    return (
      <AppShell title={`🎧 ${t("admStaff")}`}>
        <p className="p-8 text-center text-sm opacity-60">
          {t("stfSuperOnly")}
        </p>
      </AppShell>
    );
  }

  const onCallCount = handles.filter((s) => s.onCall).length;

  // One name or a whole pasted list — split on new lines and commas alike.
  const requestedNames = name
    .split(/[\n,]/)
    .map((n) => n.trim())
    .filter(Boolean);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (requestedNames.length === 0) return;
    setBusy(true);
    setNotice(null);
    try {
      const result = await createStaffHandles(
        requestedNames,
        handles.map((h) => h.handle),
      );
      const parts: string[] = [];
      if (result.created.length > 0) {
        parts.push(
          t("stfCreated", {
            n: result.created.length,
            names: result.created.join(", "),
          }),
        );
      }
      for (const s of result.skipped) {
        parts.push(t("stfSkipped", { name: s.name, reason: t(SKIP_REASONS[s.reason]) }));
      }
      if (result.created.length > 0) parts.push(t("stfUseConsoleHint"));
      setNotice(parts.join(" "));
      // Keep anything that failed so it can be corrected and retried.
      setName(result.skipped.map((s) => s.name).join("\n"));
    } catch {
      setNotice(t("stfCreateFailed"));
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-black/10 bg-background px-3 py-2.5 text-sm outline-none focus:border-brand dark:border-white/10";

  return (
    <AppShell title={`🎧 ${t("admStaff")}`}>
      <div className="mx-auto max-w-lg space-y-3 p-3">
        <form onSubmit={create} className="space-y-2 rounded-2xl bg-surface p-4 shadow-sm">
          <p className="text-sm font-bold">{t("stfCreateTitle")}</p>
          <p className="text-[11px] leading-relaxed opacity-50">
            {t("stfCreateHint")}
          </p>
          <textarea
            className={`${inputCls} min-h-[92px] resize-y`}
            placeholder={"Support_Desk\nField_Officer\nFinance_Desk"}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            type="submit"
            disabled={busy || requestedNames.length === 0}
            className="app-chrome w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50"
          >
            {busy
              ? t("usrCreating")
              : requestedNames.length > 1
                ? t("stfCreateMany", { n: requestedNames.length })
                : t("stfCreateOne")}
          </button>
          {notice && (
            <p className="rounded-xl bg-brand-soft px-3 py-2 text-xs font-medium">{notice}</p>
          )}
        </form>

        <div className="rounded-2xl bg-surface p-4 shadow-sm">
          <p className="text-sm font-bold">{t("stfPresence")}</p>
          <p className="text-xs opacity-50">
            {t("stfPresenceCount", { on: onCallCount, total: handles.length })}
          </p>
        </div>

        {handles.length === 0 && (
          <p className="pt-6 text-center text-sm opacity-50">
            {t("stfNone")}
          </p>
        )}

        {handles.map((s) => {
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
                    {s.onCall ? t("stfOnCallLine") : t("stfOffCallLine")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStaffOnCall(s.uid, !s.onCall, Boolean(s.onCall))}
                  className={`app-chrome relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                    s.onCall ? "bg-emerald-500" : "bg-gray-400/40"
                  }`}
                  aria-label={t("stfToggleAria", { handle: s.handle })}
                >
                  <span
                    className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                      s.onCall ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="flex gap-2">
                <Link
                  href="/admin/console"
                  className="app-chrome flex-1 rounded-xl bg-brand py-2.5 text-center text-xs font-bold text-white active:scale-[0.98]"
                >
                  {t("stfUseInConsole")}
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    const next = window.prompt(t("stfRenamePrompt"), s.handle);
                    if (next && next.trim()) await renameStaffHandle(s.uid, next);
                  }}
                  className="app-chrome rounded-xl bg-background px-3 py-2.5 text-xs font-bold active:scale-[0.98]"
                >
                  ✏️
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm(t("stfDeleteConfirm", { handle: s.handle })))
                      return;
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

        <Link
          href="/admin/console"
          className="app-chrome block rounded-2xl bg-surface py-3 text-center text-sm font-bold shadow-sm active:scale-[0.98]"
        >
          {t("stfOpenConsole")}
        </Link>
        <p className="px-2 text-[10px] leading-relaxed opacity-40">
          {t("stfFootnote")}
        </p>
      </div>
    </AppShell>
  );
}
