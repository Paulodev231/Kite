"use client";

// Admin controls that sit on one member's profile: issue a funding
// confirmation code, and pin a private note to their dashboard.
import { useState } from "react";
import {
  deleteFundingCode,
  issueFundingCode,
  setDashboardMessage,
  suggestFundingCode,
} from "@/lib/adminActions";
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  formatFunding,
  type UserProfile,
} from "@/lib/types";

const baseInput =
  "rounded-xl border border-black/10 bg-background px-3 py-2.5 text-sm outline-none focus:border-brand dark:border-white/10";
const inputCls = `w-full ${baseInput}`;

export default function AdminMemberTools({ person }: { person: UserProfile }) {
  // ----- Confirmation code -----
  const [code, setCode] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(person.fundedCurrency || DEFAULT_CURRENCY);
  const [note, setNote] = useState("");
  const [codeBusy, setCodeBusy] = useState(false);
  const [issued, setIssued] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  // ----- Dashboard message -----
  const [message, setMessage] = useState(person.dashboardMessage ?? "");
  const [msgBusy, setMsgBusy] = useState(false);
  const [msgSaved, setMsgSaved] = useState(false);

  async function issue() {
    const value = Number(amount);
    if (!code.trim()) {
      setCodeError("Enter a code, or tap Suggest.");
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      setCodeError("Enter the amount this code confirms.");
      return;
    }
    setCodeBusy(true);
    setCodeError(null);
    try {
      const saved = await issueFundingCode(
        code,
        person.uid,
        person.handle,
        value,
        currency,
        note,
      );
      setIssued(saved);
      setCode("");
      setAmount("");
      setNote("");
    } catch {
      setCodeError("Could not issue that code. Try a different one.");
    } finally {
      setCodeBusy(false);
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
      {/* Funding confirmation code */}
      <div className="space-y-2 rounded-2xl bg-surface p-4 shadow-sm">
        <p className="text-sm font-bold">🔑 Issue a confirmation code</p>
        <p className="text-[11px] leading-relaxed opacity-50">
          Give this code to {person.handle} privately. Entering it on their
          dashboard turns their funding green with exactly the amount below —
          they cannot change the figure.
        </p>

        <div className="flex gap-2">
          <input
            className={`min-w-0 flex-1 ${baseInput} text-center font-bold uppercase tracking-widest`}
            placeholder="ABCD-1234"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
          <button
            type="button"
            onClick={() => setCode(suggestFundingCode())}
            className="app-chrome shrink-0 rounded-xl bg-background px-3 text-xs font-bold active:scale-[0.98]"
          >
            Suggest
          </button>
        </div>

        <label className="block text-[11px] font-bold opacity-60">Amount it confirms</label>
        <div className="flex gap-2">
          <select
            className={`w-20 shrink-0 ${baseInput}`}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            aria-label="Currency"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            className={`min-w-0 flex-1 ${baseInput}`}
            type="number"
            inputMode="decimal"
            min="0"
            placeholder="e.g. 200000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        {Number(amount) > 0 && (
          <p className="text-[11px] font-semibold opacity-60">
            Confirms: 💰 {formatFunding(Number(amount), currency)}
          </p>
        )}

        <input
          className={inputCls}
          placeholder="Note (optional, e.g. Tranche 1 of 3)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        {codeError && (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-[11px] font-semibold text-red-500">
            {codeError}
          </p>
        )}

        <button
          type="button"
          onClick={issue}
          disabled={codeBusy}
          className="app-chrome w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50"
        >
          {codeBusy ? "Issuing…" : "Issue code"}
        </button>

        {issued && (
          <div className="rounded-xl bg-emerald-500/10 p-3">
            <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              ✅ Code issued — send it to {person.handle}:
            </p>
            <p className="mt-1 select-all text-center text-lg font-extrabold tracking-widest">
              {issued}
            </p>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Revoke the code ${issued}?`)) {
                  deleteFundingCode(issued);
                  setIssued(null);
                }
              }}
              className="app-chrome mt-1 w-full text-[11px] font-bold text-red-500"
            >
              Revoke this code
            </button>
          </div>
        )}
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
