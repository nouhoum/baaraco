import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Spinner,
} from "@chakra-ui/react";
import { Logo } from "~/components/ui/logo";
import { authExchange } from "~/components/lib/api";

export function meta() {
  return [
    { title: "Connexion... | Baara" },
  ];
}

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");

  const token = searchParams.get("token");

  useEffect(() => {
    const handleCallback = async () => {
      if (!token) {
        setStatus("error");
        setError("Lien invalide");
        return;
      }

      try {
        const response = await authExchange({ token });
        if (response.success && response.user) {
          setStatus("success");
          // Redirect based on role
          setTimeout(() => {
            if (response.user.role === "candidate") {
              navigate("/app/outcome-brief");
            } else {
              navigate("/app/outcome-brief");
            }
          }, 1500);
        }
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Lien invalide ou expiré");
      }
    };

    handleCallback();
  }, [token, navigate]);

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
            textAlign="center"
          >
            {status === "loading" && (
              <VStack gap={6}>
                <Spinner size="xl" color="primary" />
                <VStack gap={2}>
                  <Heading size="md" color="text">
                    Connexion en cours...
                  </Heading>
                  <Text color="text.muted" fontSize="sm">
                    Vérification de votre lien
                  </Text>
                </VStack>
              </VStack>
            )}

            {status === "success" && (
              <VStack gap={6}>
                <Box
                  w="64px"
                  h="64px"
                  borderRadius="full"
                  bg="success.subtle"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ color: "var(--chakra-colors-success)" }}
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </Box>
                <VStack gap={2}>
                  <Heading size="md" color="text">
                    Connecté avec succès !
                  </Heading>
                  <Text color="text.muted" fontSize="sm">
                    Redirection vers l'application...
                  </Text>
                </VStack>
              </VStack>
            )}

            {status === "error" && (
              <VStack gap={6}>
                <Box
                  w="64px"
                  h="64px"
                  borderRadius="full"
                  bg="error.subtle"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
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
                    Lien invalide
                  </Heading>
                  <Text color="text.muted" fontSize="sm">
                    {error}
                  </Text>
                </VStack>
                <Link to="/fr/login">
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
                    Retourner à la connexion
                  </Box>
                </Link>
              </VStack>
            )}
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
