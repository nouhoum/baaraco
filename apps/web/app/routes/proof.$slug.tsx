"use client";

import { useState, useEffect } from "react";
import type { MetaFunction } from "react-router";
import { useParams } from "react-router";
import {
  Box,
  Container,
  Heading,
  Text,
  Stack,
  Grid,
  Flex,
  Badge,
  Spinner,
  Separator,
} from "@chakra-ui/react";
import { Award, TrendingUp, Star, Zap } from "lucide-react";
import { getPublicProofProfile, type PublicProofProfile } from "~/components/lib/api";

export const meta: MetaFunction = () => {
  return [
    { title: "Proof Profile - Baara" },
    {
      name: "description",
      content: "Profil de compétences prouvées sur Baara.",
    },
  ];
};

const roleLabels: Record<string, string> = {
  backend_go: "Backend Go",
  sre: "SRE / Infrastructure",
  infra_platform: "Platform Engineering",
};

const scoreLabelColors: Record<string, string> = {
  excellent: "green",
  bon: "teal",
  acceptable: "yellow",
  en_dessous_attentes: "orange",
  insuffisant: "red",
};

const scoreLabelDisplay: Record<string, string> = {
  excellent: "Excellent",
  bon: "Good",
  acceptable: "Acceptable",
  en_dessous_attentes: "Below expectations",
  insuffisant: "Insufficient",
};

const recommendationLabels: Record<string, { label: string; color: string }> = {
  proceed_to_interview: { label: "Proceed to interview", color: "green" },
  maybe: { label: "Maybe", color: "yellow" },
  reject: { label: "Not recommended", color: "red" },
};

