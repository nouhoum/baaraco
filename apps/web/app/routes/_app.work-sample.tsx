import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Plus,
  Sparkles,
} from "lucide-react";
import {
  Box,
  Heading,
  Text,
  Stack,
  Flex,
  Grid,
  Badge,
  Button,
  Circle,
  Progress,
  Spinner,
} from "@chakra-ui/react";
import { requireRole } from "~/components/lib/auth.server";
import { authenticatedFetch } from "~/components/lib/api.server";
import type {
  ProofProfile,
  ProofProfileWithRole,
  AttemptWithMeta,
} from "~/components/lib/api";
import {
  getRoleIcon,
  getStatusBadgeProps,
  getStatusLabel,
  getScoreColor,
} from "~/components/evaluations/role-helpers";
import { useEvaluationPolling } from "~/components/evaluations/use-polling";
import type { Route } from "./+types/_app.work-sample";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Évaluations - Baara" }];
};

interface Attempt {
  id: string;
  role_type: string;
  status: "draft" | "in_progress" | "submitted" | "reviewed" | "interviewing";
  progress: number;
  submitted_at?: string;
  created_at?: string;
  template_id?: string;
}

interface Template {
  id: string;
  role_type: string;
  description?: string;
  cooldown_remaining_days?: number;
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireRole(request, ["candidate"]);

  let attempts: Attempt[] = [];
  let templates: Template[] = [];
  let proofProfiles: ProofProfileWithRole[] = [];

  try {
    const attemptsRes = await authenticatedFetch(
      request,
      "/api/v1/work-sample-attempts/mine",
    );
    if (attemptsRes.ok) {
      const data = await attemptsRes.json();
      attempts = (data.attempts ?? []).map(
        (item: { attempt: Attempt; role_type: string }) => ({
          ...item.attempt,
          role_type: item.role_type || item.attempt.role_type,
        }),
      );
    }
  } catch {}

