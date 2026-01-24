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
  Badge,
  Circle,
  Accordion,
} from "@chakra-ui/react";
import { Link, useParams } from "react-router";
import { Layout } from "~/components/layout";
import {
  PrimaryButton,
  SecondaryButton,
  WhiteButton,
} from "~/components/ui/button";
import { FeatureCard, StepCardCentered } from "~/components/ui/feature-card";
import { SectionHeader } from "~/components/ui/section-header";
import { HeroSection, CTASection } from "~/components/ui/gradient-box";

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

// Icons
function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M16.667 5L7.5 14.167 3.333 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="m12 2 10 5-10 5L2 7l10-5z" />
      <path d="m2 12 10 5 10-5M2 17l10 5 10-5" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <rect x="4" y="4" width="16" height="18" rx="2" ry="2" />
      <path d="M9 14h6M9 18h6" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        d="M3.333 8h9.334M8 3.333 12.667 8 8 12.667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Index() {
  const { t } = useTranslation("home");
  const { lang } = useParams();

  return (
    <Layout>
      {/* Hero Section */}
      <HeroSection pb={{ base: 20, md: 32 }}>
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          opacity={0.03}
          className="pattern-bg"
        />

        <Container
          maxW="container.xl"
          px={{ base: 4, md: 8 }}
          position="relative"
        >
          <Stack gap={10} maxW="900px" mx="auto" textAlign="center">
            {/* Trust bar badge */}
            <Badge
              bg="white"
              color="brand.700"
              px={4}
              py={2}
              borderRadius="full"
              fontWeight="medium"
              fontSize="xs"
              w="fit-content"
              mx="auto"
              boxShadow="sm"
            >
              {t("hero.badge")}
            </Badge>

            {/* Hero title */}
            <Heading
              as="h1"
              fontSize={{ base: "3xl", md: "4xl", lg: "5xl" }}
              lineHeight="1.15"
              color="gray.900"
            >
              {t("hero.title")}
            </Heading>

            {/* Subtitle */}
            <Text
              fontSize={{ base: "lg", md: "xl" }}
              color="gray.600"
              lineHeight="1.7"
              maxW="700px"
              mx="auto"
            >
              {t("hero.subtitle")}
            </Text>

            {/* CTAs */}
            <Flex
              gap={4}
              direction={{ base: "column", sm: "row" }}
              justify="center"
            >
              <Link to={`/${lang}/pilot`}>
                <PrimaryButton h={14} w={{ base: "full", sm: "auto" }}>
                  {t("hero.primaryCta")}
                </PrimaryButton>
              </Link>
              <SecondaryButton h={14} w={{ base: "full", sm: "auto" }}>
                {t("hero.secondaryCta")}
              </SecondaryButton>
            </Flex>
          </Stack>
        </Container>
      </HeroSection>

      {/* Problem Section */}
      <Box py={{ base: 16, md: 24 }} bg="white">
        <Container maxW="container.xl" px={{ base: 4, md: 8 }}>
          <Stack gap={12}>
            <SectionHeader
              label={t("problem.label")}
              title={t("problem.title")}
            />

            <Grid
              templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
              gap={6}
              maxW="4xl"
              mx="auto"
            >
              {Array.from({ length: 4 }, (_, i) => (
                <Box
                  key={i}
                  p={6}
                  bg="gray.50"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="gray.100"
                >
                  <Flex gap={3} alignItems="start">
                    <Circle
                      size="32px"
                      bg="red.100"
                      color="red.600"
                      flexShrink={0}
                    >
                      <AlertIcon />
                    </Circle>
                    <Text color="gray.700" fontSize="sm" lineHeight="1.7">
                      {t(`problem.items.${i}.text`)}
                    </Text>
                  </Flex>
                </Box>
              ))}
            </Grid>

            <Text
              fontSize={{ base: "xl", md: "2xl" }}
              fontWeight="semibold"
              color="gray.900"
              textAlign="center"
              mt={4}
            >
              {t("problem.punchline")}{" "}
              <Text as="span" className="text-gradient">
                {t("problem.punchlineHighlight")}
              </Text>{" "}
              {t("problem.punchlineEnd")}
            </Text>
          </Stack>
        </Container>
      </Box>

      {/* Solution Section */}
      <Box py={{ base: 16, md: 24 }} bg="gray.50">
        <Container maxW="container.xl" px={{ base: 4, md: 8 }}>
          <Stack gap={14}>
            <SectionHeader
              label={t("solution.label")}
              title={t("solution.title")}
              description={t("solution.description")}
            />

            <Grid
              templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
              gap={8}
            >
              {Array.from({ length: 3 }, (_, i) => (
                <FeatureCard
                  key={i}
                  icon={
                    i === 0 ? (
                      <TargetIcon />
                    ) : i === 1 ? (
                      <ClipboardIcon />
                    ) : (
                      <LayersIcon />
                    )
                  }
                  title={t(`solution.pillars.${i}.title`)}
                  description={t(`solution.pillars.${i}.description`)}
                />
              ))}
            </Grid>
          </Stack>
        </Container>
      </Box>

      {/* How it works Section */}
      <Box py={{ base: 16, md: 24 }} bg="white" id="how-it-works">
        <Container maxW="container.xl" px={{ base: 4, md: 8 }}>
          <Stack gap={14}>
            <SectionHeader
              label={t("howItWorks.label")}
              title={t("howItWorks.title")}
            />

            <Stack gap={6} maxW="5xl" mx="auto">
              {Array.from({ length: 5 }, (_, i) => (
                <Box
                  key={i}
                  p={8}
                  bg="white"
                  borderRadius="2xl"
                  border="2px solid"
                  borderColor="gray.100"
                  _hover={{ borderColor: "brand.200" }}
                  transition="border-color 0.2s"
                >
                  <Flex gap={6} alignItems="start">
                    <Circle
                      size="48px"
                      bg="linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)"
                      color="white"
                      fontWeight="bold"
                      fontSize="xl"
                      flexShrink={0}
                    >
                      {i + 1}
                    </Circle>
                    <Stack gap={2} flex={1}>
                      <Heading
                        as="h3"
                        fontSize="xl"
                        fontWeight="semibold"
                        color="gray.900"
                      >
                        {t(`howItWorks.steps.${i}.title`)}
                      </Heading>
                      <Text color="gray.600" lineHeight="1.7">
                        {t(`howItWorks.steps.${i}.description`)}
                      </Text>
                    </Stack>
                  </Flex>
                </Box>
              ))}
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* AI-native Section */}
      <Box py={{ base: 16, md: 24 }} bg="gray.50">
        <Container maxW="container.xl" px={{ base: 4, md: 8 }}>
          <Stack gap={12}>
            <SectionHeader
              label={t("aiNative.label")}
              title={t("aiNative.title")}
            />

            <Box
              maxW="4xl"
              mx="auto"
              p={10}
              bg="white"
              borderRadius="2xl"
              border="1px solid"
              borderColor="gray.100"
              boxShadow="lg"
            >
              <Stack gap={6}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Flex key={i} gap={4} alignItems="start">
                    <Circle
                      size="32px"
                      bg="brand.100"
                      color="brand.700"
                      flexShrink={0}
                    >
                      <CheckIcon />
                    </Circle>
                    <Text color="gray.700" lineHeight="1.7">
                      {t(`aiNative.features.${i}.text`)}
                    </Text>
                  </Flex>
                ))}
              </Stack>
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* Results Section */}
      <Box py={{ base: 16, md: 24 }} bg="white">
        <Container maxW="container.xl" px={{ base: 4, md: 8 }}>
          <Stack gap={14}>
            <SectionHeader
              label={t("results.label")}
              title={t("results.title")}
            />

            <Grid
              templateColumns={{ base: "1fr", md: "repeat(5, 1fr)" }}
              gap={6}
            >
              {Array.from({ length: 5 }, (_, i) => (
                <Box
                  key={i}
                  p={6}
                  bg="white"
                  borderRadius="xl"
                  border="2px solid"
                  borderColor="brand.200"
                  textAlign="center"
                >
                  <Stack gap={3}>
                    <Text
                      fontSize="xs"
                      fontWeight="semibold"
                      color="brand.700"
                      textTransform="uppercase"
                      letterSpacing="wide"
                    >
                      {t(`results.metrics.${i}.label`)}
                    </Text>
                    <Text
                      fontSize="3xl"
                      fontWeight="bold"
                      color="gray.900"
                      className="text-gradient"
                    >
                      {t(`results.metrics.${i}.value`)}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {t(`results.metrics.${i}.description`)}
                    </Text>
                  </Stack>
                </Box>
              ))}
            </Grid>
          </Stack>
        </Container>
      </Box>

      {/* Target Section */}
      <Box py={{ base: 16, md: 24 }} bg="gray.50">
        <Container maxW="container.xl" px={{ base: 4, md: 8 }}>
          <Stack gap={12}>
            <SectionHeader
              label={t("target.label")}
              title={t("target.title")}
            />

            <Grid
              templateColumns={{ base: "1fr", md: "2fr 1fr" }}
              gap={8}
              maxW="5xl"
              mx="auto"
            >
              {/* For who */}
              <Box
                p={8}
                bg="white"
                borderRadius="2xl"
                border="1px solid"
                borderColor="gray.100"
              >
                <Stack gap={6}>
                  <Flex gap={3} alignItems="center">
                    <Circle size="40px" bg="brand.100" color="brand.700">
                      <UsersIcon />
                    </Circle>
                    <Heading as="h3" fontSize="xl" color="gray.900">
                      Pour qui
                    </Heading>
                  </Flex>
                  <Stack gap={3}>
                    {Array.from({ length: 3 }, (_, i) => (
                      <Flex key={i} gap={3} alignItems="center">
                        <Box color="brand.700">
                          <CheckIcon />
                        </Box>
                        <Text color="gray.700" lineHeight="1.7">
                          {t(`target.audience.${i}.text`)}
                        </Text>
                      </Flex>
                    ))}
                  </Stack>
                </Stack>
              </Box>

              {/* Not for */}
              <Box
                p={8}
                bg="gray.100"
                borderRadius="2xl"
                border="1px solid"
                borderColor="gray.200"
              >
                <Stack gap={6}>
                  <Text
                    fontSize="sm"
                    fontWeight="semibold"
                    color="gray.700"
                    textTransform="uppercase"
                  >
                    {t("target.notFor.title")}
                  </Text>
                  <Stack gap={2}>
                    {(t("target.notFor.items", { returnObjects: true }) as string[]).map(
                      (item: string, i: number) => (
                        <Flex key={i} gap={2} alignItems="center">
                          <Text fontSize="lg" color="gray.500">
                            ×
                          </Text>
                          <Text color="gray.600" fontSize="sm">
                            {item}
                          </Text>
                        </Flex>
                      ),
                    )}
                  </Stack>
                </Stack>
              </Box>
            </Grid>
          </Stack>
        </Container>
      </Box>

      {/* FAQ Section */}
      <Box py={{ base: 16, md: 24 }} bg="white">
        <Container maxW="container.xl" px={{ base: 4, md: 8 }}>
          <Stack gap={12}>
            <SectionHeader
              label={t("faq.label")}
              title={t("faq.title")}
            />

            <Box maxW="4xl" mx="auto">
              <Accordion.Root collapsible defaultValue={["0"]}>
                {Array.from({ length: 6 }, (_, i) => (
                  <Accordion.Item
                    key={i}
                    value={i.toString()}
                    bg="white"
                    borderRadius="xl"
                    border="1px solid"
                    borderColor="gray.100"
                    mb={4}
                    overflow="hidden"
                    _hover={{ borderColor: "brand.200" }}
                    transition="all 0.2s"
                  >
                    <Accordion.ItemTrigger
                      py={6}
                      px={8}
                      cursor="pointer"
                      _hover={{ bg: "gray.50" }}
                    >
                      <Flex justify="space-between" align="center" w="full">
                        <Text
                          fontWeight="semibold"
                          color="gray.900"
                          fontSize="lg"
                          textAlign="left"
                        >
                          {t(`faq.items.${i}.question`)}
                        </Text>
                        <Accordion.ItemIndicator />
                      </Flex>
                    </Accordion.ItemTrigger>
                    <Accordion.ItemContent px={8} pb={6} bg="gray.50">
                      <Text color="gray.700" lineHeight="1.8">
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

      {/* For Candidates Section */}
      <Box py={{ base: 16, md: 24 }} bg="gray.50">
        <Container maxW="container.xl" px={{ base: 4, md: 8 }}>
          <Stack gap={12}>
            <SectionHeader
              label={t("forCandidates.label")}
              title={t("forCandidates.title")}
            />

            <Grid
              templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
              gap={6}
              maxW="4xl"
              mx="auto"
            >
              {Array.from({ length: 4 }, (_, i) => (
                <Box
                  key={i}
                  p={6}
                  bg="white"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="gray.100"
                  _hover={{ borderColor: "brand.200" }}
                  transition="border-color 0.2s"
                >
                  <Flex gap={3} alignItems="start">
                    <Circle
                      size="32px"
                      bg="brand.100"
                      color="brand.700"
                      flexShrink={0}
                    >
                      <CheckIcon />
                    </Circle>
                    <Text color="gray.700" fontSize="sm" lineHeight="1.7">
                      {t(`forCandidates.benefits.${i}.text`)}
                    </Text>
                  </Flex>
                </Box>
              ))}
            </Grid>

            <Flex justify="center">
              <Link to={`/${lang}/candidates`}>
                <SecondaryButton h={14}>En savoir plus</SecondaryButton>
              </Link>
            </Flex>
          </Stack>
        </Container>
      </Box>

      {/* Pilot CTA Section */}
      <CTASection>
        <Container maxW="container.xl" px={{ base: 4, md: 8 }}>
          <Stack gap={10} textAlign="center" maxW="3xl" mx="auto">
            {/* Badge */}
            <Badge
              bg="white"
              color="brand.700"
              px={4}
              py={1.5}
              borderRadius="full"
              fontWeight="medium"
              fontSize="xs"
              w="fit-content"
              mx="auto"
            >
              {t("pilot.label")}
            </Badge>

            {/* Title */}
            <Stack gap={4}>
              <Heading
                as="h2"
                fontSize={{ base: "2xl", md: "3xl", lg: "4xl" }}
                color="white"
              >
                {t("pilot.title")}
              </Heading>
              <Text
                color="brand.200"
                fontSize={{ base: "md", md: "lg" }}
                lineHeight="1.8"
              >
                {t("pilot.description")}
              </Text>
            </Stack>

            {/* Includes */}
            <Box
              bg="rgba(255, 255, 255, 0.1)"
              borderRadius="xl"
              border="1px solid rgba(255, 255, 255, 0.2)"
              p={8}
              backdropFilter="blur(10px)"
            >
              <Stack gap={6}>
                <Text
                  color="white"
                  fontWeight="semibold"
                  fontSize="sm"
                  textTransform="uppercase"
                  letterSpacing="wide"
                >
                  {t("pilot.includes.title")}
                </Text>
                <Grid
                  templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
                  gap={4}
                >
                  {(t("pilot.includes.items", { returnObjects: true }) as string[]).map(
                    (item: string, i: number) => (
                      <Flex key={i} gap={3} alignItems="center">
                        <Box color="white">
                          <CheckIcon />
                        </Box>
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
                <WhiteButton h={14}>
                  <Flex alignItems="center" gap={2}>
                    {t("pilot.cta")}
                    <ArrowRightIcon />
                  </Flex>
                </WhiteButton>
              </Link>
            </Flex>
          </Stack>
        </Container>
      </CTASection>
    </Layout>
  );
}
