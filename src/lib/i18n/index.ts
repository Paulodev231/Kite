// Translations for the whole app — every screen a person can open, including
// the Admin Panel and the Handle Console.
//
// The language follows the phone automatically; anyone can override it from
// their dashboard. Add a key to `en` first: the other languages are typed
// `Record<TranslationKey, string>`, so a missing translation is a build error.
import { en } from "./en";
import { fr } from "./fr";
import { es } from "./es";
import { pt } from "./pt";
import { ar } from "./ar";

export const LANGUAGES = [
  { code: "en", label: "English", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "fr", label: "Fran\u00e7ais", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "es", label: "Espa\u00f1ol", flag: "\u{1F1EA}\u{1F1F8}" },
  { code: "pt", label: "Portugu\u00eas", flag: "\u{1F1F5}\u{1F1F9}" },
  { code: "ar", label: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629", flag: "\u{1F1F8}\u{1F1E6}" },
] as const;

export type Lang = (typeof LANGUAGES)[number]["code"];
export type TranslationKey = keyof typeof en;

/** Values substituted into a translation, written as {name} in the text. */
export type TranslationParams = Record<string, string | number>;

/** Arabic is written right-to-left; the layout flips for it. */
export function isRtl(lang: Lang): boolean {
  return lang === "ar";
}

const DICTIONARIES: Record<Lang, Record<TranslationKey, string>> = { en, fr, es, pt, ar };

/** Reads the phone's language, falling back to English for anything else. */
export function detectLanguage(): Lang {
  if (typeof navigator === "undefined") return "en";
  for (const tag of navigator.languages ?? [navigator.language]) {
    const base = tag?.toLowerCase().split("-")[0];
    if (LANGUAGES.some((l) => l.code === base)) return base as Lang;
  }
  return "en";
}

export function translate(
  lang: Lang,
  key: TranslationKey,
  params?: TranslationParams,
): string {
  let text: string = DICTIONARIES[lang]?.[key] ?? en[key];
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.split(`{${name}}`).join(String(value));
    }
  }
  return text;
}

/** Translation key for each role, so every screen names them identically. */
export const ROLE_KEYS = {
  member: "roleMember",
  staff: "roleStaff",
  admin: "roleAdmin",
  superadmin: "roleSuperadmin",
} as const satisfies Record<string, TranslationKey>;

/** Translation key for each milestone status. */
export const MILESTONE_STATUS_KEYS = {
  planned: "msPlanned",
  in_progress: "msInProgress",
  blocked: "msBlocked",
  completed: "msCompleted",
} as const satisfies Record<string, TranslationKey>;
