import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Heading,
  Text,
  Stack,
  Flex,
  Button,
  Input,
  Circle,
  Grid,
} from "@chakra-ui/react";
import type { MetaFunction } from "react-router";
import { completeOnboarding, type RoleType } from "~/components/lib/api";

export const meta: MetaFunction = () => {
  return [{ title: "Bienvenue - Baara" }];
};

// Icons
function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function ServerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
      <line x1="6" y1="6" x2="6.01" y2="6" />
      <line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function MoreHorizontalIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
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

interface RoleOption {
  id: RoleType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const roleOptions: RoleOption[] = [
  {
    id: "backend_go",
    label: "Backend Go",
    description: "APIs, microservices, systèmes distribués",
    icon: <CodeIcon />,
  },
  {
    id: "infra_platform",
    label: "Infrastructure / Platform",
    description: "Kubernetes, Terraform, CI/CD",
    icon: <ServerIcon />,
  },
  {
    id: "sre",
    label: "SRE",
    description: "Fiabilité, observabilité, on-call",
    icon: <ActivityIcon />,
  },
  {
    id: "other",
    label: "Autre",
    description: "Profil différent",
    icon: <MoreHorizontalIcon />,
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [roleType, setRoleType] = useState<RoleType | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isValid = name.trim().length >= 2 && roleType !== null;

  const handleSubmit = async () => {
    if (!isValid || !roleType) return;

    setIsSubmitting(true);
    setError("");

    try {
      await completeOnboarding({
        name: name.trim(),
        role_type: roleType,
        linkedin_url: linkedinUrl.trim() || undefined,
        github_username: githubUsername.trim() || undefined,
      });

      navigate("/app/proof-profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack gap={8}>
      {/* Header */}
      <Box textAlign="center">
        <Heading as="h1" fontSize="2xl" fontWeight="semibold" color="text" mb={3}>
          Bienvenue sur Baara
        </Heading>
        <Text fontSize="md" color="text.secondary" maxW="400px" mx="auto">
          Quelques informations pour personnaliser votre expérience
        </Text>
      </Box>

      {/* Name field */}
      <Box>
        <Flex align="center" gap={2} mb={3}>
          <Circle size="32px" bg="primary.subtle">
            <Box color="primary">
              <UserIcon />
            </Box>
          </Circle>
          <Text fontSize="sm" fontWeight="semibold" color="text">
            Comment vous appelez-vous ?
          </Text>
        </Flex>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Prénom et nom"
          size="lg"
          bg="surface"
          border="1px solid"
          borderColor="border"
          borderRadius="lg"
          _hover={{ borderColor: "border.emphasis" }}
          _focus={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
          _placeholder={{ color: "text.placeholder" }}
        />
      </Box>

      {/* Role type selection */}
      <Box>
        <Flex align="center" gap={2} mb={3}>
          <Circle size="32px" bg="info.subtle">
            <Box color="info">
              <CodeIcon />
            </Box>
          </Circle>
          <Text fontSize="sm" fontWeight="semibold" color="text">
            Quel type de poste recherchez-vous ?
          </Text>
        </Flex>
        <Grid templateColumns={{ base: "1fr", sm: "1fr 1fr" }} gap={3}>
          {roleOptions.map((option) => (
            <Box
              key={option.id}
              as="button"
              type="button"
              onClick={() => setRoleType(option.id)}
              bg={roleType === option.id ? "primary.subtle" : "surface"}
              border="2px solid"
              borderColor={roleType === option.id ? "primary" : "border"}
              borderRadius="xl"
              p={4}
              textAlign="left"
              cursor="pointer"
              transition="all 0.2s"
              _hover={{
                borderColor: roleType === option.id ? "primary" : "border.emphasis",
                bg: roleType === option.id ? "primary.subtle" : "bg.subtle",
              }}
            >
              <Flex align="start" gap={3}>
                <Circle
                  size="36px"
                  bg={roleType === option.id ? "primary" : "bg.emphasis"}
                  color={roleType === option.id ? "white" : "text.secondary"}
                  flexShrink={0}
                >
                  {option.icon}
                </Circle>
                <Box>
                  <Text
                    fontSize="sm"
                    fontWeight="semibold"
                    color={roleType === option.id ? "primary" : "text"}
                    mb={0.5}
                  >
                    {option.label}
                  </Text>
                  <Text fontSize="xs" color="text.secondary" lineHeight="1.4">
                    {option.description}
                  </Text>
                </Box>
              </Flex>
            </Box>
          ))}
        </Grid>
      </Box>

      {/* Optional fields */}
      <Box>
        <Text fontSize="xs" fontWeight="semibold" color="text.muted" textTransform="uppercase" letterSpacing="wider" mb={3}>
          Optionnel
        </Text>
        <Stack gap={3}>
          <Flex
            align="center"
            gap={3}
            bg="surface"
            border="1px solid"
            borderColor="border"
            borderRadius="lg"
            px={4}
            py={2}
            _focusWithin={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
          >
            <Box color="text.secondary">
              <LinkedinIcon />
            </Box>
            <Input
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="linkedin.com/in/votre-profil"
              variant="unstyled"
              size="md"
              _placeholder={{ color: "text.placeholder" }}
            />
          </Flex>
          <Flex
            align="center"
            gap={3}
            bg="surface"
            border="1px solid"
            borderColor="border"
            borderRadius="lg"
            px={4}
            py={2}
            _focusWithin={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
          >
            <Box color="text.secondary">
              <GithubIcon />
            </Box>
            <Input
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
              placeholder="votre-username-github"
              variant="unstyled"
              size="md"
              _placeholder={{ color: "text.placeholder" }}
            />
          </Flex>
        </Stack>
      </Box>

      {/* Error message */}
      {error && (
        <Box bg="error.subtle" border="1px solid" borderColor="error.muted" borderRadius="lg" px={4} py={3}>
          <Text fontSize="sm" color="error">
            {error}
          </Text>
        </Box>
      )}

      {/* Submit button */}
      <Button
        onClick={handleSubmit}
        disabled={!isValid || isSubmitting}
        size="lg"
        bg="primary"
        color="white"
        shadow="button"
        _hover={{ bg: "primary.hover", transform: "translateY(-1px)", shadow: "buttonHover" }}
        _active={{ transform: "translateY(0)" }}
        _disabled={{ opacity: 0.5, cursor: "not-allowed", transform: "none" }}
        transition="all 0.2s"
        fontWeight="medium"
        h="52px"
        borderRadius="xl"
        w="100%"
      >
        <Flex align="center" gap={2}>
          <Text>{isSubmitting ? "Chargement..." : "Commencer"}</Text>
          {!isSubmitting && <ArrowRightIcon />}
        </Flex>
      </Button>

      {/* Footer note */}
      <Text fontSize="xs" color="text.secondary" textAlign="center">
        Ces informations nous aident à vous proposer des missions adaptées à votre profil.
      </Text>
    </Stack>
  );
}
