import { useCallback, useEffect, useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Stack,
  Text,
  Textarea,
  Input,
} from "@chakra-ui/react";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  HelpCircle,
  Plus,
  Trash2,
  Send,
  Save,
} from "lucide-react";
import { useFetcher, useNavigate } from "react-router";

import type { Route } from "./+types/_app.jobs.$id.candidates.$candidateId.decision";
import { requireRole } from "~/components/lib/auth.server";
import { authenticatedFetch } from "~/components/lib/api.server";
import type {
  DecisionMemo,
  DecisionType,
  PostInterviewEvaluation,
  IdentifiedRisk,
} from "~/components/lib/api";

// =============================================================================
// Types
// =============================================================================

interface CandidateInfo {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

interface JobInfo {
  id: string;
  title: string;
}

// =============================================================================
// Loader
// =============================================================================

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireRole(request, ["recruiter", "admin"]);

  const res = await authenticatedFetch(
    request,
    `/api/v1/jobs/${params.id}/candidates/${params.candidateId}/decision-memo`,
  );

  if (!res.ok) {
    return {
      memo: null as DecisionMemo | null,
      candidate: null as CandidateInfo | null,
      job: null as JobInfo | null,
      error: "Decision Memo non disponible",
    };
  }

  const data = await res.json();
  return {
    memo: data.decision_memo as DecisionMemo,
    candidate: data.candidate as CandidateInfo,
    job: data.job as JobInfo,
    error: null as string | null,
  };
}

// =============================================================================
// Action
// =============================================================================

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "save") {
    const payload = formData.get("payload") as string;
    const res = await authenticatedFetch(
      request,
      `/api/v1/jobs/${params.id}/candidates/${params.candidateId}/decision-memo`,
      {
        method: "PATCH",
        body: payload,
      },
    );
    if (!res.ok) {
      return { error: "Erreur lors de la sauvegarde" };
    }
    const data = await res.json();
    return { ok: true, memo: data.decision_memo };
  }

  if (intent === "submit") {
    const res = await authenticatedFetch(
      request,
      `/api/v1/jobs/${params.id}/candidates/${params.candidateId}/decision-memo/submit`,
      { method: "POST" },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.error || "Erreur lors de la soumission" };
    }
    const data = await res.json();
    return { ok: true, submitted: true, memo: data.decision_memo };
  }

  return { error: "Action inconnue" };
}

// =============================================================================
// Component
// =============================================================================

