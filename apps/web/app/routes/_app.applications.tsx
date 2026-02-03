import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useOutletContext, Link } from "react-router";
import {
  Box,
  Heading,
  Text,
  Stack,
  Flex,
  Badge,
  Circle,
} from "@chakra-ui/react";
import {
  FileText,
  Building2,
  Briefcase,
  ArrowRight,
  ExternalLink,
  Clock,
  CheckCircle,
} from "lucide-react";
import { getMyApplications } from "~/components/lib/api";
import type { User } from "~/components/lib/api";
import { EmptyState } from "~/components/ui/states";
import type { Route } from "./+types/_app.applications";

// =============================================================================
// META
// =============================================================================

export const meta: Route.MetaFunction = () => {
  return [{ title: "Mes candidatures - Baara" }];
};

// =============================================================================
// Types
// =============================================================================

interface Application {
  attempt_id: string;
  status: string;
  progress: number;
  submitted_at?: string;
  created_at: string;
  job_id?: string;
  job_slug?: string;
  job_title?: string;
  job_team?: string;
  job_seniority?: string;
  job_location_type?: string;
  job_contract_type?: string;
  org_name?: string;
}

// =============================================================================
// Status helpers
// =============================================================================

const statusConfig: Record<string, { bg: string; color: string }> = {
  draft: { bg: "bg.muted", color: "text.muted" },
  in_progress: { bg: "rgba(251, 191, 36, 0.1)", color: "yellow.500" },
  interviewing: { bg: "rgba(59, 130, 246, 0.1)", color: "blue.500" },
  submitted: { bg: "rgba(20, 184, 166, 0.1)", color: "brand.400" },
  reviewed: { bg: "rgba(20, 184, 166, 0.15)", color: "brand.500" },
  shortlisted: { bg: "success.subtle", color: "success" },
  rejected: { bg: "error.subtle", color: "error" },
  hired: { bg: "success.subtle", color: "success" },
};

