import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { Box, Flex, Stack, Text, Circle, Button, Avatar, Spinner, Menu, Portal } from "@chakra-ui/react";
import { Logo } from "~/components/ui/logo";
import { authMe, authLogout, getMyWorkSampleAttempt, type User } from "~/components/lib/api";

// Icons
function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function MessageSquareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <line x1="8" y1="6" x2="8" y2="6.01" />
      <line x1="12" y1="6" x2="12" y2="6.01" />
      <line x1="16" y1="6" x2="16" y2="6.01" />
      <line x1="8" y1="10" x2="8" y2="10.01" />
      <line x1="12" y1="10" x2="12" y2="10.01" />
      <line x1="16" y1="10" x2="16" y2="10.01" />
      <line x1="8" y1="14" x2="8" y2="14.01" />
      <line x1="12" y1="14" x2="12" y2="14.01" />
      <line x1="16" y1="14" x2="16" y2="14.01" />
    </svg>
  );
}

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

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [workSampleStatus, setWorkSampleStatus] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authMe();
        if (response?.user) {
          setUser(response.user);

          // Check if candidate needs onboarding (redirect to separate onboarding layout)
          const isCandidate = response.user.role === "candidate";
          const needsOnboarding = !response.user.onboarding_completed_at;

          if (isCandidate && needsOnboarding) {
            navigate("/app/onboarding");
            return;
          }

          // Load work sample status for candidate sidebar
          if (isCandidate) {
            try {
              const attemptRes = await getMyWorkSampleAttempt();
              setWorkSampleStatus(attemptRes.attempt.status);
            } catch {
              // No attempt yet
            }
          }
        } else {
          navigate("/fr/login");
        }
      } catch {
        navigate("/fr/login");
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    await authLogout();
    navigate("/fr/login");
  };

  const currentPath = location.pathname;
  const isCandidate = user?.role === "candidate";
  const isRecruiter = user?.role === "recruiter";
  const isAdminContext = currentPath.startsWith("/app/admin");
  const isAdmin = user?.role === "admin";

  // Role-based route protection
  const candidateOnlyPaths = ["/app/proof-profile", "/app/work-sample"];
  const recruiterPaths = ["/app/outcome-brief", "/app/scorecard", "/app/interview-kit", "/app/decision-memo", "/app/format-requests", "/app/jobs"];

  useEffect(() => {
    if (!user) return;

    const isCandidateRoute = candidateOnlyPaths.some(p => currentPath.startsWith(p));
    const isRecruiterRoute = recruiterPaths.some(p => currentPath.startsWith(p));

    if (isCandidate && (isRecruiterRoute || isAdminContext)) {
      navigate("/app/proof-profile");
    } else if ((isRecruiter || isAdmin) && isCandidateRoute) {
      navigate("/app/jobs");
    }
  }, [user, currentPath, navigate]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <Flex minH="100vh" bg="bg" align="center" justify="center">
        <Spinner size="xl" color="primary" />
      </Flex>
    );
  }

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
      icon: <UserIcon />,
    },
    {
      id: "work-sample",
      label: "Work Sample",
      path: "/app/work-sample",
      icon: <CodeIcon />,
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
                    <ShieldIcon />
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
                    <UsersIcon />
                  </Circle>
                  <Text fontSize="sm" fontWeight={currentPath.includes("admin/pilot-requests") ? "semibold" : "medium"} flex={1}>
                    Demandes de pilote
                  </Text>
                  {currentPath.includes("admin/pilot-requests") && (
                    <Box color="primary" opacity={0.7}>
                      <ChevronRightIcon />
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
                  <ArrowLeftIcon />
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
                          <ChevronRightIcon />
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
                    <BuildingIcon />
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
                    <BriefcaseIcon />
                  </Circle>
                  <Text fontSize="sm" fontWeight={currentPath.includes("/jobs") ? "semibold" : "medium"} flex={1}>
                    Mes postes
                  </Text>
                  {currentPath.includes("/jobs") && (
                    <Box color="primary" opacity={0.7}>
                      <ChevronRightIcon />
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
                    <MessageSquareIcon />
                  </Circle>
                  <Text fontSize="sm" fontWeight={currentPath.includes("format-requests") ? "semibold" : "medium"} flex={1}>
                    Formats alternatifs
                  </Text>
                  {currentPath.includes("format-requests") && (
                    <Box color="primary" opacity={0.7}>
                      <ChevronRightIcon />
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
                        <ShieldIcon />
                      </Circle>
                      <Text fontSize="sm" fontWeight={currentPath.includes("admin/pilot-requests") ? "semibold" : "medium"} flex={1}>
                        Demandes de pilote
                      </Text>
                      {currentPath.includes("admin/pilot-requests") && (
                        <Box color="primary" opacity={0.7}>
                          <ChevronRightIcon />
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
              <HelpIcon />
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
              <SettingsIcon />
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
              <BellIcon />
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
                        <SettingsIcon />
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
                        <LogoutIcon />
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
