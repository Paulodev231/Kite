"use client";

// Admin-only panel for tagging a member's funding status and amount.
import { useState } from "react";
import { setUserFunding } from "@/lib/adminActions";
import { useT } from "@/context/LanguageContext";
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
  const { t } = useT();
  const [funded, setFunded] = useState(Boolean(user.funded));
  const [amount, setAmount] = useState(String(user.fundedAmount ?? ""));
  const [currency, setCurrency] = useState(user.fundedCurrency || DEFAULT_CURRENCY);
  const [note, setNote] = useState(user.fundedNote ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const value = Number(amount);
    if (funded && (!Number.isFinite(value) || value <= 0)) {
      setError(t("fundEditorAmountError"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await setUserFunding(user.uid, funded, funded ? value : 0, currency, note.trim());
      onDone();
    } catch {
      setError(t("saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  // Width is applied per-field: inside the flex row the amount input must be
  // `flex-1 min-w-0`, never `w-full`, or it overflows the row and gets pushed
  // off the side of the screen.
  const baseInput =
    "rounded-xl border border-black/10 bg-background px-3 py-2.5 text-sm outline-none focus:border-brand dark:border-white/10";
  const inputCls = `w-full ${baseInput}`;

  return (
    <div className="mt-2 space-y-2 rounded-xl bg-background p-3">
      <p className="text-xs font-bold">{t("fundEditorTitle", { handle: user.handle })}</p>

      {/* Funded / Not funded — words on the control, never colour alone */}
      <div className="flex gap-2">
        {[
          { value: true, label: t("fundEditorFunded") },
          { value: false, label: t("fundEditorNotFunded") },
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
      <label className="block text-[11px] font-bold opacity-60">{t("fundEditorAmount")}</label>
      <div className="flex gap-2">
        <select
          className={`w-20 shrink-0 ${baseInput}`}
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          aria-label={t("currency")}
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
          placeholder={t("amountExample")}
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            if (Number(e.target.value) > 0) setFunded(true);
          }}
        />
      </div>
      {Number(amount) > 0 && funded && (
        <p className="text-[11px] font-semibold opacity-60">
          {t("fundEditorPreview", { amount: formatFunding(Number(amount), currency) })}
        </p>
      )}
      {!funded && (
        <p className="text-[11px] font-medium opacity-50">
          {t("fundEditorCleared")}
        </p>
      )}
      <input
        className={inputCls}
        placeholder={t("notePlaceholder")}
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
          {t("cancel")}
        </button>
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="app-chrome flex-1 rounded-xl bg-brand py-2 text-xs font-bold text-white active:scale-[0.98] disabled:opacity-50"
        >
          {busy ? t("saving") : t("fundEditorSave")}
        </button>
      </div>
    </div>
  );
}
