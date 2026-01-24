import type { MetaFunction } from "react-router";
import {
  Box,
  Container,
  Heading,
  Text,
  Stack,
  Flex,
  Grid,
  Badge,
} from "@chakra-ui/react";
import { Link } from "react-router";
import { Layout } from "~/components/layout";
import { Logo } from "~/components/ui/logo";
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
    { title: "Baara - Le recrutement basé sur le travail" },
    {
      name: "description",
      content:
        "Baara revolutionne le recrutement tech. Montrez votre travail, pas juste votre CV.",
    },
  ];
};

// Icons as simple SVG components
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

function PortfolioIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MatchIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SpeedIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
  return (
    <Layout>
      {/* Hero Section */}
      <HeroSection pb={{ base: 20, md: 32 }}>
        {/* Subtle pattern overlay */}
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
          <Grid
            templateColumns={{ base: "1fr", lg: "1fr 1fr" }}
            gap={{ base: 12, lg: 16 }}
            alignItems="center"
          >
            {/* Left Content */}
            <Stack gap={8}>
              <Badge
                bg="brand.100"
                color="brand.700"
                px={4}
                py={1.5}
                borderRadius="full"
                fontWeight="medium"
                fontSize="sm"
                w="fit-content"
              >
                Programme pilote ouvert
              </Badge>

              <Stack gap={6}>
                <Heading
                  as="h1"
                  fontSize={{ base: "3xl", md: "4xl", lg: "5xl" }}
                  lineHeight="1.15"
                  color="gray.900"
                >
                  Le recrutement basé sur les{" "}
                  <Text as="span" className="text-gradient">
                    preuves
                  </Text>
                  , pas les CV
                </Heading>

                <Text
                  fontSize={{ base: "lg", md: "xl" }}
                  color="gray.600"
                  lineHeight="1.7"
                  maxW="540px"
                >
                  Connectez les talents tech aux entreprises qui valorisent les
                  competences reelles. Montrez votre travail, obtenez les
                  opportunites que vous meritez.
                </Text>
              </Stack>

              <Flex gap={4} direction={{ base: "column", sm: "row" }}>
                <Link to="/pilot">
                  <PrimaryButton h={14} w={{ base: "full", sm: "auto" }}>
                    Rejoindre le programme pilote
                  </PrimaryButton>
                </Link>
                <Link to="/candidates">
                  <SecondaryButton h={14} w={{ base: "full", sm: "auto" }}>
                    Je suis candidat
                  </SecondaryButton>
                </Link>
              </Flex>

              {/* Trust indicators */}
              <Flex gap={6} pt={4} flexWrap="wrap">
                <Flex gap={2} alignItems="center" color="gray.500">
                  <Box color="brand.700">
                    <CheckIcon />
                  </Box>
                  <Text fontSize="sm">Gratuit pour les candidats</Text>
                </Flex>
                <Flex gap={2} alignItems="center" color="gray.500">
                  <Box color="brand.700">
                    <CheckIcon />
                  </Box>
                  <Text fontSize="sm">Sans engagement</Text>
                </Flex>
              </Flex>
            </Stack>

            {/* Right Visual */}
            <Flex
              display={{ base: "none", lg: "flex" }}
              justifyContent="center"
              alignItems="center"
            >
              <Box
                bg="white"
                borderRadius="3xl"
                p={10}
                boxShadow="hero"
                position="relative"
              >
                <Logo size="hero" variant="light" animated />
                <Box
                  position="absolute"
                  top={-4}
                  right={-4}
                  bg="brand.700"
                  color="white"
                  px={4}
                  py={2}
                  borderRadius="xl"
                  fontSize="sm"
                  fontWeight="semibold"
                  boxShadow="lg"
                >
                  Nouveau
                </Box>
              </Box>
            </Flex>
          </Grid>
        </Container>
      </HeroSection>

      {/* Features Section */}
      <Box py={{ base: 16, md: 24 }} bg="white">
        <Container maxW="container.xl" px={{ base: 4, md: 8 }}>
          <Stack gap={14}>
            <SectionHeader
              label="Pourquoi Baara"
              title="Une nouvelle approche du recrutement"
              description="Fini les CV generiques et les entretiens interminables. Place au travail qui parle de lui-meme."
            />

            {/* Features Grid */}
            <Grid
              templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
              gap={8}
            >
              <FeatureCard
                icon={<PortfolioIcon />}
                title="Portfolio de travail"
                description="Presentez vos projets, contributions open-source, et realisations concretes. Votre travail parle pour vous."
              />
              <FeatureCard
                icon={<MatchIcon />}
                title="Matching intelligent"
                description="Notre algorithme connecte votre expertise aux opportunites pertinentes. Pas de spam, que des missions qui correspondent."
              />
              <FeatureCard
                icon={<SpeedIcon />}
                title="Process simplifie"
                description="Moins d'etapes, plus de transparence. Les recruteurs voient directement ce que vous savez faire."
              />
            </Grid>
          </Stack>
        </Container>
      </Box>

      {/* How it works Section */}
      <Box py={{ base: 16, md: 24 }} bg="gray.50" id="how-it-works">
        <Container maxW="container.xl" px={{ base: 4, md: 8 }}>
          <Stack gap={14}>
            <SectionHeader
              label="Comment ca marche"
              title="Simple comme 1, 2, 3"
            />

            <Grid
              templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
              gap={8}
            >
              <StepCardCentered
                number={1}
                title="Creez votre profil"
                description="Importez vos projets GitHub, ajoutez vos realisations et construisez un portfolio qui vous represente."
              />
              <StepCardCentered
                number={2}
                title="Soyez decouvert"
                description="Les recruteurs parcourent les portfolios et trouvent les talents qui correspondent a leurs besoins."
              />
              <StepCardCentered
                number={3}
                title="Connectez-vous"
                description="Echangez directement avec les entreprises interessees par votre travail. Pas de CV, pas de lettre de motivation."
              />
            </Grid>
          </Stack>
        </Container>
      </Box>

      {/* CTA Section */}
      <CTASection>
        <Container maxW="container.xl" px={{ base: 4, md: 8 }}>
          <Stack gap={8} textAlign="center" maxW="2xl" mx="auto">
            <Stack gap={4}>
              <Heading
                as="h2"
                fontSize={{ base: "2xl", md: "3xl", lg: "4xl" }}
                color="white"
              >
                Prêt à changer la donne ?
              </Heading>
              <Text
                color="brand.200"
                fontSize={{ base: "md", md: "lg" }}
                lineHeight="1.8"
                maxW="xl"
                mx="auto"
              >
                Rejoignez le programme pilote et soyez parmi les premiers a
                experimenter le recrutement nouvelle generation.
              </Text>
            </Stack>

            <Flex
              justify="center"
              gap={4}
              direction={{ base: "column", sm: "row" }}
            >
              <Link to="/pilot">
                <WhiteButton h={14} w={{ base: "full", sm: "auto" }}>
                  <Flex alignItems="center" gap={2}>
                    Demander un acces
                    <ArrowRightIcon />
                  </Flex>
                </WhiteButton>
              </Link>
            </Flex>

            <Text color="brand.300" fontSize="sm">
              Acces gratuit pendant le programme pilote
            </Text>
          </Stack>
        </Container>
      </CTASection>
    </Layout>
  );
}
