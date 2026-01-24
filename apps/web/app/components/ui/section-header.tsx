import { Stack, Text, Heading } from "@chakra-ui/react";
import type { StackProps } from "@chakra-ui/react";

interface SectionHeaderProps extends StackProps {
  label?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  titleSize?: "md" | "lg" | "xl";
}

export function SectionHeader({
  label,
  title,
  description,
  align = "center",
  titleSize = "lg",
  ...props
}: SectionHeaderProps) {
  const titleFontSize = {
    md: { base: "xl", md: "2xl" },
    lg: { base: "2xl", md: "3xl", lg: "4xl" },
    xl: { base: "3xl", md: "4xl", lg: "5xl" },
  };

  return (
    <Stack
      gap={4}
      textAlign={align}
      maxW={align === "center" ? "2xl" : undefined}
      mx={align === "center" ? "auto" : undefined}
      {...props}
    >
      {label && (
        <Text
          color="brand.500"
          fontWeight="semibold"
          fontSize="xs"
          textTransform="uppercase"
          letterSpacing="0.1em"
        >
          {label}
        </Text>
      )}
      <Heading
        as="h2"
        fontSize={titleFontSize[titleSize]}
        fontWeight="bold"
        color="gray.900"
      >
        {title}
      </Heading>
      {description && (
        <Text
          color="gray.500"
          fontSize={{ base: "md", md: "lg" }}
          lineHeight="1.8"
          maxW={align === "center" ? "xl" : undefined}
          mx={align === "center" ? "auto" : undefined}
        >
          {description}
        </Text>
      )}
    </Stack>
  );
}
