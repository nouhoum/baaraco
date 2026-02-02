import {
  Box,
  Heading,
  Text,
  Stack,
  Flex,
  Circle,
  Badge,
} from "@chakra-ui/react";
import { CheckCircle } from "lucide-react";
import type { ProofProfile } from "~/components/lib/api";
import { getScoreColor, getStatusColor } from "./role-helpers";

interface ProofProfileDetailProps {
  profile: ProofProfile;
  t: (key: string, opts?: any) => string;
}

function getRecommendationConfig(
  rec: string,
  t: (key: string, opts?: any) => string,
): { bg: string; color: string; label: string } {
  switch (rec) {
    case "proceed_to_interview":
      return {
        bg: "success.subtle",
        color: "success",
        label: t("proofProfile.recommendation.proceed_to_interview"),
      };
    case "maybe":
      return {
        bg: "warning.subtle",
        color: "warning",
        label: t("proofProfile.recommendation.maybe"),
      };
    case "do_not_proceed":
      return {
        bg: "error.subtle",
        color: "error",
        label: t("proofProfile.recommendation.do_not_proceed"),
      };
    default:
      return { bg: "bg.muted", color: "text.muted", label: rec };
  }
}

export function ProofProfileDetail({ profile, t }: ProofProfileDetailProps) {
  const scoreColor = getScoreColor(profile.global_score);
  const recConfig = getRecommendationConfig(profile.recommendation, t);

  const getStatusLabel = (status: string): string => {
    return t(`proofProfile.status.${status}`, { defaultValue: status });
  };

  return (
    <Stack gap={6}>
      {/* One liner */}
      <Text fontSize="md" color="text.secondary" lineHeight="relaxed">
        {profile.one_liner}
      </Text>

      {/* Score card */}
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
          textAlign="center"
        >
          <Circle size="96px" bg={scoreColor.bg} mx="auto" mb={4}>
            <Text fontSize="3xl" fontWeight="bold" color={scoreColor.color}>
              {profile.global_score}
            </Text>
          </Circle>
          <Heading
            as="h3"
            fontSize="xl"
            fontWeight="bold"
            color="text"
            mb={2}
            letterSpacing="-0.02em"
          >
            {t("proofProfile.profileReady.overallScore", {
              label: profile.score_label,
            })}
          </Heading>
          <Flex justify="center" gap={3} mt={3}>
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
                {t("proofProfile.profileReady.topPercent", {
                  percent: 100 - profile.percentile,
                })}
              </Badge>
            )}
          </Flex>
        </Box>
      </Box>

      {/* Criteria */}
      {profile.criteria_summary.length > 0 && (
        <Box
          bg="surface"
          borderRadius="xl"
          border="1px solid"
          borderColor="border"
          p={6}
        >
          <Heading as="h4" fontSize="lg" fontWeight="semibold" color="text" mb={5}>
            {t("proofProfile.profileReady.criteriaEvaluation")}
          </Heading>
          <Stack gap={4}>
            {profile.criteria_summary.map((c, i) => {
              const cColor = getScoreColor(c.score);
              return (
                <Box
                  key={i}
                  bg="bg.subtle"
                  borderRadius="lg"
                  p={5}
                  border="1px solid"
                  borderColor="border.subtle"
                >
                  <Flex justify="space-between" align="center" mb={2}>
                    <Flex align="center" gap={2.5}>
                      <Text fontSize="md" fontWeight="semibold" color="text">
                        {c.name}
                      </Text>
                      <Badge
                        fontSize="xs"
                        bg={cColor.bg}
                        color={cColor.color}
                        px={2}
                        py={0.5}
                        borderRadius="full"
                        fontWeight="semibold"
                      >
                        {c.score}/100
                      </Badge>
                    </Flex>
                    <Text
                      fontSize="sm"
                      color={getStatusColor(c.status)}
                      fontWeight="semibold"
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

      {/* Strengths */}
      {profile.strengths.length > 0 && (
        <Box
          bg="surface"
          borderRadius="xl"
          border="1px solid"
          borderColor="border"
          p={6}
        >
          <Heading as="h4" fontSize="lg" fontWeight="semibold" color="text" mb={5}>
            {t("proofProfile.profileReady.strengths")}
          </Heading>
          <Stack gap={4}>
            {profile.strengths.map((s, i) => (
              <Box
                key={i}
                bg="success.subtle"
                borderRadius="lg"
                p={5}
                border="1px solid"
                borderColor="success.muted"
              >
                <Flex align="center" gap={2.5} mb={2}>
                  <Text fontSize="md" fontWeight="semibold" color="text">
                    {s.criterion_name}
                  </Text>
                  <Badge
                    bg="success.subtle"
                    color="success"
                    fontSize="xs"
                    px={2}
                    py={0.5}
                    borderRadius="full"
                    fontWeight="semibold"
                  >
                    {s.score}/100
                  </Badge>
                </Flex>
                <Text fontSize="sm" color="text.secondary" mb={2} lineHeight="relaxed">
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

      {/* Areas to explore */}
      {profile.areas_to_explore.length > 0 && (
        <Box
          bg="surface"
          borderRadius="xl"
          border="1px solid"
          borderColor="border"
          p={6}
        >
          <Heading as="h4" fontSize="lg" fontWeight="semibold" color="text" mb={5}>
            {t("proofProfile.profileReady.areasForImprovement")}
          </Heading>
          <Stack gap={4}>
            {profile.areas_to_explore.map((a, i) => (
              <Box
                key={i}
                bg="warning.subtle"
                borderRadius="lg"
                p={5}
                border="1px solid"
                borderColor="warning.muted"
              >
                <Flex align="center" gap={2.5} mb={2}>
                  <Text fontSize="md" fontWeight="semibold" color="text">
                    {a.criterion_name}
                  </Text>
                  <Badge
                    bg="warning.subtle"
                    color="warning"
                    fontSize="xs"
                    px={2}
                    py={0.5}
                    borderRadius="full"
                    fontWeight="semibold"
                  >
                    {a.score}/100
                  </Badge>
                </Flex>
                {a.concerns.length > 0 && (
                  <Stack gap={1.5}>
                    {a.concerns.map((concern, j) => (
                      <Text
                        key={j}
                        fontSize="sm"
                        color="text.secondary"
                        lineHeight="relaxed"
                      >
                        • {concern}
                      </Text>
                    ))}
                  </Stack>
                )}
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {/* Public link */}
      {profile.is_public && profile.public_slug && (
        <Box
          bg="bg.subtle"
          borderRadius="lg"
          p={4}
          border="1px solid"
          borderColor="border.subtle"
        >
          <Flex align="center" gap={2}>
            <CheckCircle size={16} />
            <Text fontSize="sm" color="text.secondary">
              {t("proofProfile.profileReady.publicLink", {
                defaultValue: "Public link available",
              })}
            </Text>
          </Flex>
        </Box>
      )}
    </Stack>
  );
}
