import { en, type LocaleStrings } from "./locales/en";
import { ur } from "./locales/ur";

export type SupportedLanguage = "en" | "ur";

export const LOCALES: Record<SupportedLanguage, LocaleStrings> = {
  en,
  ur,
};

let currentLanguage: SupportedLanguage = "en";

export function setLanguage(lang: SupportedLanguage): void {
  currentLanguage = lang;
  if (typeof document !== "undefined") {
    document.documentElement.dir = lang === "ur" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }
}

export function getLanguage(): SupportedLanguage {
  return currentLanguage;
}

export function t(key: keyof LocaleStrings): string {
  return LOCALES[currentLanguage][key] || LOCALES.en[key] || key;
}
