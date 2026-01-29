import { useState, useCallback, useRef } from "react";
import { useNavigate, useFetcher } from "react-router";
import {
  ArrowLeft,
  Clock,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
} from "lucide-react";
import {
  Box,
  Heading,
  Text,
  Stack,
  Flex,
  Button,
  Badge,
  Textarea,
  NativeSelect,
} from "@chakra-ui/react";
import type { InterviewKit, InterviewKitSection } from "~/components/lib/api";
import { requireRole } from "~/components/lib/auth.server";
import { authenticatedFetch } from "~/components/lib/api.server";
import type { Route } from "./+types/_app.jobs.$id.candidates.$candidateId.interview-kit";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Interview Kit - Baara" }];
};

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

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireRole(request, ["recruiter", "admin"]);

  const res = await authenticatedFetch(
    request,
    `/api/v1/jobs/${params.id}/candidates/${params.candidateId}/interview-kit`,
  );

  if (!res.ok) {
    return {
      kit: null as InterviewKit | null,
      candidate: null as CandidateInfo | null,
      job: null as JobInfo | null,
      error: "Interview Kit non disponible pour ce candidat",
    };
  }

  const data = await res.json();
  return {
    kit: data.interview_kit as InterviewKit,
    candidate: data.candidate as CandidateInfo,
    job: data.job as JobInfo,
    error: null as string | null,
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const notesJson = formData.get("notes") as string;

  const res = await authenticatedFetch(
    request,
    `/api/v1/jobs/${params.id}/candidates/${params.candidateId}/interview-kit/notes`,
    {
      method: "PATCH",
      body: JSON.stringify({ notes: JSON.parse(notesJson) }),
    },
  );

  if (!res.ok) {
    return { error: "Erreur lors de la sauvegarde des notes" };
  }
  const data = await res.json();
  return { ok: true, notes: data.notes };
}

// =============================================================================
// QUESTION CARD — shared between mobile & desktop
// =============================================================================

