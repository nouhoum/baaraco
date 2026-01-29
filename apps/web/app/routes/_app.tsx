import { redirect } from "react-router";
import { Outlet, useLocation, useNavigate } from "react-router";
import { Box, Flex, Stack, Text, Circle, Button, Avatar, Menu, Portal } from "@chakra-ui/react";
import {
  ChevronRight,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  User,
  MessageSquare,
  Briefcase,
  Code,
  Users,
  Shield,
  ArrowLeft,
  Building,
} from "lucide-react";
import { Logo } from "~/components/ui/logo";
import { authLogout } from "~/components/lib/api";
import { requireUser } from "~/components/lib/auth.server";
import { authenticatedFetch } from "~/components/lib/api.server";
import type { Route } from "./+types/_app";

// Navigation items for candidates
interface CandidateNavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  status?: "todo" | "in_progress" | "completed";
}

const getRoleTypeLabel = (roleType?: string): string => {
  switch (roleType) {
    case "backend_go": return "Backend Go";
    case "infra_platform": return "Infrastructure";
    case "sre": return "SRE";
    default: return "Développeur";
  }
};

// --- Loader: auth + work sample status (SSR) ---
export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);

  // Redirect candidates who haven't completed onboarding
  if (user.role === "candidate" && !user.onboarding_completed_at) {
    throw redirect("/app/onboarding");
  }

  // Load work sample status for candidate sidebar
  let workSampleStatus: string | null = null;
  if (user.role === "candidate") {
    try {
      const res = await authenticatedFetch(request, "/api/v1/work-sample-attempts/me");
      if (res.ok) {
        const data = await res.json();
        workSampleStatus = data.attempt?.status ?? null;
      }
    } catch {
      // No attempt yet
    }
  }

  return { user, workSampleStatus };
}

