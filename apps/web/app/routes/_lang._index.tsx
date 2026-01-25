"use client";

import type { MetaFunction } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Box,
  Container,
  Heading,
  Text,
  Stack,
  Flex,
  Grid,
  Accordion,
  Circle,
} from "@chakra-ui/react";
import { Link, useParams } from "react-router";
import { Layout } from "~/components/layout";
import {
  AnimatedSection,
  StaggeredContainer,
  StaggeredItem,
  AnimatedCounter,
  GradientText,
  Glow,
  HoverCard,
  MotionBox,
  fadeInUp,
  scaleIn,
} from "~/components/ui/motion";

export const meta: MetaFunction = () => {
  return [
    { title: "Baara - Shortlist prouvée en 7 jours pour Backend Go / Infra" },
    {
      name: "description",
      content:
        "Scorecard + work sample court + decision memo explicable. Réduisez 30-50% des entretiens inutiles, sans sacrifier la qualité.",
    },
  ];
};

// ============================================================================
// ICONS
// ============================================================================

function ArrowRightIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 10h12M12 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <rect x="4" y="4" width="16" height="18" rx="2" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="m12 2 10 5-10 5L2 7l10-5z" />
      <path d="m2 12 10 5 10-5" />
      <path d="m2 17 10 5 10-5" />
    </svg>
  );
}

function ChevronIcon({ isOpen }: { isOpen?: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{
        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 0.2s ease",
      }}
    >
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Workflow step icons
function BriefcaseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  );
}

function ListCheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M11 12h10M11 18h10M11 6h10" />
      <path d="m3 12 2 2 4-4M3 18l2 2 4-4M3 6l2 2 4-4" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" />
    </svg>
  );
}

function FileTextIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  );
}

// ============================================================================
// COMPONENTS
// ============================================================================

// Premium Button Component
function PremiumButton({
  children,
  variant = "primary",
  size = "lg",
  href,
  ...props
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg" | "xl";
  href?: string;
}) {
  const sizeStyles = {
    md: { h: "44px", px: 5, fontSize: "sm" },
    lg: { h: "52px", px: 7, fontSize: "md" },
    xl: { h: "60px", px: 9, fontSize: "md" },
  };

  const baseStyles = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    fontWeight: "500",
    borderRadius: "xl",
    cursor: "pointer",
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative" as const,
    overflow: "hidden",
    ...sizeStyles[size],
  };

  const variantStyles = {
    primary: {
      bg: "linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)",
      color: "white",
      boxShadow: "0 4px 20px rgba(15, 118, 110, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.1) inset",
      _hover: {
        transform: "translateY(-2px)",
        boxShadow: "0 8px 30px rgba(15, 118, 110, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.15) inset",
      },
      _active: { transform: "translateY(0)" },
    },
    secondary: {
      bg: "rgba(255, 255, 255, 0.05)",
      color: "white",
      border: "1px solid rgba(255, 255, 255, 0.15)",
      backdropFilter: "blur(10px)",
      _hover: {
        bg: "rgba(255, 255, 255, 0.1)",
        borderColor: "rgba(255, 255, 255, 0.25)",
        transform: "translateY(-2px)",
      },
      _active: { transform: "translateY(0)" },
    },
    ghost: {
      bg: "transparent",
      color: "gray.400",
      _hover: { color: "white", bg: "rgba(255, 255, 255, 0.05)" },
    },
  };

  const content = (
    <Box as="span" {...baseStyles} {...variantStyles[variant]} {...props}>
      {children}
    </Box>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  return content;
}

// Feature Card
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <HoverCard>
      <Box
        p={8}
        bg="rgba(255, 255, 255, 0.02)"
        border="1px solid"
        borderColor="rgba(255, 255, 255, 0.08)"
        borderRadius="2xl"
        position="relative"
        overflow="hidden"
        _hover={{
          bg: "rgba(255, 255, 255, 0.04)",
          borderColor: "rgba(20, 184, 166, 0.3)",
        }}
        transition="all 0.3s"
      >
        <Box
          position="absolute"
          top={0}
          right={0}
          w="200px"
          h="200px"
          bg="radial-gradient(circle, rgba(20, 184, 166, 0.08) 0%, transparent 70%)"
          transform="translate(50%, -50%)"
        />
        <Stack gap={5} position="relative">
          <Circle
            size="56px"
            bg="linear-gradient(135deg, rgba(20, 184, 166, 0.2) 0%, rgba(20, 184, 166, 0.05) 100%)"
            border="1px solid rgba(20, 184, 166, 0.3)"
            color="brand.400"
          >
            {icon}
          </Circle>
          <Stack gap={2}>
            <Heading as="h3" fontSize="xl" fontWeight="600" color="white">
              {title}
            </Heading>
            <Text color="gray.400" lineHeight="1.7" fontSize="md">
              {description}
            </Text>
          </Stack>
        </Stack>
      </Box>
    </HoverCard>
  );
}

