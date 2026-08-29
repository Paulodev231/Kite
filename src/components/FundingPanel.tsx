"use client";

// The member's own funding panel: a big status button that reads GREEN when
// funded and RED when not, plus a box to enter the confirmation code an Admin
// issued them. Colour never carries the meaning alone — the icon and the words
// say it too.
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { redeemFundingCode } from "@/lib/memberActions";
import { formatFunding } from "@/lib/types";

export default function FundingPanel() {
  const { user, profile } = useAuth();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justConfirmed, setJustConfirmed] = useState(false);

  const funded = Boolean(profile?.funded);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || busy) return;
    setBusy(true);
    setError(null);
    const result = await redeemFundingCode(user.uid, code);
    if (result.ok) {
      setCode("");
      setJustConfirmed(true);
    } else {
      setError(result.reason);
    }
    setBusy(false);
  }

  return (
    <div className="space-y-3 rounded-3xl bg-surface p-4 shadow-sm">
      <p className="text-sm font-bold">💰 Funding status</p>

      {/* The status button: green when funded, red when not */}
      <div
        className="flex flex-col items-center gap-1 rounded-2xl px-4 py-5 text-white shadow-sm"
        style={{ backgroundColor: funded ? "#0ca30c" : "#d03b3b" }}
        role="status"
      >
        <span className="text-2xl" aria-hidden>
          {funded ? "✅" : "⛔"}
        </span>
        <span className="text-sm font-extrabold uppercase tracking-wide">
          {funded ? "Funded" : "Not funded"}
        </span>
        {funded && (
          <span className="text-2xl font-extrabold tabular-nums">
            {formatFunding(profile?.fundedAmount, profile?.fundedCurrency)}
          </span>
        )}
        {funded && profile?.fundedNote && (
          <span className="text-[11px] opacity-90">{profile.fundedNote}</span>
        )}
        {funded && profile?.fundedAt && (
          <span className="text-[10px] opacity-75">
            Confirmed {profile.fundedAt.toDate().toLocaleDateString()}
          </span>
        )}
      </div>

      {justConfirmed && (
        <p className="rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-600">
          🎉 Confirmed. Your funding is now recorded.
        </p>
      )}

      {/* Code entry — hidden once funding is confirmed */}
      {!funded && (
        <form onSubmit={submit} className="space-y-2">
          <label className="block text-[11px] font-bold opacity-60">
            Confirmation code
          </label>
          <p className="text-[11px] leading-relaxed opacity-50">
            Enter the code your administrator gave you to confirm your funding.
          </p>
          <input
            className="w-full rounded-xl border border-black/10 bg-background px-3 py-2.5 text-center text-base font-bold uppercase tracking-widest outline-none focus:border-brand dark:border-white/10"
            placeholder="ABCD-1234"
            autoCapitalize="characters"
            autoComplete="off"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
          {error && (
            <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs font-medium text-red-500">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy || !code.trim()}
            className="app-chrome w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-40"
          >
            {busy ? "Checking…" : "Confirm funding"}
          </button>
        </form>
      )}

      <p className="text-[10px] leading-relaxed opacity-40">
        Funding is issued by your administrator. If something here looks wrong,
        message them — do not share your code with anyone else.
      </p>
    </div>
  );
}
