import { useEffect } from "react";
import { Outlet, useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  isValidLanguage,
  defaultLanguage,
  changeLanguage,
  type SupportedLanguage,
} from "~/i18n";

export default function LangLayout() {
  const { lang } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  useEffect(() => {
    // Validate language and redirect if invalid
    if (!lang || !isValidLanguage(lang)) {
      navigate(`/${defaultLanguage}`, { replace: true });
      return;
    }

    // Change i18n language if different (and persist to localStorage)
    if (i18n.language !== lang) {
      changeLanguage(lang);
    }
  }, [lang, navigate, i18n]);

  // Don't render until language is validated
  if (!lang || !isValidLanguage(lang)) {
    return null;
  }

  return <Outlet context={{ lang: lang as SupportedLanguage }} />;
}