// Metric Card
function MetricCard({
  value,
  label,
  description,
  prefix = "",
  suffix = "",
}: {
  value: number;
  label: string;
  description: string;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <Box
      p={8}
      bg="rgba(255, 255, 255, 0.02)"
      border="1px solid"
      borderColor="rgba(255, 255, 255, 0.08)"
      borderRadius="2xl"
      textAlign="center"
      position="relative"
      overflow="hidden"
      _hover={{ borderColor: "rgba(20, 184, 166, 0.4)" }}
      transition="all 0.3s"
    >
      <Stack gap={3}>
        <Text
          fontSize="xs"
          fontWeight="600"
          color="brand.400"
          textTransform="uppercase"
          letterSpacing="wider"
        >
          {label}
        </Text>
        <Text
          fontSize={{ base: "4xl", md: "5xl" }}
          fontWeight="700"
          letterSpacing="-0.03em"
          lineHeight="1"
        >
          <GradientText>
            <AnimatedCounter from={0} to={value} prefix={prefix} suffix={suffix} />
          </GradientText>
        </Text>
        <Text fontSize="sm" color="gray.500">
          {description}
        </Text>
      </Stack>
    </Box>
  );
}

// Workflow Step
function WorkflowStep({
  number,
  icon,
  title,
  description,
  isLast = false,
}: {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  isLast?: boolean;
}) {
  return (
    <Flex gap={6} position="relative">
      {/* Timeline */}
      <Flex direction="column" alignItems="center" flexShrink={0}>
        <Circle
          size="48px"
          bg="linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)"
          color="white"
          fontWeight="700"
          fontSize="lg"
          boxShadow="0 0 20px rgba(20, 184, 166, 0.4)"
        >
          {number}
        </Circle>
        {!isLast && (
          <Box
            w="2px"
            flex={1}
            minH="60px"
            bg="linear-gradient(180deg, rgba(20, 184, 166, 0.5) 0%, rgba(20, 184, 166, 0.1) 100%)"
            mt={3}
          />
        )}
      </Flex>

      {/* Content */}
      <Box pb={isLast ? 0 : 10} flex={1}>
        <HoverCard>
          <Box
            p={6}
            bg="rgba(255, 255, 255, 0.02)"
            border="1px solid"
            borderColor="rgba(255, 255, 255, 0.08)"
            borderRadius="xl"
            _hover={{
              bg: "rgba(255, 255, 255, 0.04)",
              borderColor: "rgba(20, 184, 166, 0.3)",
            }}
            transition="all 0.3s"
          >
            <Flex gap={4} alignItems="start">
              <Circle
                size="40px"
                bg="rgba(20, 184, 166, 0.1)"
                color="brand.400"
                flexShrink={0}
              >
                {icon}
              </Circle>
              <Stack gap={2}>
                <Heading as="h3" fontSize="lg" fontWeight="600" color="white">
                  {title}
                </Heading>
                <Text color="gray.400" fontSize="sm" lineHeight="1.7">
                  {description}
                </Text>
              </Stack>
            </Flex>
          </Box>
        </HoverCard>
      </Box>
    </Flex>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Index() {
  const { t } = useTranslation("home");
  const { lang } = useParams();

  const workflowSteps = [
    {
      icon: <BriefcaseIcon />,
      title: t("howItWorks.steps.0.title"),
      description: t("howItWorks.steps.0.description"),
    },
    {
      icon: <ListCheckIcon />,
      title: t("howItWorks.steps.1.title"),
      description: t("howItWorks.steps.1.description"),
    },
    {
      icon: <CodeIcon />,
      title: t("howItWorks.steps.2.title"),
      description: t("howItWorks.steps.2.description"),
    },
    {
      icon: <MessageIcon />,
      title: t("howItWorks.steps.3.title"),
      description: t("howItWorks.steps.3.description"),
    },
    {
      icon: <FileTextIcon />,
      title: t("howItWorks.steps.4.title"),
      description: t("howItWorks.steps.4.description"),
    },
  ];

  return (
    <Layout>
      {/* ================================================================== */}
      {/* HERO SECTION */}
      {/* ================================================================== */}
      <Box
        as="section"
        bg="#0A0A0B"
        position="relative"
        overflow="hidden"
        minH="100vh"
        display="flex"
        alignItems="center"
        mt={{ base: "-64px", md: "-72px" }}
        pt={{ base: "64px", md: "72px" }}
      >
        {/* Background Effects */}
        <Box position="absolute" inset={0} overflow="hidden" pointerEvents="none">
          {/* Gradient Mesh */}
          <Box
            position="absolute"
            top="-20%"
            left="50%"
            transform="translateX(-50%)"
            w="150%"
            h="80%"
            bg="radial-gradient(ellipse at center, rgba(20, 184, 166, 0.12) 0%, transparent 60%)"
          />
          {/* Glow spots */}
          <Glow color="rgba(20, 184, 166, 0.25)" size="600px" top="-10%" left="10%" />
          <Glow color="rgba(59, 130, 246, 0.15)" size="400px" bottom="10%" right="5%" />
          {/* Grid pattern */}
          <Box
            position="absolute"
            inset={0}
            opacity={0.03}
            backgroundImage="linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)"
            backgroundSize="60px 60px"
          />
        </Box>

        <Container maxW="container.xl" px={{ base: 6, md: 8 }} py={{ base: 20, md: 32 }} position="relative">
          <Stack gap={{ base: 10, md: 14 }} maxW="900px" mx="auto" textAlign="center">
            {/* Badge */}
            <AnimatedSection variants={fadeInUp}>
              <Flex justify="center">
                <Box
                  display="inline-flex"
                  alignItems="center"
                  gap={2}
                  px={4}
                  py={2}
                  bg="rgba(20, 184, 166, 0.1)"
                  border="1px solid rgba(20, 184, 166, 0.3)"
                  borderRadius="full"
                  backdropFilter="blur(10px)"
                >
                  <SparklesIcon />
                  <Text fontSize="sm" fontWeight="500" color="brand.400">
                    {t("hero.badge")}
                  </Text>
                </Box>
              </Flex>
            </AnimatedSection>

            {/* Title */}
            <AnimatedSection variants={fadeInUp} delay={0.1}>
              <Heading
                as="h1"
                fontSize={{ base: "3xl", sm: "4xl", md: "5xl", lg: "6xl" }}
                fontWeight="700"
                letterSpacing="-0.03em"
                lineHeight="1.1"
                color="white"
              >
                {t("hero.title").split("7 jours")[0]}
                <GradientText>7 jours</GradientText>
                {t("hero.title").split("7 jours")[1]}
              </Heading>
            </AnimatedSection>

            {/* Subtitle */}
            <AnimatedSection variants={fadeInUp} delay={0.2}>
              <Text
                fontSize={{ base: "lg", md: "xl" }}
                color="gray.400"
                lineHeight="1.8"
                maxW="700px"
                mx="auto"
              >
                {t("hero.subtitle")}
              </Text>
            </AnimatedSection>

            {/* CTAs */}
            <AnimatedSection variants={fadeInUp} delay={0.3}>
              <Flex
                gap={4}
                direction={{ base: "column", sm: "row" }}
                justify="center"
                align="center"
              >
                <PremiumButton variant="primary" size="xl" href={`/${lang}/pilot`}>
                  {t("hero.primaryCta")}
                  <ArrowRightIcon />
                </PremiumButton>
                <PremiumButton variant="secondary" size="xl">
                  {t("hero.secondaryCta")}
                </PremiumButton>
              </Flex>
            </AnimatedSection>

            {/* Trust indicators */}
            <AnimatedSection variants={fadeInUp} delay={0.4}>
              <Flex
                gap={{ base: 4, md: 8 }}
                justify="center"
                align="center"
                flexWrap="wrap"
                pt={6}
              >
                {[
                  "Résultats garantis",
                  "Setup en 48h",
                  "Sans engagement",
                ].map((item, i) => (
                  <Flex key={i} gap={2} align="center">
                    <Circle size="20px" bg="brand.900" color="brand.400">
                      <CheckIcon />
                    </Circle>
                    <Text fontSize="sm" color="gray.500">
                      {item}
                    </Text>
                  </Flex>
                ))}
              </Flex>
            </AnimatedSection>
          </Stack>
        </Container>
      </Box>

      {/* ================================================================== */}
      {/* PROBLEM SECTION */}
      {/* ================================================================== */}
      <Box as="section" bg="#0A0A0B" py={{ base: 20, md: 32 }} position="relative">
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          h="1px"
          bg="linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)"
        />

        <Container maxW="container.xl" px={{ base: 6, md: 8 }}>
          <Stack gap={{ base: 12, md: 16 }}>
            {/* Header */}
            <AnimatedSection>
              <Stack gap={4} textAlign="center" maxW="700px" mx="auto">
                <Text
                  fontSize="sm"
                  fontWeight="600"
                  color="brand.400"
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  {t("problem.label")}
                </Text>
                <Heading
                  as="h2"
                  fontSize={{ base: "2xl", md: "4xl" }}
                  fontWeight="700"
                  color="white"
                  letterSpacing="-0.02em"
                >
                  {t("problem.title")}
                </Heading>
              </Stack>
            </AnimatedSection>

            {/* Problem cards */}
            <StaggeredContainer>
              <Grid
                templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
                gap={5}
                maxW="4xl"
                mx="auto"
              >
                {Array.from({ length: 4 }, (_, i) => (
                  <StaggeredItem key={i}>
                    <Box
                      p={6}
                      bg="rgba(239, 68, 68, 0.05)"
                      border="1px solid rgba(239, 68, 68, 0.15)"
                      borderRadius="xl"
                      _hover={{ borderColor: "rgba(239, 68, 68, 0.3)" }}
                      transition="all 0.3s"
                    >
                      <Flex gap={4} alignItems="start">
                        <Circle
                          size="32px"
                          bg="rgba(239, 68, 68, 0.15)"
                          color="red.400"
                          flexShrink={0}
                        >
                          <XIcon />
                        </Circle>
                        <Text color="gray.300" fontSize="sm" lineHeight="1.7">
                          {t(`problem.items.${i}.text`)}
                        </Text>
                      </Flex>
                    </Box>
                  </StaggeredItem>
                ))}
              </Grid>
            </StaggeredContainer>

            {/* Punchline */}
            <AnimatedSection>
              <Text
                fontSize={{ base: "xl", md: "2xl" }}
                fontWeight="600"
                textAlign="center"
                maxW="800px"
                mx="auto"
                lineHeight="1.6"
              >
                <Box as="span" color="gray.300">
                  {t("problem.punchline")}{" "}
                </Box>
                <GradientText>{t("problem.punchlineHighlight")}</GradientText>
                <Box as="span" color="gray.300">
                  {" "}{t("problem.punchlineEnd")}
                </Box>
              </Text>
            </AnimatedSection>
          </Stack>
        </Container>
      </Box>

      {/* ================================================================== */}
      {/* SOLUTION SECTION */}
      {/* ================================================================== */}
      <Box as="section" bg="#08080A" py={{ base: 20, md: 32 }} position="relative">
        <Container maxW="container.xl" px={{ base: 6, md: 8 }}>
          <Stack gap={{ base: 14, md: 20 }}>
            {/* Header */}
            <AnimatedSection>
              <Stack gap={5} textAlign="center" maxW="700px" mx="auto">
                <Text
                  fontSize="sm"
                  fontWeight="600"
                  color="brand.400"
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  {t("solution.label")}
                </Text>
                <Heading
                  as="h2"
                  fontSize={{ base: "2xl", md: "4xl" }}
                  fontWeight="700"
                  color="white"
                  letterSpacing="-0.02em"
                >
                  {t("solution.title")}
                </Heading>
                <Text color="gray.400" fontSize="lg" lineHeight="1.7">
                  {t("solution.description")}
                </Text>
              </Stack>
            </AnimatedSection>

            {/* Feature cards */}
            <StaggeredContainer>
              <Grid templateColumns={{ base: "1fr", lg: "repeat(3, 1fr)" }} gap={6}>
                <StaggeredItem>
                  <FeatureCard
                    icon={<TargetIcon />}
                    title={t("solution.pillars.0.title")}
                    description={t("solution.pillars.0.description")}
                  />
                </StaggeredItem>
                <StaggeredItem>
                  <FeatureCard
                    icon={<ClipboardIcon />}
                    title={t("solution.pillars.1.title")}
                    description={t("solution.pillars.1.description")}
                  />
                </StaggeredItem>
                <StaggeredItem>
                  <FeatureCard
                    icon={<LayersIcon />}
                    title={t("solution.pillars.2.title")}
                    description={t("solution.pillars.2.description")}
                  />
                </StaggeredItem>
              </Grid>
            </StaggeredContainer>
          </Stack>
        </Container>
      </Box>

      {/* ================================================================== */}
      {/* WORKFLOW SECTION */}
      {/* ================================================================== */}
      <Box as="section" bg="#0A0A0B" py={{ base: 20, md: 32 }} position="relative" id="how-it-works">
        <Container maxW="container.xl" px={{ base: 6, md: 8 }}>
          <Stack gap={{ base: 14, md: 20 }}>
            {/* Header */}
            <AnimatedSection>
              <Stack gap={4} textAlign="center" maxW="700px" mx="auto">
                <Text
                  fontSize="sm"
                  fontWeight="600"
                  color="brand.400"
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  {t("howItWorks.label")}
                </Text>
                <Heading
                  as="h2"
                  fontSize={{ base: "2xl", md: "4xl" }}
                  fontWeight="700"
                  color="white"
                  letterSpacing="-0.02em"
                >
                  {t("howItWorks.title")}
                </Heading>
              </Stack>
            </AnimatedSection>

            {/* Steps */}
            <Box maxW="3xl" mx="auto">
              <StaggeredContainer staggerDelay={0.15}>
                {workflowSteps.map((step, i) => (
                  <StaggeredItem key={i}>
                    <WorkflowStep
                      number={i + 1}
                      icon={step.icon}
                      title={step.title}
                      description={step.description}
                      isLast={i === workflowSteps.length - 1}
                    />
                  </StaggeredItem>
                ))}
              </StaggeredContainer>
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* ================================================================== */}
      {/* AI NATIVE SECTION */}
      {/* ================================================================== */}
      <Box as="section" bg="#08080A" py={{ base: 20, md: 32 }} position="relative">
        <Container maxW="container.xl" px={{ base: 6, md: 8 }}>
          <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={{ base: 12, lg: 16 }} alignItems="center">
            {/* Left content */}
            <AnimatedSection>
              <Stack gap={6}>
                <Text
                  fontSize="sm"
                  fontWeight="600"
                  color="brand.400"
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  {t("aiNative.label")}
                </Text>
                <Heading
                  as="h2"
                  fontSize={{ base: "2xl", md: "3xl" }}
                  fontWeight="700"
                  color="white"
                  letterSpacing="-0.02em"
                >
                  {t("aiNative.title")}
                </Heading>
                <Stack gap={4}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Flex key={i} gap={3} alignItems="start">
                      <Circle
                        size="24px"
                        bg="rgba(20, 184, 166, 0.15)"
                        color="brand.400"
                        flexShrink={0}
                        mt={0.5}
                      >
                        <CheckIcon />
                      </Circle>
                      <Text color="gray.300" lineHeight="1.7">
                        {t(`aiNative.features.${i}.text`)}
                      </Text>
                    </Flex>
                  ))}
                </Stack>
              </Stack>
            </AnimatedSection>

            {/* Right visual */}
            <AnimatedSection variants={scaleIn}>
              <Box
                position="relative"
                p={8}
                bg="rgba(255, 255, 255, 0.02)"
                border="1px solid rgba(255, 255, 255, 0.08)"
                borderRadius="2xl"
                overflow="hidden"
              >
                <Glow color="rgba(20, 184, 166, 0.2)" size="300px" top="50%" left="50%" transform="translate(-50%, -50%)" />
                <Stack gap={4} position="relative">
                  <Flex gap={2} alignItems="center">
                    <Circle size="32px" bg="brand.900" color="brand.400">
                      <SparklesIcon />
                    </Circle>
                    <Text fontWeight="600" color="white">
                      AI Assistant
                    </Text>
                  </Flex>
                  <Box
                    p={4}
                    bg="rgba(20, 184, 166, 0.1)"
                    border="1px solid rgba(20, 184, 166, 0.2)"
                    borderRadius="lg"
                  >
                    <Text fontSize="sm" color="gray.300" lineHeight="1.7">
                      "J'ai analysé le work sample. Le candidat démontre une approche systématique du debugging avec utilisation de pprof. Score suggéré : 3.5/4 pour la dimension Performance."
                    </Text>
                  </Box>
                  <Flex gap={2}>
                    <Box
                      px={3}
                      py={1.5}
                      bg="rgba(255, 255, 255, 0.05)"
                      border="1px solid rgba(255, 255, 255, 0.1)"
                      borderRadius="md"
                      fontSize="xs"
                      color="gray.400"
                    >
                      Appliquer le score
                    </Box>
                    <Box
                      px={3}
                      py={1.5}
                      bg="rgba(255, 255, 255, 0.05)"
                      border="1px solid rgba(255, 255, 255, 0.1)"
                      borderRadius="md"
                      fontSize="xs"
                      color="gray.400"
                    >
                      Voir l'analyse
                    </Box>
                  </Flex>
                </Stack>
              </Box>
            </AnimatedSection>
          </Grid>
        </Container>
      </Box>

      {/* ================================================================== */}
      {/* METRICS SECTION */}
      {/* ================================================================== */}
      <Box as="section" bg="#0A0A0B" py={{ base: 20, md: 32 }} position="relative">
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          h="1px"
          bg="linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)"
        />

        <Container maxW="container.xl" px={{ base: 6, md: 8 }}>
          <Stack gap={{ base: 14, md: 20 }}>
            {/* Header */}
            <AnimatedSection>
              <Stack gap={4} textAlign="center" maxW="700px" mx="auto">
                <Text
                  fontSize="sm"
                  fontWeight="600"
                  color="brand.400"
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  {t("results.label")}
                </Text>
                <Heading
                  as="h2"
                  fontSize={{ base: "2xl", md: "4xl" }}
                  fontWeight="700"
                  color="white"
                  letterSpacing="-0.02em"
                >
                  {t("results.title")}
                </Heading>
              </Stack>
            </AnimatedSection>

            {/* Metrics */}
            <StaggeredContainer>
              <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={5}>
                <StaggeredItem>
                  <MetricCard
                    value={7}
                    label={t("results.metrics.0.label")}
                    description={t("results.metrics.0.description")}
                    prefix="< "
                    suffix=" jours"
                  />
                </StaggeredItem>
                <StaggeredItem>
                  <MetricCard
                    value={40}
                    label={t("results.metrics.1.label")}
                    description={t("results.metrics.1.description")}
                    prefix="-"
                    suffix="%"
                  />
                </StaggeredItem>
                <StaggeredItem>
                  <MetricCard
                    value={95}
                    label={t("results.metrics.2.label")}
                    description={t("results.metrics.2.description")}
                    suffix="%"
                  />
                </StaggeredItem>
                <StaggeredItem>
                  <MetricCard
                    value={48}
                    label={t("results.metrics.3.label")}
                    description={t("results.metrics.3.description")}
                    suffix="h"
                  />
                </StaggeredItem>
              </Grid>
            </StaggeredContainer>
          </Stack>
        </Container>
      </Box>

      {/* ================================================================== */}
      {/* TARGET SECTION */}
      {/* ================================================================== */}
      <Box as="section" bg="#08080A" py={{ base: 20, md: 32 }}>
        <Container maxW="container.xl" px={{ base: 6, md: 8 }}>
          <Stack gap={{ base: 12, md: 16 }}>
            {/* Header */}
            <AnimatedSection>
              <Stack gap={4} textAlign="center" maxW="700px" mx="auto">
                <Text
                  fontSize="sm"
                  fontWeight="600"
                  color="brand.400"
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  {t("target.label")}
                </Text>
                <Heading
                  as="h2"
                  fontSize={{ base: "2xl", md: "4xl" }}
                  fontWeight="700"
                  color="white"
                  letterSpacing="-0.02em"
                >
                  {t("target.title")}
                </Heading>
              </Stack>
            </AnimatedSection>

            {/* Cards */}
            <Grid templateColumns={{ base: "1fr", md: "2fr 1fr" }} gap={6} maxW="5xl" mx="auto">
              <AnimatedSection>
                <Box
                  p={8}
                  bg="rgba(255, 255, 255, 0.02)"
                  border="1px solid rgba(255, 255, 255, 0.08)"
                  borderRadius="2xl"
                  h="full"
                >
                  <Stack gap={6}>
                    <Heading as="h3" fontSize="xl" fontWeight="600" color="white">
                      Pour qui
                    </Heading>
                    <Stack gap={4}>
                      {Array.from({ length: 3 }, (_, i) => (
                        <Flex key={i} gap={3} alignItems="start">
                          <Circle
                            size="24px"
                            bg="rgba(20, 184, 166, 0.15)"
                            color="brand.400"
                            flexShrink={0}
                            mt={0.5}
                          >
                            <CheckIcon />
                          </Circle>
                          <Text color="gray.300" lineHeight="1.7">
                            {t(`target.audience.${i}.text`)}
                          </Text>
                        </Flex>
                      ))}
                    </Stack>
                  </Stack>
                </Box>
              </AnimatedSection>

              <AnimatedSection delay={0.1}>
                <Box
                  p={8}
                  bg="rgba(255, 255, 255, 0.02)"
                  border="1px solid rgba(255, 255, 255, 0.05)"
                  borderRadius="2xl"
                  h="full"
                >
                  <Stack gap={5}>
                    <Text
                      fontSize="sm"
                      fontWeight="600"
                      color="gray.500"
                      textTransform="uppercase"
                      letterSpacing="wide"
                    >
                      {t("target.notFor.title")}
                    </Text>
                    <Stack gap={3}>
                      {(t("target.notFor.items", { returnObjects: true }) as string[]).map(
                        (item: string, i: number) => (
                          <Flex key={i} gap={2} alignItems="center">
                            <Box color="gray.600">
                              <XIcon />
                            </Box>
                            <Text color="gray.500" fontSize="sm">
                              {item}
                            </Text>
                          </Flex>
                        ),
                      )}
                    </Stack>
                  </Stack>
                </Box>
              </AnimatedSection>
            </Grid>
          </Stack>
        </Container>
      </Box>

      {/* ================================================================== */}
      {/* FAQ SECTION */}
      {/* ================================================================== */}
      <Box as="section" bg="#0A0A0B" py={{ base: 20, md: 32 }}>
        <Container maxW="container.xl" px={{ base: 6, md: 8 }}>
          <Stack gap={{ base: 12, md: 16 }}>
            {/* Header */}
            <AnimatedSection>
              <Stack gap={4} textAlign="center" maxW="700px" mx="auto">
                <Text
                  fontSize="sm"
                  fontWeight="600"
                  color="brand.400"
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  {t("faq.label")}
                </Text>
                <Heading
                  as="h2"
                  fontSize={{ base: "2xl", md: "4xl" }}
                  fontWeight="700"
                  color="white"
                  letterSpacing="-0.02em"
                >
                  {t("faq.title")}
                </Heading>
              </Stack>
            </AnimatedSection>

            {/* Accordion */}
            <Box maxW="3xl" mx="auto" w="full">
              <Accordion.Root collapsible defaultValue={["0"]}>
                {Array.from({ length: 6 }, (_, i) => (
                  <Accordion.Item
                    key={i}
                    value={i.toString()}
                    borderBottom="1px solid"
                    borderColor="rgba(255, 255, 255, 0.08)"
                  >
                    <Accordion.ItemTrigger
                      py={6}
                      cursor="pointer"
                      _hover={{ bg: "transparent" }}
                    >
                      <Flex justify="space-between" align="center" w="full">
                        <Text
                          fontWeight="500"
                          color="white"
                          fontSize={{ base: "md", md: "lg" }}
                          textAlign="left"
                          pr={4}
                        >
                          {t(`faq.items.${i}.question`)}
                        </Text>
                        <Box color="gray.500" flexShrink={0}>
                          <Accordion.ItemIndicator>
                            <ChevronIcon />
                          </Accordion.ItemIndicator>
                        </Box>
                      </Flex>
                    </Accordion.ItemTrigger>
                    <Accordion.ItemContent pb={6}>
                      <Text color="gray.400" lineHeight="1.8" fontSize="md">
                        {t(`faq.items.${i}.answer`)}
                      </Text>
                    </Accordion.ItemContent>
                  </Accordion.Item>
                ))}
              </Accordion.Root>
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* ================================================================== */}
      {/* FOR CANDIDATES SECTION */}
      {/* ================================================================== */}
      <Box as="section" bg="#08080A" py={{ base: 20, md: 32 }}>
        <Container maxW="container.xl" px={{ base: 6, md: 8 }}>
          <Stack gap={{ base: 12, md: 16 }}>
            {/* Header */}
            <AnimatedSection>
              <Stack gap={4} textAlign="center" maxW="700px" mx="auto">
                <Text
                  fontSize="sm"
                  fontWeight="600"
                  color="brand.400"
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  {t("forCandidates.label")}
                </Text>
                <Heading
                  as="h2"
                  fontSize={{ base: "2xl", md: "4xl" }}
                  fontWeight="700"
                  color="white"
                  letterSpacing="-0.02em"
                >
                  {t("forCandidates.title")}
                </Heading>
              </Stack>
            </AnimatedSection>

            {/* Benefits */}
            <StaggeredContainer>
              <Grid
                templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
                gap={5}
                maxW="4xl"
                mx="auto"
              >
                {Array.from({ length: 4 }, (_, i) => (
                  <StaggeredItem key={i}>
                    <Box
                      p={6}
                      bg="rgba(255, 255, 255, 0.02)"
                      border="1px solid rgba(255, 255, 255, 0.08)"
                      borderRadius="xl"
                      _hover={{ borderColor: "rgba(20, 184, 166, 0.3)" }}
                      transition="all 0.3s"
                    >
                      <Flex gap={4} alignItems="start">
                        <Circle
                          size="32px"
                          bg="rgba(20, 184, 166, 0.15)"
                          color="brand.400"
                          flexShrink={0}
                        >
                          <CheckIcon />
                        </Circle>
                        <Text color="gray.300" fontSize="sm" lineHeight="1.7">
                          {t(`forCandidates.benefits.${i}.text`)}
                        </Text>
                      </Flex>
                    </Box>
                  </StaggeredItem>
                ))}
              </Grid>
            </StaggeredContainer>

            {/* CTA */}
            <Flex justify="center">
              <PremiumButton variant="secondary" size="lg" href={`/${lang}/candidates`}>
                En savoir plus
                <ArrowRightIcon />
              </PremiumButton>
            </Flex>
          </Stack>
        </Container>
      </Box>

      {/* ================================================================== */}
      {/* FINAL CTA SECTION */}
      {/* ================================================================== */}
      <Box as="section" position="relative" overflow="hidden" py={{ base: 24, md: 40 }}>
        {/* Background */}
        <Box
          position="absolute"
          inset={0}
          bg="linear-gradient(135deg, #0F766E 0%, #115E59 50%, #0A0A0B 100%)"
        />
        <Glow color="rgba(20, 184, 166, 0.3)" size="800px" top="50%" left="50%" transform="translate(-50%, -50%)" />
        <Box
          position="absolute"
          inset={0}
          opacity={0.05}
          backgroundImage="linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)"
          backgroundSize="40px 40px"
        />

        <Container maxW="container.xl" px={{ base: 6, md: 8 }} position="relative">
          <AnimatedSection>
            <Stack gap={10} textAlign="center" maxW="3xl" mx="auto">
              {/* Badge */}
              <Flex justify="center">
                <Box
                  display="inline-flex"
                  alignItems="center"
                  gap={2}
                  px={4}
                  py={2}
                  bg="rgba(255, 255, 255, 0.1)"
                  border="1px solid rgba(255, 255, 255, 0.2)"
                  borderRadius="full"
                  backdropFilter="blur(10px)"
                >
                  <Text fontSize="sm" fontWeight="500" color="white">
                    {t("pilot.label")}
                  </Text>
                </Box>
              </Flex>

              {/* Title */}
              <Stack gap={4}>
                <Heading
                  as="h2"
                  fontSize={{ base: "2xl", md: "4xl", lg: "5xl" }}
                  fontWeight="700"
                  color="white"
                  letterSpacing="-0.02em"
                >
                  {t("pilot.title")}
                </Heading>
                <Text color="brand.200" fontSize={{ base: "lg", md: "xl" }} lineHeight="1.7">
                  {t("pilot.description")}
                </Text>
              </Stack>

              {/* Includes */}
              <Box
                bg="rgba(255, 255, 255, 0.05)"
                borderRadius="2xl"
                border="1px solid rgba(255, 255, 255, 0.1)"
                p={{ base: 6, md: 8 }}
                backdropFilter="blur(10px)"
              >
                <Stack gap={5}>
                  <Text
                    color="white"
                    fontWeight="600"
                    fontSize="sm"
                    textTransform="uppercase"
                    letterSpacing="wide"
                  >
                    {t("pilot.includes.title")}
                  </Text>
                  <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
                    {(t("pilot.includes.items", { returnObjects: true }) as string[]).map(
                      (item: string, i: number) => (
                        <Flex key={i} gap={3} alignItems="center">
                          <Circle size="20px" bg="rgba(255, 255, 255, 0.2)" color="white">
                            <CheckIcon />
                          </Circle>
                          <Text color="brand.100" fontSize="sm" textAlign="left">
                            {item}
                          </Text>
                        </Flex>
                      ),
                    )}
                  </Grid>
                </Stack>
              </Box>

              {/* CTA */}
              <Flex justify="center" pt={4}>
                <Link to={`/${lang}/pilot`}>
                  <Box
                    as="span"
                    display="inline-flex"
                    alignItems="center"
                    justifyContent="center"
                    gap={2}
                    h="60px"
                    px={10}
                    bg="white"
                    color="#0F766E"
                    fontWeight="600"
                    fontSize="md"
                    borderRadius="xl"
                    cursor="pointer"
                    transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                    boxShadow="0 4px 20px rgba(0, 0, 0, 0.2)"
                    _hover={{
                      transform: "translateY(-3px)",
                      boxShadow: "0 8px 30px rgba(0, 0, 0, 0.3)",
                    }}
                    _active={{ transform: "translateY(0)" }}
                  >
                    {t("pilot.cta")}
                    <ArrowRightIcon />
                  </Box>
                </Link>
              </Flex>
            </Stack>
          </AnimatedSection>
        </Container>
      </Box>
    </Layout>
  );
}
