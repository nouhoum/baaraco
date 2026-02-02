import { Code, Server, Activity, MoreHorizontal } from "lucide-react";
import type {
  AttemptWithMeta,
  ProofProfile,
  ProofProfileWithRole,
  WorkSampleAttempt,
} from "~/components/lib/api";

// =============================================================================
// ROLE ICONS
// =============================================================================

const ROLE_ICONS: Record<string, React.ComponentType<any>> = {
  backend_go: Code,
  infra_platform: Server,
  sre: Activity,
  other: MoreHorizontal,
};

export function getRoleIcon(roleType: string) {
  return ROLE_ICONS[roleType] || MoreHorizontal;
}

// =============================================================================
// STATUS HELPERS
// =============================================================================

export function getStatusBadgeProps(status: string) {
  switch (status) {
    case "submitted":
    case "reviewed":
      return { bg: "success.subtle", color: "success" };
    case "in_progress":
    case "interviewing":
      return { bg: "warning.subtle", color: "warning" };
    case "draft":
    default:
      return { bg: "bg.muted", color: "text.muted" };
  }
}

export function getStatusLabel(
  status: string,
  t: (key: string) => string,
): string {
  switch (status) {
    case "draft":
      return t("evaluations.statusDraft");
    case "in_progress":
      return t("evaluations.statusInProgress");
    case "interviewing":
      return t("evaluations.statusInterviewing");
    case "submitted":
      return t("evaluations.statusSubmitted");
    case "reviewed":
      return t("evaluations.statusReviewed");
    default:
      return status;
  }
}

// =============================================================================
// SCORE HELPERS
// =============================================================================

export function getScoreColor(score: number): { bg: string; color: string } {
  if (score >= 80) return { bg: "success.subtle", color: "success" };
  if (score >= 60) return { bg: "warning.subtle", color: "warning" };
  return { bg: "error.subtle", color: "error" };
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "strong":
    case "good":
      return "success";
    case "acceptable":
      return "warning";
    case "weak":
      return "error";
    default:
      return "text.muted";
  }
}

// =============================================================================
// ROLE ENTRIES (merge attempts + profiles)
// =============================================================================

export type RoleState = "profile_ready" | "pending_evaluation" | "in_progress";

export interface RoleEntry {
  roleType: string;
  state: RoleState;
  profile: ProofProfile | null;
  attempt: WorkSampleAttempt | null;
  attemptId: string | null;
}

export function buildRoleEntries(
  attempts: AttemptWithMeta[],
  proofProfiles: ProofProfileWithRole[],
): RoleEntry[] {
  const map = new Map<string, RoleEntry>();

  // Seed from proof profiles
  for (const pp of proofProfiles) {
    const key = pp.role_type || `_legacy_${pp.profile.attempt_id}`;
    map.set(key, {
      roleType: pp.role_type,
      state: "profile_ready",
      profile: pp.profile,
      attempt: null,
      attemptId: pp.profile.attempt_id,
    });
  }

  // Seed / augment from attempts
  for (const am of attempts) {
    const role = am.role_type || `_legacy_${am.attempt.id}`;
    const existing = map.get(role);

    if (existing && existing.state === "profile_ready") {
      existing.attempt = am.attempt;
      continue;
    }

    const status = am.attempt.status;

    if (status === "in_progress") {
      map.set(role, {
        roleType: am.role_type,
        state: "in_progress",
        profile: null,
        attempt: am.attempt,
        attemptId: am.attempt.id,
      });
    } else if (status === "submitted" || status === "reviewed") {
      if (!map.has(role)) {
        map.set(role, {
          roleType: am.role_type,
          state: "pending_evaluation",
          profile: null,
          attempt: am.attempt,
          attemptId: am.attempt.id,
        });
      }
    }
  }

  return Array.from(map.values());
}
