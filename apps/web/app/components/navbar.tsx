"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Flex,
  Button,
  IconButton,
  Stack,
  Collapsible,
} from "@chakra-ui/react";
import { Link, useLocation, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Menu, X } from "lucide-react";
import { Logo } from "./ui/logo";
import { LanguageSwitcher } from "./ui/language-switcher";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { lang } = useParams();
  const { t } = useTranslation("common");

  const currentLang = lang || "fr";

  const navLinks = [
    { href: `/${currentLang}/candidates`, label: t("nav.candidates") },
    { href: `/${currentLang}/pilot`, label: t("nav.recruiters") },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Check if we're on a page that should always have dark navbar
  const isAlwaysDark = location.pathname.includes("/candidates") || location.pathname.includes("/pilot");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Use dark navbar if scrolled OR if on candidates/pilot pages
  const showDarkNavbar = isScrolled || isAlwaysDark;

  return (
    <Box
      as="header"
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex={100}
      bg={showDarkNavbar ? "rgba(8, 8, 10, 0.85)" : "transparent"}
      backdropFilter={showDarkNavbar ? "blur(12px) saturate(180%)" : "none"}
      borderBottom="1px solid"
      borderColor={showDarkNavbar ? "rgba(255, 255, 255, 0.08)" : "transparent"}
      transition="all 0.35s cubic-bezier(0.4, 0, 0.2, 1)"
    >
      <Container
        maxW="container.xl"
        px={{ base: 4, md: 8 }}
        py={{ base: 3, md: 4 }}
      >
        <Flex
          h={{ base: 14, md: 16 }}
          alignItems="center"
          justifyContent="space-between"
        >
          {/* Logo */}
          <Link to={`/${currentLang}`}>
            <Box _hover={{ opacity: 0.8 }} transition="opacity 0.2s">
              <Logo size="medium" variant="dark" />
            </Box>
          </Link>

          {/* Desktop Navigation */}
          <Flex
            gap={1}
            alignItems="center"
            display={{ base: "none", md: "flex" }}
          >
            {navLinks.map((link) => (
              <Link key={link.href} to={link.href}>
                <Button
                  variant={isActive(link.href) ? "outline" : "ghost"}
                  size="sm"
                  px={4}
                  fontWeight="500"
                  color={isActive(link.href) ? "brand.400" : "gray.300"}
                  borderColor={isActive(link.href) ? "rgba(20, 184, 166, 0.5)" : "transparent"}
                  bg={isActive(link.href) ? "rgba(20, 184, 166, 0.08)" : "transparent"}
                  _hover={{
                    bg: isActive(link.href) ? "rgba(20, 184, 166, 0.12)" : "rgba(255, 255, 255, 0.08)",
                    color: isActive(link.href) ? "brand.400" : "white",
                  }}
                  borderRadius="lg"
                  transition="all 0.2s"
                >
                  {link.label}
                </Button>
              </Link>
            ))}

            <Box w="1px" h={5} bg="rgba(255, 255, 255, 0.1)" mx={3} />

            <Link to={`/${currentLang}/login`}>
              <Button
                variant="ghost"
                size="sm"
                px={4}
                fontWeight="500"
                color="gray.300"
                _hover={{
                  bg: "rgba(255, 255, 255, 0.08)",
                  color: "white",
                }}
                borderRadius="lg"
                transition="all 0.2s"
              >
                {t("nav.login")}
              </Button>
            </Link>

            <Link to={`/${currentLang}/pilot`}>
              <Button
                size="sm"
                px={5}
                bg="brand.500"
                color="gray.950"
                fontWeight="600"
                borderRadius="lg"
                _hover={{
                  bg: "brand.400",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 15px rgba(20, 184, 166, 0.35)",
                }}
                _active={{
                  bg: "brand.600",
                  transform: "translateY(0)",
                }}
                transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
              >
                {t("nav.joinPilot")}
              </Button>
            </Link>

            <Box w="1px" h={5} bg="rgba(255, 255, 255, 0.1)" mx={3} />

            <LanguageSwitcher />
          </Flex>

          {/* Mobile Menu Button */}
          <Flex gap={2} alignItems="center" display={{ base: "flex", md: "none" }}>
            <LanguageSwitcher />
            <IconButton
              onClick={() => setIsOpen(!isOpen)}
              variant="ghost"
              aria-label={t("nav.menu")}
              size="sm"
              color="gray.300"
              _hover={{ color: "white", bg: "rgba(255, 255, 255, 0.1)" }}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </IconButton>
          </Flex>
        </Flex>

        {/* Mobile Navigation */}
        <Collapsible.Root open={isOpen}>
          <Collapsible.Content>
            <Box
              display={{ base: "block", md: "none" }}
              pb={4}
              borderTop="1px solid"
              borderColor="rgba(255, 255, 255, 0.08)"
              mt={2}
              bg="rgba(8, 8, 10, 0.98)"
              mx={-4}
              px={4}
              borderRadius="0 0 xl xl"
            >
              <Stack gap={2} pt={4}>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setIsOpen(false)}
                  >
                    <Button
                      variant={isActive(link.href) ? "outline" : "ghost"}
                      w="full"
                      justifyContent="flex-start"
                      fontWeight="500"
                      color={isActive(link.href) ? "brand.400" : "gray.300"}
                      borderColor={isActive(link.href) ? "rgba(20, 184, 166, 0.5)" : "transparent"}
                      bg={isActive(link.href) ? "rgba(20, 184, 166, 0.08)" : "transparent"}
                      _hover={{
                        bg: isActive(link.href) ? "rgba(20, 184, 166, 0.12)" : "rgba(255, 255, 255, 0.08)",
                        color: isActive(link.href) ? "brand.400" : "white"
                      }}
                      borderRadius="lg"
                    >
                      {link.label}
                    </Button>
                  </Link>
                ))}

                <Link to={`/${currentLang}/login`} onClick={() => setIsOpen(false)}>
                  <Button
                    variant="ghost"
                    w="full"
                    justifyContent="flex-start"
                    fontWeight="500"
                    color="gray.300"
                    _hover={{
                      bg: "rgba(255, 255, 255, 0.08)",
                      color: "white"
                    }}
                    borderRadius="lg"
                  >
                    {t("nav.login")}
                  </Button>
                </Link>

                <Box pt={2}>
                  <Link to={`/${currentLang}/pilot`} onClick={() => setIsOpen(false)}>
                    <Button
                      w="full"
                      bg="brand.500"
                      color="gray.950"
                      fontWeight="600"
                      borderRadius="lg"
                      _hover={{
                        bg: "brand.400",
                        boxShadow: "0 4px 15px rgba(20, 184, 166, 0.35)"
                      }}
                      _active={{ bg: "brand.600" }}
                    >
                      {t("nav.joinPilot")}
                    </Button>
                  </Link>
                </Box>
              </Stack>
            </Box>
          </Collapsible.Content>
        </Collapsible.Root>
      </Container>
    </Box>
  );
}