  try {
    const templatesRes = await authenticatedFetch(
      request,
      "/api/v1/templates",
    );
    if (templatesRes.ok) {
      const data = await templatesRes.json();
      templates = data.templates ?? [];
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

  return { attempts, templates, proofProfiles };
}

export default function EvaluationsDashboard({
  loaderData,
}: Route.ComponentProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("app");
  const { attempts, templates } = loaderData;

  // Profile lookup by attempt_id
  const [profileMap, setProfileMap] = useState<Map<string, ProofProfile>>(
    () => {
      const map = new Map<string, ProofProfile>();
      for (const pp of loaderData.proofProfiles ?? []) {
        map.set(pp.profile.attempt_id, pp.profile);
      }
      return map;
    },
  );

  // Check if any finished attempts are still pending a profile
  const hasPending = attempts.some(
    (a: Attempt) =>
      (a.status === "submitted" || a.status === "reviewed") &&
      !profileMap.has(a.id),
  );

  // Poll for profile updates
  const handlePollingUpdate = useCallback(
    (profiles: ProofProfileWithRole[], _attempts: AttemptWithMeta[]) => {
      const newMap = new Map<string, ProofProfile>();
      for (const pp of profiles) {
        newMap.set(pp.profile.attempt_id, pp.profile);
      }
      setProfileMap(newMap);
    },
    [],
  );
  useEvaluationPolling(hasPending, handlePollingUpdate);

  // Filter templates that don't already have an attempt
  const startedRoleTypes = new Set(
    attempts.map((a: Attempt) => a.role_type).filter(Boolean),
  );
  const availableTemplates = templates.filter(
    (tmpl: Template) => !startedRoleTypes.has(tmpl.role_type),
  );

  const hasNothing = attempts.length === 0 && availableTemplates.length === 0;

  return (
    <Box py={8} px={8} maxW="1000px" mx="auto">
      <Stack gap={8}>
        {/* Page heading */}
        <Box>
          <Heading
            as="h1"
            fontSize="2xl"
            color="text"
            fontWeight="semibold"
            mb={1}
          >
            {t("evaluations.heading")}
          </Heading>
          <Text fontSize="sm" color="text.secondary">
            {t("evaluations.subtitle")}
          </Text>
        </Box>

        {/* Empty state */}
        {hasNothing && (
          <Box
            bg="surface"
            borderRadius="xl"
            border="1px solid"
            borderColor="border"
            p={10}
            shadow="card"
            textAlign="center"
          >
            <Stack gap={4} align="center">
              <Circle size="64px" bg="info.subtle" color="info">
                <Clock size={28} />
              </Circle>
              <Text color="text.secondary" fontSize="sm" maxW="400px">
                {t("evaluations.noEvaluations")}
              </Text>
              <Text color="text.muted" fontSize="xs">
                {t("evaluations.startFirst")}
              </Text>
            </Stack>
          </Box>
        )}

        {/* Evaluations */}
        {attempts.length > 0 && (
          <Stack gap={4}>
            <Heading
              as="h2"
              fontSize="lg"
              color="text"
              fontWeight="semibold"
            >
              {t("evaluations.myEvaluations")}
            </Heading>
            <Grid
              templateColumns={{
                base: "1fr",
                md: "repeat(2, 1fr)",
              }}
              gap={4}
            >
              {attempts.map((attempt: Attempt) => {
                const Icon = getRoleIcon(attempt.role_type);
                const isFinished =
                  attempt.status === "submitted" ||
                  attempt.status === "reviewed";
                const profile = profileMap.get(attempt.id);
                const isPending = isFinished && !profile;
                const progress = isFinished ? 100 : (attempt.progress ?? 0);

                // Completed with profile: clickable card
                if (isFinished && profile) {
                  const scoreColor = getScoreColor(profile.global_score);
                  return (
                    <Box
                      key={attempt.id}
                      bg="surface"
                      borderRadius="xl"
                      border="1px solid"
                      borderColor="border"
                      shadow="card"
                      cursor="pointer"
                      onClick={() =>
                        navigate(
                          `/app/work-sample/${attempt.id}/results`,
                        )
                      }
                      _hover={{
                        borderColor: "primary",
                        shadow: "md",
                        transform: "translateY(-1px)",
                      }}
                      _active={{ transform: "translateY(0)" }}
                      transition="all 0.15s"
                      overflow="hidden"
                    >
                      <Stack gap={0}>
                        {/* Score header */}
                        <Flex
                          align="center"
                          gap={4}
                          px={5}
                          py={4}
                          bg="bg.subtle"
                          borderBottom="1px solid"
                          borderBottomColor="border.subtle"
                        >
                          <Circle size="40px" bg={scoreColor.bg}>
                            <Text
                              fontSize="md"
                              fontWeight="bold"
                              color={scoreColor.color}
                            >
                              {profile.global_score}
                            </Text>
                          </Circle>
                          <Box flex={1}>
                            <Text
                              fontSize="sm"
                              fontWeight="semibold"
                              color="text"
                            >
                              {attempt.role_type
                                ? t(
                                    `onboarding.roles.${attempt.role_type}.label`,
                                  )
                                : t("evaluations.generalEvaluation")}
                            </Text>
                            <Text fontSize="xs" color="text.muted">
                              {profile.score_label}
                            </Text>
                          </Box>
                          <Badge
                            bg="success.subtle"
                            color="success"
                            fontSize="xs"
                            fontWeight="semibold"
                            px={2}
                            py={0.5}
                            borderRadius="full"
                          >
                            <Flex align="center" gap={1}>
                              <CheckCircle size={10} />
                              {getStatusLabel(attempt.status, t)}
                            </Flex>
                          </Badge>
                        </Flex>
                        {/* One-liner */}
                        <Box px={5} py={4}>
                          <Text
                            fontSize="sm"
                            color="text.secondary"
                            lineHeight="relaxed"
                            lineClamp={2}
                          >
                            {profile.one_liner}
                          </Text>
                          <Flex align="center" gap={1} mt={3}>
                            <Text
                              fontSize="xs"
                              color="primary"
                              fontWeight="medium"
                            >
                              {t("evaluations.viewDetails")}
                            </Text>
                            <ArrowRight
                              size={12}
                              color="var(--chakra-colors-primary)"
                            />
                          </Flex>
                        </Box>
                      </Stack>
                    </Box>
                  );
                }

                // Pending evaluation (submitted but no profile yet)
                if (isPending) {
                  return (
                    <Box
                      key={attempt.id}
                      bg="surface"
                      borderRadius="xl"
                      border="1px solid"
                      borderColor="border"
                      p={5}
                      shadow="card"
                    >
                      <Stack gap={4}>
                        <Flex justify="space-between" align="start">
                          <Flex gap={3} align="center">
                            <Circle size="40px" bg="ai.bg" color="ai.text">
                              <Sparkles size={20} />
                            </Circle>
                            <Text
                              fontSize="sm"
                              fontWeight="semibold"
                              color="text"
                            >
                              {attempt.role_type
                                ? t(
                                    `onboarding.roles.${attempt.role_type}.label`,
                                  )
                                : t("evaluations.generalEvaluation")}
                            </Text>
                          </Flex>
                          <Badge
                            bg="ai.bg"
                            color="ai.text"
                            fontSize="xs"
                            fontWeight="semibold"
                            px={3}
                            py={1}
                            borderRadius="full"
                          >
                            <Flex align="center" gap={1}>
                              <Sparkles size={10} />
                              {t("proofProfile.generating")}
                            </Flex>
                          </Badge>
                        </Flex>
                        <Flex
                          align="center"
                          gap={2}
                          bg="ai.bg"
                          px={4}
                          py={3}
                          borderRadius="lg"
                        >
                          <Spinner size="sm" color="ai.text" />
                          <Text fontSize="xs" color="ai.text">
                            {t(
                              "proofProfile.pendingEvaluation.analysisMessage",
                            )}
                          </Text>
                        </Flex>
                      </Stack>
                    </Box>
                  );
                }

                // In progress / draft
                const badgeProps = getStatusBadgeProps(attempt.status);
                return (
                  <Box
                    key={attempt.id}
                    bg="surface"
                    borderRadius="xl"
                    border="1px solid"
                    borderColor="border"
                    p={5}
                    shadow="card"
                  >
                    <Stack gap={4}>
                      <Flex justify="space-between" align="start">
                        <Flex gap={3} align="center">
                          <Circle
                            size="40px"
                            bg="primary.subtle"
                            color="primary"
                          >
                            <Icon size={20} />
                          </Circle>
                          <Text
                            fontSize="sm"
                            fontWeight="semibold"
                            color="text"
                          >
                            {attempt.role_type
                              ? t(
                                  `onboarding.roles.${attempt.role_type}.label`,
                                )
                              : t("evaluations.generalEvaluation")}
                          </Text>
                        </Flex>
                        <Badge
                          bg={badgeProps.bg}
                          color={badgeProps.color}
                          fontSize="xs"
                          fontWeight="semibold"
                          px={3}
                          py={1}
                          borderRadius="full"
                        >
                          {getStatusLabel(attempt.status, t)}
                        </Badge>
                      </Flex>

                      {/* Progress bar */}
                      <Stack gap={1.5}>
                        <Text
                          fontSize="xs"
                          color="text.muted"
                          fontWeight="medium"
                        >
                          {t("evaluations.progress", { progress })}
                        </Text>
                        <Progress.Root value={progress}>
                          <Progress.Track bg="bg.muted" borderRadius="full">
                            <Progress.Range
                              bg="primary"
                              borderRadius="full"
                            />
                          </Progress.Track>
                        </Progress.Root>
                      </Stack>

                      {/* Continue button */}
                      <Button
                        onClick={() =>
                          navigate(
                            `/app/interview?attempt=${attempt.id}`,
                          )
                        }
                        size="sm"
                        bg="primary"
                        color="white"
                        fontWeight="medium"
                        borderRadius="lg"
                        _hover={{
                          bg: "primary.hover",
                          transform: "translateY(-1px)",
                        }}
                        _active={{ transform: "translateY(0)" }}
                        transition="all 0.15s"
                      >
                        <Flex align="center" gap={2}>
                          <Text>{t("evaluations.continueButton")}</Text>
                          <ArrowRight size={14} />
                        </Flex>
                      </Button>
                    </Stack>
                  </Box>
                );
              })}
            </Grid>
          </Stack>
        )}

        {/* Available roles */}
        {availableTemplates.length > 0 && (
          <Stack gap={4}>
            <Heading
              as="h2"
              fontSize="lg"
              color="text"
              fontWeight="semibold"
            >
              {t("evaluations.availableTitle")}
            </Heading>
            <Grid
              templateColumns={{
                base: "1fr",
                md: "repeat(2, 1fr)",
              }}
              gap={4}
            >
              {availableTemplates.map((template: Template) => {
                const Icon = getRoleIcon(template.role_type);
                const inCooldown =
                  template.cooldown_remaining_days != null &&
                  template.cooldown_remaining_days > 0;

                return (
                  <Box
                    key={template.id}
                    bg="surface"
                    borderRadius="xl"
                    border="1px solid"
                    borderColor={inCooldown ? "border.subtle" : "border"}
                    p={5}
                    shadow="card"
                    opacity={inCooldown ? 0.6 : 1}
                  >
                    <Stack gap={4}>
                      <Flex gap={3} align="center">
                        <Circle
                          size="40px"
                          bg={inCooldown ? "bg.muted" : "primary.subtle"}
                          color={inCooldown ? "text.muted" : "primary"}
                        >
                          <Icon size={20} />
                        </Circle>
                        <Box>
                          <Text
                            fontSize="sm"
                            fontWeight="semibold"
                            color={inCooldown ? "text.muted" : "text"}
                          >
                            {t(
                              `onboarding.roles.${template.role_type}.label`,
                            )}
                          </Text>
                          <Text fontSize="xs" color="text.muted">
                            {template.description ||
                              t(
                                `onboarding.roles.${template.role_type}.description`,
                              )}
                          </Text>
                        </Box>
                      </Flex>

                      {inCooldown ? (
                        <Flex align="center" gap={2}>
                          <Clock size={14} />
                          <Text fontSize="xs" color="text.muted">
                            {t("evaluations.cooldownMessage", {
                              days: template.cooldown_remaining_days,
                            })}
                          </Text>
                        </Flex>
                      ) : (
                        <Button
                          onClick={() =>
                            navigate(
                              `/${i18n.language}/evaluate/${template.role_type}`,
                            )
                          }
                          size="sm"
                          bg="primary"
                          color="white"
                          fontWeight="medium"
                          borderRadius="lg"
                          _hover={{
                            bg: "primary.hover",
                            transform: "translateY(-1px)",
                          }}
                          _active={{ transform: "translateY(0)" }}
                          transition="all 0.15s"
                        >
                          <Flex align="center" gap={2}>
                            <Plus size={14} />
                            <Text>
                              {t("evaluations.startEvaluation")}
                            </Text>
                          </Flex>
                        </Button>
                      )}
                    </Stack>
                  </Box>
                );
              })}
            </Grid>
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
