"use client";

import type { MetaFunction } from "react-router";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Box,
  Container,
  Heading,
  Text,
  Stack,
  Grid,
  Flex,
  Button,
} from "@chakra-ui/react";
import { ArrowRight, Server, Activity, Wrench, Clock, Zap } from "lucide-react";
import { Layout } from "~/components/layout";
import { AnimatedSection, fadeInUp } from "~/components/ui/motion";

export const meta: MetaFunction = () => {
  return [
    { title: "Commencer l'évaluation - Baara" },
    {
      name: "description",
      content: "Choisissez votre rôle et commencez votre Work Sample en 45 minutes.",
    },
  ];
};

const roleIcons: Record<string, React.ReactNode> = {
  backend_go: <Server size={28} />,
  sre: <Activity size={28} />,
  infra_platform: <Wrench size={28} />,
};

const roleColors: Record<string, string> = {
  backend_go: "teal",
  sre: "orange",
  infra_platform: "purple",
};

export default function EvaluatePage() {
  const { lang } = useParams();
  const { t } = useTranslation("evaluate");
  const navigate = useNavigate();

  const roles = ["backend_go", "sre", "infra_platform"] as const;

  return (
    <Layout>
      <Box bg="gray.950" minH="100vh">
        {/* Hero */}
        <Box pt={{ base: 24, md: 32 }} pb={{ base: 12, md: 20 }}>
          <Container maxW="4xl">
            <AnimatedSection variants={fadeInUp}>
              <Stack gap={4} textAlign="center">
                <Heading
                  as="h1"
                  fontSize={{ base: "3xl", md: "5xl" }}
                  fontWeight="bold"
                  color="white"
                  lineHeight="tight"
                >
                  {t("hero.title")}
                </Heading>
                <Text
                  fontSize={{ base: "md", md: "lg" }}
                  color="gray.400"
                  maxW="2xl"
                  mx="auto"
                >
                  {t("hero.subtitle")}
                </Text>

                <Flex gap={4} justify="center" mt={2}>
                  <Flex align="center" gap={1.5} color="gray.400">
                    <Clock size={16} />
                    <Text fontSize="sm" fontWeight="medium">{t("duration")}</Text>
                  </Flex>
                  <Flex align="center" gap={1.5} color="teal.400">
                    <Zap size={16} />
                    <Text fontSize="sm" fontWeight="medium">{t("free")}</Text>
                  </Flex>
                </Flex>
              </Stack>
            </AnimatedSection>
          </Container>
        </Box>

        {/* Role Cards */}
        <Box pb={{ base: 20, md: 32 }}>
          <Container maxW="5xl">
            <Grid
              templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
              gap={6}
            >
              {roles.map((role) => (
                <AnimatedSection key={role} variants={fadeInUp}>
                  <Box
                    bg="gray.900"
                    border="1px solid"
                    borderColor="gray.800"
                    borderRadius="xl"
                    p={6}
                    h="full"
                    display="flex"
                    flexDirection="column"
                    transition="all 0.2s"
                    _hover={{
                      borderColor: `${roleColors[role]}.600`,
                      transform: "translateY(-2px)",
                    }}
                    cursor="pointer"
                    onClick={() => navigate(`/${lang}/evaluate/${role}`)}
                  >
                    {/* Icon */}
                    <Flex
                      w={12}
                      h={12}
                      borderRadius="lg"
                      bg={`${roleColors[role]}.500/10`}
                      color={`${roleColors[role]}.400`}
                      align="center"
                      justify="center"
                      mb={4}
                    >
                      {roleIcons[role]}
                    </Flex>

                    {/* Content */}
                    <Heading
                      as="h3"
                      fontSize="lg"
                      fontWeight="semibold"
                      color="white"
                      mb={2}
                    >
                      {t(`roles.${role}.title`)}
                    </Heading>
                    <Text fontSize="sm" color="gray.400" mb={4} flex={1}>
                      {t(`roles.${role}.description`)}
                    </Text>
                    <Text fontSize="xs" color="gray.500" mb={4}>
                      {t(`roles.${role}.criteria`)}
                    </Text>

                    {/* CTA */}
                    <Button
                      size="sm"
                      variant="outline"
                      borderColor={`${roleColors[role]}.600`}
                      color={`${roleColors[role]}.400`}
                      _hover={{ bg: `${roleColors[role]}.500/10` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/${lang}/evaluate/${role}`);
                      }}
                    >
                      {t("cta")}
                      <ArrowRight size={14} style={{ marginLeft: 4 }} />
                    </Button>
                  </Box>
                </AnimatedSection>
              ))}
            </Grid>
          </Container>
        </Box>
      </Box>
    </Layout>
  );
}
