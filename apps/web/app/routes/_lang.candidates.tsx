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
  Circle,
  Button,
  Accordion,
} from "@chakra-ui/react";
import {
  Check,
  ChevronDown,
  ArrowRight,
  Target,
  TrendingUp,
  Repeat,
  Eye,
  Server,
  Activity,
  Wrench,
  Shield,
  MessageCircle,
  Trash2,
  Folder,
  Lock,
} from "lucide-react";
import { Layout } from "~/components/layout";
import {
  Glow,
  AnimatedSection,
  fadeInUp,
  StaggeredContainer,
  StaggeredItem,
} from "~/components/ui/motion";

export const meta: MetaFunction = () => {
  return [
    { title: "Proof Profile - Baara" },
    {
      name: "description",
      content:
        "Tu es dev Go, SRE ou Infra en France ? Découvre où tu te situes vraiment. 45 min, gratuit, réutilisable.",
    },
  ];
};

// Section label component
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      fontSize="xs"
      fontWeight="semibold"
      color="brand.400"
      textTransform="uppercase"
      letterSpacing="0.15em"
    >
      {children}
    </Text>
  );
}

// Role card component
function RoleCard({
  icon,
  title,
  description,
  criteria,
  cta,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  criteria: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <Box
      h="full"
      p={7}
      bg="rgba(255, 255, 255, 0.02)"
      borderRadius="2xl"
      border="1px solid"
      borderColor="rgba(255, 255, 255, 0.06)"
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      cursor="pointer"
      onClick={onClick}
      _hover={{
        borderColor: "rgba(20, 184, 166, 0.4)",
        transform: "translateY(-4px)",
        bg: "rgba(255, 255, 255, 0.03)",
        boxShadow: "0 8px 40px rgba(20, 184, 166, 0.1)",
      }}
    >
      <Stack gap={5} h="full">
        <Circle
          size="52px"
          bg="rgba(20, 184, 166, 0.1)"
          color="brand.400"
          flexShrink={0}
        >
          {icon}
        </Circle>
        <Box flex={1}>
          <Text fontWeight="bold" color="white" fontSize="lg" mb={2}>
            {title}
          </Text>
          <Text color="gray.400" fontSize="sm" lineHeight="1.7" mb={3}>
            {description}
          </Text>
          <Text fontSize="xs" color="brand.400" fontWeight="medium">
            {criteria}
          </Text>
        </Box>
        <Button
          variant="outline"
          size="sm"
          borderColor="rgba(20, 184, 166, 0.3)"
          color="brand.400"
          borderRadius="lg"
          _hover={{
            bg: "rgba(20, 184, 166, 0.1)",
            borderColor: "brand.400",
          }}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          {cta} <ArrowRight size={14} />
        </Button>
      </Stack>
    </Box>
  );
}

// Why item component
function WhyItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Flex gap={4} alignItems="flex-start">
      <Circle
        size="44px"
        bg="rgba(20, 184, 166, 0.1)"
        color="brand.400"
        flexShrink={0}
      >
        {icon}
      </Circle>
      <Box>
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

// Step card component
function StepCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <Box
      h="full"
      p={7}
      bg="rgba(255, 255, 255, 0.02)"
      borderRadius="2xl"
      border="1px solid"
      borderColor="rgba(255, 255, 255, 0.06)"
      position="relative"
    >
      <Stack gap={4} h="full">
        <Text
          fontSize="4xl"
          fontWeight="800"
          color="rgba(20, 184, 166, 0.2)"
          fontFamily="heading"
          lineHeight="1"
        >
          {step}
        </Text>
        <Box flex={1}>
          <Text fontWeight="semibold" color="white" mb={2} fontSize="md">
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

// Privacy item component
function PrivacyItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Flex gap={4} alignItems="flex-start">
      <Circle
        size="44px"
        bg="rgba(20, 184, 166, 0.1)"
        color="brand.400"
        flexShrink={0}
      >
        {icon}
      </Circle>
      <Box>
        <Text fontWeight="semibold" color="white" mb={0.5}>
          {title}
        </Text>
        <Text color="gray.400" fontSize="sm" lineHeight="1.6">
          {description}
        </Text>
      </Box>
    </Flex>
  );
}

