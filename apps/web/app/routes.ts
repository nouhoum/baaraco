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
    // Auth pages
    route(":lang/login", "routes/_lang.login.tsx"),
    route(":lang/login/check-email", "routes/_lang.login.check-email.tsx"),
  ]),

  // Auth callback (no lang prefix needed - comes from email link)
  route("auth/callback", "routes/auth.callback.tsx"),

  // Invite accept page
  route("invites/accept", "routes/invites.accept.tsx"),

  // Onboarding (minimal layout - no sidebar/nav)
  layout("routes/_onboarding.tsx", [
    route("app/onboarding", "routes/_app.onboarding.tsx"),
  ]),

  // App routes (Internal application - protected, with full layout)
  layout("routes/_app.tsx", [
    route("app/proof-profile", "routes/_app.proof-profile.tsx"),
    route("app/outcome-brief", "routes/_app.outcome-brief.tsx"),
    route("app/scorecard", "routes/_app.scorecard.tsx"),
    route("app/work-sample", "routes/_app.work-sample.tsx"),
    route("app/interview-kit", "routes/_app.interview-kit.tsx"),
    route("app/decision-memo", "routes/_app.decision-memo.tsx"),
  ]),
] satisfies RouteConfig;
