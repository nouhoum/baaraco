"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Container,
  Heading,
  Text,
  Stack,
  Flex,
  Grid,
  Circle,
  Badge,
} from "@chakra-ui/react";
import { Link, useOutletContext, useNavigate } from "react-router";
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Clock,
  Users,
  Building2,
  Target,
  CheckCircle,
  DollarSign,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { Layout } from "~/components/layout";
import { AnimatedSection, fadeInUp } from "~/components/ui/motion";
import { serverFetch } from "~/components/lib/api.server";
import { applyToPublicJob, getMyApplicationForJob } from "~/components/lib/api";
import type { PublicJobDetail } from "~/components/lib/api";
import type { Route } from "./+types/_lang.jobs.$slug";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPostedDaysAgo(dateStr: string, t: any): string {
  const days = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days === 0) return t("card.postedToday");
  if (days === 1) return t("card.postedYesterday");
  return t("card.postedAgo", { days });
}

function formatSalary(
  min?: number,
  max?: number,
  t?: any
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

// ---------------------------------------------------------------------------
// Frosted glass card wrapper
// ---------------------------------------------------------------------------

function GlassCard({ children, ...props }: { children: React.ReactNode; [key: string]: any }) {
  return (
    <Box
      bg="rgba(255,255,255,0.02)"
      border="1px solid rgba(255,255,255,0.06)"
      borderRadius="2xl"
      p={{ base: 6, md: 8 }}
      {...props}
    >
      {children}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Section card with icon + title
// ---------------------------------------------------------------------------

function SectionCard({
  icon,
  title,
  children,
  delay = 0,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <AnimatedSection variants={fadeInUp} delay={delay}>
      <GlassCard>
        <Flex gap={3} alignItems="center" mb={5}>
          <Circle size="40px" bg="rgba(20,184,166,0.1)" color="brand.400">
            {icon}
          </Circle>
          <Heading
            as="h3"
            fontSize="lg"
            fontWeight="600"
            color="white"
            letterSpacing="-0.01em"
          >
            {title}
          </Heading>
        </Flex>
        {children}
      </GlassCard>
    </AnimatedSection>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

export function meta({ data }: Route.MetaArgs) {
  const job = (data as any)?.job as PublicJobDetail | undefined;
  return [{ title: job ? `${job.title} - Baara` : "Job - Baara" }];
}

// ---------------------------------------------------------------------------
// Loader
// ---------------------------------------------------------------------------

export async function loader({ request, params }: Route.LoaderArgs) {
  const { slug } = params;

  const res = await serverFetch(request, `/api/v1/public/jobs/${slug}`);
  if (!res.ok) {
    throw new Response("Not Found", { status: 404 });
  }

  const data = await res.json();
  return { job: data.job as PublicJobDetail };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function JobDetailPage({ loaderData }: Route.ComponentProps) {
  const { job } = loaderData;
  const { t } = useTranslation("jobs");
  const { lang, user } = useOutletContext<{ lang: string; user: any }>();
  const navigate = useNavigate();

  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [application, setApplication] = useState<{
    applied: boolean;
    attempt?: { id: string; status: string; progress: number };
  } | null>(null);

  const salary = formatSalary(job.salary_min, job.salary_max, t);

  // -----------------------------------------------------------------------
  // Pre-check: has the candidate already applied?
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (user?.role === "candidate" && job.slug) {
      getMyApplicationForJob(job.slug).then(setApplication);
    }
  }, [user, job.slug]);

  // -----------------------------------------------------------------------
  // Apply handler
  // -----------------------------------------------------------------------

  async function handleApply() {
    if (!user) {
      navigate(`/${lang}/login?returnTo=/${lang}/jobs/${job.slug}`);
      return;
    }

    if (user.role === "recruiter") return;

    setApplyLoading(true);
    setApplyError(null);

    try {
      const result = await applyToPublicJob(job.slug);
      if (result.existing) {
        setApplication({
          applied: true,
          attempt: { id: result.attempt.id, status: result.attempt.status || "draft", progress: result.attempt.progress || 0 },
        });
      } else {
        navigate(`/app/work-sample/${result.attempt.id}`);
      }
    } catch (err: any) {
      setApplyError(err.message || t("detail.applyError"));
    } finally {
      setApplyLoading(false);
    }
  }

  // -----------------------------------------------------------------------
  // Attempt status helpers
  // -----------------------------------------------------------------------

  const isAttemptSubmitted = (status: string) =>
    status === "submitted" || status === "reviewed" || status === "shortlisted" || status === "hired" || status === "rejected";

  // -----------------------------------------------------------------------
  // Apply button rendering
  // -----------------------------------------------------------------------

  function renderApplyButton() {
    // Recruiter — disabled
    if (user?.role === "recruiter") {
      return (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          w="full"
          h="14"
          bg="rgba(255,255,255,0.05)"
          color="gray.500"
          fontWeight="600"
          fontSize="md"
          borderRadius="xl"
          cursor="not-allowed"
          opacity={0.6}
        >
          {t("detail.recruiterNotice")}
        </Box>
      );
    }

    // Not logged in
    if (!user) {
      return (
        <Box
          as="button"
          display="flex"
          alignItems="center"
          justifyContent="center"
          w="full"
          h="14"
          bg="linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)"
          color="white"
          fontWeight="600"
          fontSize="md"
          borderRadius="xl"
          cursor="pointer"
          transition="all 0.25s"
          boxShadow="0 4px 20px rgba(15, 118, 110, 0.35)"
          _hover={{
            transform: "translateY(-2px)",
            boxShadow: "0 8px 30px rgba(20, 184, 166, 0.45)",
          }}
          _active={{ transform: "translateY(0)" }}
          onClick={handleApply}
        >
          {t("detail.loginToApply")}
        </Box>
      );
    }

    // Already applied — show state-aware button
    if (application?.applied && application.attempt) {
      const { id, status, progress } = application.attempt;

      // Submitted / reviewed — non-actionable confirmation
      if (isAttemptSubmitted(status)) {
        return (
          <Stack gap={3}>
            <Link to={`/app/work-sample/${id}/results`}>
              <Box
                as="span"
                display="flex"
                alignItems="center"
                justifyContent="center"
                gap={2}
                w="full"
                h="14"
                bg="rgba(20, 184, 166, 0.1)"
                color="brand.400"
                fontWeight="600"
                fontSize="md"
                borderRadius="xl"
                border="1px solid"
                borderColor="rgba(20, 184, 166, 0.3)"
                cursor="pointer"
                transition="all 0.25s"
                _hover={{
                  bg: "rgba(20, 184, 166, 0.15)",
                  borderColor: "rgba(20, 184, 166, 0.5)",
                }}
              >
                <CheckCircle size={18} />
                {t("detail.applicationSubmitted")}
              </Box>
            </Link>
            <Text color="gray.500" fontSize="xs" textAlign="center">
              {t("detail.viewResults")}
            </Text>
          </Stack>
        );
      }

      // Draft / in progress — continue with progress indicator
      return (
        <Stack gap={3}>
          <Link to={`/app/work-sample/${id}`}>
            <Box
              as="span"
              display="flex"
              alignItems="center"
              justifyContent="center"
              w="full"
              h="14"
              bg="linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)"
              color="white"
              fontWeight="600"
              fontSize="md"
              borderRadius="xl"
              cursor="pointer"
              transition="all 0.25s"
              _hover={{
                transform: "translateY(-2px)",
                boxShadow: "0 8px 30px rgba(20, 184, 166, 0.4)",
              }}
            >
              {t("detail.continueApplication")}
            </Box>
          </Link>
          {progress > 0 && (
            <Box>
              <Flex justify="space-between" mb={1}>
                <Text color="gray.500" fontSize="xs">{t("detail.progressLabel")}</Text>
                <Text color="brand.400" fontSize="xs" fontWeight="600">{progress}%</Text>
              </Flex>
              <Box w="full" h="4px" bg="rgba(255,255,255,0.06)" borderRadius="full">
                <Box
                  h="full"
                  bg="linear-gradient(90deg, #0F766E, #14B8A6)"
                  borderRadius="full"
                  w={`${progress}%`}
                  transition="width 0.3s"
                />
              </Box>
            </Box>
          )}
        </Stack>
      );
    }

    // Candidate — not yet applied
    return (
      <Box
        as="button"
        display="flex"
        alignItems="center"
        justifyContent="center"
        w="full"
        h="14"
        bg="linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)"
        color="white"
        fontWeight="600"
        fontSize="md"
        borderRadius="xl"
        cursor={applyLoading ? "wait" : "pointer"}
        transition="all 0.25s"
        boxShadow="0 4px 20px rgba(15, 118, 110, 0.35)"
        _hover={{
          transform: applyLoading ? "none" : "translateY(-2px)",
          boxShadow: "0 8px 30px rgba(20, 184, 166, 0.45)",
        }}
        _active={{ transform: "translateY(0)" }}
        onClick={handleApply}
        aria-disabled={applyLoading}
        opacity={applyLoading ? 0.7 : 1}
      >
        {applyLoading ? t("detail.applying") : t("detail.apply")}
      </Box>
    );
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <Layout>
      <Box bg="#0A0A0B" minH="100vh">
        {/* ============================================================== */}
        {/* HEADER                                                         */}
        {/* ============================================================== */}
        <Box
          bg="#0A0A0B"
          borderBottom="1px solid rgba(255,255,255,0.06)"
          pt={{ base: 8, md: 12 }}
          pb={{ base: 8, md: 12 }}
        >
          <Container maxW="container.xl" px={{ base: 6, md: 8 }}>
            <AnimatedSection variants={fadeInUp}>
              <Stack gap={6}>
                {/* Breadcrumb / Back link */}
                <Link to={`/${lang}/jobs`}>
                  <Flex
                    alignItems="center"
                    gap={2}
                    color="gray.400"
                    transition="color 0.2s"
                    _hover={{ color: "brand.400" }}
                    w="fit-content"
                  >
                    <ArrowLeft size={18} />
                    <Text fontSize="sm" fontWeight="500">
                      {t("detail.back")}
                    </Text>
                  </Flex>
                </Link>

                {/* Org info */}
                {job.org && (
                  <Flex alignItems="center" gap={3}>
                    <Circle
                      size="48px"
                      bg="rgba(20,184,166,0.15)"
                      color="brand.400"
                      fontWeight="700"
                      fontSize="lg"
                      flexShrink={0}
                    >
                      {job.org.logo_url ? (
                        <img
                          src={job.org.logo_url}
                          alt={job.org.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: "9999px",
                          }}
                        />
                      ) : (
                        job.org.name.charAt(0).toUpperCase()
                      )}
                    </Circle>
                    <Box>
                      <Text fontWeight="600" color="white" fontSize="md">
                        {job.org.name}
                      </Text>
                      {job.org.website && (
                        <a
                          href={job.org.website}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Flex
                            alignItems="center"
                            gap={1}
                            color="gray.500"
                            fontSize="sm"
                            transition="color 0.2s"
                            _hover={{ color: "brand.400" }}
                          >
                            <Text>{job.org.website.replace(/^https?:\/\//, "")}</Text>
                            <ExternalLink size={12} />
                          </Flex>
                        </a>
                      )}
                    </Box>
                  </Flex>
                )}

                {/* Job title */}
                <Heading
                  as="h1"
                  fontSize={{ base: "2xl", md: "3.5rem" }}
                  fontWeight="700"
                  color="white"
                  letterSpacing="-0.03em"
                  lineHeight="1.1"
                  fontFamily="'Cabinet Grotesk', sans-serif"
                >
                  {job.title}
                </Heading>

                {/* Badges row */}
                <Flex gap={3} flexWrap="wrap" alignItems="center">
                  {job.seniority && (
                    <Badge
                      px={3}
                      py={1.5}
                      borderRadius="lg"
                      bg="rgba(255,255,255,0.05)"
                      border="1px solid rgba(255,255,255,0.1)"
                      color="gray.300"
                      fontWeight="500"
                      fontSize="sm"
                      textTransform="capitalize"
                    >
                      <Flex alignItems="center" gap={1.5}>
                        <Briefcase size={14} />
                        {job.seniority}
                      </Flex>
                    </Badge>
                  )}
                  {(job.location_type || job.location_city) && (
                    <Badge
                      px={3}
                      py={1.5}
                      borderRadius="lg"
                      bg="rgba(255,255,255,0.05)"
                      border="1px solid rgba(255,255,255,0.1)"
                      color="gray.300"
                      fontWeight="500"
                      fontSize="sm"
                      textTransform="capitalize"
                    >
                      <Flex alignItems="center" gap={1.5}>
                        <MapPin size={14} />
                        {job.location_city || job.location_type}
                      </Flex>
                    </Badge>
                  )}
                  {job.contract_type && (
                    <Badge
                      px={3}
                      py={1.5}
                      borderRadius="lg"
                      bg="rgba(255,255,255,0.05)"
                      border="1px solid rgba(255,255,255,0.1)"
                      color="gray.300"
                      fontWeight="500"
                      fontSize="sm"
                      textTransform="uppercase"
                    >
                      <Flex alignItems="center" gap={1.5}>
                        <Clock size={14} />
                        {job.contract_type}
                      </Flex>
                    </Badge>
                  )}
                </Flex>

                {/* Stack tags */}
                {job.stack && job.stack.length > 0 && (
                  <Flex gap={2} flexWrap="wrap">
                    {job.stack.map((tech) => (
                      <Box
                        key={tech}
                        px={3}
                        py={1}
                        bg="rgba(20,184,166,0.1)"
                        border="1px solid rgba(20,184,166,0.25)"
                        borderRadius="full"
                        color="brand.400"
                        fontSize="sm"
                        fontWeight="500"
                      >
                        {tech}
                      </Box>
                    ))}
                  </Flex>
                )}

                {/* Salary + posted date */}
                <Flex gap={4} alignItems="center" flexWrap="wrap">
                  {salary && (
                    <Flex alignItems="center" gap={1.5}>
                      <DollarSign size={16} color="#14B8A6" />
                      <Text color="brand.400" fontWeight="600" fontSize="md">
                        {salary}
                      </Text>
                    </Flex>
                  )}
                  <Text color="gray.500" fontSize="sm">
                    {getPostedDaysAgo(job.created_at, t)}
                  </Text>
                </Flex>
              </Stack>
            </AnimatedSection>
          </Container>
        </Box>

        {/* ============================================================== */}
        {/* BODY — 2 columns                                               */}
        {/* ============================================================== */}
        <Container maxW="container.xl" px={{ base: 6, md: 8 }} py={{ base: 8, md: 14 }}>
          <Grid
            templateColumns={{ base: "1fr", lg: "2fr 1fr" }}
            gap={{ base: 8, lg: 10 }}
            alignItems="start"
          >
            {/* ---------------------------------------------------------- */}
            {/* LEFT COLUMN — Content sections                              */}
            {/* ---------------------------------------------------------- */}
            <Stack gap={6}>
              {/* Context */}
              {(job.business_context || job.team || job.team_size) && (
                <SectionCard
                  icon={<Building2 size={20} />}
                  title={t("detail.context")}
                  delay={0}
                >
                  <Stack gap={4}>
                    {job.business_context && (
                      <Text color="gray.300" fontSize="md" lineHeight="1.8">
                        {job.business_context}
                      </Text>
                    )}
                    {(job.team || job.team_size) && (
                      <Flex gap={4} flexWrap="wrap">
                        {job.team && (
                          <Flex alignItems="center" gap={2}>
                            <Users size={16} color="#94A3B8" />
                            <Text color="gray.400" fontSize="sm">
                              {t("detail.team")}: {job.team}
                            </Text>
                          </Flex>
                        )}
                        {job.team_size && (
                          <Flex alignItems="center" gap={2}>
                            <Users size={16} color="#94A3B8" />
                            <Text color="gray.400" fontSize="sm">
                              {t("detail.teamSize")}: {job.team_size}
                            </Text>
                          </Flex>
                        )}
                      </Flex>
                    )}
                  </Stack>
                </SectionCard>
              )}

              {/* Challenge */}
              {job.main_problem && (
                <SectionCard
                  icon={<Target size={20} />}
                  title={t("detail.challenge")}
                  delay={0.05}
                >
                  <Text color="gray.300" fontSize="md" lineHeight="1.8">
                    {job.main_problem}
                  </Text>
                </SectionCard>
              )}

              {/* Expected Outcomes */}
              {job.expected_outcomes && job.expected_outcomes.length > 0 && (
                <SectionCard
                  icon={<CheckCircle size={20} />}
                  title={t("detail.expectedOutcomes")}
                  delay={0.1}
                >
                  <Stack gap={3}>
                    {job.expected_outcomes.map((outcome, i) => (
                      <Flex key={i} gap={3} alignItems="flex-start">
                        <Text
                          color="brand.400"
                          fontWeight="700"
                          fontSize="sm"
                          mt={0.5}
                          minW="24px"
                        >
                          {String(i + 1).padStart(2, "0")}
                        </Text>
                        <Text color="gray.300" fontSize="md" lineHeight="1.7">
                          {outcome}
                        </Text>
                      </Flex>
                    ))}
                  </Stack>
                </SectionCard>
              )}

            </Stack>

            {/* ---------------------------------------------------------- */}
            {/* RIGHT COLUMN — Sticky sidebar                               */}
            {/* ---------------------------------------------------------- */}
            <Box
              position={{ base: "static", lg: "sticky" }}
              top={{ lg: "100px" }}
            >
              <AnimatedSection variants={fadeInUp} delay={0.1}>
                <GlassCard>
                  <Stack gap={5}>
                    {/* Org summary */}
                    {job.org && (
                      <Flex alignItems="center" gap={3}>
                        <Circle
                          size="40px"
                          bg="rgba(20,184,166,0.15)"
                          color="brand.400"
                          fontWeight="700"
                          fontSize="md"
                          flexShrink={0}
                        >
                          {job.org.logo_url ? (
                            <img
                              src={job.org.logo_url}
                              alt={job.org.name}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                borderRadius: "9999px",
                              }}
                            />
                          ) : (
                            job.org.name.charAt(0).toUpperCase()
                          )}
                        </Circle>
                        <Text fontWeight="600" color="white" fontSize="sm">
                          {job.org.name}
                        </Text>
                      </Flex>
                    )}

                    {/* Salary */}
                    {salary && (
                      <Flex
                        alignItems="center"
                        gap={2}
                        p={3}
                        bg="rgba(20,184,166,0.08)"
                        borderRadius="xl"
                      >
                        <DollarSign size={18} color="#14B8A6" />
                        <Text color="brand.400" fontWeight="600" fontSize="md">
                          {salary}
                        </Text>
                      </Flex>
                    )}

                    {/* Urgency */}
                    {job.urgency && (
                      <Flex alignItems="center" gap={2}>
                        <Clock size={16} color="#94A3B8" />
                        <Text color="gray.400" fontSize="sm">
                          {t("detail.urgency")}: {t(`detail.urgencyValues.${job.urgency}`)}
                        </Text>
                      </Flex>
                    )}

                    {/* Start date */}
                    {job.start_date && (
                      <Flex alignItems="center" gap={2}>
                        <Calendar size={16} color="#94A3B8" />
                        <Text color="gray.400" fontSize="sm">
                          {t("detail.startDate")}: {new Date(job.start_date).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { day: "numeric", month: "long", year: "numeric" })}
                        </Text>
                      </Flex>
                    )}

                    {/* Divider */}
                    <Box h="1px" bg="rgba(255,255,255,0.06)" />

                    {/* Apply button */}
                    {renderApplyButton()}

                    {/* Apply error */}
                    {applyError && (
                      <Text color="red.400" fontSize="sm" textAlign="center">
                        {applyError}
                      </Text>
                    )}

                    {/* Subtext */}
                    <Text color="gray.500" fontSize="xs" textAlign="center" lineHeight="1.6">
                      {t("detail.applySubtext")}
                    </Text>
                  </Stack>
                </GlassCard>
              </AnimatedSection>
            </Box>
          </Grid>
        </Container>

        {/* ============================================================== */}
        {/* BOTTOM BACK LINK                                               */}
        {/* ============================================================== */}
        <Container maxW="container.xl" px={{ base: 6, md: 8 }} pb={{ base: 12, md: 20 }}>
          <Link to={`/${lang}/jobs`}>
            <Flex
              alignItems="center"
              gap={2}
              color="gray.400"
              transition="color 0.2s"
              _hover={{ color: "brand.400" }}
              w="fit-content"
            >
              <ArrowLeft size={18} />
              <Text fontSize="sm" fontWeight="500">
                {t("detail.back")}
              </Text>
            </Flex>
          </Link>
        </Container>
      </Box>
    </Layout>
  );
}
