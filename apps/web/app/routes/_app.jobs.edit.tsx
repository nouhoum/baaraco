import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useBlocker } from "react-router";
import { Briefcase, Users, Target, Calendar, Save, Check, Plus, Trash2, Play, Pause, X, ArrowLeft, Sparkles, ClipboardList, FileText, RefreshCw, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toaster } from "~/components/ui/toaster";
import {
  Box,
  Heading,
  Text,
  Stack,
  Flex,
  Button,
  Input,
  Textarea,
  Badge,
  Spinner,
  Circle,
  Grid,
  chakra,
} from "@chakra-ui/react";
import {
  getJob,
  updateJob,
  publishJob,
  pauseJob,
  closeJob,
  generateScorecard,
  getScorecard,
  updateScorecard,
  generateWorkSample,
  getWorkSample,
  updateWorkSample,
  type UpdateJobRequest,
  type Job,
  type JobStatus,
  type LocationType,
  type ContractType,
  type SeniorityLevel,
  type TeamSize,
  type Urgency,
  type Scorecard,
  type ScorecardCriterion,
  type CriterionWeight,
  type JobWorkSample,
  type WorkSampleSection,
} from "~/components/lib/api";
import { requireRole } from "~/components/lib/auth.server";
import { authenticatedFetch } from "~/components/lib/api.server";
import type { Route } from "./+types/_app.jobs.edit";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Modifier le poste - Baara" }];
};

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireRole(request, ["recruiter", "admin"]);
  const res = await authenticatedFetch(request, `/api/v1/jobs/${params.id}`);
  if (!res.ok) {
    throw new Response("Not Found", { status: 404 });
  }
  const jobData = await res.json();

  // Try to load scorecard
  let scorecardData = null;
  try {
    const scRes = await authenticatedFetch(
      request,
      `/api/v1/jobs/${params.id}/scorecard`,
    );
    if (scRes.ok) {
      const sc = await scRes.json();
      scorecardData = sc.scorecard;
    }
  } catch {
    // Scorecard doesn't exist yet
  }

  // Try to load work sample
  let workSampleData = null;
  try {
    const wsRes = await authenticatedFetch(
      request,
      `/api/v1/jobs/${params.id}/work-sample`,
    );
    if (wsRes.ok) {
      const ws = await wsRes.json();
      workSampleData = ws.work_sample;
    }
  } catch {
    // Work sample doesn't exist yet
  }

  return {
    job: jobData.job as Job,
    initialScorecard: scorecardData as Scorecard | null,
    initialWorkSample: workSampleData as JobWorkSample | null,
  };
}

// Select component
interface SelectOption {
  value: string;
  label: string;
}

