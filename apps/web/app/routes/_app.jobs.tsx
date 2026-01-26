import { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router";
import {
  Box,
  Heading,
  Text,
  Stack,
  Flex,
  Button,
  Badge,
  Spinner,
} from "@chakra-ui/react";
import type { MetaFunction } from "react-router";
import {
  listJobs,
  type User,
  type JobListItem,
  type JobStatus,
} from "~/components/lib/api";

export const meta: MetaFunction = () => {
  return [{ title: "Postes - Baara" }];
};

interface OutletContextType {
  user: User | null;
}

// Icons
function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6" />
    </svg>
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
      px={2}
      py={0.5}
      borderRadius="full"
    >
      {label}
    </Badge>
  );
}

// Seniority label
function getSeniorityLabel(seniority?: string): string {
  const labels: Record<string, string> = {
    junior: "Junior",
    mid: "Mid",
    senior: "Senior",
    staff: "Staff",
    principal: "Principal",
  };
  return seniority ? labels[seniority] || seniority : "";
}

// Location label
function getLocationLabel(locationType?: string): string {
  const labels: Record<string, string> = {
    remote: "Remote",
    hybrid: "Hybride",
    onsite: "Sur site",
  };
  return locationType ? labels[locationType] || locationType : "";
}

export default function Jobs() {
  const navigate = useNavigate();
  const { user } = useOutletContext<OutletContextType>();

  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<JobStatus | "all">("all");

  // Check if user is recruiter/admin
  useEffect(() => {
    if (user && user.role !== "recruiter" && user.role !== "admin") {
      navigate("/app/proof-profile");
    }
  }, [user, navigate]);

  // Load jobs
  useEffect(() => {
    const loadJobs = async () => {
      try {
        const response = await listJobs(filter === "all" ? undefined : filter);
        setJobs(response.jobs || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors du chargement");
      } finally {
        setIsLoading(false);
      }
    };

    loadJobs();
  }, [filter]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <Flex minH="400px" align="center" justify="center">
        <Spinner size="lg" color="primary" />
      </Flex>
    );
  }

  return (
    <Box py={8} px={8} maxW="1000px" mx="auto">
      <Stack gap={6}>
        {/* Header */}
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
          <Box>
            <Heading as="h1" fontSize="xl" color="text" mb={1} fontWeight="semibold">
              Postes
            </Heading>
            <Text fontSize="sm" color="text.secondary">
              Gérez vos postes ouverts et créez de nouvelles opportunités.
            </Text>
          </Box>

          <Button
            bg="primary"
            color="white"
            onClick={() => navigate("/app/jobs/new")}
            shadow="button"
            _hover={{ bg: "primary.hover" }}
          >
            <Flex align="center" gap={2}>
              <PlusIcon />
              <Text>Nouveau poste</Text>
            </Flex>
          </Button>
        </Flex>

        {/* Filters */}
        <Flex gap={2}>
          {(["all", "draft", "active", "paused", "closed"] as const).map((status) => (
            <Button
              key={status}
              size="sm"
              variant={filter === status ? "solid" : "outline"}
              bg={filter === status ? "primary" : "transparent"}
              color={filter === status ? "white" : "text.secondary"}
              borderColor="border"
              onClick={() => setFilter(status)}
              _hover={{
                bg: filter === status ? "primary.hover" : "bg.subtle",
              }}
            >
              {status === "all" && "Tous"}
              {status === "draft" && "Brouillons"}
              {status === "active" && "Actifs"}
              {status === "paused" && "En pause"}
              {status === "closed" && "Fermés"}
            </Button>
          ))}
        </Flex>

        {/* Error */}
        {error && (
          <Box bg="error.subtle" borderRadius="lg" border="1px solid" borderColor="error.muted" px={4} py={3}>
            <Text fontSize="sm" color="error">{error}</Text>
          </Box>
        )}

        {/* Jobs list */}
        {jobs.length === 0 ? (
          <Box
            bg="surface"
            borderRadius="xl"
            border="1px solid"
            borderColor="border"
            p={12}
            textAlign="center"
          >
            <Box
              w="64px"
              h="64px"
              bg="bg.subtle"
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              mx="auto"
              mb={4}
              color="text.muted"
            >
              <BriefcaseIcon />
            </Box>
            <Heading as="h3" fontSize="md" color="text" mb={2} fontWeight="semibold">
              Aucun poste {filter !== "all" && "dans cette catégorie"}
            </Heading>
            <Text fontSize="sm" color="text.secondary" mb={6}>
              Créez votre premier poste pour commencer à recruter.
            </Text>
            <Button
              bg="primary"
              color="white"
              onClick={() => navigate("/app/jobs/new")}
              _hover={{ bg: "primary.hover" }}
            >
              Créer un poste
            </Button>
          </Box>
        ) : (
          <Stack gap={3}>
            {jobs.map((job) => (
              <Box
                key={job.id}
                bg="surface"
                borderRadius="xl"
                border="1px solid"
                borderColor="border"
                p={5}
                cursor="pointer"
                transition="all 0.2s"
                _hover={{ borderColor: "border.emphasis", shadow: "sm" }}
                onClick={() => navigate(`/app/jobs/${job.id}/edit`)}
              >
                <Flex justify="space-between" align="start">
                  <Box flex={1}>
                    <Flex align="center" gap={3} mb={2}>
                      <Heading as="h3" fontSize="md" fontWeight="semibold" color="text">
                        {job.title}
                      </Heading>
                      <StatusBadge status={job.status} />
                    </Flex>

                    <Flex gap={4} flexWrap="wrap">
                      {job.team && (
                        <Text fontSize="sm" color="text.secondary">
                          {job.team}
                        </Text>
                      )}
                      {job.seniority && (
                        <Text fontSize="sm" color="text.muted">
                          {getSeniorityLabel(job.seniority)}
                        </Text>
                      )}
                      {job.location_type && (
                        <Text fontSize="sm" color="text.muted">
                          {getLocationLabel(job.location_type)}
                        </Text>
                      )}
                      <Text fontSize="sm" color="text.muted">
                        Créé le {formatDate(job.created_at)}
                      </Text>
                    </Flex>
                  </Box>

                  <Box color="text.muted" flexShrink={0}>
                    <ChevronRightIcon />
                  </Box>
                </Flex>
              </Box>
            ))}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
