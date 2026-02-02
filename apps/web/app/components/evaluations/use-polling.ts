import { useEffect } from "react";
import {
  getMyProofProfiles,
  getMyAttempts,
  type ProofProfileWithRole,
  type AttemptWithMeta,
} from "~/components/lib/api";

/**
 * Polls for proof profile updates when there are pending evaluations.
 * Uses exponential backoff (5s → 60s max).
 */
export function useEvaluationPolling(
  hasPending: boolean,
  onUpdate: (
    profiles: ProofProfileWithRole[],
    attempts: AttemptWithMeta[],
  ) => void,
) {
  useEffect(() => {
    if (!hasPending) return;

    let cancelled = false;
    let delay = 5_000;
    const maxDelay = 60_000;
    let timeoutId: NodeJS.Timeout;

    const poll = async () => {
      try {
        const [profilesRes, attemptsRes] = await Promise.all([
          getMyProofProfiles(),
          getMyAttempts(),
        ]);
        if (cancelled) return;
        onUpdate(profilesRes.proof_profiles, attemptsRes.attempts);
      } catch {
        // Ignore errors, will retry
      }

      if (!cancelled) {
        delay = Math.min(delay * 1.5, maxDelay);
        timeoutId = setTimeout(poll, delay);
      }
    };

    timeoutId = setTimeout(poll, delay);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [hasPending]);
}
