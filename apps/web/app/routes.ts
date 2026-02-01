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
    // Evaluate (autonomous candidate flow)
    route(":lang/evaluate", "routes/_lang.evaluate.tsx"),
    route(":lang/evaluate/:roleType", "routes/_lang.evaluate.$roleType.tsx"),
    // Auth pages
    route(":lang/login", "routes/_lang.login.tsx"),
    route(":lang/login/check-email", "routes/_lang.login.check-email.tsx"),
  ]),

  // Public proof profile (no auth needed, no lang prefix)
  route("proof/:slug", "routes/proof.$slug.tsx"),

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
    route("app/profile", "routes/_app.profile.tsx"),
    route("app/proof-profile", "routes/_app.proof-profile.tsx"),
    route("app/talent-pool", "routes/_app.talent-pool.tsx"),
    route("app/work-sample", "routes/_app.work-sample.tsx"),
    route("app/format-requests", "routes/_app.format-requests.tsx"),
    // Job management routes (recruiters)
    route("app/jobs", "routes/_app.jobs.tsx"),
    route("app/jobs/new", "routes/_app.jobs.new.tsx"),
    route("app/jobs/:id/edit", "routes/_app.jobs.edit.tsx"),
    route("app/jobs/:id/candidates", "routes/_app.jobs.candidates.tsx"),
    route(
      "app/jobs/:id/candidates/:candidateId",
      "routes/_app.jobs.$id.candidates.$candidateId.tsx",
    ),
    route(
      "app/jobs/:id/candidates/:candidateId/interview-kit",
      "routes/_app.jobs.$id.candidates.$candidateId.interview-kit.tsx",
    ),
    route(
      "app/jobs/:id/candidates/:candidateId/decision",
      "routes/_app.jobs.$id.candidates.$candidateId.decision.tsx",
    ),
    route("app/jobs/:id/invite", "routes/_app.jobs.invite.tsx"),
    // Settings
    route("app/settings", "routes/_app.settings.tsx"),
    // Admin routes
    route("app/admin", "routes/_app.admin._index.tsx"),
    route("app/admin/pilot-requests", "routes/_app.admin.pilot-requests.tsx"),
    route(
      "app/admin/pilot-requests/:id",
      "routes/_app.admin.pilot-requests.$id.tsx",
    ),
  ]),
] satisfies RouteConfig;
