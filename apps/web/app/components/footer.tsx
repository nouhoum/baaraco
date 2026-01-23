import { Box, Container, Flex, Text, Stack } from "@chakra-ui/react";
import { Link } from "react-router";
import { Logo } from "./ui/logo";

export function Footer() {
  return (
    <Box as="footer" bg="bg.subtle" borderTop="1px solid" borderColor="border.subtle">
      <Container maxW="container.xl" px={{ base: 4, md: 8 }} py={8}>
        <Flex
          direction={{ base: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ base: "center", md: "flex-start" }}
          gap={6}
        >
          <Stack gap={3} alignItems={{ base: "center", md: "flex-start" }}>
            <Logo size="small" variant="light" />
            <Text color="text.muted" fontSize="sm" maxW="280px" textAlign={{ base: "center", md: "left" }}>
              Le recrutement base sur le travail, pas les CV.
            </Text>
          </Stack>

          <Flex gap={8}>
            <Stack gap={2}>
              <Text fontWeight="semibold" fontSize="sm" color="text">
                Produit
              </Text>
              <Link to="/pilot">
                <Text
                  color="text.muted"
                  fontSize="sm"
                  _hover={{ color: "primary" }}
                >
                  Programme Pilote
                </Text>
              </Link>
              <Link to="/candidates">
                <Text
                  color="text.muted"
                  fontSize="sm"
                  _hover={{ color: "primary" }}
                >
                  Pour les candidats
                </Text>
              </Link>
              <Link to="/employers">
                <Text
                  color="text.muted"
                  fontSize="sm"
                  _hover={{ color: "primary" }}
                >
                  Pour les employeurs
                </Text>
              </Link>
            </Stack>

            <Stack gap={2}>
              <Text fontWeight="semibold" fontSize="sm" color="text">
                Contact
              </Text>
              <Text color="text.muted" fontSize="sm">
                contact@baara.co
              </Text>
            </Stack>
          </Flex>
        </Flex>

        <Text textAlign="center" color="text.subtle" fontSize="sm" mt={8}>
          © {new Date().getFullYear()} Baara. Tous droits reserves.
        </Text>
      </Container>
    </Box>
  );
}
