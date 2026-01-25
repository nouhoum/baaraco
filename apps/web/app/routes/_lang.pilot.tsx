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
  Button,
  Alert,
  Grid,
  Flex,
  Circle,
  Accordion,
} from "@chakra-ui/react";
import { Layout } from "~/components/layout";
import { FormInput } from "~/components/ui/input";
import { registerRecruiter } from "~/components/lib/api";
import { Glow, AnimatedSection, fadeInUp, StaggeredContainer, StaggeredItem } from "~/components/ui/motion";

export const meta: MetaFunction = () => {
  return [
    { title: "Programme Pilote - Baara" },
    {
      name: "description",
      content:
        "Testez Baara pendant 4 semaines sur un poste réel. Work sample, évaluation structurée, feedback candidat.",
    },
  ];
};

// Icons
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

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function FileTextIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function ListChecksIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 6h11" />
      <path d="M10 12h11" />
      <path d="M10 18h11" />
      <path d="M3 6l1 1 2-2" />
      <path d="M3 12l1 1 2-2" />
      <path d="M3 18l1 1 2-2" />
    </svg>
  );
}

function BotIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8V4H8" />
      <rect x="4" y="8" width="16" height="12" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  );
}

function UserCheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  );
}

function ClipboardCheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  );
}

function MessageSquareIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function HeartHandshakeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      <path d="M12 5L9.04 7.96a2.17 2.17 0 0 0 0 3.08v0c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66" />
      <path d="m18 15-2-2" />
      <path d="m15 18-2-2" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// Benefit item
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

// Feature card for "Ce qui est inclus"
function IncludeCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Box
      h="full"
      p={6}
      bg="rgba(255, 255, 255, 0.02)"
      borderRadius="2xl"
      border="1px solid"
      borderColor="rgba(255, 255, 255, 0.06)"
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={{
        borderColor: "rgba(20, 184, 166, 0.3)",
        transform: "translateY(-4px)",
        bg: "rgba(255, 255, 255, 0.03)",
      }}
    >
      <Stack gap={4} h="full">
        <Circle
          size="48px"
          bg="rgba(20, 184, 166, 0.1)"
          color="brand.400"
          flexShrink={0}
        >
          {icon}
        </Circle>
        <Box flex={1}>
          <Text fontWeight="semibold" color="white" mb={1} fontSize="md">
            {title}
          </Text>
          <Text color="gray.400" fontSize="sm" lineHeight="1.7">
            {description}
          </Text>
        </Box>
      </Stack>
    </Box>
  );
}

// Timeline step
function TimelineStep({
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
    <Flex gap={4} alignItems="flex-start" position="relative">
      {/* Vertical line */}
      {!isLast && (
        <Box
          position="absolute"
          left="19px"
          top="44px"
          w="2px"
          h="calc(100% + 8px)"
          bg="rgba(20, 184, 166, 0.2)"
        />
      )}
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
        zIndex={1}
      >
        {number}
      </Circle>
      <Box pb={6}>
        <Text fontWeight="semibold" color="white" mb={1}>
          {title}
        </Text>
        <Text color="gray.400" fontSize="sm" lineHeight="1.7">
          {description}
        </Text>
      </Box>
    </Flex>
  );
}

// Requirement card
function RequirementCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Box
      h="full"
      p={6}
      bg="rgba(255, 255, 255, 0.02)"
      borderRadius="2xl"
      border="1px solid"
      borderColor="rgba(255, 255, 255, 0.06)"
    >
      <Stack gap={4} h="full">
        <Circle
          size="44px"
          bg="rgba(59, 130, 246, 0.1)"
          color="blue.400"
          flexShrink={0}
        >
          {icon}
        </Circle>
        <Box flex={1}>
          <Text fontWeight="semibold" color="white" mb={1} fontSize="md">
            {title}
          </Text>
          <Text color="gray.400" fontSize="sm" lineHeight="1.7">
            {description}
          </Text>
        </Box>
      </Stack>
    </Box>
  );
}

