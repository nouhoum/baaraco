"use client";

import { Box, Container, Flex, Text, Stack, Grid } from "@chakra-ui/react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Logo } from "./ui/logo";
import { AnimatedSection, fadeInUp } from "./ui/motion";

// Social icons as simple SVGs
function TwitterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      as="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      display="flex"
      alignItems="center"
      justifyContent="center"
      w={9}
      h={9}
      borderRadius="lg"
      bg="rgba(255, 255, 255, 0.03)"
      border="1px solid rgba(255, 255, 255, 0.06)"
      color="gray.500"
      transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={{
        bg: "rgba(20, 184, 166, 0.1)",
        borderColor: "rgba(20, 184, 166, 0.3)",
        color: "brand.400",
        transform: "translateY(-2px)",
      }}
    >
      {children}
    </Box>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link to={href}>
      <Text
        color="gray.500"
        fontSize="sm"
        transition="all 0.2s"
        _hover={{ color: "brand.400" }}
      >
        {children}
      </Text>
    </Link>
  );
}

export function Footer() {
  const { t } = useTranslation("common");
  const { lang } = useParams();
  const currentLang = lang || "fr";

  const footerLinks = {
    produit: [
      { label: t("footer.forCandidates"), href: `/${currentLang}/candidates` },
      { label: t("footer.forRecruiters"), href: `/${currentLang}/pilot` },
      { label: t("footer.pilotProgram"), href: `/${currentLang}/pilot` },
    ],
    ressources: [
      { label: t("footer.howItWorks"), href: `/${currentLang}#how-it-works` },
      { label: t("footer.faq"), href: `/${currentLang}#faq` },
    ],
    legal: [
      { label: t("footer.legalNotice"), href: `/${currentLang}/legal` },
      { label: t("footer.privacy"), href: `/${currentLang}/privacy` },
    ],
  };

  return (
    <Box as="footer" bg="#08080A" position="relative">
      {/* Subtle top gradient line */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        h="1px"
        bg="linear-gradient(90deg, transparent 0%, rgba(20, 184, 166, 0.3) 50%, transparent 100%)"
      />

      {/* Main Footer */}
      <Container
        maxW="container.xl"
        px={{ base: 4, md: 8 }}
        py={{ base: 12, md: 16 }}
      >
        <AnimatedSection variants={fadeInUp} threshold={0.1}>
          <Grid
            templateColumns={{ base: "1fr", md: "2fr 1fr 1fr 1fr" }}
            gap={{ base: 10, md: 12 }}
          >
            {/* Brand Column */}
            <Stack gap={5}>
              <Logo size="medium" variant="dark" />
              <Text
                color="gray.500"
                fontSize="sm"
                maxW="280px"
                lineHeight="1.8"
              >
                {t("footer.tagline")}
              </Text>
              <Flex gap={2} mt={1}>
                <SocialLink
                  href="https://twitter.com/baaraco"
                  label={t("footer.followTwitter")}
                >
                  <TwitterIcon />
                </SocialLink>
                <SocialLink
                  href="https://linkedin.com/company/baaraco"
                  label={t("footer.followLinkedIn")}
                >
                  <LinkedInIcon />
                </SocialLink>
              </Flex>
            </Stack>

            {/* Produit Column */}
            <Stack gap={4}>
              <Text
                fontWeight="500"
                fontSize="xs"
                color="gray.400"
                textTransform="uppercase"
                letterSpacing="0.1em"
              >
                {t("footer.product")}
              </Text>
              <Stack gap={3}>
                {footerLinks.produit.map((link) => (
                  <FooterLink key={link.href + link.label} href={link.href}>
                    {link.label}
                  </FooterLink>
                ))}
              </Stack>
            </Stack>

            {/* Ressources Column */}
            <Stack gap={4}>
              <Text
                fontWeight="500"
                fontSize="xs"
                color="gray.400"
                textTransform="uppercase"
                letterSpacing="0.1em"
              >
                {t("footer.resources")}
              </Text>
              <Stack gap={3}>
                {footerLinks.ressources.map((link) => (
                  <FooterLink key={link.href + link.label} href={link.href}>
                    {link.label}
                  </FooterLink>
                ))}
              </Stack>
            </Stack>

            {/* Contact Column */}
            <Stack gap={4}>
              <Text
                fontWeight="500"
                fontSize="xs"
                color="gray.400"
                textTransform="uppercase"
                letterSpacing="0.1em"
              >
                {t("footer.contact")}
              </Text>
              <Stack gap={3}>
                <Box
                  as="a"
                  href="mailto:contact@baara.co"
                  color="gray.500"
                  fontSize="sm"
                  transition="color 0.2s"
                  _hover={{ color: "brand.400" }}
                >
                  contact@baara.co
                </Box>
                <Text color="gray.600" fontSize="sm">
                  Paris, France
                </Text>
              </Stack>
            </Stack>
          </Grid>
        </AnimatedSection>
      </Container>

      {/* Bottom Bar */}
      <Box borderTop="1px solid rgba(255, 255, 255, 0.06)">
        <Container maxW="container.xl" px={{ base: 4, md: 8 }} py={5}>
          <Flex
            direction={{ base: "column", md: "row" }}
            justifyContent="space-between"
            alignItems="center"
            gap={4}
          >
            <Text color="gray.600" fontSize="xs">
              {t("footer.copyright", { year: new Date().getFullYear() })}
            </Text>
            <Flex gap={6}>
              {footerLinks.legal.map((link) => (
                <Link key={link.href} to={link.href}>
                  <Text
                    color="gray.600"
                    fontSize="xs"
                    _hover={{ color: "gray.400" }}
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
