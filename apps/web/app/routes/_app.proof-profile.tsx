import { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router";
import { FileText, ArrowRight, Sparkles, CheckCircle, Rocket, Target, Clock, Zap } from "lucide-react";
import {
  Box,
  Heading,
  Text,
  Stack,
  Flex,
  Button,
  Circle,
  Progress,
  Spinner,
  Badge,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import {
  getMyWorkSampleAttempt,
  getMyProofProfile,
  type User,
  type WorkSampleAttempt,
  type ProofProfile,
} from "~/components/lib/api";
import { requireRole } from "~/components/lib/auth.server";
import { authenticatedFetch } from "~/components/lib/api.server";
import type { Route } from "./+types/_app.proof-profile";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Proof Profile - Baara" }];
};

interface OutletContextType {
  user: User | null;
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireRole(request, ["candidate"]);

  // Load attempt
  let attempt: WorkSampleAttempt | null = null;
  let profile: ProofProfile | null = null;
  let pageState: "not_started" | "in_progress" | "pending_evaluation" | "profile_ready" = "not_started";

  try {
    const attemptRes = await authenticatedFetch(request, "/api/v1/work-sample-attempts/me");
    if (attemptRes.ok) {
      const attemptData = await attemptRes.json();
      attempt = attemptData.attempt;

      if (attempt) {
        if (attempt.status === "draft") {
          pageState = "not_started";
        } else if (attempt.status === "in_progress") {
          pageState = "in_progress";
        } else if (attempt.status === "submitted" || attempt.status === "reviewed") {
          // Try to load proof profile
          try {
            const profileRes = await authenticatedFetch(request, "/api/v1/proof-profiles/me");
            if (profileRes.ok) {
              const profileData = await profileRes.json();
              profile = profileData.proof_profile;
              pageState = "profile_ready";
            } else {
              pageState = "pending_evaluation";
            }
          } catch {
            pageState = "pending_evaluation";
          }
        }
      }
    }
  } catch {
    // Attempt doesn't exist yet
  }

  return { user, attempt, profile, initialPageState: pageState };
}

// =============================================================================
// HELPERS
// =============================================================================

function getScoreColor(score: number): { bg: string; color: string } {
  if (score >= 80) return { bg: "success.subtle", color: "success" };
  if (score >= 60) return { bg: "warning.subtle", color: "warning" };
  return { bg: "error.subtle", color: "error" };
}

function getStatusColor(status: string): string {
  switch (status) {
    case "strong":
    case "good": return "success";
    case "acceptable": return "warning";
    case "weak": return "error";
    default: return "text.muted";
  }
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

type PageState = "not_started" | "in_progress" | "pending_evaluation" | "profile_ready";

export default function ProofProfilePage({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation("app");
  const navigate = useNavigate();
  const { user } = useOutletContext<OutletContextType>();

  const [pageState, setPageState] = useState<PageState>(loaderData.initialPageState);
  const [attempt, setAttempt] = useState<WorkSampleAttempt | null>(loaderData.attempt);
  const [profile, setProfile] = useState<ProofProfile | null>(loaderData.profile);

  const firstName = user?.name?.split(" ")[0] || loaderData.user?.name?.split(" ")[0] || t("proofProfile.fallbackName");

  // Helper using t()
  const getStatusLabel = (status: string): string => {
    return t(`proofProfile.status.${status}`, { defaultValue: status });
  };

  const getRecommendationConfig = (rec: string): { bg: string; color: string; label: string } => {
    switch (rec) {
      case "proceed_to_interview":
        return { bg: "success.subtle", color: "success", label: t("proofProfile.recommendation.proceed_to_interview") };
      case "maybe":
        return { bg: "warning.subtle", color: "warning", label: t("proofProfile.recommendation.maybe") };
      case "do_not_proceed":
        return { bg: "error.subtle", color: "error", label: t("proofProfile.recommendation.do_not_proceed") };
      default:
        return { bg: "bg.muted", color: "text.muted", label: rec };
    }
  };

  // Client-side polling for pending evaluation with exponential backoff
  useEffect(() => {
    if (pageState !== "pending_evaluation") return;

    let cancelled = false;
    let delay = 5_000; // Start at 5s
    const maxDelay = 60_000; // Cap at 60s
    let timeoutId: NodeJS.Timeout;

    const pollForProfile = async () => {
      try {
        const profileRes = await getMyProofProfile();
        if (cancelled) return;
        setProfile(profileRes.proof_profile);
        setPageState("profile_ready");
        return; // Stop polling
      } catch {
        if (cancelled) return;
        // Profile not ready yet — schedule next poll with backoff
        delay = Math.min(delay * 1.5, maxDelay);
        timeoutId = setTimeout(pollForProfile, delay);
      }
    };

    // First poll
    timeoutId = setTimeout(pollForProfile, delay);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [pageState]);

  // ==========================================================================
  // PROFILE READY
  // ==========================================================================
  if (pageState === "profile_ready" && profile) {
    const scoreColor = getScoreColor(profile.global_score);
    const recConfig = getRecommendationConfig(profile.recommendation);

    return (
      <Box py={8} px={8} maxW="800px" mx="auto">
        <Box mb={8}>
          <Flex align="center" gap={2} mb={3}>
            <Circle size="28px" bg="success.subtle">
              <Box color="success"><CheckCircle size={16} strokeWidth={2.5} /></Box>
            </Circle>
            <Text fontSize="xs" fontWeight="semibold" color="success" textTransform="uppercase" letterSpacing="wider">
              {t("proofProfile.profileReady.step")}
            </Text>
          </Flex>
          <Heading as="h1" fontSize="2xl" fontWeight="semibold" color="text" mb={2}>
            {t("proofProfile.profileReady.heading", { name: firstName })}
          </Heading>
          <Text fontSize="md" color="text.secondary" maxW="560px">
            {profile.one_liner}
          </Text>
        </Box>

        {/* Progress */}
        <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" p={5} mb={6}>
          <Flex justify="space-between" align="center" mb={3}>
            <Text fontSize="sm" fontWeight="semibold" color="text">{t("proofProfile.profileReady.progress")}</Text>
            <Text fontSize="sm" color="success">{t("proofProfile.profileReady.progressComplete")}</Text>
          </Flex>
          <Progress.Root value={100} size="sm" colorPalette="green">
            <Progress.Track bg="bg.muted" borderRadius="full">
              <Progress.Range borderRadius="full" />
            </Progress.Track>
          </Progress.Root>
          <Flex mt={4} gap={6}>
            <Flex align="center" gap={2}>
              <Circle size="20px" bg="success" color="white"><CheckCircle size={16} strokeWidth={2.5} /></Circle>
              <Text fontSize="sm" color="text" fontWeight="medium">{t("proofProfile.profileReady.stepWorkSample")}</Text>
            </Flex>
            <Flex align="center" gap={2}>
              <Circle size="20px" bg="success" color="white"><CheckCircle size={16} strokeWidth={2.5} /></Circle>
              <Text fontSize="sm" color="text" fontWeight="medium">{t("proofProfile.profileReady.stepProfileGenerated")}</Text>
            </Flex>
          </Flex>
        </Box>

        {/* Score card */}
        <Box bg="surface" borderRadius="2xl" border="1px solid" borderColor="border" shadow="card" overflow="hidden" mb={6}>
          <Box
            bg="linear-gradient(135deg, var(--chakra-colors-primary-subtle) 0%, var(--chakra-colors-ai-bg) 100%)"
            py={8} px={6} textAlign="center"
          >
            <Circle size="80px" bg={scoreColor.bg} mx="auto" mb={4}>
              <Text fontSize="2xl" fontWeight="bold" color={scoreColor.color}>{profile.global_score}</Text>
            </Circle>
            <Heading as="h2" fontSize="xl" fontWeight="semibold" color="text" mb={2}>
              {t("proofProfile.profileReady.overallScore", { label: profile.score_label })}
            </Heading>
            <Flex justify="center" gap={3} mt={3}>
              <Badge bg={recConfig.bg} color={recConfig.color} fontSize="sm" fontWeight="semibold" px={3} py={1} borderRadius="full">
                {recConfig.label}
              </Badge>
              {profile.percentile > 0 && (
                <Badge bg="bg.muted" color="text.secondary" fontSize="sm" px={3} py={1} borderRadius="full">
                  {t("proofProfile.profileReady.topPercent", { percent: 100 - profile.percentile })}
                </Badge>
              )}
            </Flex>
          </Box>
        </Box>

        {/* Criteria */}
        {profile.criteria_summary.length > 0 && (
          <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" p={6} mb={6}>
            <Heading as="h3" fontSize="md" fontWeight="semibold" color="text" mb={4}>
              {t("proofProfile.profileReady.criteriaEvaluation")}
            </Heading>
            <Stack gap={3}>
              {profile.criteria_summary.map((c, i) => {
                const cColor = getScoreColor(c.score);
                return (
                  <Box key={i} bg="bg.subtle" borderRadius="lg" p={4} border="1px solid" borderColor="border.subtle">
                    <Flex justify="space-between" align="center" mb={1}>
                      <Flex align="center" gap={2}>
                        <Text fontSize="sm" fontWeight="semibold" color="text">{c.name}</Text>
                        <Badge fontSize="xs" bg={cColor.bg} color={cColor.color} px={2} py={0.5} borderRadius="full">
                          {c.score}/100
                        </Badge>
                      </Flex>
                      <Text fontSize="xs" color={getStatusColor(c.status)} fontWeight="medium">
                        {getStatusLabel(c.status)}
                      </Text>
                    </Flex>
                    <Text fontSize="sm" color="text.secondary">{c.headline}</Text>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        )}

        {/* Strengths */}
        {profile.strengths.length > 0 && (
          <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" p={6} mb={6}>
            <Heading as="h3" fontSize="md" fontWeight="semibold" color="text" mb={4}>{t("proofProfile.profileReady.strengths")}</Heading>
            <Stack gap={3}>
              {profile.strengths.map((s, i) => (
                <Box key={i} bg="success.subtle" borderRadius="lg" p={4} border="1px solid" borderColor="success.muted">
                  <Flex align="center" gap={2} mb={2}>
                    <Text fontSize="sm" fontWeight="semibold" color="text">{s.criterion_name}</Text>
                    <Badge bg="success.subtle" color="success" fontSize="xs" px={2} py={0.5} borderRadius="full">{s.score}/100</Badge>
                  </Flex>
                  <Text fontSize="sm" color="text.secondary" mb={2}>{s.evidence}</Text>
                  {s.signals.length > 0 && (
                    <Flex gap={2} flexWrap="wrap">
                      {s.signals.map((sig, j) => (
                        <Badge key={j} fontSize="xs" bg="surface" color="text.secondary" px={2} py={0.5} borderRadius="full">{sig}</Badge>
                      ))}
                    </Flex>
                  )}
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {/* Areas to explore */}
        {profile.areas_to_explore.length > 0 && (
          <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" p={6} mb={6}>
            <Heading as="h3" fontSize="md" fontWeight="semibold" color="text" mb={4}>{t("proofProfile.profileReady.areasForImprovement")}</Heading>
            <Stack gap={3}>
              {profile.areas_to_explore.map((a, i) => (
                <Box key={i} bg="warning.subtle" borderRadius="lg" p={4} border="1px solid" borderColor="warning.muted">
                  <Flex align="center" gap={2} mb={2}>
                    <Text fontSize="sm" fontWeight="semibold" color="text">{a.criterion_name}</Text>
                    <Badge bg="warning.subtle" color="warning" fontSize="xs" px={2} py={0.5} borderRadius="full">{a.score}/100</Badge>
                  </Flex>
                  {a.concerns.length > 0 && (
                    <Stack gap={1}>
                      {a.concerns.map((concern, j) => (
                        <Text key={j} fontSize="sm" color="text.secondary">• {concern}</Text>
                      ))}
                    </Stack>
                  )}
                </Box>
              ))}
            </Stack>
          </Box>
        )}
      </Box>
    );
  }

  // ==========================================================================
  // PENDING EVALUATION
  // ==========================================================================
  if (pageState === "pending_evaluation") {
    return (
      <Box py={8} px={8} maxW="800px" mx="auto">
        <Box mb={8}>
          <Flex align="center" gap={2} mb={3}>
            <Circle size="28px" bg="ai.bg">
              <Box color="ai.text"><Sparkles size={20} /></Box>
            </Circle>
            <Text fontSize="xs" fontWeight="semibold" color="ai.text" textTransform="uppercase" letterSpacing="wider">
              {t("proofProfile.pendingEvaluation.step")}
            </Text>
          </Flex>
          <Heading as="h1" fontSize="2xl" fontWeight="semibold" color="text" mb={2}>
            {t("proofProfile.pendingEvaluation.heading", { name: firstName })}
          </Heading>
          <Text fontSize="md" color="text.secondary" maxW="560px">
            {t("proofProfile.pendingEvaluation.subtitle")}
          </Text>
        </Box>

        <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" p={5} mb={6}>
          <Flex justify="space-between" align="center" mb={3}>
            <Text fontSize="sm" fontWeight="semibold" color="text">{t("proofProfile.pendingEvaluation.progress")}</Text>
            <Text fontSize="sm" color="text.secondary">{t("proofProfile.pendingEvaluation.progressPercent")}</Text>
          </Flex>
          <Progress.Root value={50} size="sm" colorPalette="blue">
            <Progress.Track bg="bg.muted" borderRadius="full">
              <Progress.Range borderRadius="full" />
            </Progress.Track>
          </Progress.Root>
          <Flex mt={4} gap={6}>
            <Flex align="center" gap={2}>
              <Circle size="20px" bg="success" color="white"><CheckCircle size={16} strokeWidth={2.5} /></Circle>
              <Text fontSize="sm" color="text" fontWeight="medium">{t("proofProfile.pendingEvaluation.stepWorkSample")}</Text>
            </Flex>
            <Flex align="center" gap={2}>
              <Circle size="20px" bg="ai.bg" color="ai.text" border="2px solid" borderColor="ai.border">
                <Sparkles size={20} />
              </Circle>
              <Text fontSize="sm" color="ai.text" fontWeight="medium">{t("proofProfile.pendingEvaluation.stepGenerating")}</Text>
            </Flex>
          </Flex>
        </Box>

        <Box bg="surface" borderRadius="2xl" border="1px solid" borderColor="border" shadow="card" overflow="hidden">
          <Box
            bg="linear-gradient(135deg, var(--chakra-colors-ai-bg) 0%, var(--chakra-colors-primary-subtle) 100%)"
            py={10} px={6} textAlign="center"
          >
            <Spinner size="xl" color="primary" mb={6} />
            <Heading as="h2" fontSize="xl" fontWeight="semibold" color="text" mb={3}>
              {t("proofProfile.pendingEvaluation.analysisTitle")}
            </Heading>
            <Text fontSize="sm" color="text.secondary" maxW="400px" mx="auto">
              {t("proofProfile.pendingEvaluation.analysisMessage")}
            </Text>
          </Box>
        </Box>
      </Box>
    );
  }

  // ==========================================================================
  // NOT STARTED / IN PROGRESS
  // ==========================================================================
  const progressPercent = attempt?.progress || 0;
  const isInProgress = pageState === "in_progress";

  return (
    <Box py={8} px={8} maxW="800px" mx="auto">
      <Box mb={8}>
        <Flex align="center" gap={2} mb={3}>
          <Circle size="28px" bg="primary.subtle">
            <Box color="primary"><Rocket size={24} /></Box>
          </Circle>
          <Text fontSize="xs" fontWeight="semibold" color="primary" textTransform="uppercase" letterSpacing="wider">
            {t("proofProfile.notStarted.step")}
          </Text>
        </Flex>
        <Heading as="h1" fontSize="2xl" fontWeight="semibold" color="text" mb={2}>
          {t("proofProfile.notStarted.heading", { name: firstName })}
        </Heading>
        <Text fontSize="md" color="text.secondary" maxW="560px">
          {t("proofProfile.notStarted.subtitle")}
        </Text>
      </Box>

      <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" p={5} mb={6}>
        <Flex justify="space-between" align="center" mb={3}>
          <Text fontSize="sm" fontWeight="semibold" color="text">{t("proofProfile.notStarted.progress")}</Text>
          <Text fontSize="sm" color="text.secondary">
            {t("proofProfile.notStarted.progressPercent", { percent: isInProgress ? progressPercent : 0 })}
          </Text>
        </Flex>
        <Progress.Root value={isInProgress ? progressPercent : 0} size="sm" colorPalette="blue">
          <Progress.Track bg="bg.muted" borderRadius="full">
            <Progress.Range borderRadius="full" />
          </Progress.Track>
        </Progress.Root>
        <Flex mt={4} gap={6}>
          <Flex align="center" gap={2}>
            <Circle size="20px" bg="primary" color="white" fontSize="xs" fontWeight="bold">1</Circle>
            <Text fontSize="sm" color="text" fontWeight="medium">{t("proofProfile.notStarted.stepWorkSample")}</Text>
          </Flex>
          <Flex align="center" gap={2}>
            <Circle size="20px" bg="bg.muted" color="text.muted" fontSize="xs" fontWeight="bold" border="2px solid" borderColor="border">2</Circle>
            <Text fontSize="sm" color="text.muted">{t("proofProfile.notStarted.stepProfileGenerated")}</Text>
          </Flex>
        </Flex>
      </Box>

      <Box bg="surface" borderRadius="2xl" border="1px solid" borderColor="border" shadow="card" overflow="hidden">
        <Box
          bg="linear-gradient(135deg, var(--chakra-colors-primary-subtle) 0%, var(--chakra-colors-ai-bg) 100%)"
          py={8} px={6} textAlign="center"
          borderBottom="1px solid" borderBottomColor="border.subtle"
        >
          <Circle size="80px" bg="surface" shadow="md" mx="auto" mb={4}>
            <Box color="primary"><FileText size={48} strokeWidth={1.5} /></Box>
          </Circle>
          <Heading as="h2" fontSize="xl" fontWeight="semibold" color="text" mb={2}>
            {isInProgress ? t("proofProfile.notStarted.continueHeading") : t("proofProfile.notStarted.startHeading")}
          </Heading>
          <Text fontSize="sm" color="text.secondary">
            {isInProgress
              ? t("proofProfile.notStarted.continueSubtitle", { percent: progressPercent })
              : t("proofProfile.notStarted.startSubtitle")}
          </Text>
        </Box>

        <Box p={8}>
          <Stack gap={6} align="center" textAlign="center">
            <Flex gap={4} flexWrap="wrap" justify="center">
              <Flex align="center" gap={2} bg="bg.subtle" px={4} py={2} borderRadius="full" border="1px solid" borderColor="border.subtle">
                <Box color="text.secondary"><Clock size={16} /></Box>
                <Text fontSize="sm" fontWeight="medium" color="text.secondary">{t("proofProfile.notStarted.duration")}</Text>
              </Flex>
              <Flex align="center" gap={2} bg="bg.subtle" px={4} py={2} borderRadius="full" border="1px solid" borderColor="border.subtle">
                <Box color="text.secondary"><Zap size={16} /></Box>
                <Text fontSize="sm" fontWeight="medium" color="text.secondary">{t("proofProfile.notStarted.instantResults")}</Text>
              </Flex>
            </Flex>

            {!isInProgress && (
              <Box bg="bg.subtle" borderRadius="xl" p={5} w="100%" maxW="420px" border="1px solid" borderColor="border.subtle">
                <Flex align="center" gap={2} mb={4}>
                  <Box color="text.secondary"><Target size={20} /></Box>
                  <Text fontSize="sm" fontWeight="semibold" color="text">{t("proofProfile.notStarted.whatYoullDemonstrate")}</Text>
                </Flex>
                <Stack gap={3}>
                  {[1, 2, 3, 4].map((i) => (
                    <Flex key={i} align="center" gap={3}>
                      <Circle size="24px" bg="success.subtle" color="success" flexShrink={0}><CheckCircle size={16} strokeWidth={2.5} /></Circle>
                      <Text fontSize="sm" color="text.secondary" textAlign="left">{t(`proofProfile.notStarted.demonstrate${i}`)}</Text>
                    </Flex>
                  ))}
                </Stack>
              </Box>
            )}

            <Flex align="center" gap={2} bg="ai.bg" px={4} py={2} borderRadius="full" border="1px solid" borderColor="ai.border">
              <Box color="ai.text"><Sparkles size={20} /></Box>
              <Text fontSize="xs" fontWeight="medium" color="ai.text">
                {t("proofProfile.notStarted.aiGenerated")}
              </Text>
            </Flex>

            <Button
              onClick={() => navigate("/app/work-sample")}
              size="lg" bg="primary" color="white" shadow="button"
              _hover={{ bg: "primary.hover", transform: "translateY(-1px)", shadow: "buttonHover" }}
              _active={{ transform: "translateY(0)" }}
              transition="all 0.2s" fontWeight="medium" h="56px" px={10} borderRadius="xl" mt={2}
            >
              <Flex align="center" gap={2}>
                <Text>{isInProgress ? t("proofProfile.notStarted.resumeButton") : t("proofProfile.notStarted.startButton")}</Text>
                <ArrowRight size={18} />
              </Flex>
            </Button>

            <Text fontSize="xs" color="text.muted">
              {t("proofProfile.notStarted.pauseNote")}
            </Text>
          </Stack>
        </Box>
      </Box>

      {!isInProgress && (
        <Box mt={6} bg="info.subtle" borderRadius="xl" border="1px solid" borderColor="info.muted" p={5}>
          <Flex gap={4} align="start">
            <Circle size="36px" bg="info.muted" flexShrink={0}>
              <Box color="info">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
              </Box>
            </Circle>
            <Box>
              <Text fontSize="sm" fontWeight="semibold" color="text" mb={1}>{t("proofProfile.notStarted.whyTitle")}</Text>
              <Text fontSize="sm" color="text.secondary" lineHeight="1.6">
                {t("proofProfile.notStarted.whyDescription")}
              </Text>
            </Box>
          </Flex>
        </Box>
      )}
    </Box>
  );
}
