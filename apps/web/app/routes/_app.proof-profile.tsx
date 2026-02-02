import { redirect } from "react-router";
import type { Route } from "./+types/_app.proof-profile";

// Redirect to the unified evaluations page
export async function loader(_args: Route.LoaderArgs) {
  throw redirect("/app/work-sample");
}

export default function ProofProfileRedirect() {
  return null;
}
