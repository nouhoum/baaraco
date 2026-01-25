import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  // Redirect root to default language
  index("routes/_index.tsx"),

  // Language-prefixed routes (Marketing site)
  layout("routes/_lang.tsx", [
    route(":lang", "routes/_lang._index.tsx"),
    route(":lang/candidates", "routes/_lang.candidates.tsx"),
    route(":lang/pilot", "routes/_lang.pilot.tsx"),
    route(":lang/thank-you", "routes/_lang.thank-you.tsx"),
  ]),

  // App routes (Internal application)
  layout("routes/_app.tsx", [
    route("app/outcome-brief", "routes/_app.outcome-brief.tsx"),
    route("app/scorecard", "routes/_app.scorecard.tsx"),
    route("app/work-sample", "routes/_app.work-sample.tsx"),
    route("app/interview-kit", "routes/_app.interview-kit.tsx"),
    route("app/decision-memo", "routes/_app.decision-memo.tsx"),
  ]),
] satisfies RouteConfig;
