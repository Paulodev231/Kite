"use client";

// Lets a member pin the app to one language. The default, "Automatic",
// follows whatever language their phone is set to.
import { useT } from "@/context/LanguageContext";
import { LANGUAGES, type Lang } from "@/lib/i18n";

export default function LanguagePicker() {
  const { t, override, setOverride } = useT();

  return (
    <div className="space-y-2 rounded-3xl bg-surface p-4 shadow-sm">
      <p className="text-sm font-bold">🌍 {t("language")}</p>
      <p className="text-[11px] leading-relaxed opacity-50">{t("languageHint")}</p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setOverride(null)}
          className={`app-chrome rounded-full px-3 py-2 text-xs font-bold active:scale-[0.98] ${
            override === null ? "bg-brand text-white" : "bg-background"
          }`}
        >
          ✨ {t("automatic")}
        </button>
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => setOverride(l.code as Lang)}
            className={`app-chrome rounded-full px-3 py-2 text-xs font-bold active:scale-[0.98] ${
              override === l.code ? "bg-brand text-white" : "bg-background"
            }`}
          >
            {l.flag} {l.label}
          </button>
        ))}
      </div>
    </div>
  );
}
