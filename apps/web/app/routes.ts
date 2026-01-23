import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("pilot", "routes/pilot.tsx"),
  route("candidates", "routes/candidates.tsx"),
  route("thank-you", "routes/thank-you.tsx"),
] satisfies RouteConfig;
