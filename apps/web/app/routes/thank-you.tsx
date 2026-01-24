import type { MetaFunction } from "react-router";
import { useSearchParams, Link } from "react-router";
import {
  Box,
  Container,
  Heading,
  Text,
  Stack,
  Button,
  Card,
  Circle,
  Flex,
  Grid,
} from "@chakra-ui/react";
import { Layout } from "~/components/layout";

export const meta: MetaFunction = () => {
  return [
    { title: "Merci ! - Baara" },
    {
      name: "description",
      content: "Votre inscription a bien été enregistrée.",
    },
  ];
};

// Success checkmark icon
function SuccessIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// Mail icon
function MailIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

// Folder icon
function FolderIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

// Clock icon
function ClockIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// Next step card component
function NextStepCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Box
      p={5}
      bg="white"
      borderRadius="2xl"
      border="1px solid"
      borderColor="gray.100"
      className="card-hover-subtle"
      _hover={{
        borderColor: "#CCFBF1",
      }}
    >
      <Flex gap={4} alignItems="flex-start">
        <Circle size="48px" bg="linear-gradient(135deg, #F0FDFA 0%, #CCFBF1 100%)" color="#0F766E" flexShrink={0}>
          {icon}
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
    </Box>
  );
}

export default function ThankYou() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type");

  const isRecruiter = type === "recruiter";

  return (
    <Layout>
      <Box
        className="gradient-hero"
        mt={{ base: "-64px", md: "-72px" }}
        pt={{ base: 32, md: 40 }}
        pb={{ base: 16, md: 24 }}
        minH="70vh"
      >
        <Container maxW="container.lg" px={{ base: 4, md: 8 }}>
          <Stack gap={10} alignItems="center">
            {/* Success Card */}
            <Card.Root
              bg="white"
              shadow="xl"
              borderRadius="2xl"
              border="1px solid"
              borderColor="gray.100"
              overflow="hidden"
              maxW="600px"
              w="full"
            >
              <Box
                h="4px"
                bg="linear-gradient(90deg, #0F766E 0%, #14B8A6 100%)"
              />
              <Card.Body p={{ base: 8, md: 12 }}>
                <Stack gap={8} alignItems="center" textAlign="center">
                  {/* Success Animation */}
                  <Box position="relative">
                    <Circle
                      size="100px"
                      bg="linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)"
                      color="white"
                      boxShadow="0 12px 40px rgba(15, 118, 110, 0.35)"
                    >
                      <SuccessIcon />
                    </Circle>
                    <Box
                      position="absolute"
                      inset="-8px"
                      borderRadius="full"
                      border="2px solid"
                      borderColor="#CCFBF1"
                      className="animate-ping"
                    />
                  </Box>

                  {/* Thank you message */}
                  <Stack gap={4}>
                    <Heading
                      as="h1"
                      fontSize={{ base: "3xl", md: "4xl" }}
                      fontWeight="bold"
                      color="gray.900"
                    >
                      Merci pour votre inscription !
                    </Heading>

                    <Text fontSize="lg" color="gray.600" lineHeight="1.7">
                      {isRecruiter
                        ? "Votre demande d'acces au programme pilote a bien ete enregistree. Notre equipe vous contactera sous 24h pour finaliser votre inscription."
                        : "Vous etes maintenant sur notre liste d'attente. Nous vous contacterons des qu'une place se libere."}
                    </Text>
                  </Stack>

                  {/* Email confirmation */}
                  <Box
                    bg="#F0FDFA"
                    px={6}
                    py={4}
                    borderRadius="xl"
                    border="1px solid"
                    borderColor="#CCFBF1"
                    w="full"
                  >
                    <Flex gap={3} alignItems="center" justifyContent="center">
                      <Circle size="32px" bg="#CCFBF1" color="#0F766E">
                        <MailIcon />
                      </Circle>
                      <Text color="#0F766E" fontWeight="medium" fontSize="sm">
                        Un email de confirmation vous a ete envoye
                      </Text>
                    </Flex>
                  </Box>

                  {/* CTA Buttons */}
                  <Flex gap={4} direction={{ base: "column", sm: "row" }} w="full">
                    <Link to="/" style={{ flex: 1 }}>
                      <Button
                        variant="outline"
                        size="lg"
                        w="full"
                        borderColor="gray.200"
                        color="gray.700"
                        borderRadius="xl"
                        _hover={{
                          borderColor: "#0F766E",
                          color: "#0F766E",
                          bg: "#F0FDFA",
                        }}
                        transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                      >
                        Retour a l'accueil
                      </Button>
                    </Link>
                    <Link to={isRecruiter ? "/candidates" : "/pilot"} style={{ flex: 1 }}>
                      <Button
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
                      >
                        {isRecruiter ? "Decouvrir les candidats" : "En savoir plus"}
                      </Button>
                    </Link>
                  </Flex>
                </Stack>
              </Card.Body>
            </Card.Root>

            {/* Next Steps Section */}
            <Stack gap={6} w="full" maxW="800px">
              <Heading
                as="h2"
                fontSize={{ base: "xl", md: "2xl" }}
                fontWeight="bold"
                color="gray.900"
                textAlign="center"
              >
                En attendant, voici ce que vous pouvez faire
              </Heading>

              <Grid
                templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
                gap={4}
              >
                {isRecruiter ? (
                  <>
                    <NextStepCard
                      icon={<FolderIcon />}
                      title="Preparez vos criteres"
                      description="Definissez les types de profils et competences que vous recherchez pour vos recrutements."
                    />
                    <NextStepCard
                      icon={<ClockIcon />}
                      title="Attendez notre appel"
                      description="Notre equipe vous contactera sous 24h pour un onboarding personnalise."
                    />
                  </>
                ) : (
                  <>
                    <NextStepCard
                      icon={<FolderIcon />}
                      title="Rassemblez vos projets"
                      description="Preparez vos meilleurs projets, contributions open-source et realisations."
                    />
                    <NextStepCard
                      icon={<ClockIcon />}
                      title="Restez a l'ecoute"
                      description="Nous vous contacterons des qu'une place se libere sur la plateforme."
                    />
                  </>
                )}
              </Grid>
            </Stack>

            {/* Social proof / Trust indicator */}
            <Box
              bg="white"
              px={8}
              py={6}
              borderRadius="2xl"
              border="1px solid"
              borderColor="gray.100"
              textAlign="center"
              maxW="500px"
              w="full"
            >
              <Stack gap={3}>
                <Flex gap={2} justifyContent="center" alignItems="center">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Box
                      key={i}
                      w={8}
                      h={8}
                      borderRadius="full"
                      bg={`#${['0F766E', '14B8A6', '2DD4BF', '5EEAD4', '99F6E4'][i - 1]}`}
                      ml={i > 1 ? -2 : 0}
                      border="2px solid white"
                    />
                  ))}
                  <Text fontWeight="semibold" color="gray.900" ml={2}>
                    +500
                  </Text>
                </Flex>
                <Text color="gray.600" fontSize="sm">
                  {isRecruiter
                    ? "entreprises ont deja rejoint le programme pilote"
                    : "candidats sont deja inscrits sur la liste d'attente"}
                </Text>
              </Stack>
            </Box>
          </Stack>
        </Container>
      </Box>

    </Layout>
  );
}
