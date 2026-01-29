import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
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
} from "@chakra-ui/react";
import {
  saveWorkSampleAttempt,
  submitWorkSampleAttempt,
  requestAlternativeFormat,
  type WorkSampleAttempt,
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
    return { attempt: null as WorkSampleAttempt | null, format_request: null as FormatRequest | null };
  }
  const data = await res.json();
  return {
    attempt: data.attempt as WorkSampleAttempt | null,
    format_request: (data.format_request || null) as FormatRequest | null,
  };
}

// Section IDs
const SECTION_DEBUG = "debug_perf";
const SECTION_DESIGN = "async_design";

// Icons
function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function AlertCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// Helper to format relative time
function formatRelativeTime(dateString?: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "à l'instant";
  if (diffMins === 1) return "il y a 1 minute";
  if (diffMins < 60) return `il y a ${diffMins} minutes`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return "il y a 1 heure";
  if (diffHours < 24) return `il y a ${diffHours} heures`;

  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// Calculate progress based on answers
function calculateProgress(answers: Record<string, string>): number {
  const sections = [SECTION_DEBUG, SECTION_DESIGN];
  let completedSections = 0;

  for (const section of sections) {
    const answer = answers[section];
    if (answer && answer.trim().length >= 50) {
      completedSections++;
    }
  }

  return Math.round((completedSections / sections.length) * 100);
}

// Get section indicator status
function getSectionIndicator(answer: string | undefined): "empty" | "partial" | "complete" {
  if (!answer || answer.trim().length === 0) return "empty";
  if (answer.trim().length >= 50) return "complete";
  return "partial";
}

export default function WorkSample({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();

  // Initialize from loader
  const [attempt, setAttempt] = useState<WorkSampleAttempt | null>(loaderData.attempt);
  const [formatRequest, setFormatRequest] = useState<FormatRequest | null>(loaderData.format_request);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Local answers state (for optimistic updates)
  const initialAnswers = loaderData.attempt?.answers || {
    [SECTION_DEBUG]: "",
    [SECTION_DESIGN]: "",
  };
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);

  // Track if content has changed since last save
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Refs for auto-save
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedAnswersRef = useRef<string>(JSON.stringify(initialAnswers));

  // Modal states
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showFormatModal, setShowFormatModal] = useState(false);

  // Format request form state
  const [formatReason, setFormatReason] = useState<FormatRequestReason | "">("");
  const [formatPreference, setFormatPreference] = useState<FormatRequestPreference | "">("");
  const [formatComment, setFormatComment] = useState("");
  const [isRequestingFormat, setIsRequestingFormat] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState(SECTION_DEBUG);

  // Auto-save function
  const saveProgress = useCallback(async (silent = false) => {
    if (!attempt || !attempt.id) return;
    if (attempt.status === "submitted" || attempt.status === "reviewed") return;

    const currentAnswersJson = JSON.stringify(answers);
    if (currentAnswersJson === lastSavedAnswersRef.current) {
      // No changes to save
      return;
    }

    if (!silent) {
      setIsSaving(true);
      setSaveStatus("saving");
    }

    try {
      const progress = calculateProgress(answers);
      const response = await saveWorkSampleAttempt(attempt.id, {
        answers,
        progress,
      });

      setAttempt(response.attempt);
      lastSavedAnswersRef.current = currentAnswersJson;
      setHasUnsavedChanges(false);
      setSaveStatus("saved");

      // Reset save status after 3 seconds
      setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
    } catch (err) {
      setSaveStatus("error");
      if (!silent) {
        setError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
      }
    } finally {
      if (!silent) {
        setIsSaving(false);
      }
    }
  }, [attempt, answers]);

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
  const handleAnswerChange = (sectionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [sectionId]: value,
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

      // Redirect to proof profile after submission
      navigate("/app/proof-profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la soumission");
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

      // Reset form
      setFormatReason("");
      setFormatPreference("");
      setFormatComment("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la demande");
    } finally {
      setIsRequestingFormat(false);
    }
  };

  // Check if can submit
  const canSubmit = () => {
    const debugAnswer = answers[SECTION_DEBUG] || "";
    const designAnswer = answers[SECTION_DESIGN] || "";
    return debugAnswer.trim().length > 0 || designAnswer.trim().length > 0;
  };

  // Check if attempt is editable
  const isEditable = attempt?.status === "draft" || attempt?.status === "in_progress";

  // Calculate progress
  const progress = calculateProgress(answers);

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
                  Durée estimée : ~45 minutes. Vous pouvez faire des pauses.
                </Text>
              </Box>

              {/* Status Badge */}
              <Flex gap={3} align="center">
                {/* Save status indicator */}
                {saveStatus === "saving" && (
                  <Flex align="center" gap={2} color="text.muted">
                    <Spinner size="xs" />
                    <Text fontSize="xs">Sauvegarde...</Text>
                  </Flex>
                )}
                {saveStatus === "saved" && (
                  <Flex align="center" gap={2} color="success">
                    <CheckIcon />
                    <Text fontSize="xs">Sauvegardé {formatRelativeTime(attempt?.last_saved_at)}</Text>
                  </Flex>
                )}
                {saveStatus === "error" && (
                  <Flex align="center" gap={2} color="error">
                    <AlertCircleIcon />
                    <Text fontSize="xs">Erreur de sauvegarde</Text>
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
                  {attempt?.status === "draft" && "Brouillon"}
                  {attempt?.status === "in_progress" && "En cours"}
                  {attempt?.status === "submitted" && "Soumis"}
                  {attempt?.status === "reviewed" && "Évalué"}
                </Badge>
              </Flex>
            </Flex>

            {/* Progress Bar */}
            <Stack gap={2}>
              <Flex justify="space-between" align="center">
                <Text fontSize="xs" color="text.muted" fontWeight="medium">
                  Progression
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
                  <SaveIcon />
                  <Text>Sauvegarder</Text>
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
                <LockIcon />
              </Circle>
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color="text">
                  Work Sample soumis
                </Text>
                <Text fontSize="xs" color="text.secondary">
                  Soumis le {attempt?.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }) : ""}. Votre Proof Profile est en cours de génération.
                </Text>
              </Box>
            </Flex>
          </Box>
        )}

        {/* Format request pending banner */}
        {formatRequest && formatRequest.status === "pending" && (
          <Box bg="warning.subtle" borderRadius="xl" border="1px solid" borderColor="warning.muted" px={5} py={4}>
            <Flex gap={3} align="center">
              <Circle size="32px" bg="warning.muted" color="warning">
                <AlertCircleIcon />
              </Circle>
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color="text">
                  Demande de format alternatif en cours
                </Text>
                <Text fontSize="xs" color="text.secondary">
                  Nous reviendrons vers vous sous 48h.
                </Text>
              </Box>
            </Flex>
          </Box>
        )}

        {/* Format request approved banner */}
        {formatRequest && formatRequest.status === "approved" && (
          <Box bg="success.subtle" borderRadius="xl" border="1px solid" borderColor="success.muted" px={5} py={4}>
            <Stack gap={3}>
              <Flex gap={3} align="center">
                <Circle size="32px" bg="success.muted" color="success">
                  <CheckIcon />
                </Circle>
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color="text">
                    Demande de format alternatif approuvée
                  </Text>
                  <Text fontSize="xs" color="text.secondary">
                    Notre équipe a accepté votre demande.
                  </Text>
                </Box>
              </Flex>
              {formatRequest.response_message && (
                <Box bg="surface" borderRadius="lg" p={3} border="1px solid" borderColor="border.subtle">
                  <Text fontSize="xs" color="text.muted" fontWeight="medium" mb={1}>
                    Message du recruteur :
                  </Text>
                  <Text fontSize="sm" color="text.secondary">
                    {formatRequest.response_message}
                  </Text>
                </Box>
              )}
            </Stack>
          </Box>
        )}

        {/* Format request denied banner */}
        {formatRequest && formatRequest.status === "denied" && (
          <Box bg="error.subtle" borderRadius="xl" border="1px solid" borderColor="error.muted" px={5} py={4}>
            <Stack gap={3}>
              <Flex gap={3} align="center">
                <Circle size="32px" bg="error.muted" color="error">
                  <CloseIcon />
                </Circle>
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color="text">
                    Demande de format alternatif refusée
                  </Text>
                  <Text fontSize="xs" color="text.secondary">
                    Vous pouvez continuer avec le format standard.
                  </Text>
                </Box>
              </Flex>
              {formatRequest.response_message && (
                <Box bg="surface" borderRadius="lg" p={3} border="1px solid" borderColor="border.subtle">
                  <Text fontSize="xs" color="text.muted" fontWeight="medium" mb={1}>
                    Message du recruteur :
                  </Text>
                  <Text fontSize="sm" color="text.secondary">
                    {formatRequest.response_message}
                  </Text>
                </Box>
              )}
            </Stack>
          </Box>
        )}

        {/* Trust messaging */}
        <Box bg="info.subtle" borderRadius="xl" border="1px solid" borderColor="info.muted" px={4} py={3}>
          <Stack gap={1}>
            <Text fontSize="sm" color="info" fontWeight="medium">
              Nous ne vous demandons pas de code propriétaire. C'est un scénario neutre.
            </Text>
            <Text fontSize="xs" color="text.secondary">
              <strong>Rappel :</strong> La confiance mesure les preuves, pas votre valeur.
            </Text>
          </Stack>
        </Box>

        {/* Error message */}
        {error && (
          <Box bg="error.subtle" borderRadius="lg" border="1px solid" borderColor="error.muted" px={4} py={3}>
            <Text fontSize="sm" color="error">{error}</Text>
          </Box>
        )}

        {/* Tabs */}
        <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" overflow="hidden" shadow="card">
          <Tabs.Root value={activeTab} onValueChange={(e) => handleTabChange(e.value)}>
            <Tabs.List bg="bg.subtle" px={5} borderBottom="1px solid" borderBottomColor="border.subtle">
              <Tabs.Trigger
                value={SECTION_DEBUG}
                px={4}
                py={3}
                fontSize="sm"
                fontWeight="medium"
                color="text.muted"
                _selected={{ color: "text", borderBottomColor: "primary" }}
              >
                <Flex align="center" gap={2}>
                  <Text>Debug/Perf</Text>
                  {getSectionIndicator(answers[SECTION_DEBUG]) === "complete" && (
                    <Circle size="16px" bg="success" color="white">
                      <CheckIcon />
                    </Circle>
                  )}
                  {getSectionIndicator(answers[SECTION_DEBUG]) === "partial" && (
                    <Circle size="8px" bg="warning" />
                  )}
                </Flex>
              </Tabs.Trigger>
              <Tabs.Trigger
                value={SECTION_DESIGN}
                px={4}
                py={3}
                fontSize="sm"
                fontWeight="medium"
                color="text.muted"
                _selected={{ color: "text", borderBottomColor: "primary" }}
              >
                <Flex align="center" gap={2}>
                  <Text>Async design</Text>
                  {getSectionIndicator(answers[SECTION_DESIGN]) === "complete" && (
                    <Circle size="16px" bg="success" color="white">
                      <CheckIcon />
                    </Circle>
                  )}
                  {getSectionIndicator(answers[SECTION_DESIGN]) === "partial" && (
                    <Circle size="8px" bg="warning" />
                  )}
                </Flex>
              </Tabs.Trigger>
              <Tabs.Indicator bg="primary" />
            </Tabs.List>

            <Box p={6}>
              {/* Debug/Perf Tab */}
              <Tabs.Content value={SECTION_DEBUG}>
                <Stack gap={5}>
                  <Box>
                    <Heading as="h3" fontSize="md" color="text" mb={3} fontWeight="semibold">
                      Scénario : Investigation de performance
                    </Heading>
                    <Text color="text.secondary" fontSize="sm" lineHeight="1.7" mb={4}>
                      Un service Go qui traite les requêtes utilisateurs présente des pics de latence P95 au-dessus
                      de 500ms. La P50 est stable à 50ms. Vous avez accès aux données de profilage et aux logs.
                      Décrivez votre approche d'investigation.
                    </Text>

                    <Box bg="bg.subtle" borderRadius="lg" p={4} mb={4} border="1px solid" borderColor="border.subtle">
                      <Text fontSize="2xs" fontWeight="semibold" color="text.muted" mb={2} textTransform="uppercase" letterSpacing="wider">
                        Ce qu'on évalue (grille)
                      </Text>
                      <Stack gap={1.5} fontSize="xs" color="text.secondary">
                        <Text>• Approche de debugging systématique (pas de devinettes)</Text>
                        <Text>• Compréhension des patterns de performance Go</Text>
                        <Text>• Utilisation des outils (profiling, tracing)</Text>
                        <Text>• Communication des découvertes</Text>
                      </Stack>
                    </Box>
                  </Box>

                  <Box>
                    <Text fontSize="2xs" fontWeight="semibold" color="text.muted" mb={2} textTransform="uppercase" letterSpacing="wider">
                      Votre réponse
                    </Text>
                    <Textarea
                      value={answers[SECTION_DEBUG] || ""}
                      onChange={(e) => handleAnswerChange(SECTION_DEBUG, e.target.value)}
                      onBlur={handleBlur}
                      placeholder="Décrivez votre approche d'investigation étape par étape..."
                      rows={12}
                      fontSize="sm"
                      borderColor="border"
                      _hover={{ borderColor: isEditable ? "border.emphasis" : "border" }}
                      _focus={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
                      color="text"
                      disabled={!isEditable}
                      _disabled={{ bg: "bg.subtle", cursor: "not-allowed" }}
                    />
                    <Text fontSize="xs" color="text.muted" mt={2}>
                      Temps estimé : 20-25 minutes
                    </Text>
                  </Box>
                </Stack>
              </Tabs.Content>

              {/* Async Design Tab */}
              <Tabs.Content value={SECTION_DESIGN}>
                <Stack gap={5}>
                  <Box>
                    <Heading as="h3" fontSize="md" color="text" mb={3} fontWeight="semibold">
                      Scénario : Traitement d'événements asynchrone
                    </Heading>
                    <Text color="text.secondary" fontSize="sm" lineHeight="1.7" mb={4}>
                      Concevez un système pour traiter des événements utilisateur de manière asynchrone.
                      Les événements arrivent à 10k/sec, le traitement prend 100-500ms chacun, l'ordre n'a pas
                      d'importance, mais vous avez besoin d'une livraison "at-least-once" et de monitoring.
                    </Text>

                    <Box bg="bg.subtle" borderRadius="lg" p={4} mb={4} border="1px solid" borderColor="border.subtle">
                      <Text fontSize="2xs" fontWeight="semibold" color="text.muted" mb={2} textTransform="uppercase" letterSpacing="wider">
                        Ce qu'on évalue (grille)
                      </Text>
                      <Stack gap={1.5} fontSize="xs" color="text.secondary">
                        <Text>• Trade-offs de conception système</Text>
                        <Text>• Considérations de scalabilité</Text>
                        <Text>• Stratégie de gestion d'erreurs</Text>
                        <Text>• Monitoring & observabilité</Text>
                      </Stack>
                    </Box>
                  </Box>

                  <Box>
                    <Text fontSize="2xs" fontWeight="semibold" color="text.muted" mb={2} textTransform="uppercase" letterSpacing="wider">
                      Votre réponse
                    </Text>
                    <Textarea
                      value={answers[SECTION_DESIGN] || ""}
                      onChange={(e) => handleAnswerChange(SECTION_DESIGN, e.target.value)}
                      onBlur={handleBlur}
                      placeholder="Décrivez votre conception système, architecture, et les trade-offs clés..."
                      rows={12}
                      fontSize="sm"
                      borderColor="border"
                      _hover={{ borderColor: isEditable ? "border.emphasis" : "border" }}
                      _focus={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
                      color="text"
                      disabled={!isEditable}
                      _disabled={{ bg: "bg.subtle", cursor: "not-allowed" }}
                    />
                    <Text fontSize="xs" color="text.muted" mt={2}>
                      Temps estimé : 20-25 minutes
                    </Text>
                  </Box>
                </Stack>
              </Tabs.Content>
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
              Soumettre le Work Sample
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
                Demander un format alternatif
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
                  Soumettre votre Work Sample ?
                </Heading>
                <Text fontSize="sm" color="text.secondary">
                  Une fois soumis, vous ne pourrez plus modifier vos réponses.
                  Assurez-vous d'avoir relu votre travail.
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
                <CloseIcon />
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
                Annuler
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
                    <Text>Soumission...</Text>
                  </Flex>
                ) : (
                  "Soumettre définitivement"
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
                  Demander un format alternatif
                </Heading>
                <Text fontSize="sm" color="text.secondary">
                  Nous voulons vous évaluer équitablement. Si ce format ne vous convient pas,
                  dites-nous comment vous préférez démontrer vos compétences.
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
                <CloseIcon />
              </Button>
            </Flex>

            <Stack gap={5}>
              {/* Reason select */}
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                  Raison
                </Text>
                <Box
                  as="select"
                  value={formatReason}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormatReason(e.target.value as FormatRequestReason)}
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
                  <option value="">Sélectionnez une raison...</option>
                  <option value="oral">Je préfère m'exprimer à l'oral</option>
                  <option value="more_time">J'ai besoin de plus de temps</option>
                  <option value="accessibility">Accessibilité</option>
                  <option value="other">Autre</option>
                </Box>
              </Box>

              {/* Preferred format select */}
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                  Format souhaité
                </Text>
                <Box
                  as="select"
                  value={formatPreference}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormatPreference(e.target.value as FormatRequestPreference)}
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
                  <option value="">Sélectionnez un format...</option>
                  <option value="video_call">Appel vidéo de 20 minutes</option>
                  <option value="google_docs">Document Google Docs</option>
                  <option value="multi_step">Questions en plusieurs étapes</option>
                  <option value="other">Autre (préciser)</option>
                </Box>
              </Box>

              {/* Comment */}
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                  Commentaire <Text as="span" color="text.muted" fontWeight="normal">(optionnel)</Text>
                </Text>
                <Textarea
                  value={formatComment}
                  onChange={(e) => setFormatComment(e.target.value)}
                  placeholder="Précisez votre demande si nécessaire..."
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
                  Annuler
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
                      <Text>Envoi...</Text>
                    </Flex>
                  ) : (
                    "Envoyer la demande"
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
