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
  RadioGroup,
  Circle,
} from "@chakra-ui/react";
import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [{ title: "Decision Memo - Baara Proof" }];
};

type Recommendation = "hire" | "hold" | "no-hire";
type Confidence = "high" | "medium" | "low";

function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

export default function DecisionMemo() {
  const [recommendation, setRecommendation] = useState<Recommendation>("hire");
  const [confidence, setConfidence] = useState<Confidence>("high");
  const [evidence, setEvidence] = useState(
    "• Strong production Go experience demonstrated in work sample (profiling approach systematic)\n• Incident response shows ownership + communication clarity (postmortem link)\n• System design trade-offs well-reasoned (async design scenario)",
  );
  const [counterSignals, setCounterSignals] = useState(
    "• Limited experience with distributed tracing tools (but learns fast)\n• No direct Kubernetes experience yet",
  );
  const [risks, setRisks] = useState(
    "Risk: Ramp time on infra tooling (k8s, observability stack)\nMitigation: Pair with senior SRE first 30 days, structured onboarding checklist",
  );
  const [plan30Days, setPlan30Days] = useState(
    "Week 1-2: Shadow on-call + service ownership handoff\nWeek 3-4: Ship first monitoring improvement + incident response solo",
  );

  // Detect ungrounded claims (simplified - in reality would use AI)
  const hasUngroundedClaims = evidence.includes("learns fast") && !evidence.includes("evidence:");

  const getRecommendationColor = () => {
    switch (recommendation) {
      case "hire":
        return { bg: "success.subtle", border: "success.muted", text: "success" };
      case "hold":
        return { bg: "warning.subtle", border: "warning.muted", text: "warning" };
      case "no-hire":
        return { bg: "error.subtle", border: "error.muted", text: "error" };
    }
  };

  const colors = getRecommendationColor();

  return (
    <Box py={8} px={8} maxW="900px" mx="auto">
      <Stack gap={6}>
        {/* Header */}
        <Box>
          <Heading as="h1" fontSize="xl" color="text" mb={1} fontWeight="semibold">
            Decision Memo
          </Heading>
          <Text fontSize="sm" color="text.muted">
            Final recommendation with evidence-based reasoning
          </Text>
        </Box>

        {/* Recommendation Card */}
        <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" p={6} shadow="card">
          <Stack gap={5}>
            <Flex gap={8} flexWrap="wrap">
              <Box flex={1} minW="180px">
                <Text fontSize="2xs" fontWeight="medium" color="text.subtle" mb={3} textTransform="uppercase" letterSpacing="wider">
                  Recommendation
                </Text>
                <RadioGroup.Root value={recommendation} onValueChange={(e) => setRecommendation(e.value as Recommendation)}>
                  <Stack gap={2}>
                    <RadioGroup.Item value="hire">
                      <RadioGroup.ItemControl />
                      <RadioGroup.ItemText fontSize="sm" color="text.secondary">Hire</RadioGroup.ItemText>
                    </RadioGroup.Item>
                    <RadioGroup.Item value="hold">
                      <RadioGroup.ItemControl />
                      <RadioGroup.ItemText fontSize="sm" color="text.secondary">Hold</RadioGroup.ItemText>
                    </RadioGroup.Item>
                    <RadioGroup.Item value="no-hire">
                      <RadioGroup.ItemControl />
                      <RadioGroup.ItemText fontSize="sm" color="text.secondary">No hire</RadioGroup.ItemText>
                    </RadioGroup.Item>
                  </Stack>
                </RadioGroup.Root>
              </Box>

              <Box flex={1} minW="180px">
                <Text fontSize="2xs" fontWeight="medium" color="text.subtle" mb={3} textTransform="uppercase" letterSpacing="wider">
                  Confidence
                </Text>
                <RadioGroup.Root value={confidence} onValueChange={(e) => setConfidence(e.value as Confidence)}>
                  <Stack gap={2}>
                    <RadioGroup.Item value="high">
                      <RadioGroup.ItemControl />
                      <RadioGroup.ItemText fontSize="sm" color="text.secondary">High</RadioGroup.ItemText>
                    </RadioGroup.Item>
                    <RadioGroup.Item value="medium">
                      <RadioGroup.ItemControl />
                      <RadioGroup.ItemText fontSize="sm" color="text.secondary">Medium</RadioGroup.ItemText>
                    </RadioGroup.Item>
                    <RadioGroup.Item value="low">
                      <RadioGroup.ItemControl />
                      <RadioGroup.ItemText fontSize="sm" color="text.secondary">Low</RadioGroup.ItemText>
                    </RadioGroup.Item>
                  </Stack>
                </RadioGroup.Root>
              </Box>
            </Flex>

            <Box bg={colors.bg} borderRadius="lg" border="1px solid" borderColor={colors.border} px={4} py={3}>
              <Flex gap={2} alignItems="center">
                <Badge
                  bg={colors.border}
                  color={colors.text}
                  fontSize="2xs"
                  fontWeight="semibold"
                  px={2}
                  py={0.5}
                  borderRadius="md"
                  textTransform="uppercase"
                >
                  {recommendation === "no-hire" ? "No hire" : recommendation}
                </Badge>
                <Text fontSize="sm" color={colors.text} fontWeight="medium">
                  with {confidence} confidence
                </Text>
              </Flex>
            </Box>
          </Stack>
        </Box>

        {/* Section 1: Evidence */}
        <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" overflow="hidden" shadow="card">
          <Flex px={5} py={3} borderBottom="1px solid" borderBottomColor="border.subtle" align="center" justify="space-between" bg="bg.subtle">
            <Heading as="h2" fontSize="sm" color="text" fontWeight="semibold">
              1. Evidence
            </Heading>
            <Button
              variant="ghost"
              size="xs"
              color="text.muted"
              _hover={{ bg: "bg.muted", color: "text.secondary" }}
            >
              <Flex gap={1} alignItems="center">
                <LinkIcon />
                <Text fontSize="xs">Add link</Text>
              </Flex>
            </Button>
          </Flex>
          <Box p={5}>
            <Textarea
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              rows={5}
              fontSize="sm"
              borderColor="border"
              _hover={{ borderColor: "border.emphasis" }}
              _focus={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
              color="text.secondary"
            />
            <Text fontSize="xs" color="text.placeholder" mt={2}>
              Cite work sample, interview notes, or portfolio links.
            </Text>
          </Box>
        </Box>

        {/* Guardrail: Ungrounded Claims */}
        {hasUngroundedClaims && (
          <Box bg="warning.subtle" borderRadius="xl" border="1px solid" borderColor="warning.muted" px={4} py={3}>
            <Flex gap={3} alignItems="start">
              <Circle size="22px" bg="warning.muted" color="warning" flexShrink={0}>
                <AlertIcon />
              </Circle>
              <Flex flex={1} justify="space-between" align="start" gap={4} flexWrap="wrap">
                <Stack gap={0.5}>
                  <Text fontSize="sm" color="warning" fontWeight="semibold">
                    Ungrounded claim detected
                  </Text>
                  <Text fontSize="xs" color="text.muted">
                    "learns fast" needs evidence or should be marked Unverified
                  </Text>
                </Stack>
                <Flex gap={2}>
                  <Button
                    size="xs"
                    variant="outline"
                    borderColor="warning.muted"
                    color="warning"
                    _hover={{ bg: "warning.muted" }}
                  >
                    Add evidence
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    color="warning"
                    _hover={{ bg: "warning.muted" }}
                  >
                    Edit
                  </Button>
                </Flex>
              </Flex>
            </Flex>
          </Box>
        )}

        {/* Section 2: Counter-signals */}
        <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" overflow="hidden" shadow="card">
          <Flex px={5} py={3} borderBottom="1px solid" borderBottomColor="border.subtle" align="center" bg="bg.subtle">
            <Heading as="h2" fontSize="sm" color="text" fontWeight="semibold">
              2. Counter-signals
            </Heading>
          </Flex>
          <Box p={5}>
            <Textarea
              value={counterSignals}
              onChange={(e) => setCounterSignals(e.target.value)}
              rows={3}
              fontSize="sm"
              borderColor="border"
              _hover={{ borderColor: "border.emphasis" }}
              _focus={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
              color="text.secondary"
            />
            <Text fontSize="xs" color="text.placeholder" mt={2}>
              Be honest about gaps. Better to flag now than surprise later.
            </Text>
          </Box>
        </Box>

        {/* Section 3: Risks + Mitigation */}
        <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" overflow="hidden" shadow="card">
          <Flex px={5} py={3} borderBottom="1px solid" borderBottomColor="border.subtle" align="center" bg="bg.subtle">
            <Heading as="h2" fontSize="sm" color="text" fontWeight="semibold">
              3. Risks + Mitigation
            </Heading>
          </Flex>
          <Box p={5}>
            <Textarea
              value={risks}
              onChange={(e) => setRisks(e.target.value)}
              rows={4}
              fontSize="sm"
              borderColor="border"
              _hover={{ borderColor: "border.emphasis" }}
              _focus={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
              color="text.secondary"
            />
            <Text fontSize="xs" color="text.placeholder" mt={2}>
              What could go wrong? How do we de-risk?
            </Text>
          </Box>
        </Box>

        {/* Section 4: 30-day Plan */}
        <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" overflow="hidden" shadow="card">
          <Flex px={5} py={3} borderBottom="1px solid" borderBottomColor="border.subtle" align="center" bg="bg.subtle">
            <Heading as="h2" fontSize="sm" color="text" fontWeight="semibold">
              4. 30-day Plan
            </Heading>
          </Flex>
          <Box p={5}>
            <Textarea
              value={plan30Days}
              onChange={(e) => setPlan30Days(e.target.value)}
              rows={4}
              fontSize="sm"
              borderColor="border"
              _hover={{ borderColor: "border.emphasis" }}
              _focus={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
              color="text.secondary"
            />
            <Text fontSize="xs" color="text.placeholder" mt={2}>
              Clear success criteria for first month.
            </Text>
          </Box>
        </Box>

        {/* CTAs */}
        <Flex gap={3} pt={2}>
          <Button
            size="md"
            bg="primary"
            color="white"
            shadow="button"
            _hover={{ bg: "primary.hover", transform: "translateY(-1px)", shadow: "buttonHover" }}
            _active={{ transform: "translateY(0)" }}
            transition="all 0.15s"
            fontWeight="medium"
            px={5}
            h="42px"
          >
            Approve decision
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
            Request more evidence
          </Button>
          <Button
            size="md"
            variant="ghost"
            color="text.muted"
            fontWeight="normal"
            _hover={{ bg: "bg.subtle", color: "text.secondary" }}
            px={4}
            h="42px"
          >
            Share with committee
          </Button>
        </Flex>
      </Stack>
    </Box>
  );
}
