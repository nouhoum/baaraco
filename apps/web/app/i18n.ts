import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import French translations
import frCommon from "./locales/fr/common.json";
import frHome from "./locales/fr/home.json";
import frCandidates from "./locales/fr/candidates.json";
import frPilot from "./locales/fr/pilot.json";
import frThankyou from "./locales/fr/thankyou.json";
import frAdmin from "./locales/fr/admin.json";

// Import English translations
import enCommon from "./locales/en/common.json";
import enHome from "./locales/en/home.json";
import enCandidates from "./locales/en/candidates.json";
import enPilot from "./locales/en/pilot.json";
import enThankyou from "./locales/en/thankyou.json";
import enAdmin from "./locales/en/admin.json";

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
  },
  en: {
    common: enCommon,
    home: enHome,
    candidates: enCandidates,
    pilot: enPilot,
    thankyou: enThankyou,
    admin: enAdmin,
  },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: defaultLanguage,
    supportedLngs: supportedLanguages,
    defaultNS: "common",
    ns: ["common", "home", "candidates", "pilot", "thankyou", "admin"],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["path", "navigator"],
      lookupFromPathIndex: 0,
    },
  });

export default i18n;

export function isValidLanguage(lang: string): lang is SupportedLanguage {
  return supportedLanguages.includes(lang as SupportedLanguage);
}
