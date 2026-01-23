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
// import { registerRecruiter } from "~/lib/api";
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
      <Box py={{ base: 12, md: 20 }}>
        <Container maxW="container.md" px={{ base: 4, md: 8 }}>
          <Stack gap={8}>
            <Stack gap={4} textAlign="center">
              <Heading as="h1" size="2xl">
                Programme Pilote Recruteurs
              </Heading>
              <Text color="gray.600" fontSize="lg">
                Vous recrutez des talents tech ? Rejoignez notre programme
                pilote et découvrez une nouvelle façon d'identifier les
                meilleurs profils.
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
                      colorPalette="blue"
                      size="lg"
                      loading={isSubmitting}
                      mt={2}
                    >
                      Demander un accès
                    </Button>
                  </Stack>
                </form>
              </Card.Body>
            </Card.Root>

            <Stack gap={4} bg="gray.50" p={6} borderRadius="xl">
              <Heading as="h3" size="md">
                Ce que vous obtenez
              </Heading>
              <Stack as="ul" gap={2} ps={4}>
                <Text as="li" color="gray.700">
                  Accès anticipé à la plateforme Baara
                </Text>
                <Text as="li" color="gray.700">
                  Profils de candidats basés sur leurs réalisations concrètes
                </Text>
                <Text as="li" color="gray.700">
                  Support dédié pendant le programme pilote
                </Text>
                <Text as="li" color="gray.700">
                  Tarification préférentielle au lancement
                </Text>
              </Stack>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Layout>
  );
}