export default function Candidates() {
  const { t } = useTranslation("candidates");
  const { lang } = useParams();
  const navigate = useNavigate();

  const handleStartEvaluation = (roleType?: string) => {
    // For now, navigate to the evaluate page (will be created in Milestone 1)
    // For Milestone 0 (validation), this scrolls to the role section or registers interest
    const path = roleType
      ? `/${lang}/evaluate/${roleType}`
      : `/${lang}/evaluate`;
    navigate(path);
  };

  const faqItems = [
    {
      key: "whatIs",
      question: t("faq.items.whatIs.question"),
      answer: t("faq.items.whatIs.answer"),
    },
    {
      key: "takehome",
      question: t("faq.items.takehome.question"),
      answer: t("faq.items.takehome.answer"),
    },
    {
      key: "retake",
      question: t("faq.items.retake.question"),
      answer: t("faq.items.retake.answer"),
    },
    {
      key: "whoSees",
      question: t("faq.items.whoSees.question"),
      answer: t("faq.items.whoSees.answer"),
    },
    {
      key: "free",
      question: t("faq.items.free.question"),
      answer: t("faq.items.free.answer"),
    },
    {
      key: "noGithub",
      question: t("faq.items.noGithub.question"),
      answer: t("faq.items.noGithub.answer"),
    },
  ];

  return (
    <Layout>
      {/* Hero Section — Full width, centered, strong CTA */}
      <Box
        as="section"
        bg="#0A0A0B"
        position="relative"
        overflow="hidden"
        pt={{ base: 16, md: 24 }}
        pb={{ base: 20, md: 32 }}
      >
        {/* Background Effects */}
        <Box
          position="absolute"
          inset={0}
          overflow="hidden"
          pointerEvents="none"
        >
          <Glow
            color="rgba(20, 184, 166, 0.2)"
            size="600px"
            top="-20%"
            left="30%"
            intensity={1.2}
          />
          <Glow
            color="rgba(59, 130, 246, 0.08)"
            size="400px"
            bottom="10%"
            right="20%"
            intensity={0.6}
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
          maxW="container.lg"
          px={{ base: 4, md: 8 }}
          position="relative"
        >
          <AnimatedSection variants={fadeInUp}>
            <Stack
              gap={8}
              textAlign="center"
              alignItems="center"
              maxW="3xl"
              mx="auto"
            >
              {/* Badge */}
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

              {/* Heading */}
              <Heading
                as="h1"
                fontSize={{ base: "2.5rem", md: "3.5rem", lg: "4.5rem" }}
                lineHeight="1.1"
                color="white"
                fontWeight="800"
                letterSpacing="-0.03em"
              >
                {t("hero.title")}{" "}
                <Text as="span" color="brand.400">
                  {t("hero.titleHighlight")}
                </Text>
              </Heading>

              {/* Subtitle */}
              <Text
                fontSize={{ base: "lg", md: "xl" }}
                color="gray.400"
                lineHeight="1.7"
                maxW="600px"
              >
                {t("hero.subtitle")}
              </Text>

              {/* CTAs */}
              <Stack
                gap={4}
                direction={{ base: "column", sm: "row" }}
                alignItems="center"
                pt={2}
              >
                <Button
                  h={14}
                  px={10}
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
                  _active={{ transform: "translateY(0)" }}
                  transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                  onClick={() => handleStartEvaluation()}
                >
                  {t("hero.cta")} <ArrowRight size={18} />
                </Button>
                <Button
                  h={12}
                  px={6}
                  variant="ghost"
                  color="gray.400"
                  fontWeight="medium"
                  borderRadius="xl"
                  fontSize="sm"
                  _hover={{
                    color: "white",
                    bg: "rgba(255, 255, 255, 0.05)",
                  }}
                >
                  {t("hero.ctaSecondary")}
                </Button>
              </Stack>

              {/* Trust indicators */}
              <Flex
                gap={{ base: 6, md: 10 }}
                pt={6}
                flexWrap="wrap"
                justifyContent="center"
              >
                <Stack gap={1} alignItems="center">
                  <Text
                    fontWeight="bold"
                    fontSize="2xl"
                    color="white"
                    fontFamily="heading"
                  >
                    {t("stats.time")}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {t("stats.timeLabel")}
                  </Text>
                </Stack>
                <Box
                  w="1px"
                  bg="rgba(255, 255, 255, 0.1)"
                  display={{ base: "none", md: "block" }}
                />
                <Stack gap={1} alignItems="center">
                  <Text
                    fontWeight="bold"
                    fontSize="2xl"
                    color="white"
                    fontFamily="heading"
                  >
                    {t("stats.free")}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {t("stats.freeLabel")}
                  </Text>
                </Stack>
                <Box
                  w="1px"
                  bg="rgba(255, 255, 255, 0.1)"
                  display={{ base: "none", md: "block" }}
                />
                <Stack gap={1} alignItems="center">
                  <Text
                    fontWeight="bold"
                    fontSize="2xl"
                    color="white"
                    fontFamily="heading"
                  >
                    {t("stats.reusable")}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {t("stats.reusableLabel")}
                  </Text>
                </Stack>
              </Flex>
            </Stack>
          </AnimatedSection>
        </Container>
      </Box>

      {/* Role Selection Section */}
      <Box py={{ base: 16, md: 24 }} bg="#08080A">
        <Container maxW="container.xl" px={{ base: 4, md: 8 }}>
          <Stack gap={14}>
            <AnimatedSection variants={fadeInUp}>
              <Stack gap={4} textAlign="center" maxW="2xl" mx="auto">
                <SectionLabel>{t("roles.label")}</SectionLabel>
                <Heading
                  as="h2"
                  fontSize={{ base: "2xl", md: "3xl", lg: "3.5rem" }}
                  color="white"
                  fontWeight="700"
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
                templateColumns={{
                  base: "1fr",
                  md: "repeat(3, 1fr)",
                }}
                gap={{ base: 5, md: 6 }}
                alignItems="stretch"
              >
                <StaggeredItem h="full">
                  <RoleCard
                    icon={<Server size={22} />}
                    title={t("roles.backendGo.title")}
                    description={t("roles.backendGo.description")}
                    criteria={t("roles.backendGo.criteria")}
                    cta={t("roles.cta")}
                    onClick={() => handleStartEvaluation("backend-go")}
                  />
                </StaggeredItem>
                <StaggeredItem h="full">
                  <RoleCard
                    icon={<Activity size={22} />}
                    title={t("roles.sre.title")}
                    description={t("roles.sre.description")}
                    criteria={t("roles.sre.criteria")}
                    cta={t("roles.cta")}
                    onClick={() => handleStartEvaluation("sre")}
                  />
                </StaggeredItem>
                <StaggeredItem h="full">
                  <RoleCard
                    icon={<Wrench size={22} />}
                    title={t("roles.platform.title")}
                    description={t("roles.platform.description")}
                    criteria={t("roles.platform.criteria")}
                    cta={t("roles.cta")}
                    onClick={() => handleStartEvaluation("platform")}
                  />
                </StaggeredItem>
              </Grid>
            </StaggeredContainer>
          </Stack>
        </Container>
      </Box>

      {/* Why Section — What you get */}
      <Box
        py={{ base: 16, md: 24 }}
        bg="#0A0A0B"
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          inset={0}
          overflow="hidden"
          pointerEvents="none"
        >
          <Glow
            color="rgba(20, 184, 166, 0.1)"
            size="500px"
            top="20%"
            right="-10%"
            intensity={0.8}
          />
        </Box>

        <Container
          maxW="container.xl"
          px={{ base: 4, md: 8 }}
          position="relative"
        >
          <Stack gap={14}>
            <AnimatedSection variants={fadeInUp}>
              <Stack gap={4} textAlign="center" maxW="2xl" mx="auto">
                <SectionLabel>{t("why.label")}</SectionLabel>
                <Heading
                  as="h2"
                  fontSize={{ base: "2xl", md: "3xl", lg: "3.5rem" }}
                  color="white"
                  fontWeight="700"
                  letterSpacing="-0.02em"
                >
                  {t("why.title")}
                </Heading>
              </Stack>
            </AnimatedSection>

            <AnimatedSection variants={fadeInUp} delay={0.2}>
              <Grid
                templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
                gap={{ base: 8, md: 10 }}
                maxW="4xl"
                mx="auto"
              >
                <WhyItem
                  icon={<Target size={20} />}
                  title={t("why.items.benchmark.title")}
                  description={t("why.items.benchmark.description")}
                />
                <WhyItem
                  icon={<TrendingUp size={20} />}
                  title={t("why.items.salary.title")}
                  description={t("why.items.salary.description")}
                />
                <WhyItem
                  icon={<Repeat size={20} />}
                  title={t("why.items.noRepeat.title")}
                  description={t("why.items.noRepeat.description")}
                />
                <WhyItem
                  icon={<Eye size={20} />}
                  title={t("why.items.visible.title")}
                  description={t("why.items.visible.description")}
                />
              </Grid>
            </AnimatedSection>
          </Stack>
        </Container>
      </Box>

      {/* Process Section — 3 steps */}
      <Box py={{ base: 16, md: 24 }} bg="#08080A">
        <Container maxW="container.xl" px={{ base: 4, md: 8 }}>
          <Stack gap={14}>
            <AnimatedSection variants={fadeInUp}>
              <Stack gap={4} textAlign="center" maxW="2xl" mx="auto">
                <SectionLabel>{t("process.label")}</SectionLabel>
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
                templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
                gap={{ base: 5, md: 6 }}
                alignItems="stretch"
              >
                <StaggeredItem h="full">
                  <StepCard
                    step={t("process.items.choose.step")}
                    title={t("process.items.choose.title")}
                    description={t("process.items.choose.description")}
                  />
                </StaggeredItem>
                <StaggeredItem h="full">
                  <StepCard
                    step={t("process.items.workSample.step")}
                    title={t("process.items.workSample.title")}
                    description={t("process.items.workSample.description")}
                  />
                </StaggeredItem>
                <StaggeredItem h="full">
                  <StepCard
                    step={t("process.items.proofProfile.step")}
                    title={t("process.items.proofProfile.title")}
                    description={t("process.items.proofProfile.description")}
                  />
                </StaggeredItem>
              </Grid>
            </StaggeredContainer>
          </Stack>
        </Container>
      </Box>

      {/* Proof Profile Detail Section */}
      <Box
        py={{ base: 16, md: 24 }}
        bg="#0A0A0B"
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          inset={0}
          overflow="hidden"
          pointerEvents="none"
        >
          <Glow
            color="rgba(20, 184, 166, 0.08)"
            size="500px"
            bottom="10%"
            left="20%"
            intensity={0.6}
          />
        </Box>

        <Container
          maxW="container.xl"
          px={{ base: 4, md: 8 }}
          position="relative"
        >
          <Stack gap={14}>
            <AnimatedSection variants={fadeInUp}>
              <Stack gap={4} textAlign="center" maxW="2xl" mx="auto">
                <SectionLabel>{t("proofProfile.label")}</SectionLabel>
                <Heading
                  as="h2"
                  fontSize={{ base: "2xl", md: "3xl", lg: "3.5rem" }}
                  color="white"
                  fontWeight="700"
                  letterSpacing="-0.02em"
                >
                  {t("proofProfile.title")}
                </Heading>
                <Text color="gray.400" fontSize="lg" lineHeight="1.7">
                  {t("proofProfile.subtitle")}
                </Text>
              </Stack>
            </AnimatedSection>

            <AnimatedSection variants={fadeInUp} delay={0.2}>
              <Grid
                templateColumns={{ base: "1fr", lg: "1fr 1fr" }}
                gap={{ base: 6, lg: 10 }}
              >
                {/* Public content */}
                <Box
                  p={8}
                  bg="rgba(255, 255, 255, 0.02)"
                  borderRadius="2xl"
                  border="1px solid"
                  borderColor="rgba(255, 255, 255, 0.06)"
                >
                  <Stack gap={6}>
                    <Flex gap={3} alignItems="center">
                      <Circle
                        size="40px"
                        bg="rgba(20, 184, 166, 0.15)"
                        color="brand.400"
                      >
                        <Folder size={20} />
                      </Circle>
                      <Text fontWeight="semibold" color="white" fontSize="lg">
                        {t("proofProfile.contains.title")}
                      </Text>
                    </Flex>
                    <Stack gap={4}>
                      {["item1", "item2", "item3", "item4"].map((item) => (
                        <Flex gap={3} alignItems="flex-start" key={item}>
                          <Circle
                            size="22px"
                            bg="rgba(20, 184, 166, 0.15)"
                            color="brand.400"
                            mt={0.5}
                            flexShrink={0}
                          >
                            <Check size={14} strokeWidth={3} />
                          </Circle>
                          <Text color="gray.300" lineHeight="1.7">
                            {t(`proofProfile.contains.${item}`)}
                          </Text>
                        </Flex>
                      ))}
                    </Stack>
                  </Stack>
                </Box>

                {/* Private content */}
                <Box
                  p={8}
                  bg="rgba(255, 255, 255, 0.02)"
                  borderRadius="2xl"
                  border="1px solid"
                  borderColor="rgba(255, 255, 255, 0.06)"
                >
                  <Stack gap={6}>
                    <Flex gap={3} alignItems="center">
                      <Circle
                        size="40px"
                        bg="rgba(255, 255, 255, 0.08)"
                        color="gray.400"
                      >
                        <Lock size={20} />
                      </Circle>
                      <Text fontWeight="semibold" color="white" fontSize="lg">
                        {t("proofProfile.private.title")}
                      </Text>
                    </Flex>
                    <Stack gap={4}>
                      {["item1", "item2", "item3"].map((item) => (
                        <Flex gap={3} alignItems="flex-start" key={item}>
                          <Circle
                            size="6px"
                            bg="gray.600"
                            mt={2}
                            flexShrink={0}
                          />
                          <Text color="gray.400" lineHeight="1.7">
                            {t(`proofProfile.private.${item}`)}
                          </Text>
                        </Flex>
                      ))}
                    </Stack>
                  </Stack>
                </Box>
              </Grid>
            </AnimatedSection>
          </Stack>
        </Container>
      </Box>

      {/* Privacy Section */}
      <Box py={{ base: 16, md: 24 }} bg="#08080A">
        <Container maxW="container.xl" px={{ base: 4, md: 8 }}>
          <Stack gap={14}>
            <AnimatedSection variants={fadeInUp}>
              <Stack gap={4} textAlign="center" maxW="2xl" mx="auto">
                <SectionLabel>{t("privacy.label")}</SectionLabel>
                <Heading
                  as="h2"
                  fontSize={{ base: "2xl", md: "3xl", lg: "3.5rem" }}
                  color="white"
                  fontWeight="700"
                  letterSpacing="-0.02em"
                >
                  {t("privacy.title")}
                </Heading>
              </Stack>
            </AnimatedSection>

            <AnimatedSection variants={fadeInUp} delay={0.2}>
              <Grid
                templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
                gap={{ base: 8, md: 10 }}
                maxW="4xl"
                mx="auto"
              >
                <PrivacyItem
                  icon={<Shield size={20} />}
                  title={t("privacy.items.visibility.title")}
                  description={t("privacy.items.visibility.description")}
                />
                <PrivacyItem
                  icon={<MessageCircle size={20} />}
                  title={t("privacy.items.consent.title")}
                  description={t("privacy.items.consent.description")}
                />
                <PrivacyItem
                  icon={<Trash2 size={20} />}
                  title={t("privacy.items.deletion.title")}
                  description={t("privacy.items.deletion.description")}
                />
              </Grid>
            </AnimatedSection>
          </Stack>
        </Container>
      </Box>

      {/* FAQ Section */}
      <Box py={{ base: 16, md: 24 }} bg="#0A0A0B">
        <Container maxW="container.xl" px={{ base: 4, md: 8 }}>
          <Stack gap={14}>
            <AnimatedSection variants={fadeInUp}>
              <Stack gap={4} textAlign="center" maxW="2xl" mx="auto">
                <SectionLabel>{t("faq.label")}</SectionLabel>
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

            <AnimatedSection variants={fadeInUp} delay={0.2}>
              <Box maxW="3xl" mx="auto">
                <Accordion.Root collapsible>
                  <Stack gap={3}>
                    {faqItems.map((item) => (
                      <Accordion.Item
                        key={item.key}
                        value={item.key}
                        bg="rgba(255, 255, 255, 0.02)"
                        borderRadius="xl"
                        border="1px solid"
                        borderColor="rgba(255, 255, 255, 0.06)"
                        overflow="hidden"
                        _hover={{
                          borderColor: "rgba(255, 255, 255, 0.1)",
                        }}
                        transition="all 0.2s"
                      >
                        <Accordion.ItemTrigger
                          px={6}
                          py={5}
                          cursor="pointer"
                          _hover={{ bg: "rgba(255, 255, 255, 0.02)" }}
                        >
                          <Flex
                            justify="space-between"
                            align="center"
                            w="full"
                          >
                            <Text
                              fontWeight="medium"
                              color="white"
                              fontSize="md"
                              textAlign="left"
                            >
                              {item.question}
                            </Text>
                            <Accordion.ItemIndicator>
                              <Box color="gray.400">
                                <ChevronDown size={20} />
                              </Box>
                            </Accordion.ItemIndicator>
                          </Flex>
                        </Accordion.ItemTrigger>
                        <Accordion.ItemContent>
                          <Box px={6} pb={5}>
                            <Text
                              color="gray.400"
                              fontSize="sm"
                              lineHeight="1.8"
                            >
                              {item.answer}
                            </Text>
                          </Box>
                        </Accordion.ItemContent>
                      </Accordion.Item>
                    ))}
                  </Stack>
                </Accordion.Root>
              </Box>
            </AnimatedSection>
          </Stack>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        py={{ base: 16, md: 24 }}
        bg="#08080A"
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          inset={0}
          overflow="hidden"
          pointerEvents="none"
        >
          <Glow
            color="rgba(20, 184, 166, 0.15)"
            size="500px"
            top="50%"
            left="50%"
            style={{ transform: "translate(-50%, -50%)" }}
          />
        </Box>

        <Container
          maxW="container.md"
          px={{ base: 4, md: 8 }}
          position="relative"
        >
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
              <Stack
                gap={4}
                direction={{ base: "column", sm: "row" }}
                alignItems="center"
              >
                <Button
                  h={14}
                  px={10}
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
                  _active={{ transform: "translateY(0)" }}
                  transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                  onClick={() => handleStartEvaluation()}
                >
                  {t("cta.button")} <ArrowRight size={18} />
                </Button>
                <Button
                  h={12}
                  px={6}
                  variant="ghost"
                  color="gray.400"
                  fontWeight="medium"
                  borderRadius="xl"
                  fontSize="sm"
                  _hover={{
                    color: "white",
                    bg: "rgba(255, 255, 255, 0.05)",
                  }}
                  onClick={() => navigate(`/${lang}/recruiters`)}
                >
                  {t("cta.secondaryButton")}
                </Button>
              </Stack>
            </Stack>
          </AnimatedSection>
        </Container>
      </Box>
    </Layout>
  );
}
