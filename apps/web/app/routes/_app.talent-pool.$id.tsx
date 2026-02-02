import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  Briefcase,
  Languages,
  Globe,
  Clock,
} from "lucide-react";
import {
  Box,
  Heading,
  Text,
  Stack,
  Flex,
  Button,
  Badge,
  Circle,
  Avatar,
} from "@chakra-ui/react";
import { requireRole } from "~/components/lib/auth.server";
import { authenticatedFetch } from "~/components/lib/api.server";
import type { ProofProfile } from "~/components/lib/api";
import type { Route } from "./+types/_app.talent-pool.$id";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Candidate Profile - Baara" }];
};

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireRole(request, ["recruiter", "admin"]);

  const profileId = params.id;

  const res = await authenticatedFetch(
    request,
    `/api/v1/proof-profiles/${profileId}`,
  );
  if (!res.ok) {
    return { profile: null, candidate: null, error: "Profile not found" };
  }
  const data = await res.json();

  // Fetch candidate info using the candidate_id filter
  const candidateId = data.proof_profile?.candidate_id;
  let candidateInfo = null;
  if (candidateId) {
    const tpRes = await authenticatedFetch(
      request,
      `/api/v1/talent-pool?candidate_id=${encodeURIComponent(candidateId)}&per_page=1`,
    );
    if (tpRes.ok) {
      const tpData = await tpRes.json();
      candidateInfo = (tpData.profiles || [])[0] || null;
    }
  }

  return { profile: data.proof_profile, candidate: candidateInfo, error: null };
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

