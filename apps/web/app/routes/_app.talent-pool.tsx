import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Search,
  Users,
  ChevronDown,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Briefcase,
  Globe,
  Clock,
  Languages,
} from "lucide-react";
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
  Grid,
} from "@chakra-ui/react";
import {
  type TalentPoolProfile,
  type TalentPoolResponse,
} from "~/components/lib/api";
import { requireRole } from "~/components/lib/auth.server";
import { authenticatedFetch } from "~/components/lib/api.server";
import { EmptyState } from "~/components/ui/states";
import type { Route } from "./+types/_app.talent-pool";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Talent Pool - Baara" }];
};

export async function loader({ request }: Route.LoaderArgs) {
  await requireRole(request, ["recruiter", "admin"]);
  const url = new URL(request.url);
  const query = new URLSearchParams();
  const roleType = url.searchParams.get("role_type");
  const minScore = url.searchParams.get("min_score");
  const search = url.searchParams.get("search");
  const sort = url.searchParams.get("sort") || "score_desc";
  const page = url.searchParams.get("page") || "1";
  if (roleType) query.set("role_type", roleType);
  if (minScore) query.set("min_score", minScore);
  if (search) query.set("search", search);
  if (sort) query.set("sort", sort);
  query.set("page", page);
  query.set("per_page", "18");

  const qs = query.toString();
  const res = await authenticatedFetch(
    request,
    `/api/v1/talent-pool${qs ? `?${qs}` : ""}`,
  );
  if (!res.ok) {
    return {
      profiles: [] as TalentPoolProfile[],
      total: 0,
      page: 1,
      per_page: 18,
      error: "Error loading talent pool",
    };
  }
  const data: TalentPoolResponse = await res.json();
  return {
    profiles: data.profiles || [],
    total: data.total,
    page: data.page,
    per_page: data.per_page,
    error: null as string | null,
  };
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

const roleTypeColors: Record<string, { bg: string; color: string }> = {
  backend_go: { bg: "blue.subtle", color: "blue" },
  sre: { bg: "orange.subtle", color: "orange" },
  infra_platform: { bg: "purple.subtle", color: "purple" },
  other: { bg: "bg.muted", color: "text.muted" },
};

function ScoreCircle({ score, size = 56 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color =
    score >= 86
      ? "var(--chakra-colors-success)"
      : score >= 76
        ? "var(--chakra-colors-teal-400, #38B2AC)"
        : score >= 61
          ? "var(--chakra-colors-warning)"
          : "var(--chakra-colors-error)";

  return (
    <Box position="relative" w={`${size}px`} h={`${size}px`} flexShrink={0}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--chakra-colors-border)"
          strokeWidth="5"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
        />
      </svg>
      <Flex
        position="absolute"
        inset={0}
        align="center"
        justify="center"
        flexDirection="column"
      >
        <Text fontSize="md" fontWeight="bold" color="text" lineHeight={1}>
          {score}
        </Text>
      </Flex>
    </Box>
  );
}

function ProfileCard({
  profile,
  t,
}: {
  profile: TalentPoolProfile;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const navigate = useNavigate();
  const roleColors = roleTypeColors[profile.role_type || "other"] || roleTypeColors.other;

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const topCriteria = (profile.criteria_summary || []).slice(0, 3);

  return (
    <Box
      bg="surface"
      borderRadius="xl"
      border="1px solid"
      borderColor="border"
      p={5}
      transition="all 0.2s"
      _hover={{ borderColor: "border.emphasis", shadow: "md" }}
      cursor="pointer"
      onClick={() => navigate(`/app/talent-pool/${profile.proof_profile_id}`)}
    >
      {/* Header: Avatar + Name + Role */}
      <Flex gap={3} mb={4} align="start">
        <Avatar.Root size="md" bg="primary.subtle" color="primary">
          {profile.avatar_url ? (
            <Avatar.Image src={profile.avatar_url} />
          ) : (
            <Avatar.Fallback>
              {getInitials(profile.candidate_name || "?")}
            </Avatar.Fallback>
          )}
        </Avatar.Root>
        <Box flex={1} minW={0}>
          <Text
            fontSize="sm"
            fontWeight="semibold"
            color="text"
            truncate
          >
            {profile.candidate_name}
          </Text>
          {profile.role_type && (
            <Badge
              bg={roleColors.bg}
              color={roleColors.color}
              fontSize="xs"
              px={2}
              py={0.5}
              borderRadius="full"
              mt={1}
            >
              {t(`talentPool.roleTypes.${profile.role_type}`)}
            </Badge>
          )}
        </Box>
        <ScoreCircle score={profile.global_score} size={48} />
      </Flex>

      {/* Title + Company + Location + Experiences */}
      {(profile.current_title || profile.current_company || profile.location || profile.experiences?.length) && (
        <Stack gap={1} mb={3}>
          {(profile.current_title || profile.current_company) && (
            <Flex align="center" gap={1.5} color="text.secondary">
              <Briefcase size={12} />
              <Text fontSize="xs" truncate>
                {[profile.current_title, profile.current_company].filter(Boolean).join(" · ")}
              </Text>
            </Flex>
          )}
          {profile.experiences?.slice(0, 2).map((exp, i) => (
            <Flex key={i} align="center" gap={1.5} color="text.muted">
              <Briefcase size={10} />
              <Text fontSize="2xs" truncate>
                {[exp.title, exp.company].filter(Boolean).join(" · ")}
                {exp.start_year ? ` (${exp.start_year}${exp.end_year ? `–${exp.end_year}` : "–"})` : ""}
              </Text>
            </Flex>
          ))}
          {profile.location && (
            <Flex align="center" gap={1.5} color="text.muted">
              <MapPin size={12} />
              <Text fontSize="xs">{profile.location}</Text>
            </Flex>
          )}
        </Stack>
      )}

      {/* Skills */}
      {profile.skills && profile.skills.length > 0 && (
        <Flex gap={1} flexWrap="wrap" mb={3}>
          {profile.skills.slice(0, 4).map((skill) => (
            <Badge
              key={skill}
              bg="bg.subtle"
              color="text.muted"
              fontSize="2xs"
              px={1.5}
              py={0}
              borderRadius="full"
            >
              {skill}
            </Badge>
          ))}
          {profile.skills.length > 4 && (
            <Text fontSize="2xs" color="text.muted">
              +{profile.skills.length - 4}
            </Text>
          )}
        </Flex>
      )}

      {/* Enriched badges: languages, availability, remote, relocation */}
      {(profile.languages?.length || profile.availability || profile.remote_preference || profile.open_to_relocation) && (
        <Flex gap={1} flexWrap="wrap" mb={3}>
          {profile.languages?.slice(0, 3).map((lang) => (
            <Badge
              key={lang.language}
              bg="teal.subtle"
              color="teal.fg"
              fontSize="2xs"
              px={1.5}
              py={0}
              borderRadius="full"
            >
              <Flex align="center" gap={0.5}>
                <Languages size={10} />
                {lang.language}
              </Flex>
            </Badge>
          ))}
          {profile.availability && profile.availability !== "not_looking" && (
            <Badge
              bg="green.subtle"
              color="green.fg"
              fontSize="2xs"
              px={1.5}
              py={0}
              borderRadius="full"
            >
              <Flex align="center" gap={0.5}>
                <Clock size={10} />
                {t(`talentPool.card.available`)}
              </Flex>
            </Badge>
          )}
          {profile.remote_preference && (
            <Badge
              bg="blue.subtle"
              color="blue.fg"
              fontSize="2xs"
              px={1.5}
              py={0}
              borderRadius="full"
            >
              <Flex align="center" gap={0.5}>
                <Globe size={10} />
                {t(`talentPool.card.${profile.remote_preference}`)}
              </Flex>
            </Badge>
          )}
          {profile.open_to_relocation && (
            <Badge
              bg="purple.subtle"
              color="purple.fg"
              fontSize="2xs"
              px={1.5}
              py={0}
              borderRadius="full"
            >
              {t("talentPool.card.openToRelocation")}
            </Badge>
          )}
        </Flex>
      )}

      {/* One-liner */}
      {profile.one_liner && (
        <Text
          fontSize="xs"
          color="text.secondary"
          mb={3}
          lineClamp={2}
        >
          {profile.one_liner}
        </Text>
      )}

      {/* Percentile + Experience */}
      {(profile.percentile > 0 || profile.years_of_experience) && (
        <Flex gap={2} align="center" mb={3}>
          {profile.percentile > 0 && (
            <Text fontSize="xs" color="text.muted">
              {t("talentPool.card.topPercent", {
                percent: 100 - profile.percentile,
              })}
            </Text>
          )}
          {profile.percentile > 0 && profile.years_of_experience && (
            <Text fontSize="xs" color="text.muted">·</Text>
          )}
          {profile.years_of_experience && (
            <Text fontSize="xs" color="text.muted">
              {profile.years_of_experience}+ yrs
            </Text>
          )}
        </Flex>
      )}

      {/* Top criteria bars */}
      {topCriteria.length > 0 && (
        <Stack gap={1.5} mb={3}>
          {topCriteria.map((c, i) => (
            <Flex key={i} align="center" gap={2}>
              <Text
                fontSize="xs"
                color="text.muted"
                w="90px"
                flexShrink={0}
                truncate
              >
                {c.name}
              </Text>
              <Box flex={1} h="4px" bg="bg.subtle" borderRadius="full">
                <Box
                  h="full"
                  w={`${c.score}%`}
                  bg={
                    c.score >= 80
                      ? "success"
                      : c.score >= 60
                        ? "warning"
                        : "error"
                  }
                  borderRadius="full"
                  transition="width 0.6s ease-out"
                />
              </Box>
              <Text fontSize="xs" color="text.muted" w="28px" textAlign="right">
                {c.score}
              </Text>
            </Flex>
          ))}
        </Stack>
      )}

      {/* Links */}
      <Flex gap={2} mt="auto">
        {profile.linkedin_url && (
          <Flex
            as="a"
            {...{ href: profile.linkedin_url, target: "_blank", rel: "noopener noreferrer" }}
            align="center"
            gap={1}
            fontSize="xs"
            color="text.muted"
            px={2}
            py={1}
            borderRadius="md"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            _hover={{ color: "text", bg: "bg.subtle" }}
            transition="all 0.2s"
          >
            <Text fontSize="xs">LinkedIn</Text>
            <ExternalLink size={10} />
          </Flex>
        )}
        {profile.github_username && (
          <Flex
            as="a"
            {...{ href: `https://github.com/${profile.github_username}`, target: "_blank", rel: "noopener noreferrer" }}
            align="center"
            gap={1}
            fontSize="xs"
            color="text.muted"
            px={2}
            py={1}
            borderRadius="md"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            _hover={{ color: "text", bg: "bg.subtle" }}
            transition="all 0.2s"
          >
            <Text fontSize="xs">GitHub</Text>
            <ExternalLink size={10} />
          </Flex>
        )}
      </Flex>
    </Box>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function TalentPool({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation("app");
  const [searchParams, setSearchParams] = useSearchParams();

  const { profiles, total, page, per_page, error } = loaderData;

  const roleType = searchParams.get("role_type") || "";
  const sortBy = searchParams.get("sort") || "score_desc";
  const minScore = searchParams.get("min_score") || "";

  // Debounced search
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
            next.delete("page");
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

  const setParam = (key: string, value: string | undefined) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
        if (key !== "page") next.delete("page");
        return next;
      },
      { preventScrollReset: true },
    );
  };

  const totalPages = Math.ceil(total / per_page);

  // Score filter options
  const scoreFilters = [
    { label: t("talentPool.filters.allScores"), value: "" },
    { label: "80+", value: "80" },
    { label: "60+", value: "60" },
  ];

  return (
    <Box py={8} px={8} maxW="1200px" mx="auto">
      <Stack gap={6}>
        {/* Header */}
        <Box>
          <Heading
            as="h1"
            fontSize="xl"
            color="text"
            mb={1}
            fontWeight="semibold"
          >
            {t("talentPool.heading")}
          </Heading>
          <Text fontSize="sm" color="text.secondary">
            {t("talentPool.subtitle")}
          </Text>
        </Box>

        {/* Filters */}
        <Flex gap={3} flexWrap="wrap" align="center">
          {/* Role type filter */}
          <Flex gap={1.5}>
            {["", "backend_go", "sre", "infra_platform"].map((rt) => (
              <Button
                key={rt}
                size="xs"
                variant={roleType === rt ? "solid" : "outline"}
                bg={roleType === rt ? "primary" : "transparent"}
                color={roleType === rt ? "white" : "text.secondary"}
                borderColor="border"
                onClick={() => setParam("role_type", rt || undefined)}
                _hover={{
                  bg: roleType === rt ? "primary.hover" : "bg.subtle",
                }}
              >
                {rt
                  ? t(`talentPool.roleTypes.${rt}`)
                  : t("talentPool.filters.allRoles")}
              </Button>
            ))}
          </Flex>

          {/* Score filter */}
          <Flex gap={1.5} align="center">
            <Text fontSize="xs" color="text.muted" whiteSpace="nowrap">
              {t("talentPool.filters.minScore")}
            </Text>
            {scoreFilters.map((sf) => (
              <Button
                key={sf.label}
                size="xs"
                variant={minScore === sf.value ? "solid" : "outline"}
                bg={minScore === sf.value ? "primary" : "transparent"}
                color={minScore === sf.value ? "white" : "text.secondary"}
                borderColor="border"
                onClick={() => setParam("min_score", sf.value || undefined)}
                _hover={{
                  bg: minScore === sf.value ? "primary.hover" : "bg.subtle",
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
              <Search size={16} />
            </Box>
            <Input
              placeholder={t("talentPool.filters.search")}
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
              {t("talentPool.filters.sort")}
            </Text>
            <Button
              size="xs"
              variant="outline"
              borderColor="border"
              color="text.secondary"
              onClick={() => {
                const sorts = ["score_desc", "date_desc", "name_asc"];
                const idx = sorts.indexOf(sortBy);
                setParam("sort", sorts[(idx + 1) % sorts.length]);
              }}
              _hover={{ bg: "bg.subtle" }}
            >
              <Flex align="center" gap={1}>
                <Text>
                  {sortBy === "score_desc" && t("talentPool.filters.sortScore")}
                  {sortBy === "date_desc" && t("talentPool.filters.sortDate")}
                  {sortBy === "name_asc" && t("talentPool.filters.sortName")}
                  {!["score_desc", "date_desc", "name_asc"].includes(sortBy) &&
                    t("talentPool.filters.sortScore")}
                </Text>
                <ChevronDown size={14} />
              </Flex>
            </Button>
          </Flex>
        </Flex>

        {/* Results count */}
        <Text fontSize="sm" color="text.muted">
          {t("talentPool.resultCount", { count: total })}
        </Text>

        {/* Grid or empty state */}
        {profiles.length === 0 ? (
          <EmptyState
            icon={<Users size={20} strokeWidth={1.5} />}
            title={
              searchInput || roleType || minScore
                ? t("talentPool.empty.title")
                : t("talentPool.empty.noProfiles")
            }
            subtitle={
              searchInput || roleType || minScore
                ? t("talentPool.empty.subtitle")
                : undefined
            }
          />
        ) : (
          <Grid
            templateColumns={{
              base: "1fr",
              md: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
            }}
            gap={4}
          >
            {profiles.map((profile) => (
              <ProfileCard key={profile.proof_profile_id} profile={profile} t={t} />
            ))}
          </Grid>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Flex justify="center" align="center" gap={3} pt={4}>
            <Button
              size="sm"
              variant="outline"
              borderColor="border"
              color="text.secondary"
              disabled={page <= 1}
              onClick={() => setParam("page", String(page - 1))}
              _hover={{ bg: "bg.subtle" }}
            >
              <ChevronLeft size={16} />
            </Button>
            <Text fontSize="sm" color="text.secondary">
              {page} / {totalPages}
            </Text>
            <Button
              size="sm"
              variant="outline"
              borderColor="border"
              color="text.secondary"
              disabled={page >= totalPages}
              onClick={() => setParam("page", String(page + 1))}
              _hover={{ bg: "bg.subtle" }}
            >
              <ChevronRight size={16} />
            </Button>
          </Flex>
        )}
      </Stack>
    </Box>
  );
}
