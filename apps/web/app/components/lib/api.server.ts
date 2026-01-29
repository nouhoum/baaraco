import { redirect } from "react-router";
import { supportedLanguages, defaultLanguage } from "~/i18n";
import type { SupportedLanguage } from "~/i18n";

const API_URL = process.env.VITE_API_URL || "http://localhost:8080";

/**
 * Detect the user's locale from the request.
 * Checks Accept-Language header, falls back to default language.
 */
export function getLocaleFromRequest(request: Request): SupportedLanguage {
  const acceptLanguage = request.headers.get("accept-language") || "";
  for (const part of acceptLanguage.split(",")) {
    const lang = part.trim().split(";")[0].split("-")[0].toLowerCase();
    if (supportedLanguages.includes(lang as SupportedLanguage)) {
      return lang as SupportedLanguage;
    }
  }
  return defaultLanguage;
}

/**
 * Server-side fetch helper that forwards cookies from the incoming request
 * to the Go API. Used in loaders and actions (SSR context).
 */
export async function serverFetch(
  request: Request,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const cookie = request.headers.get("cookie") || "";
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
      cookie,
    },
  });
  return res;
}

/**
 * Server-side fetch that auto-redirects to login on 401.
 * Use this in loaders/actions for authenticated routes.
 */
export async function authenticatedFetch(
  request: Request,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const res = await serverFetch(request, path, init);
  if (res.status === 401) {
    const locale = getLocaleFromRequest(request);
    throw redirect(`/${locale}/login`);
  }
  return res;
}
