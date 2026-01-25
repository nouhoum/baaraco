"use client";

import { useState } from "react";
import type { MetaFunction } from "react-router";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Box,
  Container,
  Heading,
  Text,
  Stack,
  Alert,
  Grid,
  Flex,
  Circle,
  Button,
} from "@chakra-ui/react";
import { Layout } from "~/components/layout";
import { registerCandidate } from "~/components/lib/api";
import { FormInput } from "~/components/ui/input";
import { Glow, AnimatedSection, fadeInUp, StaggeredContainer, StaggeredItem } from "~/components/ui/motion";

export const meta: MetaFunction = () => {
  return [
    { title: "Candidats - Baara" },
    {
      name: "description",
      content:
        "Rejoignez Baara et montrez votre travail aux recruteurs qui comptent.",
    },
  ];
};

// Check icon component
function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// Benefit item component - Dark mode
function BenefitItem({ children }: { children: React.ReactNode }) {
  return (
    <Flex gap={3} alignItems="flex-start">
      <Circle
        size="22px"
        bg="rgba(20, 184, 166, 0.15)"
        color="brand.400"
        flexShrink={0}
        mt={0.5}
      >
        <CheckIcon />
      </Circle>
      <Text color="gray.300" fontSize="md" lineHeight="1.7">
        {children}
      </Text>
    </Flex>
  );
}

// Step item component - Dark mode
function StepItem({
  number,
  title,
  description,
  isLast = false,
}: {
  number: number;
  title: string;
  description: string;
  isLast?: boolean;
}) {
  return (
    <Box
      p={6}
      bg="rgba(255, 255, 255, 0.02)"
      borderRadius="2xl"
      border="1px solid"
      borderColor={isLast ? "rgba(20, 184, 166, 0.3)" : "rgba(255, 255, 255, 0.06)"}
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={{
        borderColor: "rgba(20, 184, 166, 0.4)",
        transform: "translateY(-4px)",
        bg: "rgba(255, 255, 255, 0.03)",
      }}
    >
      <Flex gap={4} alignItems="flex-start">
        <Circle
          size="40px"
          bg={isLast
            ? "linear-gradient(135deg, #14B8A6 0%, #2DD4BF 100%)"
            : "linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)"
          }
          color="white"
          fontWeight="bold"
          fontSize="sm"
          flexShrink={0}
          boxShadow="0 4px 16px rgba(20, 184, 166, 0.3)"
        >
          {number}
        </Circle>
        <Box>
          <Text fontWeight="semibold" color="white" mb={1} fontSize="md">
            {title}
          </Text>
          <Text color="gray.400" fontSize="sm" lineHeight="1.7">
            {description}
          </Text>
        </Box>
      </Flex>
    </Box>
  );
}

