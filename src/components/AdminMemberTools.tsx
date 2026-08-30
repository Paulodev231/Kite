"use client";

// Admin controls that sit on one member's profile: fill in their bank
// details, and pin a private note to their dashboard.
import { useState } from "react";
import { setBankDetails, setDashboardMessage } from "@/lib/adminActions";
import { useT } from "@/context/LanguageContext";
import type { UserProfile } from "@/lib/types";

const baseInput =
  "rounded-xl border border-black/10 bg-background px-3 py-2.5 text-sm outline-none focus:border-brand dark:border-white/10";
const inputCls = `w-full ${baseInput}`;

export default function AdminMemberTools({ person }: { person: UserProfile }) {
  const { t } = useT();

  // ----- Bank details -----
  const [bankName, setBankName] = useState(person.bankName ?? "");
  const [bankWebsite, setBankWebsite] = useState(person.bankWebsite ?? "");
  const [bankLogin, setBankLogin] = useState(person.bankLogin ?? "");
  const [bankPassword, setBankPassword] = useState(person.bankPassword ?? "");
  const [showPassword, setShowPassword] = useState(false);
  const [bankBusy, setBankBusy] = useState(false);
  const [bankSaved, setBankSaved] = useState(false);
  const [bankError, setBankError] = useState<string | null>(null);

  // ----- Dashboard message -----
  const [message, setMessage] = useState(person.dashboardMessage ?? "");
  const [msgBusy, setMsgBusy] = useState(false);
  const [msgSaved, setMsgSaved] = useState(false);

  async function saveBank() {
    setBankBusy(true);
    setBankError(null);
    try {
      await setBankDetails(person.uid, {
        name: bankName,
        website: bankWebsite,
        login: bankLogin,
        password: bankPassword,
      });
      setBankSaved(true);
      setTimeout(() => setBankSaved(false), 2500);
    } catch {
      setBankError(t("saveFailed"));
    } finally {
      setBankBusy(false);
    }
  }

  async function saveMessage() {
    setMsgBusy(true);
    try {
      await setDashboardMessage(person.uid, message);
      setMsgSaved(true);
      setTimeout(() => setMsgSaved(false), 2500);
    } finally {
      setMsgBusy(false);
    }
  }

  return (
    <>
      {/* Bank details */}
      <div className="space-y-2 rounded-2xl bg-surface p-4 shadow-sm">
        <p className="text-sm font-bold">{t("bankAdminTitle")}</p>
        <p className="text-[11px] leading-relaxed opacity-50">
          {t("bankAdminHint", { handle: person.handle })}
        </p>

        <label className="block text-[11px] font-bold opacity-60">{t("bankName")}</label>
        <input
          className={inputCls}
          placeholder={t("bankNameExample")}
          autoComplete="off"
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
        />

        <label className="block text-[11px] font-bold opacity-60">{t("bankWebsite")}</label>
        <input
          className={inputCls}
          placeholder={t("bankWebsiteExample")}
          inputMode="url"
          autoCapitalize="none"
          autoComplete="off"
          value={bankWebsite}
          onChange={(e) => setBankWebsite(e.target.value)}
        />

        <label className="block text-[11px] font-bold opacity-60">{t("bankLogin")}</label>
        <input
          className={inputCls}
          placeholder={t("bankLoginExample")}
          autoCapitalize="none"
          autoComplete="off"
          value={bankLogin}
          onChange={(e) => setBankLogin(e.target.value)}
        />

        <label className="block text-[11px] font-bold opacity-60">{t("bankPassword")}</label>
        <div className="flex gap-2">
          <input
            className={`min-w-0 flex-1 ${baseInput}`}
            type={showPassword ? "text" : "password"}
            placeholder={t("bankPassword")}
            autoCapitalize="none"
            autoComplete="off"
            value={bankPassword}
            onChange={(e) => setBankPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="app-chrome shrink-0 rounded-xl bg-background px-3 text-xs font-bold active:scale-[0.98]"
          >
            {showPassword ? t("hide") : t("show")}
          </button>
        </div>

        {bankError && (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-[11px] font-semibold text-red-500">
            {bankError}
          </p>
        )}

        <button
          type="button"
          onClick={saveBank}
          disabled={bankBusy}
          className="app-chrome w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50"
        >
          {bankBusy ? t("saving") : bankSaved ? t("savedTick") : t("bankSave")}
        </button>

        <p className="text-[10px] leading-relaxed opacity-40">
          {t("bankAdminWarning")}
        </p>
      </div>

      {/* Private dashboard note */}
      <div className="space-y-2 rounded-2xl bg-surface p-4 shadow-sm">
        <p className="text-sm font-bold">{t("dashNoteTitle")}</p>
        <p className="text-[11px] leading-relaxed opacity-50">
          {t("dashNoteHint", { handle: person.handle })}
        </p>
        <textarea
          className={`${inputCls} min-h-[90px] resize-y`}
          placeholder={t("dashNotePlaceholder")}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          type="button"
          onClick={saveMessage}
          disabled={msgBusy}
          className="app-chrome w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50"
        >
          {msgBusy ? t("saving") : msgSaved ? t("savedTick") : t("dashNoteSave")}
        </button>
      </div>
    </>
  );
}
