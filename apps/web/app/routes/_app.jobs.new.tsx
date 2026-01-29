import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { Briefcase, Users, Target, Calendar, Save, Check, Plus, Trash2 } from "lucide-react";
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
import {
  createJob,
  updateJob,
  type CreateJobRequest,
  type Job,
  type LocationType,
  type ContractType,
  type SeniorityLevel,
  type TeamSize,
  type Urgency,
} from "~/components/lib/api";
import { requireRole } from "~/components/lib/auth.server";
import type { Route } from "./+types/_app.jobs.new";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Nouveau poste - Baara" }];
};

export async function loader({ request }: Route.LoaderArgs) {
  await requireRole(request, ["recruiter", "admin"]);
  return {};
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

export default function NewJob() {
  const navigate = useNavigate();

  // Form state
  const [jobId, setJobId] = useState<string | null>(null);
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

  // Build job data from form state
  const buildJobData = useCallback((): CreateJobRequest => {
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

      if (jobId) {
        // Update existing
        await updateJob(jobId, data);
      } else {
        // Create new
        const response = await createJob(data);
        setJobId(response.job.id);
      }

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

  // Handle publish
  const handleSaveAndContinue = async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = buildJobData();

      let savedJobId = jobId;
      if (jobId) {
        await updateJob(jobId, data);
      } else {
        const response = await createJob(data);
        savedJobId = response.job.id;
        setJobId(savedJobId);
      }

      // Navigate to the job edit page or scorecard generation
      navigate(`/app/jobs/${savedJobId}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate progress
  const calculateProgress = () => {
    let filled = 0;
    let total = 10;

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
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
          <Box>
            <Heading as="h1" fontSize="xl" color="text" mb={1} fontWeight="semibold">
              Créer un nouveau poste
            </Heading>
            <Text fontSize="sm" color="text.secondary">
              Définissez le contexte et les outcomes attendus pour ce poste.
            </Text>
          </Box>

          <Flex gap={3} align="center">
            {/* Save status */}
            {saveStatus === "saving" && (
              <Flex align="center" gap={2} color="text.muted">
                <Spinner size="xs" />
                <Text fontSize="xs">Sauvegarde...</Text>
              </Flex>
            )}
            {saveStatus === "saved" && (
              <Flex align="center" gap={2} color="success">
                <Check size={16} />
                <Text fontSize="xs">Sauvegardé</Text>
              </Flex>
            )}

            <Badge
              bg="bg.muted"
              color="text.muted"
              fontSize="xs"
              fontWeight="semibold"
              px={3}
              py={1}
              borderRadius="full"
            >
              Brouillon
            </Badge>
          </Flex>
        </Flex>

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
              <Briefcase size={18} strokeWidth={1.5} />
            </Circle>
            <Box>
              <Heading as="h2" fontSize="md" fontWeight="semibold" color="text">
                Le poste
              </Heading>
              <Text fontSize="xs" color="text.muted">
                Informations générales sur le poste
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
                  Équipe
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
                  placeholder="Sélectionner..."
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
                  placeholder="Sélectionner..."
                />
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                  Séniorité
                </Text>
                <SelectField
                  value={seniority}
                  onChange={(v) => { setSeniority(v as SeniorityLevel); markChanged(); }}
                  options={seniorityOptions}
                  placeholder="Sélectionner..."
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
              <Users size={18} strokeWidth={1.5} />
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
                placeholder="Tapez et appuyez sur Entrée pour ajouter..."
                suggestions={stackSuggestions}
              />
            </Box>

            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                  Taille de l'équipe
                </Text>
                <SelectField
                  value={teamSize}
                  onChange={(v) => { setTeamSize(v as TeamSize); markChanged(); }}
                  options={teamSizeOptions}
                  placeholder="Sélectionner..."
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
                placeholder="Décrivez le contexte de l'équipe, les enjeux business actuels, les projets en cours..."
                rows={4}
                fontSize="sm"
                borderColor="border"
                _hover={{ borderColor: "border.emphasis" }}
                _focus={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
              />
              <Text fontSize="xs" color="text.muted" mt={1}>
                Ce contexte aidera à générer des critères d'évaluation pertinents.
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
                Le problème principal à résoudre <Text as="span" color="error">*</Text>
              </Text>
              <Textarea
                value={mainProblem}
                onChange={(e) => { setMainProblem(e.target.value); markChanged(); }}
                placeholder="Quel est LE problème que cette personne devra résoudre ? Soyez spécifique."
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
                  Résultats attendus (3-5) <Text as="span" color="error">*</Text>
                </Text>
                {expectedOutcomes.length < 5 && (
                  <Button
                    size="xs"
                    variant="ghost"
                    color="primary"
                    onClick={addOutcome}
                    _hover={{ bg: "primary.subtle" }}
                  >
                    <Plus size={14} /> Ajouter
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
                      placeholder={`Résultat attendu #${index + 1}`}
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
                À quoi ressemble le succès ? <Text as="span" color="error">*</Text>
              </Text>
              <Textarea
                value={successLooksLike}
                onChange={(e) => { setSuccessLooksLike(e.target.value); markChanged(); }}
                placeholder="Dans 6 mois, si cette personne réussit parfaitement, que se sera-t-il passé concrètement ?"
                rows={3}
                fontSize="sm"
                borderColor="border"
                _hover={{ borderColor: "border.emphasis" }}
                _focus={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
              />
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                À quoi ressemble l'échec ?
              </Text>
              <Textarea
                value={failureLooksLike}
                onChange={(e) => { setFailureLooksLike(e.target.value); markChanged(); }}
                placeholder="Quels comportements ou résultats indiqueraient que ce n'est pas le bon fit ?"
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
              <Calendar size={18} strokeWidth={1.5} />
            </Circle>
            <Box>
              <Heading as="h2" fontSize="md" fontWeight="semibold" color="text">
                Logistique
              </Heading>
              <Text fontSize="xs" color="text.muted">
                Rémunération et timing (optionnel)
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
                  placeholder="Sélectionner..."
                />
              </Box>
            </Grid>

            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                Date de début souhaitée
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
            Annuler
          </Button>

          <Flex gap={3}>
            <Button
              variant="outline"
              borderColor="border"
              color="text.secondary"
              onClick={() => saveJob(false)}
              disabled={isSaving || !title.trim()}
              _hover={{ bg: "bg.subtle" }}
            >
              <Flex align="center" gap={2}>
                <Save size={16} />
                <Text>Sauvegarder</Text>
              </Flex>
            </Button>

            <Button
              bg="primary"
              color="white"
              onClick={handleSaveAndContinue}
              disabled={isLoading || !title.trim()}
              _hover={{ bg: "primary.hover" }}
              shadow="button"
            >
              {isLoading ? (
                <Flex align="center" gap={2}>
                  <Spinner size="xs" />
                  <Text>Enregistrement...</Text>
                </Flex>
              ) : (
                "Continuer vers les critères"
              )}
            </Button>
          </Flex>
        </Flex>
      </Stack>
    </Box>
  );
}
