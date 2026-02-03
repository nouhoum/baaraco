import { useState } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Input,
  Button,
  VStack,
} from "@chakra-ui/react";
import { Logo } from "~/components/ui/logo";
import { authStart } from "~/components/lib/api";

import type { Route } from "./+types/_lang.login";

export function meta({ params }: Route.MetaArgs) {
  const titles = {
    fr: "Connexion | Baara",
    en: "Login | Baara",
  };
  const descriptions = {
    fr: "Connectez-vous à votre compte Baara",
    en: "Sign in to your Baara account",
  };
  const lang = (params.lang as "fr" | "en") || "fr";

  return [
    { title: titles[lang] },
    { name: "description", content: descriptions[lang] },
  ];
}

export default function LoginPage() {
  const { t, i18n } = useTranslation("auth");
  const { lang } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Store returnTo in localStorage before sending magic link
      if (returnTo && typeof window !== "undefined") {
        localStorage.setItem("baara_returnTo", returnTo);
      }
      await authStart({
        email,
        locale: lang || i18n.language,
      });
      // Redirect to check-email page
      navigate(`/${lang || "fr"}/login/check-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
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
            <VStack gap={6}>
              <VStack gap={2} textAlign="center">
                <Heading size="lg" color="text">
                  {lang === "en" ? "Welcome back" : "Bon retour"}
                </Heading>
                <Text color="text.muted" fontSize="sm">
                  {lang === "en"
                    ? "Enter your email to receive a magic link"
                    : "Entrez votre email pour recevoir un lien de connexion"}
                </Text>
              </VStack>

              <form onSubmit={handleSubmit} style={{ width: "100%" }}>
                <VStack gap={4}>
                  <Box w="full">
                    <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                      Email
                    </Text>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vous@exemple.com"
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
                    />
                  </Box>

                  {error && (
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
                    loading={isLoading}
                    loadingText={lang === "en" ? "Sending..." : "Envoi..."}
                  >
                    {lang === "en" ? "Continue with email" : "Continuer avec l'email"}
                  </Button>
                </VStack>
              </form>

              <Text fontSize="xs" color="text.placeholder" textAlign="center">
                {lang === "en"
                  ? "We'll send you a secure link to sign in. No password needed."
                  : "Nous vous enverrons un lien sécurisé. Pas de mot de passe requis."}
              </Text>
            </VStack>
          </Box>

          {/* Footer links */}
          <Flex gap={4} fontSize="sm" color="text.muted">
            <Link to={`/${lang || "fr"}`}>
              <Text _hover={{ color: "primary" }}>
                {lang === "en" ? "Back to home" : "Retour à l'accueil"}
              </Text>
            </Link>
          </Flex>
        </VStack>
      </Container>
    </Box>
  );
}
