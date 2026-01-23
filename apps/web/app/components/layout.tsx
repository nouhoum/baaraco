import { Box, Container, Flex } from "@chakra-ui/react";
import { Navbar } from "./navbar";
import { Footer } from "./footer";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <Flex direction="column" minH="100vh">
      <Navbar />
      <Box as="main" flex="1">
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
