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
import {
  ArrowRight,
  Check,
  ChevronDown,
  Server,
  Activity,
  Wrench,
  Shield,
  Globe,
  Lock,
  Bot,
  User,
  Search,
} from "lucide-react";
import { Layout } from "~/components/layout";
import {
  AnimatedSection,
  StaggeredContainer,
  StaggeredItem,
  GradientText,
  Glow,
  fadeInUp,
} from "~/components/ui/motion";

export const meta: MetaFunction = () => {
  return [
    {
      title:
        "Baara - Le référentiel de compétences prouvées pour les devs tech",
    },
    {
      name: "description",
      content:
        "Devs : prouvez votre niveau avec un Proof Profile. Recruteurs : accédez à des profils tech pré-évalués avec preuves.",
    },
  ];
};

// Section label
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      fontSize="xs"
      fontWeight="600"
      color="brand.400"
      textTransform="uppercase"
      letterSpacing="0.15em"
    >
      {children}
    </Text>
  );
}

// CTA button link
function CtaButton({
  children,
  href,
  variant = "primary",
}: {
  children: React.ReactNode;
  href: string;
  variant?: "primary" | "secondary";
}) {
  const styles =
    variant === "primary"
      ? {
          bg: "linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)",
          color: "white",
          boxShadow: "0 4px 20px rgba(15, 118, 110, 0.35)",
          _hover: {
            transform: "translateY(-2px)",
            boxShadow: "0 8px 30px rgba(15, 118, 110, 0.45)",
          },
        }
      : {
          bg: "rgba(255, 255, 255, 0.05)",
          color: "white",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          _hover: {
            bg: "rgba(255, 255, 255, 0.1)",
            borderColor: "rgba(255, 255, 255, 0.25)",
            transform: "translateY(-2px)",
          },
        };

  return (
    <Link to={href}>
      <Box
        as="span"
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        gap={2}
        h="56px"
        px={8}
        fontWeight="500"
        borderRadius="xl"
        cursor="pointer"
        transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
        fontSize="md"
        _active={{ transform: "translateY(0)" }}
        {...styles}
      >
        {children}
      </Box>
    </Link>
  );
}

// Step mini card (for how it works)
function StepMini({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <Flex gap={4} alignItems="flex-start">
      <Circle
        size="36px"
        bg="linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)"
        color="white"
        fontWeight="700"
        fontSize="sm"
        flexShrink={0}
      >
        {step}
      </Circle>
      <Box>
        <Text fontWeight="semibold" color="white" fontSize="sm" mb={0.5}>
          {title}
        </Text>
        <Text color="gray.500" fontSize="xs" lineHeight="1.6">
          {description}
        </Text>
      </Box>
    </Flex>
  );
}

