"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useOutletContext, Link } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Box,
  Container,
  Heading,
  Text,
  Stack,
  Grid,
  Flex,
  Button,
  Input,
  Badge,
  Circle,
  NativeSelect,
} from "@chakra-ui/react";
import {
  Search,
  Briefcase,
  MapPin,
  Clock,
  X,
  ArrowRight,
  Building2,
  CheckCircle,
} from "lucide-react";
import { Layout } from "~/components/layout";
import {
  Glow,
  AnimatedSection,
  fadeInUp,
  StaggeredContainer,
  StaggeredItem,
  GradientText,
} from "~/components/ui/motion";
import { serverFetch } from "~/components/lib/api.server";
import { getMyApplications } from "~/components/lib/api";
import type {
  PublicJobListItem,
  SeniorityLevel,
  LocationType,
  ContractType,
} from "~/components/lib/api";
import type { Route } from "./+types/_lang.jobs";

// =============================================================================
// META
// =============================================================================

export const meta: Route.MetaFunction = () => {
  return [
    { title: "Offres d'emploi - Baara" },
    {
      name: "description",
      content:
        "Parcourez les offres d'emploi tech sur Baara. Postulez avec votre Proof Profile.",
    },
  ];
};

// =============================================================================
// LOADER
// =============================================================================

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const query = new URLSearchParams();

  const search = url.searchParams.get("search");
  const seniority = url.searchParams.get("seniority");
  const locationType = url.searchParams.get("location_type");
  const contractType = url.searchParams.get("contract_type");

  if (search) query.set("search", search);
  if (seniority) query.set("seniority", seniority);
  if (locationType) query.set("location_type", locationType);
  if (contractType) query.set("contract_type", contractType);

  const qs = query.toString();
  const res = await serverFetch(
    request,
    `/api/v1/public/jobs${qs ? `?${qs}` : ""}`,
  );

  if (!res.ok) {
    return { jobs: [] as PublicJobListItem[], total: 0 };
  }

  const data = await res.json();
  return {
    jobs: (data.jobs ?? []) as PublicJobListItem[],
    total: (data.total ?? 0) as number,
  };
}

// =============================================================================
// HELPERS
// =============================================================================

function getPostedDaysAgo(dateStr: string, t: any): string {
  const days = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (days === 0) return t("card.postedToday");
  if (days === 1) return t("card.postedYesterday");
  return t("card.postedAgo", { days });
}

function formatSalary(
  min?: number,
  max?: number,
  t?: any,
): string | null {
  if (min && max)
    return t("card.salaryRange", {
      min: Math.round(min / 1000),
      max: Math.round(max / 1000),
    });
  if (min)
    return t("card.salaryFrom", { min: Math.round(min / 1000) });
  if (max)
    return t("card.salaryTo", { max: Math.round(max / 1000) });
  return null;
}

// =============================================================================
// JOB CARD
// =============================================================================

