import { Box, Container, Flex } from "@chakra-ui/react";
import { useOutletContext } from "react-router";
import { Navbar } from "./navbar";
import { Footer } from "./footer";
import type { User } from "./lib/api";

interface LangContext {
  lang: string;
  user?: User | null;
}

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const context = useOutletContext<LangContext | null>();
  const user = context?.user ?? null;

  return (
    <Flex direction="column" minH="100vh">
      <Navbar user={user} />
      <Box as="main" flex="1" pt={{ base: "64px", md: "72px" }}>
        {children}
      </Box>
      <Footer />
    </Flex>
  );
}

export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <Container maxW="container.xl" px={{ base: 4, md: 8 }} py={{ base: 8, md: 16 }}>
      {children}
    </Container>
  );
}
