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
      <Box py={{ base: 12, md: 20 }}>
        <Container maxW="container.md" px={{ base: 4, md: 8 }}>
          <Stack gap={8}>
            <Stack gap={4} textAlign="center">
              <Heading as="h1" size="2xl">
                Montrez votre travail
              </Heading>
              <Text color="gray.600" fontSize="lg">
                Marre des CV qui ne reflètent pas vos compétences ? Rejoignez
                Baara et laissez votre travail parler pour vous.
              </Text>
            </Stack>

            <Card.Root p={{ base: 6, md: 8 }} shadow="md" borderRadius="xl">
              <Card.Body>
                <form onSubmit={handleSubmit}>
                  <Stack gap={5}>
                    {error && (
                      <Alert.Root status="error" borderRadius="md">
                        <Alert.Indicator />
                        <Alert.Title>{error}</Alert.Title>
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
                      colorPalette="blue"
                      size="lg"
                      loading={isSubmitting}
                      mt={2}
                    >
                      Rejoindre la liste d'attente
                    </Button>
                  </Stack>
                </form>
              </Card.Body>
            </Card.Root>

            <Stack gap={4} bg="blue.50" p={6} borderRadius="xl">
              <Heading as="h3" size="md" color="blue.800">
                Comment ça marche ?
              </Heading>
              <Stack as="ol" gap={3} ps={4}>
                <Text as="li" color="blue.700">
                  <strong>Inscrivez-vous</strong> sur la liste d'attente
                </Text>
                <Text as="li" color="blue.700">
                  <strong>Créez votre portfolio</strong> avec vos meilleurs
                  projets
                </Text>
                <Text as="li" color="blue.700">
                  <strong>Soyez découvert</strong> par des recruteurs qui
                  valorisent le travail réel
                </Text>
                <Text as="li" color="blue.700">
                  <strong>Décrochez</strong> des opportunités qui vous
                  correspondent
                </Text>
              </Stack>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Layout>
  );
}
