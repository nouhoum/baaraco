import { Box, Stack, Text, Circle } from "@chakra-ui/react";
import type { BoxProps } from "@chakra-ui/react";

interface FeatureCardProps extends BoxProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  variant?: "default" | "subtle";
}

export function FeatureCard({
  icon,
  title,
  description,
  variant = "default",
  ...props
}: FeatureCardProps) {
  return (
    <Box
      p={{ base: 5, md: 6 }}
      bg="white"
      borderRadius="2xl"
      border="1px solid"
      borderColor="gray.100"
      transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={{
        transform:
          variant === "default" ? "translateY(-6px)" : "translateY(-2px)",
        boxShadow: variant === "default" ? "cardHover" : "cardHoverSubtle",
        borderColor: "brand.100",
      }}
      {...props}
    >
      <Stack gap={4}>
        <Circle
          size="48px"
          bg="linear-gradient(135deg, var(--chakra-colors-brand-50) 0%, var(--chakra-colors-brand-100) 100%)"
          color="brand.700"
        >
          {icon}
        </Circle>
        <Text fontWeight="semibold" color="gray.900" fontSize="md">
          {title}
        </Text>
        <Text color="gray.500" fontSize="sm" lineHeight="1.7">
          {description}
        </Text>
      </Stack>
    </Box>
  );
}

interface StepCardProps extends BoxProps {
  number: number;
  title: string;
  description: string;
  highlighted?: boolean;
}

export function StepCard({
  number,
  title,
  description,
  highlighted = false,
  ...props
}: StepCardProps) {
  return (
    <Box
      p={6}
      bg={highlighted ? "brand.50" : "white"}
      borderRadius="2xl"
      border="1px solid"
      borderColor={highlighted ? "brand.100" : "gray.100"}
      transition="all 0.2s ease"
      _hover={{
        transform: "translateY(-2px)",
        boxShadow: "cardHoverSubtle",
        borderColor: "brand.100",
      }}
      {...props}
    >
      <Stack direction="row" gap={4} align="flex-start">
        <Circle
          size="36px"
          bg="linear-gradient(135deg, var(--chakra-colors-brand-700) 0%, var(--chakra-colors-brand-500) 100%)"
          color="white"
          fontWeight="bold"
          fontSize="sm"
          flexShrink={0}
          boxShadow="0 4px 12px rgba(15, 118, 110, 0.2)"
        >
          {number}
        </Circle>
        <Box>
          <Text fontWeight="semibold" color="gray.900" mb={1}>
            {title}
          </Text>
          <Text color="gray.500" fontSize="sm" lineHeight="1.7">
            {description}
          </Text>
        </Box>
      </Stack>
    </Box>
  );
}

// Centered step card for "how it works" sections
export function StepCardCentered({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <Stack gap={5} textAlign="center">
      <Box mx="auto">
        <Circle
          size="14"
          bg="linear-gradient(135deg, var(--chakra-colors-brand-700) 0%, var(--chakra-colors-brand-500) 100%)"
          color="white"
          fontSize="xl"
          fontWeight="bold"
          boxShadow="0 8px 24px rgba(15, 118, 110, 0.25)"
        >
          {number}
        </Circle>
      </Box>
      <Stack gap={2}>
        <Text as="h3" fontSize="lg" fontWeight="semibold" color="gray.900">
          {title}
        </Text>
        <Text color="gray.500" lineHeight="1.7" fontSize="sm">
          {description}
        </Text>
      </Stack>
    </Stack>
  );
}
