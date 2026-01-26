import { useParams, useSearchParams, Link } from "react-router";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Circle,
} from "@chakra-ui/react";
import { Logo } from "~/components/ui/logo";

import type { Route } from "./+types/_lang.login.check-email";

function MailIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

export function meta({ params }: Route.MetaArgs) {
  const titles = {
    fr: "Vérifiez votre email | Baara",
    en: "Check your email | Baara",
  };
  const lang = (params.lang as "fr" | "en") || "fr";

  return [{ title: titles[lang] }];
}

export default function CheckEmailPage() {
  const { lang } = useParams();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";

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
            <VStack gap={6}>
              {/* Icon */}
              <Circle size="64px" bg="primary.subtle" color="primary">
                <MailIcon />
              </Circle>

              <VStack gap={2}>
                <Heading size="lg" color="text">
                  {lang === "en" ? "Check your email" : "Vérifiez votre email"}
                </Heading>
                <Text color="text.muted" fontSize="sm">
                  {lang === "en"
                    ? "We sent a magic link to"
                    : "Nous avons envoyé un lien de connexion à"}
                </Text>
                <Text fontWeight="semibold" color="text">
                  {email}
                </Text>
              </VStack>

              <Box
                w="full"
                p={4}
                bg="bg.subtle"
                borderRadius="lg"
                border="1px solid"
                borderColor="border.subtle"
              >
                <Text fontSize="sm" color="text.muted">
                  {lang === "en"
                    ? "Click the link in the email to sign in. The link expires in 15 minutes."
                    : "Cliquez sur le lien dans l'email pour vous connecter. Le lien expire dans 15 minutes."}
                </Text>
              </Box>

              <VStack gap={1}>
                <Text fontSize="sm" color="text.muted">
                  {lang === "en" ? "Didn't receive the email?" : "Vous n'avez pas reçu l'email ?"}
                </Text>
                <Link to={`/${lang || "fr"}/login`}>
                  <Text
                    fontSize="sm"
                    color="primary"
                    fontWeight="medium"
                    _hover={{ textDecoration: "underline" }}
                  >
                    {lang === "en" ? "Try again" : "Réessayer"}
                  </Text>
                </Link>
              </VStack>
            </VStack>
          </Box>

          {/* Tip */}
          <Box
            p={4}
            bg="warning.subtle"
            borderRadius="lg"
            border="1px solid"
            borderColor="warning.muted"
            w="full"
          >
            <Text fontSize="xs" color="warning.fg" textAlign="center">
              {lang === "en"
                ? "Check your spam folder if you don't see the email in your inbox."
                : "Vérifiez votre dossier spam si vous ne trouvez pas l'email."}
            </Text>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