function isEditable(status: string) {
  return status === "draft" || status === "in_progress" || status === "interviewing";
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function ApplicationsPage() {
  const { t, i18n } = useTranslation("app");
  const { user } = useOutletContext<{ user: User }>();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyApplications()
      .then((data) => {
        setApplications((data.applications || []) as Application[]);
      })
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr: string) => {
    const locale = i18n.language === "fr" ? "fr-FR" : "en-US";
    return new Date(dateStr).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const lang = i18n.language || "fr";

  return (
    <Box py={8} px={8} maxW="900px" mx="auto">
      <Stack gap={6}>
        {/* Header */}
        <Box>
          <Heading as="h1" fontSize="xl" color="text" mb={1} fontWeight="semibold">
            {t("applications.heading")}
          </Heading>
          <Text fontSize="sm" color="text.secondary">
            {t("applications.subtitle")}
          </Text>
        </Box>

        {/* Loading */}
        {loading && (
          <Flex justify="center" py={12}>
            <Text color="text.muted" fontSize="sm">...</Text>
          </Flex>
        )}

        {/* Empty state */}
        {!loading && applications.length === 0 && (
          <EmptyState
            icon={<FileText size={20} strokeWidth={1.5} />}
            title={t("applications.emptyTitle")}
            subtitle={t("applications.emptySubtitle")}
            action={{
              label: t("applications.browseJobs"),
              onClick: () => { window.location.href = `/${lang}/jobs`; },
            }}
          />
        )}

        {/* Applications list */}
        {!loading && applications.length > 0 && (
          <Stack gap={3}>
            {applications.map((app) => {
              const config = statusConfig[app.status] || statusConfig.draft;
              const editable = isEditable(app.status);

              return (
                <Box
                  key={app.attempt_id}
                  bg="surface"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="border"
                  p={5}
                  transition="all 0.2s"
                  _hover={{ borderColor: "border.emphasis", shadow: "sm" }}
                >
                  <Flex justify="space-between" align="start" gap={4}>
                    {/* Left: job info */}
                    <Box flex={1} minW={0}>
                      <Flex align="center" gap={3} mb={2}>
                        <Circle
                          size="36px"
                          bg="rgba(20, 184, 166, 0.1)"
                          color="brand.400"
                          flexShrink={0}
                        >
                          <Briefcase size={16} strokeWidth={1.5} />
                        </Circle>
                        <Box minW={0} flex={1}>
                          <Text fontWeight="semibold" color="text" fontSize="md" lineClamp={1}>
                            {app.job_title || "—"}
                          </Text>
                          {app.org_name && (
                            <Flex align="center" gap={1}>
                              <Building2 size={12} color="var(--chakra-colors-text-muted)" />
                              <Text fontSize="xs" color="text.muted">{app.org_name}</Text>
                            </Flex>
                          )}
                        </Box>
                        <Badge
                          bg={config.bg}
                          color={config.color}
                          fontSize="xs"
                          fontWeight="semibold"
                          px={2}
                          py={0.5}
                          borderRadius="full"
                          flexShrink={0}
                        >
                          {t(`applications.status.${app.status}`)}
                        </Badge>
                      </Flex>

                      {/* Meta row */}
                      <Flex gap={3} flexWrap="wrap" ml="48px">
                        {app.job_seniority && (
                          <Text fontSize="xs" color="text.muted">
                            {t(`jobs.seniority.${app.job_seniority}`, { ns: "jobs", defaultValue: app.job_seniority })}
                          </Text>
                        )}
                        {app.job_location_type && (
                          <Text fontSize="xs" color="text.muted">
                            {t(`jobs.location.${app.job_location_type}`, { ns: "jobs", defaultValue: app.job_location_type })}
                          </Text>
                        )}
                        {app.job_contract_type && (
                          <Text fontSize="xs" color="text.muted">
                            {t(`jobs.contract.${app.job_contract_type}`, { ns: "jobs", defaultValue: app.job_contract_type })}
                          </Text>
                        )}
                        <Flex align="center" gap={1}>
                          <Clock size={11} color="var(--chakra-colors-text-muted)" />
                          <Text fontSize="xs" color="text.muted">
                            {app.submitted_at
                              ? t("applications.submittedOn", { date: formatDate(app.submitted_at) })
                              : t("applications.appliedOn", { date: formatDate(app.created_at) })}
                          </Text>
                        </Flex>
                      </Flex>

                      {/* Progress bar for in-progress applications */}
                      {editable && app.progress > 0 && (
                        <Box ml="48px" mt={2}>
                          <Box w="full" maxW="200px" h="4px" bg="bg.muted" borderRadius="full">
                            <Box
                              h="full"
                              bg="brand.400"
                              borderRadius="full"
                              w={`${app.progress}%`}
                              transition="width 0.3s"
                            />
                          </Box>
                          <Text fontSize="10px" color="text.muted" mt={0.5}>{app.progress}%</Text>
                        </Box>
                      )}
                    </Box>

                    {/* Right: actions */}
                    <Flex align="center" gap={2} flexShrink={0} mt={1}>
                      {editable && (
                        <Link to={`/app/work-sample/${app.attempt_id}`}>
                          <Flex
                            align="center"
                            gap={1}
                            px={3}
                            py={1.5}
                            bg="primary"
                            color="white"
                            borderRadius="lg"
                            fontSize="xs"
                            fontWeight="semibold"
                            _hover={{ bg: "primary.hover" }}
                            cursor="pointer"
                          >
                            {t("applications.continueWork")}
                            <ArrowRight size={12} />
                          </Flex>
                        </Link>
                      )}
                      {!editable && (
                        <Link to={`/app/work-sample/${app.attempt_id}/results`}>
                          <Flex
                            align="center"
                            gap={1}
                            px={3}
                            py={1.5}
                            bg="rgba(20, 184, 166, 0.1)"
                            color="brand.400"
                            borderRadius="lg"
                            fontSize="xs"
                            fontWeight="semibold"
                            border="1px solid"
                            borderColor="rgba(20, 184, 166, 0.2)"
                            _hover={{ bg: "rgba(20, 184, 166, 0.15)" }}
                            cursor="pointer"
                          >
                            <CheckCircle size={12} />
                            {t("applications.viewResults")}
                          </Flex>
                        </Link>
                      )}
                      {app.job_slug && (
                        <Link to={`/${lang}/jobs/${app.job_slug}`}>
                          <Flex
                            align="center"
                            gap={1}
                            px={3}
                            py={1.5}
                            borderRadius="lg"
                            fontSize="xs"
                            fontWeight="medium"
                            color="text.secondary"
                            border="1px solid"
                            borderColor="border"
                            _hover={{ bg: "bg.subtle", color: "text" }}
                            cursor="pointer"
                          >
                            <ExternalLink size={12} />
                            {t("applications.viewJob")}
                          </Flex>
                        </Link>
                      )}
                    </Flex>
                  </Flex>
                </Box>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
