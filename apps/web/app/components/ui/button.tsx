import { Button as ChakraButton, type ButtonProps } from "@chakra-ui/react";

export function Button(props: ButtonProps) {
  return <ChakraButton {...props} />;
}

export function PrimaryButton({ children, ...props }: ButtonProps) {
  return (
    <ChakraButton
      bg="brand.700"
      color="white"
      size="lg"
      px={8}
      fontWeight="semibold"
      borderRadius="xl"
      boxShadow="button"
      position="relative"
      overflow="hidden"
      transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={{
        bg: "brand.800",
        transform: "translateY(-2px)",
        boxShadow: "buttonHover",
      }}
      _active={{
        transform: "translateY(0)",
      }}
      _before={{
        content: '""',
        position: "absolute",
        top: 0,
        left: "-100%",
        width: "100%",
        height: "100%",
        background:
          "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent)",
        transition: "left 0.5s ease",
      }}
      _hover-before={{
        left: "100%",
      }}
      css={{
        "&:hover::before": {
          left: "100%",
        },
      }}
      {...props}
    >
      {children}
    </ChakraButton>
  );
}

export function SecondaryButton(props: ButtonProps) {
  return (
    <ChakraButton
      variant="outline"
      size="lg"
      px={8}
      borderColor="gray.200"
      color="gray.700"
      fontWeight="semibold"
      borderRadius="xl"
      transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={{
        borderColor: "brand.700",
        color: "brand.700",
        bg: "brand.50",
      }}
      {...props}
    />
  );
}

export function GhostButton(props: ButtonProps) {
  return (
    <ChakraButton
      variant="ghost"
      color="text.muted"
      _hover={{ bg: "bg.subtle", color: "primary" }}
      {...props}
    />
  );
}

// White button for dark backgrounds (CTA sections)
export function WhiteButton(props: ButtonProps) {
  return (
    <ChakraButton
      size="lg"
      px={8}
      bg="white"
      color="brand.700"
      fontWeight="semibold"
      borderRadius="xl"
      transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={{
        bg: "brand.50",
        transform: "translateY(-2px)",
        boxShadow: "0 8px 20px rgba(0, 0, 0, 0.15)",
      }}
      _active={{
        transform: "translateY(0)",
      }}
      {...props}
    />
  );
}
