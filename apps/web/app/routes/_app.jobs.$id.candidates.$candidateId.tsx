import { useState, useEffect } from "react";
import { useNavigate, useFetcher } from "react-router";
import {
  ArrowLeft,
  Star,
  X,
  AlertTriangle,
  CheckCircle,
  Search,
  MessageSquare,
  Sparkles,
  Target,
  Shield,
  Check,
  Loader2,
  FileText,
} from "lucide-react";
import {
  Box,
  Heading,
  Text,
  Stack,
  Flex,
  Button,
  Badge,
  Avatar,
  Circle,
  Textarea,
} from "@chakra-ui/react";
import type { ProofProfile } from "~/components/lib/api";
import { requireRole } from "~/components/lib/auth.server";
import { authenticatedFetch } from "~/components/lib/api.server";
import type { Route } from "./+types/_app.jobs.$id.candidates.$candidateId";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Proof Profile - Baara" }];
};

interface CandidateInfo {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

interface JobInfo {
  id: string;
  title: string;
}

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireRole(request, ["recruiter", "admin"]);

  const res = await authenticatedFetch(
    request,
    `/api/v1/jobs/${params.id}/candidates/${params.candidateId}/proof-profile`,
  );

  if (!res.ok) {
    return {
      profile: null as ProofProfile | null,
      candidate: null as CandidateInfo | null,
      job: null as JobInfo | null,
      error: "Proof Profile non disponible pour ce candidat",
    };
  }

