import { useState } from "react";
import {
  Box,
  Heading,
  Text,
  Stack,
  Flex,
  Grid,
  Badge,
  Textarea,
  Button,
  Circle,
  Input,
} from "@chakra-ui/react";
import type { MetaFunction } from "react-router";
import { CheckCircle, AlertCircle, HelpCircle, Sparkles, Calendar, Target, Shield, BookOpen, Pen } from "lucide-react";

export const meta: MetaFunction = () => {
  return [{ title: "Outcome Brief - Baara Proof" }];
};

type AIMessageType = "ready" | "ambiguity" | "missing";

interface AIMessage {
  type: AIMessageType;
  text: string;
  actions: { label: string; variant?: string }[];
}

export default function OutcomeBrief() {
  const [jobName, setJobName] = useState("Senior Backend Engineer - Go");
  const [days30, setDays30] = useState("");
  const [days90, setDays90] = useState("");
  const [days180, setDays180] = useState("");
  const [constraints, setConstraints] = useState("");
  const [nonNegotiables, setNonNegotiables] = useState("");
  const [learnable, setLearnable] = useState("");

  const [aiMessages] = useState<AIMessage[]>([
    {
      type: "ready",
      text: "Structured brief ready",
      actions: [{ label: "Apply", variant: "solid" }],
    },
    {
      type: "ambiguity",
      text: "Ambiguity detected: this looks like 2 roles",
      actions: [
        { label: "Split", variant: "outline" },
        { label: "Narrow scope", variant: "outline" },
      ],
    },
    {
      type: "missing",
      text: "Missing critical info: on-call frequency",
      actions: [{ label: "Add", variant: "outline" }],
    },
  ]);

  const getIconForType = (type: AIMessageType) => {
    switch (type) {
      case "ready":
        return <CheckCircle size={16} strokeWidth={2.5} />;
      case "ambiguity":
        return <AlertCircle size={16} strokeWidth={2.5} />;
      case "missing":
        return <HelpCircle size={16} strokeWidth={2.5} />;
    }
  };

  const getColorForType = (type: AIMessageType) => {
    switch (type) {
      case "ready":
        return { bg: "success.subtle", border: "success.muted", icon: "success", text: "success" };
      case "ambiguity":
        return { bg: "warning.subtle", border: "warning.muted", icon: "warning", text: "warning" };
      case "missing":
        return { bg: "info.subtle", border: "info.muted", icon: "info", text: "info" };
    }
  };

  const completedFields = [days30, days90, days180, constraints, nonNegotiables, learnable].filter(Boolean).length;
  const totalFields = 6;
  const progress = Math.round((completedFields / totalFields) * 100);

  return (
    <Box py={8} px={8} maxW="1200px" mx="auto">
      <Grid templateColumns={{ base: "1fr", xl: "1fr 360px" }} gap={8}>
        {/* Main Content */}
        <Stack gap={6}>
          {/* Page Header */}
          <Flex justify="space-between" align="start" flexWrap="wrap" gap={4}>
            <Box>
              <Flex align="center" gap={3} mb={2}>
                <Input
                  value={jobName}
                  onChange={(e) => setJobName(e.target.value)}
                  fontSize="xl"
                  fontWeight="semibold"
                  color="text"
                  variant={"unstyled" as "outline"}
                  _hover={{ bg: "bg.subtle" }}
                  _focus={{ bg: "bg.subtle" }}
                  px={2}
                  py={1}
                  borderRadius="md"
                  w="auto"
                  minW="300px"
                />
                <Badge
                  bg="bg.muted"
                  color="text.muted"
                  fontSize="2xs"
                  fontWeight="semibold"
                  px={2}
                  py={0.5}
                  borderRadius="md"
                >
                  Draft
                </Badge>
              </Flex>
              <Text fontSize="sm" color="text.muted">
                Define what success looks like for this role
              </Text>
            </Box>

            {/* Progress indicator */}
            <Flex align="center" gap={3} bg="surface" px={4} py={2} borderRadius="full" border="1px solid" borderColor="border" shadow="sm">
              <Box position="relative" w="36px" h="36px">
                <svg width="36" height="36" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="var(--chakra-colors-border)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="var(--chakra-colors-primary)"
                    strokeWidth="3"
                    strokeDasharray={`${progress * 0.94} 100`}
                    strokeLinecap="round"
                    transform="rotate(-90 18 18)"
                  />
                </svg>
                <Text
                  position="absolute"
                  top="50%"
                  left="50%"
                  transform="translate(-50%, -50%)"
                  fontSize="xs"
                  fontWeight="bold"
                  color="text"
                >
                  {progress}%
                </Text>
              </Box>
              <Text fontSize="sm" color="text.secondary">
                {completedFields}/{totalFields} sections
              </Text>
            </Flex>
          </Flex>

          {/* Section: Success Milestones */}
          <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" overflow="hidden" shadow="card">
            <Flex px={5} py={3} borderBottom="1px solid" borderBottomColor="border.subtle" align="center" gap={3} bg="bg.subtle">
              <Circle size="28px" bg="primary.subtle">
                <Box color="primary">
                  <Calendar size={14} />
                </Box>
              </Circle>
              <Box>
                <Heading as="h2" fontSize="sm" color="text" fontWeight="semibold">
                  Success Milestones
                </Heading>
                <Text fontSize="xs" color="text.muted">
                  What will this person deliver?
                </Text>
              </Box>
            </Flex>

            <Stack gap={0}>
              {[
                { label: "30 days", value: days30, setValue: setDays30, placeholder: "Ex: Take ownership of service X + join on-call rotation" },
                { label: "90 days", value: days90, setValue: setDays90, placeholder: "Ex: Ship first major feature + reduce P95 latency by 30%" },
                { label: "180 days", value: days180, setValue: setDays180, placeholder: "Ex: Lead architecture decisions + mentor 2 junior engineers" },
              ].map((item, i) => (
                <Box
                  key={item.label}
                  px={5}
                  py={4}
                  borderBottom={i < 2 ? "1px solid" : "none"}
                  borderBottomColor="border.subtle"
                  _hover={{ bg: "bg.subtle" }}
                  transition="background 0.15s"
                >
                  <Flex gap={4} align="start">
                    <Badge
                      bg="bg.muted"
                      color="text.muted"
                      fontSize="2xs"
                      fontWeight="semibold"
                      px={2}
                      py={0.5}
                      borderRadius="md"
                      minW="60px"
                      textAlign="center"
                    >
                      {item.label}
                    </Badge>
                    <Textarea
                      value={item.value}
                      onChange={(e) => item.setValue(e.target.value)}
                      placeholder={item.placeholder}
                      rows={2}
                      fontSize="sm"
                      border="none"
                      bg="transparent"
                      p={0}
                      _focus={{ boxShadow: "none" }}
                      resize="none"
                      color="text.secondary"
                    />
                  </Flex>
                </Box>
              ))}
            </Stack>
          </Box>

          {/* Section: Constraints */}
          <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" overflow="hidden" shadow="card">
            <Flex px={5} py={3} borderBottom="1px solid" borderBottomColor="border.subtle" align="center" gap={3} bg="bg.subtle">
              <Circle size="28px" bg="warning.subtle">
                <Box color="warning">
                  <Target size={14} />
                </Box>
              </Circle>
              <Box>
                <Heading as="h2" fontSize="sm" color="text" fontWeight="semibold">
                  Constraints
                </Heading>
                <Text fontSize="xs" color="text.muted">
                  Timezone, budget, start date, team size...
                </Text>
              </Box>
            </Flex>
            <Box px={5} py={4}>
              <Textarea
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
                placeholder="Ex: Remote-first, EU timezone overlap required, start within 4 weeks, $180-220k comp range..."
                rows={3}
                fontSize="sm"
                border="none"
                bg="transparent"
                p={0}
                _focus={{ boxShadow: "none" }}
                resize="none"
                color="text.secondary"
              />
            </Box>
          </Box>

          {/* Section: Requirements */}
          <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" overflow="hidden" shadow="card">
            <Flex px={5} py={3} borderBottom="1px solid" borderBottomColor="border.subtle" align="center" justify="space-between" bg="bg.subtle">
              <Flex align="center" gap={3}>
                <Circle size="28px" bg="ai.bg">
                  <Box color="ai.text">
                    <Shield size={14} />
                  </Box>
                </Circle>
                <Box>
                  <Heading as="h2" fontSize="sm" color="text" fontWeight="semibold">
                    Requirements
                  </Heading>
                  <Text fontSize="xs" color="text.muted">
                    Separate must-haves from nice-to-haves
                  </Text>
                </Box>
              </Flex>
            </Flex>

            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={0}>
              <Box px={5} py={4} borderRight={{ md: "1px solid" }} borderRightColor="border.subtle">
                <Flex align="center" gap={2} mb={3}>
                  <Box color="error">
                    <Shield size={14} />
                  </Box>
                  <Text fontSize="2xs" fontWeight="medium" color="text.subtle" textTransform="uppercase" letterSpacing="wider">
                    Non-negotiables
                  </Text>
                </Flex>
                <Textarea
                  value={nonNegotiables}
                  onChange={(e) => setNonNegotiables(e.target.value)}
                  placeholder="Ex: Production Go experience, on-call ownership, incident response..."
                  rows={4}
                  fontSize="sm"
                  border="none"
                  bg="transparent"
                  p={0}
                  _focus={{ boxShadow: "none" }}
                  resize="none"
                  color="text.secondary"
                />
              </Box>

              <Box px={5} py={4}>
                <Flex align="center" gap={2} mb={3}>
                  <Box color="info">
                    <BookOpen size={14} />
                  </Box>
                  <Text fontSize="2xs" fontWeight="medium" color="text.subtle" textTransform="uppercase" letterSpacing="wider">
                    Can learn on the job
                  </Text>
                </Flex>
                <Textarea
                  value={learnable}
                  onChange={(e) => setLearnable(e.target.value)}
                  placeholder="Ex: Kubernetes, specific frameworks, domain knowledge..."
                  rows={4}
                  fontSize="sm"
                  border="none"
                  bg="transparent"
                  p={0}
                  _focus={{ boxShadow: "none" }}
                  resize="none"
                  color="text.secondary"
                />
              </Box>
            </Grid>
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
              transition="all 0.2s"
              fontWeight="medium"
              px={5}
              h="44px"
              borderRadius="lg"
            >
              <Flex align="center" gap={2}>
                <Sparkles size={16} />
                <Text>Generate scorecard</Text>
              </Flex>
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

        {/* Right Panel: AI Suggestions */}
        <Box position={{ base: "static", xl: "sticky" }} top="88px" h="fit-content">
          <Stack gap={4}>
            {/* AI Panel */}
            <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" overflow="hidden" shadow="card">
              <Flex px={4} py={3} borderBottom="1px solid" borderBottomColor="border.subtle" align="center" gap={2} bg="ai.bg">
                <Circle size="24px" bg="ai.border">
                  <Box color="ai.text">
                    <Sparkles size={16} />
                  </Box>
                </Circle>
                <Text fontSize="sm" fontWeight="semibold" color="text">
                  AI Suggestions
                </Text>
              </Flex>

              <Stack gap={0}>
                {aiMessages.map((message, i) => {
                  const colors = getColorForType(message.type);
                  return (
                    <Box
                      key={i}
                      px={4}
                      py={3}
                      borderBottom={i < aiMessages.length - 1 ? "1px solid" : "none"}
                      borderBottomColor="border.subtle"
                      bg={colors.bg}
                      transition="all 0.15s"
                    >
                      <Flex gap={3} alignItems="start" mb={2}>
                        <Circle size="22px" bg={colors.border} color={colors.icon} flexShrink={0}>
                          {getIconForType(message.type)}
                        </Circle>
                        <Text fontSize="sm" color={colors.text} fontWeight="medium" lineHeight="1.5">
                          {message.text}
                        </Text>
                      </Flex>

                      <Flex gap={2} pl="34px">
                        {message.actions.map((action, j) => (
                          <Button
                            key={j}
                            size="xs"
                            variant={action.variant === "solid" ? "solid" : "outline"}
                            bg={action.variant === "solid" && message.type === "ready" ? "success" : undefined}
                            color={action.variant === "solid" ? "white" : "text.secondary"}
                            borderColor={action.variant !== "solid" ? "border" : undefined}
                            fontWeight="medium"
                            _hover={{
                              bg: action.variant === "solid" ? "success" : "bg.subtle",
                              opacity: action.variant === "solid" ? 0.9 : 1
                            }}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </Flex>
                    </Box>
                  );
                })}
              </Stack>
            </Box>

            {/* Quick tip */}
            <Box
              bg="info.subtle"
              borderRadius="xl"
              border="1px solid"
              borderColor="info.muted"
              p={4}
            >
              <Flex gap={3} align="start">
                <Circle size="24px" bg="info.muted" flexShrink={0}>
                  <Box color="info">
                    <Pen size={14} />
                  </Box>
                </Circle>
                <Box>
                  <Text fontSize="xs" fontWeight="semibold" color="info" mb={1}>
                    Pro tip
                  </Text>
                  <Text fontSize="xs" color="text.muted" lineHeight="1.6">
                    Focus on observable outcomes, not activities. "Deploy X" is better than "Work on X".
                  </Text>
                </Box>
              </Flex>
            </Box>
          </Stack>
        </Box>
      </Grid>
    </Box>
  );
}
