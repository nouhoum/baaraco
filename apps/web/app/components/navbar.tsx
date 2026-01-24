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
import { Link, useLocation } from "react-router";
import { Logo } from "./ui/logo";

// Simple hamburger icon
function MenuIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {isOpen ? (
        <>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </>
      ) : (
        <>
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </>
      )}
    </svg>
  );
}

const navLinks = [
  { href: "/candidates", label: "Candidats" },
  { href: "/pilot", label: "Recruteurs" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <Box
      as="header"
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex={100}
      backdropFilter={isScrolled ? "blur(16px)" : "blur(8px)"}
      backgroundColor={isScrolled ? "rgba(255, 255, 255, 0.85)" : "rgba(255, 255, 255, 0.1)"}
      boxShadow={isScrolled ? "0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04)" : "none"}
      borderBottom={isScrolled ? "1px solid rgba(0, 0, 0, 0.04)" : "none"}
      transition="all 0.35s cubic-bezier(0.4, 0, 0.2, 1)"
    >
      <Container
        maxW="container.xl"
        px={{ base: 4, md: 8 }}
        py={{ base: 4, md: 6 }}
      >
        <Flex
          h={{ base: 16, md: 18 }}
          alignItems="center"
          justifyContent="space-between"
        >
          {/* Logo */}
          <Link to="/">
            <Box _hover={{ opacity: 0.8 }} transition="opacity 0.2s">
              <Logo size="medium" variant="light" />
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
                  variant="ghost"
                  size="sm"
                  px={4}
                  fontWeight="semibold"
                  color={isActive(link.href) ? "#0F766E" : "gray.800"}
                  bg={
                    isActive(link.href)
                      ? "rgba(255, 255, 255, 0.8)"
                      : "transparent"
                  }
                  _hover={{
                    bg: "rgba(255, 255, 255, 0.8)",
                    color: "#0F766E",
                  }}
                  borderRadius="lg"
                >
                  {link.label}
                </Button>
              </Link>
            ))}

            <Box w="1px" h={6} bg="rgba(0, 0, 0, 0.15)" mx={3} />

            <Link to="/pilot">
              <Button
                size="sm"
                px={5}
                bg="#0F766E"
                color="white"
                fontWeight="semibold"
                borderRadius="lg"
                className="btn-primary"
                boxShadow="0 2px 8px rgba(15, 118, 110, 0.25)"
                _hover={{
                  bg: "#115E59",
                  transform: "translateY(-1px)",
                  boxShadow: "0 6px 16px rgba(15, 118, 110, 0.4)",
                }}
                _active={{
                  transform: "translateY(0)",
                }}
                transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
              >
                Rejoindre le pilote
              </Button>
            </Link>
          </Flex>

          {/* Mobile Menu Button */}
          <IconButton
            display={{ base: "flex", md: "none" }}
            onClick={() => setIsOpen(!isOpen)}
            variant="ghost"
            aria-label="Menu"
            size="sm"
            color="gray.700"
          >
            <MenuIcon isOpen={isOpen} />
          </IconButton>
        </Flex>

        {/* Mobile Navigation */}
        <Collapsible.Root open={isOpen}>
          <Collapsible.Content>
            <Box
              display={{ base: "block", md: "none" }}
              pb={4}
              borderTop="1px solid"
              borderColor="rgba(0, 0, 0, 0.05)"
              mt={2}
              bg="rgba(255, 255, 255, 0.9)"
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
                      variant="ghost"
                      w="full"
                      justifyContent="flex-start"
                      fontWeight="medium"
                      color={isActive(link.href) ? "#0F766E" : "gray.700"}
                      bg={isActive(link.href) ? "#F0FDFA" : "transparent"}
                      _hover={{ bg: "#F0FDFA", color: "#0F766E" }}
                      borderRadius="lg"
                    >
                      {link.label}
                    </Button>
                  </Link>
                ))}

                <Box pt={2}>
                  <Link to="/pilot" onClick={() => setIsOpen(false)}>
                    <Button
                      w="full"
                      bg="#0F766E"
                      color="white"
                      fontWeight="semibold"
                      borderRadius="lg"
                      _hover={{ bg: "#115E59" }}
                    >
                      Rejoindre le pilote
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
