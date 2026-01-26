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
} from "@chakra-ui/react";
import type { MetaFunction } from "react-router";
import type { User } from "~/components/lib/api";

export const meta: MetaFunction = () => {
  return [{ title: "Proof Profile - Baara" }];
};

interface OutletContextType {
  user: User | null;
}

// Icons
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

// Additional icons
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

export default function ProofProfile() {
  const navigate = useNavigate();
  const { user } = useOutletContext<OutletContextType>();

  // Get first name from full name
  const getFirstName = (name?: string): string => {
    if (!name) return "Candidat";
    const parts = name.split(" ");
    return parts[0];
  };

  const firstName = getFirstName(user?.name);

  return (
    <Box py={8} px={8} maxW="800px" mx="auto">
      {/* Personalized Header */}
      <Box mb={8}>
        <Flex align="center" gap={2} mb={3}>
          <Circle size="28px" bg="primary.subtle">
            <Box color="primary">
              <RocketIcon />
            </Box>
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

      {/* Progress Indicator */}
      <Box
        bg="surface"
        borderRadius="xl"
        border="1px solid"
        borderColor="border"
        p={5}
        mb={6}
      >
        <Flex justify="space-between" align="center" mb={3}>
          <Text fontSize="sm" fontWeight="semibold" color="text">
            Votre progression
          </Text>
          <Text fontSize="sm" color="text.secondary">
            0% complété
          </Text>
        </Flex>
        <Progress.Root value={0} size="sm" colorPalette="blue">
          <Progress.Track bg="bg.muted" borderRadius="full">
            <Progress.Range borderRadius="full" />
          </Progress.Track>
        </Progress.Root>
        <Flex mt={4} gap={6}>
          <Flex align="center" gap={2}>
            <Circle size="20px" bg="primary" color="white" fontSize="xs" fontWeight="bold">
              1
            </Circle>
            <Text fontSize="sm" color="text" fontWeight="medium">
              Work Sample
            </Text>
          </Flex>
          <Flex align="center" gap={2}>
            <Circle size="20px" bg="bg.muted" color="text.muted" fontSize="xs" fontWeight="bold" border="2px solid" borderColor="border">
              2
            </Circle>
            <Text fontSize="sm" color="text.muted">
              Proof Profile généré
            </Text>
          </Flex>
        </Flex>
      </Box>

      {/* Main Card */}
      <Box
        bg="surface"
        borderRadius="2xl"
        border="1px solid"
        borderColor="border"
        shadow="card"
        overflow="hidden"
      >
        {/* Decorative header with gradient */}
        <Box
          bg="linear-gradient(135deg, var(--chakra-colors-primary-subtle) 0%, var(--chakra-colors-ai-bg) 100%)"
          py={8}
          px={6}
          textAlign="center"
          borderBottom="1px solid"
          borderBottomColor="border.subtle"
        >
          <Circle size="80px" bg="surface" shadow="md" mx="auto" mb={4}>
            <Box color="primary">
              <FileTextIcon />
            </Box>
          </Circle>
          <Heading as="h2" fontSize="xl" fontWeight="semibold" color="text" mb={2}>
            Commencez par le Work Sample
          </Heading>
          <Text fontSize="sm" color="text.secondary">
            Un exercice technique de 45 minutes pour révéler votre potentiel
          </Text>
        </Box>

        {/* Content */}
        <Box p={8}>
          <Stack gap={6} align="center" textAlign="center">
            {/* Quick info badges */}
            <Flex gap={4} flexWrap="wrap" justify="center">
              <Flex
                align="center"
                gap={2}
                bg="bg.subtle"
                px={4}
                py={2}
                borderRadius="full"
                border="1px solid"
                borderColor="border.subtle"
              >
                <Box color="text.secondary">
                  <ClockIcon />
                </Box>
                <Text fontSize="sm" fontWeight="medium" color="text.secondary">
                  ~45 minutes
                </Text>
              </Flex>
              <Flex
                align="center"
                gap={2}
                bg="bg.subtle"
                px={4}
                py={2}
                borderRadius="full"
                border="1px solid"
                borderColor="border.subtle"
              >
                <Box color="text.secondary">
                  <ZapIcon />
                </Box>
                <Text fontSize="sm" fontWeight="medium" color="text.secondary">
                  Résultat instantané
                </Text>
              </Flex>
            </Flex>

            {/* What you'll demonstrate */}
            <Box
              bg="bg.subtle"
              borderRadius="xl"
              p={5}
              w="100%"
              maxW="420px"
              border="1px solid"
              borderColor="border.subtle"
            >
              <Flex align="center" gap={2} mb={4}>
                <Box color="text.secondary">
                  <TargetIcon />
                </Box>
                <Text fontSize="sm" fontWeight="semibold" color="text">
                  Ce que vous allez démontrer
                </Text>
              </Flex>
              <Stack gap={3}>
                {[
                  "Votre capacité à résoudre des problèmes réels",
                  "La qualité et la clarté de votre code",
                  "Votre réflexion technique et vos choix d'architecture",
                  "Votre efficacité dans un contexte réaliste",
                ].map((item, i) => (
                  <Flex key={i} align="center" gap={3}>
                    <Circle size="24px" bg="success.subtle" color="success" flexShrink={0}>
                      <CheckCircleIcon />
                    </Circle>
                    <Text fontSize="sm" color="text.secondary" textAlign="left">
                      {item}
                    </Text>
                  </Flex>
                ))}
              </Stack>
            </Box>

            {/* AI badge */}
            <Flex
              align="center"
              gap={2}
              bg="ai.bg"
              px={4}
              py={2}
              borderRadius="full"
              border="1px solid"
              borderColor="ai.border"
            >
              <Box color="ai.text">
                <SparklesIcon />
              </Box>
              <Text fontSize="xs" fontWeight="medium" color="ai.text">
                Votre Proof Profile sera généré automatiquement par IA
              </Text>
            </Flex>

            {/* CTA */}
            <Button
              onClick={() => navigate("/app/work-sample")}
              size="lg"
              bg="primary"
              color="white"
              shadow="button"
              _hover={{ bg: "primary.hover", transform: "translateY(-1px)", shadow: "buttonHover" }}
              _active={{ transform: "translateY(0)" }}
              transition="all 0.2s"
              fontWeight="medium"
              h="56px"
              px={10}
              borderRadius="xl"
              mt={2}
            >
              <Flex align="center" gap={2}>
                <Text>Commencer le Work Sample</Text>
                <ArrowRightIcon />
              </Flex>
            </Button>

            <Text fontSize="xs" color="text.muted">
              Vous pouvez faire une pause et reprendre à tout moment
            </Text>
          </Stack>
        </Box>
      </Box>

      {/* Why Work Sample info box */}
      <Box
        mt={6}
        bg="info.subtle"
        borderRadius="xl"
        border="1px solid"
        borderColor="info.muted"
        p={5}
      >
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
            <Text fontSize="sm" fontWeight="semibold" color="text" mb={1}>
              Pourquoi un Work Sample ?
            </Text>
            <Text fontSize="sm" color="text.secondary" lineHeight="1.6">
              Les Work Samples permettent d'évaluer vos compétences sur des cas concrets,
              similaires à ce que vous ferez dans votre futur poste. C'est plus fiable qu'un CV
              et plus équitable qu'un entretien classique.
            </Text>
          </Box>
        </Flex>
      </Box>
    </Box>
  );
}
