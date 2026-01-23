import { Button as ChakraButton, type ButtonProps } from "@chakra-ui/react";

export function Button(props: ButtonProps) {
  return <ChakraButton {...props} />;
}

export function PrimaryButton(props: ButtonProps) {
  return (
    <ChakraButton
      bg="primary"
      color="primary.fg"
      _hover={{ bg: "primary.hover" }}
      size="lg"
      fontWeight="semibold"
      {...props}
    />
  );
}

export function SecondaryButton(props: ButtonProps) {
  return (
    <ChakraButton
      variant="outline"
      borderColor="primary"
      color="primary"
      _hover={{ bg: "primary.subtle" }}
      size="lg"
      fontWeight="semibold"
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
