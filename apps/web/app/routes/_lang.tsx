import { useEffect } from "react";
import { Outlet, useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  isValidLanguage,
  defaultLanguage,
  changeLanguage,
  type SupportedLanguage,
} from "~/i18n";
import { serverFetch } from "~/components/lib/api.server";
import type { User } from "~/components/lib/api";
import type { Route } from "./+types/_lang";

export async function loader({ request }: Route.LoaderArgs) {
  let user: User | null = null;
  try {
    const res = await serverFetch(request, "/api/v1/auth/me");
    if (res.ok) {
      const data = await res.json();
      user = data.user ?? null;
    }
  } catch {
    // Not authenticated — that's fine for landing pages
  }
  return { user };
}

export default function LangLayout({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;
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

  return <Outlet context={{ lang: lang as SupportedLanguage, user }} />;
}
