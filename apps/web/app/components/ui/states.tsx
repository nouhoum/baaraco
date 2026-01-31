import type { ReactNode } from "react";
import {
  Box,
  Heading,
  Text,
  Stack,
  Flex,
  Button,
  Spinner,
} from "@chakra-ui/react";
import { AlertCircle } from "lucide-react";

// =============================================================================
// LoadingState
// =============================================================================

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingState({ message, fullScreen }: LoadingStateProps) {
  return (
    <Flex
      minH={fullScreen ? "100vh" : "200px"}
      bg="bg"
      align="center"
      justify="center"
    >
      <Stack align="center" gap={4}>
        <Spinner size="xl" color="primary" />
        {message && (
          <Text fontSize="sm" color="text.secondary">
            {message}
          </Text>
        )}
      </Stack>
    </Flex>
  );
}

// =============================================================================
// ErrorState
// =============================================================================

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({ message, onRetry, retryLabel }: ErrorStateProps) {
  return (
    <Box
      bg="error.subtle"
      borderRadius="lg"
      border="1px solid"
      borderColor="error.muted"
      px={4}
      py={3}
    >
      <Flex align="center" gap={2}>
        <Box color="error" flexShrink={0}>
          <AlertCircle size={16} />
        </Box>
        <Text fontSize="sm" color="error" flex={1}>
          {message}
        </Text>
        {onRetry && (
          <Button
            size="xs"
            variant="outline"
            borderColor="error.muted"
            color="error"
            onClick={onRetry}
            _hover={{ bg: "error.subtle" }}
          >
            {retryLabel || "Retry"}
          </Button>
        )}
      </Flex>
    </Box>
  );
}

// =============================================================================
// EmptyState
// =============================================================================

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <Box
      bg="surface"
      borderRadius="xl"
      border="1px solid"
      borderColor="border"
      p={12}
      textAlign="center"
    >
      <Box
        w="64px"
        h="64px"
        bg="bg.subtle"
        borderRadius="full"
        display="flex"
        alignItems="center"
        justifyContent="center"
        mx="auto"
        mb={4}
        color="text.muted"
      >
        {icon}
      </Box>
      <Heading as="h3" fontSize="md" color="text" mb={2} fontWeight="semibold">
        {title}
      </Heading>
      {subtitle && (
        <Text fontSize="sm" color="text.secondary" mb={action ? 6 : 0}>
          {subtitle}
        </Text>
      )}
      {action && (
        <Button
          bg="primary"
          color="white"
          onClick={action.onClick}
          _hover={{ bg: "primary.hover" }}
        >
          {action.label}
        </Button>
      )}
    </Box>
  );
}
