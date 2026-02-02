import { redirect } from "react-router";
import { Outlet, useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Box, Flex, Text, Button, Avatar, Menu, Portal } from "@chakra-ui/react";
import {
  Settings,
  LogOut,
  Menu as MenuIcon,
} from "lucide-react";
import { authLogout } from "~/components/lib/api";
import { requireUser } from "~/components/lib/auth.server";
import { authenticatedFetch } from "~/components/lib/api.server";
import { AppSidebar } from "~/components/app-sidebar";
import { useSidebar } from "~/hooks/use-sidebar";
import type { Route } from "./+types/_app";

// --- Loader: auth + work sample status (SSR) ---
export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);

  // Redirect candidates who haven't completed onboarding
  if (user.role === "candidate" && !user.onboarding_completed_at) {
    throw redirect("/app/onboarding");
  }

  // Load work sample attempts for candidate sidebar
  let attempts: Array<{ attempt: { id: string; status: string; progress: number }; role_type: string; job_title?: string }> = [];
  if (user.role === "candidate") {
    try {
      const res = await authenticatedFetch(request, "/api/v1/work-sample-attempts/mine");
      if (res.ok) {
        const data = await res.json();
        attempts = data.attempts ?? [];
      }
    } catch {
      // No attempts yet
    }
  }

  // Load pending format requests count for recruiter sidebar
  let formatRequestCount = 0;
  if (user.role === "recruiter" || user.role === "admin") {
    try {
      const res = await authenticatedFetch(request, "/api/v1/format-requests/pending-count");
      if (res.ok) {
        const data = await res.json();
        formatRequestCount = data.pending_count ?? 0;
      }
    } catch {
      // Ignore errors
    }
  }

  return { user, attempts, formatRequestCount };
}

