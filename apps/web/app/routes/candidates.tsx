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
import { registerCandidate } from "~/components/lib/api";
import { FormInput } from "~/components/ui/input";

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
      width="16"
      height="16"
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

// Step item component
function StepItem({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
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
        {number}
      </Circle>
      <Box>
        <Text fontWeight="semibold" color="gray.900" mb={1}>
          {title}
        </Text>
        <Text color="gray.500" fontSize="sm" lineHeight="1.7">
          {description}
        </Text>
      </Box>
    </Flex>
  );
}

export default function Candidates() {
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
      navigate("/thank-you?type=candidate");
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
                  <Circle size="8px" bg="#14B8A6" />
                  Pour les candidats
                </Box>
              </Box>

              {/* Heading */}
              <Stack gap={4}>
                <Heading
                  as="h1"
                  fontSize={{ base: "3xl", md: "4xl", lg: "5xl" }}
                  lineHeight="1.1"
                  color="gray.900"
                >
                  Montrez votre{" "}
                  <Text as="span" className="text-gradient">
                    travail
                  </Text>
                  , pas votre CV
                </Heading>
                <Text
                  fontSize={{ base: "lg", md: "xl" }}
                  color="gray.600"
                  lineHeight="1.7"
                  maxW="500px"
                >
                  Marre des CV qui ne reflètent pas vos compétences ? Rejoignez
                  Baara et laissez votre travail parler pour vous.
                </Text>
              </Stack>

              {/* Benefits List */}
              <Stack gap={4}>
                <BenefitItem>
                  Mettez en avant vos projets et realisations concrets
                </BenefitItem>
                <BenefitItem>
                  Soyez decouvert par des recruteurs qui valorisent le travail
                  reel
                </BenefitItem>
                <BenefitItem>
                  Acces gratuit a la plateforme pour tous les candidats
                </BenefitItem>
                <BenefitItem>
                  Recevez des opportunites qui correspondent a vos competences
                </BenefitItem>
              </Stack>

              {/* Trust indicators */}
              <Flex gap={8} pt={4} display={{ base: "none", md: "flex" }}>
                <Stack gap={1}>
                  <Text fontWeight="bold" fontSize="2xl" color="gray.900">
                    100%
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Gratuit
                  </Text>
                </Stack>
                <Box w="1px" bg="gray.200" />
                <Stack gap={1}>
                  <Text fontWeight="bold" fontSize="2xl" color="gray.900">
                    2 min
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Inscription
                  </Text>
                </Stack>
                <Box w="1px" bg="gray.200" />
                <Stack gap={1}>
                  <Text fontWeight="bold" fontSize="2xl" color="gray.900">
                    0
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    CV requis
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
                      Rejoignez la liste d'attente
                    </Heading>
                    <Text color="gray.600" fontSize="sm">
                      Soyez parmi les premiers a acceder a Baara
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
                        placeholder="Marie Martin"
                        required
                      />

                      <FormInput
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="marie@email.com"
                        required
                      />

                      <FormInput
                        label="LinkedIn (optionnel)"
                        name="linkedin_url"
                        value={formData.linkedin_url}
                        onChange={handleChange}
                        placeholder="https://linkedin.com/in/votre-profil"
                      />

                      <FormInput
                        label="Portfolio / GitHub (optionnel)"
                        name="portfolio_url"
                        value={formData.portfolio_url}
                        onChange={handleChange}
                        placeholder="https://github.com/votre-profil"
                      />

                      <Button
                        type="submit"
                        size="lg"
                        w="full"
                        bg="#0F766E"
                        color="white"
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
                        Rejoindre gratuitement
                      </Button>

                      <Text fontSize="xs" color="gray.500" textAlign="center">
                        En vous inscrivant, vous acceptez nos conditions
                        d'utilisation
                      </Text>
                    </Stack>
                  </form>
                </Stack>
              </Card.Body>
            </Card.Root>
          </Grid>
        </Container>
      </Box>

      {/* How it works Section */}
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
                Processus simple
              </Text>
              <Heading
                as="h2"
                fontSize={{ base: "2xl", md: "3xl", lg: "4xl" }}
                color="gray.900"
              >
                Comment ça marche ?
              </Heading>
            </Stack>

            <Grid
              templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }}
              gap={{ base: 4, md: 6 }}
            >
              <Box
                p={6}
                bg="white"
                borderRadius="2xl"
                border="1px solid"
                borderColor="gray.100"
                className="card-hover-subtle"
                _hover={{ borderColor: "#CCFBF1" }}
              >
                <StepItem
                  number={1}
                  title="Inscrivez-vous"
                  description="Rejoignez la liste d'attente en quelques secondes"
                />
              </Box>

              <Box
                p={6}
                bg="white"
                borderRadius="2xl"
                border="1px solid"
                borderColor="gray.100"
                className="card-hover-subtle"
                _hover={{ borderColor: "#CCFBF1" }}
              >
                <StepItem
                  number={2}
                  title="Creez votre profil"
                  description="Ajoutez vos meilleurs projets et realisations"
                />
              </Box>

              <Box
                p={6}
                bg="white"
                borderRadius="2xl"
                border="1px solid"
                borderColor="gray.100"
                className="card-hover-subtle"
                _hover={{ borderColor: "#CCFBF1" }}
              >
                <StepItem
                  number={3}
                  title="Soyez decouvert"
                  description="Les recruteurs trouvent votre profil grace a votre travail"
                />
              </Box>

              <Box
                p={6}
                bg="#F0FDFA"
                borderRadius="2xl"
                border="1px solid"
                borderColor="#CCFBF1"
                className="card-hover-subtle"
              >
                <StepItem
                  number={4}
                  title="Decrochez le job"
                  description="Recevez des opportunites qui correspondent a vos competences"
                />
              </Box>
            </Grid>
          </Stack>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box className="gradient-cta" py={{ base: 16, md: 24 }}>
        <Container maxW="container.md" px={{ base: 4, md: 8 }}>
          <Stack gap={8} textAlign="center" alignItems="center">
            <Heading
              as="h2"
              fontSize={{ base: "2xl", md: "3xl", lg: "4xl" }}
              color="white"
            >
              Prêt à montrer ce que vous savez faire ?
            </Heading>
            <Text color="#99F6E4" fontSize="lg" maxW="xl" lineHeight="1.8">
              Rejoignez des centaines de candidats qui ont choisi de laisser
              leur travail parler pour eux.
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
              S'inscrire maintenant
            </Button>
          </Stack>
        </Container>
      </Box>
    </Layout>
  );
}
