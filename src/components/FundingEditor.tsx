"use client";

// Admin-only panel for tagging a member's funding status and amount.
import { useState } from "react";
import { setUserFunding } from "@/lib/adminActions";
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  formatFunding,
  type UserProfile,
} from "@/lib/types";

export default function FundingEditor({
  user,
  onDone,
}: {
  user: UserProfile;
  onDone: () => void;
}) {
  const [funded, setFunded] = useState(Boolean(user.funded));
  const [amount, setAmount] = useState(String(user.fundedAmount ?? ""));
  const [currency, setCurrency] = useState(user.fundedCurrency || DEFAULT_CURRENCY);
  const [note, setNote] = useState(user.fundedNote ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const value = Number(amount);
    if (funded && (!Number.isFinite(value) || value <= 0)) {
      setError("Enter the amount funded (numbers only, e.g. 200000).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await setUserFunding(user.uid, funded, funded ? value : 0, currency, note.trim());
      onDone();
    } catch {
      setError("Could not save. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-black/10 bg-background px-3 py-2.5 text-sm outline-none focus:border-brand dark:border-white/10";

  return (
    <div className="mt-2 space-y-2 rounded-xl bg-background p-3">
      <p className="text-xs font-bold">💰 Funding status for {user.handle}</p>

      {/* Funded / Not funded — words on the control, never colour alone */}
      <div className="flex gap-2">
        {[
          { value: true, label: "💰 Funded" },
          { value: false, label: "○ Not funded" },
        ].map((opt) => (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => setFunded(opt.value)}
            className={`app-chrome flex-1 rounded-xl py-2 text-xs font-bold transition ${
              funded === opt.value
                ? "bg-brand text-white"
                : "bg-surface opacity-60"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Amount is always visible — typing one switches the tag to Funded,
          so the admin never has to hunt for the field. */}
      <label className="block text-[11px] font-bold opacity-60">Amount funded</label>
      <div className="flex gap-2">
        <select
          className={`${inputCls} w-24 shrink-0`}
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
          className={inputCls}
          type="number"
          inputMode="decimal"
          min="0"
          placeholder="e.g. 200000"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            if (Number(e.target.value) > 0) setFunded(true);
          }}
        />
      </div>
      {Number(amount) > 0 && funded && (
        <p className="text-[11px] font-semibold opacity-60">
          Will show as: 💰 Funded — {formatFunding(Number(amount), currency)}
        </p>
      )}
      {!funded && (
        <p className="text-[11px] font-medium opacity-50">
          Marked “Not funded” — the amount above will be cleared when you save.
        </p>
      )}
      <input
        className={inputCls}
        placeholder="Note (optional, e.g. Tranche 1 of 3)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      {error && (
        <p className="rounded-xl bg-red-500/10 px-3 py-2 text-[11px] font-semibold text-red-500">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onDone}
          className="app-chrome flex-1 rounded-xl bg-surface py-2 text-xs font-bold active:scale-[0.98]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="app-chrome flex-1 rounded-xl bg-brand py-2 text-xs font-bold text-white active:scale-[0.98] disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save funding"}
        </button>
      </div>
    </div>
  );
}
