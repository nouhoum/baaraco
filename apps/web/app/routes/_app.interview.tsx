import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  MessageCircle,
  Send,
  Clock,
  CheckCircle,
  AlertTriangle,
  Wifi,
  WifiOff,
  Lightbulb,
  X,
  Bot,
  User as UserIcon,
} from "lucide-react";
import {
  Box,
  Flex,
  Text,
  Button,
  Textarea,
  Stack,
  Badge,
  Spinner,
  Heading,
  Container,
} from "@chakra-ui/react";
import { Card } from "@chakra-ui/react";
import {
  startInterview,
  sendInterviewMessage,
  endInterview,
  type InterviewSession,
  type InterviewMessage,
  type WorkSampleAttempt,
} from "~/components/lib/api";
import { requireRole } from "~/components/lib/auth.server";
import { authenticatedFetch } from "~/components/lib/api.server";
import { redirect } from "react-router";
import type { Route } from "./+types/_app.interview";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Interview - Baara" }];
};

export async function loader({ request }: Route.LoaderArgs) {
  await requireRole(request, ["candidate"]);

  // Support ?attempt=<id> query param for multi-role evaluations
  const url = new URL(request.url);
  const attemptId = url.searchParams.get("attempt");

  let apiUrl = "/api/v1/work-sample-attempts/me";
  if (attemptId) {
    apiUrl = `/api/v1/work-sample-attempts/${encodeURIComponent(attemptId)}`;
  }

  const res = await authenticatedFetch(request, apiUrl);
  if (!res.ok) {
    return {
      attempt: null as WorkSampleAttempt | null,
    };
  }
  const data = await res.json();
  const attempt = data.attempt as WorkSampleAttempt | null;

  // If already evaluated, redirect to the proof profile page
  if (attempt && attempt.status === "reviewed") {
    throw redirect("/app/work-sample");
  }

  return { attempt };
}

// ---------------------------------------------------------------------------
// SSE Hook
// ---------------------------------------------------------------------------

interface UseInterviewSSEOptions {
  attemptId: string | undefined;
  enabled: boolean;
  onChunk: (text: string) => void;
  onDone: (data: { content: string; topic_index: number; topics_completed: number[] }) => void;
  onComplete: () => void;
  onTimeout: () => void;
  onError: (error: string) => void;
}

function useInterviewSSE({
  attemptId,
  enabled,
  onChunk,
  onDone,
  onComplete,
  onTimeout,
  onError,
}: UseInterviewSSEOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const eventSourceRef = useRef<EventSource | null>(null);
  const retriesRef = useRef(0);
  const maxRetries = 3;
  const streamingTextRef = useRef("");

  const connect = useCallback(() => {
    if (!attemptId || !enabled) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = `${API_URL}/api/v1/work-sample-attempts/${attemptId}/interview/stream`;
    const es = new EventSource(url, { withCredentials: true });
    eventSourceRef.current = es;

    es.addEventListener("connected", () => {
      setIsConnected(true);
      retriesRef.current = 0;
    });

    es.addEventListener("chunk", (event: MessageEvent) => {
      setIsStreaming(true);
      let text = event.data;
      try {
        const parsed = JSON.parse(text);
        text = parsed.text ?? text;
      } catch {
        // Not JSON, use raw text
      }
      streamingTextRef.current += text;
      setStreamingText(streamingTextRef.current);
      onChunk(text);
    });

    es.addEventListener("done", (event: MessageEvent) => {
      const content = streamingTextRef.current;
      try {
        const data = JSON.parse(event.data);
        onDone({
          content: data.content || content,
          topic_index: data.topic_index ?? 0,
          topics_completed: data.topics_completed ?? [],
        });
      } catch {
        onDone({
          content,
          topic_index: 0,
          topics_completed: [],
        });
      }
      streamingTextRef.current = "";
      setStreamingText("");
      setIsStreaming(false);
    });

    es.addEventListener("complete", () => {
      setIsStreaming(false);
      onComplete();
    });

    es.addEventListener("timeout", () => {
      setIsStreaming(false);
      onTimeout();
    });

    es.addEventListener("heartbeat", () => {
      // Keep-alive, no action needed
    });

    es.addEventListener("error", (event: Event) => {
      // EventSource native error
      const messageEvent = event as MessageEvent;
      const errorMsg = messageEvent.data || "Connection error";
      onError(errorMsg);
    });

    es.onerror = () => {
      setIsConnected(false);
      setIsStreaming(false);
      es.close();

      // Reconnect with exponential backoff
      if (retriesRef.current < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retriesRef.current), 8000);
        retriesRef.current += 1;
        setTimeout(() => {
          connect();
        }, delay);
      }
    };
  }, [attemptId, enabled, onChunk, onDone, onComplete, onTimeout, onError]);

  useEffect(() => {
    if (enabled && attemptId) {
      connect();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [enabled, attemptId, connect]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
    setIsStreaming(false);
    setStreamingText("");
    streamingTextRef.current = "";
  }, []);

  return { isConnected, isStreaming, streamingText, disconnect };
}