export default function Candidates() {
  const { t } = useTranslation("candidates");
  const { t: tCommon } = useTranslation("common");
  const { lang } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    linkedin_url: "",
    portfolio_url: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await registerCandidate(formData);
      navigate(`/${lang}/thank-you?type=candidate`);
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon("errors.genericError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      {/* Hero Section - Dark Mode */}
      <Box
        as="section"
        bg="#0A0A0B"
        position="relative"
        overflow="hidden"
        pt={{ base: 8, md: 12 }}
        pb={{ base: 16, md: 24 }}
      >
        {/* Background Effects */}
        <Box position="absolute" inset={0} overflow="hidden" pointerEvents="none">
          <Glow
            color="rgba(20, 184, 166, 0.2)"
            size="600px"
            top="-20%"
            left="20%"
            intensity={1.2}
          />
          <Glow
            color="rgba(59, 130, 246, 0.1)"
            size="400px"
            bottom="10%"
            right="10%"
            intensity={0.8}
          />
          {/* Grid pattern */}
          <Box
            position="absolute"
            inset={0}
            opacity={0.03}
            backgroundImage="linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)"
            backgroundSize="60px 60px"
          />
        </Box>

        <Container maxW="container.xl" px={{ base: 4, md: 8 }} position="relative">
          <Grid
            templateColumns={{ base: "1fr", lg: "1fr 1fr" }}
            gap={{ base: 10, lg: 16 }}
            alignItems="start"
          >
            {/* Left Column - Content */}
            <AnimatedSection variants={fadeInUp}>
              <Stack gap={8}>
                {/* Badge */}
                <Box>
                  <Box
                    as="span"
                    display="inline-flex"
                    alignItems="center"
                    gap={2}
                    bg="rgba(20, 184, 166, 0.1)"
                    border="1px solid"
                    borderColor="rgba(20, 184, 166, 0.3)"
                    px={4}
                    py={2}
                    borderRadius="full"
                    fontSize="sm"
                    fontWeight="medium"
                    color="brand.400"
                  >
                    <Circle size="6px" bg="brand.400" />
                    {t("hero.badge")}
                  </Box>
                </Box>

                {/* Heading */}
                <Stack gap={4}>
                  <Heading
                    as="h1"
                    fontSize={{ base: "2.5rem", md: "3.5rem", lg: "4rem" }}
                    lineHeight="1.1"
                    color="white"
                    fontWeight="800"
                    letterSpacing="-0.02em"
                  >
                    {t("hero.title")}{" "}
                    <Text as="span" color="brand.400">
                      {t("hero.titleHighlight")}
                    </Text>
                    {t("hero.titleEnd")}
                  </Heading>
                  <Text
                    fontSize={{ base: "lg", md: "xl" }}
                    color="gray.400"
                    lineHeight="1.7"
                    maxW="500px"
                  >
                    {t("hero.subtitle")}
                  </Text>
                </Stack>

                {/* Benefits List */}
                <Stack gap={3}>
                  <BenefitItem>{t("benefits.projects")}</BenefitItem>
                  <BenefitItem>{t("benefits.discovered")}</BenefitItem>
                  <BenefitItem>{t("benefits.free")}</BenefitItem>
                  <BenefitItem>{t("benefits.opportunities")}</BenefitItem>
                </Stack>

                {/* Trust indicators */}
                <Flex gap={10} pt={4} display={{ base: "none", md: "flex" }}>
                  <Stack gap={1}>
                    <Text fontWeight="bold" fontSize="2xl" color="white" fontFamily="heading">
                      {t("stats.free")}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      {t("stats.freeLabel")}
                    </Text>
                  </Stack>
                  <Box w="1px" bg="rgba(255, 255, 255, 0.1)" />
                  <Stack gap={1}>
                    <Text fontWeight="bold" fontSize="2xl" color="white" fontFamily="heading">
                      {t("stats.time")}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      {t("stats.timeLabel")}
                    </Text>
                  </Stack>
                  <Box w="1px" bg="rgba(255, 255, 255, 0.1)" />
                  <Stack gap={1}>
                    <Text fontWeight="bold" fontSize="2xl" color="white" fontFamily="heading">
                      {t("stats.cv")}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      {t("stats.cvLabel")}
                    </Text>
                  </Stack>
                </Flex>
              </Stack>
            </AnimatedSection>

            {/* Right Column - Form Card */}
            <AnimatedSection variants={fadeInUp} delay={0.2}>
              <Box
                bg="rgba(255, 255, 255, 0.02)"
                borderRadius="2xl"
                border="1px solid"
                borderColor="rgba(255, 255, 255, 0.08)"
                overflow="hidden"
                boxShadow="0 0 60px rgba(20, 184, 166, 0.08)"
                position="relative"
                _before={{
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "3px",
                  background: "linear-gradient(90deg, #0F766E 0%, #14B8A6 50%, #2DD4BF 100%)",
                }}
              >
                <Box p={{ base: 6, md: 8 }}>
                  <Stack gap={6}>
                    <Stack gap={2}>
                      <Heading as="h2" size="lg" color="white" fontWeight="semibold">
                        {t("form.title")}
                      </Heading>
                      <Text color="gray.400" fontSize="sm">
                        {t("form.subtitle")}
                      </Text>
                    </Stack>

                    <form onSubmit={handleSubmit}>
                      <Stack gap={5}>
                        {error && (
                          <Alert.Root status="error" borderRadius="lg" bg="rgba(239, 68, 68, 0.1)" border="1px solid" borderColor="rgba(239, 68, 68, 0.3)">
                            <Alert.Indicator color="red.400" />
                            <Alert.Title fontSize="sm" color="red.400">{error}</Alert.Title>
                          </Alert.Root>
                        )}

                        <FormInput
                          label={t("form.name")}
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder={t("form.namePlaceholder")}
                          required
                          colorMode="dark"
                        />

                        <FormInput
                          label={t("form.email")}
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder={t("form.emailPlaceholder")}
                          required
                          colorMode="dark"
                        />

                        <FormInput
                          label={t("form.linkedin")}
                          name="linkedin_url"
                          value={formData.linkedin_url}
                          onChange={handleChange}
                          placeholder={t("form.linkedinPlaceholder")}
                          colorMode="dark"
                        />

                        <FormInput
                          label={t("form.portfolio")}
                          name="portfolio_url"
                          value={formData.portfolio_url}
                          onChange={handleChange}
                          placeholder={t("form.portfolioPlaceholder")}
                          colorMode="dark"
                        />

                        <Button
                          type="submit"
                          w="full"
                          h={14}
                          mt={2}
                          bg="linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)"
                          color="white"
                          fontWeight="600"
                          borderRadius="xl"
                          fontSize="md"
                          boxShadow="0 4px 20px rgba(20, 184, 166, 0.3)"
                          _hover={{
                            transform: "translateY(-2px)",
                            boxShadow: "0 8px 30px rgba(20, 184, 166, 0.4)",
                          }}
                          _active={{
                            transform: "translateY(0)",
                          }}
                          transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                          loading={isSubmitting}
                        >
                          {t("form.submit")}
                        </Button>

                        <Text fontSize="xs" color="gray.500" textAlign="center">
                          {t("form.terms")}
                        </Text>
                      </Stack>
                    </form>
                  </Stack>
                </Box>
              </Box>
            </AnimatedSection>
          </Grid>
        </Container>
      </Box>

      {/* How it works Section - Dark Mode */}
      <Box py={{ base: 16, md: 24 }} bg="#08080A">
        <Container maxW="container.xl" px={{ base: 4, md: 8 }}>
          <Stack gap={14}>
            <AnimatedSection variants={fadeInUp}>
              <Stack gap={4} textAlign="center" maxW="2xl" mx="auto">
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  color="brand.400"
                  textTransform="uppercase"
                  letterSpacing="0.15em"
                >
                  {t("process.label")}
                </Text>
                <Heading
                  as="h2"
                  fontSize={{ base: "2xl", md: "3xl", lg: "3.5rem" }}
                  color="white"
                  fontWeight="700"
                  letterSpacing="-0.02em"
                >
                  {t("process.title")}
                </Heading>
              </Stack>
            </AnimatedSection>

            <StaggeredContainer>
              <Grid
                templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }}
                gap={{ base: 4, md: 6 }}
              >
                <StaggeredItem>
                  <StepItem
                    number={1}
                    title={t("process.step1.title")}
                    description={t("process.step1.description")}
                  />
                </StaggeredItem>
                <StaggeredItem>
                  <StepItem
                    number={2}
                    title={t("process.step2.title")}
                    description={t("process.step2.description")}
                  />
                </StaggeredItem>
                <StaggeredItem>
                  <StepItem
                    number={3}
                    title={t("process.step3.title")}
                    description={t("process.step3.description")}
                  />
                </StaggeredItem>
                <StaggeredItem>
                  <StepItem
                    number={4}
                    title={t("process.step4.title")}
                    description={t("process.step4.description")}
                    isLast
                  />
                </StaggeredItem>
              </Grid>
            </StaggeredContainer>
          </Stack>
        </Container>
      </Box>

      {/* CTA Section - Dark Mode */}
      <Box
        py={{ base: 16, md: 24 }}
        bg="#0A0A0B"
        position="relative"
        overflow="hidden"
      >
        <Box position="absolute" inset={0} overflow="hidden" pointerEvents="none">
          <Glow
            color="rgba(20, 184, 166, 0.15)"
            size="500px"
            top="50%"
            left="50%"
            style={{ transform: "translate(-50%, -50%)" }}
          />
        </Box>

        <Container maxW="container.md" px={{ base: 4, md: 8 }} position="relative">
          <AnimatedSection variants={fadeInUp}>
            <Stack gap={8} textAlign="center" alignItems="center">
              <Heading
                as="h2"
                fontSize={{ base: "2xl", md: "3xl", lg: "3.5rem" }}
                color="white"
                fontWeight="700"
                letterSpacing="-0.02em"
              >
                {t("cta.title")}
              </Heading>
              <Text color="gray.400" fontSize="lg" maxW="xl" lineHeight="1.8">
                {t("cta.description")}
              </Text>
              <Button
                h={14}
                px={8}
                bg="linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)"
                color="white"
                fontWeight="600"
                borderRadius="xl"
                fontSize="md"
                boxShadow="0 4px 20px rgba(20, 184, 166, 0.3)"
                _hover={{
                  transform: "translateY(-2px)",
                  boxShadow: "0 8px 30px rgba(20, 184, 166, 0.4)",
                }}
                _active={{
                  transform: "translateY(0)",
                }}
                transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                {t("cta.button")}
              </Button>
            </Stack>
          </AnimatedSection>
        </Container>
      </Box>
    </Layout>
  );
}
