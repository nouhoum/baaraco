import { Input as ChakraInput, Field, type InputProps } from "@chakra-ui/react";

interface FormInputProps extends InputProps {
  label: string;
  error?: string;
  required?: boolean;
}

export function FormInput({ label, error, required, ...props }: FormInputProps) {
  return (
    <Field.Root invalid={!!error} required={required}>
      <Field.Label fontWeight="medium" mb={1}>
        {label}
      </Field.Label>
      <ChakraInput
        size="lg"
        borderColor={error ? "red.500" : "gray.200"}
        _hover={{ borderColor: error ? "red.500" : "gray.300" }}
        _focus={{
          borderColor: error ? "red.500" : "blue.500",
          boxShadow: error ? "0 0 0 1px red" : "0 0 0 1px blue",
        }}
        {...props}
      />
      {error && <Field.ErrorText>{error}</Field.ErrorText>}
    </Field.Root>
  );
}
