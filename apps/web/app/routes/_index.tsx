import type { MetaFunction } from "react-router";
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  Stack,
  Flex,
  Grid,
  Card,
} from "@chakra-ui/react";
import { Link } from "react-router";
import { Layout } from "~/components/layout";

export const meta: MetaFunction = () => {
  return [
    { title: "Baara - Le recrutement basé sur le travail" },
    {
      name: "description",
      content:
        "Baara révolutionne le recrutement tech. Montrez votre travail, pas juste votre CV.",
    },
  ];
};

export default function Index() {
  return (
    <Layout>
      {/* Hero Section */}
      <Box bg="gray.50" py={{ base: 16, md: 24 }}>
        <Container maxW="container.xl" px={{ base: 4, md: 8 }}>
          <Stack gap={8} maxW="3xl" mx="auto" textAlign="center">
            <Heading
              as="h1"
              size={{ base: "3xl", md: "4xl" }}
              fontWeight="bold"
              lineHeight="1.2"
            >
              Le recrutement basé sur le{" "}
              <Text as="span" color="blue.600">
                travail
              </Text>
              , pas les CV
            </Heading>

            <Text fontSize={{ base: "lg", md: "xl" }} color="gray.600">
              Baara connecte les talents tech aux entreprises qui valorisent les
              compétences réelles. Montrez votre travail, obtenez les
              opportunités que vous méritez.
            </Text>

            <Flex
              gap={4}
              justify="center"
              direction={{ base: "column", sm: "row" }}
            >
              <Link to="/pilot">
                <Button
                  colorPalette="blue"
                  size="lg"
                  w={{ base: "full", sm: "auto" }}
                >
                  Rejoindre le programme pilote
                </Button>
              </Link>
              <Link to="/candidates">
                <Button
                  variant="outline"
                  size="lg"
                  w={{ base: "full", sm: "auto" }}
                >
                  Je suis candidat
                </Button>
              </Link>
            </Flex>
          </Stack>
        </Container>
      </Box>

      {/* Features Section */}
      <Box py={{ base: 16, md: 24 }}>
        <Container maxW="container.xl" px={{ base: 4, md: 8 }}>
          <Stack gap={12}>
            <Stack gap={4} textAlign="center" maxW="2xl" mx="auto">
              <Heading as="h2" size="2xl">
                Pourquoi Baara ?
              </Heading>
              <Text color="gray.600" fontSize="lg">
                Fini les CV génériques et les entretiens interminables. Place au
                travail qui parle de lui-même.
              </Text>
            </Stack>

            <Grid
              templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
              gap={8}
            >
              <FeatureCard
                title="Portfolio de travail"
                description="Présentez vos projets, contributions open-source, et réalisations concrètes. Votre travail parle pour vous."
              />
              <FeatureCard
                title="Matching intelligent"
                description="Notre algorithme connecte votre expertise aux opportunités pertinentes. Pas de spam, que des missions qui correspondent."
              />
              <FeatureCard
                title="Process simplifié"
                description="Moins d'étapes, plus de transparence. Les recruteurs voient directement ce que vous savez faire."
              />
            </Grid>
          </Stack>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box bg="blue.600" py={{ base: 16, md: 20 }}>
        <Container maxW="container.xl" px={{ base: 4, md: 8 }}>
          <Stack gap={6} textAlign="center" maxW="2xl" mx="auto">
            <Heading as="h2" size="xl" color="white">
              Prêt à changer la donne ?
            </Heading>
            <Text color="blue.100" fontSize="lg">
              Rejoignez le programme pilote et soyez parmi les premiers à
              expérimenter le recrutement nouvelle génération.
            </Text>
            <Flex justify="center">
              <Link to="/pilot">
                <Button
                  bg="white"
                  color="blue.600"
                  size="lg"
                  _hover={{ bg: "gray.100" }}
                >
                  Demander un accès
                </Button>
              </Link>
            </Flex>
          </Stack>
        </Container>
      </Box>
    </Layout>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card.Root p={6} bg="white" borderRadius="xl" shadow="sm">
      <Card.Body>
        <Stack gap={3}>
          <Heading as="h3" size="md">
            {title}
          </Heading>
          <Text color="gray.600">{description}</Text>
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}
