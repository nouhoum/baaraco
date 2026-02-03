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
import { useTranslation } from "react-i18next";
import type { JobStatus, JobListItem } from "~/components/lib/api";
import { requireRole } from "~/components/lib/auth.server";
import { authenticatedFetch } from "~/components/lib/api.server";
import { Plus, Briefcase, ChevronRight } from "lucide-react";
import { ErrorState, EmptyState } from "~/components/ui/states";
import type { Route } from "./+types/_app.jobs";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Jobs - Baara" }];
};

// --- Loader: fetch jobs list (SSR) ---
export async function loader({ request }: Route.LoaderArgs) {
  await requireRole(request, ["recruiter", "admin"]);
  const res = await authenticatedFetch(request, "/api/v1/jobs");
  if (!res.ok) {
    return { jobs: [] as JobListItem[], allJobs: [] as JobListItem[], error: "Error loading jobs" };
  }
  const data = await res.json();
  const allJobs = (data.jobs || []) as JobListItem[];
  return { jobs: allJobs, allJobs, error: null as string | null };
}

// Seniority label (translated via i18n)
function getSeniorityLabel(seniority: string | undefined, t: (key: string, opts?: any) => string): string {
  if (!seniority) return "";
  return t(`jobs.seniority.${seniority}`, { defaultValue: seniority });
}

// Location label (translated via i18n)
function getLocationLabel(locationType: string | undefined, t: (key: string, opts?: any) => string): string {
  if (!locationType) return "";
  return t(`jobs.locationType.${locationType}`, { defaultValue: locationType });
}

export default function Jobs({ loaderData }: Route.ComponentProps) {
  const { t, i18n } = useTranslation("app");
  const { allJobs, error } = loaderData;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get("filter") || "all";

  // Status badge using t()
  const getStatusLabel = (status: JobStatus): string => {
    const labels: Record<JobStatus, string> = {
      draft: t("jobs.stats.drafts"),
      active: t("jobs.stats.active"),
      paused: t("jobs.stats.paused"),
      closed: t("jobs.stats.closed"),
    };
    return labels[status] || status;
  };

  const statusBadgeConfig: Record<JobStatus, { bg: string; color: string }> = {
    draft: { bg: "bg.muted", color: "text.muted" },
    active: { bg: "success.subtle", color: "success" },
    paused: { bg: "warning.subtle", color: "warning" },
    closed: { bg: "error.subtle", color: "error" },
  };

  // Compute stats
  const stats = {
    total: allJobs.length,
    active: allJobs.filter(j => j.status === "active").length,
    draft: allJobs.filter(j => j.status === "draft").length,
    paused: allJobs.filter(j => j.status === "paused").length,
    closed: allJobs.filter(j => j.status === "closed").length,
  };

  // Filter jobs client-side
  const filteredJobs = filter === "all"
    ? allJobs
    : allJobs.filter(j => j.status === filter);

  const handleFilterChange = (newFilter: JobStatus | "all") => {
    setSearchParams(newFilter === "all" ? {} : { filter: newFilter });
  };

  // Format date
  const formatDate = (dateString: string) => {
    const locale = i18n.language === "fr" ? "fr-FR" : "en-US";
    return new Date(dateString).toLocaleDateString(locale, {
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
              {t("jobs.heading")}
            </Heading>
            <Text fontSize="sm" color="text.secondary">
              {t("jobs.subtitle")}
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
              <Text>{t("jobs.newJob")}</Text>
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
              {t(`jobs.filters.${status}`, { count: status === "all" ? stats.total : stats[status as keyof typeof stats] })}
            </Button>
          ))}
        </Flex>

        {/* Error */}
        {error && <ErrorState message={error} />}

        {/* Jobs list */}
        {filteredJobs.length === 0 ? (
          <EmptyState
            icon={<Briefcase size={20} strokeWidth={1.5} />}
            title={filter !== "all" ? t("jobs.emptyTitleFiltered") : t("jobs.emptyTitle")}
            subtitle={t("jobs.emptySubtitle")}
            action={{ label: t("jobs.createButton"), onClick: () => navigate("/app/jobs/new") }}
          />
        ) : (
          <Stack gap={3}>
            {filteredJobs.map((job) => (
              <Box
                key={job.id}
                bg="surface" borderRadius="xl" border="1px solid" borderColor="border"
                p={5} cursor="pointer" transition="all 0.2s"
                _hover={{ borderColor: "border.emphasis", shadow: "sm" }}
                onClick={() => navigate(`/app/jobs/${job.id}/edit`)}
              >
                <Flex justify="space-between" align="start">
                  <Box flex={1}>
                    <Flex align="center" gap={3} mb={2}>
                      <Heading as="h3" fontSize="md" fontWeight="semibold" color="text">
                        {job.title}
                      </Heading>
                      <Badge
                        bg={statusBadgeConfig[job.status].bg}
                        color={statusBadgeConfig[job.status].color}
                        fontSize="xs" fontWeight="semibold" px={2} py={0.5} borderRadius="full"
                      >
                        {getStatusLabel(job.status)}
                      </Badge>
                      {job.is_public && (
                        <Badge
                          bg="rgba(20, 184, 166, 0.1)"
                          color="brand.400"
                          fontSize="xs" fontWeight="semibold" px={2} py={0.5} borderRadius="full"
                          border="1px solid"
                          borderColor="rgba(20, 184, 166, 0.3)"
                        >
                          Public
                        </Badge>
                      )}
                    </Flex>

                    <Flex gap={4} flexWrap="wrap">
                      {job.team && <Text fontSize="sm" color="text.secondary">{job.team}</Text>}
                      {job.seniority && <Text fontSize="sm" color="text.muted">{getSeniorityLabel(job.seniority, t)}</Text>}
                      {job.location_type && <Text fontSize="sm" color="text.muted">{getLocationLabel(job.location_type, t)}</Text>}
                      <Text fontSize="sm" color="text.muted">
                        {t("jobs.created", { date: formatDate(job.created_at) })}
                      </Text>
                    </Flex>
                  </Box>

                  <Flex align="center" gap={2} flexShrink={0}>
                    {(job.status === "active" || job.status === "closed") && (
                      <Button
                        size="xs" variant="outline" borderColor="border" color="text.secondary"
                        onClick={(e) => { e.stopPropagation(); navigate(`/app/jobs/${job.id}/candidates`); }}
                        _hover={{ bg: "bg.subtle", color: "text" }}
                      >
                        {t("jobs.candidates")}
                      </Button>
                    )}
                    <Box color="text.muted"><ChevronRight size={16} /></Box>
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
