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

export default function ThankYou() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type");

  const isRecruiter = type === "recruiter";

  return (
    <Layout>
      <Box py={{ base: 16, md: 24 }}>
        <Container maxW="container.md" px={{ base: 4, md: 8 }}>
          <Card.Root p={{ base: 8, md: 12 }} shadow="lg" borderRadius="2xl" textAlign="center">
            <Card.Body>
              <Stack gap={6}>
                <Box fontSize="6xl">🎉</Box>

                <Heading as="h1" size="2xl">
                  Merci !
                </Heading>

                <Text fontSize="lg" color="gray.600">
                  {isRecruiter
                    ? "Votre demande d'accès au programme pilote a bien été enregistrée. Notre équipe vous contactera très prochainement."
                    : "Votre inscription sur la liste d'attente a bien été enregistrée. Nous vous contacterons dès qu'une place se libère."}
                </Text>

                <Box bg="gray.50" p={6} borderRadius="xl">
                  <Stack gap={3}>
                    <Text fontWeight="semibold">En attendant...</Text>
                    <Text color="gray.600">
                      {isRecruiter
                        ? "Préparez vos critères de recrutement et les types de profils que vous recherchez. Cela nous aidera à personnaliser votre expérience."
                        : "Rassemblez vos meilleurs projets, contributions open-source, et réalisations. Votre portfolio sera votre meilleur atout sur Baara."}
                    </Text>
                  </Stack>
                </Box>

                <Link to="/">
                  <Button variant="outline" size="lg">
                    Retour à l'accueil
                  </Button>
                </Link>
              </Stack>
            </Card.Body>
          </Card.Root>
        </Container>
      </Box>
    </Layout>
  );
}
