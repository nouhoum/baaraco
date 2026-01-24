import { Box, Container, Flex, Text, Stack, Grid } from "@chakra-ui/react";
import { Link } from "react-router";
import { Logo } from "./ui/logo";

const footerLinks = {
  produit: [
    { label: "Pour les candidats", href: "/candidates" },
    { label: "Pour les recruteurs", href: "/pilot" },
    { label: "Programme Pilote", href: "/pilot" },
  ],
  ressources: [
    { label: "Comment ca marche", href: "/#how-it-works" },
    { label: "FAQ", href: "/#faq" },
  ],
  legal: [
    { label: "Mentions legales", href: "/legal" },
    { label: "Confidentialite", href: "/privacy" },
  ],
};

// Social icons as simple SVGs
function TwitterIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export function Footer() {
  return (
    <Box as="footer" bg="gray.900">
      {/* Main Footer */}
      <Container
        maxW="container.xl"
        px={{ base: 4, md: 8 }}
        py={{ base: 12, md: 16 }}
      >
        <Grid
          templateColumns={{ base: "1fr", md: "2fr 1fr 1fr 1fr" }}
          gap={{ base: 10, md: 12 }}
        >
          {/* Brand Column */}
          <Stack gap={5}>
            <Logo size="medium" variant="dark" />
            <Text color="gray.400" fontSize="sm" maxW="300px" lineHeight="1.7">
              Le recrutement basé sur le travail, pas les CV. Connectez les
              talents aux entreprises qui valorisent les competences reelles.
            </Text>
            <Flex gap={3} mt={2}>
              <a
                href="https://twitter.com/baaraco"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="Suivez-nous sur Twitter"
              >
                <TwitterIcon />
              </a>
              <a
                href="https://linkedin.com/company/baaraco"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="Suivez-nous sur LinkedIn"
              >
                <LinkedInIcon />
              </a>
            </Flex>
          </Stack>

          {/* Produit Column */}
          <Stack gap={4}>
            <Text
              fontWeight="semibold"
              fontSize="sm"
              color="white"
              textTransform="uppercase"
              letterSpacing="wider"
            >
              Produit
            </Text>
            <Stack gap={3}>
              {footerLinks.produit.map((link) => (
                <Link key={link.href + link.label} to={link.href}>
                  <Text
                    color="gray.400"
                    fontSize="sm"
                    _hover={{ color: "#14B8A6" }}
                    transition="color 0.2s"
                  >
                    {link.label}
                  </Text>
                </Link>
              ))}
            </Stack>
          </Stack>

          {/* Ressources Column */}
          <Stack gap={4}>
            <Text
              fontWeight="semibold"
              fontSize="sm"
              color="white"
              textTransform="uppercase"
              letterSpacing="wider"
            >
              Ressources
            </Text>
            <Stack gap={3}>
              {footerLinks.ressources.map((link) => (
                <Link key={link.href + link.label} to={link.href}>
                  <Text
                    color="gray.400"
                    fontSize="sm"
                    _hover={{ color: "#14B8A6" }}
                    transition="color 0.2s"
                  >
                    {link.label}
                  </Text>
                </Link>
              ))}
            </Stack>
          </Stack>

          {/* Contact Column */}
          <Stack gap={4}>
            <Text
              fontWeight="semibold"
              fontSize="sm"
              color="white"
              textTransform="uppercase"
              letterSpacing="wider"
            >
              Contact
            </Text>
            <Stack gap={3}>
              <Text color="gray.400" fontSize="sm">
                contact@baara.co
              </Text>
              <Text color="gray.400" fontSize="sm">
                Paris, France
              </Text>
            </Stack>
          </Stack>
        </Grid>
      </Container>

      {/* Bottom Bar */}
      <Box borderTop="1px solid" borderColor="gray.800">
        <Container maxW="container.xl" px={{ base: 4, md: 8 }} py={6}>
          <Flex
            direction={{ base: "column", md: "row" }}
            justifyContent="space-between"
            alignItems="center"
            gap={4}
          >
            <Text color="gray.500" fontSize="sm">
              © {new Date().getFullYear()} Baara. Tous droits reserves.
            </Text>
            <Flex gap={6}>
              {footerLinks.legal.map((link) => (
                <Link key={link.href} to={link.href}>
                  <Text
                    color="gray.500"
                    fontSize="sm"
                    _hover={{ color: "gray.300" }}
                    transition="color 0.2s"
                  >
                    {link.label}
                  </Text>
                </Link>
              ))}
            </Flex>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
}
