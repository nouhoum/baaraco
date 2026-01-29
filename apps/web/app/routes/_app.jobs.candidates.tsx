import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useFetcher } from "react-router";
import {
  Box,
  Heading,
  Text,
  Stack,
  Flex,
  Button,
  Badge,
  Input,
  Avatar,
} from "@chakra-ui/react";
import {
  type JobCandidateItem,
  type JobCandidateStats,
  type CandidateStatus,
  type JobStatus,
  type ListJobCandidatesParams,
} from "~/components/lib/api";
import { requireRole } from "~/components/lib/auth.server";
import { authenticatedFetch } from "~/components/lib/api.server";
import type { Route } from "./+types/_app.jobs.candidates";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Candidats - Baara" }];
};

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireRole(request, ["recruiter", "admin"]);
  const url = new URL(request.url);
  const query = new URLSearchParams();
  const status = url.searchParams.get("status");
  const min_score = url.searchParams.get("min_score");
  const search = url.searchParams.get("search");
  const sort = url.searchParams.get("sort") || "score_desc";
  if (status && status !== "all") query.set("status", status);
  if (min_score) query.set("min_score", min_score);
  if (search) query.set("search", search);
  if (sort) query.set("sort", sort);

  const qs = query.toString();
  const res = await authenticatedFetch(
    request,
    `/api/v1/jobs/${params.id}/candidates${qs ? `?${qs}` : ""}`
  );
  if (!res.ok) {
    return {
      candidates: [] as JobCandidateItem[],
      stats: null as JobCandidateStats | null,
      total: 0,
      jobTitle: "",
      jobStatus: "draft" as JobStatus,
      error: "Erreur lors du chargement",
    };
  }
  const data = await res.json();
  return {
    candidates: (data.candidates || []) as JobCandidateItem[],
    stats: data.stats as JobCandidateStats | null,
    total: data.total as number,
    jobTitle: data.job?.title || "",
    jobStatus: (data.job?.status || "draft") as JobStatus,
    error: null as string | null,
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const candidateId = formData.get("candidateId") as string;
  const status = formData.get("status") as string;

  const res = await authenticatedFetch(
    request,
    `/api/v1/jobs/${params.id}/candidates/${candidateId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }
  );
  if (!res.ok) {
    return { error: "Erreur lors de la mise à jour" };
  }
  return { ok: true };
}

// =============================================================================
// ICONS
// =============================================================================

function ArrowLeftIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

function ScoreBadge({ score }: { score?: number }) {
  if (score == null) {
    return (
      <Badge
        bg="bg.muted"
        color="text.muted"
        fontSize="xs"
        px={2}
        py={0.5}
        borderRadius="full"
      >
        --
      </Badge>
    );
  }

  let bg = "error.subtle";
  let color = "error";
  if (score >= 80) {
    bg = "success.subtle";
    color = "success";
  } else if (score >= 60) {
    bg = "warning.subtle";
    color = "warning";
  }

  return (
    <Badge
      bg={bg}
      color={color}
      fontSize="sm"
      fontWeight="bold"
      px={2.5}
      py={0.5}
      borderRadius="full"
    >
      {score}
    </Badge>
  );
}

function CandidateStatusBadge({ status }: { status: CandidateStatus }) {
  const config: Record<
    CandidateStatus,
    { bg: string; color: string; label: string }
  > = {
    submitted: { bg: "info.subtle", color: "info", label: "En attente" },
    reviewed: { bg: "warning.subtle", color: "warning", label: "Évalué" },
    shortlisted: {
      bg: "success.subtle",
      color: "success",
      label: "Shortlisté",
    },
    rejected: { bg: "error.subtle", color: "error", label: "Rejeté" },
  };

  const { bg, color, label } = config[status] || config.submitted;

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

function JobStatusBadge({ status }: { status: JobStatus }) {
  const config: Record<string, { bg: string; color: string; label: string }> = {
    draft: { bg: "bg.muted", color: "text.muted", label: "Brouillon" },
    active: { bg: "success.subtle", color: "success", label: "Actif" },
    paused: { bg: "warning.subtle", color: "warning", label: "En pause" },
    closed: { bg: "error.subtle", color: "error", label: "Fermé" },
  };

  const { bg, color, label } = config[status] || config.draft;

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

function StatCard({
  label,
  value,
  isHighlighted,
}: {
  label: string;
  value: number;
  isHighlighted?: boolean;
}) {
  return (
    <Box
      bg={isHighlighted ? "primary.subtle" : "surface"}
      border="1px solid"
      borderColor={isHighlighted ? "primary.muted" : "border"}
      borderRadius="lg"
      px={4}
      py={3}
      textAlign="center"
      minW="100px"
    >
      <Text
        fontSize="2xl"
        fontWeight="bold"
        color={isHighlighted ? "primary" : "text"}
      >
        {value}
      </Text>
      <Text fontSize="xs" color="text.secondary">
        {label}
      </Text>
    </Box>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function JobCandidates({
  params,
  loaderData,
}: Route.ComponentProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const fetcher = useFetcher();
  const jobId = params.id;

  // Data from loader
  const { candidates, stats, total, jobTitle, jobStatus, error } = loaderData;

  // Filters from searchParams
  const statusFilter =
    (searchParams.get("status") as CandidateStatus | "all") || "all";
  const scoreFilter = searchParams.get("min_score")
    ? Number(searchParams.get("min_score"))
    : undefined;
  const sortBy =
    (searchParams.get("sort") as ListJobCandidatesParams["sort"]) ||
    "score_desc";

  // Debounced search (local state → searchParams)
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || "",
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (searchInput) {
            next.set("search", searchInput);
          } else {
            next.delete("search");
          }
          return next;
        },
        { preventScrollReset: true },
      );
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput, setSearchParams]);

  // Helper to update a single search param
  const setParam = (key: string, value: string | undefined) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value && value !== "all" && value !== "undefined") {
          next.set(key, value);
        } else {
          next.delete(key);
        }
        return next;
      },
      { preventScrollReset: true },
    );
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "--";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle status update via fetcher (triggers revalidation)
  const handleStatusUpdate = (
    candidateId: string,
    status: "shortlisted" | "rejected",
  ) => {
    if (!jobId) return;
    fetcher.submit(
      { candidateId, status },
      { method: "POST" },
    );
  };

  // Score filter options
  const scoreFilters = [
    { label: "Tous", value: undefined },
    { label: "80+", value: 80 },
    { label: "60-79", value: 60 },
    { label: "<60", value: 1 },
  ];

  return (
    <Box py={8} px={8} maxW="1200px" mx="auto">
      <Stack gap={6}>
        {/* Back button + Header */}
        <Box>
          <Button
            variant="ghost"
            size="sm"
            color="text.secondary"
            mb={4}
            onClick={() => navigate("/app/jobs")}
            _hover={{ color: "text", bg: "bg.subtle" }}
          >
            <Flex align="center" gap={1.5}>
              <ArrowLeftIcon />
              <Text>Retour aux postes</Text>
            </Flex>
          </Button>

          <Flex justify="space-between" align="start" flexWrap="wrap" gap={4}>
            <Box>
              <Flex align="center" gap={3} mb={1}>
                <Heading
                  as="h1"
                  fontSize="xl"
                  color="text"
                  fontWeight="semibold"
                >
                  {jobTitle}
                </Heading>
                <JobStatusBadge status={jobStatus} />
              </Flex>
              <Text fontSize="sm" color="text.secondary">
                Tableau de bord des candidats
              </Text>
            </Box>

            <Flex gap={2}>
              {(jobStatus === "active" || jobStatus === "paused") && (
                <Button
                  size="sm"
                  bg="primary"
                  color="white"
                  onClick={() => navigate(`/app/jobs/${jobId}/invite`)}
                  _hover={{ bg: "primary.hover" }}
                >
                  <Flex align="center" gap={1.5}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                    <Text>Inviter</Text>
                  </Flex>
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                borderColor="border"
                color="text.secondary"
                onClick={() => navigate(`/app/jobs/${jobId}/edit`)}
                _hover={{ bg: "bg.subtle" }}
              >
                Modifier le poste
              </Button>
            </Flex>
          </Flex>
        </Box>

        {/* Stats */}
        {stats && (
          <Flex gap={3} flexWrap="wrap">
            <StatCard label="Total" value={stats.total} isHighlighted />
            <StatCard label="En attente" value={stats.submitted} />
            <StatCard label="Évalués" value={stats.reviewed} />
            <StatCard label="Shortlistés" value={stats.shortlisted} />
            <StatCard label="Rejetés" value={stats.rejected} />
          </Flex>
        )}

        {/* Filters */}
        <Flex gap={4} flexWrap="wrap" align="center">
          {/* Status filter */}
          <Flex gap={1.5}>
            {(
              [
                "all",
                "submitted",
                "reviewed",
                "shortlisted",
                "rejected",
              ] as const
            ).map((status) => {
              const labels: Record<string, string> = {
                all: "Tous",
                submitted: "En attente",
                reviewed: "Évalués",
                shortlisted: "Shortlistés",
                rejected: "Rejetés",
              };
              return (
                <Button
                  key={status}
                  size="xs"
                  variant={statusFilter === status ? "solid" : "outline"}
                  bg={statusFilter === status ? "primary" : "transparent"}
                  color={statusFilter === status ? "white" : "text.secondary"}
                  borderColor="border"
                  onClick={() => setParam("status", status)}
                  _hover={{
                    bg: statusFilter === status ? "primary.hover" : "bg.subtle",
                  }}
                >
                  {labels[status]}
                </Button>
              );
            })}
          </Flex>

          {/* Score filter */}
          <Flex gap={1.5} align="center">
            <Text fontSize="xs" color="text.muted" whiteSpace="nowrap">
              Score :
            </Text>
            {scoreFilters.map((sf) => (
              <Button
                key={sf.label}
                size="xs"
                variant={scoreFilter === sf.value ? "solid" : "outline"}
                bg={scoreFilter === sf.value ? "primary" : "transparent"}
                color={scoreFilter === sf.value ? "white" : "text.secondary"}
                borderColor="border"
                onClick={() => setParam("min_score", sf.value?.toString())}
                _hover={{
                  bg: scoreFilter === sf.value ? "primary.hover" : "bg.subtle",
                }}
              >
                {sf.label}
              </Button>
            ))}
          </Flex>

          {/* Search */}
          <Flex
            align="center"
            bg="surface"
            border="1px solid"
            borderColor="border"
            borderRadius="lg"
            px={3}
            flex={1}
            minW="200px"
            maxW="300px"
          >
            <Box color="text.muted" mr={2}>
              <SearchIcon />
            </Box>
            <Input
              placeholder="Rechercher par nom ou email"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              border="none"
              size="sm"
              _focus={{ outline: "none", boxShadow: "none" }}
              px={0}
            />
          </Flex>

          {/* Sort */}
          <Flex align="center" gap={1}>
            <Text fontSize="xs" color="text.muted" whiteSpace="nowrap">
              Tri :
            </Text>
            <Button
              size="xs"
              variant="outline"
              borderColor="border"
              color="text.secondary"
              onClick={() => {
                const sorts: ListJobCandidatesParams["sort"][] = [
                  "score_desc",
                  "date_desc",
                  "name_asc",
                ];
                const currentIndex = sorts.indexOf(sortBy);
                setParam("sort", sorts[(currentIndex + 1) % sorts.length]);
              }}
              _hover={{ bg: "bg.subtle" }}
            >
              <Flex align="center" gap={1}>
                <Text>
                  {sortBy === "score_desc" && "Score"}
                  {sortBy === "date_desc" && "Date"}
                  {sortBy === "name_asc" && "Nom"}
                  {!["score_desc", "date_desc", "name_asc"].includes(
                    sortBy || "",
                  ) && "Score"}
                </Text>
                <ChevronDownIcon />
              </Flex>
            </Button>
          </Flex>
        </Flex>

        {/* Error */}
        {error && (
          <Box
            bg="error.subtle"
            borderRadius="lg"
            border="1px solid"
            borderColor="error.muted"
            px={4}
            py={3}
          >
            <Text fontSize="sm" color="error">
              {error}
            </Text>
          </Box>
        )}

        {/* Candidate list */}
        {candidates.length === 0 ? (
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
              <UsersIcon />
            </Box>
            <Heading
              as="h3"
              fontSize="md"
              color="text"
              mb={2}
              fontWeight="semibold"
            >
              Aucun candidat{" "}
              {statusFilter !== "all" ? "dans cette catégorie" : ""}
            </Heading>
            <Text fontSize="sm" color="text.secondary">
              {statusFilter === "all"
                ? "Les candidats apparaîtront ici une fois qu'ils auront soumis leur work sample."
                : "Aucun candidat ne correspond à vos filtres."}
            </Text>
          </Box>
        ) : (
          <Stack gap={3}>
            <Text fontSize="sm" color="text.muted" mb={1}>
              {total} candidat{total > 1 ? "s" : ""}
            </Text>
            {candidates.map((candidate) => (
              <Box
                key={candidate.attempt_id}
                bg="surface"
                borderRadius="xl"
                border="1px solid"
                borderColor="border"
                p={5}
                transition="all 0.2s"
                _hover={{ borderColor: "border.emphasis", shadow: "sm" }}
              >
                <Flex justify="space-between" align="start" gap={4}>
                  {/* Left: Avatar + Info */}
                  <Flex gap={4} flex={1} align="start">
                    <Avatar.Root size="md" bg="primary.subtle" color="primary">
                      {candidate.avatar_url ? (
                        <Avatar.Image src={candidate.avatar_url} />
                      ) : (
                        <Avatar.Fallback>
                          {getInitials(
                            candidate.candidate_name ||
                              candidate.candidate_email,
                          )}
                        </Avatar.Fallback>
                      )}
                    </Avatar.Root>

                    <Box flex={1}>
                      <Flex align="center" gap={2} mb={1}>
                        <Text fontSize="md" fontWeight="semibold" color="text">
                          {candidate.candidate_name ||
                            candidate.candidate_email}
                        </Text>
                        <CandidateStatusBadge status={candidate.status} />
                      </Flex>

                      {candidate.candidate_name && (
                        <Text fontSize="xs" color="text.muted" mb={1}>
                          {candidate.candidate_email}
                        </Text>
                      )}

                      {candidate.one_liner && (
                        <Text fontSize="sm" color="text.secondary" mb={1}>
                          {candidate.one_liner}
                        </Text>
                      )}

                      <Flex gap={3} mt={2} flexWrap="wrap">
                        <Text fontSize="xs" color="text.muted">
                          Soumis le {formatDate(candidate.submitted_at)}
                        </Text>
                        {candidate.recommendation && (
                          <Badge
                            fontSize="xs"
                            px={1.5}
                            py={0.5}
                            borderRadius="full"
                            bg={
                              candidate.recommendation ===
                              "proceed_to_interview"
                                ? "success.subtle"
                                : candidate.recommendation === "maybe"
                                  ? "warning.subtle"
                                  : "error.subtle"
                            }
                            color={
                              candidate.recommendation ===
                              "proceed_to_interview"
                                ? "success"
                                : candidate.recommendation === "maybe"
                                  ? "warning"
                                  : "error"
                            }
                          >
                            {candidate.recommendation === "proceed_to_interview"
                              ? "Entretien recommandé"
                              : candidate.recommendation === "maybe"
                                ? "À approfondir"
                                : "Non recommandé"}
                          </Badge>
                        )}
                      </Flex>
                    </Box>
                  </Flex>

                  {/* Right: Score + Actions */}
                  <Flex direction="column" align="end" gap={3}>
                    <ScoreBadge score={candidate.global_score} />

                    <Flex gap={2}>
                      {/* View button */}
                      {candidate.proof_profile_id && (
                        <Button
                          size="xs"
                          variant="outline"
                          borderColor="border"
                          color="text.secondary"
                          onClick={() =>
                            navigate(
                              `/app/jobs/${jobId}/candidates/${candidate.candidate_id}`,
                            )
                          }
                          _hover={{ bg: "bg.subtle" }}
                        >
                          <Flex align="center" gap={1}>
                            <EyeIcon />
                            <Text>Voir</Text>
                          </Flex>
                        </Button>
                      )}

                      {/* Shortlist button */}
                      {candidate.status !== "shortlisted" &&
                        candidate.status !== "submitted" && (
                          <Button
                            size="xs"
                            bg="success.subtle"
                            color="success"
                            onClick={() =>
                              handleStatusUpdate(
                                candidate.candidate_id,
                                "shortlisted",
                              )
                            }
                            disabled={fetcher.state !== "idle"}
                            _hover={{ bg: "success.emphasized" }}
                          >
                            <Flex align="center" gap={1}>
                              <StarIcon />
                              <Text>Shortlister</Text>
                            </Flex>
                          </Button>
                        )}

                      {/* Reject button */}
                      {candidate.status !== "rejected" &&
                        candidate.status !== "submitted" && (
                          <Button
                            size="xs"
                            bg="error.subtle"
                            color="error"
                            onClick={() =>
                              handleStatusUpdate(
                                candidate.candidate_id,
                                "rejected",
                              )
                            }
                            disabled={fetcher.state !== "idle"}
                            _hover={{ bg: "error.emphasized" }}
                          >
                            <Flex align="center" gap={1}>
                              <XIcon />
                              <Text>Rejeter</Text>
                            </Flex>
                          </Button>
                        )}
                    </Flex>
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
