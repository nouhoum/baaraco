import { Input as ChakraInput, Field, type InputProps } from "@chakra-ui/react";

interface FormInputProps extends InputProps {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export function FormInput({ label, error, helperText, required, ...props }: FormInputProps) {
  return (
    <Field.Root invalid={!!error} required={required}>
      <Field.Label fontWeight="medium" fontSize="sm" color="gray.700" mb={1.5}>
        {label}
      </Field.Label>
      <ChakraInput
        size="lg"
        bg="white"
        borderColor={error ? "red.400" : "gray.200"}
        borderRadius="xl"
        _placeholder={{ color: "gray.400" }}
        _hover={{
          borderColor: error ? "red.400" : "gray.300",
          bg: "white"
        }}
        _focus={{
          borderColor: error ? "red.400" : "#14B8A6",
          boxShadow: error
            ? "0 0 0 3px rgba(248, 113, 113, 0.15)"
            : "0 0 0 3px rgba(20, 184, 166, 0.15)",
          bg: "white"
        }}
        transition="all 0.2s"
        {...props}
      />
      {helperText && !error && (
        <Field.HelperText fontSize="sm" color="gray.500" mt={1.5}>
          {helperText}
        </Field.HelperText>
      )}
      {error && (
        <Field.ErrorText fontSize="sm" color="red.500" mt={1.5}>
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
