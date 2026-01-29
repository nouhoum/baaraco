import { redirect } from "react-router";
import type { User } from "./api";
import { serverFetch, getLocaleFromRequest } from "./api.server";

/**
 * Requires an authenticated user. Throws a redirect to login if not authenticated.
 * Detects the user's locale from the request to redirect to the correct language.
 * Use in loaders to protect routes.
 */
export async function requireUser(request: Request): Promise<User> {
  const res = await serverFetch(request, "/api/v1/auth/me");
  if (!res.ok) {
    const locale = getLocaleFromRequest(request);
    throw redirect(`/${locale}/login`);
  }
  const data = await res.json();
  if (!data.user) {
    const locale = getLocaleFromRequest(request);
    throw redirect(`/${locale}/login`);
  }
  return data.user as User;
}

/**
 * Requires an authenticated user with one of the specified roles.
 * Redirects to login if not authenticated, or to proof-profile if wrong role.
 */
export async function requireRole(
  request: Request,
  roles: User["role"][]
): Promise<User> {
  const user = await requireUser(request);
  if (!roles.includes(user.role)) {
    throw redirect("/app/proof-profile");
  }
  return user;
}
