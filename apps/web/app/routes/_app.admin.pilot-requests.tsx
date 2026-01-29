import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Box,
  Heading,
  Text,
  Stack,
  Flex,
  Button,
  Badge,
  Input,
  Table,
} from "@chakra-ui/react";
import { Search, Users, ChevronRight } from "lucide-react";
import {
  type PilotRequestListItem,
  type PilotRequestStats,
  type AdminStatus,
} from "~/components/lib/api";
import { requireRole } from "~/components/lib/auth.server";
import { authenticatedFetch } from "~/components/lib/api.server";
import type { Route } from "./+types/_app.admin.pilot-requests";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Pilot Requests - Admin - Baara" }];
};

export async function loader({ request }: Route.LoaderArgs) {
  await requireRole(request, ["admin"]);
  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "";
  const search = url.searchParams.get("search") || "";
  const page = url.searchParams.get("page") || "1";

  const query = new URLSearchParams();
  if (status && status !== "all") query.set("status", status);
  if (search) query.set("search", search);
  query.set("page", page);
  query.set("per_page", "20");

  const res = await authenticatedFetch(
    request,
    `/api/v1/admin/pilot-requests?${query}`,
  );
  if (!res.ok) {
    return {
      requests: [] as PilotRequestListItem[],
      stats: null as PilotRequestStats | null,
      total: 0,
      error: "Erreur lors du chargement",
    };
  }
  const data = await res.json();
  return {
    requests: (data.requests || []) as PilotRequestListItem[],
    stats: data.stats as PilotRequestStats | null,
    total: data.total as number,
    error: null as string | null,
  };
}

// Status badge component
function StatusBadge({ status, t }: { status: AdminStatus; t: (key: string) => string }) {
  const config: Record<AdminStatus, { bg: string; color: string; labelKey: string }> = {
    new: { bg: "info.subtle", color: "info", labelKey: "pilotRequests.status.new" },
    contacted: { bg: "warning.subtle", color: "warning", labelKey: "pilotRequests.status.contacted" },
    in_discussion: { bg: "orange.subtle", color: "orange.600", labelKey: "pilotRequests.status.inDiscussion" },
    converted: { bg: "success.subtle", color: "success", labelKey: "pilotRequests.status.converted" },
    rejected: { bg: "error.subtle", color: "error", labelKey: "pilotRequests.status.rejected" },
    archived: { bg: "bg.muted", color: "text.muted", labelKey: "pilotRequests.status.archived" },
  };

  const { bg, color, labelKey } = config[status] || config.new;

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
      {t(labelKey)}
    </Badge>
  );
}

// Helper to get translated value or fallback to raw value
function getTranslatedValue(
  t: (key: string) => string,
  category: string,
  value: string | null | undefined
): string {
  if (!value) return "-";
  const key = `pilotRequests.values.${category}.${value}`;
  const translated = t(key);
  // If translation key is returned as-is, it means no translation exists
  return translated === key ? value : translated;
}

// Stats card
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Box
      bg="surface"
      borderRadius="lg"
      border="1px solid"
      borderColor="border"
      p={4}
      flex={1}
      minW="100px"
    >
      <Text fontSize="2xl" fontWeight="bold" color={color}>
        {value}
      </Text>
      <Text fontSize="xs" color="text.muted">
        {label}
      </Text>
    </Box>
  );
}