function SelectField({
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <chakra.select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      w="100%"
      p={3}
      borderRadius="lg"
      border="1px solid"
      borderColor="border"
      bg="surface"
      fontSize="sm"
      color={value ? "text" : "text.muted"}
      _hover={{ borderColor: disabled ? "border" : "border.emphasis" }}
      _focus={{ borderColor: "primary", outline: "none" }}
      disabled={disabled}
      _disabled={{ bg: "bg.subtle", cursor: "not-allowed" }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </chakra.select>
  );
}

// Multi-select tag input for stack
function TagInput({
  value,
  onChange,
  placeholder,
  suggestions,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
}) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      if (!value.includes(inputValue.trim())) {
        onChange([...value, inputValue.trim()]);
      }
      setInputValue("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const addSuggestion = (suggestion: string) => {
    if (!value.includes(suggestion)) {
      onChange([...value, suggestion]);
    }
  };

  return (
    <Box>
      <Flex flexWrap="wrap" gap={2} mb={2}>
        {value.map((tag) => (
          <Badge
            key={tag}
            bg="primary.subtle"
            color="primary"
            px={2}
            py={1}
            borderRadius="md"
            fontSize="xs"
            fontWeight="medium"
          >
            {tag}
            <Box
              as="button"
              ml={1}
              onClick={() => removeTag(tag)}
              color="primary"
              _hover={{ color: "error" }}
            >
              &times;
            </Box>
          </Badge>
        ))}
      </Flex>
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        fontSize="sm"
        borderColor="border"
        _hover={{ borderColor: "border.emphasis" }}
        _focus={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
      />
      {suggestions && suggestions.length > 0 && (
        <Flex flexWrap="wrap" gap={1} mt={2}>
          {suggestions.filter((s) => !value.includes(s)).slice(0, 6).map((suggestion) => (
            <Button
              key={suggestion}
              size="xs"
              variant="outline"
              borderColor="border"
              color="text.muted"
              onClick={() => addSuggestion(suggestion)}
              _hover={{ bg: "bg.subtle" }}
            >
              + {suggestion}
            </Button>
          ))}
        </Flex>
      )}
    </Box>
  );
}

// Status badge component
function StatusBadge({ status, label }: { status: JobStatus; label: string }) {
  const config = {
    draft: { bg: "bg.muted", color: "text.muted" },
    active: { bg: "success.subtle", color: "success" },
    paused: { bg: "warning.subtle", color: "warning" },
    closed: { bg: "error.subtle", color: "error" },
  };

  const { bg, color } = config[status];

  return (
    <Badge
      bg={bg}
      color={color}
      fontSize="xs"
      fontWeight="semibold"
      px={3}
      py={1}
      borderRadius="full"
    >
      {label}
    </Badge>
  );
}

// Stack suggestions (not translated - technical terms)
const stackSuggestions = [
  "Go", "Python", "TypeScript", "JavaScript", "Rust", "Java",
  "Kubernetes", "Docker", "AWS", "GCP", "PostgreSQL", "Redis",
  "React", "Node.js", "GraphQL", "gRPC", "Kafka", "Terraform"
];

// Helper to build options with translations
const getLocationTypeOptions = (t: (key: string) => string): SelectOption[] => [
  { value: "remote", label: t("jobEdit.fields.locationType.remote") },
  { value: "hybrid", label: t("jobEdit.fields.locationType.hybrid") },
  { value: "onsite", label: t("jobEdit.fields.locationType.onsite") },
];

const getContractTypeOptions = (t: (key: string) => string): SelectOption[] => [
  { value: "cdi", label: t("jobEdit.fields.contractType.cdi") },
  { value: "cdd", label: t("jobEdit.fields.contractType.cdd") },
  { value: "freelance", label: t("jobEdit.fields.contractType.freelance") },
];

const getSeniorityOptions = (t: (key: string) => string): SelectOption[] => [
  { value: "junior", label: t("jobEdit.fields.seniority.junior") },
  { value: "mid", label: t("jobEdit.fields.seniority.mid") },
  { value: "senior", label: t("jobEdit.fields.seniority.senior") },
  { value: "staff", label: t("jobEdit.fields.seniority.staff") },
  { value: "principal", label: t("jobEdit.fields.seniority.principal") },
];

const getTeamSizeOptions = (t: (key: string) => string): SelectOption[] => [
  { value: "1-3", label: t("jobEdit.fields.teamSize.1-3") },
  { value: "4-8", label: t("jobEdit.fields.teamSize.4-8") },
  { value: "9-15", label: t("jobEdit.fields.teamSize.9-15") },
  { value: "16+", label: t("jobEdit.fields.teamSize.16+") },
];

const getUrgencyOptions = (t: (key: string) => string): SelectOption[] => [
  { value: "immediate", label: t("jobEdit.fields.urgency.immediate") },
  { value: "1-2months", label: t("jobEdit.fields.urgency.1-2months") },
  { value: "flexible", label: t("jobEdit.fields.urgency.flexible") },
];

export default function EditJob({ loaderData, params }: Route.ComponentProps) {
  const { t } = useTranslation("admin");
  const navigate = useNavigate();
  const jobId = params.id!;

  // Initialize from loader data
  const initialJob = loaderData.job;

  // Form state
  const [job, setJob] = useState<Job | null>(initialJob);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Section 1: Le poste
  const [title, setTitle] = useState(initialJob.title || "");
  const [team, setTeam] = useState(initialJob.team || "");
  const [locationType, setLocationType] = useState<LocationType | "">((initialJob.location_type as LocationType) || "");
  const [locationCity, setLocationCity] = useState(initialJob.location_city || "");
  const [contractType, setContractType] = useState<ContractType | "">((initialJob.contract_type as ContractType) || "");
  const [seniority, setSeniority] = useState<SeniorityLevel | "">((initialJob.seniority as SeniorityLevel) || "");

  // Section 2: Le contexte
  const [stack, setStack] = useState<string[]>(initialJob.stack || []);
  const [teamSize, setTeamSize] = useState<TeamSize | "">((initialJob.team_size as TeamSize) || "");
  const [managerInfo, setManagerInfo] = useState(initialJob.manager_info || "");
  const [businessContext, setBusinessContext] = useState(initialJob.business_context || "");

  // Section 3: Les outcomes
  const [mainProblem, setMainProblem] = useState(initialJob.main_problem || "");
  const [expectedOutcomes, setExpectedOutcomes] = useState<string[]>(initialJob.expected_outcomes?.length ? initialJob.expected_outcomes : ["", "", ""]);
  const [successLooksLike, setSuccessLooksLike] = useState(initialJob.success_looks_like || "");
  const [failureLooksLike, setFailureLooksLike] = useState(initialJob.failure_looks_like || "");

  // Section 4: Logistique
  const [salaryMin, setSalaryMin] = useState<string>(initialJob.salary_min?.toString() || "");
  const [salaryMax, setSalaryMax] = useState<string>(initialJob.salary_max?.toString() || "");
  const [startDate, setStartDate] = useState(initialJob.start_date ? initialJob.start_date.split("T")[0] : "");
  const [urgency, setUrgency] = useState<Urgency | "">((initialJob.urgency as Urgency) || "");

  // Auto-save refs
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Scorecard state
  const [scorecard, setScorecard] = useState<Scorecard | null>(loaderData.initialScorecard);
  const [isGeneratingScorecard, setIsGeneratingScorecard] = useState(false);
  const [isSavingScorecard, setIsSavingScorecard] = useState(false);
  const [scorecardSaved, setScorecardSaved] = useState(false);
  const [scorecardExpanded, setScorecardExpanded] = useState<Record<number, boolean>>({});
  const [editingCriterion, setEditingCriterion] = useState<number | null>(null);

  // Work sample state
  const [workSample, setWorkSample] = useState<JobWorkSample | null>(loaderData.initialWorkSample);
  const [isGeneratingWorkSample, setIsGeneratingWorkSample] = useState(false);
  const [isSavingWorkSample, setIsSavingWorkSample] = useState(false);
  const [workSampleSaved, setWorkSampleSaved] = useState(false);
  const [workSampleExpanded, setWorkSampleExpanded] = useState<Record<number, boolean>>({});
  const [editingSection, setEditingSection] = useState<number | null>(null);

  // Role check and data loading handled by loader

  // Build job data from form state
  const buildJobData = useCallback((): UpdateJobRequest => {
    return {
      title,
      team: team || undefined,
      location_type: locationType as LocationType || undefined,
      location_city: locationCity || undefined,
      contract_type: contractType as ContractType || undefined,
      seniority: seniority as SeniorityLevel || undefined,
      stack: stack.length > 0 ? stack : undefined,
      team_size: teamSize as TeamSize || undefined,
      manager_info: managerInfo || undefined,
      business_context: businessContext || undefined,
      main_problem: mainProblem || undefined,
      expected_outcomes: expectedOutcomes.filter(o => o.trim()) || undefined,
      success_looks_like: successLooksLike || undefined,
      failure_looks_like: failureLooksLike || undefined,
      salary_min: salaryMin ? parseInt(salaryMin) : undefined,
      salary_max: salaryMax ? parseInt(salaryMax) : undefined,
      start_date: startDate || undefined,
      urgency: urgency as Urgency || undefined,
    };
  }, [
    title, team, locationType, locationCity, contractType, seniority,
    stack, teamSize, managerInfo, businessContext, mainProblem,
    expectedOutcomes, successLooksLike, failureLooksLike,
    salaryMin, salaryMax, startDate, urgency
  ]);

  // Save function
  const saveJob = useCallback(async (silent = false) => {
    if (!title.trim()) return;

    if (!silent) {
      setIsSaving(true);
      setSaveStatus("saving");
    }

    try {
      const data = buildJobData();
      const response = await updateJob(jobId, data);
      setJob(response.job);

      setHasUnsavedChanges(false);
      setSaveStatus("saved");
      setLastSavedAt(new Date());

      // Show toast only for manual saves
      if (!silent) {
        toaster.success({
          title: t("jobEdit.toast.saveSuccess.title"),
          description: t("jobEdit.toast.saveSuccess.description"),
          duration: 4000,
        });
      }
    } catch (err) {
      setSaveStatus("error");
      const errorMessage = err instanceof Error ? err.message : t("jobEdit.errors.saveError");
      if (!silent) {
        setError(errorMessage);
        toaster.error({
          title: t("jobEdit.toast.saveError.title"),
          description: errorMessage,
          duration: 5000,
        });
      }
    } finally {
      if (!silent) {
        setIsSaving(false);
      }
    }
  }, [jobId, title, buildJobData, t]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!hasUnsavedChanges || !title.trim()) return;

    autoSaveTimerRef.current = setInterval(() => {
      saveJob(true);
    }, 30000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [hasUnsavedChanges, title, saveJob]);

  // Warn before leaving with unsaved changes (browser navigation/refresh)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Block in-app navigation with unsaved changes
  useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
  );

  // Mark as changed
  const markChanged = () => {
    setHasUnsavedChanges(true);
    setError("");
  };

  // Handle expected outcomes
  const updateOutcome = (index: number, value: string) => {
    const newOutcomes = [...expectedOutcomes];
    newOutcomes[index] = value;
    setExpectedOutcomes(newOutcomes);
    markChanged();
  };

  const addOutcome = () => {
    if (expectedOutcomes.length < 5) {
      setExpectedOutcomes([...expectedOutcomes, ""]);
      markChanged();
    }
  };

  const removeOutcome = (index: number) => {
    if (expectedOutcomes.length > 1) {
      const newOutcomes = expectedOutcomes.filter((_, i) => i !== index);
      setExpectedOutcomes(newOutcomes);
      markChanged();
    }
  };

  // Handle status changes
  const handlePublish = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Save first
      await saveJob(true); // silent save, we'll show publish toast instead
      // Then publish
      const response = await publishJob(jobId);
      setJob(response.job);
      toaster.success({
        title: t("jobEdit.toast.publishSuccess.title"),
        description: t("jobEdit.toast.publishSuccess.description"),
        duration: 4000,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t("jobEdit.errors.publishError");
      setError(errorMessage);
      toaster.error({
        title: t("jobEdit.toast.saveError.title"),
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await pauseJob(jobId);
      setJob(response.job);
      toaster.success({
        title: t("jobEdit.toast.pauseSuccess.title"),
        description: t("jobEdit.toast.pauseSuccess.description"),
        duration: 4000,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t("jobEdit.errors.pauseError");
      setError(errorMessage);
      toaster.error({
        title: t("jobEdit.toast.saveError.title"),
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await closeJob(jobId);
      setJob(response.job);
      toaster.success({
        title: t("jobEdit.toast.closeSuccess.title"),
        description: t("jobEdit.toast.closeSuccess.description"),
        duration: 4000,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t("jobEdit.errors.closeError");
      setError(errorMessage);
      toaster.error({
        title: t("jobEdit.toast.saveError.title"),
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Scorecard functions
  const handleGenerateScorecard = async () => {
    // Save job first to ensure AI has latest data
    await saveJob(false);

    setIsGeneratingScorecard(true);
    setError("");

    try {
      const response = await generateScorecard(jobId);
      setScorecard(response.scorecard);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("jobEdit.errors.scorecardGenerateError"));
    } finally {
      setIsGeneratingScorecard(false);
    }
  };

  const handleUpdateCriterion = (index: number, updates: Partial<ScorecardCriterion>) => {
    if (!scorecard) return;

    const newCriteria = [...scorecard.criteria];
    newCriteria[index] = { ...newCriteria[index], ...updates };
    setScorecard({ ...scorecard, criteria: newCriteria });
    setScorecardSaved(false);
  };

  const handleSaveScorecard = async () => {
    if (!scorecard) return;

    setIsSavingScorecard(true);
    setError("");

    try {
      const response = await updateScorecard(jobId, scorecard.criteria);
      setScorecard(response.scorecard);
      setEditingCriterion(null);
      setScorecardSaved(true);
      toaster.success({
        title: t("jobEdit.toast.scorecardSaveSuccess.title"),
        description: t("jobEdit.toast.scorecardSaveSuccess.description"),
        duration: 4000,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t("jobEdit.errors.scorecardSaveError");
      setError(errorMessage);
      toaster.error({
        title: t("jobEdit.toast.saveError.title"),
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsSavingScorecard(false);
    }
  };

  const handleDeleteCriterion = (index: number) => {
    if (!scorecard) return;

    const newCriteria = scorecard.criteria.filter((_, i) => i !== index);
    setScorecard({ ...scorecard, criteria: newCriteria });
    setScorecardSaved(false);
  };

  const handleAddCriterion = () => {
    if (!scorecard) return;

    const newCriterion: ScorecardCriterion = {
      name: t("jobEdit.scorecard.newCriterionName"),
      description: "",
      weight: "important",
      positive_signals: [],
      negative_signals: [],
      red_flags: [],
    };
    setScorecard({ ...scorecard, criteria: [...scorecard.criteria, newCriterion] });
    setEditingCriterion(scorecard.criteria.length);
    setScorecardSaved(false);
  };

  // Work sample functions
  const handleGenerateWorkSample = async () => {
    if (!scorecard) {
      setError(t("jobEdit.workSample.mustGenerateScorecard"));
      return;
    }

    // Save scorecard first
    await handleSaveScorecard();

    setIsGeneratingWorkSample(true);
    setError("");

    try {
      const response = await generateWorkSample(jobId);
      setWorkSample(response.work_sample);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("jobEdit.errors.workSampleGenerateError"));
    } finally {
      setIsGeneratingWorkSample(false);
    }
  };

  const handleUpdateSection = (index: number, updates: Partial<WorkSampleSection>) => {
    if (!workSample) return;

    const newSections = [...workSample.sections];
    newSections[index] = { ...newSections[index], ...updates };
    setWorkSample({ ...workSample, sections: newSections });
    setWorkSampleSaved(false);
  };

  const handleSaveWorkSample = async () => {
    if (!workSample) return;

    setIsSavingWorkSample(true);
    setError("");

    try {
      const response = await updateWorkSample(jobId, {
        intro_message: workSample.intro_message,
        rules: workSample.rules,
        sections: workSample.sections,
      });
      setWorkSample(response.work_sample);
      setEditingSection(null);
      setWorkSampleSaved(true);
      toaster.success({
        title: t("jobEdit.toast.workSampleSaveSuccess.title"),
        description: t("jobEdit.toast.workSampleSaveSuccess.description"),
        duration: 4000,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t("jobEdit.errors.workSampleSaveError");
      setError(errorMessage);
      toaster.error({
        title: t("jobEdit.toast.saveError.title"),
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsSavingWorkSample(false);
    }
  };

  // Weight label helper
  const getWeightLabel = (weight: CriterionWeight): string => {
    return t(`jobEdit.scorecard.weight.${weight}`);
  };

  const getWeightColor = (weight: CriterionWeight): string => {
    const colors: Record<CriterionWeight, string> = {
      critical: "error",
      important: "warning",
      nice_to_have: "info",
    };
    return colors[weight];
  };

  // Calculate progress
  const calculateProgress = () => {
    let filled = 0;
    const total = 10;

    if (title) filled++;
    if (team) filled++;
    if (locationType) filled++;
    if (contractType) filled++;
    if (seniority) filled++;
    if (businessContext) filled++;
    if (mainProblem) filled++;
    if (expectedOutcomes.some(o => o.trim())) filled++;
    if (successLooksLike) filled++;
    if (stack.length > 0) filled++;

    return Math.round((filled / total) * 100);
  };

  const progress = calculateProgress();

  return (
    <Box py={8} px={8} maxW="900px" mx="auto">
      <Stack gap={6}>
        {/* Header */}
        <Flex justify="space-between" align="start" flexWrap="wrap" gap={4}>
          <Box>
            <Button
              variant="ghost"
              size="sm"
              color="text.muted"
              mb={2}
              px={0}
              onClick={() => navigate("/app/jobs")}
              _hover={{ color: "text" }}
            >
              <Flex align="center" gap={1}>
                <ArrowLeft size={16} />
                <Text>{t("jobEdit.header.backToJobs")}</Text>
              </Flex>
            </Button>
            <Heading as="h1" fontSize="xl" color="text" mb={1} fontWeight="semibold">
              {title || t("jobEdit.header.newJob")}
            </Heading>
            <Text fontSize="sm" color="text.secondary">
              {t("jobEdit.header.description")}
            </Text>
          </Box>

          <Flex gap={3} align="center" flexWrap="wrap">
            {/* Save status - persistent indicator */}
            {saveStatus === "saving" ? (
              <Flex align="center" gap={2} color="text.muted">
                <Spinner size="xs" />
                <Text fontSize="xs">{t("jobEdit.saveStatus.saving")}</Text>
              </Flex>
            ) : hasUnsavedChanges ? (
              <Flex align="center" gap={2} color="warning">
                <Circle size={2} bg="warning" />
                <Text fontSize="xs">{t("jobEdit.unsavedChanges")}</Text>
              </Flex>
            ) : lastSavedAt ? (
              <Flex align="center" gap={2} color="success">
                <Check size={16} />
                <Text fontSize="xs">
                  {t("jobEdit.lastSavedAt", {
                    time: lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  })}
                </Text>
              </Flex>
            ) : null}

            {job && <StatusBadge status={job.status} label={t(`jobEdit.status.${job.status}`)} />}
          </Flex>
        </Flex>

        {/* Status actions */}
        {job && (
          <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" p={4}>
            <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="text" mb={1}>
                  {t("jobEdit.status.label")}
                </Text>
                <Text fontSize="xs" color="text.muted">
                  {job.status === "draft" && t("jobEdit.status.draftDescription")}
                  {job.status === "active" && t("jobEdit.status.activeDescription")}
                  {job.status === "paused" && t("jobEdit.status.pausedDescription")}
                  {job.status === "closed" && t("jobEdit.status.closedDescription")}
                </Text>
              </Box>
              <Flex gap={2}>
                {job.status === "draft" && (
                  <Button
                    bg="success"
                    color="white"
                    size="sm"
                    onClick={handlePublish}
                    disabled={isLoading}
                    _hover={{ bg: "success.hover" }}
                  >
                    <Flex align="center" gap={2}>
                      <Play size={16} />
                      <Text>{t("jobEdit.actions.publish")}</Text>
                    </Flex>
                  </Button>
                )}
                {job.status === "active" && (
                  <>
                    <Button
                      variant="outline"
                      borderColor="warning"
                      color="warning"
                      size="sm"
                      onClick={handlePause}
                      disabled={isLoading}
                      _hover={{ bg: "warning.subtle" }}
                    >
                      <Flex align="center" gap={2}>
                        <Pause size={16} />
                        <Text>{t("jobEdit.actions.pause")}</Text>
                      </Flex>
                    </Button>
                    <Button
                      variant="outline"
                      borderColor="error"
                      color="error"
                      size="sm"
                      onClick={handleClose}
                      disabled={isLoading}
                      _hover={{ bg: "error.subtle" }}
                    >
                      <Flex align="center" gap={2}>
                        <X size={16} />
                        <Text>{t("jobEdit.actions.close")}</Text>
                      </Flex>
                    </Button>
                  </>
                )}
                {job.status === "paused" && (
                  <>
                    <Button
                      bg="success"
                      color="white"
                      size="sm"
                      onClick={handlePublish}
                      disabled={isLoading}
                      _hover={{ bg: "success.hover" }}
                    >
                      <Flex align="center" gap={2}>
                        <Play size={16} />
                        <Text>{t("jobEdit.actions.reactivate")}</Text>
                      </Flex>
                    </Button>
                    <Button
                      variant="outline"
                      borderColor="error"
                      color="error"
                      size="sm"
                      onClick={handleClose}
                      disabled={isLoading}
                      _hover={{ bg: "error.subtle" }}
                    >
                      <Flex align="center" gap={2}>
                        <X size={16} />
                        <Text>{t("jobEdit.actions.close")}</Text>
                      </Flex>
                    </Button>
                  </>
                )}
              </Flex>
            </Flex>
          </Box>
        )}

        {/* Progress bar */}
        <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" p={4}>
          <Flex justify="space-between" align="center" mb={2}>
            <Text fontSize="xs" color="text.muted" fontWeight="medium">
              {t("jobEdit.progress.label")}
            </Text>
            <Text fontSize="xs" color="text.muted" fontWeight="medium">
              {progress}%
            </Text>
          </Flex>
          <Box bg="bg.muted" borderRadius="full" h="6px" overflow="hidden">
            <Box bg="primary" h="100%" w={`${progress}%`} borderRadius="full" transition="width 0.3s" />
          </Box>
        </Box>

        {/* Error */}
        {error && (
          <Box bg="error.subtle" borderRadius="lg" border="1px solid" borderColor="error.muted" px={4} py={3}>
            <Text fontSize="sm" color="error">{error}</Text>
          </Box>
        )}

        {/* Section 1: Le poste */}
        <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" shadow="card" overflow="hidden">
          <Flex px={5} py={4} borderBottom="1px solid" borderBottomColor="border.subtle" bg="bg.subtle" gap={3} align="center">
            <Circle size="32px" bg="primary.subtle" color="primary">
              <Briefcase size={18} strokeWidth={1.5} />
            </Circle>
            <Box>
              <Heading as="h2" fontSize="lg" fontWeight="semibold" color="text">
                {t("jobEdit.sections.job.title")}
              </Heading>
              <Text fontSize="xs" color="text.muted">
                {t("jobEdit.sections.job.description")}
              </Text>
            </Box>
          </Flex>

          <Stack gap={5} p={5}>
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                  {t("jobEdit.fields.jobTitle.label")} <Text as="span" color="error">*</Text>
                </Text>
                <Input
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); markChanged(); }}
                  placeholder={t("jobEdit.fields.jobTitle.placeholder")}
                  fontSize="sm"
                  borderColor="border"
                  _hover={{ borderColor: "border.emphasis" }}
                  _focus={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
                />
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                  {t("jobEdit.fields.team.label")}
                </Text>
                <Input
                  value={team}
                  onChange={(e) => { setTeam(e.target.value); markChanged(); }}
                  placeholder={t("jobEdit.fields.team.placeholder")}
                  fontSize="sm"
                  borderColor="border"
                  _hover={{ borderColor: "border.emphasis" }}
                  _focus={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
                />
              </Box>
            </Grid>

            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }} gap={4}>
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                  {t("jobEdit.fields.locationType.label")}
                </Text>
                <SelectField
                  value={locationType}
                  onChange={(v) => { setLocationType(v as LocationType); markChanged(); }}
                  options={getLocationTypeOptions(t)}
                  placeholder={t("jobEdit.fields.locationType.placeholder")}
                />
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                  {t("jobEdit.fields.contractType.label")}
                </Text>
                <SelectField
                  value={contractType}
                  onChange={(v) => { setContractType(v as ContractType); markChanged(); }}
                  options={getContractTypeOptions(t)}
                  placeholder={t("jobEdit.fields.contractType.placeholder")}
                />
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                  {t("jobEdit.fields.seniority.label")}
                </Text>
                <SelectField
                  value={seniority}
                  onChange={(v) => { setSeniority(v as SeniorityLevel); markChanged(); }}
                  options={getSeniorityOptions(t)}
                  placeholder={t("jobEdit.fields.seniority.placeholder")}
                />
              </Box>
            </Grid>

            {(locationType === "hybrid" || locationType === "onsite") && (
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                  {t("jobEdit.fields.city.label")}
                </Text>
                <Input
                  value={locationCity}
                  onChange={(e) => { setLocationCity(e.target.value); markChanged(); }}
                  placeholder={t("jobEdit.fields.city.placeholder")}
                  fontSize="sm"
                  borderColor="border"
                  _hover={{ borderColor: "border.emphasis" }}
                  _focus={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
                />
              </Box>
            )}
          </Stack>
        </Box>

        {/* Section 2: Le contexte */}
        <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" shadow="card" overflow="hidden">
          <Flex px={5} py={4} borderBottom="1px solid" borderBottomColor="border.subtle" bg="bg.subtle" gap={3} align="center">
            <Circle size="32px" bg="info.subtle" color="info">
              <Users size={18} strokeWidth={1.5} />
            </Circle>
            <Box>
              <Heading as="h2" fontSize="lg" fontWeight="semibold" color="text">
                {t("jobEdit.sections.context.title")}
              </Heading>
              <Text fontSize="xs" color="text.muted">
                {t("jobEdit.sections.context.description")}
              </Text>
            </Box>
          </Flex>

          <Stack gap={5} p={5}>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                {t("jobEdit.fields.stack.label")}
              </Text>
              <TagInput
                value={stack}
                onChange={(v) => { setStack(v); markChanged(); }}
                placeholder={t("jobEdit.fields.stack.placeholder")}
                suggestions={stackSuggestions}
              />
            </Box>

            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                  {t("jobEdit.fields.teamSize.label")}
                </Text>
                <SelectField
                  value={teamSize}
                  onChange={(v) => { setTeamSize(v as TeamSize); markChanged(); }}
                  options={getTeamSizeOptions(t)}
                  placeholder={t("jobEdit.fields.teamSize.placeholder")}
                />
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                  {t("jobEdit.fields.manager.label")}
                </Text>
                <Input
                  value={managerInfo}
                  onChange={(e) => { setManagerInfo(e.target.value); markChanged(); }}
                  placeholder={t("jobEdit.fields.manager.placeholder")}
                  fontSize="sm"
                  borderColor="border"
                  _hover={{ borderColor: "border.emphasis" }}
                  _focus={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
                />
              </Box>
            </Grid>

            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                {t("jobEdit.fields.businessContext.label")} <Text as="span" color="error">*</Text>
              </Text>
              <Textarea
                value={businessContext}
                onChange={(e) => { setBusinessContext(e.target.value); markChanged(); }}
                placeholder={t("jobEdit.fields.businessContext.placeholder")}
                rows={4}
                fontSize="sm"
                borderColor="border"
                _hover={{ borderColor: "border.emphasis" }}
                _focus={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
              />
              <Text fontSize="xs" color="text.muted" mt={1}>
                {t("jobEdit.fields.businessContext.helper")}
              </Text>
            </Box>
          </Stack>
        </Box>

        {/* Section 3: Les outcomes */}
        <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" shadow="card" overflow="hidden">
          <Flex px={5} py={4} borderBottom="1px solid" borderBottomColor="border.subtle" bg="bg.subtle" gap={3} align="center">
            <Circle size="32px" bg="success.subtle" color="success">
              <Target size={18} strokeWidth={1.5} />
            </Circle>
            <Box>
              <Heading as="h2" fontSize="lg" fontWeight="semibold" color="text">
                {t("jobEdit.sections.outcomes.title")}
              </Heading>
              <Text fontSize="xs" color="text.muted">
                {t("jobEdit.sections.outcomes.description")}
              </Text>
            </Box>
          </Flex>

          <Stack gap={5} p={5}>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                {t("jobEdit.fields.mainProblem.label")} <Text as="span" color="error">*</Text>
              </Text>
              <Textarea
                value={mainProblem}
                onChange={(e) => { setMainProblem(e.target.value); markChanged(); }}
                placeholder={t("jobEdit.fields.mainProblem.placeholder")}
                rows={3}
                fontSize="sm"
                borderColor="border"
                _hover={{ borderColor: "border.emphasis" }}
                _focus={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
              />
            </Box>

            <Box>
              <Flex justify="space-between" align="center" mb={2}>
                <Text fontSize="sm" fontWeight="medium" color="text">
                  {t("jobEdit.fields.expectedOutcomes.label")} <Text as="span" color="error">*</Text>
                </Text>
                {expectedOutcomes.length < 5 && (
                  <Button
                    size="xs"
                    variant="ghost"
                    color="primary"
                    onClick={addOutcome}
                    _hover={{ bg: "primary.subtle" }}
                  >
                    <Plus size={14} /> {t("jobEdit.actions.add")}
                  </Button>
                )}
              </Flex>
              <Stack gap={3}>
                {expectedOutcomes.map((outcome, index) => (
                  <Flex key={index} gap={2} align="center">
                    <Text fontSize="sm" color="text.muted" w="24px" textAlign="center">
                      {index + 1}.
                    </Text>
                    <Input
                      value={outcome}
                      onChange={(e) => updateOutcome(index, e.target.value)}
                      placeholder={t("jobEdit.fields.expectedOutcomes.placeholder", { index: index + 1 })}
                      fontSize="sm"
                      borderColor="border"
                      flex={1}
                      _hover={{ borderColor: "border.emphasis" }}
                      _focus={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
                    />
                    {expectedOutcomes.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        color="text.muted"
                        p={1}
                        onClick={() => removeOutcome(index)}
                        _hover={{ color: "error", bg: "error.subtle" }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </Flex>
                ))}
              </Stack>
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                {t("jobEdit.fields.successLooksLike.label")} <Text as="span" color="error">*</Text>
              </Text>
              <Textarea
                value={successLooksLike}
                onChange={(e) => { setSuccessLooksLike(e.target.value); markChanged(); }}
                placeholder={t("jobEdit.fields.successLooksLike.placeholder")}
                rows={3}
                fontSize="sm"
                borderColor="border"
                _hover={{ borderColor: "border.emphasis" }}
                _focus={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
              />
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                {t("jobEdit.fields.failureLooksLike.label")}
              </Text>
              <Textarea
                value={failureLooksLike}
                onChange={(e) => { setFailureLooksLike(e.target.value); markChanged(); }}
                placeholder={t("jobEdit.fields.failureLooksLike.placeholder")}
                rows={3}
                fontSize="sm"
                borderColor="border"
                _hover={{ borderColor: "border.emphasis" }}
                _focus={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
              />
            </Box>
          </Stack>
        </Box>

        {/* Section 4: Scorecard */}
        <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" shadow="card" overflow="hidden">
          <Flex px={5} py={4} borderBottom="1px solid" borderBottomColor="border.subtle" bg="bg.subtle" gap={3} align="center" justify="space-between">
            <Flex gap={3} align="center">
              <Circle size="32px" bg="purple.subtle" color="purple.600">
                <ClipboardList size={18} strokeWidth={1.5} />
              </Circle>
              <Box>
                <Heading as="h2" fontSize="lg" fontWeight="semibold" color="text">
                  {t("jobEdit.sections.scorecard.title")}
                </Heading>
                <Text fontSize="xs" color="text.muted">
                  {t("jobEdit.sections.scorecard.description")}
                </Text>
              </Box>
            </Flex>
            {scorecard && (
              <Badge bg="success.subtle" color="success" fontSize="xs" px={2} py={0.5} borderRadius="full">
                {t("jobEdit.scorecard.criteriaCount", { count: scorecard.criteria.length })}
              </Badge>
            )}
          </Flex>

          <Stack gap={4} p={5}>
            {!scorecard ? (
              <Box textAlign="center" py={6}>
                <Circle size="48px" bg="purple.subtle" color="purple.600" mx="auto" mb={3}>
                  <Sparkles size={18} strokeWidth={1.5} />
                </Circle>
                <Text fontSize="sm" color="text.secondary" mb={4}>
                  {t("jobEdit.scorecard.emptyMessage")}
                </Text>
                <Button
                  bg="primary"
                  color="white"
                  onClick={handleGenerateScorecard}
                  disabled={isGeneratingScorecard || !businessContext || !mainProblem}
                  _hover={{ bg: "primary.hover" }}
                  _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
                >
                  {isGeneratingScorecard ? (
                    <Flex align="center" gap={2}>
                      <Spinner size="xs" />
                      <Text>{t("jobEdit.scorecard.generating")}</Text>
                    </Flex>
                  ) : (
                    <Flex align="center" gap={2}>
                      <Sparkles size={18} strokeWidth={1.5} />
                      <Text>{t("jobEdit.scorecard.generate")}</Text>
                    </Flex>
                  )}
                </Button>
              </Box>
            ) : (
              <>
                {/* Criteria list */}
                <Stack gap={3}>
                  {scorecard.criteria.map((criterion, index) => (
                    <Box
                      key={index}
                      border="1px solid"
                      borderColor={editingCriterion === index ? "primary" : "border"}
                      borderRadius="lg"
                      overflow="hidden"
                    >
                      {/* Criterion header */}
                      <Flex
                        px={4}
                        py={3}
                        bg={scorecardExpanded[index] ? "bg.subtle" : "surface"}
                        cursor="pointer"
                        onClick={() => setScorecardExpanded({ ...scorecardExpanded, [index]: !scorecardExpanded[index] })}
                        align="center"
                        justify="space-between"
                      >
                        <Flex align="center" gap={3}>
                          <Badge
                            bg={`${getWeightColor(criterion.weight)}.subtle`}
                            color={getWeightColor(criterion.weight)}
                            fontSize="xs"
                            px={2}
                            py={0.5}
                            borderRadius="md"
                          >
                            {getWeightLabel(criterion.weight)}
                          </Badge>
                          <Text fontSize="sm" fontWeight="medium" color="text">
                            {criterion.name}
                          </Text>
                        </Flex>
                        <Flex align="center" gap={2}>
                          <Button
                            size="xs"
                            variant="ghost"
                            color="text.muted"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (editingCriterion === index) {
                                setEditingCriterion(null);
                              } else {
                                setEditingCriterion(index);
                                setScorecardExpanded({ ...scorecardExpanded, [index]: true });
                              }
                            }}
                            _hover={{ color: "primary", bg: "primary.subtle" }}
                          >
                            <Pencil size={14} />
                          </Button>
                          {scorecardExpanded[index] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </Flex>
                      </Flex>

                      {/* Criterion details (expanded) */}
                      {scorecardExpanded[index] && (
                        <Box px={4} py={3} bg="surface">
                          {editingCriterion === index ? (
                            <Stack gap={3}>
                              <Box>
                                <Text fontSize="xs" fontWeight="medium" color="text.muted" mb={1}>{t("jobEdit.scorecard.fields.name")}</Text>
                                <Input
                                  value={criterion.name}
                                  onChange={(e) => handleUpdateCriterion(index, { name: e.target.value })}
                                  fontSize="sm"
                                  borderColor="border"
                                />
                              </Box>
                              <Box>
                                <Text fontSize="xs" fontWeight="medium" color="text.muted" mb={1}>{t("jobEdit.scorecard.fields.description")}</Text>
                                <Textarea
                                  value={criterion.description}
                                  onChange={(e) => handleUpdateCriterion(index, { description: e.target.value })}
                                  fontSize="sm"
                                  rows={2}
                                  borderColor="border"
                                />
                              </Box>
                              <Box>
                                <Text fontSize="xs" fontWeight="medium" color="text.muted" mb={1}>{t("jobEdit.scorecard.weight.label")}</Text>
                                <SelectField
                                  value={criterion.weight}
                                  onChange={(v) => handleUpdateCriterion(index, { weight: v as CriterionWeight })}
                                  options={[
                                    { value: "critical", label: t("jobEdit.scorecard.weight.criticalFull") },
                                    { value: "important", label: t("jobEdit.scorecard.weight.important") },
                                    { value: "nice_to_have", label: t("jobEdit.scorecard.weight.nice_to_have") },
                                  ]}
                                />
                              </Box>
                              <Flex gap={2} justify="flex-end">
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  color="error"
                                  onClick={() => handleDeleteCriterion(index)}
                                  _hover={{ bg: "error.subtle" }}
                                >
                                  {t("jobEdit.actions.delete")}
                                </Button>
                              </Flex>
                            </Stack>
                          ) : (
                            <Stack gap={3}>
                              <Text fontSize="sm" color="text.secondary">{criterion.description}</Text>
                              {criterion.positive_signals && criterion.positive_signals.length > 0 && (
                                <Box>
                                  <Text fontSize="xs" fontWeight="medium" color="success" mb={1}>{t("jobEdit.scorecard.signals.positive")}</Text>
                                  <Stack gap={1}>
                                    {criterion.positive_signals.map((signal, i) => (
                                      <Text key={i} fontSize="xs" color="text.muted">• {signal}</Text>
                                    ))}
                                  </Stack>
                                </Box>
                              )}
                              {criterion.negative_signals && criterion.negative_signals.length > 0 && (
                                <Box>
                                  <Text fontSize="xs" fontWeight="medium" color="warning" mb={1}>{t("jobEdit.scorecard.signals.negative")}</Text>
                                  <Stack gap={1}>
                                    {criterion.negative_signals.map((signal, i) => (
                                      <Text key={i} fontSize="xs" color="text.muted">• {signal}</Text>
                                    ))}
                                  </Stack>
                                </Box>
                              )}
                              {criterion.red_flags && criterion.red_flags.length > 0 && (
                                <Box>
                                  <Text fontSize="xs" fontWeight="medium" color="error" mb={1}>{t("jobEdit.scorecard.signals.redFlags")}</Text>
                                  <Stack gap={1}>
                                    {criterion.red_flags.map((flag, i) => (
                                      <Text key={i} fontSize="xs" color="text.muted">• {flag}</Text>
                                    ))}
                                  </Stack>
                                </Box>
                              )}
                            </Stack>
                          )}
                        </Box>
                      )}
                    </Box>
                  ))}
                </Stack>

                {/* Actions */}
                <Flex gap={2} justify="space-between" pt={2}>
                  <Flex gap={2}>
                    <Button
                      size="sm"
                      variant="outline"
                      borderColor="border"
                      color="text.secondary"
                      onClick={handleAddCriterion}
                      _hover={{ bg: "bg.subtle" }}
                    >
                      <Flex align="center" gap={1}>
                        <Plus size={14} />
                        <Text>{t("jobEdit.scorecard.addCriterion")}</Text>
                      </Flex>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      color="text.muted"
                      onClick={handleGenerateScorecard}
                      disabled={isGeneratingScorecard}
                      _hover={{ bg: "bg.subtle" }}
                    >
                      <Flex align="center" gap={1}>
                        <RefreshCw size={14} />
                        <Text>{t("jobEdit.actions.regenerate")}</Text>
                      </Flex>
                    </Button>
                  </Flex>
                  <Button
                    size="sm"
                    bg={scorecardSaved ? "success" : "primary"}
                    color="white"
                    onClick={handleSaveScorecard}
                    disabled={isSavingScorecard}
                    _hover={{ bg: scorecardSaved ? "success" : "primary.hover" }}
                  >
                    {isSavingScorecard ? (
                      <Flex align="center" gap={2}>
                        <Spinner size="xs" />
                        <Text>{t("jobEdit.saveStatus.saving")}</Text>
                      </Flex>
                    ) : scorecardSaved ? (
                      <Flex align="center" gap={2}>
                        <Check size={16} />
                        <Text>{t("jobEdit.saveStatus.saved")}</Text>
                      </Flex>
                    ) : (
                      <Text>{t("jobEdit.actions.save")}</Text>
                    )}
                  </Button>
                </Flex>
              </>
            )}
          </Stack>
        </Box>

        {/* Section 5: Work Sample */}
        <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" shadow="card" overflow="hidden">
          <Flex px={5} py={4} borderBottom="1px solid" borderBottomColor="border.subtle" bg="bg.subtle" gap={3} align="center" justify="space-between">
            <Flex gap={3} align="center">
              <Circle size="32px" bg="teal.subtle" color="teal.600">
                <FileText size={18} strokeWidth={1.5} />
              </Circle>
              <Box>
                <Heading as="h2" fontSize="lg" fontWeight="semibold" color="text">
                  {t("jobEdit.sections.workSample.title")}
                </Heading>
                <Text fontSize="xs" color="text.muted">
                  {t("jobEdit.sections.workSample.description")}
                </Text>
              </Box>
            </Flex>
            {workSample && (
              <Badge bg="success.subtle" color="success" fontSize="xs" px={2} py={0.5} borderRadius="full">
                {workSample.sections.length > 1
                  ? t("jobEdit.workSample.sectionCountPlural", { count: workSample.sections.length })
                  : t("jobEdit.workSample.sectionCount", { count: workSample.sections.length })}
              </Badge>
            )}
          </Flex>

          <Stack gap={4} p={5}>
            {!scorecard ? (
              <Box textAlign="center" py={6}>
                <Circle size="48px" bg="bg.muted" color="text.muted" mx="auto" mb={3}>
                  <FileText size={18} strokeWidth={1.5} />
                </Circle>
                <Text fontSize="sm" color="text.muted">
                  {t("jobEdit.workSample.emptyNoScorecard")}
                </Text>
              </Box>
            ) : !workSample ? (
              <Box textAlign="center" py={6}>
                <Circle size="48px" bg="teal.subtle" color="teal.600" mx="auto" mb={3}>
                  <Sparkles size={18} strokeWidth={1.5} />
                </Circle>
                <Text fontSize="sm" color="text.secondary" mb={4}>
                  {t("jobEdit.workSample.emptyMessage")}
                </Text>
                <Button
                  bg="primary"
                  color="white"
                  onClick={handleGenerateWorkSample}
                  disabled={isGeneratingWorkSample}
                  _hover={{ bg: "primary.hover" }}
                >
                  {isGeneratingWorkSample ? (
                    <Flex align="center" gap={2}>
                      <Spinner size="xs" />
                      <Text>{t("jobEdit.workSample.generating")}</Text>
                    </Flex>
                  ) : (
                    <Flex align="center" gap={2}>
                      <Sparkles size={18} strokeWidth={1.5} />
                      <Text>{t("jobEdit.workSample.generate")}</Text>
                    </Flex>
                  )}
                </Button>
              </Box>
            ) : (
              <>
                {/* Intro message */}
                <Box>
                  <Text fontSize="xs" fontWeight="medium" color="text.muted" mb={2}>{t("jobEdit.workSample.introMessage")}</Text>
                  <Textarea
                    value={workSample.intro_message}
                    onChange={(e) => { setWorkSample({ ...workSample, intro_message: e.target.value }); setWorkSampleSaved(false); }}
                    fontSize="sm"
                    rows={3}
                    borderColor="border"
                    _hover={{ borderColor: "border.emphasis" }}
                    _focus={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
                  />
                </Box>

                {/* Total time */}
                {workSample.estimated_time_minutes && (
                  <Flex align="center" gap={2}>
                    <Calendar size={18} strokeWidth={1.5} />
                    <Text fontSize="sm" color="text.secondary">
                      {t("jobEdit.workSample.estimatedTime")} <Text as="span" fontWeight="medium">{workSample.estimated_time_minutes} {t("jobEdit.workSample.minutes")}</Text>
                    </Text>
                  </Flex>
                )}

                {/* Sections */}
                <Stack gap={3}>
                  {workSample.sections.map((section, index) => (
                    <Box
                      key={index}
                      border="1px solid"
                      borderColor={editingSection === index ? "primary" : "border"}
                      borderRadius="lg"
                      overflow="hidden"
                    >
                      <Flex
                        px={4}
                        py={3}
                        bg={workSampleExpanded[index] ? "bg.subtle" : "surface"}
                        cursor="pointer"
                        onClick={() => setWorkSampleExpanded({ ...workSampleExpanded, [index]: !workSampleExpanded[index] })}
                        align="center"
                        justify="space-between"
                      >
                        <Flex align="center" gap={3}>
                          <Badge bg="teal.subtle" color="teal.600" fontSize="xs" px={2} py={0.5} borderRadius="md">
                            {section.estimated_time_minutes} min
                          </Badge>
                          <Text fontSize="sm" fontWeight="medium" color="text">
                            {section.title}
                          </Text>
                        </Flex>
                        <Flex align="center" gap={2}>
                          <Button
                            size="xs"
                            variant="ghost"
                            color="text.muted"
                            onClick={(e) => { e.stopPropagation(); setEditingSection(editingSection === index ? null : index); }}
                            _hover={{ color: "primary", bg: "primary.subtle" }}
                          >
                            <Pencil size={14} />
                          </Button>
                          {workSampleExpanded[index] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </Flex>
                      </Flex>

                      {workSampleExpanded[index] && (
                        <Box px={4} py={3} bg="surface">
                          {editingSection === index ? (
                            <Stack gap={3}>
                              <Box>
                                <Text fontSize="xs" fontWeight="medium" color="text.muted" mb={1}>{t("jobEdit.workSample.fields.title")}</Text>
                                <Input
                                  value={section.title}
                                  onChange={(e) => handleUpdateSection(index, { title: e.target.value })}
                                  fontSize="sm"
                                  borderColor="border"
                                />
                              </Box>
                              <Box>
                                <Text fontSize="xs" fontWeight="medium" color="text.muted" mb={1}>{t("jobEdit.workSample.fields.description")}</Text>
                                <Textarea
                                  value={section.description}
                                  onChange={(e) => handleUpdateSection(index, { description: e.target.value })}
                                  fontSize="sm"
                                  rows={2}
                                  borderColor="border"
                                />
                              </Box>
                              <Box>
                                <Text fontSize="xs" fontWeight="medium" color="text.muted" mb={1}>{t("jobEdit.workSample.fields.instructions")}</Text>
                                <Textarea
                                  value={section.instructions}
                                  onChange={(e) => handleUpdateSection(index, { instructions: e.target.value })}
                                  fontSize="sm"
                                  rows={4}
                                  borderColor="border"
                                />
                              </Box>
                              <Box>
                                <Text fontSize="xs" fontWeight="medium" color="text.muted" mb={1}>{t("jobEdit.workSample.fields.estimatedTime")}</Text>
                                <Input
                                  type="number"
                                  value={section.estimated_time_minutes}
                                  onChange={(e) => handleUpdateSection(index, { estimated_time_minutes: parseInt(e.target.value) || 0 })}
                                  fontSize="sm"
                                  maxW="100px"
                                  borderColor="border"
                                />
                              </Box>
                            </Stack>
                          ) : (
                            <Stack gap={3}>
                              <Text fontSize="sm" color="text.secondary">{section.description}</Text>
                              <Box>
                                <Text fontSize="xs" fontWeight="medium" color="text.muted" mb={1}>{t("jobEdit.workSample.fields.instructions")}</Text>
                                <Text fontSize="sm" color="text" whiteSpace="pre-wrap">{section.instructions}</Text>
                              </Box>
                              {section.criteria_evaluated.length > 0 && (
                                <Box>
                                  <Text fontSize="xs" fontWeight="medium" color="text.muted" mb={1}>{t("jobEdit.workSample.criteriaEvaluated")}</Text>
                                  <Flex gap={1} flexWrap="wrap">
                                    {section.criteria_evaluated.map((c, i) => (
                                      <Badge key={i} bg="purple.subtle" color="purple.600" fontSize="xs" px={2} py={0.5} borderRadius="md">
                                        {c}
                                      </Badge>
                                    ))}
                                  </Flex>
                                </Box>
                              )}
                              {section.rubric && (
                                <Box>
                                  <Text fontSize="xs" fontWeight="medium" color="text.muted" mb={1}>{t("jobEdit.workSample.whatWeEvaluate")}</Text>
                                  <Text fontSize="sm" color="text.secondary">{section.rubric}</Text>
                                </Box>
                              )}
                            </Stack>
                          )}
                        </Box>
                      )}
                    </Box>
                  ))}
                </Stack>

                {/* Actions */}
                <Flex gap={2} justify="space-between" pt={2}>
                  <Button
                    size="sm"
                    variant="ghost"
                    color="text.muted"
                    onClick={handleGenerateWorkSample}
                    disabled={isGeneratingWorkSample}
                    _hover={{ bg: "bg.subtle" }}
                  >
                    <Flex align="center" gap={1}>
                      <RefreshCw size={14} />
                      <Text>{t("jobEdit.actions.regenerate")}</Text>
                    </Flex>
                  </Button>
                  <Button
                    size="sm"
                    bg={workSampleSaved ? "success" : "primary"}
                    color="white"
                    onClick={handleSaveWorkSample}
                    disabled={isSavingWorkSample}
                    _hover={{ bg: workSampleSaved ? "success" : "primary.hover" }}
                  >
                    {isSavingWorkSample ? (
                      <Flex align="center" gap={2}>
                        <Spinner size="xs" />
                        <Text>{t("jobEdit.saveStatus.saving")}</Text>
                      </Flex>
                    ) : workSampleSaved ? (
                      <Flex align="center" gap={2}>
                        <Check size={16} />
                        <Text>{t("jobEdit.saveStatus.saved")}</Text>
                      </Flex>
                    ) : (
                      <Text>{t("jobEdit.actions.save")}</Text>
                    )}
                  </Button>
                </Flex>
              </>
            )}
          </Stack>
        </Box>

        {/* Section 6: Logistique */}
        <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" shadow="card" overflow="hidden">
          <Flex px={5} py={4} borderBottom="1px solid" borderBottomColor="border.subtle" bg="bg.subtle" gap={3} align="center">
            <Circle size="32px" bg="warning.subtle" color="warning">
              <Calendar size={18} strokeWidth={1.5} />
            </Circle>
            <Box>
              <Heading as="h2" fontSize="lg" fontWeight="semibold" color="text">
                {t("jobEdit.sections.logistics.title")}
              </Heading>
              <Text fontSize="xs" color="text.muted">
                {t("jobEdit.sections.logistics.description")}
              </Text>
            </Box>
          </Flex>

          <Stack gap={5} p={5}>
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                  {t("jobEdit.fields.salaryRange.label")}
                </Text>
                <Flex gap={2} align="center">
                  <Input
                    type="number"
                    value={salaryMin}
                    onChange={(e) => { setSalaryMin(e.target.value); markChanged(); }}
                    placeholder={t("jobEdit.fields.salaryRange.min")}
                    fontSize="sm"
                    borderColor="border"
                    _hover={{ borderColor: "border.emphasis" }}
                    _focus={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
                  />
                  <Text color="text.muted">-</Text>
                  <Input
                    type="number"
                    value={salaryMax}
                    onChange={(e) => { setSalaryMax(e.target.value); markChanged(); }}
                    placeholder={t("jobEdit.fields.salaryRange.max")}
                    fontSize="sm"
                    borderColor="border"
                    _hover={{ borderColor: "border.emphasis" }}
                    _focus={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
                  />
                  <Text fontSize="sm" color="text.muted">{t("jobEdit.fields.salaryRange.unit")}</Text>
                </Flex>
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                  {t("jobEdit.fields.urgency.label")}
                </Text>
                <SelectField
                  value={urgency}
                  onChange={(v) => { setUrgency(v as Urgency); markChanged(); }}
                  options={getUrgencyOptions(t)}
                  placeholder={t("jobEdit.fields.urgency.placeholder")}
                />
              </Box>
            </Grid>

            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                {t("jobEdit.fields.startDate.label")}
              </Text>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); markChanged(); }}
                fontSize="sm"
                borderColor="border"
                maxW="200px"
                _hover={{ borderColor: "border.emphasis" }}
                _focus={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
              />
            </Box>
          </Stack>
        </Box>

        {/* Actions */}
        <Flex gap={3} pt={2} justify="space-between" align="center">
          <Button
            variant="outline"
            borderColor="border"
            color="text.secondary"
            onClick={() => navigate("/app/jobs")}
            _hover={{ bg: "bg.subtle" }}
          >
            {t("jobEdit.actions.back")}
          </Button>

          <Button
            bg={saveStatus === "saved" && !hasUnsavedChanges ? "success" : "primary"}
            color="white"
            onClick={() => saveJob(false)}
            disabled={isSaving || !title.trim()}
            _hover={{ bg: saveStatus === "saved" && !hasUnsavedChanges ? "success" : "primary.hover" }}
            shadow="button"
          >
            {isSaving ? (
              <Flex align="center" gap={2}>
                <Spinner size="xs" />
                <Text>{t("jobEdit.saveStatus.saving")}</Text>
              </Flex>
            ) : saveStatus === "saved" && !hasUnsavedChanges ? (
              <Flex align="center" gap={2}>
                <Check size={16} />
                <Text>{t("jobEdit.saveStatus.saved")}</Text>
              </Flex>
            ) : (
              <Flex align="center" gap={2}>
                <Save size={16} />
                <Text>{t("jobEdit.actions.save")}</Text>
              </Flex>
            )}
          </Button>
        </Flex>
      </Stack>
    </Box>
  );
}
