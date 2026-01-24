import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  // Redirect root to default language
  index("routes/_index.tsx"),

  // Language-prefixed routes
  layout("routes/_lang.tsx", [
    route(":lang", "routes/_lang._index.tsx"),
    route(":lang/candidates", "routes/_lang.candidates.tsx"),
    route(":lang/pilot", "routes/_lang.pilot.tsx"),
    route(":lang/thank-you", "routes/_lang.thank-you.tsx"),
  ]),
] satisfies RouteConfig;