export default function AdminPilotRequests({
  loaderData,
}: Route.ComponentProps) {
  const { t, i18n } = useTranslation("admin");
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Data from loader
  const { requests, stats, total, error } = loaderData;

  // Filters from searchParams
  const filter =
    (searchParams.get("status") as AdminStatus | "all") || "all";
  const page = Number(searchParams.get("page") || "1");

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
          next.delete("page"); // Reset to page 1 on search
          return next;
        },
        { preventScrollReset: true },
      );
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput, setSearchParams]);

  // Helper to update a search param
  const setParam = (key: string, value: string | undefined) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value && value !== "all") {
          next.set(key, value);
        } else {
          next.delete(key);
        }
        if (key !== "page") next.delete("page"); // Reset to page 1 on filter change
        return next;
      },
      { preventScrollReset: true },
    );
  };

  // Format relative time with translations
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return t("pilotRequests.time.minutesAgo", { count: diffMins });
    } else if (diffHours < 24) {
      return t("pilotRequests.time.hoursAgo", { count: diffHours });
    } else if (diffDays < 7) {
      return t("pilotRequests.time.daysAgo", { count: diffDays });
    } else {
      return date.toLocaleDateString(i18n.language === "fr" ? "fr-FR" : "en-US", {
        day: "numeric",
        month: "short",
      });
    }
  };

  // Filter button config
  const filterButtons: { status: AdminStatus | "all"; labelKey: string }[] = [
    { status: "all", labelKey: "pilotRequests.filters.all" },
    { status: "new", labelKey: "pilotRequests.filters.new" },
    { status: "contacted", labelKey: "pilotRequests.filters.contacted" },
    { status: "in_discussion", labelKey: "pilotRequests.filters.inDiscussion" },
    { status: "converted", labelKey: "pilotRequests.filters.converted" },
    { status: "rejected", labelKey: "pilotRequests.filters.rejected" },
  ];

  return (
    <Box py={8} px={8} maxW="1200px" mx="auto">
      <Stack gap={6}>
        {/* Header */}
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
          <Box>
            <Heading as="h1" fontSize="xl" color="text" mb={1} fontWeight="semibold">
              {t("pilotRequests.title")}
            </Heading>
            <Text fontSize="sm" color="text.secondary">
              {t("pilotRequests.subtitle")}
            </Text>
          </Box>
        </Flex>

        {/* Stats */}
        {stats && (
          <Flex gap={3} flexWrap="wrap">
            <StatCard label={t("pilotRequests.stats.new")} value={stats.new} color="info" />
            <StatCard label={t("pilotRequests.stats.contacted")} value={stats.contacted} color="warning" />
            <StatCard label={t("pilotRequests.stats.inDiscussion")} value={stats.in_discussion} color="orange.500" />
            <StatCard label={t("pilotRequests.stats.converted")} value={stats.converted} color="success" />
            <StatCard label={t("pilotRequests.stats.total")} value={stats.total} color="text" />
          </Flex>
        )}

        {/* Filters */}
        <Flex gap={4} flexWrap="wrap" align="center">
          <Flex gap={2} flex={1}>
            {filterButtons.map(({ status, labelKey }) => (
              <Button
                key={status}
                size="sm"
                variant={filter === status ? "solid" : "outline"}
                bg={filter === status ? "primary" : "transparent"}
                color={filter === status ? "white" : "text.secondary"}
                borderColor="border"
                onClick={() => setParam("status", status)}
                _hover={{
                  bg: filter === status ? "primary.hover" : "bg.subtle",
                }}
              >
                {t(labelKey)}
              </Button>
            ))}
          </Flex>

          {/* Search */}
          <Flex align="center" gap={2} position="relative">
            <Box position="absolute" left={3} color="text.muted">
              <Search size={16} />
            </Box>
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("pilotRequests.search.placeholder")}
              pl={10}
              w="250px"
              fontSize="sm"
              borderColor="border"
              _hover={{ borderColor: "border.emphasis" }}
              _focus={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
            />
          </Flex>
        </Flex>

        {/* Error */}
        {error && (
          <Box bg="error.subtle" borderRadius="lg" border="1px solid" borderColor="error.muted" px={4} py={3}>
            <Text fontSize="sm" color="error">{error}</Text>
          </Box>
        )}

        {/* Table */}
        {requests.length === 0 ? (
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
              <Users size={20} strokeWidth={1.5} />
            </Box>
            <Heading as="h3" fontSize="md" color="text" mb={2} fontWeight="semibold">
              {filter !== "all" ? t("pilotRequests.noRequestsInCategory") : t("pilotRequests.noRequests")}
            </Heading>
            <Text fontSize="sm" color="text.secondary">
              {t("pilotRequests.newRequestsWillAppear")}
            </Text>
          </Box>
        ) : (
          <Box
            bg="surface"
            borderRadius="xl"
            border="1px solid"
            borderColor="border"
            overflow="hidden"
          >
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row bg="bg.subtle">
                  <Table.ColumnHeader py={3} px={4} fontSize="xs" fontWeight="semibold" color="text.muted">
                    {t("pilotRequests.table.date")}
                  </Table.ColumnHeader>
                  <Table.ColumnHeader py={3} px={4} fontSize="xs" fontWeight="semibold" color="text.muted">
                    {t("pilotRequests.table.contact")}
                  </Table.ColumnHeader>
                  <Table.ColumnHeader py={3} px={4} fontSize="xs" fontWeight="semibold" color="text.muted">
                    {t("pilotRequests.table.company")}
                  </Table.ColumnHeader>
                  <Table.ColumnHeader py={3} px={4} fontSize="xs" fontWeight="semibold" color="text.muted">
                    {t("pilotRequests.table.roleToHire")}
                  </Table.ColumnHeader>
                  <Table.ColumnHeader py={3} px={4} fontSize="xs" fontWeight="semibold" color="text.muted">
                    {t("pilotRequests.table.status")}
                  </Table.ColumnHeader>
                  <Table.ColumnHeader py={3} px={4} fontSize="xs" fontWeight="semibold" color="text.muted" w="50px">
                  </Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {requests.map((request) => (
                  <Table.Row
                    key={request.id}
                    cursor="pointer"
                    transition="all 0.2s"
                    _hover={{ bg: "bg.subtle" }}
                    onClick={() => navigate(`/app/admin/pilot-requests/${request.id}`)}
                  >
                    <Table.Cell py={3} px={4}>
                      <Text fontSize="sm" color="text.muted">
                        {formatRelativeTime(request.created_at)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell py={3} px={4}>
                      <Box>
                        <Text fontSize="sm" fontWeight="medium" color="text">
                          {request.first_name} {request.last_name}
                        </Text>
                        <Text fontSize="xs" color="text.muted">
                          {request.email}
                        </Text>
                      </Box>
                    </Table.Cell>
                    <Table.Cell py={3} px={4}>
                      <Text fontSize="sm" color="text">
                        {request.company}
                      </Text>
                    </Table.Cell>
                    <Table.Cell py={3} px={4}>
                      <Text fontSize="sm" color="text.secondary">
                        {getTranslatedValue(t, "roleToHire", request.role_to_hire)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell py={3} px={4}>
                      <StatusBadge status={request.admin_status} t={t} />
                    </Table.Cell>
                    <Table.Cell py={3} px={4}>
                      <Box color="text.muted">
                        <ChevronRight size={16} />
                      </Box>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>

            {/* Pagination */}
            {total > 20 && (
              <Flex justify="space-between" align="center" px={4} py={3} borderTop="1px solid" borderColor="border">
                <Text fontSize="sm" color="text.muted">
                  {((page - 1) * 20) + 1}-{Math.min(page * 20, total)} {t("pilotRequests.pagination.of")} {total}
                </Text>
                <Flex gap={2}>
                  <Button
                    size="sm"
                    variant="outline"
                    borderColor="border"
                    disabled={page === 1}
                    onClick={() => setParam("page", String(page - 1))}
                  >
                    {t("pilotRequests.pagination.previous")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    borderColor="border"
                    disabled={page * 20 >= total}
                    onClick={() => setParam("page", String(page + 1))}
                  >
                    {t("pilotRequests.pagination.next")}
                  </Button>
                </Flex>
              </Flex>
            )}
          </Box>
        )}
      </Stack>
    </Box>
  );
}
