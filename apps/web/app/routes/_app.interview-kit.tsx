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
} from "@chakra-ui/react";
import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [{ title: "Interview Kit - Baara Proof" }];
};

type Phase = "intro" | "technical" | "behavioral" | "close";

export default function InterviewKit() {
  const [currentPhase, setCurrentPhase] = useState<Phase>("intro");
  const [evidenceBullets, setEvidenceBullets] = useState(["", "", ""]);

  const phases = [
    { id: "intro" as Phase, label: "Intro", duration: "5 min" },
    { id: "technical" as Phase, label: "Technical", duration: "30 min" },
    { id: "behavioral" as Phase, label: "Behavioral", duration: "20 min" },
    { id: "close" as Phase, label: "Close", duration: "5 min" },
  ];

  const questions = {
    intro: [
      "Walk me through your recent production experience with Go.",
      "What's a typical on-call incident you've handled?",
    ],
    technical: [
      "Describe a performance issue you've debugged in production.",
      "How do you approach designing a new async processing system?",
      "Tell me about a time you had to make trade-offs in system design.",
    ],
    behavioral: [
      "How do you communicate technical decisions to non-technical stakeholders?",
      "Describe a situation where you had to mentor someone on production practices.",
    ],
    close: [
      "What questions do you have for us?",
      "What are you looking for in your next role?",
    ],
  };

  const rubrics = {
    intro: "Gauge baseline: production experience, on-call ownership",
    technical: "1: Basic | 2: Competent | 3: Strong depth | 4: Expert + teaching",
    behavioral: "Look for: clarity, structure, stakeholder awareness",
    close: "Assess: curiosity, alignment with role",
  };

  const suggestedFollowUps = {
    intro: ["What tools did you use?", "How did you prevent similar issues?"],
    technical: [
      "Can you show me code examples?",
      "What would you do differently?",
      "How did you measure success?",
    ],
    behavioral: ["What was the outcome?", "How did you handle pushback?"],
    close: ["Why this role specifically?", "What's your timeline?"],
  };

  const updateEvidence = (index: number, value: string) => {
    const newBullets = [...evidenceBullets];
    newBullets[index] = value;
    setEvidenceBullets(newBullets);
  };

  return (
    <Box py={8} px={8} maxW="1200px" mx="auto">
      <Stack gap={6}>
        {/* Header */}
        <Flex justify="space-between" align="start" flexWrap="wrap" gap={4}>
          <Box>
            <Heading as="h1" fontSize="xl" color="text" mb={1} fontWeight="semibold">
              Interview Kit + Structured Notes
            </Heading>
            <Text fontSize="sm" color="text.muted">
              3 evidence bullets max. Be concrete.
            </Text>
          </Box>
        </Flex>

        {/* Main 3-column layout */}
        <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" overflow="hidden">
          <Flex direction={{ base: "column", lg: "row" }} minH="500px">
            {/* Left: Interview Plan */}
            <Box
              w={{ base: "full", lg: "220px" }}
              borderRight={{ lg: "1px solid" }}
              borderRightColor="border.subtle"
              bg="bg.subtle"
              p={5}
            >
              <Text fontSize="2xs" fontWeight="medium" color="text.subtle" mb={3} textTransform="uppercase" letterSpacing="wider">
                Interview Plan
              </Text>
              <Stack gap={1.5}>
                {phases.map((phase) => (
                  <Button
                    key={phase.id}
                    variant={currentPhase === phase.id ? "solid" : "ghost"}
                    bg={currentPhase === phase.id ? "primary" : "transparent"}
                    color={currentPhase === phase.id ? "white" : "text.secondary"}
                    _hover={{ bg: currentPhase === phase.id ? "primary.hover" : "bg.muted" }}
                    size="sm"
                    justifyContent="flex-start"
                    onClick={() => setCurrentPhase(phase.id)}
                    fontWeight="medium"
                    borderRadius="lg"
                  >
                    <Flex justify="space-between" w="full">
                      <Text>{phase.label}</Text>
                      <Text fontSize="xs" color={currentPhase === phase.id ? "white" : "text.placeholder"} opacity={currentPhase === phase.id ? 0.8 : 1}>
                        {phase.duration}
                      </Text>
                    </Flex>
                  </Button>
                ))}
              </Stack>
            </Box>

            {/* Middle: Questions + Rubric */}
            <Box flex={1} p={6} overflowY="auto">
              <Stack gap={5}>
                <Box>
                  <Badge
                    bg="primary.subtle"
                    color="primary"
                    fontSize="2xs"
                    fontWeight="semibold"
                    px={2}
                    py={0.5}
                    borderRadius="md"
                    mb={3}
                  >
                    {phases.find((p) => p.id === currentPhase)?.label}
                  </Badge>
                  <Box bg="info.subtle" borderRadius="lg" border="1px solid" borderColor="info.muted" p={4} mb={4}>
                    <Text fontSize="2xs" fontWeight="medium" color="text.subtle" mb={1} textTransform="uppercase" letterSpacing="wider">
                      Rubric for this phase
                    </Text>
                    <Text fontSize="sm" color="info">
                      {rubrics[currentPhase]}
                    </Text>
                  </Box>
                </Box>

                <Box>
                  <Text fontSize="2xs" fontWeight="medium" color="text.subtle" mb={3} textTransform="uppercase" letterSpacing="wider">
                    Questions
                  </Text>
                  <Stack gap={2}>
                    {questions[currentPhase].map((question, i) => (
                      <Box
                        key={i}
                        bg="bg.subtle"
                        borderRadius="lg"
                        p={4}
                        border="1px solid"
                        borderColor="border.subtle"
                        _hover={{ borderColor: "border" }}
                        transition="all 0.15s"
                      >
                        <Text fontSize="sm" color="text.secondary" lineHeight="1.6">
                          {i + 1}. {question}
                        </Text>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </Box>

            {/* Right: Evidence Bullets + Follow-ups */}
            <Box
              w={{ base: "full", lg: "320px" }}
              borderLeft={{ lg: "1px solid" }}
              borderLeftColor="border.subtle"
              p={5}
              bg="bg.subtle"
            >
              <Stack gap={5}>
                <Box>
                  <Text fontSize="2xs" fontWeight="medium" color="text.subtle" mb={3} textTransform="uppercase" letterSpacing="wider">
                    Evidence bullets (max 3)
                  </Text>
                  <Stack gap={2}>
                    {evidenceBullets.map((bullet, i) => (
                      <Textarea
                        key={i}
                        value={bullet}
                        onChange={(e) => updateEvidence(i, e.target.value)}
                        placeholder={`Evidence ${i + 1}...`}
                        rows={2}
                        fontSize="sm"
                        borderColor="border"
                        bg="surface"
                        _hover={{ borderColor: "border.emphasis" }}
                        _focus={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
                        color="text.secondary"
                      />
                    ))}
                  </Stack>
                  <Text fontSize="xs" color="text.placeholder" mt={2}>
                    If a claim can't be backed, mark it Unverified.
                  </Text>
                </Box>

                <Box>
                  <Text fontSize="2xs" fontWeight="medium" color="text.subtle" mb={3} textTransform="uppercase" letterSpacing="wider">
                    Follow-up suggestions
                  </Text>
                  <Stack gap={1.5}>
                    {suggestedFollowUps[currentPhase].map((followUp, i) => (
                      <Box key={i} bg="surface" borderRadius="md" p={3} border="1px solid" borderColor="border.subtle">
                        <Text fontSize="xs" color="text.muted">
                          • {followUp}
                        </Text>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </Box>
          </Flex>
        </Box>

        {/* Validation Warning */}
        <Box bg="warning.subtle" borderRadius="xl" border="1px solid" borderColor="warning.muted" px={4} py={3}>
          <Text fontSize="sm" color="warning" fontWeight="medium">
            Can't submit feedback if scorecard fields missing
          </Text>
        </Box>

        {/* CTAs */}
        <Flex gap={3} pt={2}>
          <Button
            size="md"
            bg="primary"
            color="white"
            _hover={{ bg: "primary.hover", transform: "translateY(-1px)" }}
            _active={{ transform: "translateY(0)" }}
            transition="all 0.15s"
            fontWeight="medium"
            px={5}
            h="42px"
          >
            Submit feedback
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
            Save draft
          </Button>
        </Flex>
      </Stack>
    </Box>
  );
}
