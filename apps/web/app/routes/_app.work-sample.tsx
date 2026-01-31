import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { Check, Save, AlertCircle, X, Lock, Clock, ChevronDown, ChevronUp } from "lucide-react";
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
  Spinner,
  Circle,
  chakra,
} from "@chakra-ui/react";
import {
  saveWorkSampleAttempt,
  submitWorkSampleAttempt,
  requestAlternativeFormat,
  type WorkSampleAttempt,
  type JobWorkSample,
  type WorkSampleSection,
  type FormatRequest,
  type AttemptStatus,
  type FormatRequestReason,
  type FormatRequestPreference,
} from "~/components/lib/api";
import { requireRole } from "~/components/lib/auth.server";
import { authenticatedFetch } from "~/components/lib/api.server";
import type { Route } from "./+types/_app.work-sample";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Work Sample - Baara" }];
};

export async function loader({ request }: Route.LoaderArgs) {
  await requireRole(request, ["candidate"]);
  const res = await authenticatedFetch(request, "/api/v1/work-sample-attempts/me");
  if (!res.ok) {
    return {
      attempt: null as WorkSampleAttempt | null,
      format_request: null as FormatRequest | null,
      work_sample: null as JobWorkSample | null,
    };
  }
  const data = await res.json();
  return {
    attempt: data.attempt as WorkSampleAttempt | null,
    format_request: (data.format_request || null) as FormatRequest | null,
    work_sample: (data.work_sample || null) as JobWorkSample | null,
  };
}

// Generate a stable key from a section title for use as answer key
function sectionKey(title: string, index: number): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return slug || `section_${index}`;
}

