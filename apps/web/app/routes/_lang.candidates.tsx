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
  Accordion,
} from "@chakra-ui/react";
import { Check, Clock, Pause, ListChecks, FileText, User, Shield, ToggleRight, Trash2, Folder, Code, AlertTriangle, ChevronDown } from "lucide-react";
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
        "Une évaluation plus juste, basée sur des preuves. Work sample ≤ 60 min, critères transparents.",
    },
  ];
};

// Benefit item component
function BenefitItem({ children }: { children: React.ReactNode }) {
  return (
    <Flex gap={3} alignItems="flex-start">
      <Circle size="22px" bg="rgba(20, 184, 166, 0.15)" color="brand.400" flexShrink={0} mt={0.5}>
        <Check size={14} strokeWidth={3} />
      </Circle>
      <Text color="gray.300" fontSize="md" lineHeight="1.7">
        {children}
      </Text>
    </Flex>
  );
}

// Process card component
function ProcessCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
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
        <Circle size="48px" bg="rgba(20, 184, 166, 0.1)" color="brand.400" flexShrink={0}>
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

// Privacy item component
function PrivacyItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Flex gap={4} alignItems="flex-start">
      <Circle size="44px" bg="rgba(20, 184, 166, 0.1)" color="brand.400" flexShrink={0}>
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