export default function AppLayout({ loaderData }: Route.ComponentProps) {
  const { user, attempts, formatRequestCount } = loaderData;
  const { t, i18n } = useTranslation("app");
  const location = useLocation();
  const navigate = useNavigate();
  const sidebar = useSidebar();

  const handleLogout = async () => {
    await authLogout();
    navigate(`/${i18n.language}/login`);
  };

  const currentPath = location.pathname;
  const isCandidate = user.role === "candidate";
  const isAdminContext = currentPath.startsWith("/app/admin");

  // Get user initials
  const getInitials = (name?: string, email?: string) => {
    if (name) {
      const parts = name.split(" ");
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return "??";
  };

  // Get first name from full name
  const getFirstName = (name?: string): string => {
    if (!name) return t("layout.candidate");
    const parts = name.split(" ");
    return parts[0];
  };

  // Get current page label for breadcrumb
  const getCurrentPageLabel = (): string => {
    if (isAdminContext) {
      if (currentPath.includes("pilot-requests")) {
        const pathParts = currentPath.split("/");
        const lastPart = pathParts[pathParts.length - 1];
        if (lastPart !== "pilot-requests") {
          return t("layout.detail");
        }
        return t("layout.pilotRequests");
      }
      return t("layout.dashboard");
    }
    if (isCandidate) {
      if (currentPath.includes("work-sample")) return t("layout.workSample");
      return t("layout.dashboard");
    }
    if (currentPath.includes("/jobs")) return t("layout.myJobs");
    if (currentPath.includes("format-requests")) return t("layout.alternativeFormats");
    return t("layout.dashboard");
  };

  // Get breadcrumb prefix
  const getBreadcrumbPrefix = (): string => {
    if (isAdminContext) return t("layout.breadcrumb.administration");
    if (isCandidate) return getFirstName(user?.name);
    return user?.org?.name || t("layout.breadcrumb.recruitment");
  };

  // Dynamic margin for sidebar width
  const sidebarWidth = sidebar.isDesktop
    ? sidebar.isCollapsed
      ? "64px"
      : "280px"
    : "0px";

  return (
    <Flex minH="100vh" bg="bg">
      {/* Sidebar */}
      <AppSidebar
        user={user}
        attempts={attempts}
        formatRequestCount={formatRequestCount}
        isCollapsed={sidebar.isCollapsed}
        toggleCollapsed={sidebar.toggleCollapsed}
        isMobileOpen={sidebar.isMobileOpen}
        closeMobile={sidebar.closeMobile}
        isDesktop={sidebar.isDesktop}
      />

      {/* Main content */}
      <Box
        flex={1}
        ml={sidebarWidth}
        transition="margin-left 0.2s ease-in-out"
      >
        {/* Top header */}
        <Flex
          h="64px"
          bg="surface"
          borderBottom="1px solid"
          borderBottomColor="border"
          px={{ base: 4, md: 8 }}
          align="center"
          justify="space-between"
          position="sticky"
          top={0}
          zIndex={10}
          shadow="navbar"
        >
          {/* Left side: hamburger (mobile) + breadcrumb */}
          <Flex align="center" gap={3}>
            {/* Hamburger menu for mobile */}
            {!sidebar.isDesktop && (
              <Button
                variant="ghost"
                size="sm"
                p={2}
                color="text.muted"
                _hover={{ color: "text", bg: "bg.subtle" }}
                borderRadius="lg"
                onClick={sidebar.openMobile}
              >
                <MenuIcon size={20} strokeWidth={1.5} />
              </Button>
            )}

            {/* Breadcrumb */}
            <Flex align="center" gap={2}>
              <Text fontSize="sm" color="text.muted" fontWeight="medium">
                {getBreadcrumbPrefix()}
              </Text>
              <Text color="text.placeholder" fontSize="sm">/</Text>
              <Text fontSize="sm" fontWeight="semibold" color="text">
                {getCurrentPageLabel()}
              </Text>
            </Flex>
          </Flex>

          {/* Actions */}
          <Flex align="center" gap={3}>
            {/* User menu */}
            <Menu.Root>
              <Menu.Trigger asChild>
                <Button variant="ghost" p={0} borderRadius="full" minW={0}>
                  <Avatar.Root size="sm">
                    <Avatar.Fallback
                      bg="primary"
                      color="white"
                      fontSize="xs"
                      fontWeight="semibold"
                    >
                      {getInitials(user?.name, user?.email)}
                    </Avatar.Fallback>
                  </Avatar.Root>
                </Button>
              </Menu.Trigger>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content
                    minW="200px"
                    bg="surface"
                    border="1px solid"
                    borderColor="border"
                    borderRadius="lg"
                    shadow="lg"
                    p={2}
                  >
                    <Box px={3} py={2} borderBottom="1px solid" borderColor="border.subtle" mb={2}>
                      <Text fontSize="sm" fontWeight="semibold" color="text">
                        {user?.name || t("layout.user")}
                      </Text>
                      <Text fontSize="xs" color="text.muted">
                        {user?.email}
                      </Text>
                    </Box>
                    <Menu.Item
                      value="settings"
                      px={3}
                      py={2}
                      borderRadius="md"
                      cursor="pointer"
                      _hover={{ bg: "bg.subtle" }}
                      onClick={() => navigate("/app/settings")}
                    >
                      <Flex align="center" gap={2}>
                        <Settings size={18} strokeWidth={1.5} />
                        <Text fontSize="sm">{t("layout.settings")}</Text>
                      </Flex>
                    </Menu.Item>
                    <Menu.Item
                      value="logout"
                      px={3}
                      py={2}
                      borderRadius="md"
                      cursor="pointer"
                      color="error"
                      _hover={{ bg: "error.subtle" }}
                      onClick={handleLogout}
                    >
                      <Flex align="center" gap={2}>
                        <LogOut size={16} strokeWidth={1.5} />
                        <Text fontSize="sm">{t("layout.logout")}</Text>
                      </Flex>
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>
          </Flex>
        </Flex>

        {/* Page content - Pass user data via context */}
        <Box bg="bg">
          <Outlet context={{ user }} />
        </Box>
      </Box>
    </Flex>
  );
}