function QuestionCard({
  q,
  qi,
  noteKey,
  noteValue,
  onNoteChange,
}: {
  q: InterviewKit["sections"][0]["questions"][0];
  qi: number;
  noteKey: string;
  noteValue: string;
  onNoteChange: (key: string, value: string) => void;
}) {
  return (
    <Stack
      gap={0}
      bg="bg.subtle"
      borderRadius="lg"
      border="1px solid"
      borderColor="border.subtle"
      overflow="hidden"
    >
      <Stack gap={3} p={{ base: 3, md: 4 }}>
        {/* Question text */}
        <Text
          fontSize="sm"
          fontWeight="semibold"
          color="text"
          lineHeight="1.5"
          overflowWrap="anywhere"
        >
          {qi + 1}. {q.question}
        </Text>

        {/* Context */}
        {q.context && (
          <Box
            bg="info.subtle"
            borderRadius="md"
            border="1px solid"
            borderColor="info.muted"
            p={3}
          >
            <Text
              fontSize="2xs"
              fontWeight="medium"
              color="text.subtle"
              mb={1}
              textTransform="uppercase"
              letterSpacing="wider"
            >
              Contexte
            </Text>
            <Text
              fontSize="sm"
              color="text.secondary"
              lineHeight="1.5"
              overflowWrap="anywhere"
            >
              {q.context}
            </Text>
          </Box>
        )}

        {/* Signals — stack vertically on mobile */}
        <Stack gap={3} direction={{ base: "column", md: "row" }}>
          {q.positive_signals.length > 0 && (
            <Box flex={1}>
              <Flex align="center" gap={1} mb={1.5}>
                <CheckCircle
                  size={12}
                  color="var(--chakra-colors-success)"
                />
                <Text
                  fontSize="2xs"
                  fontWeight="medium"
                  color="success"
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  Signaux positifs
                </Text>
              </Flex>
              <Stack gap={1}>
                {q.positive_signals.map((s, si) => (
                  <Text
                    key={si}
                    fontSize="xs"
                    color="text.secondary"
                    overflowWrap="anywhere"
                  >
                    {s}
                  </Text>
                ))}
              </Stack>
            </Box>
          )}
          {q.negative_signals.length > 0 && (
            <Box flex={1}>
              <Flex align="center" gap={1} mb={1.5}>
                <XCircle size={12} color="var(--chakra-colors-error)" />
                <Text
                  fontSize="2xs"
                  fontWeight="medium"
                  color="error"
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  Signaux negatifs
                </Text>
              </Flex>
              <Stack gap={1}>
                {q.negative_signals.map((s, si) => (
                  <Text
                    key={si}
                    fontSize="xs"
                    color="text.secondary"
                    overflowWrap="anywhere"
                  >
                    {s}
                  </Text>
                ))}
              </Stack>
            </Box>
          )}
        </Stack>

        {/* Follow-up */}
        {q.follow_up && (
          <Flex
            align="start"
            gap={2}
            pt={3}
            borderTop="1px solid"
            borderColor="border.subtle"
          >
            <Box color="primary" mt={0.5} flexShrink={0}>
              <ChevronRight size={14} />
            </Box>
            <Box minW={0}>
              <Text
                fontSize="2xs"
                fontWeight="medium"
                color="text.subtle"
                textTransform="uppercase"
                letterSpacing="wider"
                mb={0.5}
              >
                Relance suggeree
              </Text>
              <Text
                fontSize="sm"
                color="text.secondary"
                overflowWrap="anywhere"
              >
                {q.follow_up}
              </Text>
            </Box>
          </Flex>
        )}
      </Stack>

      {/* Note */}
      <Box
        borderTop="1px solid"
        borderColor="border.subtle"
        p={3}
        bg="surface"
      >
        <Textarea
          value={noteValue}
          onChange={(e) => onNoteChange(noteKey, e.target.value)}
          placeholder="Notes pour cette question..."
          rows={2}
          fontSize="sm"
          border="1px solid"
          borderColor="border"
          bg="surface"
          _hover={{ borderColor: "border.emphasis" }}
          _focus={{
            borderColor: "primary",
            boxShadow: "0 0 0 1px var(--chakra-colors-primary)",
          }}
          color="text.secondary"
          resize="vertical"
        />
      </Box>
    </Stack>
  );
}

// =============================================================================
// DEBRIEF SECTION — shared between mobile & desktop
// =============================================================================

