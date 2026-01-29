import { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router";
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
// ICONS
// =============================================================================

function FileTextIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4M19 17v4M3 5h4M17 19h4" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RocketIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ZapIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function getScoreColor(score: number): { bg: string; color: string } {
  if (score >= 80) return { bg: "success.subtle", color: "success" };
  if (score >= 60) return { bg: "warning.subtle", color: "warning" };
  return { bg: "error.subtle", color: "error" };
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "strong": return "Excellent";
    case "good": return "Bon";
    case "acceptable": return "Acceptable";
    case "weak": return "À améliorer";
    default: return status;
  }
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

function getRecommendationConfig(rec: string): { bg: string; color: string; label: string } {
  switch (rec) {
    case "proceed_to_interview":
      return { bg: "success.subtle", color: "success", label: "Entretien recommandé" };
    case "maybe":
      return { bg: "warning.subtle", color: "warning", label: "À approfondir" };
    case "do_not_proceed":
      return { bg: "error.subtle", color: "error", label: "Non recommandé" };
    default:
      return { bg: "bg.muted", color: "text.muted", label: rec };
  }
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

type PageState = "not_started" | "in_progress" | "pending_evaluation" | "profile_ready";

export default function ProofProfilePage({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const { user } = useOutletContext<OutletContextType>();

  const [pageState, setPageState] = useState<PageState>(loaderData.initialPageState);
  const [attempt, setAttempt] = useState<WorkSampleAttempt | null>(loaderData.attempt);
  const [profile, setProfile] = useState<ProofProfile | null>(loaderData.profile);

  const firstName = user?.name?.split(" ")[0] || loaderData.user?.name?.split(" ")[0] || "Candidat";

  // Client-side polling for pending evaluation
  useEffect(() => {
    if (pageState !== "pending_evaluation") return;

    let cancelled = false;

    const pollForProfile = async () => {
      try {
        const profileRes = await getMyProofProfile();
        if (cancelled) return;
        setProfile(profileRes.proof_profile);
        setPageState("profile_ready");
      } catch {
        if (cancelled) return;
        // Profile not ready yet, keep polling
      }
    };

    const timer = setInterval(pollForProfile, 10_000);

    return () => {
      cancelled = true;
      clearInterval(timer);
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
              <Box color="success"><CheckCircleIcon /></Box>
            </Circle>
            <Text fontSize="xs" fontWeight="semibold" color="success" textTransform="uppercase" letterSpacing="wider">
              Étape 2 sur 2 — Terminé
            </Text>
          </Flex>
          <Heading as="h1" fontSize="2xl" fontWeight="semibold" color="text" mb={2}>
            {firstName}, votre Proof Profile est prêt
          </Heading>
          <Text fontSize="md" color="text.secondary" maxW="560px">
            {profile.one_liner}
          </Text>
        </Box>

        {/* Progress */}
        <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" p={5} mb={6}>
          <Flex justify="space-between" align="center" mb={3}>
            <Text fontSize="sm" fontWeight="semibold" color="text">Votre progression</Text>
            <Text fontSize="sm" color="success">100% complété</Text>
          </Flex>
          <Progress.Root value={100} size="sm" colorPalette="green">
            <Progress.Track bg="bg.muted" borderRadius="full">
              <Progress.Range borderRadius="full" />
            </Progress.Track>
          </Progress.Root>
          <Flex mt={4} gap={6}>
            <Flex align="center" gap={2}>
              <Circle size="20px" bg="success" color="white"><CheckCircleIcon /></Circle>
              <Text fontSize="sm" color="text" fontWeight="medium">Work Sample</Text>
            </Flex>
            <Flex align="center" gap={2}>
              <Circle size="20px" bg="success" color="white"><CheckCircleIcon /></Circle>
              <Text fontSize="sm" color="text" fontWeight="medium">Proof Profile généré</Text>
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
              Score global : {profile.score_label}
            </Heading>
            <Flex justify="center" gap={3} mt={3}>
              <Badge bg={recConfig.bg} color={recConfig.color} fontSize="sm" fontWeight="semibold" px={3} py={1} borderRadius="full">
                {recConfig.label}
              </Badge>
              {profile.percentile > 0 && (
                <Badge bg="bg.muted" color="text.secondary" fontSize="sm" px={3} py={1} borderRadius="full">
                  Top {100 - profile.percentile}%
                </Badge>
              )}
            </Flex>
          </Box>
        </Box>

        {/* Criteria */}
        {profile.criteria_summary.length > 0 && (
          <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" p={6} mb={6}>
            <Heading as="h3" fontSize="md" fontWeight="semibold" color="text" mb={4}>
              Évaluation par critère
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
            <Heading as="h3" fontSize="md" fontWeight="semibold" color="text" mb={4}>Points forts</Heading>
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
            <Heading as="h3" fontSize="md" fontWeight="semibold" color="text" mb={4}>Axes d'amélioration</Heading>
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
              <Box color="ai.text"><SparklesIcon /></Box>
            </Circle>
            <Text fontSize="xs" fontWeight="semibold" color="ai.text" textTransform="uppercase" letterSpacing="wider">
              En cours de génération
            </Text>
          </Flex>
          <Heading as="h1" fontSize="2xl" fontWeight="semibold" color="text" mb={2}>
            {firstName}, votre Proof Profile est en cours de génération
          </Heading>
          <Text fontSize="md" color="text.secondary" maxW="560px">
            Notre IA analyse votre Work Sample. Cela peut prendre quelques minutes.
          </Text>
        </Box>

        <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" p={5} mb={6}>
          <Flex justify="space-between" align="center" mb={3}>
            <Text fontSize="sm" fontWeight="semibold" color="text">Votre progression</Text>
            <Text fontSize="sm" color="text.secondary">50% complété</Text>
          </Flex>
          <Progress.Root value={50} size="sm" colorPalette="blue">
            <Progress.Track bg="bg.muted" borderRadius="full">
              <Progress.Range borderRadius="full" />
            </Progress.Track>
          </Progress.Root>
          <Flex mt={4} gap={6}>
            <Flex align="center" gap={2}>
              <Circle size="20px" bg="success" color="white"><CheckCircleIcon /></Circle>
              <Text fontSize="sm" color="text" fontWeight="medium">Work Sample</Text>
            </Flex>
            <Flex align="center" gap={2}>
              <Circle size="20px" bg="ai.bg" color="ai.text" border="2px solid" borderColor="ai.border">
                <SparklesIcon />
              </Circle>
              <Text fontSize="sm" color="ai.text" fontWeight="medium">Proof Profile en cours...</Text>
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
              Analyse en cours
            </Heading>
            <Text fontSize="sm" color="text.secondary" maxW="400px" mx="auto">
              Votre Work Sample est en train d'être évalué. Votre Proof Profile sera disponible sous peu.
              Vous pouvez quitter cette page, vous serez notifié quand ce sera prêt.
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
            <Box color="primary"><RocketIcon /></Box>
          </Circle>
          <Text fontSize="xs" fontWeight="semibold" color="primary" textTransform="uppercase" letterSpacing="wider">
            Étape 1 sur 2
          </Text>
        </Flex>
        <Heading as="h1" fontSize="2xl" fontWeight="semibold" color="text" mb={2}>
          {firstName}, construisez votre Proof Profile
        </Heading>
        <Text fontSize="md" color="text.secondary" maxW="560px">
          Montrez ce que vous savez vraiment faire. En 45 minutes, démontrez vos compétences sur un cas réel.
        </Text>
      </Box>

      <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" p={5} mb={6}>
        <Flex justify="space-between" align="center" mb={3}>
          <Text fontSize="sm" fontWeight="semibold" color="text">Votre progression</Text>
          <Text fontSize="sm" color="text.secondary">
            {isInProgress ? `${progressPercent}% complété` : "0% complété"}
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
            <Text fontSize="sm" color="text" fontWeight="medium">Work Sample</Text>
          </Flex>
          <Flex align="center" gap={2}>
            <Circle size="20px" bg="bg.muted" color="text.muted" fontSize="xs" fontWeight="bold" border="2px solid" borderColor="border">2</Circle>
            <Text fontSize="sm" color="text.muted">Proof Profile généré</Text>
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
            <Box color="primary"><FileTextIcon /></Box>
          </Circle>
          <Heading as="h2" fontSize="xl" fontWeight="semibold" color="text" mb={2}>
            {isInProgress ? "Continuez votre Work Sample" : "Commencez par le Work Sample"}
          </Heading>
          <Text fontSize="sm" color="text.secondary">
            {isInProgress
              ? `Vous avez complété ${progressPercent}% — reprenez là où vous en étiez`
              : "Un exercice technique de 45 minutes pour révéler votre potentiel"}
          </Text>
        </Box>

        <Box p={8}>
          <Stack gap={6} align="center" textAlign="center">
            <Flex gap={4} flexWrap="wrap" justify="center">
              <Flex align="center" gap={2} bg="bg.subtle" px={4} py={2} borderRadius="full" border="1px solid" borderColor="border.subtle">
                <Box color="text.secondary"><ClockIcon /></Box>
                <Text fontSize="sm" fontWeight="medium" color="text.secondary">~45 minutes</Text>
              </Flex>
              <Flex align="center" gap={2} bg="bg.subtle" px={4} py={2} borderRadius="full" border="1px solid" borderColor="border.subtle">
                <Box color="text.secondary"><ZapIcon /></Box>
                <Text fontSize="sm" fontWeight="medium" color="text.secondary">Résultat instantané</Text>
              </Flex>
            </Flex>

            {!isInProgress && (
              <Box bg="bg.subtle" borderRadius="xl" p={5} w="100%" maxW="420px" border="1px solid" borderColor="border.subtle">
                <Flex align="center" gap={2} mb={4}>
                  <Box color="text.secondary"><TargetIcon /></Box>
                  <Text fontSize="sm" fontWeight="semibold" color="text">Ce que vous allez démontrer</Text>
                </Flex>
                <Stack gap={3}>
                  {[
                    "Votre capacité à résoudre des problèmes réels",
                    "La qualité et la clarté de votre code",
                    "Votre réflexion technique et vos choix d'architecture",
                    "Votre efficacité dans un contexte réaliste",
                  ].map((item, i) => (
                    <Flex key={i} align="center" gap={3}>
                      <Circle size="24px" bg="success.subtle" color="success" flexShrink={0}><CheckCircleIcon /></Circle>
                      <Text fontSize="sm" color="text.secondary" textAlign="left">{item}</Text>
                    </Flex>
                  ))}
                </Stack>
              </Box>
            )}

            <Flex align="center" gap={2} bg="ai.bg" px={4} py={2} borderRadius="full" border="1px solid" borderColor="ai.border">
              <Box color="ai.text"><SparklesIcon /></Box>
              <Text fontSize="xs" fontWeight="medium" color="ai.text">
                Votre Proof Profile sera généré automatiquement par IA
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
                <Text>{isInProgress ? "Reprendre le Work Sample" : "Commencer le Work Sample"}</Text>
                <ArrowRightIcon />
              </Flex>
            </Button>

            <Text fontSize="xs" color="text.muted">
              Vous pouvez faire une pause et reprendre à tout moment
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
              <Text fontSize="sm" fontWeight="semibold" color="text" mb={1}>Pourquoi un Work Sample ?</Text>
              <Text fontSize="sm" color="text.secondary" lineHeight="1.6">
                Les Work Samples permettent d'évaluer vos compétences sur des cas concrets,
                similaires à ce que vous ferez dans votre futur poste. C'est plus fiable qu'un CV
                et plus équitable qu'un entretien classique.
              </Text>
            </Box>
          </Flex>
        </Box>
      )}
    </Box>
  );
}
