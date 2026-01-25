import { useState } from "react";
import {
  Box,
  Heading,
  Text,
  Stack,
  Flex,
  Button,
  Textarea,
  Badge,
  Progress,
  Tabs,
} from "@chakra-ui/react";
import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [{ title: "Work Sample - Baara Proof" }];
};

type Status = "draft" | "submitted" | "feedback";

export default function WorkSample() {
  const [status, setStatus] = useState<Status>("draft");
  const [debugAnswer, setDebugAnswer] = useState("");
  const [designAnswer, setDesignAnswer] = useState("");

  const progress = ((debugAnswer ? 50 : 0) + (designAnswer ? 50 : 0)) / 2;

  return (
    <Box py={8} px={8} maxW="1000px" mx="auto">
      <Stack gap={6}>
        {/* Header with Progress */}
        <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" p={6}>
          <Stack gap={5}>
            <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
              <Box>
                <Heading as="h1" fontSize="xl" color="text" mb={1} fontWeight="semibold">
                  Work Sample
                </Heading>
                <Text fontSize="sm" color="text.muted">
                  Total target time: ≤ 60 min. Chunkable.
                </Text>
              </Box>

              <Badge
                bg={status === "submitted" ? "success.subtle" : status === "feedback" ? "info.subtle" : "bg.muted"}
                color={status === "submitted" ? "success" : status === "feedback" ? "info" : "text.muted"}
                fontSize="xs"
                fontWeight="semibold"
                px={3}
                py={1}
                borderRadius="full"
              >
                {status === "draft" && "Draft saved"}
                {status === "submitted" && "Submitted"}
                {status === "feedback" && "Feedback available"}
              </Badge>
            </Flex>

            {/* Progress Bar */}
            <Stack gap={2}>
              <Flex justify="space-between" align="center">
                <Text fontSize="xs" color="text.muted" fontWeight="medium">
                  Progress
                </Text>
                <Text fontSize="xs" color="text.muted" fontWeight="medium">
                  {Math.round(progress)}%
                </Text>
              </Flex>
              <Progress.Root value={progress}>
                <Progress.Track bg="bg.muted" borderRadius="full">
                  <Progress.Range bg="primary" borderRadius="full" />
                </Progress.Track>
              </Progress.Root>
            </Stack>

            <Button
              variant="outline"
              size="sm"
              w="fit-content"
              borderColor="border"
              color="text.secondary"
              fontWeight="normal"
              _hover={{ bg: "bg.subtle", borderColor: "border.emphasis" }}
            >
              Save & continue later
            </Button>
          </Stack>
        </Box>

        {/* Trust messaging */}
        <Box bg="info.subtle" borderRadius="xl" border="1px solid" borderColor="info.muted" px={4} py={3}>
          <Stack gap={1}>
            <Text fontSize="sm" color="info" fontWeight="medium">
              We won't ask for proprietary code. This is a neutral scenario.
            </Text>
            <Text fontSize="xs" color="text.muted">
              <strong>Remember:</strong> Confidence measures evidence, not your worth.
            </Text>
          </Stack>
        </Box>

        {/* Tabs */}
        <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" overflow="hidden">
          <Tabs.Root defaultValue="debug">
            <Tabs.List bg="bg.subtle" px={5} borderBottom="1px solid" borderBottomColor="border.subtle">
              <Tabs.Trigger value="debug" px={4} py={3} fontSize="sm" fontWeight="medium" color="text.muted" _selected={{ color: "text", borderBottomColor: "primary" }}>
                Debug/Perf
              </Tabs.Trigger>
              <Tabs.Trigger value="design" px={4} py={3} fontSize="sm" fontWeight="medium" color="text.muted" _selected={{ color: "text", borderBottomColor: "primary" }}>
                Async design
              </Tabs.Trigger>
              <Tabs.Indicator bg="primary" />
            </Tabs.List>

            <Box p={6}>
              {/* Debug/Perf Tab */}
              <Tabs.Content value="debug">
                <Stack gap={5}>
                  <Box>
                    <Heading as="h3" fontSize="md" color="text" mb={3} fontWeight="semibold">
                      Scenario: Performance Investigation
                    </Heading>
                    <Text color="text.secondary" fontSize="sm" lineHeight="1.7" mb={4}>
                      A Go service handling user requests is experiencing P95 latency spikes above 500ms. The P50 is
                      stable at 50ms. You have access to profiling data and logs. Walk us through your investigation
                      approach.
                    </Text>

                    <Box bg="bg.subtle" borderRadius="lg" p={4} mb={4} border="1px solid" borderColor="border.subtle">
                      <Text fontSize="2xs" fontWeight="medium" color="text.subtle" mb={2} textTransform="uppercase" letterSpacing="wider">
                        What we're evaluating (rubric)
                      </Text>
                      <Stack gap={1.5} fontSize="xs" color="text.muted">
                        <Text>• Systematic debugging approach (not random guessing)</Text>
                        <Text>• Understanding of Go performance patterns</Text>
                        <Text>• Tool usage (profiling, tracing)</Text>
                        <Text>• Communication of findings</Text>
                      </Stack>
                    </Box>
                  </Box>

                  <Box>
                    <Text fontSize="2xs" fontWeight="medium" color="text.subtle" mb={2} textTransform="uppercase" letterSpacing="wider">
                      Your answer
                    </Text>
                    <Textarea
                      value={debugAnswer}
                      onChange={(e) => setDebugAnswer(e.target.value)}
                      placeholder="Describe your investigation approach step by step..."
                      rows={10}
                      fontSize="sm"
                      borderColor="border"
                      _hover={{ borderColor: "border.emphasis" }}
                      _focus={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
                      color="text.secondary"
                    />
                    <Text fontSize="xs" color="text.placeholder" mt={2}>
                      Estimated time: 30 minutes
                    </Text>
                  </Box>
                </Stack>
              </Tabs.Content>

              {/* Async Design Tab */}
              <Tabs.Content value="design">
                <Stack gap={5}>
                  <Box>
                    <Heading as="h3" fontSize="md" color="text" mb={3} fontWeight="semibold">
                      Scenario: Async Event Processing
                    </Heading>
                    <Text color="text.secondary" fontSize="sm" lineHeight="1.7" mb={4}>
                      Design a system to process user-generated events asynchronously. Events arrive at 10k/sec,
                      processing takes 100-500ms each, order doesn't matter, but you need at-least-once delivery and
                      monitoring.
                    </Text>

                    <Box bg="bg.subtle" borderRadius="lg" p={4} mb={4} border="1px solid" borderColor="border.subtle">
                      <Text fontSize="2xs" fontWeight="medium" color="text.subtle" mb={2} textTransform="uppercase" letterSpacing="wider">
                        What we're evaluating (rubric)
                      </Text>
                      <Stack gap={1.5} fontSize="xs" color="text.muted">
                        <Text>• System design trade-offs</Text>
                        <Text>• Scalability considerations</Text>
                        <Text>• Error handling strategy</Text>
                        <Text>• Monitoring & observability</Text>
                      </Stack>
                    </Box>
                  </Box>

                  <Box>
                    <Text fontSize="2xs" fontWeight="medium" color="text.subtle" mb={2} textTransform="uppercase" letterSpacing="wider">
                      Your answer
                    </Text>
                    <Textarea
                      value={designAnswer}
                      onChange={(e) => setDesignAnswer(e.target.value)}
                      placeholder="Describe your system design, architecture, and key trade-offs..."
                      rows={10}
                      fontSize="sm"
                      borderColor="border"
                      _hover={{ borderColor: "border.emphasis" }}
                      _focus={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
                      color="text.secondary"
                    />
                    <Text fontSize="xs" color="text.placeholder" mt={2}>
                      Estimated time: 30 minutes
                    </Text>
                  </Box>
                </Stack>
              </Tabs.Content>
            </Box>
          </Tabs.Root>
        </Box>

        {/* CTAs */}
        <Flex gap={3} pt={2}>
          <Button
            size="md"
            bg="primary"
            color="white"
            _hover={{ bg: "primary.hover", transform: "translateY(-1px)" }}
            _active={{ transform: "translateY(0)" }}
            _disabled={{ opacity: 0.5, cursor: "not-allowed", transform: "none" }}
            transition="all 0.15s"
            disabled={!debugAnswer || !designAnswer}
            onClick={() => setStatus("submitted")}
            fontWeight="medium"
            px={5}
            h="42px"
          >
            Submit work sample
          </Button>
          <Button
            size="md"
            variant="outline"
            borderColor="border"
            color="text.secondary"
            fontWeight="normal"
            _hover={{ bg: "bg.subtle", borderColor: "border.emphasis" }}
            px={4}
            h="42px"
          >
            Request alternative format
          </Button>
        </Flex>
      </Stack>
    </Box>
  );
}