function ScoreCircle({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = score >= 86 ? "#38B2AC" : score >= 76 ? "#4FD1C5" : score >= 61 ? "#ECC94B" : "#F56565";

  return (
    <Box position="relative" w={`${size}px`} h={`${size}px`}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#2D3748"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <Flex
        position="absolute"
        inset={0}
        align="center"
        justify="center"
        flexDirection="column"
      >
        <Text fontSize="3xl" fontWeight="bold" color="white" lineHeight={1}>
          {score}
        </Text>
        <Text fontSize="xs" color="gray.500">/100</Text>
      </Flex>
    </Box>
  );
}

export default function PublicProofProfilePage() {
  const { slug } = useParams();
  const [profile, setProfile] = useState<PublicProofProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      if (!slug) return;
      try {
        const data = await getPublicProofProfile(slug);
        setProfile(data.proof_profile);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <Box bg="gray.950" minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="teal.400" />
      </Box>
    );
  }

  if (error || !profile) {
    return (
      <Box bg="gray.950" minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Stack gap={4} textAlign="center">
          <Heading fontSize="2xl" color="white">Profile not found</Heading>
          <Text color="gray.400">This proof profile doesn't exist or is not public.</Text>
        </Stack>
      </Box>
    );
  }

  const rec = recommendationLabels[profile.recommendation] || { label: profile.recommendation, color: "gray" };

  return (
    <Box bg="gray.950" minH="100vh">
      {/* Header */}
      <Box py={4} borderBottom="1px solid" borderColor="gray.800">
        <Container maxW="4xl">
          <Flex align="center" gap={2}>
            <Text fontSize="lg" fontWeight="bold" color="white">Baara</Text>
            <Text fontSize="sm" color="gray.500">Proof Profile</Text>
          </Flex>
        </Container>
      </Box>

      <Container maxW="4xl" py={{ base: 8, md: 12 }}>
        <Stack gap={8}>
          {/* Score Header */}
          <Flex
            direction={{ base: "column", md: "row" }}
            align={{ base: "center", md: "flex-start" }}
            gap={8}
            bg="gray.900"
            border="1px solid"
            borderColor="gray.800"
            borderRadius="xl"
            p={{ base: 6, md: 8 }}
          >
            <ScoreCircle score={profile.global_score} />
            <Stack gap={3} flex={1} textAlign={{ base: "center", md: "left" }}>
              {profile.role_type && (
                <Badge
                  colorPalette="teal"
                  variant="subtle"
                  alignSelf={{ base: "center", md: "flex-start" }}
                  px={3}
                  py={1}
                  borderRadius="full"
                >
                  {roleLabels[profile.role_type] || profile.role_type}
                </Badge>
              )}
              <Heading as="h1" fontSize={{ base: "xl", md: "2xl" }} color="white">
                {profile.one_liner}
              </Heading>
              <Flex gap={4} wrap="wrap" justify={{ base: "center", md: "flex-start" }}>
                <Flex align="center" gap={1.5}>
                  <TrendingUp size={14} color="#38B2AC" />
                  <Text fontSize="sm" color="gray.300">
                    Top {100 - profile.percentile}%
                  </Text>
                </Flex>
                <Badge
                  colorPalette={scoreLabelColors[profile.score_label] || "gray"}
                  variant="subtle"
                >
                  {scoreLabelDisplay[profile.score_label] || profile.score_label}
                </Badge>
                <Badge colorPalette={rec.color} variant="subtle">
                  {rec.label}
                </Badge>
              </Flex>
            </Stack>
          </Flex>

          {/* Criteria Summary */}
          {profile.criteria_summary.length > 0 && (
            <Box>
              <Heading as="h2" fontSize="lg" color="white" mb={4}>
                Criteria breakdown
              </Heading>
              <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={3}>
                {profile.criteria_summary.map((criterion, i) => (
                  <Box
                    key={i}
                    bg="gray.900"
                    border="1px solid"
                    borderColor="gray.800"
                    borderRadius="lg"
                    p={4}
                  >
                    <Flex justify="space-between" align="center" mb={2}>
                      <Text fontSize="sm" fontWeight="medium" color="white">
                        {criterion.name}
                      </Text>
                      <Text
                        fontSize="sm"
                        fontWeight="bold"
                        color={
                          criterion.score >= 85
                            ? "green.400"
                            : criterion.score >= 70
                              ? "teal.400"
                              : criterion.score >= 55
                                ? "yellow.400"
                                : "red.400"
                        }
                      >
                        {criterion.score}/100
                      </Text>
                    </Flex>
                    <Box
                      h="4px"
                      bg="gray.800"
                      borderRadius="full"
                      overflow="hidden"
                    >
                      <Box
                        h="full"
                        w={`${criterion.score}%`}
                        bg={
                          criterion.score >= 85
                            ? "green.400"
                            : criterion.score >= 70
                              ? "teal.400"
                              : criterion.score >= 55
                                ? "yellow.400"
                                : "red.400"
                        }
                        borderRadius="full"
                        transition="width 0.8s ease-out"
                      />
                    </Box>
                    {criterion.headline && (
                      <Text fontSize="xs" color="gray.500" mt={2}>
                        {criterion.headline}
                      </Text>
                    )}
                  </Box>
                ))}
              </Grid>
            </Box>
          )}

          {/* Strengths */}
          {profile.strengths.length > 0 && (
            <Box>
              <Heading as="h2" fontSize="lg" color="white" mb={4}>
                <Flex align="center" gap={2}>
                  <Star size={18} color="#38B2AC" />
                  Strengths
                </Flex>
              </Heading>
              <Stack gap={3}>
                {profile.strengths.map((strength, i) => (
                  <Box
                    key={i}
                    bg="gray.900"
                    border="1px solid"
                    borderColor="gray.800"
                    borderRadius="lg"
                    p={4}
                  >
                    <Flex justify="space-between" align="center" mb={2}>
                      <Text fontSize="sm" fontWeight="medium" color="teal.400">
                        {strength.criterion_name}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {strength.score}/100
                      </Text>
                    </Flex>
                    {strength.signals.length > 0 && (
                      <Stack gap={1}>
                        {strength.signals.map((signal, j) => (
                          <Flex key={j} align="flex-start" gap={2}>
                            <Text color="teal.400" mt={0.5}>•</Text>
                            <Text fontSize="sm" color="gray.400">{signal}</Text>
                          </Flex>
                        ))}
                      </Stack>
                    )}
                    {strength.evidence && (
                      <Text fontSize="xs" color="gray.500" mt={2} fontStyle="italic">
                        "{strength.evidence}"
                      </Text>
                    )}
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {/* Footer */}
          <Separator borderColor="gray.800" />
          <Flex justify="center" py={4}>
            <Text fontSize="xs" color="gray.600">
              Verified by Baara · Proof Profile
            </Text>
          </Flex>
        </Stack>
      </Container>
    </Box>
  );
}
