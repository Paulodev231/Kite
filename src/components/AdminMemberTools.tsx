"use client";

// Admin controls that sit on one member's profile: fill in their bank
// details, and pin a private note to their dashboard.
import { useState } from "react";
import { setBankDetails, setDashboardMessage } from "@/lib/adminActions";
import type { UserProfile } from "@/lib/types";

const baseInput =
  "rounded-xl border border-black/10 bg-background px-3 py-2.5 text-sm outline-none focus:border-brand dark:border-white/10";
const inputCls = `w-full ${baseInput}`;

export default function AdminMemberTools({ person }: { person: UserProfile }) {
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
      setBankError("Could not save. Check your connection and try again.");
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
        <p className="text-sm font-bold">🏦 Bank details</p>
        <p className="text-[11px] leading-relaxed opacity-50">
          You type these in for {person.handle}. Only they and Admins can see
          them. Leave a box empty to hide that line on their dashboard.
        </p>

        <label className="block text-[11px] font-bold opacity-60">Bank name</label>
        <input
          className={inputCls}
          placeholder="e.g. First National Bank"
          autoComplete="off"
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
        />

        <label className="block text-[11px] font-bold opacity-60">Bank website</label>
        <input
          className={inputCls}
          placeholder="e.g. www.fnb.com"
          inputMode="url"
          autoCapitalize="none"
          autoComplete="off"
          value={bankWebsite}
          onChange={(e) => setBankWebsite(e.target.value)}
        />

        <label className="block text-[11px] font-bold opacity-60">Login</label>
        <input
          className={inputCls}
          placeholder="Username or account number"
          autoCapitalize="none"
          autoComplete="off"
          value={bankLogin}
          onChange={(e) => setBankLogin(e.target.value)}
        />

        <label className="block text-[11px] font-bold opacity-60">Password</label>
        <div className="flex gap-2">
          <input
            className={`min-w-0 flex-1 ${baseInput}`}
            type={showPassword ? "text" : "password"}
            placeholder="Password"
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
            {showPassword ? "Hide" : "Show"}
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
          {bankBusy ? "Saving…" : bankSaved ? "✅ Saved" : "Save bank details"}
        </button>

        <p className="text-[10px] leading-relaxed opacity-40">
          These are stored as you type them. Treat this as the most sensitive
          information in the app — anyone with your admin account can read it.
        </p>
      </div>

      {/* Private dashboard note */}
      <div className="space-y-2 rounded-2xl bg-surface p-4 shadow-sm">
        <p className="text-sm font-bold">📌 Note on their dashboard</p>
        <p className="text-[11px] leading-relaxed opacity-50">
          Pinned to the top of {person.handle}&apos;s dashboard. Only they can see it.
          Clear the box and save to remove it.
        </p>
        <textarea
          className={`${inputCls} min-h-[90px] resize-y`}
          placeholder="e.g. Your second tranche is approved — send your receipts by Friday."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          type="button"
          onClick={saveMessage}
          disabled={msgBusy}
          className="app-chrome w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50"
        >
          {msgBusy ? "Saving…" : msgSaved ? "✅ Saved" : "Save note"}
        </button>
      </div>
    </>
  );
}
