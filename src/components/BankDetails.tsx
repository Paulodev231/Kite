"use client";

// Bank details an Admin filled in for this member. Only they and Admins can
// read them. The password is hidden until tapped, so it is not exposed to
// anyone glancing at the screen.
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useT } from "@/context/LanguageContext";

function Row({
  label,
  value,
  secret = false,
  showLabel,
  hideLabel,
}: {
  label: string;
  value?: string;
  secret?: boolean;
  showLabel: string;
  hideLabel: string;
}) {
  const [revealed, setRevealed] = useState(false);
  if (!value) return null;

  return (
    <div className="flex items-center gap-2 border-t border-black/5 py-2.5 dark:border-white/10">
      <span className="w-28 shrink-0 text-[11px] font-semibold opacity-50">{label}</span>
      <span className="min-w-0 flex-1 break-all text-sm font-semibold">
        {secret && !revealed ? "••••••••" : value}
      </span>
      {secret && (
        <button
          type="button"
          onClick={() => setRevealed((r) => !r)}
          className="app-chrome shrink-0 rounded-full bg-background px-2.5 py-1 text-[10px] font-bold"
        >
          {revealed ? hideLabel : showLabel}
        </button>
      )}
    </div>
  );
}

export default function BankDetails() {
  const { profile } = useAuth();
  const { t } = useT();

  const has =
    profile?.bankName || profile?.bankWebsite || profile?.bankLogin || profile?.bankPassword;

  return (
    <div className="rounded-3xl bg-surface p-4 shadow-sm">
      <p className="text-sm font-bold">🏦 {t("bankDetails")}</p>

      {!has ? (
        <p className="mt-2 text-[11px] opacity-50">{t("noBankDetails")}</p>
      ) : (
        <>
          <Row
            label={t("bankName")}
            value={profile?.bankName}
            showLabel={t("show")}
            hideLabel={t("hide")}
          />
          {profile?.bankWebsite && (
            <div className="flex items-center gap-2 border-t border-black/5 py-2.5 dark:border-white/10">
              <span className="w-28 shrink-0 text-[11px] font-semibold opacity-50">
                {t("bankWebsite")}
              </span>
              <a
                href={
                  profile.bankWebsite.startsWith("http")
                    ? profile.bankWebsite
                    : `https://${profile.bankWebsite}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 break-all text-sm font-semibold text-brand underline"
              >
                {profile.bankWebsite}
              </a>
            </div>
          )}
          <Row
            label={t("bankLogin")}
            value={profile?.bankLogin}
            showLabel={t("show")}
            hideLabel={t("hide")}
          />
          <Row
            label={t("bankPassword")}
            value={profile?.bankPassword}
            secret
            showLabel={t("show")}
            hideLabel={t("hide")}
          />
          <p className="mt-2 text-[10px] leading-relaxed opacity-40">{t("bankFootnote")}</p>
        </>
      )}
    </div>
  );
}