// Helper to format relative time
function formatRelativeTime(dateString?: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins === 1) return "1 minute ago";
  if (diffMins < 60) return `${diffMins} minutes ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return "1 hour ago";
  if (diffHours < 24) return `${diffHours} hours ago`;

  return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

// Calculate progress based on answers and sections
function calculateProgress(answers: Record<string, string>, sectionKeys: string[]): number {
  if (sectionKeys.length === 0) return 0;
  let completedSections = 0;

  for (const key of sectionKeys) {
    const answer = answers[key];
    if (answer && answer.trim().length >= 50) {
      completedSections++;
    }
  }

  return Math.round((completedSections / sectionKeys.length) * 100);
}

// Get section indicator status
function getSectionIndicator(answer: string | undefined): "empty" | "partial" | "complete" {
  if (!answer || answer.trim().length === 0) return "empty";
  if (answer.trim().length >= 50) return "complete";
  return "partial";
}

export default function WorkSample({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();

  const workSample = loaderData.work_sample;
  const sections = workSample?.sections ?? [];
  const sectionKeys = sections.map((s, i) => sectionKey(s.title, i));

  // Initialize from loader
  const [attempt, setAttempt] = useState<WorkSampleAttempt | null>(loaderData.attempt);
  const [formatRequest, setFormatRequest] = useState<FormatRequest | null>(loaderData.format_request);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Local answers state
  const buildInitialAnswers = (): Record<string, string> => {
    const existing = loaderData.attempt?.answers || {};
    const result: Record<string, string> = {};
    for (const key of sectionKeys) {
      result[key] = existing[key] || "";
    }
    return result;
  };
  const [answers, setAnswers] = useState<Record<string, string>>(buildInitialAnswers);

  // Track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Refs for auto-save
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedAnswersRef = useRef<string>(JSON.stringify(buildInitialAnswers()));

  // Modal states
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showFormatModal, setShowFormatModal] = useState(false);

  // Rubric toggle per section
  const [expandedRubrics, setExpandedRubrics] = useState<Record<string, boolean>>({});

  // Format request form state
  const [formatReason, setFormatReason] = useState<FormatRequestReason | "">("");
  const [formatPreference, setFormatPreference] = useState<FormatRequestPreference | "">("");
  const [formatComment, setFormatComment] = useState("");
  const [isRequestingFormat, setIsRequestingFormat] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState(sectionKeys[0] || "");

  // Auto-save function
  const saveProgress = useCallback(async (silent = false) => {
    if (!attempt || !attempt.id) return;
    if (attempt.status === "submitted" || attempt.status === "reviewed") return;

    const currentAnswersJson = JSON.stringify(answers);
    if (currentAnswersJson === lastSavedAnswersRef.current) return;

    if (!silent) {
      setIsSaving(true);
      setSaveStatus("saving");
    }

    try {
      const progress = calculateProgress(answers, sectionKeys);
      const response = await saveWorkSampleAttempt(attempt.id, {
        answers,
        progress,
      });

      setAttempt(response.attempt);
      lastSavedAnswersRef.current = currentAnswersJson;
      setHasUnsavedChanges(false);
      setSaveStatus("saved");

      setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
    } catch (err) {
      setSaveStatus("error");
      if (!silent) {
        setError(err instanceof Error ? err.message : "Error saving");
      }
    } finally {
      if (!silent) {
        setIsSaving(false);
      }
    }
  }, [attempt, answers, sectionKeys]);

  // Auto-save every 15 seconds if there are changes
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    autoSaveTimerRef.current = setInterval(() => {
      saveProgress(true);
    }, 15000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [hasUnsavedChanges, saveProgress]);

  // Handle answer change
  const handleAnswerChange = (key: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [key]: value,
    }));
    setHasUnsavedChanges(true);
    setError("");
  };

  // Handle blur (save on focus loss)
  const handleBlur = () => {
    if (hasUnsavedChanges) {
      saveProgress(true);
    }
  };

  // Handle tab change (save before switching)
  const handleTabChange = (value: string) => {
    if (hasUnsavedChanges) {
      saveProgress(true);
    }
    setActiveTab(value);
  };

  // Handle manual save
  const handleSave = () => {
    saveProgress(false);
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!attempt) return;

    setIsSubmitting(true);
    setError("");

    try {
      const response = await submitWorkSampleAttempt(attempt.id);
      setAttempt(response.attempt);
      setShowSubmitModal(false);
      navigate("/app/proof-profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error submitting");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle format request
  const handleFormatRequest = async () => {
    if (!attempt || !formatReason || !formatPreference) return;

    setIsRequestingFormat(true);
    setError("");

    try {
      const response = await requestAlternativeFormat(attempt.id, {
        reason: formatReason as FormatRequestReason,
        preferred_format: formatPreference as FormatRequestPreference,
        comment: formatComment || undefined,
      });

      setFormatRequest(response.format_request);
      setShowFormatModal(false);
      setFormatReason("");
      setFormatPreference("");
      setFormatComment("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error submitting request");
    } finally {
      setIsRequestingFormat(false);
    }
  };

  // Toggle rubric visibility
  const toggleRubric = (key: string) => {
    setExpandedRubrics(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Check if can submit (at least one answer has content)
  const canSubmit = () => {
    return sectionKeys.some(key => (answers[key] || "").trim().length > 0);
  };

  // Check if attempt is editable
  const isEditable = attempt?.status === "draft" || attempt?.status === "in_progress";

  // Calculate progress — submitted/reviewed = 100%
  const progress = !isEditable ? 100 : calculateProgress(answers, sectionKeys);

  // Total estimated time
  const totalEstimatedTime = workSample?.estimated_time_minutes
    ?? sections.reduce((sum, s) => sum + (s.estimated_time_minutes || 0), 0);

  // No work sample linked — show a waiting state
  if (!workSample || sections.length === 0) {
    return (
      <Box py={8} px={8} maxW="1000px" mx="auto">
        <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" p={8} shadow="card" textAlign="center">
          <Stack gap={4} align="center">
            <Circle size="64px" bg="info.subtle" color="info">
              <Clock size={28} />
            </Circle>
            <Heading as="h1" fontSize="xl" color="text" fontWeight="semibold">
              Work Sample
            </Heading>
            <Text color="text.secondary" fontSize="sm" maxW="400px">
              Your work sample is not yet available. It will be generated once your hiring process is set up. Please check back later.
            </Text>
          </Stack>
        </Box>
      </Box>
    );
  }

  return (
    <Box py={8} px={8} maxW="1000px" mx="auto">
      <Stack gap={6}>
        {/* Header with Progress */}
        <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" p={6} shadow="card">
          <Stack gap={5}>
            <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
              <Box>
                <Heading as="h1" fontSize="xl" color="text" mb={1} fontWeight="semibold">
                  Work Sample
                </Heading>
                <Text fontSize="sm" color="text.secondary">
                  Estimated time: ~{totalEstimatedTime} minutes. You can take breaks.
                </Text>
              </Box>

              {/* Status Badge */}
              <Flex gap={3} align="center">
                {/* Save status indicator */}
                {saveStatus === "saving" && (
                  <Flex align="center" gap={2} color="text.muted">
                    <Spinner size="xs" />
                    <Text fontSize="xs">Saving...</Text>
                  </Flex>
                )}
                {saveStatus === "saved" && (
                  <Flex align="center" gap={2} color="success">
                    <Check size={12} strokeWidth={3} />
                    <Text fontSize="xs">Saved {formatRelativeTime(attempt?.last_saved_at)}</Text>
                  </Flex>
                )}
                {saveStatus === "error" && (
                  <Flex align="center" gap={2} color="error">
                    <AlertCircle size={16} />
                    <Text fontSize="xs">Save error</Text>
                  </Flex>
                )}

                <Badge
                  bg={
                    attempt?.status === "submitted" ? "success.subtle" :
                    attempt?.status === "reviewed" ? "info.subtle" :
                    "bg.muted"
                  }
                  color={
                    attempt?.status === "submitted" ? "success" :
                    attempt?.status === "reviewed" ? "info" :
                    "text.muted"
                  }
                  fontSize="xs"
                  fontWeight="semibold"
                  px={3}
                  py={1}
                  borderRadius="full"
                >
                  {attempt?.status === "draft" && "Draft"}
                  {attempt?.status === "in_progress" && "In progress"}
                  {attempt?.status === "submitted" && "Submitted"}
                  {attempt?.status === "reviewed" && "Reviewed"}
                </Badge>
              </Flex>
            </Flex>

            {/* Progress Bar */}
            <Stack gap={2}>
              <Flex justify="space-between" align="center">
                <Text fontSize="xs" color="text.muted" fontWeight="medium">
                  Progress
                </Text>
                <Text fontSize="xs" color="text.muted" fontWeight="medium">
                  {progress}%
                </Text>
              </Flex>
              <Progress.Root value={progress}>
                <Progress.Track bg="bg.muted" borderRadius="full">
                  <Progress.Range bg="primary" borderRadius="full" />
                </Progress.Track>
              </Progress.Root>
            </Stack>

            {/* Save button (only if editable) */}
            {isEditable && (
              <Button
                onClick={handleSave}
                disabled={isSaving || !hasUnsavedChanges}
                variant="outline"
                size="sm"
                w="fit-content"
                borderColor="border"
                color="text.secondary"
                fontWeight="medium"
                _hover={{ bg: "bg.subtle", borderColor: "border.emphasis" }}
              >
                <Flex align="center" gap={2}>
                  <Save size={16} />
                  <Text>Save</Text>
                </Flex>
              </Button>
            )}
          </Stack>
        </Box>

        {/* Submitted banner */}
        {!isEditable && (
          <Box bg="success.subtle" borderRadius="xl" border="1px solid" borderColor="success.muted" px={5} py={4}>
            <Flex gap={3} align="center">
              <Circle size="32px" bg="success.muted" color="success">
                <Lock size={16} />
              </Circle>
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color="text">
                  Work Sample submitted
                </Text>
                <Text fontSize="xs" color="text.secondary">
                  Submitted on {attempt?.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }) : ""}. Your Proof Profile is being generated.
                </Text>
              </Box>
            </Flex>
          </Box>
        )}

        {/* Format request banners */}
        {formatRequest && formatRequest.status === "pending" && (
          <Box bg="warning.subtle" borderRadius="xl" border="1px solid" borderColor="warning.muted" px={5} py={4}>
            <Flex gap={3} align="center">
              <Circle size="32px" bg="warning.muted" color="warning">
                <AlertCircle size={16} />
              </Circle>
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color="text">
                  Alternative format request pending
                </Text>
                <Text fontSize="xs" color="text.secondary">
                  We will get back to you within 48 hours.
                </Text>
              </Box>
            </Flex>
          </Box>
        )}

        {formatRequest && formatRequest.status === "approved" && (
          <Box bg="success.subtle" borderRadius="xl" border="1px solid" borderColor="success.muted" px={5} py={4}>
            <Stack gap={3}>
              <Flex gap={3} align="center">
                <Circle size="32px" bg="success.muted" color="success">
                  <Check size={12} strokeWidth={3} />
                </Circle>
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color="text">
                    Alternative format request approved
                  </Text>
                  <Text fontSize="xs" color="text.secondary">
                    Our team has accepted your request.
                  </Text>
                </Box>
              </Flex>
              {formatRequest.response_message && (
                <Box bg="surface" borderRadius="lg" p={3} border="1px solid" borderColor="border.subtle">
                  <Text fontSize="xs" color="text.muted" fontWeight="medium" mb={1}>
                    Recruiter message:
                  </Text>
                  <Text fontSize="sm" color="text.secondary">
                    {formatRequest.response_message}
                  </Text>
                </Box>
              )}
            </Stack>
          </Box>
        )}

        {formatRequest && formatRequest.status === "denied" && (
          <Box bg="error.subtle" borderRadius="xl" border="1px solid" borderColor="error.muted" px={5} py={4}>
            <Stack gap={3}>
              <Flex gap={3} align="center">
                <Circle size="32px" bg="error.muted" color="error">
                  <X size={18} />
                </Circle>
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color="text">
                    Alternative format request denied
                  </Text>
                  <Text fontSize="xs" color="text.secondary">
                    You can continue with the standard format.
                  </Text>
                </Box>
              </Flex>
              {formatRequest.response_message && (
                <Box bg="surface" borderRadius="lg" p={3} border="1px solid" borderColor="border.subtle">
                  <Text fontSize="xs" color="text.muted" fontWeight="medium" mb={1}>
                    Recruiter message:
                  </Text>
                  <Text fontSize="sm" color="text.secondary">
                    {formatRequest.response_message}
                  </Text>
                </Box>
              )}
            </Stack>
          </Box>
        )}

        {/* Intro message and rules */}
        {(workSample.intro_message || (workSample.rules && workSample.rules.length > 0)) && (
          <Box bg="info.subtle" borderRadius="xl" border="1px solid" borderColor="info.muted" px={4} py={3}>
            <Stack gap={2}>
              {workSample.intro_message && (
                <Text fontSize="sm" color="info" fontWeight="medium">
                  {workSample.intro_message}
                </Text>
              )}
              {workSample.rules && workSample.rules.length > 0 && (
                <Stack gap={1}>
                  {workSample.rules.map((rule, i) => (
                    <Text key={i} fontSize="xs" color="text.secondary">
                      • {rule}
                    </Text>
                  ))}
                </Stack>
              )}
            </Stack>
          </Box>
        )}

        {/* Trust messaging */}
        <Box bg="bg.subtle" borderRadius="xl" border="1px solid" borderColor="border.subtle" px={4} py={3}>
          <Stack gap={1}>
            <Text fontSize="sm" color="text.secondary" fontWeight="medium">
              We do not ask for proprietary code. This is a neutral scenario.
            </Text>
            <Text fontSize="xs" color="text.muted">
              <strong>Reminder:</strong> Trust measures evidence, not your worth.
            </Text>
          </Stack>
        </Box>

        {/* Error message */}
        {error && (
          <Box bg="error.subtle" borderRadius="lg" border="1px solid" borderColor="error.muted" px={4} py={3}>
            <Text fontSize="sm" color="error">{error}</Text>
          </Box>
        )}

        {/* Tabs — dynamic sections */}
        <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" overflow="hidden" shadow="card">
          <Tabs.Root value={activeTab} onValueChange={(e) => handleTabChange(e.value)}>
            {/* Premium pill-style tab navigation */}
            <Flex
              bg="bg.subtle"
              px={5}
              py={3}
              gap={2}
              borderBottom="1px solid"
              borderBottomColor="border.subtle"
              overflowX="auto"
              css={{ "&::-webkit-scrollbar": { display: "none" }, scrollbarWidth: "none" }}
            >
              {sections.map((section, i) => {
                const key = sectionKeys[i];
                const isActive = activeTab === key;
                const indicator = getSectionIndicator(answers[key]);
                return (
                  <Flex
                    key={key}
                    as="button"
                    onClick={() => handleTabChange(key)}
                    align="center"
                    gap={2.5}
                    px={4}
                    py={2}
                    borderRadius="lg"
                    fontSize="sm"
                    fontWeight={isActive ? "semibold" : "medium"}
                    color={isActive ? "white" : "text.muted"}
                    bg={isActive ? "primary" : "transparent"}
                    border="1px solid"
                    borderColor={isActive ? "primary" : "transparent"}
                    cursor="pointer"
                    transition="all 0.2s"
                    _hover={{
                      bg: isActive ? "primary" : "bg.emphasized",
                      borderColor: isActive ? "primary" : "border",
                    }}
                    flexShrink={0}
                    shadow={isActive ? "sm" : "none"}
                  >
                    {/* Step number */}
                    <Circle
                      size="22px"
                      bg={isActive ? "whiteAlpha.200" : indicator === "complete" ? "success" : "bg.emphasized"}
                      color={isActive ? "white" : indicator === "complete" ? "white" : "text.muted"}
                      fontSize="xs"
                      fontWeight="bold"
                      flexShrink={0}
                    >
                      {indicator === "complete" ? (
                        <Check size={12} strokeWidth={3} />
                      ) : (
                        i + 1
                      )}
                    </Circle>
                    <Text whiteSpace="nowrap">{section.title}</Text>
                    {indicator === "partial" && (
                      <Circle size="6px" bg={isActive ? "whiteAlpha.600" : "warning"} flexShrink={0} />
                    )}
                    {section.estimated_time && (
                      <Text
                        fontSize="xs"
                        color={isActive ? "whiteAlpha.700" : "text.muted"}
                        whiteSpace="nowrap"
                        ml={-0.5}
                      >
                        {section.estimated_time}
                      </Text>
                    )}
                  </Flex>
                );
              })}
            </Flex>

            <Box p={6}>
              {sections.map((section, i) => {
                const key = sectionKeys[i];
                const rubricExpanded = expandedRubrics[key] ?? false;
                return (
                  <Tabs.Content key={key} value={key}>
                    <Stack gap={5}>
                      <Box>
                        <Heading as="h3" fontSize="md" color="text" mb={3} fontWeight="semibold">
                          {section.title}
                        </Heading>
                        {section.description && (
                          <Text color="text.secondary" fontSize="sm" lineHeight="1.7" mb={4}>
                            {section.description}
                          </Text>
                        )}
                        {section.instructions && (
                          <Text color="text.secondary" fontSize="sm" lineHeight="1.7" mb={4}>
                            {section.instructions}
                          </Text>
                        )}

                        {/* Evaluation rubric (collapsible) */}
                        {section.rubric && (
                          <Box mb={4}>
                            <Button
                              variant="ghost"
                              size="sm"
                              p={0}
                              h="auto"
                              color="text.muted"
                              fontWeight="semibold"
                              fontSize="2xs"
                              textTransform="uppercase"
                              letterSpacing="wider"
                              _hover={{ color: "text.secondary" }}
                              onClick={() => toggleRubric(key)}
                            >
                              <Flex align="center" gap={1}>
                                <Text>Evaluation rubric</Text>
                                {rubricExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </Flex>
                            </Button>
                            {rubricExpanded && (
                              <Box bg="bg.subtle" borderRadius="lg" p={4} mt={2} border="1px solid" borderColor="border.subtle">
                                <Text fontSize="xs" color="text.secondary" whiteSpace="pre-wrap">
                                  {section.rubric}
                                </Text>
                              </Box>
                            )}
                          </Box>
                        )}

                        {/* Criteria evaluated tags */}
                        {section.criteria_evaluated && section.criteria_evaluated.length > 0 && (
                          <Flex gap={2} flexWrap="wrap" mb={4}>
                            {section.criteria_evaluated.map((criterion, ci) => (
                              <Badge
                                key={ci}
                                fontSize="2xs"
                                px={2}
                                py={0.5}
                                borderRadius="md"
                                bg="bg.muted"
                                color="text.muted"
                                fontWeight="medium"
                              >
                                {criterion}
                              </Badge>
                            ))}
                          </Flex>
                        )}
                      </Box>

                      <Box>
                        <Text fontSize="2xs" fontWeight="semibold" color="text.muted" mb={2} textTransform="uppercase" letterSpacing="wider">
                          Your answer
                        </Text>
                        <Textarea
                          value={answers[key] || ""}
                          onChange={(e) => handleAnswerChange(key, e.target.value)}
                          onBlur={handleBlur}
                          placeholder="Describe your approach step by step..."
                          rows={12}
                          fontSize="sm"
                          borderColor="border"
                          _hover={{ borderColor: isEditable ? "border.emphasis" : "border" }}
                          _focus={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
                          color="text"
                          disabled={!isEditable}
                          _disabled={{ bg: "bg.subtle", cursor: "not-allowed" }}
                        />
                        {section.estimated_time_minutes > 0 && (
                          <Text fontSize="xs" color="text.muted" mt={2}>
                            Estimated time: {section.estimated_time_minutes} minutes
                          </Text>
                        )}
                      </Box>
                    </Stack>
                  </Tabs.Content>
                );
              })}
            </Box>
          </Tabs.Root>
        </Box>

        {/* CTAs (only if editable) */}
        {isEditable && (
          <Flex gap={3} pt={2}>
            <Button
              size="md"
              bg="primary"
              color="white"
              shadow="button"
              _hover={{ bg: "primary.hover", transform: "translateY(-1px)", shadow: "buttonHover" }}
              _active={{ transform: "translateY(0)" }}
              _disabled={{ opacity: 0.5, cursor: "not-allowed", transform: "none" }}
              transition="all 0.15s"
              disabled={!canSubmit()}
              onClick={() => setShowSubmitModal(true)}
              fontWeight="medium"
              px={5}
              h="44px"
            >
              Submit Work Sample
            </Button>
            {!formatRequest && (
              <Button
                size="md"
                variant="outline"
                borderColor="border"
                color="text.secondary"
                fontWeight="medium"
                _hover={{ bg: "bg.subtle", borderColor: "border.emphasis" }}
                px={4}
                h="44px"
                onClick={() => setShowFormatModal(true)}
              >
                Request alternative format
              </Button>
            )}
          </Flex>
        )}
      </Stack>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <Box
          position="fixed"
          inset={0}
          bg="blackAlpha.600"
          zIndex={100}
          display="flex"
          alignItems="center"
          justifyContent="center"
          onClick={() => setShowSubmitModal(false)}
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
                  Submit your Work Sample?
                </Heading>
                <Text fontSize="sm" color="text.secondary">
                  Once submitted, you will not be able to edit your answers.
                  Make sure you have reviewed your work.
                </Text>
              </Box>
              <Button
                variant="ghost"
                size="sm"
                p={1}
                onClick={() => setShowSubmitModal(false)}
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
                onClick={() => setShowSubmitModal(false)}
                fontWeight="medium"
              >
                Cancel
              </Button>
              <Button
                bg="primary"
                color="white"
                onClick={handleSubmit}
                disabled={isSubmitting}
                fontWeight="medium"
                _hover={{ bg: "primary.hover" }}
              >
                {isSubmitting ? (
                  <Flex align="center" gap={2}>
                    <Spinner size="xs" />
                    <Text>Submitting...</Text>
                  </Flex>
                ) : (
                  "Submit"
                )}
              </Button>
            </Flex>
          </Box>
        </Box>
      )}

      {/* Alternative Format Request Modal */}
      {showFormatModal && (
        <Box
          position="fixed"
          inset={0}
          bg="blackAlpha.600"
          zIndex={100}
          display="flex"
          alignItems="center"
          justifyContent="center"
          onClick={() => setShowFormatModal(false)}
        >
          <Box
            bg="surface"
            borderRadius="2xl"
            shadow="2xl"
            maxW="500px"
            w="90%"
            p={8}
            onClick={(e) => e.stopPropagation()}
          >
            <Flex justify="space-between" align="start" mb={6}>
              <Box>
                <Heading as="h3" fontSize="lg" fontWeight="semibold" color="text" mb={2}>
                  Request alternative format
                </Heading>
                <Text fontSize="sm" color="text.secondary">
                  We want to evaluate you fairly. If this format does not suit you,
                  tell us how you prefer to demonstrate your skills.
                </Text>
              </Box>
              <Button
                variant="ghost"
                size="sm"
                p={1}
                onClick={() => setShowFormatModal(false)}
                color="text.muted"
                _hover={{ bg: "bg.subtle" }}
              >
                <X size={18} />
              </Button>
            </Flex>

            <Stack gap={5}>
              {/* Reason select */}
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                  Reason
                </Text>
                <chakra.select
                  value={formatReason}
                  onChange={(e) => setFormatReason(e.target.value as FormatRequestReason)}
                  w="100%"
                  p={3}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="border"
                  bg="surface"
                  fontSize="sm"
                  color="text"
                  _hover={{ borderColor: "border.emphasis" }}
                  _focus={{ borderColor: "primary", outline: "none" }}
                >
                  <option value="">Select a reason...</option>
                  <option value="oral">I prefer to express myself orally</option>
                  <option value="more_time">I need more time</option>
                  <option value="accessibility">Accessibility</option>
                  <option value="other">Other</option>
                </chakra.select>
              </Box>

              {/* Preferred format select */}
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                  Preferred format
                </Text>
                <chakra.select
                  value={formatPreference}
                  onChange={(e) => setFormatPreference(e.target.value as FormatRequestPreference)}
                  w="100%"
                  p={3}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="border"
                  bg="surface"
                  fontSize="sm"
                  color="text"
                  _hover={{ borderColor: "border.emphasis" }}
                  _focus={{ borderColor: "primary", outline: "none" }}
                >
                  <option value="">Select a format...</option>
                  <option value="video_call">20-minute video call</option>
                  <option value="google_docs">Google Docs</option>
                  <option value="multi_step">Multi-step questions</option>
                  <option value="other">Other (specify)</option>
                </chakra.select>
              </Box>

              {/* Comment */}
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                  Comment <Text as="span" color="text.muted" fontWeight="normal">(optional)</Text>
                </Text>
                <Textarea
                  value={formatComment}
                  onChange={(e) => setFormatComment(e.target.value)}
                  placeholder="Specify your request if needed..."
                  rows={3}
                  fontSize="sm"
                  borderColor="border"
                  _hover={{ borderColor: "border.emphasis" }}
                  _focus={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
                />
              </Box>

              <Flex gap={3} justify="flex-end" pt={2}>
                <Button
                  variant="outline"
                  borderColor="border"
                  color="text.secondary"
                  onClick={() => setShowFormatModal(false)}
                  fontWeight="medium"
                >
                  Cancel
                </Button>
                <Button
                  bg="primary"
                  color="white"
                  onClick={handleFormatRequest}
                  disabled={isRequestingFormat || !formatReason || !formatPreference}
                  fontWeight="medium"
                  _hover={{ bg: "primary.hover" }}
                >
                  {isRequestingFormat ? (
                    <Flex align="center" gap={2}>
                      <Spinner size="xs" />
                      <Text>Sending...</Text>
                    </Flex>
                  ) : (
                    "Send request"
                  )}
                </Button>
              </Flex>
            </Stack>
          </Box>
        </Box>
      )}
    </Box>
  );
}
