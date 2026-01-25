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
        "Rejoignez le programme pilote Baara et découvrez le recrutement basé sur le travail.",
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

// Star icon for premium features
function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
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

// Feature card component - Dark mode
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
    <Box
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
      <Stack gap={4}>
        <Circle
          size="48px"
          bg="rgba(20, 184, 166, 0.1)"
          color="brand.400"
        >
          {icon}
        </Circle>
        <Text fontWeight="semibold" color="white" fontSize="md">
          {title}
        </Text>
        <Text color="gray.400" fontSize="sm" lineHeight="1.7">
          {description}
        </Text>
      </Stack>
    </Box>
  );
}

// Icons for features
function UsersIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function ZapIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
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
                    <StarIcon />
                    Programme Pilote
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
                    Recrutez sur la base du{" "}
                    <Text as="span" color="brand.400">
                      travail réel
                    </Text>
                  </Heading>
                  <Text
                    fontSize={{ base: "lg", md: "xl" }}
                    color="gray.400"
                    lineHeight="1.7"
                    maxW="500px"
                  >
                    Découvrez une nouvelle façon d'identifier les meilleurs
                    talents. Évaluez les candidats sur leurs réalisations, pas sur
                    leurs diplômes.
                  </Text>
                </Stack>

                {/* Benefits List */}
                <Stack gap={3}>
                  <BenefitItem>
                    Accès anticipé à la plateforme Baara avant le lancement
                  </BenefitItem>
                  <BenefitItem>
                    Profils de candidats basés sur leurs réalisations concrètes
                  </BenefitItem>
                  <BenefitItem>
                    Support dédié pendant toute la durée du programme pilote
                  </BenefitItem>
                  <BenefitItem>
                    Tarification préférentielle garantie au lancement officiel
                  </BenefitItem>
                </Stack>

                {/* Trust indicators */}
                <Flex gap={10} pt={4} display={{ base: "none", md: "flex" }}>
                  <Stack gap={1}>
                    <Text fontWeight="bold" fontSize="2xl" color="white" fontFamily="heading">
                      50+
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      Entreprises
                    </Text>
                  </Stack>
                  <Box w="1px" bg="rgba(255, 255, 255, 0.1)" />
                  <Stack gap={1}>
                    <Text fontWeight="bold" fontSize="2xl" color="white" fontFamily="heading">
                      -40%
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      Temps recrutement
                    </Text>
                  </Stack>
                  <Box w="1px" bg="rgba(255, 255, 255, 0.1)" />
                  <Stack gap={1}>
                    <Text fontWeight="bold" fontSize="2xl" color="white" fontFamily="heading">
                      3x
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      Meilleur matching
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
                        Demandez votre accès
                      </Heading>
                      <Text color="gray.400" fontSize="sm">
                        Places limitées - Rejoignez le programme pilote
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
                          label="Votre nom"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Jean Dupont"
                          required
                          colorMode="dark"
                        />

                        <FormInput
                          label="Email professionnel"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="jean@entreprise.com"
                          required
                          colorMode="dark"
                        />

                        <FormInput
                          label="Entreprise"
                          name="company"
                          value={formData.company}
                          onChange={handleChange}
                          placeholder="Nom de votre entreprise"
                          required
                          colorMode="dark"
                        />

                        <FormInput
                          label="Poste (optionnel)"
                          name="job_title"
                          value={formData.job_title}
                          onChange={handleChange}
                          placeholder="Ex: Talent Acquisition Manager"
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
                          Demander un accès
                        </Button>

                        <Text fontSize="xs" color="gray.500" textAlign="center">
                          Nous vous recontacterons sous 24h
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

      {/* Features Section - Dark Mode */}
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
                  Avantages
                </Text>
                <Heading
                  as="h2"
                  fontSize={{ base: "2xl", md: "3xl", lg: "3.5rem" }}
                  color="white"
                  fontWeight="700"
                  letterSpacing="-0.02em"
                >
                  Pourquoi rejoindre le programme pilote ?
                </Heading>
              </Stack>
            </AnimatedSection>

            <StaggeredContainer>
              <Grid
                templateColumns={{
                  base: "1fr",
                  md: "repeat(2, 1fr)",
                  lg: "repeat(4, 1fr)",
                }}
                gap={6}
              >
                <StaggeredItem>
                  <FeatureCard
                    icon={<UsersIcon />}
                    title="Talents qualifiés"
                    description="Accès à des profils de candidats pré-validés avec des preuves concrètes de leurs compétences."
                  />
                </StaggeredItem>
                <StaggeredItem>
                  <FeatureCard
                    icon={<TargetIcon />}
                    title="Matching précis"
                    description="Notre algorithme identifie les candidats dont le travail correspond exactement à vos besoins."
                  />
                </StaggeredItem>
                <StaggeredItem>
                  <FeatureCard
                    icon={<ZapIcon />}
                    title="Gain de temps"
                    description="Réduisez votre temps de recrutement en évaluant directement le travail réalisé."
                  />
                </StaggeredItem>
                <StaggeredItem>
                  <FeatureCard
                    icon={<ShieldIcon />}
                    title="Zéro risque"
                    description="Testez la plateforme gratuitement pendant le programme pilote. Sans engagement."
                  />
                </StaggeredItem>
              </Grid>
            </StaggeredContainer>
          </Stack>
        </Container>
      </Box>

      {/* Pilot Program Details - Dark Mode */}
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
            gap={{ base: 10, lg: 16 }}
            alignItems="center"
          >
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
                    Programme pilote
                  </Text>
                  <Heading
                    as="h2"
                    fontSize={{ base: "2xl", md: "3xl", lg: "3.5rem" }}
                    color="white"
                    fontWeight="700"
                    letterSpacing="-0.02em"
                  >
                    Comment ça fonctionne ?
                  </Heading>
                </Stack>

                <Stack gap={6}>
                  <StepItem
                    number={1}
                    title="Inscription au programme"
                    description="Remplissez le formulaire et notre équipe vous contactera sous 24h."
                  />
                  <StepItem
                    number={2}
                    title="Onboarding personnalisé"
                    description="Définissons ensemble vos besoins et configurons votre espace recruteur."
                  />
                  <StepItem
                    number={3}
                    title="Accès à la plateforme"
                    description="Explorez les profils de candidats et découvrez une nouvelle façon de recruter."
                  />
                  <StepItem
                    number={4}
                    title="Feedback et amélioration"
                    description="Vos retours nous aident à construire le meilleur outil de recrutement."
                    isLast
                  />
                </Stack>
              </Stack>
            </AnimatedSection>

            {/* Pricing Preview - Dark Mode */}
            <AnimatedSection variants={fadeInUp} delay={0.2}>
              <Box
                bg="rgba(255, 255, 255, 0.02)"
                p={{ base: 6, md: 8 }}
                borderRadius="2xl"
                border="1px solid"
                borderColor="rgba(255, 255, 255, 0.08)"
                boxShadow="0 0 60px rgba(20, 184, 166, 0.08)"
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
                        Offre pilote
                      </Text>
                    </Flex>
                    <Heading as="h3" fontSize="2xl" color="white" fontWeight="bold">
                      Gratuit pendant le pilote
                    </Heading>
                    <Text color="gray.400" fontSize="sm">
                      Profitez d'un accès complet à la plateforme sans frais
                    </Text>
                  </Stack>

                  <Box w="full" h="1px" bg="rgba(255, 255, 255, 0.08)" />

                  <Stack gap={3}>
                    {[
                      "Accès illimité aux profils candidats",
                      "Publication d'offres d'emploi",
                      "Messagerie directe avec les candidats",
                      "Support prioritaire",
                      "-30% sur l'abonnement au lancement",
                    ].map((item, i) => (
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
                    Rejoindre le programme
                  </Button>
                </Stack>
              </Box>
            </AnimatedSection>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section - Dark Mode */}
      <Box
        py={{ base: 16, md: 24 }}
        bg="#08080A"
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