// No OSS item component
function NoOssItem({ children }: { children: React.ReactNode }) {
  return (
    <Box
      p={5}
      bg="rgba(255, 255, 255, 0.02)"
      borderRadius="xl"
      border="1px solid"
      borderColor="rgba(255, 255, 255, 0.06)"
    >
      <Flex gap={3} alignItems="center">
        <Circle size="8px" bg="brand.400" flexShrink={0} />
        <Text color="gray.300" fontSize="sm" lineHeight="1.6">
          {children}
        </Text>
      </Flex>
    </Box>
  );
}

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
      await registerCandidate({ ...formData, locale: lang });
      navigate(`/${lang}/thank-you?type=candidate`);
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon("errors.genericError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqItems = [
    { key: "takehome", question: t("faq.items.takehome.question"), answer: t("faq.items.takehome.answer") },
    { key: "freeWork", question: t("faq.items.freeWork.question"), answer: t("faq.items.freeWork.answer") },
    { key: "oss", question: t("faq.items.oss.question"), answer: t("faq.items.oss.answer") },
    { key: "accessibility", question: t("faq.items.accessibility.question"), answer: t("faq.items.accessibility.answer") },
    { key: "whoSees", question: t("faq.items.whoSees.question"), answer: t("faq.items.whoSees.answer") },
  ];

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
          <Glow color="rgba(20, 184, 166, 0.2)" size="600px" top="-20%" left="20%" intensity={1.2} />
          <Glow color="rgba(59, 130, 246, 0.1)" size="400px" bottom="10%" right="10%" intensity={0.8} />
          <Box
            position="absolute"
            inset={0}
            opacity={0.03}
            backgroundImage="linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)"
            backgroundSize="60px 60px"
          />
        </Box>

        <Container maxW="container.xl" px={{ base: 4, md: 8 }} position="relative">
          <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={{ base: 10, lg: 16 }} alignItems="start">
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
                  </Heading>
                  <Text fontSize={{ base: "lg", md: "xl" }} color="gray.400" lineHeight="1.7" maxW="500px">
                    {t("hero.subtitle")}
                  </Text>
                </Stack>

                {/* Benefits List */}
                <Stack gap={3}>
                  <BenefitItem>{t("hero.benefit1")}</BenefitItem>
                  <BenefitItem>{t("hero.benefit2")}</BenefitItem>
                  <BenefitItem>{t("hero.benefit3")}</BenefitItem>
                  <BenefitItem>{t("hero.benefit4")}</BenefitItem>
                </Stack>

                {/* Trust indicators */}
                <Flex gap={10} pt={4} display={{ base: "none", md: "flex" }}>
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
                      {t("stats.free")}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      {t("stats.freeLabel")}
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
                          _active={{ transform: "translateY(0)" }}
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

      {/* Process Section - What to Expect */}
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
              <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(5, 1fr)" }} gap={{ base: 4, md: 5 }} alignItems="stretch">
                <StaggeredItem h="full">
                  <ProcessCard icon={<Clock size={20} />} title={t("process.items.time.title")} description={t("process.items.time.description")} />
                </StaggeredItem>
                <StaggeredItem h="full">
                  <ProcessCard icon={<Pause size={20} />} title={t("process.items.pause.title")} description={t("process.items.pause.description")} />
                </StaggeredItem>
                <StaggeredItem h="full">
                  <ProcessCard icon={<ListChecks size={20} />} title={t("process.items.criteria.title")} description={t("process.items.criteria.description")} />
                </StaggeredItem>
                <StaggeredItem h="full">
                  <ProcessCard icon={<FileText size={20} />} title={t("process.items.feedback.title")} description={t("process.items.feedback.description")} />
                </StaggeredItem>
                <StaggeredItem h="full">
                  <ProcessCard icon={<User size={20} />} title={t("process.items.human.title")} description={t("process.items.human.description")} />
                </StaggeredItem>
              </Grid>
            </StaggeredContainer>
          </Stack>
        </Container>
      </Box>

      {/* Proof Profile Section */}
      <Box py={{ base: 16, md: 24 }} bg="#0A0A0B" position="relative" overflow="hidden">
        <Box position="absolute" inset={0} overflow="hidden" pointerEvents="none">
          <Glow color="rgba(20, 184, 166, 0.1)" size="500px" top="20%" right="-10%" intensity={0.8} />
        </Box>

        <Container maxW="container.xl" px={{ base: 4, md: 8 }} position="relative">
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
              <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={{ base: 6, lg: 10 }}>
                {/* What's in your profile */}
                <Box
                  p={8}
                  bg="rgba(255, 255, 255, 0.02)"
                  borderRadius="2xl"
                  border="1px solid"
                  borderColor="rgba(255, 255, 255, 0.06)"
                >
                  <Stack gap={6}>
                    <Flex gap={3} alignItems="center">
                      <Circle size="40px" bg="rgba(20, 184, 166, 0.15)" color="brand.400">
                        <Folder size={20} />
                      </Circle>
                      <Text fontWeight="semibold" color="white" fontSize="lg">
                        {t("proofProfile.contains.title")}
                      </Text>
                    </Flex>
                    <Stack gap={4}>
                      <Flex gap={3} alignItems="flex-start">
                        <Circle size="6px" bg="brand.400" mt={2} flexShrink={0} />
                        <Text color="gray.300" lineHeight="1.7">{t("proofProfile.contains.item1")}</Text>
                      </Flex>
                      <Flex gap={3} alignItems="flex-start">
                        <Circle size="6px" bg="gray.500" mt={2} flexShrink={0} />
                        <Text color="gray.300" lineHeight="1.7">{t("proofProfile.contains.item2")}</Text>
                      </Flex>
                      <Flex gap={3} alignItems="flex-start">
                        <Circle size="6px" bg="brand.400" mt={2} flexShrink={0} />
                        <Text color="gray.300" lineHeight="1.7">{t("proofProfile.contains.item3")}</Text>
                      </Flex>
                    </Stack>
                  </Stack>
                </Box>

                {/* Why it's useful */}
                <Box
                  p={8}
                  bg="rgba(20, 184, 166, 0.05)"
                  borderRadius="2xl"
                  border="1px solid"
                  borderColor="rgba(20, 184, 166, 0.2)"
                >
                  <Stack gap={6}>
                    <Flex gap={3} alignItems="center">
                      <Circle size="40px" bg="rgba(20, 184, 166, 0.15)" color="brand.400">
                        <Check size={14} strokeWidth={3} />
                      </Circle>
                      <Text fontWeight="semibold" color="white" fontSize="lg">
                        {t("proofProfile.benefits.title")}
                      </Text>
                    </Flex>
                    <Stack gap={4}>
                      <Flex gap={3} alignItems="flex-start">
                        <Circle size="22px" bg="rgba(20, 184, 166, 0.15)" color="brand.400" mt={0.5} flexShrink={0}>
                          <Check size={14} strokeWidth={3} />
                        </Circle>
                        <Text color="gray.300" lineHeight="1.7">{t("proofProfile.benefits.item1")}</Text>
                      </Flex>
                      <Flex gap={3} alignItems="flex-start">
                        <Circle size="22px" bg="rgba(20, 184, 166, 0.15)" color="brand.400" mt={0.5} flexShrink={0}>
                          <Check size={14} strokeWidth={3} />
                        </Circle>
                        <Text color="gray.300" lineHeight="1.7">{t("proofProfile.benefits.item2")}</Text>
                      </Flex>
                      <Flex gap={3} alignItems="flex-start">
                        <Circle size="22px" bg="rgba(20, 184, 166, 0.15)" color="brand.400" mt={0.5} flexShrink={0}>
                          <Check size={14} strokeWidth={3} />
                        </Circle>
                        <Text color="gray.300" lineHeight="1.7">{t("proofProfile.benefits.item3")}</Text>
                      </Flex>
                    </Stack>
                  </Stack>
                </Box>
              </Grid>
            </AnimatedSection>
          </Stack>
        </Container>
      </Box>

      {/* No OSS Section */}
      <Box py={{ base: 16, md: 24 }} bg="#08080A">
        <Container maxW="container.xl" px={{ base: 4, md: 8 }}>
          <Stack gap={14}>
            <AnimatedSection variants={fadeInUp}>
              <Stack gap={4} textAlign="center" maxW="2xl" mx="auto">
                <SectionLabel>{t("noOss.label")}</SectionLabel>
                <Heading
                  as="h2"
                  fontSize={{ base: "2xl", md: "3xl", lg: "3.5rem" }}
                  color="white"
                  fontWeight="700"
                  letterSpacing="-0.02em"
                >
                  {t("noOss.title")}
                </Heading>
                <Text color="gray.400" fontSize="lg" lineHeight="1.7">
                  {t("noOss.subtitle")}
                </Text>
              </Stack>
            </AnimatedSection>

            <StaggeredContainer>
              <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={{ base: 4, md: 5 }} maxW="4xl" mx="auto">
                <StaggeredItem>
                  <NoOssItem>{t("noOss.items.explanation")}</NoOssItem>
                </StaggeredItem>
                <StaggeredItem>
                  <NoOssItem>{t("noOss.items.incident")}</NoOssItem>
                </StaggeredItem>
                <StaggeredItem>
                  <NoOssItem>{t("noOss.items.exercise")}</NoOssItem>
                </StaggeredItem>
                <StaggeredItem>
                  <NoOssItem>{t("noOss.items.design")}</NoOssItem>
                </StaggeredItem>
              </Grid>
            </StaggeredContainer>

            <AnimatedSection variants={fadeInUp} delay={0.3}>
              <Box
                maxW="3xl"
                mx="auto"
                p={5}
                bg="rgba(20, 184, 166, 0.05)"
                borderRadius="xl"
                border="1px solid"
                borderColor="rgba(20, 184, 166, 0.2)"
              >
                <Flex gap={4} alignItems="flex-start">
                  <Circle size="36px" bg="rgba(20, 184, 166, 0.15)" color="brand.400" flexShrink={0}>
                    <Code size={20} />
                  </Circle>
                  <Text color="gray.300" fontSize="sm" lineHeight="1.7">
                    {t("noOss.note")}
                  </Text>
                </Flex>
              </Box>
            </AnimatedSection>
          </Stack>
        </Container>
      </Box>

      {/* Privacy Section */}
      <Box py={{ base: 16, md: 24 }} bg="#0A0A0B">
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
              <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={{ base: 8, md: 10 }} maxW="4xl" mx="auto">
                <PrivacyItem
                  icon={<Shield size={20} />}
                  title={t("privacy.items.consent.title")}
                  description={t("privacy.items.consent.description")}
                />
                <PrivacyItem
                  icon={<ToggleRight size={20} />}
                  title={t("privacy.items.retention.title")}
                  description={t("privacy.items.retention.description")}
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
      <Box py={{ base: 16, md: 24 }} bg="#08080A">
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
                        _hover={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
                        transition="all 0.2s"
                      >
                        <Accordion.ItemTrigger
                          px={6}
                          py={5}
                          cursor="pointer"
                          _hover={{ bg: "rgba(255, 255, 255, 0.02)" }}
                        >
                          <Flex justify="space-between" align="center" w="full">
                            <Text fontWeight="medium" color="white" fontSize="md" textAlign="left">
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
                            <Text color="gray.400" fontSize="sm" lineHeight="1.8">
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
      <Box py={{ base: 16, md: 24 }} bg="#0A0A0B" position="relative" overflow="hidden">
        <Box position="absolute" inset={0} overflow="hidden" pointerEvents="none">
          <Glow color="rgba(20, 184, 166, 0.15)" size="500px" top="50%" left="50%" style={{ transform: "translate(-50%, -50%)" }} />
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
              <Stack gap={4} direction={{ base: "column", sm: "row" }} alignItems="center">
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
                  _active={{ transform: "translateY(0)" }}
                  transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                >
                  {t("cta.button")}
                </Button>
                <Button
                  h={12}
                  px={6}
                  variant="ghost"
                  color="gray.400"
                  fontWeight="medium"
                  borderRadius="xl"
                  fontSize="sm"
                  _hover={{ color: "white", bg: "rgba(255, 255, 255, 0.05)" }}
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
