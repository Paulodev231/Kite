"use client";

// Message input bar used by Broadcast (admins), private rooms and DMs.
// - allowMedia: photos/videos/files (Admins & Staff only, enforced again by rules)
// - allowDocs: document attachments only (standard users in DMs)
// - maxFileMB: must match the limit in storage.rules for the destination.
import { useRef, useState } from "react";
import { useT } from "@/context/LanguageContext";

// A compact set of common emojis — no external dependency, works offline and
// keeps the bundle small. Anyone can also still use their device keyboard.
const EMOJIS = [
  "😀", "😁", "😂", "🤣", "😊", "😍", "😘", "😎", "🤩", "🥳",
  "😉", "🙂", "🙃", "😇", "🤔", "🤗", "🙌", "👏", "👍", "👎",
  "👌", "🤝", "🙏", "💪", "✅", "❌", "⚠️", "❓", "❗", "💯",
  "🔥", "⭐", "🎉", "🎊", "💡", "📌", "📎", "📷", "📹", "📄",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "💔", "😢", "😭", "😡",
  "😅", "😴", "🤒", "🤯", "👀", "💬", "⏰", "💰", "🚀", "🌍",
];

export default function Composer({
  placeholder,
  allowMedia = false,
  allowDocs = false,
  maxFileMB = 50,
  onSend,
}: {
  placeholder: string;
  allowMedia?: boolean;
  allowDocs?: boolean;
  maxFileMB?: number;
  onSend: (text: string, file: File | null) => Promise<void>;
}) {
  const { t } = useT();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canAttach = allowMedia || allowDocs;

  function pickFile(f: File | null) {
    if (f && f.size > maxFileMB * 1024 * 1024) {
      setError(t("fileTooLarge", { mb: maxFileMB }));
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    setError(null);
    setFile(f);
  }

  function insertEmoji(emoji: string) {
    const el = textareaRef.current;
    if (!el) {
      setText((prev) => prev + emoji);
      return;
    }
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const next = text.slice(0, start) + emoji + text.slice(end);
    setText(next);
    // Restore focus and drop the caret just after the inserted emoji.
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  }

  async function submit() {
    const trimmed = text.trim();
    if ((!trimmed && !file) || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onSend(trimmed, file);
      setText("");
      setFile(null);
      setShowEmoji(false);
      if (fileInput.current) fileInput.current.value = "";
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      setError(code === "file-too-large" ? t("fileTooLarge", { mb: maxFileMB }) : t("sendFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-chrome border-t border-black/5 bg-surface p-2 dark:border-white/10">
      {error && (
        <p className="mb-1 rounded-xl bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-500">
          {error}
        </p>
      )}
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
      {showEmoji && (
        <div className="mb-1 grid max-h-40 grid-cols-8 gap-0.5 overflow-y-auto rounded-xl bg-background p-2 dark:bg-black/20">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => insertEmoji(emoji)}
              className="flex h-9 items-center justify-center rounded-lg text-xl active:bg-brand-soft"
            >
              {emoji}
            </button>
          ))}
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
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
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
        <button
          type="button"
          aria-label={t("addEmoji")}
          onClick={() => setShowEmoji((v) => !v)}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl active:bg-brand-soft ${
            showEmoji ? "bg-brand-soft" : ""
          }`}
        >
          😊
        </button>
        <textarea
          ref={textareaRef}
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
