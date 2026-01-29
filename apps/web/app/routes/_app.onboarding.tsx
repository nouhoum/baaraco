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
import { User, Code, Server, Activity, MoreHorizontal, Linkedin, Github, ArrowRight } from "lucide-react";

export const meta: MetaFunction = () => {
  return [{ title: "Bienvenue - Baara" }];
};

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
    icon: <Code size={20} />,
  },
  {
    id: "infra_platform",
    label: "Infrastructure / Platform",
    description: "Kubernetes, Terraform, CI/CD",
    icon: <Server size={20} />,
  },
  {
    id: "sre",
    label: "SRE",
    description: "Fiabilité, observabilité, on-call",
    icon: <Activity size={20} />,
  },
  {
    id: "other",
    label: "Autre",
    description: "Profil différent",
    icon: <MoreHorizontal size={20} />,
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
              <User size={20} />
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
              <Code size={20} />
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
              <Linkedin size={18} />
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
              <Github size={18} />
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
          {!isSubmitting && <ArrowRight size={18} />}
        </Flex>
      </Button>

      {/* Footer note */}
      <Text fontSize="xs" color="text.secondary" textAlign="center">
        Ces informations nous aident à vous proposer des missions adaptées à votre profil.
      </Text>
    </Stack>
  );
}