// ---------------------------------------------------------------------------
// Timer Hook
// ---------------------------------------------------------------------------

function useCountdownTimer(startedAt: string | undefined, maxDurationMinutes: number) {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!startedAt) {
      setRemainingSeconds(null);
      return;
    }

    const calculate = () => {
      const start = new Date(startedAt).getTime();
      const end = start + maxDurationMinutes * 60 * 1000;
      const now = Date.now();
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      setRemainingSeconds(diff);
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [startedAt, maxDurationMinutes]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return {
    remainingSeconds,
    formatted: remainingSeconds !== null ? formatTime(remainingSeconds) : "--:--",
    isLow: remainingSeconds !== null && remainingSeconds < 300,
    isExpired: remainingSeconds !== null && remainingSeconds <= 0,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type InterviewPhase = "welcome" | "active" | "completed" | "timed_out";

export default function Interview({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation("interview");
  const attempt = loaderData.attempt;
  const attemptId = attempt?.id;

  // State
  const [phase, setPhase] = useState<InterviewPhase>("welcome");
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [error, setError] = useState("");
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [topicsCompleted, setTopicsCompleted] = useState<number[]>([]);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Determine total topics (use 3 as default if not available from session)
  const totalTopics = 3;

  // Timer
  const timer = useCountdownTimer(
    session?.started_at,
    session?.max_duration_minutes ?? 45,
  );

  // SSE callbacks (stable refs to avoid re-renders)
  const handleChunk = useCallback(() => {
    // Streaming text is managed inside the hook via setStreamingText
  }, []);

  const handleDone = useCallback(
    (data: { content: string; topic_index: number; topics_completed: number[] }) => {
      const aiMessage: InterviewMessage = {
        role: "assistant",
        content: data.content,
        timestamp: new Date().toISOString(),
        topic_index: data.topic_index,
      };
      setMessages((prev) => [...prev, aiMessage]);
      setCurrentTopicIndex(data.topic_index);
      if (data.topics_completed) {
        setTopicsCompleted(data.topics_completed);
      }
    },
    [],
  );

  const handleComplete = useCallback(() => {
    setPhase("completed");
  }, []);

  const handleTimeout = useCallback(() => {
    setPhase("timed_out");
  }, []);

  const handleSSEError = useCallback((errorMsg: string) => {
    setError(errorMsg);
  }, []);

  // SSE connection
  const { isConnected, isStreaming, streamingText, disconnect } = useInterviewSSE({
    attemptId,
    enabled: phase === "active",
    onChunk: handleChunk,
    onDone: handleDone,
    onComplete: handleComplete,
    onTimeout: handleTimeout,
    onError: handleSSEError,
  });

  // Handle timer expiry — auto-end interview on server
  useEffect(() => {
    if (timer.isExpired && phase === "active" && attemptId) {
      setPhase("timed_out");
      disconnect();
      endInterview(attemptId).catch(() => {
        // Server may already have timed it out, ignore errors
      });
    }
  }, [timer.isExpired, phase, attemptId, disconnect]);

  // Auto-scroll to bottom on new messages or streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // Check if session already exists on mount
  useEffect(() => {
    if (!attemptId) return;

    const checkSession = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/v1/work-sample-attempts/${attemptId}/interview/session`,
          { credentials: "include" },
        );
        if (res.ok) {
          const data = await res.json();
          const existingSession = data.session as InterviewSession;
          setSession(existingSession);

          if (existingSession.status === "in_progress") {
            setMessages(existingSession.messages || []);
            setCurrentTopicIndex(existingSession.current_topic_index);
            setTopicsCompleted(existingSession.topics_completed || []);
            setPhase("active");
          } else if (existingSession.status === "completed") {
            setMessages(existingSession.messages || []);
            setPhase("completed");
          } else if (existingSession.status === "timed_out") {
            setMessages(existingSession.messages || []);
            setPhase("timed_out");
          }
        }
      } catch {
        // No existing session, stay on welcome
      }
    };

    checkSession();
  }, [attemptId]);

  // Start interview
  const handleStart = async () => {
    if (!attemptId) return;
    setIsStarting(true);
    setError("");

    try {
      const response = await startInterview(attemptId);
      setSession(response.session);
      setMessages(response.session.messages || []);
      setCurrentTopicIndex(response.session.current_topic_index);
      setTopicsCompleted(response.session.topics_completed || []);
      setPhase("active");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("interview.errorStarting"));
    } finally {
      setIsStarting(false);
    }
  };

  // Send message
  const handleSend = async () => {
    if (!attemptId || !inputValue.trim() || isSending || isStreaming) return;

    const content = inputValue.trim();
    setInputValue("");
    setIsSending(true);
    setError("");

    // Optimistically add user message
    const userMessage: InterviewMessage = {
      role: "user",
      content,
      timestamp: new Date().toISOString(),
      topic_index: currentTopicIndex,
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      await sendInterviewMessage(attemptId, content);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("interview.errorSending"));
      // Remove optimistic message on error
      setMessages((prev) => prev.slice(0, -1));
      setInputValue(content);
    } finally {
      setIsSending(false);
    }
  };

  // End interview
  const handleEnd = async () => {
    if (!attemptId) return;
    setIsEnding(true);
    setError("");

    try {
      const response = await endInterview(attemptId);
      setSession(response.session);
      setPhase("completed");
      disconnect();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("interview.errorEnding"));
    } finally {
      setIsEnding(false);
      setShowEndConfirm(false);
    }
  };

  // Handle Enter key in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // No attempt available
  if (!attempt) {
    return (
      <Container maxW="800px" py={8}>
        <Box
          bg="surface"
          borderRadius="xl"
          border="1px solid"
          borderColor="border"
          p={8}
          shadow="card"
          textAlign="center"
        >
          <Stack gap={4} align="center">
            <Box color="text.muted">
              <Clock size={32} />
            </Box>
            <Heading as="h1" fontSize="xl" color="text" fontWeight="semibold">
              {t("interview.title")}
            </Heading>
            <Text color="text.secondary" fontSize="sm" maxW="400px">
              {t("interview.noAttempt")}
            </Text>
          </Stack>
        </Box>
      </Container>
    );
  }

  // ---------------------------------------------------------------------------
  // Welcome Screen
  // ---------------------------------------------------------------------------

  if (phase === "welcome") {
    return (
      <Container maxW="700px" py={8}>
        <Stack gap={6}>
          {/* Header card */}
          <Box
            bg="surface"
            borderRadius="xl"
            border="1px solid"
            borderColor="border"
            p={8}
            shadow="card"
          >
            <Stack gap={6} align="center" textAlign="center">
              <Box
                w="64px"
                h="64px"
                borderRadius="full"
                bg="primary.subtle"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Box color="primary">
                  <MessageCircle size={28} />
                </Box>
              </Box>

              <Box>
                <Heading as="h1" fontSize="2xl" color="text" fontWeight="semibold" mb={2}>
                  {t("interview.welcomeTitle")}
                </Heading>
                <Text color="text.secondary" fontSize="sm" lineHeight="1.7" maxW="500px">
                  {t("interview.welcomeDescription")}
                </Text>
              </Box>

              {/* Duration info */}
              <Flex
                align="center"
                gap={2}
                bg="info.subtle"
                px={4}
                py={2}
                borderRadius="full"
              >
                <Box color="info">
                  <Clock size={16} />
                </Box>
                <Text fontSize="sm" fontWeight="medium" color="info">
                  {t("interview.duration", { minutes: session?.max_duration_minutes ?? 45 })}
                </Text>
              </Flex>
            </Stack>
          </Box>

          {/* Tips card */}
          <Box
            bg="surface"
            borderRadius="xl"
            border="1px solid"
            borderColor="border"
            p={6}
            shadow="card"
          >
            <Flex align="center" gap={2} mb={4}>
              <Box color="warning">
                <Lightbulb size={18} />
              </Box>
              <Text fontSize="sm" fontWeight="semibold" color="text">
                {t("interview.tipsTitle")}
              </Text>
            </Flex>

            <Stack gap={3}>
              {[
                t("interview.tip1"),
                t("interview.tip2"),
                t("interview.tip3"),
                t("interview.tip4"),
              ].map((tip, i) => (
                <Flex key={i} gap={3} align="flex-start">
                  <Box
                    w="20px"
                    h="20px"
                    borderRadius="full"
                    bg="bg.muted"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                    mt="1px"
                  >
                    <Text fontSize="xs" fontWeight="bold" color="text.muted">
                      {i + 1}
                    </Text>
                  </Box>
                  <Text fontSize="sm" color="text.secondary" lineHeight="1.6">
                    {tip}
                  </Text>
                </Flex>
              ))}
            </Stack>
          </Box>

          {/* Error */}
          {error && (
            <Box
              bg="error.subtle"
              borderRadius="lg"
              border="1px solid"
              borderColor="error.muted"
              px={4}
              py={3}
            >
              <Flex align="center" gap={2}>
                <Box color="error">
                  <AlertTriangle size={16} />
                </Box>
                <Text fontSize="sm" color="error">
                  {error}
                </Text>
              </Flex>
            </Box>
          )}

          {/* Start button */}
          <Button
            onClick={handleStart}
            disabled={isStarting}
            bg="primary"
            color="white"
            size="lg"
            w="100%"
            h="52px"
            fontWeight="semibold"
            fontSize="md"
            borderRadius="xl"
            shadow="button"
            _hover={{ bg: "primary.hover", transform: "translateY(-1px)", shadow: "buttonHover" }}
            _active={{ transform: "translateY(0)" }}
            _disabled={{ opacity: 0.6, cursor: "not-allowed", transform: "none" }}
            transition="all 0.15s"
          >
            {isStarting ? (
              <Flex align="center" gap={2}>
                <Spinner size="sm" />
                <Text>{t("interview.starting")}</Text>
              </Flex>
            ) : (
              <Flex align="center" gap={2}>
                <MessageCircle size={18} />
                <Text>{t("interview.start")}</Text>
              </Flex>
            )}
          </Button>
        </Stack>
      </Container>
    );
  }

  // ---------------------------------------------------------------------------
  // Completed / Timed Out Screen
  // ---------------------------------------------------------------------------

  if (phase === "completed" || phase === "timed_out") {
    return (
      <Container maxW="700px" py={8}>
        <Box
          bg="surface"
          borderRadius="xl"
          border="1px solid"
          borderColor="border"
          p={8}
          shadow="card"
        >
          <Stack gap={6} align="center" textAlign="center">
            <Box
              w="64px"
              h="64px"
              borderRadius="full"
              bg={phase === "completed" ? "success.subtle" : "warning.subtle"}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Box color={phase === "completed" ? "success" : "warning"}>
                {phase === "completed" ? (
                  <CheckCircle size={28} />
                ) : (
                  <Clock size={28} />
                )}
              </Box>
            </Box>

            <Box>
              <Heading as="h1" fontSize="2xl" color="text" fontWeight="semibold" mb={2}>
                {phase === "completed"
                  ? t("interview.completedTitle")
                  : t("interview.timedOutTitle")}
              </Heading>
              <Text color="text.secondary" fontSize="sm" lineHeight="1.7" maxW="450px">
                {phase === "completed"
                  ? t("interview.completedDescription")
                  : t("interview.timedOutDescription")}
              </Text>
            </Box>

            <Box
              bg="info.subtle"
              borderRadius="lg"
              px={5}
              py={4}
              border="1px solid"
              borderColor="info.muted"
              w="100%"
              maxW="400px"
            >
              <Text fontSize="sm" color="info" fontWeight="medium">
                {t("interview.evaluationProcessing")}
              </Text>
            </Box>

            <Button
              onClick={() => window.location.href = "/app/work-sample"}
              bg="primary"
              color="white"
              size="lg"
              borderRadius="lg"
              _hover={{ bg: "primary.hover" }}
            >
              {t("interview.backToDashboard", "Retour au dashboard")}
            </Button>
          </Stack>
        </Box>
      </Container>
    );
  }

  // ---------------------------------------------------------------------------
  // Active Chat Interface
  // ---------------------------------------------------------------------------

  return (
    <Flex direction="column" h="calc(100vh - 64px)" maxH="calc(100vh - 64px)">
      {/* Header */}
      <Box
        bg="surface"
        borderBottom="1px solid"
        borderBottomColor="border"
        px={6}
        py={3}
        flexShrink={0}
      >
        <Flex justify="space-between" align="center">
          <Flex align="center" gap={4}>
            <Box>
              <Heading as="h2" fontSize="md" color="text" fontWeight="semibold">
                {t("interview.title")}
              </Heading>
              <Text fontSize="xs" color="text.muted">
                {t("interview.topicProgress", {
                  current: currentTopicIndex + 1,
                  total: totalTopics,
                })}
              </Text>
            </Box>

            {/* Topic progress badges */}
            <Flex gap={1} display={{ base: "none", md: "flex" }}>
              {Array.from({ length: totalTopics }).map((_, i) => (
                <Box
                  key={i}
                  w="24px"
                  h="4px"
                  borderRadius="full"
                  bg={
                    topicsCompleted.includes(i)
                      ? "success"
                      : i === currentTopicIndex
                        ? "primary"
                        : "bg.muted"
                  }
                  transition="all 0.3s"
                />
              ))}
            </Flex>
          </Flex>

          <Flex align="center" gap={4}>
            {/* Connection status */}
            <Flex align="center" gap={1.5}>
              <Box color={isConnected ? "success" : "error"}>
                {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
              </Box>
              <Text fontSize="xs" color={isConnected ? "success" : "error"} fontWeight="medium">
                {isConnected ? t("interview.connected") : t("interview.disconnected")}
              </Text>
            </Flex>

            {/* Timer */}
            <Badge
              bg={timer.isLow ? "error.subtle" : "bg.muted"}
              color={timer.isLow ? "error" : "text.muted"}
              fontSize="sm"
              fontWeight="bold"
              px={3}
              py={1}
              borderRadius="md"
              fontFamily="mono"
            >
              <Flex align="center" gap={1.5}>
                <Clock size={14} />
                {timer.formatted}
              </Flex>
            </Badge>

            {/* End interview button */}
            <Button
              onClick={() => setShowEndConfirm(true)}
              variant="outline"
              size="sm"
              borderColor="error.muted"
              color="error"
              fontWeight="medium"
              _hover={{ bg: "error.subtle", borderColor: "error" }}
            >
              {t("interview.endInterview")}
            </Button>
          </Flex>
        </Flex>
      </Box>

      {/* Messages area */}
      <Box
        flex={1}
        overflowY="auto"
        px={4}
        py={4}
        bg="bg.subtle"
        css={{
          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            background: "var(--chakra-colors-border)",
            borderRadius: "3px",
          },
        }}
      >
        <Container maxW="800px">
          <Stack gap={4}>
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} t={t} />
            ))}

            {/* Streaming indicator */}
            {isStreaming && streamingText && (
              <Flex gap={3} align="flex-start">
                <Box
                  w="32px"
                  h="32px"
                  borderRadius="full"
                  bg="primary.subtle"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  <Box color="primary">
                    <Bot size={16} />
                  </Box>
                </Box>
                <Box
                  bg="surface"
                  border="1px solid"
                  borderColor="border"
                  borderRadius="xl"
                  borderTopLeftRadius="sm"
                  px={4}
                  py={3}
                  maxW="75%"
                  shadow="sm"
                >
                  <Text fontSize="sm" color="text" whiteSpace="pre-wrap" lineHeight="1.7">
                    {streamingText}
                  </Text>
                  <Flex align="center" gap={1} mt={1}>
                    <Spinner size="xs" color="primary" />
                    <Text fontSize="xs" color="text.muted">
                      {t("interview.typing")}
                    </Text>
                  </Flex>
                </Box>
              </Flex>
            )}

            {/* Typing indicator without text */}
            {isStreaming && !streamingText && (
              <Flex gap={3} align="flex-start">
                <Box
                  w="32px"
                  h="32px"
                  borderRadius="full"
                  bg="primary.subtle"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  <Box color="primary">
                    <Bot size={16} />
                  </Box>
                </Box>
                <Box
                  bg="surface"
                  border="1px solid"
                  borderColor="border"
                  borderRadius="xl"
                  borderTopLeftRadius="sm"
                  px={4}
                  py={3}
                  shadow="sm"
                >
                  <Flex align="center" gap={2}>
                    <Spinner size="xs" color="primary" />
                    <Text fontSize="sm" color="text.muted">
                      {t("interview.thinking")}
                    </Text>
                  </Flex>
                </Box>
              </Flex>
            )}

            <div ref={messagesEndRef} />
          </Stack>
        </Container>
      </Box>

      {/* Error banner */}
      {error && (
        <Box
          bg="error.subtle"
          px={4}
          py={2}
          borderTop="1px solid"
          borderTopColor="error.muted"
          flexShrink={0}
        >
          <Container maxW="800px">
            <Flex align="center" justify="space-between">
              <Flex align="center" gap={2}>
                <Box color="error">
                  <AlertTriangle size={14} />
                </Box>
                <Text fontSize="xs" color="error">
                  {error}
                </Text>
              </Flex>
              <Box
                as="button"
                onClick={() => setError("")}
                color="error"
                cursor="pointer"
                _hover={{ opacity: 0.7 }}
              >
                <X size={14} />
              </Box>
            </Flex>
          </Container>
        </Box>
      )}

      {/* Input area */}
      <Box
        bg="surface"
        borderTop="1px solid"
        borderTopColor="border"
        px={4}
        py={3}
        flexShrink={0}
      >
        <Container maxW="800px">
          <Flex gap={3} align="flex-end">
            <Box flex={1}>
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  // Auto-resize textarea
                  const el = e.target;
                  el.style.height = "auto";
                  el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder={t("interview.inputPlaceholder")}
                disabled={isStreaming || isSending}
                rows={2}
                fontSize="sm"
                borderColor="border"
                borderRadius="xl"
                resize="none"
                maxH="200px"
                overflowY="auto"
                _hover={{ borderColor: "border.emphasis" }}
                _focus={{
                  borderColor: "primary",
                  boxShadow: "0 0 0 1px var(--chakra-colors-primary)",
                }}
                _disabled={{ bg: "bg.subtle", cursor: "not-allowed", opacity: 0.7 }}
              />
              <Text fontSize="xs" color="text.muted" mt={1}>
                {t("interview.inputHint")}
              </Text>
            </Box>
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || isStreaming || isSending}
              bg="primary"
              color="white"
              h="44px"
              w="44px"
              minW="44px"
              borderRadius="xl"
              _hover={{ bg: "primary.hover" }}
              _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
              transition="all 0.15s"
            >
              {isSending ? <Spinner size="sm" /> : <Send size={18} />}
            </Button>
          </Flex>
        </Container>
      </Box>

      {/* End interview confirmation modal */}
      {showEndConfirm && (
        <Box
          position="fixed"
          inset={0}
          bg="blackAlpha.600"
          zIndex={100}
          display="flex"
          alignItems="center"
          justifyContent="center"
          onClick={() => setShowEndConfirm(false)}
        >
          <Box
            bg="surface"
            borderRadius="2xl"
            shadow="2xl"
            maxW="450px"
            w="90%"
            p={8}
            onClick={(e) => e.stopPropagation()}
          >
            <Flex justify="space-between" align="start" mb={6}>
              <Box>
                <Heading as="h3" fontSize="lg" fontWeight="semibold" color="text" mb={2}>
                  {t("interview.endConfirmTitle")}
                </Heading>
                <Text fontSize="sm" color="text.secondary">
                  {t("interview.endConfirmDescription")}
                </Text>
              </Box>
              <Button
                variant="ghost"
                size="sm"
                p={1}
                onClick={() => setShowEndConfirm(false)}
                color="text.muted"
                _hover={{ bg: "bg.subtle" }}
              >
                <X size={18} />
              </Button>
            </Flex>

            <Flex gap={3} justify="flex-end">
              <Button
                variant="outline"
                borderColor="border"
                color="text.secondary"
                onClick={() => setShowEndConfirm(false)}
                fontWeight="medium"
              >
                {t("interview.cancel")}
              </Button>
              <Button
                bg="error"
                color="white"
                onClick={handleEnd}
                disabled={isEnding}
                fontWeight="medium"
                _hover={{ opacity: 0.9 }}
              >
                {isEnding ? (
                  <Flex align="center" gap={2}>
                    <Spinner size="xs" />
                    <Text>{t("interview.ending")}</Text>
                  </Flex>
                ) : (
                  t("interview.confirmEnd")
                )}
              </Button>
            </Flex>
          </Box>
        </Box>
      )}
    </Flex>
  );
}

// ---------------------------------------------------------------------------
// Message Bubble Component
// ---------------------------------------------------------------------------

function MessageBubble({
  message,
  t,
}: {
  message: InterviewMessage;
  t: (key: string) => string;
}) {
  const isAI = message.role === "assistant";

  return (
    <Flex
      gap={3}
      align="flex-start"
      direction={isAI ? "row" : "row-reverse"}
    >
      {/* Avatar */}
      <Box
        w="32px"
        h="32px"
        borderRadius="full"
        bg={isAI ? "primary.subtle" : "bg.emphasis"}
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
      >
        <Box color={isAI ? "primary" : "text.secondary"}>
          {isAI ? <Bot size={16} /> : <UserIcon size={16} />}
        </Box>
      </Box>

      {/* Message content */}
      <Box
        bg={isAI ? "surface" : "primary"}
        color={isAI ? "text" : "white"}
        border={isAI ? "1px solid" : "none"}
        borderColor={isAI ? "border" : undefined}
        borderRadius="xl"
        borderTopLeftRadius={isAI ? "sm" : "xl"}
        borderTopRightRadius={isAI ? "xl" : "sm"}
        px={4}
        py={3}
        maxW="75%"
        shadow="sm"
      >
        <Text fontSize="sm" whiteSpace="pre-wrap" lineHeight="1.7">
          {message.content}
        </Text>
        <Text
          fontSize="xs"
          color={isAI ? "text.muted" : "whiteAlpha.700"}
          mt={1}
          textAlign={isAI ? "left" : "right"}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </Box>
    </Flex>
  );
}
