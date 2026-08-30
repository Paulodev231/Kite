"use client";

// Message input bar used by Broadcast (admins), private rooms and DMs.
// - allowMedia: photos/videos/files (Admins & Staff only, enforced again by rules)
// - allowDocs: document attachments only (standard users in DMs)
import { useRef, useState } from "react";
import { useT } from "@/context/LanguageContext";

export default function Composer({
  placeholder,
  allowMedia = false,
  allowDocs = false,
  onSend,
}: {
  placeholder: string;
  allowMedia?: boolean;
  allowDocs?: boolean;
  onSend: (text: string, file: File | null) => Promise<void>;
}) {
  const { t } = useT();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const canAttach = allowMedia || allowDocs;

  async function submit() {
    const trimmed = text.trim();
    if ((!trimmed && !file) || busy) return;
    setBusy(true);
    try {
      await onSend(trimmed, file);
      setText("");
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-chrome border-t border-black/5 bg-surface p-2 dark:border-white/10">
      {file && (
        <div className="mb-1 flex items-center justify-between rounded-xl bg-brand-soft px-3 py-1.5 text-xs">
          <span className="truncate font-medium">📎 {file.name}</span>
          <button
            type="button"
            className="ml-2 font-bold text-red-500"
            onClick={() => {
              setFile(null);
              if (fileInput.current) fileInput.current.value = "";
            }}
          >
            ✕
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        {canAttach && (
          <>
            <input
              ref={fileInput}
              type="file"
              hidden
              accept={
                allowMedia
                  ? "image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                  : ".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
              }
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              aria-label={t("attachFile")}
              onClick={() => fileInput.current?.click()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl active:bg-brand-soft"
            >
              📎
            </button>
          </>
        )}
        <textarea
          rows={1}
          value={text}
          placeholder={placeholder}
          onChange={(e) => setText(e.target.value)}
          className="max-h-28 flex-1 resize-none rounded-2xl border border-black/10 bg-background px-4 py-2.5 text-base outline-none focus:border-brand dark:border-white/10"
        />
        <button
          type="button"
          onClick={submit}
          disabled={busy || (!text.trim() && !file)}
          aria-label={t("send")}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-lg text-white shadow active:scale-95 disabled:opacity-40"
        >
          {busy ? "…" : "➤"}
        </button>
      </div>
    </div>
  );
}