export default function DecisionMemoPage({
  loaderData,
}: Route.ComponentProps) {
  const { memo: initialMemo, candidate, job, error } = loaderData;
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Local state
  const [decision, setDecision] = useState<DecisionType>(
    initialMemo?.decision || "pending",
  );
  const [evaluations, setEvaluations] = useState<PostInterviewEvaluation[]>(
    initialMemo?.post_interview_evaluations || [],
  );
  const [confirmedStrengths, setConfirmedStrengths] = useState<string[]>(
    initialMemo?.confirmed_strengths || [],
  );
  const [identifiedRisks, setIdentifiedRisks] = useState<IdentifiedRisk[]>(
    initialMemo?.identified_risks || [],
  );
  const [justification, setJustification] = useState(
    initialMemo?.justification || "",
  );
  const [nextSteps, setNextSteps] = useState<Record<string, string>>(
    initialMemo?.next_steps || {},
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isSubmitted = initialMemo?.status === "submitted";

  // Handle submit response
  useEffect(() => {
    if (fetcher.data && typeof fetcher.data === "object") {
      const data = fetcher.data as Record<string, unknown>;
      if (data.submitted) {
        navigate(
          `/app/jobs/${job?.id}/candidates/${candidate?.id}`,
        );
      }
      if (data.error) {
        setSubmitError(data.error as string);
      }
    }
  }, [fetcher.data, navigate, job?.id, candidate?.id]);

  // Debounced auto-save
  const autoSave = useCallback(
    (payload: Record<string, unknown>) => {
      if (isSubmitted) return;
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(() => {
        fetcher.submit(
          { intent: "save", payload: JSON.stringify(payload) },
          { method: "POST" },
        );
      }, 1500);
    },
    [fetcher, isSubmitted],
  );

  // Change handlers with auto-save
  const handleDecisionChange = (d: DecisionType) => {
    setDecision(d);
    autoSave({ decision: d });
  };

  const handleEvalChange = (
    index: number,
    field: "post_interview_score" | "notes",
    value: string | number,
  ) => {
    const updated = [...evaluations];
    updated[index] = { ...updated[index], [field]: value };
    setEvaluations(updated);
    autoSave({ post_interview_evaluations: updated });
  };

  const handleStrengthToggle = (name: string) => {
    const updated = confirmedStrengths.includes(name)
      ? confirmedStrengths.filter((s) => s !== name)
      : [...confirmedStrengths, name];
    setConfirmedStrengths(updated);
    autoSave({ confirmed_strengths: updated });
  };

  const handleAddRisk = () => {
    const updated = [...identifiedRisks, { risk: "", mitigation: "" }];
    setIdentifiedRisks(updated);
  };

  const handleRiskChange = (
    index: number,
    field: "risk" | "mitigation",
    value: string,
  ) => {
    const updated = [...identifiedRisks];
    updated[index] = { ...updated[index], [field]: value };
    setIdentifiedRisks(updated);
    autoSave({ identified_risks: updated });
  };

  const handleRemoveRisk = (index: number) => {
    const updated = identifiedRisks.filter((_, i) => i !== index);
    setIdentifiedRisks(updated);
    autoSave({ identified_risks: updated });
  };

  const handleJustificationChange = (value: string) => {
    setJustification(value);
    autoSave({ justification: value });
  };

  const handleNextStepsChange = (key: string, value: string) => {
    const updated = { ...nextSteps, [key]: value };
    setNextSteps(updated);
    autoSave({ next_steps: updated });
  };

  const handleSubmit = () => {
    setSubmitError(null);
    fetcher.submit({ intent: "submit" }, { method: "POST" });
  };

  const canSubmit =
    decision !== "pending" && justification.trim().length > 0 && !isSubmitted;

  // =============================================================================
  // Render
  // =============================================================================

  if (error || !initialMemo) {
    return (
      <Box py={{ base: 4, md: 8 }} px={{ base: 4, md: 8 }} maxW="900px" mx="auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          mb={4}
          color="text.secondary"
        >
          <ArrowLeft size={16} />
          <Text ml={1}>Retour</Text>
        </Button>
        <Box bg="error.subtle" borderRadius="lg" p={6} textAlign="center">
          <Text color="error" fontWeight="medium">
            {error || "Decision Memo non disponible"}
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      py={{ base: 4, md: 8 }}
      px={{ base: 4, md: 8 }}
      maxW="900px"
      mx="auto"
    >
      <Stack gap={6}>
        {/* Header */}
        <Box>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              navigate(
                `/app/jobs/${job?.id}/candidates/${candidate?.id}`,
              )
            }
            mb={4}
            color="text.secondary"
          >
            <ArrowLeft size={16} />
            <Text ml={1}>Retour au profil</Text>
          </Button>

          <Flex
            align={{ base: "start", md: "center" }}
            justify="space-between"
            direction={{ base: "column", md: "row" }}
            gap={3}
          >
            <Box>
              <Heading as="h1" fontSize={{ base: "xl", md: "2xl" }} color="text">
                Decision Memo
              </Heading>
              <Text fontSize="sm" color="text.secondary" mt={1}>
                {candidate?.name || candidate?.email} &middot; {job?.title}
              </Text>
            </Box>
            <Flex align="center" gap={2}>
              {fetcher.state !== "idle" && (
                <Text fontSize="xs" color="text.muted">
                  <Save size={12} style={{ display: "inline", marginRight: 4 }} />
                  Sauvegarde...
                </Text>
              )}
              {isSubmitted ? (
                <Badge bg="success.subtle" color="success" px={3} py={1}>
                  Soumis
                </Badge>
              ) : (
                <Badge bg="warning.subtle" color="warning" px={3} py={1}>
                  Brouillon
                </Badge>
              )}
            </Flex>
          </Flex>
        </Box>

        {/* Section 1: Decision */}
        <SectionCard title="1. Decision" icon={<CheckCircle size={18} />}>
          <Flex gap={3} wrap="wrap">
            {(
              [
                {
                  value: "hire" as DecisionType,
                  label: "Recruter",
                  icon: <CheckCircle size={16} />,
                  bg: "success",
                },
                {
                  value: "no_hire" as DecisionType,
                  label: "Ne pas recruter",
                  icon: <XCircle size={16} />,
                  bg: "error",
                },
                {
                  value: "need_more_info" as DecisionType,
                  label: "Besoin d'infos",
                  icon: <HelpCircle size={16} />,
                  bg: "warning",
                },
              ] as const
            ).map((opt) => (
              <Button
                key={opt.value}
                size="sm"
                variant={decision === opt.value ? "solid" : "outline"}
                bg={decision === opt.value ? `${opt.bg}.subtle` : undefined}
                color={decision === opt.value ? opt.bg : "text.secondary"}
                borderColor={
                  decision === opt.value ? opt.bg : "border"
                }
                border="1px solid"
                _hover={{
                  bg: `${opt.bg}.subtle`,
                  color: opt.bg,
                  borderColor: opt.bg,
                }}
                onClick={() => handleDecisionChange(opt.value)}
                disabled={isSubmitted}
                fontWeight="medium"
              >
                <Flex align="center" gap={1.5}>
                  {opt.icon}
                  <Text>{opt.label}</Text>
                </Flex>
              </Button>
            ))}
          </Flex>
        </SectionCard>

        {/* Section 2: Post-interview evaluations */}
        {evaluations.length > 0 && (
          <SectionCard title="2. Evaluation post-entretien">
            <Stack gap={4}>
              {evaluations.map((ev, i) => (
                <Box
                  key={i}
                  bg="bg.subtle"
                  borderRadius="lg"
                  p={4}
                  border="1px solid"
                  borderColor="border.subtle"
                >
                  <Flex
                    align={{ base: "start", sm: "center" }}
                    justify="space-between"
                    mb={3}
                    direction={{ base: "column", sm: "row" }}
                    gap={2}
                  >
                    <Text fontSize="sm" fontWeight="semibold" color="text">
                      {ev.criterion_name}
                    </Text>
                    <Flex align="center" gap={3}>
                      <Flex align="center" gap={1}>
                        <Text fontSize="xs" color="text.muted">
                          Pre:
                        </Text>
                        <Badge
                          bg="bg.muted"
                          color="text.secondary"
                          fontSize="xs"
                        >
                          {ev.pre_interview_score}/100
                        </Badge>
                      </Flex>
                      <Flex align="center" gap={1}>
                        <Text fontSize="xs" color="text.muted">
                          Post:
                        </Text>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={ev.post_interview_score}
                          onChange={(e) =>
                            handleEvalChange(
                              i,
                              "post_interview_score",
                              parseInt(e.target.value) || 0,
                            )
                          }
                          disabled={isSubmitted}
                          w="60px"
                          px={2}
                          py={1}
                          fontSize="xs"
                          fontWeight="semibold"
                          borderRadius="md"
                          border="1px solid"
                          borderColor="border"
                          bg="surface"
                          color="text"
                          textAlign="center"
                          _focus={{ borderColor: "primary", outline: "none" }}
                        />
                      </Flex>
                    </Flex>
                  </Flex>
                  <Textarea
                    placeholder="Notes post-entretien..."
                    value={ev.notes}
                    onChange={(e) =>
                      handleEvalChange(i, "notes", e.target.value)
                    }
                    disabled={isSubmitted}
                    fontSize="sm"
                    rows={2}
                    bg="surface"
                    border="1px solid"
                    borderColor="border"
                    _focus={{ borderColor: "primary" }}
                  />
                </Box>
              ))}
            </Stack>
          </SectionCard>
        )}

        {/* Section 3: Confirmed strengths */}
        {evaluations.length > 0 && (
          <SectionCard title="3. Forces confirmees">
            <Flex gap={2} wrap="wrap">
              {evaluations.map((ev) => {
                const isSelected = confirmedStrengths.includes(
                  ev.criterion_name,
                );
                return (
                  <Button
                    key={ev.criterion_name}
                    size="xs"
                    variant={isSelected ? "solid" : "outline"}
                    bg={isSelected ? "success.subtle" : undefined}
                    color={isSelected ? "success" : "text.secondary"}
                    borderColor={isSelected ? "success" : "border"}
                    border="1px solid"
                    _hover={{
                      bg: "success.subtle",
                      color: "success",
                    }}
                    onClick={() => handleStrengthToggle(ev.criterion_name)}
                    disabled={isSubmitted}
                    fontWeight="medium"
                    px={3}
                  >
                    {isSelected && <CheckCircle size={12} />}
                    <Text ml={isSelected ? 1 : 0}>{ev.criterion_name}</Text>
                  </Button>
                );
              })}
            </Flex>
          </SectionCard>
        )}

        {/* Section 4: Identified risks */}
        <SectionCard title="4. Risques identifies">
          <Stack gap={3}>
            {identifiedRisks.map((risk, i) => (
              <Box
                key={i}
                bg="bg.subtle"
                borderRadius="lg"
                p={4}
                border="1px solid"
                borderColor="border.subtle"
              >
                <Flex justify="space-between" align="start" mb={2}>
                  <Text fontSize="xs" fontWeight="semibold" color="error">
                    Risque {i + 1}
                  </Text>
                  {!isSubmitted && (
                    <Button
                      size="xs"
                      variant="ghost"
                      color="text.muted"
                      _hover={{ color: "error" }}
                      onClick={() => handleRemoveRisk(i)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </Flex>
                <Stack gap={2}>
                  <Textarea
                    placeholder="Decrivez le risque..."
                    value={risk.risk}
                    onChange={(e) =>
                      handleRiskChange(i, "risk", e.target.value)
                    }
                    disabled={isSubmitted}
                    fontSize="sm"
                    rows={2}
                    bg="surface"
                    border="1px solid"
                    borderColor="border"
                    _focus={{ borderColor: "primary" }}
                  />
                  <Textarea
                    placeholder="Strategie de mitigation..."
                    value={risk.mitigation}
                    onChange={(e) =>
                      handleRiskChange(i, "mitigation", e.target.value)
                    }
                    disabled={isSubmitted}
                    fontSize="sm"
                    rows={2}
                    bg="surface"
                    border="1px solid"
                    borderColor="border"
                    _focus={{ borderColor: "primary" }}
                  />
                </Stack>
              </Box>
            ))}
            {!isSubmitted && (
              <Button
                size="sm"
                variant="outline"
                borderColor="border"
                color="text.secondary"
                _hover={{ bg: "bg.subtle" }}
                onClick={handleAddRisk}
              >
                <Plus size={14} />
                <Text ml={1}>Ajouter un risque</Text>
              </Button>
            )}
          </Stack>
        </SectionCard>

        {/* Section 6: Justification */}
        <SectionCard title="5. Justification">
          <Textarea
            placeholder="Justifiez votre decision..."
            value={justification}
            onChange={(e) => handleJustificationChange(e.target.value)}
            disabled={isSubmitted}
            fontSize="sm"
            rows={4}
            bg="surface"
            border="1px solid"
            borderColor="border"
            _focus={{ borderColor: "primary" }}
          />
          {decision !== "pending" && justification.trim().length === 0 && (
            <Text fontSize="xs" color="error" mt={1}>
              La justification est obligatoire pour soumettre
            </Text>
          )}
        </SectionCard>

        {/* Section 7: Next steps */}
        {decision !== "pending" && (
          <SectionCard title="6. Prochaines etapes">
            {decision === "hire" && (
              <Stack gap={3}>
                <Box>
                  <Text fontSize="xs" fontWeight="semibold" color="text.secondary" mb={1}>
                    Date de debut souhaitee
                  </Text>
                  <Input
                    type="text"
                    placeholder="Ex: 1er mars 2025"
                    value={nextSteps.start_date || ""}
                    onChange={(e) =>
                      handleNextStepsChange("start_date", e.target.value)
                    }
                    disabled={isSubmitted}
                    w="100%"
                    px={3}
                    py={2}
                    fontSize="sm"
                    borderRadius="md"
                    border="1px solid"
                    borderColor="border"
                    bg="surface"
                    color="text"
                    _focus={{ borderColor: "primary", outline: "none" }}
                  />
                </Box>
                <Box>
                  <Text fontSize="xs" fontWeight="semibold" color="text.secondary" mb={1}>
                    Offre salariale proposee
                  </Text>
                  <Input
                    type="text"
                    placeholder="Ex: 55 000 EUR/an"
                    value={nextSteps.salary_offer || ""}
                    onChange={(e) =>
                      handleNextStepsChange("salary_offer", e.target.value)
                    }
                    disabled={isSubmitted}
                    w="100%"
                    px={3}
                    py={2}
                    fontSize="sm"
                    borderRadius="md"
                    border="1px solid"
                    borderColor="border"
                    bg="surface"
                    color="text"
                    _focus={{ borderColor: "primary", outline: "none" }}
                  />
                </Box>
              </Stack>
            )}
            {decision === "no_hire" && (
              <Box>
                <Text fontSize="xs" fontWeight="semibold" color="text.secondary" mb={1}>
                  Feedback a envoyer au candidat
                </Text>
                <Textarea
                  placeholder="Redigez le feedback constructif a envoyer..."
                  value={nextSteps.feedback_to_send || ""}
                  onChange={(e) =>
                    handleNextStepsChange("feedback_to_send", e.target.value)
                  }
                  disabled={isSubmitted}
                  fontSize="sm"
                  rows={4}
                  bg="surface"
                  border="1px solid"
                  borderColor="border"
                  _focus={{ borderColor: "primary" }}
                />
              </Box>
            )}
            {decision === "need_more_info" && (
              <Box>
                <Text fontSize="xs" fontWeight="semibold" color="text.secondary" mb={1}>
                  Informations supplementaires necessaires
                </Text>
                <Textarea
                  placeholder="Quelles informations manquent..."
                  value={nextSteps.additional_info_needed || ""}
                  onChange={(e) =>
                    handleNextStepsChange(
                      "additional_info_needed",
                      e.target.value,
                    )
                  }
                  disabled={isSubmitted}
                  fontSize="sm"
                  rows={3}
                  bg="surface"
                  border="1px solid"
                  borderColor="border"
                  _focus={{ borderColor: "primary" }}
                />
              </Box>
            )}
          </SectionCard>
        )}

        {/* Submit error */}
        {submitError && (
          <Box bg="error.subtle" borderRadius="lg" p={4}>
            <Text fontSize="sm" color="error" fontWeight="medium">
              {submitError}
            </Text>
          </Box>
        )}

        {/* Submit button */}
        {!isSubmitted && (
          <Flex justify="flex-end" gap={3}>
            <Button
              bg="primary"
              color="white"
              _hover={{
                bg: "primary.hover",
                transform: "translateY(-1px)",
              }}
              _active={{ transform: "translateY(0)" }}
              transition="all 0.15s"
              fontWeight="medium"
              onClick={handleSubmit}
              disabled={!canSubmit || fetcher.state !== "idle"}
            >
              <Flex align="center" gap={1.5}>
                <Send size={16} />
                <Text>Soumettre le Decision Memo</Text>
              </Flex>
            </Button>
          </Flex>
        )}
      </Stack>
    </Box>
  );
}

// =============================================================================
// Shared Components
// =============================================================================

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Box
      bg="surface"
      borderRadius="xl"
      border="1px solid"
      borderColor="border"
      p={6}
    >
      <Flex align="center" gap={2} mb={4}>
        {icon && <Box color="primary">{icon}</Box>}
        <Heading as="h2" fontSize="md" fontWeight="semibold" color="text">
          {title}
        </Heading>
      </Flex>
      {children}
    </Box>
  );
}
