import { useNavigate } from "react-router";
import {
  Box,
  Heading,
  Text,
  Stack,
  Flex,
  Button,
  Circle,
} from "@chakra-ui/react";
import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [{ title: "Proof Profile - Baara" }];
};

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

export default function ProofProfile() {
  const navigate = useNavigate();

  return (
    <Box py={12} px={8} maxW="800px" mx="auto">
      {/* Empty State */}
      <Box
        bg="surface"
        borderRadius="2xl"
        border="1px solid"
        borderColor="border"
        shadow="card"
        overflow="hidden"
      >
        {/* Decorative header */}
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
          <Heading as="h1" fontSize="xl" fontWeight="semibold" color="text" mb={2}>
            Votre Proof Profile
          </Heading>
          <Text fontSize="sm" color="text.muted">
            Un profil unique basé sur vos compétences démontrées
          </Text>
        </Box>

        {/* Content */}
        <Box p={8}>
          <Stack gap={6} align="center" textAlign="center">
            {/* Explanation */}
            <Box maxW="420px">
              <Text fontSize="md" color="text.secondary" lineHeight="1.7" mb={6}>
                Votre Proof Profile sera généré automatiquement après avoir complété votre Work Sample.
                Il mettra en valeur vos compétences techniques de manière vérifiable.
              </Text>
            </Box>

            {/* What's included */}
            <Box
              bg="bg.subtle"
              borderRadius="xl"
              p={5}
              w="100%"
              maxW="400px"
              border="1px solid"
              borderColor="border.subtle"
            >
              <Text fontSize="xs" fontWeight="semibold" color="text.muted" textTransform="uppercase" letterSpacing="wider" mb={4}>
                Ce qui sera inclus
              </Text>
              <Stack gap={3}>
                {[
                  "Analyse de votre code et architecture",
                  "Compétences techniques validées",
                  "Points forts et axes d'amélioration",
                  "Score de compatibilité avec les postes",
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
                Généré par IA à partir de votre travail réel
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
              h="52px"
              px={8}
              borderRadius="xl"
              mt={2}
            >
              <Flex align="center" gap={2}>
                <Text>Commencer le Work Sample</Text>
                <ArrowRightIcon />
              </Flex>
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* Additional info */}
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
            <Text fontSize="sm" color="text.muted" lineHeight="1.6">
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
