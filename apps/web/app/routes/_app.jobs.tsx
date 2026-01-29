import { useNavigate, useSearchParams } from "react-router";
import {
  Box,
  Heading,
  Text,
  Stack,
  Flex,
  Button,
  Badge,
} from "@chakra-ui/react";
import type { JobStatus, JobListItem } from "~/components/lib/api";
import { requireRole } from "~/components/lib/auth.server";
import { authenticatedFetch } from "~/components/lib/api.server";
import { Plus, Briefcase, ChevronRight } from "lucide-react";
import type { Route } from "./+types/_app.jobs";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Postes - Baara" }];
};

// --- Loader: fetch jobs list (SSR) ---
export async function loader({ request }: Route.LoaderArgs) {
  await requireRole(request, ["recruiter", "admin"]);
  const url = new URL(request.url);
  const filter = url.searchParams.get("filter") || "all";
  const apiPath = filter !== "all"
    ? `/api/v1/jobs?status=${filter}`
    : "/api/v1/jobs";
  const res = await authenticatedFetch(request, apiPath);
  if (!res.ok) {
    return { jobs: [] as JobListItem[], filter, error: "Erreur lors du chargement" };
  }
  const data = await res.json();
  return { jobs: (data.jobs || []) as JobListItem[], filter, error: null as string | null };
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

export default function Jobs({ loaderData }: Route.ComponentProps) {
  const { jobs, filter, error } = loaderData;
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();

  const handleFilterChange = (newFilter: JobStatus | "all") => {
    setSearchParams(newFilter === "all" ? {} : { filter: newFilter });
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

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
              <Plus size={18} />
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
              onClick={() => handleFilterChange(status)}
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
              <Briefcase size={20} strokeWidth={1.5} />
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

                  <Flex align="center" gap={2} flexShrink={0}>
                    {(job.status === "active" || job.status === "closed") && (
                      <Button
                        size="xs"
                        variant="outline"
                        borderColor="border"
                        color="text.secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/app/jobs/${job.id}/candidates`);
                        }}
                        _hover={{ bg: "bg.subtle", color: "text" }}
                      >
                        Candidats
                      </Button>
                    )}
                    <Box color="text.muted">
                      <ChevronRight size={16} />
                    </Box>
                  </Flex>
                </Flex>
              </Box>
            ))}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
