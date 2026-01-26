import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router";
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
} from "@chakra-ui/react";
import type { MetaFunction } from "react-router";
import {
  getJob,
  updateJob,
  publishJob,
  pauseJob,
  closeJob,
  type User,
  type UpdateJobRequest,
  type Job,
  type JobStatus,
  type LocationType,
  type ContractType,
  type SeniorityLevel,
  type TeamSize,
  type Urgency,
} from "~/components/lib/api";

export const meta: MetaFunction = () => {
  return [{ title: "Modifier le poste - Baara" }];
};

interface OutletContextType {
  user: User | null;
}

// Icons
function BriefcaseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
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

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
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
    <Box
      as="select"
      value={value}
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
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
    </Box>
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
function StatusBadge({ status }: { status: JobStatus }) {
  const config = {
    draft: { bg: "bg.muted", color: "text.muted", label: "Brouillon" },
    active: { bg: "success.subtle", color: "success", label: "Actif" },
    paused: { bg: "warning.subtle", color: "warning", label: "En pause" },
    closed: { bg: "error.subtle", color: "error", label: "Fermé" },
  };

  const { bg, color, label } = config[status];

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

// Options for select fields
const locationTypeOptions: SelectOption[] = [
  { value: "remote", label: "Full remote" },
  { value: "hybrid", label: "Hybride" },
  { value: "onsite", label: "Sur site" },
];

const contractTypeOptions: SelectOption[] = [
  { value: "cdi", label: "CDI" },
  { value: "cdd", label: "CDD" },
  { value: "freelance", label: "Freelance" },
];

const seniorityOptions: SelectOption[] = [
  { value: "junior", label: "Junior (0-2 ans)" },
  { value: "mid", label: "Mid (2-5 ans)" },
  { value: "senior", label: "Senior (5-8 ans)" },
  { value: "staff", label: "Staff (8+ ans)" },
  { value: "principal", label: "Principal" },
];

const teamSizeOptions: SelectOption[] = [
  { value: "1-3", label: "1-3 personnes" },
  { value: "4-8", label: "4-8 personnes" },
  { value: "9-15", label: "9-15 personnes" },
  { value: "16+", label: "16+ personnes" },
];

const urgencyOptions: SelectOption[] = [
  { value: "immediate", label: "Immédiat" },
  { value: "1-2months", label: "1-2 mois" },
  { value: "flexible", label: "Flexible" },
];

const stackSuggestions = [
  "Go", "Python", "TypeScript", "JavaScript", "Rust", "Java",
  "Kubernetes", "Docker", "AWS", "GCP", "PostgreSQL", "Redis",
  "React", "Node.js", "GraphQL", "gRPC", "Kafka", "Terraform"
];

export default function EditJob() {
  const navigate = useNavigate();
  const params = useParams();
  const { user } = useOutletContext<OutletContextType>();
  const jobId = params.id!;

  // Loading state
  const [isLoadingJob, setIsLoadingJob] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Form state
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Section 1: Le poste
  const [title, setTitle] = useState("");
  const [team, setTeam] = useState("");
  const [locationType, setLocationType] = useState<LocationType | "">("");
  const [locationCity, setLocationCity] = useState("");
  const [contractType, setContractType] = useState<ContractType | "">("");
  const [seniority, setSeniority] = useState<SeniorityLevel | "">("");

  // Section 2: Le contexte
  const [stack, setStack] = useState<string[]>([]);
  const [teamSize, setTeamSize] = useState<TeamSize | "">("");
  const [managerInfo, setManagerInfo] = useState("");
  const [businessContext, setBusinessContext] = useState("");

  // Section 3: Les outcomes
  const [mainProblem, setMainProblem] = useState("");
  const [expectedOutcomes, setExpectedOutcomes] = useState<string[]>(["", "", ""]);
  const [successLooksLike, setSuccessLooksLike] = useState("");
  const [failureLooksLike, setFailureLooksLike] = useState("");

  // Section 4: Logistique
  const [salaryMin, setSalaryMin] = useState<string>("");
  const [salaryMax, setSalaryMax] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [urgency, setUrgency] = useState<Urgency | "">("");

  // Auto-save refs
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Check if user is recruiter/admin
  useEffect(() => {
    if (user && user.role !== "recruiter" && user.role !== "admin") {
      navigate("/app/proof-profile");
    }
  }, [user, navigate]);

  // Load job data
  useEffect(() => {
    const loadJob = async () => {
      try {
        const response = await getJob(jobId);
        const j = response.job;
        setJob(j);

        // Populate form fields
        setTitle(j.title || "");
        setTeam(j.team || "");
        setLocationType((j.location_type as LocationType) || "");
        setLocationCity(j.location_city || "");
        setContractType((j.contract_type as ContractType) || "");
        setSeniority((j.seniority as SeniorityLevel) || "");
        setStack(j.stack || []);
        setTeamSize((j.team_size as TeamSize) || "");
        setManagerInfo(j.manager_info || "");
        setBusinessContext(j.business_context || "");
        setMainProblem(j.main_problem || "");
        setExpectedOutcomes(j.expected_outcomes?.length ? j.expected_outcomes : ["", "", ""]);
        setSuccessLooksLike(j.success_looks_like || "");
        setFailureLooksLike(j.failure_looks_like || "");
        setSalaryMin(j.salary_min?.toString() || "");
        setSalaryMax(j.salary_max?.toString() || "");
        setStartDate(j.start_date ? j.start_date.split("T")[0] : "");
        setUrgency((j.urgency as Urgency) || "");
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Erreur lors du chargement");
      } finally {
        setIsLoadingJob(false);
      }
    };

    loadJob();
  }, [jobId]);

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
  }, [jobId, title, buildJobData]);

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
      await saveJob(false);
      // Then publish
      const response = await publishJob(jobId);
      setJob(response.job);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la publication");
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la mise en pause");
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la fermeture");
    } finally {
      setIsLoading(false);
    }
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

  // Loading state
  if (isLoadingJob) {
    return (
      <Flex minH="400px" align="center" justify="center">
        <Spinner size="lg" color="primary" />
      </Flex>
    );
  }

  // Error state
  if (loadError) {
    return (
      <Box py={8} px={8} maxW="900px" mx="auto">
        <Box bg="error.subtle" borderRadius="lg" border="1px solid" borderColor="error.muted" px={4} py={3}>
          <Text fontSize="sm" color="error">{loadError}</Text>
        </Box>
        <Button
          mt={4}
          variant="outline"
          borderColor="border"
          color="text.secondary"
          onClick={() => navigate("/app/jobs")}
          _hover={{ bg: "bg.subtle" }}
        >
          <Flex align="center" gap={2}>
            <ArrowLeftIcon />
            <Text>Retour aux postes</Text>
          </Flex>
        </Button>
      </Box>
    );
  }

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
                <ArrowLeftIcon />
                <Text>Retour aux postes</Text>
              </Flex>
            </Button>
            <Heading as="h1" fontSize="xl" color="text" mb={1} fontWeight="semibold">
              {title || "Nouveau poste"}
            </Heading>
            <Text fontSize="sm" color="text.secondary">
              Modifiez les informations et les outcomes attendus pour ce poste.
            </Text>
          </Box>

          <Flex gap={3} align="center" flexWrap="wrap">
            {/* Save status */}
            {saveStatus === "saving" && (
              <Flex align="center" gap={2} color="text.muted">
                <Spinner size="xs" />
                <Text fontSize="xs">Sauvegarde...</Text>
              </Flex>
            )}
            {saveStatus === "saved" && (
              <Flex align="center" gap={2} color="success">
                <CheckIcon />
                <Text fontSize="xs">Sauvegardé</Text>
              </Flex>
            )}

            {job && <StatusBadge status={job.status} />}
          </Flex>
        </Flex>

        {/* Status actions */}
        {job && (
          <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" p={4}>
            <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="text" mb={1}>
                  Statut du poste
                </Text>
                <Text fontSize="xs" color="text.muted">
                  {job.status === "draft" && "Ce poste est en brouillon. Publiez-le pour le rendre visible."}
                  {job.status === "active" && "Ce poste est actif et visible aux candidats."}
                  {job.status === "paused" && "Ce poste est en pause. Les candidats ne peuvent plus postuler."}
                  {job.status === "closed" && "Ce poste est fermé."}
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
                      <PlayIcon />
                      <Text>Publier</Text>
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
                        <PauseIcon />
                        <Text>Mettre en pause</Text>
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
                        <XIcon />
                        <Text>Fermer</Text>
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
                        <PlayIcon />
                        <Text>Réactiver</Text>
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
                        <XIcon />
                        <Text>Fermer</Text>
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
              Progression
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
              <BriefcaseIcon />
            </Circle>
            <Box>
              <Heading as="h2" fontSize="md" fontWeight="semibold" color="text">
                Le poste
              </Heading>
              <Text fontSize="xs" color="text.muted">
                Informations generales sur le poste
              </Text>
            </Box>
          </Flex>

          <Stack gap={5} p={5}>
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                  Titre du poste <Text as="span" color="error">*</Text>
                </Text>
                <Input
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); markChanged(); }}
                  placeholder="Ex: Senior Backend Engineer"
                  fontSize="sm"
                  borderColor="border"
                  _hover={{ borderColor: "border.emphasis" }}
                  _focus={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
                />
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                  Equipe
                </Text>
                <Input
                  value={team}
                  onChange={(e) => { setTeam(e.target.value); markChanged(); }}
                  placeholder="Ex: Payments, Infrastructure, etc."
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
                  Mode de travail
                </Text>
                <SelectField
                  value={locationType}
                  onChange={(v) => { setLocationType(v as LocationType); markChanged(); }}
                  options={locationTypeOptions}
                  placeholder="Selectionner..."
                />
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                  Type de contrat
                </Text>
                <SelectField
                  value={contractType}
                  onChange={(v) => { setContractType(v as ContractType); markChanged(); }}
                  options={contractTypeOptions}
                  placeholder="Selectionner..."
                />
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                  Seniorite
                </Text>
                <SelectField
                  value={seniority}
                  onChange={(v) => { setSeniority(v as SeniorityLevel); markChanged(); }}
                  options={seniorityOptions}
                  placeholder="Selectionner..."
                />
              </Box>
            </Grid>

            {(locationType === "hybrid" || locationType === "onsite") && (
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                  Ville
                </Text>
                <Input
                  value={locationCity}
                  onChange={(e) => { setLocationCity(e.target.value); markChanged(); }}
                  placeholder="Ex: Paris, Lyon, etc."
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
              <UsersIcon />
            </Circle>
            <Box>
              <Heading as="h2" fontSize="md" fontWeight="semibold" color="text">
                Le contexte
              </Heading>
              <Text fontSize="xs" color="text.muted">
                Stack technique et environnement de travail
              </Text>
            </Box>
          </Flex>

          <Stack gap={5} p={5}>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                Stack technique
              </Text>
              <TagInput
                value={stack}
                onChange={(v) => { setStack(v); markChanged(); }}
                placeholder="Tapez et appuyez sur Entree pour ajouter..."
                suggestions={stackSuggestions}
              />
            </Box>

            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                  Taille de l'equipe
                </Text>
                <SelectField
                  value={teamSize}
                  onChange={(v) => { setTeamSize(v as TeamSize); markChanged(); }}
                  options={teamSizeOptions}
                  placeholder="Selectionner..."
                />
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                  Manager
                </Text>
                <Input
                  value={managerInfo}
                  onChange={(e) => { setManagerInfo(e.target.value); markChanged(); }}
                  placeholder="Ex: Marie Dupont, Engineering Manager"
                  fontSize="sm"
                  borderColor="border"
                  _hover={{ borderColor: "border.emphasis" }}
                  _focus={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
                />
              </Box>
            </Grid>

            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                Contexte business <Text as="span" color="error">*</Text>
              </Text>
              <Textarea
                value={businessContext}
                onChange={(e) => { setBusinessContext(e.target.value); markChanged(); }}
                placeholder="Decrivez le contexte de l'equipe, les enjeux business actuels, les projets en cours..."
                rows={4}
                fontSize="sm"
                borderColor="border"
                _hover={{ borderColor: "border.emphasis" }}
                _focus={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
              />
              <Text fontSize="xs" color="text.muted" mt={1}>
                Ce contexte aidera a generer des criteres d'evaluation pertinents.
              </Text>
            </Box>
          </Stack>
        </Box>

        {/* Section 3: Les outcomes */}
        <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" shadow="card" overflow="hidden">
          <Flex px={5} py={4} borderBottom="1px solid" borderBottomColor="border.subtle" bg="bg.subtle" gap={3} align="center">
            <Circle size="32px" bg="success.subtle" color="success">
              <TargetIcon />
            </Circle>
            <Box>
              <Heading as="h2" fontSize="md" fontWeight="semibold" color="text">
                Les outcomes
              </Heading>
              <Text fontSize="xs" color="text.muted">
                Ce que vous attendez de cette personne
              </Text>
            </Box>
          </Flex>

          <Stack gap={5} p={5}>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                Le probleme principal a resoudre <Text as="span" color="error">*</Text>
              </Text>
              <Textarea
                value={mainProblem}
                onChange={(e) => { setMainProblem(e.target.value); markChanged(); }}
                placeholder="Quel est LE probleme que cette personne devra resoudre ? Soyez specifique."
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
                  Resultats attendus (3-5) <Text as="span" color="error">*</Text>
                </Text>
                {expectedOutcomes.length < 5 && (
                  <Button
                    size="xs"
                    variant="ghost"
                    color="primary"
                    onClick={addOutcome}
                    _hover={{ bg: "primary.subtle" }}
                  >
                    <PlusIcon /> Ajouter
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
                      placeholder={`Resultat attendu #${index + 1}`}
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
                        <TrashIcon />
                      </Button>
                    )}
                  </Flex>
                ))}
              </Stack>
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                A quoi ressemble le succes ? <Text as="span" color="error">*</Text>
              </Text>
              <Textarea
                value={successLooksLike}
                onChange={(e) => { setSuccessLooksLike(e.target.value); markChanged(); }}
                placeholder="Dans 6 mois, si cette personne reussit parfaitement, que se sera-t-il passe concretement ?"
                rows={3}
                fontSize="sm"
                borderColor="border"
                _hover={{ borderColor: "border.emphasis" }}
                _focus={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
              />
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                A quoi ressemble l'echec ?
              </Text>
              <Textarea
                value={failureLooksLike}
                onChange={(e) => { setFailureLooksLike(e.target.value); markChanged(); }}
                placeholder="Quels comportements ou resultats indiqueraient que ce n'est pas le bon fit ?"
                rows={3}
                fontSize="sm"
                borderColor="border"
                _hover={{ borderColor: "border.emphasis" }}
                _focus={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
              />
            </Box>
          </Stack>
        </Box>

        {/* Section 4: Logistique */}
        <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" shadow="card" overflow="hidden">
          <Flex px={5} py={4} borderBottom="1px solid" borderBottomColor="border.subtle" bg="bg.subtle" gap={3} align="center">
            <Circle size="32px" bg="warning.subtle" color="warning">
              <CalendarIcon />
            </Circle>
            <Box>
              <Heading as="h2" fontSize="md" fontWeight="semibold" color="text">
                Logistique
              </Heading>
              <Text fontSize="xs" color="text.muted">
                Remuneration et timing (optionnel)
              </Text>
            </Box>
          </Flex>

          <Stack gap={5} p={5}>
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                  Fourchette de salaire
                </Text>
                <Flex gap={2} align="center">
                  <Input
                    type="number"
                    value={salaryMin}
                    onChange={(e) => { setSalaryMin(e.target.value); markChanged(); }}
                    placeholder="Min"
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
                    placeholder="Max"
                    fontSize="sm"
                    borderColor="border"
                    _hover={{ borderColor: "border.emphasis" }}
                    _focus={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
                  />
                  <Text fontSize="sm" color="text.muted">EUR/an</Text>
                </Flex>
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                  Urgence
                </Text>
                <SelectField
                  value={urgency}
                  onChange={(v) => { setUrgency(v as Urgency); markChanged(); }}
                  options={urgencyOptions}
                  placeholder="Selectionner..."
                />
              </Box>
            </Grid>

            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                Date de debut souhaitee
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
            Retour
          </Button>

          <Button
            bg="primary"
            color="white"
            onClick={() => saveJob(false)}
            disabled={isSaving || !title.trim()}
            _hover={{ bg: "primary.hover" }}
            shadow="button"
          >
            {isSaving ? (
              <Flex align="center" gap={2}>
                <Spinner size="xs" />
                <Text>Sauvegarde...</Text>
              </Flex>
            ) : (
              <Flex align="center" gap={2}>
                <SaveIcon />
                <Text>Sauvegarder</Text>
              </Flex>
            )}
          </Button>
        </Flex>
      </Stack>
    </Box>
  );
}
