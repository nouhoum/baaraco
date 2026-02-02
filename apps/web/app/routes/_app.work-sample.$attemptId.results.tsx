import { redirect, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import {
  Box,
  Heading,
  Text,
  Stack,
  Flex,
  Button,
  Circle,
  Badge,
} from "@chakra-ui/react";
import { requireRole } from "~/components/lib/auth.server";
import { authenticatedFetch } from "~/components/lib/api.server";
import type {
  AttemptWithMeta,
  ProofProfileWithRole,
} from "~/components/lib/api";
import { ProofProfileDetail } from "~/components/evaluations/proof-profile-detail";
import { PendingEvaluationCard } from "~/components/evaluations/pending-evaluation-card";
import { useEvaluationPolling } from "~/components/evaluations/use-polling";
import {
  getRoleIcon,
  buildRoleEntries,
  type RoleEntry,
} from "~/components/evaluations/role-helpers";
import type { Route } from "./+types/_app.work-sample.$attemptId.results";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Résultats - Baara" }];
};

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireRole(request, ["candidate"]);
  const { attemptId } = params;

  let attempts: AttemptWithMeta[] = [];
  let proofProfiles: ProofProfileWithRole[] = [];

  try {
    const attemptsRes = await authenticatedFetch(
      request,
      "/api/v1/work-sample-attempts/mine",
    );
    if (attemptsRes.ok) {
      const data = await attemptsRes.json();
      attempts = data.attempts ?? [];
    }
  } catch {}

  try {
    const profilesRes = await authenticatedFetch(
      request,
      "/api/v1/proof-profiles/mine",
    );
    if (profilesRes.ok) {
      const data = await profilesRes.json();
      proofProfiles = data.proof_profiles ?? [];
    }
  } catch {}

  // Find the specific attempt
  const attempt = attempts.find((a) => a.attempt.id === attemptId);
  if (!attempt) {
    throw redirect("/app/work-sample");
  }

  // Find matching profile
  const profile =
    proofProfiles.find((p) => p.profile.attempt_id === attemptId) ?? null;

  return {
    attempt,
    profile,
    allAttempts: attempts,
    allProfiles: proofProfiles,
  };
}

export default function EvaluationResults({
  loaderData,
}: Route.ComponentProps) {
  const { t } = useTranslation("app");
  const navigate = useNavigate();
  const { attempt, allAttempts, allProfiles } = loaderData;

  // Build role entries for polling
  const [roleEntries, setRoleEntries] = useState<RoleEntry[]>(() =>
    buildRoleEntries(allAttempts, allProfiles),
  );

  // Find the current entry for this attempt
  const currentEntry = roleEntries.find(
    (e) => e.attemptId === attempt.attempt.id,
  );
  const profile = currentEntry?.profile ?? loaderData.profile?.profile ?? null;
  const isPending = currentEntry?.state === "pending_evaluation";

  // Poll when pending
  useEvaluationPolling(isPending, (profiles, attempts) => {
    setRoleEntries(buildRoleEntries(attempts, profiles));
  });

  const roleType = attempt.role_type || "";
  const Icon = getRoleIcon(roleType);
  const roleLabel = roleType
    ? t(`onboarding.roles.${roleType}.label`, {
        defaultValue: t(`layout.roleType.${roleType}`, {
          defaultValue: roleType,
        }),
      })
    : t("evaluations.generalEvaluation");

  return (
    <Box py={8} px={8} maxW="800px" mx="auto">
      <Stack gap={6}>
        {/* Back link */}
        <Button
          onClick={() => navigate("/app/work-sample")}
          variant="ghost"
          size="sm"
          px={0}
          color="text.secondary"
          _hover={{ color: "text" }}
          alignSelf="flex-start"
        >
          <Flex align="center" gap={2}>
            <ArrowLeft size={16} />
            <Text fontSize="sm">{t("layout.workSample")}</Text>
          </Flex>
        </Button>

        {/* Role header */}
        <Flex align="center" gap={3}>
          <Circle size="40px" bg="primary.subtle" color="primary">
            <Icon size={20} />
          </Circle>
          <Heading as="h1" fontSize="2xl" fontWeight="semibold" color="text">
            {roleLabel}
          </Heading>
          {profile && (
            <Badge
              bg="success.subtle"
              color="success"
              fontSize="xs"
              px={2}
              py={0.5}
              borderRadius="full"
              fontWeight="semibold"
              ml="auto"
            >
              {t("proofProfile.profileReady.step")}
            </Badge>
          )}
          {isPending && (
            <Badge
              bg="ai.bg"
              color="ai.text"
              fontSize="xs"
              px={2}
              py={0.5}
              borderRadius="full"
              fontWeight="semibold"
              ml="auto"
            >
              <Flex align="center" gap={1}>
                <Sparkles size={12} />
                {t("proofProfile.generating")}
              </Flex>
            </Badge>
          )}
        </Flex>

        {/* Content */}
        {profile && <ProofProfileDetail profile={profile} t={t} />}
        {isPending && <PendingEvaluationCard t={t} />}
      </Stack>
    </Box>
  );
}
