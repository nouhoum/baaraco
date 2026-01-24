import { useState } from "react";
import type { MetaFunction } from "react-router";
import { useNavigate } from "react-router";
import {
  Box,
  Container,
  Heading,
  Text,
  Stack,
  Card,
  Button,
  Alert,
  Grid,
  Flex,
  Circle,
} from "@chakra-ui/react";
import { Layout } from "~/components/layout";
import { FormInput } from "~/components/ui/input";
import { registerRecruiter } from "~/components/lib/api";

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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// Star icon for premium features
function StarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

// Benefit item component
function BenefitItem({ children }: { children: React.ReactNode }) {
  return (
    <Flex gap={3} alignItems="flex-start">
      <Circle size="24px" bg="#CCFBF1" color="#0F766E" flexShrink={0} mt={0.5}>
        <CheckIcon />
      </Circle>
      <Text color="gray.700" fontSize="md" lineHeight="1.6">
        {children}
      </Text>
    </Flex>
  );
}

// Feature card component
function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Box
      p={{ base: 5, md: 6 }}
      bg="white"
      borderRadius="2xl"
      border="1px solid"
      borderColor="gray.100"
      className="card-hover-subtle"
      _hover={{
        borderColor: "#CCFBF1",
      }}
    >
      <Stack gap={4}>
        <Circle size="48px" bg="linear-gradient(135deg, #F0FDFA 0%, #CCFBF1 100%)" color="#0F766E">
          {icon}
        </Circle>
        <Text fontWeight="semibold" color="gray.900" fontSize="md">
          {title}
        </Text>
        <Text color="gray.500" fontSize="sm" lineHeight="1.7">
          {description}
        </Text>
      </Stack>
    </Box>
  );
}

// Icons for features
function UsersIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function ZapIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