function JobCard({
  job,
  lang,
  t,
  applicationStatus,
}: {
  job: PublicJobListItem;
  lang: string;
  t: any;
  applicationStatus?: { status: string; progress: number };
}) {
  const salary = formatSalary(job.salary_min, job.salary_max, t);
  const orgName = job.org?.name ?? "";
  const orgInitial = orgName.charAt(0).toUpperCase();

  return (
    <Link
      to={`/${lang}/jobs/${job.slug}`}
      style={{ display: "block", height: "100%", textDecoration: "none" }}
    >
    <Box
      h="full"
      p={6}
      bg="rgba(255, 255, 255, 0.02)"
      borderRadius="2xl"
      border="1px solid"
      borderColor="rgba(255, 255, 255, 0.06)"
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      cursor="pointer"
      _hover={{
        borderColor: "rgba(20, 184, 166, 0.4)",
        transform: "translateY(-4px)",
        bg: "rgba(255, 255, 255, 0.03)",
        boxShadow: "0 8px 40px rgba(20, 184, 166, 0.1)",
      }}
    >
      <Stack gap={4} h="full">
        {/* Org info */}
        <Flex gap={3} alignItems="center">
          {job.org?.logo_url ? (
            <img
              src={job.org.logo_url}
              alt={orgName}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "9999px",
                objectFit: "cover",
                background: "rgba(255, 255, 255, 0.05)",
              }}
            />
          ) : (
            <Circle
              size="40px"
              bg="rgba(20, 184, 166, 0.15)"
              color="brand.400"
              fontWeight="bold"
              fontSize="sm"
            >
              {orgInitial}
            </Circle>
          )}
          <Text color="gray.400" fontSize="sm" fontWeight="medium" flex={1}>
            {orgName}
          </Text>
          {applicationStatus && (
            <Badge
              bg={applicationStatus.status === "submitted" || applicationStatus.status === "reviewed"
                ? "rgba(20, 184, 166, 0.15)"
                : "rgba(251, 191, 36, 0.12)"}
              color={applicationStatus.status === "submitted" || applicationStatus.status === "reviewed"
                ? "teal.300"
                : "yellow.300"}
              fontSize="10px"
              fontWeight="600"
              px={2}
              py={0.5}
              borderRadius="full"
              display="flex"
              alignItems="center"
              gap={1}
            >
              <CheckCircle size={10} />
              {applicationStatus.status === "submitted" || applicationStatus.status === "reviewed"
                ? t("card.applied")
                : t("card.inProgress")}
            </Badge>
          )}
        </Flex>

        {/* Title and team */}
        <Box flex={1}>
          <Text fontWeight="bold" color="white" fontSize="lg" mb={1}>
            {job.title}
          </Text>
          {job.team && (
            <Text color="gray.500" fontSize="xs">
              {job.team}
            </Text>
          )}
        </Box>

        {/* Badges */}
        <Flex gap={2} flexWrap="wrap">
          {job.seniority && (
            <Badge
              variant="outline"
              borderColor="rgba(20, 184, 166, 0.4)"
              color="teal.300"
              bg="transparent"
              fontSize="xs"
              px={2}
              py={0.5}
              borderRadius="md"
              fontWeight="medium"
            >
              {t(`seniority.${job.seniority}`)}
            </Badge>
          )}
          {job.location_type && (
            <Badge
              variant="outline"
              borderColor="rgba(255, 255, 255, 0.1)"
              color="gray.400"
              bg="transparent"
              fontSize="xs"
              px={2}
              py={0.5}
              borderRadius="md"
              fontWeight="medium"
            >
              <Flex alignItems="center" gap={1}>
                <MapPin size={10} />
                {t(`location.${job.location_type}`)}
                {job.location_city && ` - ${job.location_city}`}
              </Flex>
            </Badge>
          )}
          {job.contract_type && (
            <Badge
              variant="outline"
              borderColor="rgba(255, 255, 255, 0.1)"
              color="gray.400"
              bg="transparent"
              fontSize="xs"
              px={2}
              py={0.5}
              borderRadius="md"
              fontWeight="medium"
            >
              {t(`contract.${job.contract_type}`)}
            </Badge>
          )}
        </Flex>

        {/* Stack tags */}
        {job.stack && job.stack.length > 0 && (
          <Flex gap={1.5} flexWrap="wrap">
            {job.stack.map((tech) => (
              <Box
                key={tech}
                px={2.5}
                py={1}
                bg="rgba(20, 184, 166, 0.08)"
                color="teal.300"
                fontSize="xs"
                borderRadius="full"
                fontWeight="medium"
              >
                {tech}
              </Box>
            ))}
          </Flex>
        )}

        {/* Bottom: salary + posted date */}
        <Flex
          justifyContent="space-between"
          alignItems="center"
          pt={2}
          borderTop="1px solid"
          borderColor="rgba(255, 255, 255, 0.04)"
        >
          {salary ? (
            <Text color="white" fontSize="sm" fontWeight="semibold">
              {salary}
            </Text>
          ) : (
            <Box />
          )}
          <Flex alignItems="center" gap={1} color="gray.500" fontSize="xs">
            <Clock size={12} />
            <Text>{getPostedDaysAgo(job.created_at, t)}</Text>
          </Flex>
        </Flex>
      </Stack>
    </Box>
    </Link>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function JobsPage({ loaderData }: Route.ComponentProps) {
  const { jobs, total } = loaderData;
  const { t } = useTranslation("jobs");
  const { lang, user } = useOutletContext<{ lang: string; user: any }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentSearch = searchParams.get("search") || "";
  const currentSeniority = searchParams.get("seniority") || "";
  const currentLocationType = searchParams.get("location_type") || "";
  const currentContractType = searchParams.get("contract_type") || "";

  // Fetch candidate's applications to show "Applied" badges
  const [appliedJobs, setAppliedJobs] = useState<Record<string, { status: string; progress: number }>>({});

  useEffect(() => {
    if (user?.role === "candidate") {
      getMyApplications().then((data) => {
        const map: Record<string, { status: string; progress: number }> = {};
        for (const app of data.applications) {
          if (app.job_slug) {
            map[app.job_slug] = { status: app.status, progress: app.progress };
          }
        }
        setAppliedJobs(map);
      });
    }
  }, [user]);

  const activeFilterCount = [
    currentSearch,
    currentSeniority,
    currentLocationType,
    currentContractType,
  ].filter(Boolean).length;

  function updateFilter(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next, { replace: true });
  }

  function clearAllFilters() {
    setSearchParams(new URLSearchParams(), { replace: true });
  }

  return (
    <Layout>
      {/* ================================================================= */}
      {/* HERO SECTION                                                       */}
      {/* ================================================================= */}
      <Box
        as="section"
        bg="#0A0A0B"
        position="relative"
        overflow="hidden"
        pt={{ base: 16, md: 24 }}
        pb={{ base: 12, md: 16 }}
      >
        {/* Background effects */}
        <Box
          position="absolute"
          inset={0}
          overflow="hidden"
          pointerEvents="none"
        >
          <Glow
            color="rgba(20, 184, 166, 0.2)"
            size="600px"
            top="-20%"
            left="30%"
            intensity={1.2}
          />
          <Glow
            color="rgba(59, 130, 246, 0.08)"
            size="400px"
            bottom="10%"
            right="20%"
            intensity={0.6}
          />
          {/* Grid overlay */}
          <Box
            position="absolute"
            inset={0}
            opacity={0.03}
            backgroundImage="linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)"
            backgroundSize="60px 60px"
          />
        </Box>

        <Container
          maxW="container.lg"
          px={{ base: 4, md: 8 }}
          position="relative"
        >
          <AnimatedSection variants={fadeInUp}>
            <Stack
              gap={6}
              textAlign="center"
              alignItems="center"
              maxW="3xl"
              mx="auto"
            >
              {/* Badge pill */}
              <Box
                as="span"
                display="inline-flex"
                alignItems="center"
                gap={2}
                bg="rgba(20, 184, 166, 0.1)"
                border="1px solid"
                borderColor="rgba(20, 184, 166, 0.3)"
                px={4}
                py={2}
                borderRadius="full"
                fontSize="sm"
                fontWeight="medium"
                color="brand.400"
              >
                <Circle size="6px" bg="brand.400" />
                {t("hero.badge")}
              </Box>

              {/* Heading */}
              <Heading
                as="h1"
                fontSize={{ base: "2.5rem", md: "3.5rem", lg: "4.5rem" }}
                lineHeight="1.1"
                color="white"
                fontWeight="800"
                letterSpacing="-0.03em"
              >
                {t("hero.title")}{" "}
                <GradientText>{t("hero.titleHighlight")}</GradientText>
              </Heading>

              {/* Subtitle */}
              <Text
                fontSize={{ base: "lg", md: "xl" }}
                color="gray.400"
                lineHeight="1.7"
                maxW="600px"
              >
                {t("hero.subtitle")}
              </Text>

              {/* Job counter */}
              <Flex
                alignItems="center"
                gap={2}
                bg="rgba(255, 255, 255, 0.03)"
                px={5}
                py={2.5}
                borderRadius="full"
                border="1px solid"
                borderColor="rgba(255, 255, 255, 0.06)"
              >
                <Briefcase size={16} color="#14B8A6" />
                <Text color="gray.300" fontSize="sm" fontWeight="medium">
                  {t("hero.jobCount", { count: total })}
                </Text>
              </Flex>
            </Stack>
          </AnimatedSection>
        </Container>
      </Box>

      {/* ================================================================= */}
      {/* FILTER BAR                                                         */}
      {/* ================================================================= */}
      <Box
        as="section"
        position="sticky"
        top="0"
        zIndex="sticky"
        bg="rgba(10, 10, 11, 0.85)"
        backdropFilter="blur(20px)"
        borderBottom="1px solid"
        borderColor="rgba(255, 255, 255, 0.06)"
        py={4}
      >
        <Container maxW="container.xl" px={{ base: 4, md: 8 }}>
          <Stack gap={4}>
            {/* Filters row */}
            <Flex
              gap={3}
              flexWrap="wrap"
              alignItems="center"
              justifyContent="center"
            >
              {/* Search input */}
              <Box position="relative" flex={{ base: "1 1 100%", md: "1 1 auto" }} maxW={{ md: "280px" }}>
                <Box
                  position="absolute"
                  left={3}
                  top="50%"
                  transform="translateY(-50%)"
                  color="gray.500"
                  pointerEvents="none"
                  zIndex={1}
                >
                  <Search size={16} />
                </Box>
                <Input
                  value={currentSearch}
                  onChange={(e) => updateFilter("search", e.target.value)}
                  placeholder={t("filters.searchPlaceholder")}
                  bg="rgba(255, 255, 255, 0.05)"
                  color="gray.200"
                  border="1px solid"
                  borderColor="rgba(255, 255, 255, 0.1)"
                  borderRadius="lg"
                  pl={10}
                  pr={3}
                  h="40px"
                  fontSize="sm"
                  _hover={{ borderColor: "rgba(20, 184, 166, 0.4)" }}
                  _focus={{
                    borderColor: "rgba(20, 184, 166, 0.6)",
                    boxShadow: "0 0 0 1px rgba(20, 184, 166, 0.3)",
                  }}
                  _placeholder={{ color: "gray.500" }}
                />
              </Box>

              {/* Seniority select */}
              <NativeSelect.Root w="auto" flex={{ base: "1 1 100%", md: "0 0 auto" }}>
                <NativeSelect.Field
                  value={currentSeniority}
                  onChange={(e) => updateFilter("seniority", e.target.value)}
                  bg="rgba(255, 255, 255, 0.05)"
                  color={currentSeniority ? "gray.200" : "gray.500"}
                  border="1px solid"
                  borderColor="rgba(255, 255, 255, 0.1)"
                  borderRadius="lg"
                  fontSize="sm"
                  h="40px"
                  cursor="pointer"
                  _hover={{ borderColor: "rgba(20, 184, 166, 0.4)" }}
                  _focus={{
                    borderColor: "rgba(20, 184, 166, 0.6)",
                    boxShadow: "0 0 0 1px rgba(20, 184, 166, 0.3)",
                  }}
                >
                  <option value="" style={{ background: "#111112", color: "#a0aec0" }}>
                    {t("filters.allSeniority")}
                  </option>
                  {(["junior", "mid", "senior", "staff", "principal"] as SeniorityLevel[]).map(
                    (level) => (
                      <option
                        key={level}
                        value={level}
                        style={{ background: "#111112", color: "#e2e8f0" }}
                      >
                        {t(`seniority.${level}`)}
                      </option>
                    ),
                  )}
                </NativeSelect.Field>
                <NativeSelect.Indicator color="gray.500" />
              </NativeSelect.Root>

              {/* Location type select */}
              <NativeSelect.Root w="auto" flex={{ base: "1 1 100%", md: "0 0 auto" }}>
                <NativeSelect.Field
                  value={currentLocationType}
                  onChange={(e) => updateFilter("location_type", e.target.value)}
                  bg="rgba(255, 255, 255, 0.05)"
                  color={currentLocationType ? "gray.200" : "gray.500"}
                  border="1px solid"
                  borderColor="rgba(255, 255, 255, 0.1)"
                  borderRadius="lg"
                  fontSize="sm"
                  h="40px"
                  cursor="pointer"
                  _hover={{ borderColor: "rgba(20, 184, 166, 0.4)" }}
                  _focus={{
                    borderColor: "rgba(20, 184, 166, 0.6)",
                    boxShadow: "0 0 0 1px rgba(20, 184, 166, 0.3)",
                  }}
                >
                  <option value="" style={{ background: "#111112", color: "#a0aec0" }}>
                    {t("filters.allLocations")}
                  </option>
                  {(["remote", "hybrid", "onsite"] as LocationType[]).map((loc) => (
                    <option
                      key={loc}
                      value={loc}
                      style={{ background: "#111112", color: "#e2e8f0" }}
                    >
                      {t(`location.${loc}`)}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator color="gray.500" />
              </NativeSelect.Root>

              {/* Contract type select */}
              <NativeSelect.Root w="auto" flex={{ base: "1 1 100%", md: "0 0 auto" }}>
                <NativeSelect.Field
                  value={currentContractType}
                  onChange={(e) => updateFilter("contract_type", e.target.value)}
                  bg="rgba(255, 255, 255, 0.05)"
                  color={currentContractType ? "gray.200" : "gray.500"}
                  border="1px solid"
                  borderColor="rgba(255, 255, 255, 0.1)"
                  borderRadius="lg"
                  fontSize="sm"
                  h="40px"
                  cursor="pointer"
                  _hover={{ borderColor: "rgba(20, 184, 166, 0.4)" }}
                  _focus={{
                    borderColor: "rgba(20, 184, 166, 0.6)",
                    boxShadow: "0 0 0 1px rgba(20, 184, 166, 0.3)",
                  }}
                >
                  <option value="" style={{ background: "#111112", color: "#a0aec0" }}>
                    {t("filters.allContracts")}
                  </option>
                  {(["cdi", "cdd", "freelance"] as ContractType[]).map((ct) => (
                    <option
                      key={ct}
                      value={ct}
                      style={{ background: "#111112", color: "#e2e8f0" }}
                    >
                      {t(`contract.${ct}`)}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator color="gray.500" />
              </NativeSelect.Root>

              {/* Active filter count + clear */}
              {activeFilterCount > 0 && (
                <Flex alignItems="center" gap={2}>
                  <Badge
                    bg="rgba(20, 184, 166, 0.15)"
                    color="teal.300"
                    borderRadius="full"
                    px={2.5}
                    py={0.5}
                    fontSize="xs"
                    fontWeight="bold"
                  >
                    {activeFilterCount}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="xs"
                    color="gray.500"
                    _hover={{ color: "white", bg: "rgba(255, 255, 255, 0.05)" }}
                    onClick={clearAllFilters}
                    borderRadius="md"
                    px={2}
                  >
                    <X size={14} />
                    <Text ml={1} fontSize="xs">
                      {t("filters.clearAll")}
                    </Text>
                  </Button>
                </Flex>
              )}
            </Flex>

            {/* Results counter */}
            <Text color="gray.500" fontSize="xs" textAlign="center">
              {t("filters.resultsCount", { count: jobs.length, total })}
            </Text>
          </Stack>
        </Container>
      </Box>

      {/* ================================================================= */}
      {/* JOB CARD GRID                                                      */}
      {/* ================================================================= */}
      <Box bg="#0A0A0B" py={{ base: 8, md: 12 }} minH="50vh">
        <Container maxW="container.xl" px={{ base: 4, md: 8 }}>
          {jobs.length > 0 ? (
            <StaggeredContainer>
              <Grid
                templateColumns={{
                  base: "1fr",
                  md: "repeat(2, 1fr)",
                  lg: "repeat(3, 1fr)",
                }}
                gap={{ base: 4, md: 5 }}
                alignItems="stretch"
              >
                {jobs.map((job) => (
                  <StaggeredItem key={job.id} h="full">
                    <JobCard job={job} lang={lang} t={t} applicationStatus={appliedJobs[job.slug]} />
                  </StaggeredItem>
                ))}
              </Grid>
            </StaggeredContainer>
          ) : (
            /* ============================================================= */
            /* EMPTY STATE                                                     */
            /* ============================================================= */
            <AnimatedSection variants={fadeInUp}>
              <Stack
                gap={4}
                textAlign="center"
                alignItems="center"
                py={{ base: 16, md: 24 }}
                maxW="md"
                mx="auto"
              >
                <Circle
                  size="64px"
                  bg="rgba(255, 255, 255, 0.03)"
                  color="gray.500"
                >
                  <Briefcase size={28} />
                </Circle>
                <Heading
                  as="h3"
                  fontSize="xl"
                  color="white"
                  fontWeight="600"
                >
                  {t("empty.title")}
                </Heading>
                <Text color="gray.500" fontSize="sm" lineHeight="1.7">
                  {t("empty.subtitle")}
                </Text>
                {activeFilterCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    borderColor="rgba(20, 184, 166, 0.3)"
                    color="brand.400"
                    borderRadius="lg"
                    _hover={{
                      bg: "rgba(20, 184, 166, 0.1)",
                      borderColor: "brand.400",
                    }}
                    onClick={clearAllFilters}
                  >
                    {t("filters.clearAll")}
                  </Button>
                )}
              </Stack>
            </AnimatedSection>
          )}
        </Container>
      </Box>

      {/* ================================================================= */}
      {/* CTA RECRUITER SECTION                                              */}
      {/* ================================================================= */}
      <Box
        as="section"
        py={{ base: 16, md: 24 }}
        bg="#08080A"
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          inset={0}
          overflow="hidden"
          pointerEvents="none"
        >
          <Glow
            color="rgba(20, 184, 166, 0.15)"
            size="500px"
            top="50%"
            left="50%"
            style={{ transform: "translate(-50%, -50%)" }}
          />
        </Box>

        <Container
          maxW="container.md"
          px={{ base: 4, md: 8 }}
          position="relative"
        >
          <AnimatedSection variants={fadeInUp}>
            <Stack gap={8} textAlign="center" alignItems="center">
              <Circle
                size="56px"
                bg="rgba(20, 184, 166, 0.1)"
                color="brand.400"
              >
                <Building2 size={24} />
              </Circle>
              <Heading
                as="h2"
                fontSize={{ base: "2xl", md: "3xl", lg: "3.5rem" }}
                color="white"
                fontWeight="700"
                letterSpacing="-0.02em"
              >
                {t("cta.title")}
              </Heading>
              <Text
                color="gray.400"
                fontSize="lg"
                maxW="xl"
                lineHeight="1.8"
              >
                {t("cta.subtitle")}
              </Text>
              <Link to={`/${lang}/pilot`} style={{ textDecoration: "none" }}>
              <Button
                h={14}
                px={10}
                bg="linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)"
                color="white"
                fontWeight="600"
                borderRadius="xl"
                fontSize="md"
                boxShadow="0 4px 20px rgba(20, 184, 166, 0.3)"
                _hover={{
                  transform: "translateY(-2px)",
                  boxShadow: "0 8px 30px rgba(20, 184, 166, 0.4)",
                }}
                _active={{ transform: "translateY(0)" }}
                transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
              >
                {t("cta.button")} <ArrowRight size={18} />
              </Button>
              </Link>
            </Stack>
          </AnimatedSection>
        </Container>
      </Box>
    </Layout>
  );
}
