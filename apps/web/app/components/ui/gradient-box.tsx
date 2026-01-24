import { Box } from "@chakra-ui/react";
import type { BoxProps } from "@chakra-ui/react";

type GradientVariant = "hero" | "cta" | "icon" | "step";

interface GradientBoxProps extends BoxProps {
  variant: GradientVariant;
}

const gradients: Record<GradientVariant, string> = {
  hero: "linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 50%, #f0fdfa 100%)",
  cta: "linear-gradient(135deg, #0f766e 0%, #115e59 100%)",
  icon: "linear-gradient(135deg, #F0FDFA 0%, #CCFBF1 100%)",
  step: "linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)",
};

export function GradientBox({ variant, children, ...props }: GradientBoxProps) {
  return (
    <Box bg={gradients[variant]} {...props}>
      {children}
    </Box>
  );
}

// Hero section wrapper with proper spacing for fixed navbar
export function HeroSection({ children, ...props }: BoxProps) {
  return (
    <Box
      bg={gradients.hero}
      mt={{ base: "-64px", md: "-72px" }}
      pt={{ base: 32, md: 40 }}
      pb={{ base: 16, md: 24 }}
      position="relative"
      overflow="visible"
      {...props}
    >
      {children}
    </Box>
  );
}

// CTA section with decorative elements
export function CTASection({ children, ...props }: BoxProps) {
  return (
    <Box
      bg={gradients.cta}
      py={{ base: 16, md: 24 }}
      position="relative"
      overflow="hidden"
      {...props}
    >
      {/* Decorative circles */}
      <Box
        position="absolute"
        top="-50%"
        right="-10%"
        w="500px"
        h="500px"
        bg="white"
        opacity={0.05}
        borderRadius="full"
      />
      <Box
        position="absolute"
        bottom="-30%"
        left="-5%"
        w="300px"
        h="300px"
        bg="white"
        opacity={0.05}
        borderRadius="full"
      />
      <Box position="relative">{children}</Box>
    </Box>
  );
}

// Text with gradient
export function GradientText({
  children,
  ...props
}: BoxProps & { children: React.ReactNode }) {
  return (
    <Box
      as="span"
      bg="linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)"
      backgroundClip="text"
      color="transparent"
      {...props}
    >
      {children}
    </Box>
  );
}
