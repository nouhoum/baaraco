import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Box,
  Heading,
  Text,
  Stack,
  Flex,
  Grid,
  Circle,
} from "@chakra-ui/react";
import { Users, ArrowRight, Inbox, UserCheck } from "lucide-react";
import { type PilotRequestStats } from "~/components/lib/api";
import { requireRole } from "~/components/lib/auth.server";
import { authenticatedFetch } from "~/components/lib/api.server";
import type { Route } from "./+types/_app.admin._index";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Admin Dashboard - Baara" }];
};

export async function loader({ request }: Route.LoaderArgs) {
  await requireRole(request, ["admin"]);

  // Load pilot request stats
  const res = await authenticatedFetch(
    request,
    "/api/v1/admin/pilot-requests?per_page=1",
  );
  let pilotStats: PilotRequestStats | null = null;
  if (res.ok) {
    const data = await res.json();
    pilotStats = data.stats || null;
  }

  return { pilotStats };
}

export default function AdminDashboard({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation("admin");
  const { t: tLayout } = useTranslation("app");
  const navigate = useNavigate();
  const { pilotStats } = loaderData;

  return (
    <Box py={8} px={8} maxW="1000px" mx="auto">
      <Stack gap={8}>
        {/* Header */}
        <Box>
          <Heading
            as="h1"
            fontSize="xl"
            color="text"
            mb={1}
            fontWeight="semibold"
          >
            {tLayout("layout.administration")}
          </Heading>
          <Text fontSize="sm" color="text.secondary">
            {t("dashboard.subtitle", {
              defaultValue: "Platform overview and management tools.",
            })}
          </Text>
        </Box>

        {/* Pilot Request Stats */}
        {pilotStats && (
          <Box>
            <Flex align="center" gap={2} mb={4}>
              <Circle size="28px" bg="primary.subtle" color="primary">
                <Users size={14} />
              </Circle>
              <Text fontSize="sm" fontWeight="semibold" color="text">
                {t("pilotRequests.title")}
              </Text>
            </Flex>
            <Grid
              templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }}
              gap={3}
            >
              <StatCard
                label={t("pilotRequests.stats.new", { defaultValue: "New" })}
                value={pilotStats.new}
                color="info"
              />
              <StatCard
                label={t("pilotRequests.stats.contacted", {
                  defaultValue: "Contacted",
                })}
                value={pilotStats.contacted}
                color="warning"
              />
              <StatCard
                label={t("pilotRequests.stats.inDiscussion", {
                  defaultValue: "In discussion",
                })}
                value={pilotStats.in_discussion}
                color="primary"
              />
              <StatCard
                label={t("pilotRequests.stats.converted", {
                  defaultValue: "Converted",
                })}
                value={pilotStats.converted}
                color="success"
              />
            </Grid>
          </Box>
        )}

        {/* Quick Actions */}
        <Box>
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color="text.muted"
            textTransform="uppercase"
            letterSpacing="wider"
            mb={4}
          >
            {t("dashboard.quickActions", { defaultValue: "Quick actions" })}
          </Text>
          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
            <ActionCard
              icon={<Inbox size={20} strokeWidth={1.5} />}
              title={t("pilotRequests.title")}
              subtitle={t("pilotRequests.subtitle")}
              badge={
                pilotStats
                  ? `${pilotStats.new} ${t("pilotRequests.stats.new", { defaultValue: "new" })}`
                  : undefined
              }
              onClick={() => navigate("/app/admin/pilot-requests")}
            />
            <ActionCard
              icon={<UserCheck size={20} strokeWidth={1.5} />}
              title={t("dashboard.conversions", {
                defaultValue: "Recent conversions",
              })}
              subtitle={t("dashboard.conversionsSubtitle", {
                defaultValue: "View converted pilot requests.",
              })}
              onClick={() =>
                navigate("/app/admin/pilot-requests?status=converted")
              }
            />
          </Grid>
        </Box>
      </Stack>
    </Box>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Box
      bg="surface"
      borderRadius="xl"
      border="1px solid"
      borderColor="border"
      p={4}
      textAlign="center"
    >
      <Text fontSize="2xl" fontWeight="bold" color={color} lineHeight={1}>
        {value}
      </Text>
      <Text fontSize="xs" color="text.muted" mt={1}>
        {label}
      </Text>
    </Box>
  );
}

function ActionCard({
  icon,
  title,
  subtitle,
  badge,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <Box
      bg="surface"
      borderRadius="xl"
      border="1px solid"
      borderColor="border"
      p={5}
      cursor="pointer"
      transition="all 0.2s"
      _hover={{ borderColor: "border.emphasis", shadow: "sm" }}
      onClick={onClick}
    >
      <Flex justify="space-between" align="start">
        <Flex gap={3} align="start">
          <Circle
            size="40px"
            bg="primary.subtle"
            color="primary"
            flexShrink={0}
          >
            {icon}
          </Circle>
          <Box>
            <Flex align="center" gap={2} mb={1}>
              <Text fontSize="sm" fontWeight="semibold" color="text">
                {title}
              </Text>
              {badge && (
                <Box
                  bg="info.subtle"
                  color="info"
                  fontSize="xs"
                  fontWeight="semibold"
                  px={2}
                  py={0.5}
                  borderRadius="full"
                >
                  {badge}
                </Box>
              )}
            </Flex>
            <Text fontSize="xs" color="text.secondary">
              {subtitle}
            </Text>
          </Box>
        </Flex>
        <Box color="text.muted" mt={1}>
          <ArrowRight size={16} />
        </Box>
      </Flex>
    </Box>
  );
}
