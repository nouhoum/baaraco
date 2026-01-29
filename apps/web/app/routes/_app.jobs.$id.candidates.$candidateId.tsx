import { useState } from "react";
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

  const handleShortlist = () => {
    fetcher.submit({ status: "shortlisted" }, { method: "POST" });
  };

  const handleReject = () => {
    fetcher.submit(
      { status: "rejected", rejection_reason: rejectionReason },
      { method: "POST" },
    );
    setShowRejectModal(false);
    setRejectionReason("");
  };

  // Error state
  if (error || !profile || !candidate) {
    return (
      <Box py={8} px={8} maxW="900px" mx="auto">
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
          p={12}
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
    <Box py={8} px={8} maxW="900px" mx="auto">
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
            py={8}
            px={6}
          >
            <Flex
              justify="space-between"
              align="start"
              flexWrap="wrap"
              gap={4}
            >
              {/* Left: Avatar + Info */}
              <Flex gap={4} align="center">
                <Avatar.Root size="xl" bg="primary.subtle" color="primary">
                  {candidate.avatar_url ? (
                    <Avatar.Image src={candidate.avatar_url} />
                  ) : (
                    <Avatar.Fallback>
                      {getInitials(candidate.name || candidate.email)}
                    </Avatar.Fallback>
                  )}
                </Avatar.Root>
                <Box>
                  <Heading
                    as="h1"
                    fontSize="xl"
                    fontWeight="semibold"
                    color="text"
                    mb={1}
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
              <Flex direction="column" align="end" gap={3}>
                <Circle size="72px" bg={scoreColor.bg}>
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
          <Flex
            px={6}
            py={4}
            gap={3}
            borderTop="1px solid"
            borderColor="border.subtle"
            bg="surface"
          >
            <Button
              size="sm"
              bg="success.subtle"
              color="success"
              onClick={handleShortlist}
              disabled={fetcher.state !== "idle"}
              _hover={{ bg: "success.emphasized" }}
            >
              <Flex align="center" gap={1.5}>
                <Star size={16} />
                <Text>Shortlister</Text>
              </Flex>
            </Button>
            <Button
              size="sm"
              bg="error.subtle"
              color="error"
              onClick={() => setShowRejectModal(true)}
              disabled={fetcher.state !== "idle"}
              _hover={{ bg: "error.emphasized" }}
            >
              <Flex align="center" gap={1.5}>
                <X size={16} />
                <Text>Rejeter</Text>
              </Flex>
            </Button>
          </Flex>
        </Box>

        {/* ================================================================ */}
        {/* RESUME: One-liner + Score par critere                             */}
        {/* ================================================================ */}
        <Box
          bg="surface"
          borderRadius="xl"
          border="1px solid"
          borderColor="border"
          p={6}
        >
          <Flex align="center" gap={2} mb={4}>
            <Box color="ai.text">
              <Sparkles size={18} />
            </Box>
            <Heading
              as="h2"
              fontSize="md"
              fontWeight="semibold"
              color="text"
            >
              Resume
            </Heading>
          </Flex>
          <Text fontSize="md" color="text.secondary" mb={6}>
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
                    >
                      <Flex align="center" gap={2}>
                        <Text
                          fontSize="sm"
                          fontWeight="medium"
                          color="text"
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
                    <Flex justify="space-between" align="center" mb={1}>
                      <Flex align="center" gap={2}>
                        <Text
                          fontSize="sm"
                          fontWeight="semibold"
                          color="text"
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
                        >
                          {getWeightLabel(c.weight)}
                        </Badge>
                      </Flex>
                      <Text
                        fontSize="xs"
                        color={getStatusColor(c.status)}
                        fontWeight="medium"
                      >
                        {getStatusLabel(c.status)}
                      </Text>
                    </Flex>
                    <Text fontSize="sm" color="text.secondary">
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
          p={6}
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
            <Flex align="center" gap={2} mb={4}>
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