// KPI card
function KpiCard({ value, label }: { value: string; label: string }) {
  return (
    <Box
      p={5}
      bg="rgba(255, 255, 255, 0.02)"
      borderRadius="xl"
      border="1px solid"
      borderColor="rgba(255, 255, 255, 0.06)"
      textAlign="center"
    >
      <Text
        fontSize="2xl"
        fontWeight="bold"
        color="brand.400"
        fontFamily="heading"
        mb={1}
      >
        {value}
      </Text>
      <Text color="gray.400" fontSize="sm">
        {label}
      </Text>
    </Box>
  );
}

// FAQ item
function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <Accordion.Item
      value={question}
      bg="rgba(255, 255, 255, 0.02)"
      borderRadius="xl"
      border="1px solid"
      borderColor="rgba(255, 255, 255, 0.06)"
      overflow="hidden"
      mb={3}
    >
      <Accordion.ItemTrigger
        px={6}
        py={5}
        _hover={{ bg: "rgba(255, 255, 255, 0.03)" }}
        cursor="pointer"
      >
        <Flex justify="space-between" align="center" w="full">
          <Text fontWeight="medium" color="white" fontSize="md" textAlign="left">
            {question}
          </Text>
          <Accordion.ItemIndicator color="gray.400">
            <ChevronDownIcon />
          </Accordion.ItemIndicator>
        </Flex>
      </Accordion.ItemTrigger>
      <Accordion.ItemContent>
        <Box px={6} pb={5}>
          <Text color="gray.400" fontSize="sm" lineHeight="1.8">
            {answer}
          </Text>
        </Box>
      </Accordion.ItemContent>
    </Accordion.Item>
  );
}

