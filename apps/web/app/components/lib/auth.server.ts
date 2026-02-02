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
 * Returns the default app route for a given user role.
 */
export function getDefaultRouteForRole(role: User["role"]): string {
  switch (role) {
    case "candidate":
      return "/app/work-sample";
    case "recruiter":
      return "/app/jobs";
    case "admin":
      return "/app/admin/pilot-requests";
    default:
      return "/app";
  }
}

/**
 * Requires an authenticated user with one of the specified roles.
 * Redirects to login if not authenticated, or to the user's role-appropriate
 * default page if the current route is not allowed for their role.
 */
export async function requireRole(
  request: Request,
  roles: User["role"][]
): Promise<User> {
  const user = await requireUser(request);
  if (!roles.includes(user.role)) {
    throw redirect(getDefaultRouteForRole(user.role));
  }
  return user;
}
