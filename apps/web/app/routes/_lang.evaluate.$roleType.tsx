"use client";

import { useState, useEffect, useRef } from "react";
import type { MetaFunction } from "react-router";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Box,
  Container,
  Heading,
  Text,
  Stack,
  Flex,
  Button,
  Spinner,
} from "@chakra-ui/react";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Layout } from "~/components/layout";
import { authMe, startEvaluation } from "~/components/lib/api";

export const meta: MetaFunction = () => {
  return [
    { title: "Démarrer l'évaluation - Baara" },
    {
      name: "description",
      content: "Démarrez votre Work Sample.",
    },
  ];
};

type PageState = "checking" | "not_authenticated" | "starting" | "cooldown" | "error";

interface CooldownInfo {
  remainingDays: string;
  cooldownEnd: string;
}

export default function EvaluateRoleTypePage() {
  const { lang, roleType } = useParams();
  const { t } = useTranslation("evaluate");
  const navigate = useNavigate();
  const [state, setState] = useState<PageState>("checking");
  const [cooldownInfo, setCooldownInfo] = useState<CooldownInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Prevent double execution (React StrictMode, rapid navigation)
  // Use sessionStorage to persist across component remounts
  const startedRef = useRef(false);
  const sessionKey = `baara_eval_started_${roleType}`;

  useEffect(() => {
    async function checkAndStart() {
      if (!roleType) return;

      // Guard against double execution - check both ref and sessionStorage
      if (startedRef.current) return;
      if (typeof window !== "undefined" && sessionStorage.getItem(sessionKey)) {
        // Already started in this session, check auth and wait
        const me = await authMe();
        if (me) {
          setState("starting");
          return;
        }
      }

      // Check if user is authenticated
      const me = await authMe();
      if (!me) {
        setState("not_authenticated");
        return;
      }

      // Mark as started BEFORE the async call to prevent race conditions
      startedRef.current = true;
      if (typeof window !== "undefined") {
        sessionStorage.setItem(sessionKey, "true");
      }
      setState("starting");

      try {
        const result = await startEvaluation(roleType);
        // Clear the session lock on success
        if (typeof window !== "undefined") {
          sessionStorage.removeItem(sessionKey);
        }
        // Redirect directly to the interview page
        navigate(`/app/interview?attempt=${result.attempt.id}`);
      } catch (err: unknown) {
        // Reset on error so user can retry
        startedRef.current = false;
        if (typeof window !== "undefined") {
          sessionStorage.removeItem(sessionKey);
        }
        const error = err as Error & { message?: string };
        // Check if it's a cooldown error
        if (error.message?.includes("cooldown") || error.message?.includes("wait")) {
          // Try to parse cooldown details from error response
          setState("cooldown");
          setCooldownInfo({
            remainingDays: "90",
            cooldownEnd: "",
          });
        } else {
          setState("error");
          setErrorMessage(error.message || "An error occurred");
        }
      }
    }

    checkAndStart();
  }, [roleType, navigate, sessionKey]);

  return (
    <Layout>
      <Box bg="gray.950" minH="100vh">
        <Box pt={{ base: 32, md: 40 }} pb={{ base: 20, md: 32 }}>
          <Container maxW="lg">
            <Stack gap={6} textAlign="center" align="center">
              {state === "checking" && (
                <>
                  <Spinner size="xl" color="teal.400" />
                  <Text color="gray.400">{t("loading")}</Text>
                </>
              )}

              {state === "starting" && (
                <>
                  <Spinner size="xl" color="teal.400" />
                  <Text color="gray.400">{t("starting")}</Text>
                </>
              )}

              {state === "not_authenticated" && (
                <>
                  <Flex
                    w={16}
                    h={16}
                    borderRadius="full"
                    bg="gray.800"
                    align="center"
                    justify="center"
                    color="gray.400"
                  >
                    <AlertCircle size={32} />
                  </Flex>
                  <Heading as="h1" fontSize="2xl" color="white">
                    {t("loginRequired")}
                  </Heading>
                  <Button
                    colorPalette="teal"
                    size="lg"
                    onClick={() => {
                      // Save intended role for onboarding pre-selection
                      if (typeof window !== "undefined") {
                        localStorage.setItem("baara_selected_role", roleType as string);
                      }
                      // Pass returnTo as query param for proper redirect after login
                      navigate(`/${lang}/login?returnTo=${encodeURIComponent(`/${lang}/evaluate/${roleType}`)}`);
                    }}
                  >
                    {t("loginCta")}
                    <ArrowRight size={16} style={{ marginLeft: 4 }} />
                  </Button>
                </>
              )}

              {state === "cooldown" && cooldownInfo && (
                <>
                  <Flex
                    w={16}
                    h={16}
                    borderRadius="full"
                    bg="orange.500/10"
                    align="center"
                    justify="center"
                    color="orange.400"
                  >
                    <AlertCircle size={32} />
                  </Flex>
                  <Heading as="h1" fontSize="2xl" color="white">
                    {t("cooldown.title")}
                  </Heading>
                  <Text color="gray.400">
                    {t("cooldown.message", { days: cooldownInfo.remainingDays })}
                  </Text>
                  <Button
                    variant="outline"
                    borderColor="gray.700"
                    color="gray.300"
                    onClick={() => navigate(`/${lang}/evaluate`)}
                  >
                    Retour
                  </Button>
                </>
              )}

              {state === "error" && (
                <>
                  <Flex
                    w={16}
                    h={16}
                    borderRadius="full"
                    bg="red.500/10"
                    align="center"
                    justify="center"
                    color="red.400"
                  >
                    <AlertCircle size={32} />
                  </Flex>
                  <Heading as="h1" fontSize="2xl" color="white">
                    Erreur
                  </Heading>
                  <Text color="gray.400">{errorMessage}</Text>
                  <Button
                    variant="outline"
                    borderColor="gray.700"
                    color="gray.300"
                    onClick={() => navigate(`/${lang}/evaluate`)}
                  >
                    Retour
                  </Button>
                </>
              )}
            </Stack>
          </Container>
        </Box>
      </Box>
    </Layout>
  );
}
