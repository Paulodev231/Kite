"use client";

// The member's own funding status: a compact chip that reads green when
// funded and red when not, plus a small box to type in the confirmation code
// they were given. The code is simply recorded — the funding figure itself is
// always set by an Admin.
import { useState } from "react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useT } from "@/context/LanguageContext";
import { formatFunding } from "@/lib/types";

export default function FundingPanel() {
  const { user, profile } = useAuth();
  const { t } = useT();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const funded = Boolean(profile?.funded);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !code.trim() || busy) return;
    setBusy(true);
    try {
      await updateDoc(doc(db(), "users", user.uid), {
        fundingCode: code.trim(),
        fundingCodeAt: serverTimestamp(),
      });
      setSaved(true);
      setCode("");
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // Nothing here grants funding, so a failure is harmless — keep quiet.
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-3xl bg-surface p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <p className="flex-1 text-sm font-bold">💰 {t("fundingStatus")}</p>
        {/* Compact status chip: colour plus icon and words */}
        <span
          className="rounded-full px-3 py-1 text-xs font-bold text-white"
          style={{ backgroundColor: funded ? "#0ca30c" : "#d03b3b" }}
        >
          {funded ? `✅ ${t("funded")}` : `⛔ ${t("notFunded")}`}
        </span>
      </div>

      {funded && (
        <p className="text-2xl font-extrabold tabular-nums" style={{ color: "#0ca30c" }}>
          {formatFunding(profile?.fundedAmount, profile?.fundedCurrency)}
          {profile?.fundedNote && (
            <span className="block text-[11px] font-medium opacity-60">
              {profile.fundedNote}
            </span>
          )}
        </p>
      )}

      <form onSubmit={submit} className="space-y-1.5">
        <label className="block text-[11px] font-bold opacity-60">
          {t("confirmationCode")}
        </label>
        <p className="text-[11px] opacity-50">{t("confirmationCodeHint")}</p>
        <div className="flex gap-2">
          <input
            className="min-w-0 flex-1 rounded-xl border border-black/10 bg-background px-3 py-2 text-sm outline-none focus:border-brand dark:border-white/10"
            placeholder={profile?.fundingCode ? profile.fundingCode : "———"}
            autoComplete="off"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button
            type="submit"
            disabled={busy || !code.trim()}
            className="app-chrome shrink-0 rounded-xl bg-brand px-4 text-xs font-bold text-white active:scale-[0.98] disabled:opacity-40"
          >
            {saved ? `✅ ${t("saved")}` : t("confirm")}
          </button>
        </div>
      </form>

      <p className="text-[10px] leading-relaxed opacity-40">{t("fundingFootnote")}</p>
    </div>
  );
}