export default function AppLayout({ loaderData }: Route.ComponentProps) {
  const { user, workSampleStatus } = loaderData;
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authLogout();
    navigate("/fr/login");
  };

  const currentPath = location.pathname;
  const isCandidate = user.role === "candidate";
  const isAdminContext = currentPath.startsWith("/app/admin");
  const isAdmin = user.role === "admin";

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
    if (!name) return "Candidat";
    const parts = name.split(" ");
    return parts[0];
  };

  // Candidate navigation items with dynamic status
  const candidateNavItems: CandidateNavItem[] = [
    {
      id: "proof-profile",
      label: "Mon Proof Profile",
      path: "/app/proof-profile",
      icon: <User size={18} strokeWidth={1.5} />,
    },
    {
      id: "work-sample",
      label: "Work Sample",
      path: "/app/work-sample",
      icon: <Code size={18} strokeWidth={1.5} />,
      status: workSampleStatus === "reviewed" || workSampleStatus === "submitted"
        ? "completed"
        : workSampleStatus === "in_progress"
          ? "in_progress"
          : "todo",
    },
  ];

  // Get current page label for breadcrumb
  const getCurrentPageLabel = (): string => {
    if (isAdminContext) {
      if (currentPath.includes("pilot-requests")) {
        const pathParts = currentPath.split("/");
        const lastPart = pathParts[pathParts.length - 1];
        if (lastPart !== "pilot-requests") {
          return "Détail";
        }
        return "Demandes de pilote";
      }
      return "Dashboard";
    }
    if (isCandidate) {
      const candidateItem = candidateNavItems.find(item => currentPath.includes(item.id));
      return candidateItem?.label || "Dashboard";
    }
    // Recruiter routes
    if (currentPath.includes("/jobs")) {
      return "Mes postes";
    }
    if (currentPath.includes("format-requests")) {
      return "Formats alternatifs";
    }
    return "Dashboard";
  };

  // Get breadcrumb prefix
  const getBreadcrumbPrefix = (): string => {
    if (isAdminContext) {
      return "Administration";
    }
    if (isCandidate) {
      return getFirstName(user?.name);
    }
    // Recruiter - show org name
    return user?.org?.name || "Recrutement";
  };

  return (
    <Flex minH="100vh" bg="bg">
      {/* Sidebar */}
      <Box
        w="280px"
        bg="surface"
        borderRight="1px solid"
        borderRightColor="border"
        position="fixed"
        h="100vh"
        display={{ base: "none", lg: "flex" }}
        flexDirection="column"
        shadow="sm"
      >
        {/* Logo */}
        <Flex
          h="64px"
          px={6}
          align="center"
          borderBottom="1px solid"
          borderBottomColor="border.subtle"
        >
          <Logo size="small" variant="light" />
        </Flex>

        {isAdminContext && isAdmin ? (
          /* Admin Sidebar */
          <>
            {/* Admin Context Card */}
            <Box px={5} py={5}>
              <Box
                bg="orange.subtle"
                borderRadius="xl"
                p={4}
                border="1px solid"
                borderColor="orange.muted"
              >
                <Flex align="center" gap={3}>
                  <Circle size="40px" bg="orange.500" color="white">
                    <Shield size={18} strokeWidth={1.5} />
                  </Circle>
                  <Box flex={1} minW={0}>
                    <Text fontSize="sm" fontWeight="semibold" color="text">
                      Administration
                    </Text>
                    <Text fontSize="xs" color="text.muted">
                      {user?.name || "Admin"}
                    </Text>
                  </Box>
                </Flex>
              </Box>
            </Box>

            {/* Admin Navigation */}
            <Box flex={1} py={2} px={4} overflowY="auto">
              <Text
                textStyle="label-sm"
                color="text.muted"
                px={3}
                mb={4}
              >
                Administration
              </Text>
              <Stack gap={1}>
                <Flex
                  align="center"
                  gap={3}
                  px={3}
                  py={2.5}
                  borderRadius="lg"
                  cursor="pointer"
                  transition="all 0.2s"
                  bg={currentPath.includes("admin/pilot-requests") ? "primary.subtle" : "transparent"}
                  color={currentPath.includes("admin/pilot-requests") ? "primary" : "text.secondary"}
                  border="1px solid"
                  borderColor={currentPath.includes("admin/pilot-requests") ? "primary.muted" : "transparent"}
                  _hover={{
                    bg: currentPath.includes("admin/pilot-requests") ? "primary.subtle" : "bg.subtle",
                    color: currentPath.includes("admin/pilot-requests") ? "primary" : "text",
                  }}
                  onClick={() => navigate("/app/admin/pilot-requests")}
                >
                  <Circle
                    size="28px"
                    bg={currentPath.includes("admin/pilot-requests") ? "primary" : "bg.muted"}
                    color={currentPath.includes("admin/pilot-requests") ? "white" : "text.muted"}
                    flexShrink={0}
                  >
                    <Users size={18} strokeWidth={1.5} />
                  </Circle>
                  <Text fontSize="sm" fontWeight={currentPath.includes("admin/pilot-requests") ? "semibold" : "medium"} flex={1}>
                    Demandes de pilote
                  </Text>
                  {currentPath.includes("admin/pilot-requests") && (
                    <Box color="primary" opacity={0.7}>
                      <ChevronRight size={14} strokeWidth={2} />
                    </Box>
                  )}
                </Flex>
              </Stack>

              {/* Back to app link */}
              <Box mt={8}>
                <Flex
                  align="center"
                  gap={3}
                  px={3}
                  py={2.5}
                  borderRadius="lg"
                  cursor="pointer"
                  transition="all 0.2s"
                  color="text.muted"
                  _hover={{ bg: "bg.subtle", color: "text" }}
                  onClick={() => navigate("/app/outcome-brief")}
                >
                  <ArrowLeft size={18} strokeWidth={1.5} />
                  <Text fontSize="sm" fontWeight="medium">Retour à l'application</Text>
                </Flex>
              </Box>
            </Box>
          </>
        ) : isCandidate ? (
          /* Candidate Sidebar */
          <>
            {/* User Profile Card */}
            <Box px={5} py={5}>
              <Box
                bg="primary.subtle"
                borderRadius="xl"
                p={4}
                border="1px solid"
                borderColor="primary.muted"
              >
                <Flex align="center" gap={3}>
                  <Avatar.Root size="md">
                    <Avatar.Fallback
                      bg="primary"
                      color="white"
                      fontSize="sm"
                      fontWeight="semibold"
                    >
                      {getInitials(user?.name, user?.email)}
                    </Avatar.Fallback>
                  </Avatar.Root>
                  <Box flex={1} minW={0}>
                    <Text fontSize="sm" fontWeight="semibold" color="text" truncate>
                      {user?.name || "Candidat"}
                    </Text>
                    <Text fontSize="xs" color="text.secondary">
                      {getRoleTypeLabel(user?.role_type)}
                    </Text>
                  </Box>
                </Flex>
              </Box>
            </Box>

            {/* Candidate Navigation */}
            <Box flex={1} py={2} px={4} overflowY="auto">
              <Text
                textStyle="label-sm"
                color="text.muted"
                px={3}
                mb={4}
              >
                Mon parcours
              </Text>
              <Stack gap={1}>
                {candidateNavItems.map((item) => {
                  const isActive = currentPath.includes(item.id);

                  return (
                    <Flex
                      key={item.id}
                      align="center"
                      gap={3}
                      px={3}
                      py={2.5}
                      borderRadius="lg"
                      cursor="pointer"
                      transition="all 0.2s"
                      bg={isActive ? "primary.subtle" : "transparent"}
                      color={isActive ? "primary" : "text.secondary"}
                      border="1px solid"
                      borderColor={isActive ? "primary.muted" : "transparent"}
                      _hover={{
                        bg: isActive ? "primary.subtle" : "bg.subtle",
                        color: isActive ? "primary" : "text",
                      }}
                      onClick={() => navigate(item.path)}
                    >
                      <Circle
                        size="32px"
                        bg={isActive ? "primary" : "bg.muted"}
                        color={isActive ? "white" : "text.muted"}
                        flexShrink={0}
                      >
                        {item.icon}
                      </Circle>

                      <Box flex={1}>
                        <Text fontSize="sm" fontWeight={isActive ? "semibold" : "medium"}>
                          {item.label}
                        </Text>
                        {item.status && (
                          <Text fontSize="xs" color={isActive ? "primary" : "text.muted"}>
                            {item.status === "todo" && "À faire"}
                            {item.status === "in_progress" && "En cours"}
                            {item.status === "completed" && "Terminé"}
                          </Text>
                        )}
                      </Box>

                      {isActive && (
                        <Box color="primary" opacity={0.7}>
                          <ChevronRight size={14} strokeWidth={2} />
                        </Box>
                      )}
                    </Flex>
                  );
                })}
              </Stack>
            </Box>
          </>
        ) : (
          /* Recruiter Sidebar */
          <>
            {/* Organization Card */}
            <Box px={5} py={5}>
              <Box
                bg="bg.subtle"
                borderRadius="xl"
                p={4}
                border="1px solid"
                borderColor="border.subtle"
              >
                <Flex align="center" gap={3}>
                  <Circle size="40px" bg="primary.subtle" border="1px solid" borderColor="primary.muted">
                    <Building size={18} strokeWidth={1.5} />
                  </Circle>
                  <Box flex={1} minW={0}>
                    <Text fontSize="sm" fontWeight="semibold" color="text" truncate>
                      {user?.org?.name || "Organisation"}
                    </Text>
                    <Text fontSize="xs" color="text.muted">
                      Recruteur
                    </Text>
                  </Box>
                </Flex>
              </Box>
            </Box>

            {/* Recruiter Navigation */}
            <Box flex={1} py={2} px={4} overflowY="auto">
              {/* Recrutement section */}
              <Text
                textStyle="label-sm"
                color="text.muted"
                px={3}
                mb={4}
              >
                Recrutement
              </Text>
              <Stack gap={1}>
                <Flex
                  align="center"
                  gap={3}
                  px={3}
                  py={2.5}
                  borderRadius="lg"
                  cursor="pointer"
                  transition="all 0.2s"
                  bg={currentPath.includes("/jobs") ? "primary.subtle" : "transparent"}
                  color={currentPath.includes("/jobs") ? "primary" : "text.secondary"}
                  border="1px solid"
                  borderColor={currentPath.includes("/jobs") ? "primary.muted" : "transparent"}
                  _hover={{
                    bg: currentPath.includes("/jobs") ? "primary.subtle" : "bg.subtle",
                    color: currentPath.includes("/jobs") ? "primary" : "text",
                  }}
                  onClick={() => navigate("/app/jobs")}
                >
                  <Circle
                    size="28px"
                    bg={currentPath.includes("/jobs") ? "primary" : "bg.muted"}
                    color={currentPath.includes("/jobs") ? "white" : "text.muted"}
                    flexShrink={0}
                  >
                    <Briefcase size={18} strokeWidth={1.5} />
                  </Circle>
                  <Text fontSize="sm" fontWeight={currentPath.includes("/jobs") ? "semibold" : "medium"} flex={1}>
                    Mes postes
                  </Text>
                  {currentPath.includes("/jobs") && (
                    <Box color="primary" opacity={0.7}>
                      <ChevronRight size={14} strokeWidth={2} />
                    </Box>
                  )}
                </Flex>
              </Stack>

              {/* Demandes section */}
              <Text
                textStyle="label-sm"
                color="text.muted"
                px={3}
                mb={3}
                mt={6}
              >
                Demandes
              </Text>
              <Stack gap={1}>
                <Flex
                  align="center"
                  gap={3}
                  px={3}
                  py={2.5}
                  borderRadius="lg"
                  cursor="pointer"
                  transition="all 0.2s"
                  bg={currentPath.includes("format-requests") ? "primary.subtle" : "transparent"}
                  color={currentPath.includes("format-requests") ? "primary" : "text.secondary"}
                  border="1px solid"
                  borderColor={currentPath.includes("format-requests") ? "primary.muted" : "transparent"}
                  _hover={{
                    bg: currentPath.includes("format-requests") ? "primary.subtle" : "bg.subtle",
                    color: currentPath.includes("format-requests") ? "primary" : "text",
                  }}
                  onClick={() => navigate("/app/format-requests")}
                >
                  <Circle
                    size="28px"
                    bg={currentPath.includes("format-requests") ? "primary" : "bg.muted"}
                    color={currentPath.includes("format-requests") ? "white" : "text.muted"}
                    flexShrink={0}
                  >
                    <MessageSquare size={18} strokeWidth={1.5} />
                  </Circle>
                  <Text fontSize="sm" fontWeight={currentPath.includes("format-requests") ? "semibold" : "medium"} flex={1}>
                    Formats alternatifs
                  </Text>
                  {currentPath.includes("format-requests") && (
                    <Box color="primary" opacity={0.7}>
                      <ChevronRight size={14} strokeWidth={2} />
                    </Box>
                  )}
                </Flex>
              </Stack>

              {/* Admin Section - Only for admins */}
              {user?.role === "admin" && (
                <>
                  <Text
                    textStyle="label-sm"
                    color="text.muted"
                    px={3}
                    mb={3}
                    mt={6}
                  >
                    Administration
                  </Text>
                  <Stack gap={1}>
                    <Flex
                      align="center"
                      gap={3}
                      px={3}
                      py={2.5}
                      borderRadius="lg"
                      cursor="pointer"
                      transition="all 0.2s"
                      bg={currentPath.includes("admin/pilot-requests") ? "primary.subtle" : "transparent"}
                      color={currentPath.includes("admin/pilot-requests") ? "primary" : "text.secondary"}
                      border="1px solid"
                      borderColor={currentPath.includes("admin/pilot-requests") ? "primary.muted" : "transparent"}
                      _hover={{
                        bg: currentPath.includes("admin/pilot-requests") ? "primary.subtle" : "bg.subtle",
                        color: currentPath.includes("admin/pilot-requests") ? "primary" : "text",
                      }}
                      onClick={() => navigate("/app/admin/pilot-requests")}
                    >
                      <Circle
                        size="28px"
                        bg={currentPath.includes("admin/pilot-requests") ? "primary" : "bg.muted"}
                        color={currentPath.includes("admin/pilot-requests") ? "white" : "text.muted"}
                        flexShrink={0}
                      >
                        <Shield size={18} strokeWidth={1.5} />
                      </Circle>
                      <Text fontSize="sm" fontWeight={currentPath.includes("admin/pilot-requests") ? "semibold" : "medium"} flex={1}>
                        Demandes de pilote
                      </Text>
                      {currentPath.includes("admin/pilot-requests") && (
                        <Box color="primary" opacity={0.7}>
                          <ChevronRight size={14} strokeWidth={2} />
                        </Box>
                      )}
                    </Flex>
                  </Stack>
                </>
              )}
            </Box>
          </>
        )}

        {/* Bottom section (same for both) */}
        <Box px={4} py={5} borderTop="1px solid" borderTopColor="border.subtle">
          <Stack gap={1}>
            <Flex
              align="center"
              gap={3}
              px={3}
              py={2.5}
              borderRadius="lg"
              cursor="pointer"
              transition="all 0.2s"
              color="text.muted"
              _hover={{ bg: "bg.subtle", color: "text" }}
            >
              <HelpCircle size={18} strokeWidth={1.5} />
              <Text fontSize="sm" fontWeight="medium">Aide & Support</Text>
            </Flex>
            <Flex
              align="center"
              gap={3}
              px={3}
              py={2.5}
              borderRadius="lg"
              cursor="pointer"
              transition="all 0.2s"
              color="text.muted"
              _hover={{ bg: "bg.subtle", color: "text" }}
            >
              <Settings size={18} strokeWidth={1.5} />
              <Text fontSize="sm" fontWeight="medium">Paramètres</Text>
            </Flex>
          </Stack>
        </Box>
      </Box>

      {/* Main content */}
      <Box flex={1} ml={{ base: 0, lg: "280px" }}>
        {/* Top header */}
        <Flex
          h="64px"
          bg="surface"
          borderBottom="1px solid"
          borderBottomColor="border"
          px={8}
          align="center"
          justify="space-between"
          position="sticky"
          top={0}
          zIndex={10}
          shadow="navbar"
        >
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

          {/* Actions */}
          <Flex align="center" gap={3}>
            <Button
              variant="ghost"
              size="sm"
              p={2}
              color="text.muted"
              _hover={{ color: "text", bg: "bg.subtle" }}
              borderRadius="lg"
            >
              <Bell size={18} strokeWidth={1.5} />
            </Button>

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
                        {user?.name || "Utilisateur"}
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
                    >
                      <Flex align="center" gap={2}>
                        <Settings size={18} strokeWidth={1.5} />
                        <Text fontSize="sm">Paramètres</Text>
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
                        <Text fontSize="sm">Déconnexion</Text>
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