export default function Pilot() {
  const { t } = useTranslation("pilot");
  const { t: tCommon } = useTranslation("common");
  const { lang } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    job_title: "",
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
      await registerRecruiter(formData);
      navigate(`/${lang}/thank-you?type=recruiter`);
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon("errors.genericError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      {/* Hero Section */}
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
            left="30%"
            intensity={1.2}
          />
          <Glow
            color="rgba(59, 130, 246, 0.1)"
            size="400px"
            bottom="10%"
            right="5%"
            intensity={0.8}
          />
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
                    <StarIcon />
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
                  <BenefitItem>{t("benefits.item1")}</BenefitItem>
                  <BenefitItem>{t("benefits.item2")}</BenefitItem>
                  <BenefitItem>{t("benefits.item3")}</BenefitItem>
                  <BenefitItem>{t("benefits.item4")}</BenefitItem>
                </Stack>

                {/* Stats */}
                <Flex gap={10} pt={4} display={{ base: "none", md: "flex" }}>
                  <Stack gap={1}>
                    <Text fontWeight="bold" fontSize="2xl" color="white" fontFamily="heading">
                      {t("stats.duration")}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      {t("stats.durationLabel")}
                    </Text>
                  </Stack>
                  <Box w="1px" bg="rgba(255, 255, 255, 0.1)" />
                  <Stack gap={1}>
                    <Text fontWeight="bold" fontSize="2xl" color="white" fontFamily="heading">
                      {t("stats.candidates")}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      {t("stats.candidatesLabel")}
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
                          label={t("form.company")}
                          name="company"
                          value={formData.company}
                          onChange={handleChange}
                          placeholder={t("form.companyPlaceholder")}
                          required
                          colorMode="dark"
                        />

                        <FormInput
                          label={t("form.jobTitle")}
                          name="job_title"
                          value={formData.job_title}
                          onChange={handleChange}
                          placeholder={t("form.jobTitlePlaceholder")}
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
                          {t("form.callback")}
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

      {/* What's Included Section */}
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
                  {t("includes.label")}
                </Text>
                <Heading
                  as="h2"
                  fontSize={{ base: "2xl", md: "3xl", lg: "3.5rem" }}
                  color="white"
                  fontWeight="700"
                  letterSpacing="-0.02em"
                >
                  {t("includes.title")}
                </Heading>
              </Stack>
            </AnimatedSection>

            <StaggeredContainer>
              <Grid
                templateColumns={{
                  base: "1fr",
                  md: "repeat(2, 1fr)",
                  lg: "repeat(3, 1fr)",
                }}
                gap={6}
                alignItems="stretch"
              >
                <StaggeredItem h="full">
                  <IncludeCard
                    icon={<FileTextIcon />}
                    title={t("includes.items.workSample.title")}
                    description={t("includes.items.workSample.description")}
                  />
                </StaggeredItem>
                <StaggeredItem h="full">
                  <IncludeCard
                    icon={<ListChecksIcon />}
                    title={t("includes.items.rubric.title")}
                    description={t("includes.items.rubric.description")}
                  />
                </StaggeredItem>
                <StaggeredItem h="full">
                  <IncludeCard
                    icon={<BotIcon />}
                    title={t("includes.items.aiEval.title")}
                    description={t("includes.items.aiEval.description")}
                  />
                </StaggeredItem>
                <StaggeredItem h="full">
                  <IncludeCard
                    icon={<UserCheckIcon />}
                    title={t("includes.items.humanReview.title")}
                    description={t("includes.items.humanReview.description")}
                  />
                </StaggeredItem>
                <StaggeredItem h="full">
                  <IncludeCard
                    icon={<ClipboardCheckIcon />}
                    title={t("includes.items.decisionMemo.title")}
                    description={t("includes.items.decisionMemo.description")}
                  />
                </StaggeredItem>
                <StaggeredItem h="full">
                  <IncludeCard
                    icon={<MessageSquareIcon />}
                    title={t("includes.items.feedback.title")}
                    description={t("includes.items.feedback.description")}
                  />
                </StaggeredItem>
              </Grid>
            </StaggeredContainer>
          </Stack>
        </Container>
      </Box>

      {/* Timeline + Requirements Section */}
      <Box py={{ base: 16, md: 24 }} bg="#0A0A0B" position="relative" overflow="hidden">
        <Box position="absolute" inset={0} overflow="hidden" pointerEvents="none">
          <Glow
            color="rgba(20, 184, 166, 0.1)"
            size="500px"
            top="20%"
            right="-10%"
            intensity={0.8}
          />
        </Box>

        <Container maxW="container.xl" px={{ base: 4, md: 8 }} position="relative">
          <Grid
            templateColumns={{ base: "1fr", lg: "1fr 1fr" }}
            gap={{ base: 14, lg: 20 }}
          >
            {/* Timeline */}
            <AnimatedSection variants={fadeInUp}>
              <Stack gap={8}>
                <Stack gap={4}>
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    color="brand.400"
                    textTransform="uppercase"
                    letterSpacing="0.15em"
                  >
                    {t("timeline.label")}
                  </Text>
                  <Heading
                    as="h2"
                    fontSize={{ base: "2xl", md: "3xl" }}
                    color="white"
                    fontWeight="700"
                    letterSpacing="-0.02em"
                  >
                    {t("timeline.title")}
                  </Heading>
                </Stack>

                <Stack gap={0}>
                  <TimelineStep
                    number={1}
                    title={t("timeline.weeks.week1.title")}
                    description={t("timeline.weeks.week1.description")}
                  />
                  <TimelineStep
                    number={2}
                    title={t("timeline.weeks.week2.title")}
                    description={t("timeline.weeks.week2.description")}
                  />
                  <TimelineStep
                    number={3}
                    title={t("timeline.weeks.week3.title")}
                    description={t("timeline.weeks.week3.description")}
                  />
                  <TimelineStep
                    number={4}
                    title={t("timeline.weeks.week4.title")}
                    description={t("timeline.weeks.week4.description")}
                    isLast
                  />
                </Stack>
              </Stack>
            </AnimatedSection>

            {/* Requirements */}
            <AnimatedSection variants={fadeInUp} delay={0.2}>
              <Stack gap={8}>
                <Stack gap={4}>
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    color="brand.400"
                    textTransform="uppercase"
                    letterSpacing="0.15em"
                  >
                    {t("requirements.label")}
                  </Text>
                  <Heading
                    as="h2"
                    fontSize={{ base: "2xl", md: "3xl" }}
                    color="white"
                    fontWeight="700"
                    letterSpacing="-0.02em"
                  >
                    {t("requirements.title")}
                  </Heading>
                </Stack>

                <Stack gap={4}>
                  <RequirementCard
                    icon={<BriefcaseIcon />}
                    title={t("requirements.items.job.title")}
                    description={t("requirements.items.job.description")}
                  />
                  <RequirementCard
                    icon={<ClockIcon />}
                    title={t("requirements.items.time.title")}
                    description={t("requirements.items.time.description")}
                  />
                  <RequirementCard
                    icon={<HeartHandshakeIcon />}
                    title={t("requirements.items.feedback.title")}
                    description={t("requirements.items.feedback.description")}
                  />
                </Stack>
              </Stack>
            </AnimatedSection>
          </Grid>
        </Container>
      </Box>

      {/* KPIs Section */}
      <Box py={{ base: 16, md: 24 }} bg="#08080A">
        <Container maxW="container.xl" px={{ base: 4, md: 8 }}>
          <Stack gap={12}>
            <AnimatedSection variants={fadeInUp}>
              <Stack gap={4} textAlign="center" maxW="2xl" mx="auto">
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  color="brand.400"
                  textTransform="uppercase"
                  letterSpacing="0.15em"
                >
                  {t("kpis.label")}
                </Text>
                <Heading
                  as="h2"
                  fontSize={{ base: "2xl", md: "3xl", lg: "3.5rem" }}
                  color="white"
                  fontWeight="700"
                  letterSpacing="-0.02em"
                >
                  {t("kpis.title")}
                </Heading>
              </Stack>
            </AnimatedSection>

            <StaggeredContainer>
              <Grid
                templateColumns={{
                  base: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                  lg: "repeat(6, 1fr)",
                }}
                gap={4}
              >
                <StaggeredItem>
                  <KpiCard
                    value={t("kpis.items.candidateTime.value")}
                    label={t("kpis.items.candidateTime.label")}
                  />
                </StaggeredItem>
                <StaggeredItem>
                  <KpiCard
                    value={t("kpis.items.completionRate.value")}
                    label={t("kpis.items.completionRate.label")}
                  />
                </StaggeredItem>
                <StaggeredItem>
                  <KpiCard
                    value={t("kpis.items.criteriaAccuracy.value")}
                    label={t("kpis.items.criteriaAccuracy.label")}
                  />
                </StaggeredItem>
                <StaggeredItem>
                  <KpiCard
                    value={t("kpis.items.candidateSat.value")}
                    label={t("kpis.items.candidateSat.label")}
                  />
                </StaggeredItem>
                <StaggeredItem>
                  <KpiCard
                    value={t("kpis.items.hmSat.value")}
                    label={t("kpis.items.hmSat.label")}
                  />
                </StaggeredItem>
                <StaggeredItem>
                  <KpiCard
                    value={t("kpis.items.timeToFeedback.value")}
                    label={t("kpis.items.timeToFeedback.label")}
                  />
                </StaggeredItem>
              </Grid>
            </StaggeredContainer>
          </Stack>
        </Container>
      </Box>

      {/* Pricing Section */}
      <Box py={{ base: 16, md: 24 }} bg="#0A0A0B" position="relative" overflow="hidden">
        <Box position="absolute" inset={0} overflow="hidden" pointerEvents="none">
          <Glow
            color="rgba(20, 184, 166, 0.1)"
            size="500px"
            top="50%"
            left="50%"
            style={{ transform: "translate(-50%, -50%)" }}
          />
        </Box>

        <Container maxW="container.xl" px={{ base: 4, md: 8 }} position="relative">
          <AnimatedSection variants={fadeInUp}>
            <Box
              bg="rgba(255, 255, 255, 0.02)"
              p={{ base: 8, md: 10 }}
              borderRadius="2xl"
              border="1px solid"
              borderColor="rgba(255, 255, 255, 0.08)"
              boxShadow="0 0 60px rgba(20, 184, 166, 0.08)"
              maxW="xl"
              mx="auto"
            >
              <Stack gap={6}>
                <Stack gap={2}>
                  <Flex gap={2} alignItems="center">
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      color="white"
                      bg="linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)"
                      px={3}
                      py={1}
                      borderRadius="full"
                      textTransform="uppercase"
                    >
                      {t("pricing.badge")}
                    </Text>
                  </Flex>
                  <Heading as="h3" fontSize="2xl" color="white" fontWeight="bold">
                    {t("pricing.title")}
                  </Heading>
                  <Text color="gray.400" fontSize="sm">
                    {t("pricing.description")}
                  </Text>
                </Stack>

                <Box w="full" h="1px" bg="rgba(255, 255, 255, 0.08)" />

                <Stack gap={3}>
                  {Object.values(t("pricing.features", { returnObjects: true }) as Record<string, string>).map((item, i) => (
                    <Flex key={i} gap={3} alignItems="center">
                      <Circle size="20px" bg="rgba(20, 184, 166, 0.15)" color="brand.400">
                        <CheckIcon />
                      </Circle>
                      <Text color="gray.300" fontSize="sm">
                        {item}
                      </Text>
                    </Flex>
                  ))}
                </Stack>

                <Button
                  size="lg"
                  w="full"
                  bg="linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)"
                  color="white"
                  fontWeight="600"
                  borderRadius="xl"
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
                  {t("pricing.button")}
                </Button>
              </Stack>
            </Box>
          </AnimatedSection>
        </Container>
      </Box>

      {/* FAQ Section */}
      <Box py={{ base: 16, md: 24 }} bg="#08080A">
        <Container maxW="container.lg" px={{ base: 4, md: 8 }}>
          <Stack gap={12}>
            <AnimatedSection variants={fadeInUp}>
              <Stack gap={4} textAlign="center" maxW="2xl" mx="auto">
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  color="brand.400"
                  textTransform="uppercase"
                  letterSpacing="0.15em"
                >
                  {t("faq.label")}
                </Text>
                <Heading
                  as="h2"
                  fontSize={{ base: "2xl", md: "3xl", lg: "3.5rem" }}
                  color="white"
                  fontWeight="700"
                  letterSpacing="-0.02em"
                >
                  {t("faq.title")}
                </Heading>
              </Stack>
            </AnimatedSection>

            <AnimatedSection variants={fadeInUp} delay={0.1}>
              <Accordion.Root collapsible>
                <FaqItem
                  question={t("faq.items.realJob.question")}
                  answer={t("faq.items.realJob.answer")}
                />
                <FaqItem
                  question={t("faq.items.cost.question")}
                  answer={t("faq.items.cost.answer")}
                />
                <FaqItem
                  question={t("faq.items.time.question")}
                  answer={t("faq.items.time.answer")}
                />
                <FaqItem
                  question={t("faq.items.candidates.question")}
                  answer={t("faq.items.candidates.answer")}
                />
                <FaqItem
                  question={t("faq.items.after.question")}
                  answer={t("faq.items.after.answer")}
                />
                <FaqItem
                  question={t("faq.items.techStack.question")}
                  answer={t("faq.items.techStack.answer")}
                />
              </Accordion.Root>
            </AnimatedSection>
          </Stack>
        </Container>
      </Box>

      {/* CTA Section */}
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
