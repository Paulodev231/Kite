"use client";

// "Speaking as" selector, used across the Handle Console. Always visible so
// the SuperAdmin can never post under the wrong identity by accident.
import type { UserProfile } from "@/lib/types";
import { useT } from "@/context/LanguageContext";

export default function HandlePicker({
  handles,
  value,
  onChange,
  selfLabel,
  allowSelf = true,
}: {
  handles: UserProfile[];
  value: string; // "" means yourself
  onChange: (uid: string) => void;
  selfLabel: string;
  allowSelf?: boolean;
}) {
  const { t } = useT();

  return (
    <div className="rounded-xl bg-brand-soft p-2">
      <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-wide text-brand">
        {t("cnSpeakingAs")}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {allowSelf && (
          <button
            type="button"
            onClick={() => onChange("")}
            className={`app-chrome rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
              value === "" ? "bg-brand text-white" : "bg-surface opacity-70"
            }`}
          >
            👑 {selfLabel}
          </button>
        )}
        {handles.map((h) => (
          <button
            key={h.uid}
            type="button"
            onClick={() => onChange(h.uid)}
            className={`app-chrome rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
              value === h.uid ? "bg-brand text-white" : "bg-surface opacity-70"
            }`}
          >
            🎧 {h.handle}
            {h.onCall ? " 🟢" : ""}
          </button>
        ))}
      </div>
      {handles.length === 0 && (
        <p className="px-1 pt-1 text-[10px] opacity-60">
          {t("cnNoHandlesShort")}
        </p>
      )}
    </div>
  );
}
