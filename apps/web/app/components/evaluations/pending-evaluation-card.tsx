import { Box, Heading, Text, Spinner } from "@chakra-ui/react";

interface PendingEvaluationCardProps {
  t: (key: string, opts?: any) => string;
}

export function PendingEvaluationCard({ t }: PendingEvaluationCardProps) {
  return (
    <Box
      bg="surface"
      borderRadius="2xl"
      border="1px solid"
      borderColor="border"
      shadow="card"
      overflow="hidden"
    >
      <Box
        bg="linear-gradient(135deg, var(--chakra-colors-ai-bg) 0%, var(--chakra-colors-primary-subtle) 100%)"
        py={8}
        px={6}
        textAlign="center"
      >
        <Spinner size="xl" color="primary" mb={4} />
        <Heading as="h3" fontSize="lg" fontWeight="semibold" color="text" mb={2}>
          {t("proofProfile.generating")}
        </Heading>
        <Text
          fontSize="sm"
          color="text.secondary"
          maxW="360px"
          mx="auto"
          lineHeight="relaxed"
        >
          {t("proofProfile.pendingEvaluation.analysisMessage")}
        </Text>
      </Box>
    </Box>
  );
}
