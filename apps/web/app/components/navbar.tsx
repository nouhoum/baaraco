import { Box, Container, Flex, Button } from "@chakra-ui/react";
import { Link } from "react-router";
import { Logo } from "./ui/logo";

export function Navbar() {
  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex={100}
      bg="surface"
      borderBottom="1px solid"
      borderColor="border.subtle"
      backdropFilter="blur(8px)"
      backgroundColor="rgba(255, 255, 255, 0.9)"
    >
      <Container maxW="container.xl" px={{ base: 4, md: 8 }}>
        <Flex h={16} alignItems="center" justifyContent="space-between">
          <Link to="/">
            <Logo size="medium" variant="light" />
          </Link>

          <Flex gap={4} alignItems="center">
            <Link to="/candidates">
              <Button variant="ghost" size="sm" color="text.muted">
                Candidats
              </Button>
            </Link>
            <Link to="/employers">
              <Button variant="ghost" size="sm" color="text.muted">
                Employeurs
              </Button>
            </Link>
            <Link to="/pilot">
              <Button
                size="sm"
                bg="primary"
                color="primary.fg"
                _hover={{ bg: "primary.hover" }}
              >
                Programme Pilote
              </Button>
            </Link>
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
}