function DebriefSection({
  debrief,
  notes,
  onNoteChange,
}: {
  debrief: InterviewKit["debrief_template"];
  notes: Record<string, string>;
  onNoteChange: (key: string, value: string) => void;
}) {
  return (
    <Stack gap={5}>
      {/* Criteria */}
      <Box>
        <Text
          fontSize="2xs"
          fontWeight="medium"
          color="text.subtle"
          mb={3}
          textTransform="uppercase"
          letterSpacing="wider"
        >
          Debrief — Criteres
        </Text>
        <Stack gap={2}>
          {debrief.criteria.map((criterion, i) => (
            <Box
              key={i}
              bg="surface"
              borderRadius="lg"
              p={3}
              border="1px solid"
              borderColor="border.subtle"
            >
              <Flex justify="space-between" align="center" gap={2}>
                <Text
                  fontSize="sm"
                  fontWeight="medium"
                  color="text"
                  minW={0}
                  overflowWrap="anywhere"
                >
                  {criterion.name}
                </Text>
                <Flex align="center" gap={2} flexShrink={0}>
                  {criterion.reevaluate && (
                    <Flex align="center" gap={1}>
                      <AlertTriangle
                        size={11}
                        color="var(--chakra-colors-warning)"
                      />
                      <Text fontSize="xs" color="warning" whiteSpace="nowrap">
                        A reevaluer
                      </Text>
                    </Flex>
                  )}
                  <Badge
                    fontSize="xs"
                    bg={
                      criterion.score >= 70
                        ? "success.subtle"
                        : criterion.score >= 50
                          ? "warning.subtle"
                          : "error.subtle"
                    }
                    color={
                      criterion.score >= 70
                        ? "success"
                        : criterion.score >= 50
                          ? "warning"
                          : "error"
                    }
                    px={1.5}
                    py={0.5}
                    borderRadius="full"
                  >
                    {criterion.score}
                  </Badge>
                </Flex>
              </Flex>
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Final recommendation */}
      {debrief.final_recommendation_prompt && (
        <Box>
          <Text
            fontSize="2xs"
            fontWeight="medium"
            color="text.subtle"
            mb={2}
            textTransform="uppercase"
            letterSpacing="wider"
          >
            Recommandation finale
          </Text>
          <Box
            bg="surface"
            borderRadius="lg"
            p={{ base: 3, md: 4 }}
            border="1px solid"
            borderColor="border.subtle"
          >
            <Text
              fontSize="sm"
              color="text.secondary"
              overflowWrap="anywhere"
            >
              {debrief.final_recommendation_prompt}
            </Text>
          </Box>
        </Box>
      )}

      {/* General notes */}
      <Box>
        <Text
          fontSize="2xs"
          fontWeight="medium"
          color="text.subtle"
          mb={2}
          textTransform="uppercase"
          letterSpacing="wider"
        >
          Notes generales
        </Text>
        <Textarea
          value={notes["general"] || ""}
          onChange={(e) => onNoteChange("general", e.target.value)}
          placeholder="Notes generales sur l'entretien..."
          rows={4}
          fontSize="sm"
          border="1px solid"
          borderColor="border"
          bg="surface"
          _hover={{ borderColor: "border.emphasis" }}
          _focus={{
            borderColor: "primary",
            boxShadow: "0 0 0 1px var(--chakra-colors-primary)",
          }}
          color="text.secondary"
          resize="vertical"
        />
      </Box>
    </Stack>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function InterviewKitPage({
  params,
  loaderData,
}: Route.ComponentProps) {
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const { kit, candidate, job, error } = loaderData;
  const jobId = params.id;
  const candidateId = params.candidateId;

  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [showDebrief, setShowDebrief] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>(
    kit?.notes || {},
  );
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveNotes = useCallback(
    (updatedNotes: Record<string, string>) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(() => {
        fetcher.submit(
          { notes: JSON.stringify(updatedNotes) },
          { method: "POST" },
        );
      }, 1500);
    },
    [fetcher],
  );

  const handleNoteChange = (key: string, value: string) => {
    const updatedNotes = { ...notes, [key]: value };
    setNotes(updatedNotes);
    saveNotes(updatedNotes);
  };

  // Error / loading state
  if (error || !kit || !candidate) {
    return (
      <Box
        py={{ base: 4, md: 8 }}
        px={{ base: 4, md: 8 }}
        maxW="1200px"
        mx="auto"
      >
        <Button
          variant="ghost"
          size="sm"
          color="text.secondary"
          mb={4}
          onClick={() =>
            navigate(`/app/jobs/${jobId}/candidates/${candidateId}`)
          }
          _hover={{ color: "text", bg: "bg.subtle" }}
        >
          <Flex align="center" gap={1.5}>
            <ArrowLeft size={18} />
            <Text>Retour au Proof Profile</Text>
          </Flex>
        </Button>
        <Box
          bg="surface"
          borderRadius="xl"
          border="1px solid"
          borderColor="border"
          p={{ base: 8, md: 12 }}
          textAlign="center"
        >
          <Text fontSize="md" color="text.secondary">
            {error || "Interview Kit non disponible"}
          </Text>
          <Text fontSize="sm" color="text.muted" mt={2}>
            L'Interview Kit est peut-etre en cours de generation.
          </Text>
        </Box>
      </Box>
    );
  }

  const sections = kit.sections || [];
  const activeSection: InterviewKitSection | undefined =
    sections[activeSectionIndex];
  const debrief = kit.debrief_template;

  return (
    <Box
      py={{ base: 4, md: 8 }}
      px={{ base: 4, md: 8 }}
      maxW="1400px"
      mx="auto"
    >
      <Stack gap={{ base: 4, md: 6 }}>
        {/* Back + Header */}
        <Box>
          <Button
            variant="ghost"
            size="sm"
            color="text.secondary"
            onClick={() =>
              navigate(`/app/jobs/${jobId}/candidates/${candidateId}`)
            }
            _hover={{ color: "text", bg: "bg.subtle" }}
            mb={2}
            ml={-2}
          >
            <Flex align="center" gap={1.5}>
              <ArrowLeft size={16} />
              <Text>Retour au Proof Profile</Text>
            </Flex>
          </Button>

          <Flex justify="space-between" align="center" gap={3}>
            <Box minW={0}>
              <Heading
                as="h1"
                fontSize={{ base: "lg", md: "xl" }}
                color="text"
                fontWeight="semibold"
                lineHeight="1.3"
              >
                Interview Kit
              </Heading>
              <Text
                fontSize="sm"
                color="text.secondary"
                mt={0.5}
                overflowWrap="anywhere"
              >
                {candidate.name || candidate.email}
                {job ? ` — ${job.title}` : ""}
              </Text>
            </Box>
            <Flex align="center" gap={2} flexShrink={0}>
              <Badge
                bg="primary.subtle"
                color="primary"
                fontSize="sm"
                px={3}
                py={1}
                borderRadius="full"
              >
                <Flex align="center" gap={1.5}>
                  <Clock size={14} />
                  <Text>{kit.total_duration_minutes} min</Text>
                </Flex>
              </Badge>
              {fetcher.state !== "idle" && (
                <Text fontSize="xs" color="text.muted">
                  Sauvegarde...
                </Text>
              )}
            </Flex>
          </Flex>
        </Box>

        {/* ================================================================ */}
        {/* MOBILE LAYOUT — stacked sections, no outer card                  */}
        {/* ================================================================ */}
        <Box display={{ base: "block", lg: "none" }}>
          <Stack gap={4}>
            {/* Section selector — native select */}
            <Box>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={activeSectionIndex}
                  onChange={(e) =>
                    setActiveSectionIndex(Number(e.target.value))
                  }
                  bg="surface"
                  border="1px solid"
                  borderColor="border"
                  borderRadius="lg"
                  fontSize="sm"
                  fontWeight="medium"
                  h="44px"
                  color="text"
                >
                  {sections.map((section, i) => (
                    <option key={i} value={i}>
                      {section.title} ({section.duration_minutes} min)
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Box>

            {/* Questions */}
            {activeSection && (
              <Stack gap={3}>
                {activeSection.questions.map((q, qi) => {
                  const noteKey = `section_${activeSectionIndex}_question_${qi}`;
                  return (
                    <QuestionCard
                      key={qi}
                      q={q}
                      qi={qi}
                      noteKey={noteKey}
                      noteValue={notes[noteKey] || ""}
                      onNoteChange={handleNoteChange}
                    />
                  );
                })}
              </Stack>
            )}

            {/* Debrief — collapsible on mobile */}
            <Box
              bg="surface"
              borderRadius="xl"
              border="1px solid"
              borderColor="border"
              overflow="hidden"
            >
              <Button
                variant="ghost"
                w="full"
                justifyContent="space-between"
                onClick={() => setShowDebrief(!showDebrief)}
                p={4}
                h="auto"
                borderRadius="none"
                _hover={{ bg: "bg.subtle" }}
              >
                <Flex align="center" gap={2}>
                  <FileText size={16} color="var(--chakra-colors-primary)" />
                  <Text fontSize="sm" fontWeight="semibold" color="text">
                    Debrief & Notes
                  </Text>
                </Flex>
                {showDebrief ? (
                  <ChevronUp size={18} color="var(--chakra-colors-text-muted)" />
                ) : (
                  <ChevronDown size={18} color="var(--chakra-colors-text-muted)" />
                )}
              </Button>
              {showDebrief && (
                <Box p={4} pt={0} borderTop="1px solid" borderColor="border.subtle">
                  <Box pt={4}>
                    <DebriefSection
                      debrief={debrief}
                      notes={notes}
                      onNoteChange={handleNoteChange}
                    />
                  </Box>
                </Box>
              )}
            </Box>
          </Stack>
        </Box>

        {/* ================================================================ */}
        {/* DESKTOP LAYOUT — 3-column card                                   */}
        {/* ================================================================ */}
        <Box display={{ base: "none", lg: "block" }}>
          <Box
            bg="surface"
            borderRadius="xl"
            border="1px solid"
            borderColor="border"
            overflow="hidden"
            shadow="card"
          >
            <Flex minH="600px">
              {/* LEFT: Interview Plan */}
              <Box
                w="240px"
                borderRight="1px solid"
                borderRightColor="border.subtle"
                bg="bg.subtle"
                p={5}
                flexShrink={0}
              >
                <Text
                  fontSize="2xs"
                  fontWeight="medium"
                  color="text.subtle"
                  mb={3}
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  Plan d'entretien
                </Text>
                <Stack gap={1.5}>
                  {sections.map((section, i) => (
                    <Button
                      key={i}
                      variant={
                        activeSectionIndex === i ? "solid" : "ghost"
                      }
                      bg={
                        activeSectionIndex === i
                          ? "primary"
                          : "transparent"
                      }
                      color={
                        activeSectionIndex === i
                          ? "white"
                          : "text.secondary"
                      }
                      _hover={{
                        bg:
                          activeSectionIndex === i
                            ? "primary.hover"
                            : "bg.muted",
                      }}
                      size="sm"
                      justifyContent="flex-start"
                      onClick={() => setActiveSectionIndex(i)}
                      fontWeight="medium"
                      borderRadius="lg"
                      py={3}
                      px={3}
                    >
                      <Flex
                        justify="space-between"
                        w="full"
                        align="center"
                      >
                        <Text fontSize="sm" truncate>
                          {section.title}
                        </Text>
                        <Text
                          fontSize="xs"
                          color={
                            activeSectionIndex === i
                              ? "white"
                              : "text.placeholder"
                          }
                          opacity={activeSectionIndex === i ? 0.8 : 1}
                          flexShrink={0}
                          ml={2}
                        >
                          {section.duration_minutes} min
                        </Text>
                      </Flex>
                    </Button>
                  ))}
                </Stack>
                <Box
                  mt={4}
                  pt={4}
                  borderTop="1px solid"
                  borderColor="border.subtle"
                >
                  <Flex justify="space-between" align="center">
                    <Text
                      fontSize="xs"
                      color="text.muted"
                      fontWeight="medium"
                    >
                      Total
                    </Text>
                    <Text
                      fontSize="xs"
                      color="text.muted"
                      fontWeight="bold"
                    >
                      {kit.total_duration_minutes} min
                    </Text>
                  </Flex>
                </Box>
              </Box>

              {/* CENTER: Questions */}
              <Box flex={1} p={6} overflowY="auto" minW={0}>
                {activeSection ? (
                  <Stack gap={5}>
                    <Badge
                      bg="primary.subtle"
                      color="primary"
                      fontSize="2xs"
                      fontWeight="semibold"
                      px={2}
                      py={0.5}
                      borderRadius="md"
                      alignSelf="flex-start"
                    >
                      {activeSection.title} —{" "}
                      {activeSection.duration_minutes} min
                    </Badge>

                    <Stack gap={4}>
                      {activeSection.questions.map((q, qi) => {
                        const noteKey = `section_${activeSectionIndex}_question_${qi}`;
                        return (
                          <QuestionCard
                            key={qi}
                            q={q}
                            qi={qi}
                            noteKey={noteKey}
                            noteValue={notes[noteKey] || ""}
                            onNoteChange={handleNoteChange}
                          />
                        );
                      })}
                    </Stack>
                  </Stack>
                ) : (
                  <Flex
                    align="center"
                    justify="center"
                    h="full"
                    color="text.muted"
                  >
                    <Text>Selectionnez une section</Text>
                  </Flex>
                )}
              </Box>

              {/* RIGHT: Debrief */}
              <Box
                w="300px"
                borderLeft="1px solid"
                borderLeftColor="border.subtle"
                p={5}
                bg="bg.subtle"
                flexShrink={0}
                overflowY="auto"
              >
                <DebriefSection
                  debrief={debrief}
                  notes={notes}
                  onNoteChange={handleNoteChange}
                />
              </Box>
            </Flex>
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}
