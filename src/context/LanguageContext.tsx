"use client";

// Picks the app's language from the phone automatically, with an optional
// manual override the member can set on their dashboard. Also flips the
// document to right-to-left for Arabic.
//
// The choice lives in a tiny store outside React and is read with
// useSyncExternalStore, so the server can render English and the browser can
// swap to the phone's language on hydration without a mismatch.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  detectLanguage,
  isRtl,
  translate,
  type Lang,
  type TranslationKey,
} from "@/lib/i18n";

const STORAGE_KEY = "kite:lang";

// The snapshot is one plain string so React can compare it cheaply:
//   "auto:fr" — following the phone, which reports French
//   "set:ar"  — the member picked Arabic themselves
type Snapshot = `auto:${Lang}` | `set:${Lang}`;

const listeners = new Set<() => void>();
let cached: Snapshot | null = null;

function compute(): Snapshot {
  let saved: Lang | null = null;
  try {
    saved = (window.localStorage.getItem(STORAGE_KEY) as Lang) || null;
  } catch {
    // Private browsing can block storage — fall back to the phone's language.
  }
  return saved ? `set:${saved}` : `auto:${detectLanguage()}`;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function getSnapshot(): Snapshot {
  cached ??= compute();
  return cached;
}

/** Server-rendered HTML is always English; the browser swaps on hydration. */
function getServerSnapshot(): Snapshot {
  return "auto:en";
}

function writeOverride(next: Lang | null) {
  try {
    if (next) window.localStorage.setItem(STORAGE_KEY, next);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {}
  cached = next ? `set:${next}` : `auto:${detectLanguage()}`;
  for (const l of listeners) l();
}

interface LanguageState {
  lang: Lang;
  /** null when following the phone; a code when the member chose one. */
  override: Lang | null;
  setOverride: (lang: Lang | null) => void;
  t: (key: TranslationKey) => string;
  rtl: boolean;
}

const LanguageContext = createContext<LanguageState>({
  lang: "en",
  override: null,
  setOverride: () => {},
  t: (key) => translate("en", key),
  rtl: false,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [mode, code] = snapshot.split(":") as ["auto" | "set", Lang];
  const lang = code;
  const override = mode === "set" ? code : null;

  // Keep <html lang> and text direction in step for screen readers and Arabic.
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isRtl(lang) ? "rtl" : "ltr";
  }, [lang]);

  const setOverride = useCallback((next: Lang | null) => writeOverride(next), []);
  const t = useCallback((key: TranslationKey) => translate(lang, key), [lang]);

  return (
    <LanguageContext.Provider value={{ lang, override, setOverride, t, rtl: isRtl(lang) }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useT() {
  return useContext(LanguageContext);
}