const roleTypeColors: Record<string, { bg: string; color: string }> = {
  backend_go: { bg: "blue.subtle", color: "blue" },
  sre: { bg: "orange.subtle", color: "orange" },
  infra_platform: { bg: "purple.subtle", color: "purple" },
  other: { bg: "bg.muted", color: "text.muted" },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function TalentPoolDetail({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation("app");
  const navigate = useNavigate();
  const { profile, candidate, error } = loaderData;

  if (error || !profile) {
    return (
      <Box py={8} px={8} maxW="800px" mx="auto" textAlign="center">
        <Text color="text.secondary">{t("talentPool.empty.title")}</Text>
        <Button
          mt={4}
          variant="outline"
          onClick={() => navigate("/app/talent-pool")}
        >
          <Flex align="center" gap={2}>
            <ArrowLeft size={16} />
            {t("talentPool.heading")}
          </Flex>
        </Button>
      </Box>
    );
  }

  const p = profile as ProofProfile;
  const scoreColor = getScoreColor(p.global_score);
  const roleColors = roleTypeColors[candidate?.role_type || "other"] || roleTypeColors.other;

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

  const recConfig = getRecommendationConfig(p.recommendation);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <Box py={8} px={8} maxW="800px" mx="auto">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        mb={6}
        color="text.secondary"
        onClick={() => navigate("/app/talent-pool")}
        _hover={{ color: "text", bg: "bg.subtle" }}
      >
        <Flex align="center" gap={2}>
          <ArrowLeft size={16} />
          <Text>{t("talentPool.heading")}</Text>
        </Flex>
      </Button>

      {/* Candidate header */}
      {candidate && (
        <Flex gap={4} mb={6} align="start">
          <Avatar.Root size="xl" bg="primary.subtle" color="primary">
            {candidate.avatar_url ? (
              <Avatar.Image src={candidate.avatar_url} />
            ) : (
              <Avatar.Fallback>
                {getInitials(candidate.candidate_name || "?")}
              </Avatar.Fallback>
            )}
          </Avatar.Root>
          <Box flex={1}>
            <Heading as="h1" fontSize="xl" fontWeight="semibold" color="text" mb={1}>
              {candidate.candidate_name}
            </Heading>
            {candidate.role_type && (
              <Badge
                bg={roleColors.bg}
                color={roleColors.color}
                fontSize="xs"
                px={2}
                py={0.5}
                borderRadius="full"
                mb={2}
              >
                {t(`talentPool.roleTypes.${candidate.role_type}`)}
              </Badge>
            )}
            <Stack gap={1}>
              {(candidate.current_title || candidate.current_company) && (
                <Flex align="center" gap={1.5} color="text.secondary">
                  <Briefcase size={14} />
                  <Text fontSize="sm">
                    {[candidate.current_title, candidate.current_company].filter(Boolean).join(" · ")}
                  </Text>
                </Flex>
              )}
              {candidate.location && (
                <Flex align="center" gap={1.5} color="text.muted">
                  <MapPin size={14} />
                  <Text fontSize="sm">{candidate.location}</Text>
                </Flex>
              )}
            </Stack>

            {/* Links */}
            <Flex gap={3} mt={2}>
              {candidate.linkedin_url && (
                <Flex
                  as="a"
                  {...{ href: candidate.linkedin_url, target: "_blank", rel: "noopener noreferrer" }}
                  align="center"
                  gap={1}
                  fontSize="sm"
                  color="text.muted"
                  _hover={{ color: "text" }}
                >
                  LinkedIn <ExternalLink size={12} />
                </Flex>
              )}
              {candidate.github_username && (
                <Flex
                  as="a"
                  {...{ href: `https://github.com/${candidate.github_username}`, target: "_blank", rel: "noopener noreferrer" }}
                  align="center"
                  gap={1}
                  fontSize="sm"
                  color="text.muted"
                  _hover={{ color: "text" }}
                >
                  GitHub <ExternalLink size={12} />
                </Flex>
              )}
            </Flex>

            {/* Skills */}
            {candidate.skills && candidate.skills.length > 0 && (
              <Flex gap={1} flexWrap="wrap" mt={3}>
                {candidate.skills.map((skill: string) => (
                  <Badge
                    key={skill}
                    bg="bg.subtle"
                    color="text.muted"
                    fontSize="xs"
                    px={2}
                    py={0.5}
                    borderRadius="full"
                  >
                    {skill}
                  </Badge>
                ))}
              </Flex>
            )}

            {/* Enriched badges */}
            {(candidate.languages?.length || candidate.availability || candidate.remote_preference) && (
              <Flex gap={1.5} flexWrap="wrap" mt={2}>
                {candidate.languages?.map((lang: any) => (
                  <Badge key={lang.language} bg="teal.subtle" color="teal.fg" fontSize="xs" px={2} py={0.5} borderRadius="full">
                    <Flex align="center" gap={0.5}><Languages size={12} />{lang.language}</Flex>
                  </Badge>
                ))}
                {candidate.availability && candidate.availability !== "not_looking" && (
                  <Badge bg="green.subtle" color="green.fg" fontSize="xs" px={2} py={0.5} borderRadius="full">
                    <Flex align="center" gap={0.5}><Clock size={12} />{t("talentPool.card.available")}</Flex>
                  </Badge>
                )}
                {candidate.remote_preference && (
                  <Badge bg="blue.subtle" color="blue.fg" fontSize="xs" px={2} py={0.5} borderRadius="full">
                    <Flex align="center" gap={0.5}><Globe size={12} />{t(`talentPool.card.${candidate.remote_preference}`)}</Flex>
                  </Badge>
                )}
              </Flex>
            )}
          </Box>
        </Flex>
      )}

      {/* One liner */}
      <Text fontSize="md" color="text.secondary" lineHeight="relaxed" mb={6}>
        {p.one_liner}
      </Text>

      <Stack gap={6}>
        {/* Score card */}
        <Box bg="surface" borderRadius="2xl" border="1px solid" borderColor="border" shadow="card" overflow="hidden">
          <Box
            bg="linear-gradient(135deg, var(--chakra-colors-primary-subtle) 0%, var(--chakra-colors-ai-bg) 100%)"
            py={8} px={6} textAlign="center"
          >
            <Circle size="96px" bg={scoreColor.bg} mx="auto" mb={4}>
              <Text fontSize="3xl" fontWeight="bold" color={scoreColor.color}>{p.global_score}</Text>
            </Circle>
            <Heading as="h3" fontSize="xl" fontWeight="bold" color="text" mb={2} letterSpacing="-0.02em">
              {t("proofProfile.profileReady.overallScore", { label: p.score_label })}
            </Heading>
            <Flex justify="center" gap={3} mt={3}>
              <Badge bg={recConfig.bg} color={recConfig.color} fontSize="sm" fontWeight="semibold" px={3} py={1} borderRadius="full">
                {recConfig.label}
              </Badge>
              {p.percentile > 0 && (
                <Badge bg="bg.muted" color="text.secondary" fontSize="sm" px={3} py={1} borderRadius="full">
                  {t("proofProfile.profileReady.topPercent", { percent: 100 - p.percentile })}
                </Badge>
              )}
            </Flex>
          </Box>
        </Box>

        {/* Criteria */}
        {p.criteria_summary.length > 0 && (
          <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" p={6}>
            <Heading as="h4" fontSize="lg" fontWeight="semibold" color="text" mb={5}>
              {t("proofProfile.profileReady.criteriaEvaluation")}
            </Heading>
            <Stack gap={4}>
              {p.criteria_summary.map((c, i) => {
                const cColor = getScoreColor(c.score);
                return (
                  <Box key={i} bg="bg.subtle" borderRadius="lg" p={5} border="1px solid" borderColor="border.subtle">
                    <Flex justify="space-between" align="center" mb={2}>
                      <Flex align="center" gap={2.5}>
                        <Text fontSize="md" fontWeight="semibold" color="text">{c.name}</Text>
                        <Badge fontSize="xs" bg={cColor.bg} color={cColor.color} px={2} py={0.5} borderRadius="full" fontWeight="semibold">
                          {c.score}/100
                        </Badge>
                      </Flex>
                      <Text fontSize="sm" color={getStatusColor(c.status)} fontWeight="semibold">
                        {getStatusLabel(c.status)}
                      </Text>
                    </Flex>
                    <Text fontSize="sm" color="text.secondary" lineHeight="relaxed">{c.headline}</Text>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        )}

        {/* Strengths */}
        {p.strengths.length > 0 && (
          <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" p={6}>
            <Heading as="h4" fontSize="lg" fontWeight="semibold" color="text" mb={5}>{t("proofProfile.profileReady.strengths")}</Heading>
            <Stack gap={4}>
              {p.strengths.map((s, i) => (
                <Box key={i} bg="success.subtle" borderRadius="lg" p={5} border="1px solid" borderColor="success.muted">
                  <Flex align="center" gap={2.5} mb={2}>
                    <Text fontSize="md" fontWeight="semibold" color="text">{s.criterion_name}</Text>
                    <Badge bg="success.subtle" color="success" fontSize="xs" px={2} py={0.5} borderRadius="full" fontWeight="semibold">{s.score}/100</Badge>
                  </Flex>
                  <Text fontSize="sm" color="text.secondary" mb={2} lineHeight="relaxed">{s.evidence}</Text>
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
        {p.areas_to_explore.length > 0 && (
          <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" p={6}>
            <Heading as="h4" fontSize="lg" fontWeight="semibold" color="text" mb={5}>{t("proofProfile.profileReady.areasForImprovement")}</Heading>
            <Stack gap={4}>
              {p.areas_to_explore.map((a, i) => (
                <Box key={i} bg="warning.subtle" borderRadius="lg" p={5} border="1px solid" borderColor="warning.muted">
                  <Flex align="center" gap={2.5} mb={2}>
                    <Text fontSize="md" fontWeight="semibold" color="text">{a.criterion_name}</Text>
                    <Badge bg="warning.subtle" color="warning" fontSize="xs" px={2} py={0.5} borderRadius="full" fontWeight="semibold">{a.score}/100</Badge>
                  </Flex>
                  {a.concerns.length > 0 && (
                    <Stack gap={1.5}>
                      {a.concerns.map((concern, j) => (
                        <Text key={j} fontSize="sm" color="text.secondary" lineHeight="relaxed">• {concern}</Text>
                      ))}
                    </Stack>
                  )}
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {/* Red flags */}
        {p.red_flags && p.red_flags.length > 0 && (
          <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" p={6}>
            <Heading as="h4" fontSize="lg" fontWeight="semibold" color="text" mb={5}>{t("proofProfile.profileReady.redFlags", { defaultValue: "Red flags" })}</Heading>
            <Stack gap={4}>
              {p.red_flags.map((rf, i) => (
                <Box key={i} bg="error.subtle" borderRadius="lg" p={5} border="1px solid" borderColor="error.muted">
                  <Text fontSize="md" fontWeight="semibold" color="text" mb={1}>{rf.criterion_name}</Text>
                  {rf.flags.length > 0 && (
                    <Stack gap={1}>
                      {rf.flags.map((flag, j) => (
                        <Text key={j} fontSize="sm" color="text.secondary">• {flag}</Text>
                      ))}
                    </Stack>
                  )}
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {/* Experiences */}
        {candidate?.experiences && candidate.experiences.length > 0 && (
          <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" p={6}>
            <Heading as="h4" fontSize="lg" fontWeight="semibold" color="text" mb={5}>
              {t("proofProfile.profileReady.experiences", { defaultValue: "Experiences" })}
            </Heading>
            <Stack gap={3}>
              {candidate.experiences.map((exp: any, i: number) => (
                <Flex key={i} gap={3} align="start">
                  <Box w="4px" bg="primary.subtle" borderRadius="full" alignSelf="stretch" flexShrink={0} />
                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" color="text">{exp.title}</Text>
                    <Text fontSize="sm" color="text.secondary">
                      {exp.company}
                      {exp.start_year ? ` · ${exp.start_year}${exp.end_year ? `–${exp.end_year}` : "–"}` : ""}
                    </Text>
                    {exp.description && (
                      <Text fontSize="xs" color="text.muted" mt={1}>{exp.description}</Text>
                    )}
                  </Box>
                </Flex>
              ))}
            </Stack>
          </Box>
        )}
      </Stack>
    </Box>
  );
}