export default function Index() {
  const { t } = useTranslation("home");
  const { lang } = useParams();

  return (
    <Layout>
      {/* ================================================================ */}
      {/* HERO — Platform positioning                                      */}
      {/* ================================================================ */}
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
        <Box
          position="absolute"
          inset={0}
          overflow="hidden"
          pointerEvents="none"
        >
          <Box
            position="absolute"
            top="-20%"
            left="50%"
            transform="translateX(-50%)"
            w="150%"
            h="80%"
            bg="radial-gradient(ellipse at center, rgba(20, 184, 166, 0.12) 0%, transparent 60%)"
          />
          <Glow
            color="rgba(20, 184, 166, 0.25)"
            size="600px"
            top="-10%"
            left="10%"
          />
          <Glow
            color="rgba(59, 130, 246, 0.1)"
            size="400px"
            bottom="10%"
            right="5%"
          />
          <Box
            position="absolute"
            inset={0}
            opacity={0.03}
            backgroundImage="linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)"
            backgroundSize="60px 60px"
          />
        </Box>

        <Container
          maxW="container.xl"
          px={{ base: 6, md: 8 }}
          py={{ base: 20, md: 32 }}
          position="relative"
        >
          <Stack
            gap={{ base: 10, md: 14 }}
            maxW="900px"
            mx="auto"
            textAlign="center"
          >
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
                >
                  <Circle size="6px" bg="brand.400" />
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
                {(() => {
                  const highlight = t("hero.titleHighlight");
                  const parts = t("hero.title").split(highlight);
                  return (
                    <>
                      {parts[0]}
                      <GradientText>{highlight}</GradientText>
                      {parts[1]}
                    </>
                  );
                })()}
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

            {/* Two CTAs */}
            <AnimatedSection variants={fadeInUp} delay={0.3}>
              <Flex
                gap={4}
                direction={{ base: "column", sm: "row" }}
                justify="center"
                align="center"
              >
                <CtaButton href={`/${lang}/candidates`} variant="primary">
                  {t("hero.candidateCta")}
                  <ArrowRight size={20} />
                </CtaButton>
                <CtaButton href={`/${lang}/recruiters`} variant="secondary">
                  {t("hero.recruiterCta")}
                  <ArrowRight size={20} />
                </CtaButton>
              </Flex>
            </AnimatedSection>
          </Stack>
        </Container>
      </Box>

      {/* ================================================================ */}
      {/* TWO SIDES — Candidate vs Recruiter                               */}
      {/* ================================================================ */}
      <Box as="section" bg="#08080A" py={{ base: 20, md: 32 }}>
        <Container maxW="container.xl" px={{ base: 6, md: 8 }}>
          <Stack gap={{ base: 14, md: 20 }}>
            <AnimatedSection>
              <Stack gap={4} textAlign="center" maxW="700px" mx="auto">
                <SectionLabel>{t("twoSides.label")}</SectionLabel>
                <Heading
                  as="h2"
                  fontSize={{ base: "2xl", md: "4xl" }}
                  fontWeight="700"
                  color="white"
                  letterSpacing="-0.02em"
                >
                  {t("twoSides.title")}
                </Heading>
              </Stack>
            </AnimatedSection>

            <Grid
              templateColumns={{ base: "1fr", lg: "1fr 1fr" }}
              gap={6}
              alignItems="stretch"
            >
              {/* Candidate side */}
              <AnimatedSection>
                <Box
                  h="full"
                  p={{ base: 6, md: 8 }}
                  bg="rgba(20, 184, 166, 0.03)"
                  border="1px solid rgba(20, 184, 166, 0.15)"
                  borderRadius="2xl"
                  position="relative"
                  overflow="hidden"
                >
                  <Box
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    h="3px"
                    bg="linear-gradient(90deg, #0F766E 0%, #14B8A6 50%, #2DD4BF 100%)"
                  />
                  <Stack gap={6}>
                    <Flex gap={3} alignItems="center">
                      <Circle
                        size="44px"
                        bg="rgba(20, 184, 166, 0.15)"
                        color="brand.400"
                      >
                        <User size={20} />
                      </Circle>
                      <Box>
                        <Text
                          fontWeight="bold"
                          color="white"
                          fontSize="lg"
                        >
                          {t("twoSides.candidate.title")}
                        </Text>
                        <Text color="gray.400" fontSize="sm">
                          {t("twoSides.candidate.subtitle")}
                        </Text>
                      </Box>
                    </Flex>

                    <Stack gap={3}>
                      {(
                        t("twoSides.candidate.items", {
                          returnObjects: true,
                        }) as string[]
                      ).map((item, i) => (
                        <Flex key={i} gap={3} alignItems="flex-start">
                          <Circle
                            size="22px"
                            bg="rgba(20, 184, 166, 0.15)"
                            color="brand.400"
                            mt={0.5}
                            flexShrink={0}
                          >
                            <Check size={14} strokeWidth={3} />
                          </Circle>
                          <Text
                            color="gray.300"
                            fontSize="sm"
                            lineHeight="1.7"
                          >
                            {item}
                          </Text>
                        </Flex>
                      ))}
                    </Stack>

                    <Box pt={2}>
                      <Link to={`/${lang}/candidates`}>
                        <Box
                          as="span"
                          display="inline-flex"
                          alignItems="center"
                          gap={2}
                          px={6}
                          py={3}
                          bg="linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)"
                          color="white"
                          fontWeight="500"
                          fontSize="sm"
                          borderRadius="xl"
                          cursor="pointer"
                          transition="all 0.25s"
                          _hover={{
                            transform: "translateY(-2px)",
                            boxShadow:
                              "0 8px 30px rgba(20, 184, 166, 0.3)",
                          }}
                        >
                          {t("twoSides.candidate.cta")}
                          <ArrowRight size={16} />
                        </Box>
                      </Link>
                    </Box>
                  </Stack>
                </Box>
              </AnimatedSection>

              {/* Recruiter side */}
              <AnimatedSection delay={0.1}>
                <Box
                  h="full"
                  p={{ base: 6, md: 8 }}
                  bg="rgba(255, 255, 255, 0.02)"
                  border="1px solid rgba(255, 255, 255, 0.08)"
                  borderRadius="2xl"
                  position="relative"
                  overflow="hidden"
                >
                  <Box
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    h="3px"
                    bg="linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.1) 100%)"
                  />
                  <Stack gap={6}>
                    <Flex gap={3} alignItems="center">
                      <Circle
                        size="44px"
                        bg="rgba(255, 255, 255, 0.08)"
                        color="gray.300"
                      >
                        <Search size={20} />
                      </Circle>
                      <Box>
                        <Text
                          fontWeight="bold"
                          color="white"
                          fontSize="lg"
                        >
                          {t("twoSides.recruiter.title")}
                        </Text>
                        <Text color="gray.400" fontSize="sm">
                          {t("twoSides.recruiter.subtitle")}
                        </Text>
                      </Box>
                    </Flex>

                    <Stack gap={3}>
                      {(
                        t("twoSides.recruiter.items", {
                          returnObjects: true,
                        }) as string[]
                      ).map((item, i) => (
                        <Flex key={i} gap={3} alignItems="flex-start">
                          <Circle
                            size="22px"
                            bg="rgba(255, 255, 255, 0.08)"
                            color="gray.400"
                            mt={0.5}
                            flexShrink={0}
                          >
                            <Check size={14} strokeWidth={3} />
                          </Circle>
                          <Text
                            color="gray.400"
                            fontSize="sm"
                            lineHeight="1.7"
                          >
                            {item}
                          </Text>
                        </Flex>
                      ))}
                    </Stack>

                    <Box pt={2}>
                      <Link to={`/${lang}/recruiters`}>
                        <Box
                          as="span"
                          display="inline-flex"
                          alignItems="center"
                          gap={2}
                          px={6}
                          py={3}
                          bg="rgba(255, 255, 255, 0.05)"
                          border="1px solid rgba(255, 255, 255, 0.15)"
                          color="white"
                          fontWeight="500"
                          fontSize="sm"
                          borderRadius="xl"
                          cursor="pointer"
                          transition="all 0.25s"
                          _hover={{
                            bg: "rgba(255, 255, 255, 0.1)",
                            transform: "translateY(-2px)",
                          }}
                        >
                          {t("twoSides.recruiter.cta")}
                          <ArrowRight size={16} />
                        </Box>
                      </Link>
                    </Box>
                  </Stack>
                </Box>
              </AnimatedSection>
            </Grid>
          </Stack>
        </Container>
      </Box>

      {/* ================================================================ */}
      {/* HOW IT WORKS — Side by side steps                                */}
      {/* ================================================================ */}
      <Box
        as="section"
        bg="#0A0A0B"
        py={{ base: 20, md: 32 }}
        position="relative"
      >
        <Container maxW="container.xl" px={{ base: 6, md: 8 }}>
          <Stack gap={{ base: 14, md: 20 }}>
            <AnimatedSection>
              <Stack gap={4} textAlign="center" maxW="700px" mx="auto">
                <SectionLabel>{t("howItWorks.label")}</SectionLabel>
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

            <Grid
              templateColumns={{ base: "1fr", lg: "1fr 1fr" }}
              gap={8}
              maxW="5xl"
              mx="auto"
            >
              {/* Candidate steps */}
              <AnimatedSection>
                <Box
                  p={{ base: 6, md: 8 }}
                  bg="rgba(255, 255, 255, 0.02)"
                  border="1px solid rgba(255, 255, 255, 0.06)"
                  borderRadius="2xl"
                >
                  <Text
                    fontSize="xs"
                    fontWeight="600"
                    color="brand.400"
                    textTransform="uppercase"
                    letterSpacing="wider"
                    mb={6}
                  >
                    {t("howItWorks.candidate.title")}
                  </Text>
                  <Stack gap={5}>
                    {(
                      t("howItWorks.candidate.steps", {
                        returnObjects: true,
                      }) as Array<{
                        step: string;
                        title: string;
                        description: string;
                      }>
                    ).map((s, i) => (
                      <StepMini
                        key={i}
                        step={s.step}
                        title={s.title}
                        description={s.description}
                      />
                    ))}
                  </Stack>
                </Box>
              </AnimatedSection>

              {/* Recruiter steps */}
              <AnimatedSection delay={0.1}>
                <Box
                  p={{ base: 6, md: 8 }}
                  bg="rgba(255, 255, 255, 0.02)"
                  border="1px solid rgba(255, 255, 255, 0.06)"
                  borderRadius="2xl"
                >
                  <Text
                    fontSize="xs"
                    fontWeight="600"
                    color="gray.500"
                    textTransform="uppercase"
                    letterSpacing="wider"
                    mb={6}
                  >
                    {t("howItWorks.recruiter.title")}
                  </Text>
                  <Stack gap={5}>
                    {(
                      t("howItWorks.recruiter.steps", {
                        returnObjects: true,
                      }) as Array<{
                        step: string;
                        title: string;
                        description: string;
                      }>
                    ).map((s, i) => (
                      <StepMini
                        key={i}
                        step={s.step}
                        title={s.title}
                        description={s.description}
                      />
                    ))}
                  </Stack>
                </Box>
              </AnimatedSection>
            </Grid>
          </Stack>
        </Container>
      </Box>

      {/* ================================================================ */}
      {/* ROLES — Available evaluations                                    */}
      {/* ================================================================ */}
      <Box as="section" bg="#08080A" py={{ base: 20, md: 32 }}>
        <Container maxW="container.xl" px={{ base: 6, md: 8 }}>
          <Stack gap={{ base: 14, md: 20 }}>
            <AnimatedSection>
              <Stack gap={4} textAlign="center" maxW="700px" mx="auto">
                <SectionLabel>{t("roles.label")}</SectionLabel>
                <Heading
                  as="h2"
                  fontSize={{ base: "2xl", md: "4xl" }}
                  fontWeight="700"
                  color="white"
                  letterSpacing="-0.02em"
                >
                  {t("roles.title")}
                </Heading>
                <Text color="gray.400" fontSize="lg" lineHeight="1.7">
                  {t("roles.subtitle")}
                </Text>
              </Stack>
            </AnimatedSection>

            <StaggeredContainer>
              <Grid
                templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
                gap={6}
                maxW="4xl"
                mx="auto"
              >
                {[
                  { icon: <Server size={22} />, idx: 0 },
                  { icon: <Activity size={22} />, idx: 1 },
                  { icon: <Wrench size={22} />, idx: 2 },
                ].map(({ icon, idx }) => (
                  <StaggeredItem key={idx}>
                    <Box
                      p={7}
                      bg="rgba(255, 255, 255, 0.02)"
                      border="1px solid rgba(255, 255, 255, 0.06)"
                      borderRadius="2xl"
                      textAlign="center"
                      transition="all 0.3s"
                      _hover={{
                        borderColor: "rgba(20, 184, 166, 0.3)",
                        transform: "translateY(-4px)",
                      }}
                    >
                      <Circle
                        size="52px"
                        bg="rgba(20, 184, 166, 0.1)"
                        color="brand.400"
                        mx="auto"
                        mb={4}
                      >
                        {icon}
                      </Circle>
                      <Text
                        fontWeight="bold"
                        color="white"
                        fontSize="lg"
                        mb={2}
                      >
                        {t(`roles.items.${idx}.title`)}
                      </Text>
                      <Text color="gray.400" fontSize="sm" lineHeight="1.7">
                        {t(`roles.items.${idx}.description`)}
                      </Text>
                    </Box>
                  </StaggeredItem>
                ))}
              </Grid>
            </StaggeredContainer>

            <AnimatedSection>
              <Text
                textAlign="center"
                color="gray.500"
                fontSize="sm"
                fontStyle="italic"
              >
                {t("roles.comingSoon")}
              </Text>
            </AnimatedSection>
          </Stack>
        </Container>
      </Box>

      {/* ================================================================ */}
      {/* TRUST — Built to be fair                                         */}
      {/* ================================================================ */}
      <Box
        as="section"
        bg="#0A0A0B"
        py={{ base: 20, md: 32 }}
        position="relative"
      >
        <Container maxW="container.xl" px={{ base: 6, md: 8 }}>
          <Stack gap={{ base: 14, md: 20 }}>
            <AnimatedSection>
              <Stack gap={4} textAlign="center" maxW="700px" mx="auto">
                <SectionLabel>{t("trust.label")}</SectionLabel>
                <Heading
                  as="h2"
                  fontSize={{ base: "2xl", md: "4xl" }}
                  fontWeight="700"
                  color="white"
                  letterSpacing="-0.02em"
                >
                  {t("trust.title")}
                </Heading>
              </Stack>
            </AnimatedSection>

            <StaggeredContainer>
              <Grid
                templateColumns={{
                  base: "1fr",
                  sm: "repeat(2, 1fr)",
                  lg: "repeat(4, 1fr)",
                }}
                gap={5}
                maxW="5xl"
                mx="auto"
              >
                {[
                  <Shield size={20} key="s" />,
                  <Globe size={20} key="g" />,
                  <Lock size={20} key="l" />,
                  <Bot size={20} key="b" />,
                ].map((icon, i) => (
                  <StaggeredItem key={i}>
                    <Box
                      p={6}
                      bg="rgba(255, 255, 255, 0.02)"
                      border="1px solid rgba(255, 255, 255, 0.06)"
                      borderRadius="xl"
                      textAlign="center"
                      transition="all 0.3s"
                      _hover={{
                        borderColor: "rgba(255, 255, 255, 0.12)",
                      }}
                    >
                      <Circle
                        size="44px"
                        bg="rgba(20, 184, 166, 0.1)"
                        color="brand.400"
                        mx="auto"
                        mb={3}
                      >
                        {icon}
                      </Circle>
                      <Text
                        fontWeight="semibold"
                        color="white"
                        fontSize="sm"
                        mb={1}
                      >
                        {t(`trust.items.${i}.title`)}
                      </Text>
                      <Text color="gray.500" fontSize="xs" lineHeight="1.6">
                        {t(`trust.items.${i}.description`)}
                      </Text>
                    </Box>
                  </StaggeredItem>
                ))}
              </Grid>
            </StaggeredContainer>
          </Stack>
        </Container>
      </Box>

      {/* ================================================================ */}
      {/* FAQ                                                              */}
      {/* ================================================================ */}
      <Box as="section" bg="#08080A" py={{ base: 20, md: 32 }}>
        <Container maxW="container.xl" px={{ base: 6, md: 8 }}>
          <Stack gap={{ base: 12, md: 16 }}>
            <AnimatedSection>
              <Stack gap={4} textAlign="center" maxW="700px" mx="auto">
                <SectionLabel>{t("faq.label")}</SectionLabel>
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
                      <Flex
                        justify="space-between"
                        align="center"
                        w="full"
                      >
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
                            <ChevronDown size={20} />
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

      {/* ================================================================ */}
      {/* FINAL CTA — Two-sided                                            */}
      {/* ================================================================ */}
      <Box
        as="section"
        position="relative"
        overflow="hidden"
        py={{ base: 24, md: 40 }}
      >
        <Box
          position="absolute"
          inset={0}
          bg="linear-gradient(135deg, #0F766E 0%, #115E59 50%, #0A0A0B 100%)"
        />
        <Glow
          color="rgba(20, 184, 166, 0.3)"
          size="800px"
          top="50%"
          left="50%"
          style={{ transform: "translate(-50%, -50%)" }}
        />

        <Container
          maxW="container.xl"
          px={{ base: 6, md: 8 }}
          position="relative"
        >
          <AnimatedSection>
            <Stack gap={10} textAlign="center" maxW="3xl" mx="auto">
              <Heading
                as="h2"
                fontSize={{ base: "2xl", md: "4xl", lg: "5xl" }}
                fontWeight="700"
                color="white"
                letterSpacing="-0.02em"
              >
                {t("cta.title")}
              </Heading>

              <Grid
                templateColumns={{ base: "1fr", md: "1fr 1fr" }}
                gap={6}
                maxW="2xl"
                mx="auto"
              >
                <Stack gap={4} alignItems="center">
                  <Text
                    color="brand.200"
                    fontSize="md"
                    lineHeight="1.7"
                  >
                    {t("cta.candidateDescription")}
                  </Text>
                  <Link to={`/${lang}/candidates`}>
                    <Box
                      as="span"
                      display="inline-flex"
                      alignItems="center"
                      justifyContent="center"
                      gap={2}
                      h="56px"
                      px={8}
                      bg="white"
                      color="#0F766E"
                      fontWeight="600"
                      fontSize="md"
                      borderRadius="xl"
                      cursor="pointer"
                      transition="all 0.25s"
                      boxShadow="0 4px 20px rgba(0, 0, 0, 0.2)"
                      _hover={{
                        transform: "translateY(-3px)",
                        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.3)",
                      }}
                      _active={{ transform: "translateY(0)" }}
                    >
                      {t("cta.candidateCta")}
                      <ArrowRight size={18} />
                    </Box>
                  </Link>
                </Stack>

                <Stack gap={4} alignItems="center">
                  <Text
                    color="brand.200"
                    fontSize="md"
                    lineHeight="1.7"
                  >
                    {t("cta.recruiterDescription")}
                  </Text>
                  <Link to={`/${lang}/recruiters`}>
                    <Box
                      as="span"
                      display="inline-flex"
                      alignItems="center"
                      justifyContent="center"
                      gap={2}
                      h="56px"
                      px={8}
                      bg="rgba(255, 255, 255, 0.1)"
                      border="1px solid rgba(255, 255, 255, 0.3)"
                      color="white"
                      fontWeight="600"
                      fontSize="md"
                      borderRadius="xl"
                      cursor="pointer"
                      transition="all 0.25s"
                      _hover={{
                        bg: "rgba(255, 255, 255, 0.2)",
                        transform: "translateY(-3px)",
                      }}
                      _active={{ transform: "translateY(0)" }}
                    >
                      {t("cta.recruiterCta")}
                      <ArrowRight size={18} />
                    </Box>
                  </Link>
                </Stack>
              </Grid>
            </Stack>
          </AnimatedSection>
        </Container>
      </Box>
    </Layout>
  );
}
