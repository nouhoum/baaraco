import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Input,
  Button,
  Spinner,
} from "@chakra-ui/react";
import { Logo } from "~/components/ui/logo";
import { getInviteInfo, acceptInvite, type InviteInfo } from "~/components/lib/api";

export function meta() {
  return [
    { title: "Accepter l'invitation | Baara" },
  ];
}

export default function InviteAcceptPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [status, setStatus] = useState<"loading" | "form" | "submitting" | "error">("loading");
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  // Load invite info
  useEffect(() => {
    const loadInvite = async () => {
      if (!token) {
        setStatus("error");
        setError("Lien d'invitation invalide");
        return;
      }

      try {
        const info = await getInviteInfo(token);
        if (!info.valid) {
          setStatus("error");
          setError("Cette invitation a expiré ou a déjà été utilisée");
          return;
        }
        setInvite(info);
        setStatus("form");
      } catch {
        setStatus("error");
        setError("Impossible de charger l'invitation");
      }
    };

    loadInvite();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.length < 2) {
      setError("Le nom doit contenir au moins 2 caractères");
      return;
    }

    setStatus("submitting");
    setError("");

    try {
      const response = await acceptInvite(token, { name: name.trim() });
      if (response.success) {
        // Redirect based on role
        if (response.user.role === "recruiter") {
          navigate("/app/jobs");
        } else if (response.user.role === "candidate") {
          // Candidate goes to onboarding if needed, then work sample
          if (!response.user.onboarding_completed_at) {
            navigate("/app/onboarding");
          } else {
            navigate("/app/work-sample");
          }
        } else {
          navigate("/app/jobs");
        }
      }
    } catch (err) {
      setStatus("form");
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    }
  };

  return (
    <Box minH="100vh" bg="bg" py={16}>
      <Container maxW="sm">
        <VStack gap={8}>
          {/* Logo */}
          <Logo size="medium" />

          {/* Card */}
          <Box
            w="full"
            bg="surface"
            borderRadius="2xl"
            p={8}
            shadow="lg"
            border="1px solid"
            borderColor="border.subtle"
          >
            {status === "loading" && (
              <VStack gap={6}>
                <Spinner size="xl" color="primary" />
                <Text color="text.muted">Chargement...</Text>
              </VStack>
            )}

            {status === "error" && (
              <VStack gap={6} textAlign="center">
                <Box
                  w="64px"
                  h="64px"
                  borderRadius="full"
                  bg="error.subtle"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  mx="auto"
                >
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ color: "var(--chakra-colors-error)" }}
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </Box>
                <VStack gap={2}>
                  <Heading size="md" color="text">
                    Invitation invalide
                  </Heading>
                  <Text color="text.muted" fontSize="sm">
                    {error}
                  </Text>
                </VStack>
                <Link to="/fr">
                  <Box
                    as="button"
                    px={6}
                    py={3}
                    bg="primary"
                    color="white"
                    fontWeight="semibold"
                    borderRadius="lg"
                    fontSize="md"
                    _hover={{ bg: "primary.hover" }}
                  >
                    Retour à l'accueil
                  </Box>
                </Link>
              </VStack>
            )}

            {(status === "form" || status === "submitting") && invite && (
              <VStack gap={6}>
                <VStack gap={2} textAlign="center">
                  <Heading size="lg" color="text">
                    Bienvenue sur Baara !
                  </Heading>
                  {invite.role === "recruiter" && invite.org_name && (
                    <Text color="text.muted" fontSize="sm">
                      Vous avez été invité à rejoindre <strong>{invite.org_name}</strong> en tant que recruteur
                    </Text>
                  )}
                  {invite.role === "candidate" && (
                    <Text color="text.muted" fontSize="sm">
                      {invite.org_name && invite.job_title ? (
                        <>
                          <strong>{invite.org_name}</strong> vous invite à compléter une évaluation pour{" "}
                          <strong>{invite.job_title}</strong>
                        </>
                      ) : (
                        "Vous avez été invité à créer votre Proof Profile"
                      )}
                    </Text>
                  )}
                </VStack>

                {/* Email display */}
                <Box
                  w="full"
                  p={3}
                  bg="bg.subtle"
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="border.subtle"
                >
                  <Text fontSize="xs" color="text.muted" mb={1}>
                    Email
                  </Text>
                  <Text fontSize="sm" fontWeight="medium" color="text">
                    {invite.email}
                  </Text>
                </Box>

                <form onSubmit={handleSubmit} style={{ width: "100%" }}>
                  <VStack gap={4}>
                    <Box w="full">
                      <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                        Votre nom complet
                      </Text>
                      <Input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Jean Dupont"
                        size="lg"
                        bg="bg"
                        border="1px solid"
                        borderColor="border"
                        _hover={{ borderColor: "border.emphasis" }}
                        _focus={{
                          borderColor: "primary",
                          boxShadow: "0 0 0 1px var(--chakra-colors-primary)",
                        }}
                        required
                        minLength={2}
                      />
                    </Box>

                    {error && status === "form" && (
                      <Box
                        w="full"
                        p={3}
                        bg="error.subtle"
                        borderRadius="lg"
                        border="1px solid"
                        borderColor="error.muted"
                      >
                        <Text fontSize="sm" color="error">
                          {error}
                        </Text>
                      </Box>
                    )}

                    <Button
                      type="submit"
                      w="full"
                      size="lg"
                      bg="primary"
                      color="white"
                      fontWeight="semibold"
                      _hover={{ bg: "primary.hover" }}
                      loading={status === "submitting"}
                      loadingText="Activation..."
                    >
                      Activer mon compte
                    </Button>
                  </VStack>
                </form>

                <Text fontSize="xs" color="text.placeholder" textAlign="center">
                  En créant votre compte, vous acceptez nos conditions d'utilisation.
                </Text>
              </VStack>
            )}
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
