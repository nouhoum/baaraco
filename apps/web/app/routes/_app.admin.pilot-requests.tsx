import { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Box,
  Heading,
  Text,
  Stack,
  Flex,
  Button,
  Badge,
  Spinner,
  Input,
  Table,
} from "@chakra-ui/react";
import type { MetaFunction } from "react-router";
import {
  listPilotRequests,
  type User,
  type PilotRequestListItem,
  type PilotRequestStats,
  type AdminStatus,
} from "~/components/lib/api";

export const meta: MetaFunction = () => {
  return [{ title: "Pilot Requests - Admin - Baara" }];
};

interface OutletContextType {
  user: User | null;
}

// Icons
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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

export default function AdminPilotRequests() {
  const { t, i18n } = useTranslation("admin");
  const navigate = useNavigate();
  const { user } = useOutletContext<OutletContextType>();

  const [requests, setRequests] = useState<PilotRequestListItem[]>([]);
  const [stats, setStats] = useState<PilotRequestStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<AdminStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

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

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/app/proof-profile");
    }
  }, [user, navigate]);

  // Load requests
  useEffect(() => {
    const loadRequests = async () => {
      setIsLoading(true);
      try {
        const response = await listPilotRequests({
          status: filter,
          search: search || undefined,
          page,
          per_page: 20,
        });
        setRequests(response.requests || []);
        setStats(response.stats);
        setTotal(response.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("pilotRequests.errors.loadError"));
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce search
    const timer = setTimeout(loadRequests, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [filter, search, page, t]);

  // Filter button config
  const filterButtons: { status: AdminStatus | "all"; labelKey: string }[] = [
    { status: "all", labelKey: "pilotRequests.filters.all" },
    { status: "new", labelKey: "pilotRequests.filters.new" },
    { status: "contacted", labelKey: "pilotRequests.filters.contacted" },
    { status: "in_discussion", labelKey: "pilotRequests.filters.inDiscussion" },
    { status: "converted", labelKey: "pilotRequests.filters.converted" },
    { status: "rejected", labelKey: "pilotRequests.filters.rejected" },
  ];

  if (isLoading && requests.length === 0) {
    return (
      <Flex minH="400px" align="center" justify="center">
        <Spinner size="lg" color="primary" />
      </Flex>
    );
  }

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
                onClick={() => { setFilter(status); setPage(1); }}
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
              <SearchIcon />
            </Box>
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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
              <UsersIcon />
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
                        <ChevronRightIcon />
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
                    onClick={() => setPage(page - 1)}
                  >
                    {t("pilotRequests.pagination.previous")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    borderColor="border"
                    disabled={page * 20 >= total}
                    onClick={() => setPage(page + 1)}
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
