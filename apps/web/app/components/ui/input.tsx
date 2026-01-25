import { Input as ChakraInput, Field, type InputProps } from "@chakra-ui/react";

interface FormInputProps extends Omit<InputProps, "colorScheme"> {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  colorMode?: "light" | "dark";
}

export function FormInput({
  label,
  error,
  helperText,
  required,
  colorMode = "light",
  ...props
}: FormInputProps) {
  const isDark = colorMode === "dark";

  return (
    <Field.Root invalid={!!error} required={required}>
      <Field.Label
        fontWeight="medium"
        fontSize="sm"
        color={isDark ? "gray.300" : "gray.700"}
        mb={1.5}
      >
        {label}
      </Field.Label>
      <ChakraInput
        size="lg"
        bg={isDark ? "rgba(255, 255, 255, 0.03)" : "white"}
        color={isDark ? "white" : "gray.900"}
        borderColor={error ? "red.400" : isDark ? "rgba(255, 255, 255, 0.1)" : "gray.200"}
        borderRadius="xl"
        _placeholder={{ color: isDark ? "gray.500" : "gray.400" }}
        _hover={{
          borderColor: error ? "red.400" : isDark ? "rgba(255, 255, 255, 0.2)" : "gray.300",
          bg: isDark ? "rgba(255, 255, 255, 0.05)" : "white"
        }}
        _focus={{
          borderColor: error ? "red.400" : "brand.400",
          boxShadow: error
            ? "0 0 0 3px rgba(248, 113, 113, 0.15)"
            : isDark
              ? "0 0 0 1px rgba(20, 184, 166, 0.5)"
              : "0 0 0 3px rgba(20, 184, 166, 0.15)",
          bg: isDark ? "rgba(255, 255, 255, 0.05)" : "white"
        }}
        transition="all 0.2s"
        {...props}
      />
      {helperText && !error && (
        <Field.HelperText fontSize="sm" color={isDark ? "gray.500" : "gray.500"} mt={1.5}>
          {helperText}
        </Field.HelperText>
      )}
      {error && (
        <Field.ErrorText fontSize="sm" color="red.400" mt={1.5}>
          {error}
        </Field.ErrorText>
      )}
    </Field.Root>
  );
}

export function Input(props: InputProps) {
  return (
    <ChakraInput
      size="lg"
      bg="white"
      borderColor="gray.200"
      borderRadius="xl"
      _placeholder={{ color: "gray.400" }}
      _hover={{ borderColor: "gray.300" }}
      _focus={{
        borderColor: "#14B8A6",
        boxShadow: "0 0 0 3px rgba(20, 184, 166, 0.15)",
      }}
      transition="all 0.2s"
      {...props}
    />
  );
}
