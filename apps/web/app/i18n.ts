import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Import French translations
import frCommon from "./locales/fr/common.json";
import frHome from "./locales/fr/home.json";
import frCandidates from "./locales/fr/candidates.json";
import frPilot from "./locales/fr/pilot.json";
import frThankyou from "./locales/fr/thankyou.json";
import frAdmin from "./locales/fr/admin.json";
import frApp from "./locales/fr/app.json";
import frEvaluate from "./locales/fr/evaluate.json";
import frInterview from "./locales/fr/interview.json";

// Import English translations
import enCommon from "./locales/en/common.json";
import enHome from "./locales/en/home.json";
import enCandidates from "./locales/en/candidates.json";
import enPilot from "./locales/en/pilot.json";
import enThankyou from "./locales/en/thankyou.json";
import enAdmin from "./locales/en/admin.json";
import enApp from "./locales/en/app.json";
import enEvaluate from "./locales/en/evaluate.json";
import enInterview from "./locales/en/interview.json";

export const supportedLanguages = ["fr", "en"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

export const defaultLanguage: SupportedLanguage = "fr";

export const resources = {
  fr: {
    common: frCommon,
    home: frHome,
    candidates: frCandidates,
    pilot: frPilot,
    thankyou: frThankyou,
    admin: frAdmin,
    app: frApp,
    evaluate: frEvaluate,
    interview: frInterview,
  },
  en: {
    common: enCommon,
    home: enHome,
    candidates: enCandidates,
    pilot: enPilot,
    thankyou: enThankyou,
    admin: enAdmin,
    app: enApp,
    evaluate: enEvaluate,
    interview: enInterview,
  },
} as const;

// Get saved language from localStorage (client-side only)
// This ensures consistency between SSR and client initial render
function getSavedLanguage(): SupportedLanguage {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("i18nextLng");
    if (saved && supportedLanguages.includes(saved as SupportedLanguage)) {
      return saved as SupportedLanguage;
    }
  }
  return defaultLanguage;
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: defaultLanguage, // Always start with default to match SSR
    fallbackLng: defaultLanguage,
    supportedLngs: supportedLanguages,
    defaultNS: "common",
    ns: ["common", "home", "candidates", "pilot", "thankyou", "admin", "app", "evaluate", "interview"],
    interpolation: {
      escapeValue: false,
    },
  });

// After hydration, restore user's saved preference if different
if (typeof window !== "undefined") {
  const savedLang = getSavedLanguage();
  if (savedLang !== defaultLanguage) {
    // Use setTimeout to ensure this runs after React hydration
    setTimeout(() => {
      i18n.changeLanguage(savedLang);
    }, 0);
  }
}

export default i18n;

export function isValidLanguage(lang: string): lang is SupportedLanguage {
  return supportedLanguages.includes(lang as SupportedLanguage);
}

/**
 * Change the current language and persist it to localStorage
 */
export function changeLanguage(lang: SupportedLanguage): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("i18nextLng", lang);
  }
  i18n.changeLanguage(lang);
}