  const data = await res.json();
  return {
    profile: data.proof_profile as ProofProfile,
    candidate: data.candidate as CandidateInfo,
    job: data.job as JobInfo,
    error: null as string | null,
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const candidateId = params.candidateId;
  const status = formData.get("status") as string;
  const rejectionReason = formData.get("rejection_reason") as string;

  const body: Record<string, string> = { status };
  if (rejectionReason) {
    body.rejection_reason = rejectionReason;
  }

  const res = await authenticatedFetch(
    request,
    `/api/v1/jobs/${params.id}/candidates/${candidateId}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    return { error: "Erreur lors de la mise a jour du statut" };
  }
  return { ok: true };
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
    case "strong":
      return "Excellent";
    case "good":
      return "Bon";
    case "acceptable":
      return "Acceptable";
    case "weak":
      return "A ameliorer";
    default:
      return status;
  }
}

function getStatusColor(status: string): string {
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

function getRecommendationConfig(rec: string): {
  bg: string;
  color: string;
  label: string;
} {
  switch (rec) {
    case "proceed_to_interview":
      return {
        bg: "success.subtle",
        color: "success",
        label: "Entretien recommande",
      };
    case "maybe":
      return {
        bg: "warning.subtle",
        color: "warning",
        label: "A approfondir",
      };
    case "do_not_proceed":
    case "reject":
      return { bg: "error.subtle", color: "error", label: "Non recommande" };
    default:
      return { bg: "bg.muted", color: "text.muted", label: rec };
  }
}

function getWeightLabel(weight: string): string {
  switch (weight) {
    case "critical":
      return "Critique";
    case "important":
      return "Important";
    case "nice_to_have":
      return "Bonus";
    default:
      return weight;
  }
}

function getWeightColor(weight: string): string {
  switch (weight) {
    case "critical":
      return "error";
    case "important":
      return "warning";
    case "nice_to_have":
      return "info";
    default:
      return "text.muted";
  }
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getFocusTypeLabel(type: string): string {
  switch (type) {
    case "verify_strength":
      return "Verifier";
    case "explore_concern":
      return "Explorer";
    case "investigate_gap":
      return "Investiguer";
    default:
      return type;
  }
}

function getFocusTypeColor(type: string): string {
  switch (type) {
    case "verify_strength":
      return "success";
    case "explore_concern":
      return "warning";
    case "investigate_gap":
      return "error";
    default:
      return "text.muted";
  }
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function RecruiterProofProfile({
  params,
  loaderData,
}: Route.ComponentProps) {
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const { profile, candidate, job, error } = loaderData;
  const jobId = params.id;

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [candidateStatus, setCandidateStatus] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  // Track fetcher result for feedback
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      const data = fetcher.data as { ok?: boolean; error?: string };
      if (data.ok && pendingAction) {
        setCandidateStatus(pendingAction);
        setPendingAction(null);
      }
    }
  }, [fetcher.state, fetcher.data, pendingAction]);

  const handleShortlist = () => {
    setPendingAction("shortlisted");
    fetcher.submit({ status: "shortlisted" }, { method: "POST" });
  };

  const handleReject = () => {
    setPendingAction("rejected");
    fetcher.submit(
      { status: "rejected", rejection_reason: rejectionReason },
      { method: "POST" },
    );
    setShowRejectModal(false);
    setRejectionReason("");
  };

  const isSubmitting = fetcher.state !== "idle";

  // Error state
  if (error || !profile || !candidate) {
    return (
      <Box py={8} px={{ base: 3, md: 8 }} maxW="900px" mx="auto">
        <Button
          variant="ghost"
          size="sm"
          color="text.secondary"
          mb={4}
          onClick={() => navigate(`/app/jobs/${jobId}/candidates`)}
          _hover={{ color: "text", bg: "bg.subtle" }}
        >
          <Flex align="center" gap={1.5}>
            <ArrowLeft size={18} />
            <Text>Retour aux candidats</Text>
          </Flex>
        </Button>
        <Box
          bg="surface"
          borderRadius="xl"
          border="1px solid"
          borderColor="border"
          p={{ base: 6, md: 12 }}
          textAlign="center"
        >
          <Text fontSize="md" color="text.secondary">
            {error || "Proof Profile non disponible"}
          </Text>
        </Box>
      </Box>
    );
  }

  const scoreColor = getScoreColor(profile.global_score);
  const recConfig = getRecommendationConfig(profile.recommendation);

  return (
    <Box py={8} px={{ base: 3, md: 8 }} maxW="900px" mx="auto" overflowX="hidden">
      <Stack gap={6}>
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          color="text.secondary"
          onClick={() => navigate(`/app/jobs/${jobId}/candidates`)}
          _hover={{ color: "text", bg: "bg.subtle" }}
          alignSelf="flex-start"
        >
          <Flex align="center" gap={1.5}>
            <ArrowLeft size={18} />
            <Text>Retour aux candidats</Text>
          </Flex>
        </Button>

        {/* ================================================================ */}
        {/* HEADER: Avatar + Name + Score + Recommendation + Actions          */}
        {/* ================================================================ */}
        <Box
          bg="surface"
          borderRadius="2xl"
          border="1px solid"
          borderColor="border"
          shadow="card"
          overflow="hidden"
        >
          <Box
            bg="linear-gradient(135deg, var(--chakra-colors-primary-subtle) 0%, var(--chakra-colors-ai-bg) 100%)"
            py={{ base: 5, md: 8 }}
            px={{ base: 4, md: 6 }}
          >
            <Flex
              justify="space-between"
              align="start"
              direction={{ base: "column", sm: "row" }}
              gap={4}
            >
              {/* Left: Avatar + Info */}
              <Flex gap={3} align="center" minW={0}>
                <Avatar.Root size={{ base: "lg", md: "xl" }} bg="primary.subtle" color="primary">
                  {candidate.avatar_url ? (
                    <Avatar.Image src={candidate.avatar_url} />
                  ) : (
                    <Avatar.Fallback>
                      {getInitials(candidate.name || candidate.email)}
                    </Avatar.Fallback>
                  )}
                </Avatar.Root>
                <Box minW={0} flex={1}>
                  <Heading
                    as="h1"
                    fontSize={{ base: "lg", md: "xl" }}
                    fontWeight="semibold"
                    color="text"
                    mb={1}
                    overflowWrap="anywhere"
                  >
                    {candidate.name || candidate.email}
                  </Heading>
                  {candidate.name && (
                    <Text fontSize="sm" color="text.secondary" mb={2}>
                      {candidate.email}
                    </Text>
                  )}
                  {job && (
                    <Text fontSize="xs" color="text.muted">
                      {job.title}
                    </Text>
                  )}
                </Box>
              </Flex>

              {/* Right: Score + Badges */}
              <Flex direction={{ base: "row", sm: "column" }} align={{ base: "center", sm: "end" }} gap={3} flexWrap="wrap">
                <Circle size={{ base: "56px", md: "72px" }} bg={scoreColor.bg}>
                  <Text
                    fontSize="2xl"
                    fontWeight="bold"
                    color={scoreColor.color}
                  >
                    {profile.global_score}
                  </Text>
                </Circle>
                <Flex gap={2} flexWrap="wrap" justify="end">
                  <Badge
                    bg={recConfig.bg}
                    color={recConfig.color}
                    fontSize="sm"
                    fontWeight="semibold"
                    px={3}
                    py={1}
                    borderRadius="full"
                  >
                    {recConfig.label}
                  </Badge>
                  {profile.percentile > 0 && (
                    <Badge
                      bg="bg.muted"
                      color="text.secondary"
                      fontSize="sm"
                      px={3}
                      py={1}
                      borderRadius="full"
                    >
                      Top {100 - profile.percentile}%
                    </Badge>
                  )}
                </Flex>
              </Flex>
            </Flex>
          </Box>

          {/* Actions bar */}
          <Box
            borderTop="1px solid"
            borderColor="border.subtle"
            bg="surface"
          >
            {/* Status feedback banner */}
            {candidateStatus && (
              <Flex
                px={{ base: 4, md: 6 }}
                py={3}
                gap={2}
                align="center"
                bg={candidateStatus === "shortlisted" ? "success.subtle" : "error.subtle"}
                borderBottom="1px solid"
                borderColor={candidateStatus === "shortlisted" ? "success.muted" : "error.muted"}
              >
                <Box color={candidateStatus === "shortlisted" ? "success" : "error"}>
                  <Check size={16} />
                </Box>
                <Text
                  fontSize="sm"
                  fontWeight="medium"
                  color={candidateStatus === "shortlisted" ? "success" : "error"}
                >
                  {candidateStatus === "shortlisted"
                    ? "Candidat shortliste avec succes"
                    : "Candidat rejete"}
                </Text>
              </Flex>
            )}
            <Flex
              px={{ base: 4, md: 6 }}
              py={4}
              gap={3}
            >
              <Button
                size="sm"
                bg={candidateStatus === "shortlisted" ? "success" : "success.subtle"}
                color={candidateStatus === "shortlisted" ? "white" : "success"}
                onClick={handleShortlist}
                disabled={isSubmitting || candidateStatus === "shortlisted"}
                _hover={candidateStatus === "shortlisted" ? {} : { bg: "success.emphasized" }}
                transition="all 0.2s"
              >
                <Flex align="center" gap={1.5}>
                  {isSubmitting && pendingAction === "shortlisted" ? (
                    <Box animation="spin 1s linear infinite" display="inline-flex">
                      <Loader2 size={16} />
                    </Box>
                  ) : candidateStatus === "shortlisted" ? (
                    <Check size={16} />
                  ) : (
                    <Star size={16} />
                  )}
                  <Text>
                    {isSubmitting && pendingAction === "shortlisted"
                      ? "En cours..."
                      : candidateStatus === "shortlisted"
                        ? "Shortliste"
                        : "Shortlister"}
                  </Text>
                </Flex>
              </Button>
              <Button
                size="sm"
                bg={candidateStatus === "rejected" ? "error" : "error.subtle"}
                color={candidateStatus === "rejected" ? "white" : "error"}
                onClick={() => setShowRejectModal(true)}
                disabled={isSubmitting || candidateStatus === "rejected"}
                _hover={candidateStatus === "rejected" ? {} : { bg: "error.emphasized" }}
                transition="all 0.2s"
              >
                <Flex align="center" gap={1.5}>
                  {isSubmitting && pendingAction === "rejected" ? (
                    <Box animation="spin 1s linear infinite" display="inline-flex">
                      <Loader2 size={16} />
                    </Box>
                  ) : candidateStatus === "rejected" ? (
                    <Check size={16} />
                  ) : (
                    <X size={16} />
                  )}
                  <Text>
                    {isSubmitting && pendingAction === "rejected"
                      ? "En cours..."
                      : candidateStatus === "rejected"
                        ? "Rejete"
                        : "Rejeter"}
                  </Text>
                </Flex>
              </Button>
            </Flex>
          </Box>
        </Box>

        {/* ================================================================ */}
        {/* RESUME: One-liner + Score par critere                             */}
        {/* ================================================================ */}
        <Box
          bg="surface"
          borderRadius="xl"
          border="1px solid"
          borderColor="border"
          p={{ base: 4, md: 6 }}
        >
          <Flex align="center" gap={2} mb={4}>
            <Box color="ai.text">
              <Sparkles size={18} />
            </Box>
            <Heading
              as="h2"
              fontSize="lg"
              fontWeight="semibold"
              color="text"
            >
              Resume
            </Heading>
          </Flex>
          <Text fontSize="md" color="text.secondary" mb={6} lineHeight="relaxed">
            {profile.one_liner}
          </Text>

          {/* Score bars by criterion */}
          {profile.criteria_summary.length > 0 && (
            <Stack gap={3}>
              {profile.criteria_summary.map((c, i) => {
                const cColor = getScoreColor(c.score);
                return (
                  <Box key={i}>
                    <Flex
                      justify="space-between"
                      align="center"
                      mb={1.5}
                      gap={2}
                    >
                      <Flex align="center" gap={2} minW={0} flexWrap="wrap">
                        <Text
                          fontSize="sm"
                          fontWeight="medium"
                          color="text"
                          overflowWrap="anywhere"
                        >
                          {c.name}
                        </Text>
                        <Badge
                          fontSize="xs"
                          bg={getWeightColor(c.weight) + ".subtle"}
                          color={getWeightColor(c.weight)}
                          px={1.5}
                          py={0.5}
                          borderRadius="full"
                          flexShrink={0}
                        >
                          {getWeightLabel(c.weight)}
                        </Badge>
                      </Flex>
                      <Text
                        fontSize="sm"
                        fontWeight="bold"
                        color={cColor.color}
                      >
                        {c.score}
                      </Text>
                    </Flex>
                    <Box
                      bg="bg.muted"
                      borderRadius="full"
                      h="8px"
                      overflow="hidden"
                    >
                      <Box
                        bg={cColor.color}
                        h="100%"
                        borderRadius="full"
                        w={`${c.score}%`}
                        transition="width 0.3s"
                      />
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>

        {/* ================================================================ */}
        {/* EVALUATION PAR CRITERE                                            */}
        {/* ================================================================ */}
        {profile.criteria_summary.length > 0 && (
          <Box
            bg="surface"
            borderRadius="xl"
            border="1px solid"
            borderColor="border"
            p={6}
          >
            <Flex align="center" gap={2} mb={4}>
              <Box color="primary">
                <Target size={18} />
              </Box>
              <Heading
                as="h2"
                fontSize="md"
                fontWeight="semibold"
                color="text"
              >
                Evaluation par critere
              </Heading>
            </Flex>
            <Stack gap={3}>
              {profile.criteria_summary.map((c, i) => {
                const cColor = getScoreColor(c.score);
                return (
                  <Box
                    key={i}
                    bg="bg.subtle"
                    borderRadius="lg"
                    p={4}
                    border="1px solid"
                    borderColor="border.subtle"
                  >
                    <Flex justify="space-between" align="center" mb={1} flexWrap="wrap" gap={1}>
                      <Flex align="center" gap={2} flexWrap="wrap" minW={0}>
                        <Text
                          fontSize="sm"
                          fontWeight="semibold"
                          color="text"
                          overflowWrap="anywhere"
                        >
                          {c.name}
                        </Text>
                        <Badge
                          fontSize="xs"
                          bg={cColor.bg}
                          color={cColor.color}
                          px={2}
                          py={0.5}
                          borderRadius="full"
                          flexShrink={0}
                        >
                          {c.score}/100
                        </Badge>
                        <Badge
                          fontSize="xs"
                          bg={getWeightColor(c.weight) + ".subtle"}
                          color={getWeightColor(c.weight)}
                          px={1.5}
                          py={0.5}
                          borderRadius="full"
                          flexShrink={0}
                        >
                          {getWeightLabel(c.weight)}
                        </Badge>
                      </Flex>
                      <Text
                        fontSize="sm"
                        color={getStatusColor(c.status)}
                        fontWeight="semibold"
                        flexShrink={0}
                      >
                        {getStatusLabel(c.status)}
                      </Text>
                    </Flex>
                    <Text fontSize="sm" color="text.secondary" lineHeight="relaxed">
                      {c.headline}
                    </Text>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        )}

        {/* ================================================================ */}
        {/* POINTS FORTS                                                      */}
        {/* ================================================================ */}
        {profile.strengths.length > 0 && (
          <Box
            bg="surface"
            borderRadius="xl"
            border="1px solid"
            borderColor="border"
            p={6}
          >
            <Flex align="center" gap={2} mb={4}>
              <Box color="success">
                <CheckCircle size={18} />
              </Box>
              <Heading
                as="h2"
                fontSize="md"
                fontWeight="semibold"
                color="text"
              >
                Points forts
              </Heading>
            </Flex>
            <Stack gap={3}>
              {profile.strengths.map((s, i) => (
                <Box
                  key={i}
                  bg="success.subtle"
                  borderRadius="lg"
                  p={4}
                  border="1px solid"
                  borderColor="success.muted"
                >
                  <Flex align="center" gap={2} mb={2}>
                    <Text fontSize="sm" fontWeight="semibold" color="text">
                      {s.criterion_name}
                    </Text>
                    <Badge
                      bg="success.subtle"
                      color="success"
                      fontSize="xs"
                      px={2}
                      py={0.5}
                      borderRadius="full"
                    >
                      {s.score}/100
                    </Badge>
                  </Flex>
                  <Text fontSize="sm" color="text.secondary" mb={2}>
                    {s.evidence}
                  </Text>
                  {s.signals.length > 0 && (
                    <Flex gap={2} flexWrap="wrap">
                      {s.signals.map((sig, j) => (
                        <Badge
                          key={j}
                          fontSize="xs"
                          bg="surface"
                          color="text.secondary"
                          px={2}
                          py={0.5}
                          borderRadius="full"
                        >
                          {sig}
                        </Badge>
                      ))}
                    </Flex>
                  )}
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {/* ================================================================ */}
        {/* ZONES A EXPLORER                                                  */}
        {/* ================================================================ */}
        {profile.areas_to_explore.length > 0 && (
          <Box
            bg="surface"
            borderRadius="xl"
            border="1px solid"
            borderColor="border"
            p={6}
          >
            <Flex align="center" gap={2} mb={4}>
              <Box color="warning">
                <Search size={18} />
              </Box>
              <Heading
                as="h2"
                fontSize="md"
                fontWeight="semibold"
                color="text"
              >
                Zones a explorer
              </Heading>
            </Flex>
            <Stack gap={3}>
              {profile.areas_to_explore.map((a, i) => (
                <Box
                  key={i}
                  bg="warning.subtle"
                  borderRadius="lg"
                  p={4}
                  border="1px solid"
                  borderColor="warning.muted"
                >
                  <Flex align="center" gap={2} mb={2}>
                    <Text fontSize="sm" fontWeight="semibold" color="text">
                      {a.criterion_name}
                    </Text>
                    <Badge
                      bg="warning.subtle"
                      color="warning"
                      fontSize="xs"
                      px={2}
                      py={0.5}
                      borderRadius="full"
                    >
                      {a.score}/100
                    </Badge>
                  </Flex>
                  {a.concerns.length > 0 && (
                    <Stack gap={1} mb={2}>
                      {a.concerns.map((concern, j) => (
                        <Text
                          key={j}
                          fontSize="sm"
                          color="text.secondary"
                        >
                          {concern}
                        </Text>
                      ))}
                    </Stack>
                  )}
                  {a.suggested_questions.length > 0 && (
                    <Box mt={2}>
                      <Text
                        fontSize="xs"
                        fontWeight="semibold"
                        color="text.muted"
                        mb={1}
                      >
                        Questions suggerees :
                      </Text>
                      <Stack gap={1}>
                        {a.suggested_questions.map((q, j) => (
                          <Flex key={j} align="start" gap={2}>
                            <Box
                              color="warning"
                              mt={0.5}
                              flexShrink={0}
                            >
                              <MessageSquare size={12} />
                            </Box>
                            <Text fontSize="sm" color="text.secondary">
                              {q}
                            </Text>
                          </Flex>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {/* ================================================================ */}
        {/* RED FLAGS                                                          */}
        {/* ================================================================ */}
        <Box
          bg="surface"
          borderRadius="xl"
          border="1px solid"
          borderColor="border"
          p={{ base: 4, md: 6 }}
        >
          <Flex align="center" gap={2} mb={4}>
            <Box color="error">
              <AlertTriangle size={18} />
            </Box>
            <Heading
              as="h2"
              fontSize="md"
              fontWeight="semibold"
              color="text"
            >
              Red flags
            </Heading>
          </Flex>
          {profile.red_flags.length === 0 ? (
            <Flex
              align="center"
              gap={2}
              bg="success.subtle"
              borderRadius="lg"
              p={4}
              border="1px solid"
              borderColor="success.muted"
            >
              <Box color="success">
                <Shield size={16} />
              </Box>
              <Text fontSize="sm" color="success" fontWeight="medium">
                Aucun red flag detecte
              </Text>
            </Flex>
          ) : (
            <Stack gap={3}>
              {profile.red_flags.map((rf, i) => (
                <Box
                  key={i}
                  bg="error.subtle"
                  borderRadius="lg"
                  p={4}
                  border="1px solid"
                  borderColor="error.muted"
                >
                  <Text
                    fontSize="sm"
                    fontWeight="semibold"
                    color="text"
                    mb={2}
                  >
                    {rf.criterion_name}
                  </Text>
                  <Stack gap={1}>
                    {rf.flags.map((flag, j) => (
                      <Flex key={j} align="start" gap={2}>
                        <Box color="error" mt={0.5} flexShrink={0}>
                          <AlertTriangle size={12} />
                        </Box>
                        <Text fontSize="sm" color="text.secondary">
                          {flag}
                        </Text>
                      </Flex>
                    ))}
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Box>

        {/* ================================================================ */}
        {/* INTERVIEW KIT PREVIEW                                             */}
        {/* ================================================================ */}
        {profile.interview_focus_points.length > 0 && (
          <Box
            bg="surface"
            borderRadius="xl"
            border="1px solid"
            borderColor="border"
            p={6}
          >
            <Flex align={{ base: "start", sm: "center" }} justify="space-between" mb={4} direction={{ base: "column", sm: "row" }} gap={3}>
              <Flex align="center" gap={2}>
                <Box color="primary">
                  <MessageSquare size={18} />
                </Box>
                <Heading
                  as="h2"
                  fontSize="md"
                  fontWeight="semibold"
                  color="text"
                >
                  Interview Kit
                </Heading>
              </Flex>
              <Button
                size="sm"
                bg="primary"
                color="white"
                _hover={{ bg: "primary.hover", transform: "translateY(-1px)" }}
                _active={{ transform: "translateY(0)" }}
                transition="all 0.15s"
                fontWeight="medium"
                flexShrink={0}
                onClick={() =>
                  navigate(
                    `/app/jobs/${jobId}/candidates/${candidate!.id}/interview-kit`,
                  )
                }
              >
                <Flex align="center" gap={1.5}>
                  <MessageSquare size={14} />
                  <Text>Ouvrir l'Interview Kit</Text>
                </Flex>
              </Button>
            </Flex>
            <Stack gap={3}>
              {profile.interview_focus_points.map((fp, i) => (
                <Box
                  key={i}
                  bg="bg.subtle"
                  borderRadius="lg"
                  p={4}
                  border="1px solid"
                  borderColor="border.subtle"
                >
                  <Flex align="center" gap={2} mb={1}>
                    <Badge
                      fontSize="xs"
                      bg={
                        getFocusTypeColor(fp.type) + ".subtle"
                      }
                      color={getFocusTypeColor(fp.type)}
                      px={1.5}
                      py={0.5}
                      borderRadius="full"
                    >
                      {getFocusTypeLabel(fp.type)}
                    </Badge>
                    <Text
                      fontSize="sm"
                      fontWeight="semibold"
                      color="text"
                    >
                      {fp.topic}
                    </Text>
                  </Flex>
                  <Text fontSize="sm" color="text.secondary">
                    {fp.reason}
                  </Text>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {/* ================================================================ */}
        {/* DECISION MEMO CTA                                               */}
        {/* ================================================================ */}
        <Box
          bg="surface"
          borderRadius="xl"
          border="1px solid"
          borderColor="border"
          p={6}
        >
          <Flex align={{ base: "start", sm: "center" }} justify="space-between" direction={{ base: "column", sm: "row" }} gap={3}>
            <Flex align="center" gap={2}>
              <Box color="primary">
                <FileText size={18} />
              </Box>
              <Box>
                <Heading
                  as="h2"
                  fontSize="md"
                  fontWeight="semibold"
                  color="text"
                >
                  Decision Memo
                </Heading>
                <Text fontSize="xs" color="text.secondary">
                  Formalisez votre decision de recrutement
                </Text>
              </Box>
            </Flex>
            <Button
              size="sm"
              bg="primary"
              color="white"
              _hover={{ bg: "primary.hover", transform: "translateY(-1px)" }}
              _active={{ transform: "translateY(0)" }}
              transition="all 0.15s"
              fontWeight="medium"
              flexShrink={0}
              onClick={() =>
                navigate(
                  `/app/jobs/${jobId}/candidates/${candidate!.id}/decision`,
                )
              }
            >
              <Flex align="center" gap={1.5}>
                <FileText size={14} />
                <Text>Ouvrir le Decision Memo</Text>
              </Flex>
            </Button>
          </Flex>
        </Box>

        {/* Reject Modal Overlay */}
        {showRejectModal && (
          <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="blackAlpha.600"
            display="flex"
            alignItems="center"
            justifyContent="center"
            zIndex={1000}
            onClick={() => setShowRejectModal(false)}
          >
            <Box
              bg="surface"
              borderRadius="xl"
              border="1px solid"
              borderColor="border"
              p={6}
              maxW="480px"
              w="90%"
              shadow="lg"
              onClick={(e) => e.stopPropagation()}
            >
              <Heading
                as="h3"
                fontSize="lg"
                fontWeight="semibold"
                color="text"
                mb={2}
              >
                Rejeter le candidat
              </Heading>
              <Text fontSize="sm" color="text.secondary" mb={4}>
                Vous pouvez ajouter une raison optionnelle pour ce rejet.
              </Text>
              <Textarea
                placeholder="Raison du rejet (optionnel)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                mb={4}
                rows={3}
                border="1px solid"
                borderColor="border"
                _focus={{
                  borderColor: "primary",
                  boxShadow: "0 0 0 1px var(--chakra-colors-primary)",
                }}
              />
              <Flex gap={3} justify="end">
                <Button
                  variant="outline"
                  size="sm"
                  borderColor="border"
                  color="text.secondary"
                  onClick={() => setShowRejectModal(false)}
                  _hover={{ bg: "bg.subtle" }}
                >
                  Annuler
                </Button>
                <Button
                  size="sm"
                  bg="error"
                  color="white"
                  onClick={handleReject}
                  disabled={fetcher.state !== "idle"}
                  _hover={{ bg: "error.emphasized" }}
                >
                  Confirmer le rejet
                </Button>
              </Flex>
            </Box>
          </Box>
        )}
      </Stack>
    </Box>
  );
}