export default function Pilot() {
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
      navigate("/thank-you?type=recruiter");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      {/* Hero Section */}
      <Box
        className="gradient-hero"
        mt={{ base: "-64px", md: "-72px" }}
        pt={{ base: 28, md: 36 }}
        pb={{ base: 12, md: 20 }}
      >
        <Container maxW="container.xl" px={{ base: 4, md: 8 }}>
          <Grid
            templateColumns={{ base: "1fr", lg: "1fr 1fr" }}
            gap={{ base: 10, lg: 16 }}
            alignItems="start"
          >
            {/* Left Column - Content */}
            <Stack gap={8}>
              {/* Badge */}
              <Box>
                <Box
                  as="span"
                  display="inline-flex"
                  alignItems="center"
                  gap={2}
                  bg="white"
                  px={4}
                  py={2}
                  borderRadius="full"
                  fontSize="sm"
                  fontWeight="medium"
                  color="#0F766E"
                  boxShadow="sm"
                  border="1px solid"
                  borderColor="#E5E7EB"
                >
                  <StarIcon />
                  Programme Pilote
                </Box>
              </Box>

              {/* Heading */}
              <Stack gap={4}>
                <Heading
                  as="h1"
                  fontSize={{ base: "3xl", md: "4xl", lg: "5xl" }}
                  fontWeight="bold"
                  lineHeight="1.1"
                  color="gray.900"
                >
                  Recrutez sur la base du{" "}
                  <Text as="span" className="text-gradient">
                    travail reel
                  </Text>
                </Heading>
                <Text
                  fontSize={{ base: "lg", md: "xl" }}
                  color="gray.600"
                  lineHeight="1.7"
                  maxW="500px"
                >
                  Decouvrez une nouvelle facon d'identifier les meilleurs talents.
                  Evaluez les candidats sur leurs realisations, pas sur leurs diplomes.
                </Text>
              </Stack>

              {/* Benefits List */}
              <Stack gap={4}>
                <BenefitItem>
                  Acces anticipe a la plateforme Baara avant le lancement
                </BenefitItem>
                <BenefitItem>
                  Profils de candidats bases sur leurs realisations concretes
                </BenefitItem>
                <BenefitItem>
                  Support dedie pendant toute la duree du programme pilote
                </BenefitItem>
                <BenefitItem>
                  Tarification preferentielle garantie au lancement officiel
                </BenefitItem>
              </Stack>

              {/* Trust indicators */}
              <Flex gap={8} pt={4} display={{ base: "none", md: "flex" }}>
                <Stack gap={1}>
                  <Text fontWeight="bold" fontSize="2xl" color="gray.900">
                    50+
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Entreprises
                  </Text>
                </Stack>
                <Box w="1px" bg="gray.200" />
                <Stack gap={1}>
                  <Text fontWeight="bold" fontSize="2xl" color="gray.900">
                    -40%
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Temps recrutement
                  </Text>
                </Stack>
                <Box w="1px" bg="gray.200" />
                <Stack gap={1}>
                  <Text fontWeight="bold" fontSize="2xl" color="gray.900">
                    3x
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Meilleur matching
                  </Text>
                </Stack>
              </Flex>
            </Stack>

            {/* Right Column - Form */}
            <Card.Root
              bg="white"
              shadow="xl"
              borderRadius="2xl"
              border="1px solid"
              borderColor="gray.100"
              overflow="hidden"
            >
              <Box
                h="4px"
                bg="linear-gradient(90deg, #0F766E 0%, #14B8A6 100%)"
              />
              <Card.Body p={{ base: 6, md: 8 }}>
                <Stack gap={6}>
                  <Stack gap={2}>
                    <Heading as="h2" size="lg" color="gray.900">
                      Demandez votre acces
                    </Heading>
                    <Text color="gray.600" fontSize="sm">
                      Places limitees - Rejoignez le programme pilote
                    </Text>
                  </Stack>

                  <form onSubmit={handleSubmit}>
                    <Stack gap={5}>
                      {error && (
                        <Alert.Root status="error" borderRadius="lg">
                          <Alert.Indicator />
                          <Alert.Title fontSize="sm">{error}</Alert.Title>
                        </Alert.Root>
                      )}

                      <FormInput
                        label="Votre nom"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Jean Dupont"
                        required
                      />

                      <FormInput
                        label="Email professionnel"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="jean@entreprise.com"
                        required
                      />

                      <FormInput
                        label="Entreprise"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        placeholder="Nom de votre entreprise"
                        required
                      />

                      <FormInput
                        label="Poste (optionnel)"
                        name="job_title"
                        value={formData.job_title}
                        onChange={handleChange}
                        placeholder="Ex: Talent Acquisition Manager"
                      />

                      <Button
                        type="submit"
                        size="lg"
                        w="full"
                        bg="#0F766E"
                        color="white"
                        fontWeight="semibold"
                        borderRadius="xl"
                        className="btn-primary"
                        _hover={{
                          bg: "#115E59",
                          transform: "translateY(-2px)",
                          boxShadow: "0 8px 20px rgba(15, 118, 110, 0.35)",
                        }}
                        _active={{
                          transform: "translateY(0)",
                        }}
                        transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                        loading={isSubmitting}
                        mt={2}
                      >
                        Demander un acces
                      </Button>

                      <Text fontSize="xs" color="gray.500" textAlign="center">
                        Nous vous recontacterons sous 24h
                      </Text>
                    </Stack>
                  </form>
                </Stack>
              </Card.Body>
            </Card.Root>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box py={{ base: 16, md: 24 }} bg="white">
        <Container maxW="container.xl" px={{ base: 4, md: 8 }}>
          <Stack gap={14}>
            <Stack gap={4} textAlign="center" maxW="2xl" mx="auto">
              <Text
                fontSize="xs"
                fontWeight="semibold"
                color="#14B8A6"
                textTransform="uppercase"
                letterSpacing="0.1em"
              >
                Avantages
              </Text>
              <Heading
                as="h2"
                fontSize={{ base: "2xl", md: "3xl", lg: "4xl" }}
                fontWeight="bold"
                color="gray.900"
              >
                Pourquoi rejoindre le programme pilote ?
              </Heading>
            </Stack>

            <Grid
              templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }}
              gap={6}
            >
              <FeatureCard
                icon={<UsersIcon />}
                title="Talents qualifies"
                description="Acces a des profils de candidats pre-valides avec des preuves concretes de leurs competences."
              />
              <FeatureCard
                icon={<TargetIcon />}
                title="Matching precis"
                description="Notre algorithme identifie les candidats dont le travail correspond exactement a vos besoins."
              />
              <FeatureCard
                icon={<ZapIcon />}
                title="Gain de temps"
                description="Reduisez votre temps de recrutement en evaluant directement le travail realise."
              />
              <FeatureCard
                icon={<ShieldIcon />}
                title="Zero risque"
                description="Testez la plateforme gratuitement pendant le programme pilote. Sans engagement."
              />
            </Grid>
          </Stack>
        </Container>
      </Box>

      {/* Pilot Program Details */}
      <Box py={{ base: 16, md: 24 }} bg="gray.50">
        <Container maxW="container.xl" px={{ base: 4, md: 8 }}>
          <Grid
            templateColumns={{ base: "1fr", lg: "1fr 1fr" }}
            gap={{ base: 10, lg: 16 }}
            alignItems="center"
          >
            <Stack gap={8}>
              <Stack gap={4}>
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  color="#14B8A6"
                  textTransform="uppercase"
                  letterSpacing="0.1em"
                >
                  Programme pilote
                </Text>
                <Heading
                  as="h2"
                  fontSize={{ base: "2xl", md: "3xl", lg: "4xl" }}
                  fontWeight="bold"
                  color="gray.900"
                >
                  Comment ca fonctionne ?
                </Heading>
              </Stack>

              <Stack gap={5}>
                <Flex gap={4} alignItems="flex-start">
                  <Circle
                    size="36px"
                    bg="linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)"
                    color="white"
                    fontWeight="bold"
                    fontSize="sm"
                    flexShrink={0}
                    boxShadow="0 4px 12px rgba(15, 118, 110, 0.2)"
                  >
                    1
                  </Circle>
                  <Box>
                    <Text fontWeight="semibold" color="gray.900" mb={1}>
                      Inscription au programme
                    </Text>
                    <Text color="gray.500" fontSize="sm" lineHeight="1.7">
                      Remplissez le formulaire et notre equipe vous contactera sous 24h.
                    </Text>
                  </Box>
                </Flex>

                <Flex gap={4} alignItems="flex-start">
                  <Circle
                    size="36px"
                    bg="linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)"
                    color="white"
                    fontWeight="bold"
                    fontSize="sm"
                    flexShrink={0}
                    boxShadow="0 4px 12px rgba(15, 118, 110, 0.2)"
                  >
                    2
                  </Circle>
                  <Box>
                    <Text fontWeight="semibold" color="gray.900" mb={1}>
                      Onboarding personnalise
                    </Text>
                    <Text color="gray.500" fontSize="sm" lineHeight="1.7">
                      Definissons ensemble vos besoins et configurons votre espace recruteur.
                    </Text>
                  </Box>
                </Flex>

                <Flex gap={4} alignItems="flex-start">
                  <Circle
                    size="36px"
                    bg="linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)"
                    color="white"
                    fontWeight="bold"
                    fontSize="sm"
                    flexShrink={0}
                    boxShadow="0 4px 12px rgba(15, 118, 110, 0.2)"
                  >
                    3
                  </Circle>
                  <Box>
                    <Text fontWeight="semibold" color="gray.900" mb={1}>
                      Acces a la plateforme
                    </Text>
                    <Text color="gray.500" fontSize="sm" lineHeight="1.7">
                      Explorez les profils de candidats et decouvrez une nouvelle facon de recruter.
                    </Text>
                  </Box>
                </Flex>

                <Flex gap={4} alignItems="flex-start">
                  <Circle
                    size="36px"
                    bg="linear-gradient(135deg, #14B8A6 0%, #2DD4BF 100%)"
                    color="white"
                    fontWeight="bold"
                    fontSize="sm"
                    flexShrink={0}
                    boxShadow="0 4px 12px rgba(20, 184, 166, 0.2)"
                  >
                    4
                  </Circle>
                  <Box>
                    <Text fontWeight="semibold" color="gray.900" mb={1}>
                      Feedback et amelioration
                    </Text>
                    <Text color="gray.500" fontSize="sm" lineHeight="1.7">
                      Vos retours nous aident a construire le meilleur outil de recrutement.
                    </Text>
                  </Box>
                </Flex>
              </Stack>
            </Stack>

            {/* Pricing Preview */}
            <Box
              bg="white"
              p={{ base: 6, md: 8 }}
              borderRadius="2xl"
              border="1px solid"
              borderColor="gray.100"
              boxShadow="0 20px 50px rgba(0, 0, 0, 0.08)"
            >
              <Stack gap={6}>
                <Stack gap={2}>
                  <Flex gap={2} alignItems="center">
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      color="white"
                      bg="#14B8A6"
                      px={2}
                      py={1}
                      borderRadius="full"
                      textTransform="uppercase"
                    >
                      Offre pilote
                    </Text>
                  </Flex>
                  <Heading as="h3" size="xl" color="gray.900">
                    Gratuit pendant le pilote
                  </Heading>
                  <Text color="gray.600" fontSize="sm">
                    Profitez d'un acces complet a la plateforme sans frais
                  </Text>
                </Stack>

                <Box w="full" h="1px" bg="gray.200" />

                <Stack gap={3}>
                  <Flex gap={3} alignItems="center">
                    <Circle size="20px" bg="#CCFBF1" color="#0F766E">
                      <CheckIcon />
                    </Circle>
                    <Text color="gray.700" fontSize="sm">
                      Acces illimite aux profils candidats
                    </Text>
                  </Flex>
                  <Flex gap={3} alignItems="center">
                    <Circle size="20px" bg="#CCFBF1" color="#0F766E">
                      <CheckIcon />
                    </Circle>
                    <Text color="gray.700" fontSize="sm">
                      Publication d'offres d'emploi
                    </Text>
                  </Flex>
                  <Flex gap={3} alignItems="center">
                    <Circle size="20px" bg="#CCFBF1" color="#0F766E">
                      <CheckIcon />
                    </Circle>
                    <Text color="gray.700" fontSize="sm">
                      Messagerie directe avec les candidats
                    </Text>
                  </Flex>
                  <Flex gap={3} alignItems="center">
                    <Circle size="20px" bg="#CCFBF1" color="#0F766E">
                      <CheckIcon />
                    </Circle>
                    <Text color="gray.700" fontSize="sm">
                      Support prioritaire
                    </Text>
                  </Flex>
                  <Flex gap={3} alignItems="center">
                    <Circle size="20px" bg="#CCFBF1" color="#0F766E">
                      <CheckIcon />
                    </Circle>
                    <Text color="gray.700" fontSize="sm">
                      -30% sur l'abonnement au lancement
                    </Text>
                  </Flex>
                </Stack>

                <Button
                  size="lg"
                  w="full"
                  bg="#0F766E"
                  color="white"
                  fontWeight="semibold"
                  borderRadius="xl"
                  _hover={{
                    bg: "#115E59",
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 12px rgba(15, 118, 110, 0.3)",
                  }}
                  _active={{
                    transform: "translateY(0)",
                  }}
                  transition="all 0.2s"
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                >
                  Rejoindre le programme
                </Button>
              </Stack>
            </Box>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box className="gradient-cta" py={{ base: 16, md: 24 }}>
        <Container maxW="container.md" px={{ base: 4, md: 8 }}>
          <Stack gap={8} textAlign="center" alignItems="center">
            <Heading
              as="h2"
              fontSize={{ base: "2xl", md: "3xl", lg: "4xl" }}
              fontWeight="bold"
              color="white"
            >
              Pret a transformer votre recrutement ?
            </Heading>
            <Text color="#99F6E4" fontSize="lg" maxW="xl" lineHeight="1.8">
              Rejoignez les entreprises qui ont deja choisi de recruter sur la
              base du travail reel.
            </Text>
            <Button
              size="lg"
              bg="white"
              color="#0F766E"
              fontWeight="semibold"
              px={8}
              borderRadius="xl"
              _hover={{
                bg: "#F0FDFA",
                transform: "translateY(-2px)",
                boxShadow: "0 8px 20px rgba(0, 0, 0, 0.15)",
              }}
              _active={{
                transform: "translateY(0)",
              }}
              transition="all 0.2s"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Demander un acces
            </Button>
          </Stack>
        </Container>
      </Box>
    </Layout>
  );
}
