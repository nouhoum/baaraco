import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Box,
  Flex,
  Stack,
  Text,
  Circle,
  Avatar,
  Drawer,
  Portal,
} from "@chakra-ui/react";
import {
  ChevronRight,
  Settings,
  HelpCircle,
  User,
  Code,
  Briefcase,
  MessageSquare,
  Users,
  Shield,
  ArrowLeft,
  Building,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Logo } from "~/components/ui/logo";
import { Tooltip } from "~/components/ui/tooltip";
import { MotionBox } from "~/components/ui/motion";
import type { User as UserType } from "~/components/lib/api";

// ============================================================================
// Types
// ============================================================================

interface CandidateNavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  status?: "todo" | "in_progress" | "completed";
}

interface AppSidebarProps {
  user: UserType;
  workSampleStatus: string | null;
  isCollapsed: boolean;
  toggleCollapsed: () => void;
  isMobileOpen: boolean;
  closeMobile: () => void;
  isDesktop: boolean;
}

// ============================================================================
// Helpers
// ============================================================================

function getInitials(name?: string, email?: string) {
  if (name) {
    const parts = name.split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }
  if (email) return email.substring(0, 2).toUpperCase();
  return "??";
}

// ============================================================================
// NavItem component (handles collapsed state)
// ============================================================================

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  collapsed: boolean;
  onClick: () => void;
  subtitle?: string;
  iconSize?: string;
}

function NavItem({
  icon,
  label,
  isActive,
  collapsed,
  onClick,
  subtitle,
  iconSize = "28px",
}: NavItemProps) {
  const content = (
    <Flex
      align="center"
      gap={collapsed ? 0 : 3}
      px={collapsed ? 0 : 3}
      py={2.5}
      borderRadius="lg"
      cursor="pointer"
      transition="all 0.2s"
      justify={collapsed ? "center" : "flex-start"}
      bg={isActive ? "primary.subtle" : "transparent"}
      color={isActive ? "primary" : "text.secondary"}
      border="1px solid"
      borderColor={isActive ? "primary.muted" : "transparent"}
      _hover={{
        bg: isActive ? "primary.subtle" : "bg.subtle",
        color: isActive ? "primary" : "text",
      }}
      onClick={onClick}
    >
      <Circle
        size={iconSize}
        bg={isActive ? "primary" : "bg.muted"}
        color={isActive ? "white" : "text.muted"}
        flexShrink={0}
      >
        {icon}
      </Circle>

      {!collapsed && (
        <>
          <Box flex={1}>
            <Text
              fontSize="sm"
              fontWeight={isActive ? "semibold" : "medium"}
            >
              {label}
            </Text>
            {subtitle && (
              <Text
                fontSize="xs"
                color={isActive ? "primary" : "text.muted"}
              >
                {subtitle}
              </Text>
            )}
          </Box>
          {isActive && (
            <Box color="primary" opacity={0.7}>
              <ChevronRight size={14} strokeWidth={2} />
            </Box>
          )}
        </>
      )}
    </Flex>
  );

  if (collapsed) {
    return (
      <Tooltip content={label} positioning={{ placement: "right" }} openDelay={0} closeDelay={0}>
        {content}
      </Tooltip>
    );
  }

  return content;
}

// ============================================================================
// BottomNavItem (Help, Settings)
// ============================================================================

interface BottomNavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  collapsed: boolean;
  onClick?: () => void;
}

function BottomNavItem({
  icon,
  label,
  isActive,
  collapsed,
  onClick,
}: BottomNavItemProps) {
  const content = (
    <Flex
      align="center"
      gap={collapsed ? 0 : 3}
      px={collapsed ? 0 : 3}
      py={2.5}
      borderRadius="lg"
      cursor="pointer"
      transition="all 0.2s"
      justify={collapsed ? "center" : "flex-start"}
      bg={isActive ? "bg.subtle" : "transparent"}
      color={isActive ? "text" : "text.muted"}
      _hover={{ bg: "bg.subtle", color: "text" }}
      onClick={onClick}
    >
      {icon}
      {!collapsed && (
        <Text fontSize="sm" fontWeight="medium">
          {label}
        </Text>
      )}
    </Flex>
  );

  if (collapsed) {
    return (
      <Tooltip content={label} positioning={{ placement: "right" }} openDelay={0} closeDelay={0}>
        {content}
      </Tooltip>
    );
  }

  return content;
}

// ============================================================================
// SidebarContent — the shared content used in both desktop and mobile
// ============================================================================

function SidebarContent({
  user,
  workSampleStatus,
  collapsed,
  toggleCollapsed,
  showCollapseToggle,
}: {
  user: UserType;
  workSampleStatus: string | null;
  collapsed: boolean;
  toggleCollapsed: () => void;
  showCollapseToggle: boolean;
}) {
  const { t } = useTranslation("app");
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const isCandidate = user.role === "candidate";
  const isAdminContext = currentPath.startsWith("/app/admin");
  const isAdmin = user.role === "admin";

  const getRoleTypeLabel = (roleType?: string): string => {
    if (roleType)
      return t(`layout.roleType.${roleType}`, {
        defaultValue: t("layout.roleType.other"),
      });
    return t("layout.roleType.other");
  };

  const candidateNavItems: CandidateNavItem[] = [
    {
      id: "proof-profile",
      label: t("layout.myProofProfile"),
      path: "/app/proof-profile",
      icon: <User size={18} strokeWidth={1.5} />,
    },
    {
      id: "work-sample",
      label: "Work Sample",
      path: "/app/work-sample",
      icon: <Code size={18} strokeWidth={1.5} />,
      status:
        workSampleStatus === "reviewed" || workSampleStatus === "submitted"
          ? "completed"
          : workSampleStatus === "in_progress"
            ? "in_progress"
            : "todo",
    },
  ];

  return (
    <Flex direction="column" h="100%">
      {/* Brand accent */}
      <Box
        h="3px"
        bg="linear-gradient(90deg, #0F766E, #14B8A6, #5EEAD4)"
      />

      {/* Logo */}
      <Flex
        h="64px"
        px={collapsed ? 0 : 6}
        align="center"
        justify={collapsed ? "center" : "flex-start"}
        borderBottom="1px solid"
        borderBottomColor="border.subtle"
      >
        <Logo size="small" variant="light" iconOnly={collapsed} />
      </Flex>

      {isAdminContext && isAdmin ? (
        /* ============ Admin Sidebar ============ */
        <>
          {/* Admin Context Card */}
          {!collapsed && (
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
                      {t("layout.administration")}
                    </Text>
                    <Text fontSize="xs" color="text.muted">
                      {user?.name || "Admin"}
                    </Text>
                  </Box>
                </Flex>
              </Box>
            </Box>
          )}

          {/* Admin Navigation */}
          <Box flex={1} py={2} px={collapsed ? 2 : 4} overflowY="auto">
            {!collapsed && (
              <Text
                textStyle="label-sm"
                color="text.muted"
                px={3}
                mb={4}
              >
                {t("layout.administration")}
              </Text>
            )}
            <Stack gap={1}>
              <NavItem
                icon={<Users size={18} strokeWidth={1.5} />}
                label={t("layout.pilotRequests")}
                isActive={currentPath.includes("admin/pilot-requests")}
                collapsed={collapsed}
                onClick={() => navigate("/app/admin/pilot-requests")}
              />
            </Stack>

            {/* Back to app link */}
            <Box mt={8}>
              <Flex
                align="center"
                gap={collapsed ? 0 : 3}
                px={collapsed ? 0 : 3}
                py={2.5}
                borderRadius="lg"
                cursor="pointer"
                transition="all 0.2s"
                justify={collapsed ? "center" : "flex-start"}
                color="text.muted"
                _hover={{ bg: "bg.subtle", color: "text" }}
                onClick={() => navigate("/app/jobs")}
              >
                <ArrowLeft size={18} strokeWidth={1.5} />
                {!collapsed && (
                  <Text fontSize="sm" fontWeight="medium">
                    {t("layout.backToApp")}
                  </Text>
                )}
              </Flex>
            </Box>
          </Box>
        </>
      ) : isCandidate ? (
        /* ============ Candidate Sidebar ============ */
        <>
          {/* User Profile Card */}
          {!collapsed ? (
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
                    <Text
                      fontSize="sm"
                      fontWeight="semibold"
                      color="text"
                      truncate
                    >
                      {user?.name || t("layout.candidate")}
                    </Text>
                    <Text fontSize="xs" color="text.secondary">
                      {getRoleTypeLabel(user?.role_type)}
                    </Text>
                  </Box>
                </Flex>
              </Box>
            </Box>
          ) : (
            <Flex justify="center" py={4}>
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
            </Flex>
          )}

          {/* Candidate Navigation */}
          <Box flex={1} py={2} px={collapsed ? 2 : 4} overflowY="auto">
            {!collapsed && (
              <Text
                textStyle="label-sm"
                color="text.muted"
                px={3}
                mb={4}
              >
                {t("layout.myJourney")}
              </Text>
            )}
            <Stack gap={1}>
              {candidateNavItems.map((item) => {
                const isActive = currentPath.includes(item.id);
                return (
                  <NavItem
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    isActive={isActive}
                    collapsed={collapsed}
                    onClick={() => navigate(item.path)}
                    subtitle={
                      item.status
                        ? item.status === "todo"
                          ? t("layout.statusTodo")
                          : item.status === "in_progress"
                            ? t("layout.statusInProgress")
                            : t("layout.statusCompleted")
                        : undefined
                    }
                    iconSize="32px"
                  />
                );
              })}
            </Stack>
          </Box>
        </>
      ) : (
        /* ============ Recruiter Sidebar ============ */
        <>
          {/* Organization Card */}
          {!collapsed ? (
            <Box px={5} py={5}>
              <Box
                bg="bg.subtle"
                borderRadius="xl"
                p={4}
                border="1px solid"
                borderColor="border.subtle"
              >
                <Flex align="center" gap={3}>
                  <Circle
                    size="40px"
                    bg="primary.subtle"
                    border="1px solid"
                    borderColor="primary.muted"
                  >
                    <Building size={18} strokeWidth={1.5} />
                  </Circle>
                  <Box flex={1} minW={0}>
                    <Text
                      fontSize="sm"
                      fontWeight="semibold"
                      color="text"
                      truncate
                    >
                      {user?.org?.name || t("layout.organization")}
                    </Text>
                    <Text fontSize="xs" color="text.muted">
                      {t("layout.recruiter")}
                    </Text>
                  </Box>
                </Flex>
              </Box>
            </Box>
          ) : (
            <Flex justify="center" py={4}>
              <Tooltip
                content={user?.org?.name || t("layout.organization")}
                positioning={{ placement: "right" }}
                openDelay={0}
                closeDelay={0}
              >
                <Circle
                  size="36px"
                  bg="primary.subtle"
                  border="1px solid"
                  borderColor="primary.muted"
                >
                  <Building size={16} strokeWidth={1.5} />
                </Circle>
              </Tooltip>
            </Flex>
          )}

          {/* Recruiter Navigation */}
          <Box flex={1} py={2} px={collapsed ? 2 : 4} overflowY="auto">
            {/* Recruitment section */}
            {!collapsed && (
              <Text
                textStyle="label-sm"
                color="text.muted"
                px={3}
                mb={4}
              >
                {t("layout.recruitment")}
              </Text>
            )}
            <Stack gap={1}>
              <NavItem
                icon={<Briefcase size={18} strokeWidth={1.5} />}
                label={t("layout.myJobs")}
                isActive={currentPath.includes("/jobs")}
                collapsed={collapsed}
                onClick={() => navigate("/app/jobs")}
              />
            </Stack>

            {/* Requests section */}
            {!collapsed && (
              <Text
                textStyle="label-sm"
                color="text.muted"
                px={3}
                mb={3}
                mt={6}
              >
                {t("layout.requests")}
              </Text>
            )}
            {collapsed && <Box mt={4} />}
            <Stack gap={1}>
              <NavItem
                icon={<MessageSquare size={18} strokeWidth={1.5} />}
                label={t("layout.alternativeFormats")}
                isActive={currentPath.includes("format-requests")}
                collapsed={collapsed}
                onClick={() => navigate("/app/format-requests")}
              />
            </Stack>

            {/* Admin Section - Only for admins */}
            {user?.role === "admin" && (
              <>
                {!collapsed && (
                  <Text
                    textStyle="label-sm"
                    color="text.muted"
                    px={3}
                    mb={3}
                    mt={6}
                  >
                    {t("layout.administration")}
                  </Text>
                )}
                {collapsed && <Box mt={4} />}
                <Stack gap={1}>
                  <NavItem
                    icon={<Shield size={18} strokeWidth={1.5} />}
                    label={t("layout.pilotRequests")}
                    isActive={currentPath.includes("admin/pilot-requests")}
                    collapsed={collapsed}
                    onClick={() => navigate("/app/admin/pilot-requests")}
                  />
                </Stack>
              </>
            )}
          </Box>
        </>
      )}

      {/* Bottom section */}
      <Box
        px={collapsed ? 2 : 4}
        py={5}
        borderTop="1px solid"
        borderTopColor="border.subtle"
      >
        <Stack gap={1}>
          <BottomNavItem
            icon={<HelpCircle size={18} strokeWidth={1.5} />}
            label={t("layout.helpSupport")}
            collapsed={collapsed}
          />
          <BottomNavItem
            icon={<Settings size={18} strokeWidth={1.5} />}
            label={t("layout.settings")}
            isActive={currentPath.includes("/settings")}
            collapsed={collapsed}
            onClick={() => navigate("/app/settings")}
          />
        </Stack>

        {/* Collapse toggle (desktop only) */}
        {showCollapseToggle && (
          <Flex
            align="center"
            gap={collapsed ? 0 : 3}
            px={collapsed ? 0 : 3}
            py={2}
            mt={2}
            borderRadius="lg"
            cursor="pointer"
            transition="all 0.2s"
            justify="center"
            color="text.muted"
            _hover={{ bg: "bg.subtle", color: "text" }}
            onClick={toggleCollapsed}
          >
            {collapsed ? (
              <ChevronsRight size={16} strokeWidth={1.5} />
            ) : (
              <>
                <ChevronsLeft size={16} strokeWidth={1.5} />
                <Text fontSize="xs" fontWeight="medium" flex={1}>
                  {t("layout.collapse", { defaultValue: "Réduire" })}
                </Text>
              </>
            )}
          </Flex>
        )}
      </Box>
    </Flex>
  );
}

// ============================================================================
// AppSidebar — Main exported component
// ============================================================================

export function AppSidebar({
  user,
  workSampleStatus,
  isCollapsed,
  toggleCollapsed,
  isMobileOpen,
  closeMobile,
  isDesktop,
}: AppSidebarProps) {
  const location = useLocation();

  // Auto-close mobile drawer on route change
  useEffect(() => {
    closeMobile();
  }, [location.pathname, closeMobile]);

  return (
    <>
      {/* Desktop sidebar */}
      {isDesktop && (
        <MotionBox
          initial={false}
          animate={{ width: isCollapsed ? 64 : 280 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          bg="surface"
          borderRight="1px solid"
          borderRightColor="border"
          position="fixed"
          h="100vh"
          display="flex"
          flexDirection="column"
          shadow="sm"
          overflow="hidden"
          zIndex={20}
        >
          <SidebarContent
            user={user}
            workSampleStatus={workSampleStatus}
            collapsed={isCollapsed}
            toggleCollapsed={toggleCollapsed}
            showCollapseToggle={true}
          />
        </MotionBox>
      )}

      {/* Mobile drawer */}
      {!isDesktop && (
        <Drawer.Root
          open={isMobileOpen}
          onOpenChange={(details) => {
            if (!details.open) closeMobile();
          }}
          placement="start"
        >
          <Portal>
            <Drawer.Backdrop />
            <Drawer.Positioner>
              <Drawer.Content maxW="280px" bg="surface">
                <Drawer.Body p={0}>
                  <SidebarContent
                    user={user}
                    workSampleStatus={workSampleStatus}
                    collapsed={false}
                    toggleCollapsed={toggleCollapsed}
                    showCollapseToggle={false}
                  />
                </Drawer.Body>
              </Drawer.Content>
            </Drawer.Positioner>
          </Portal>
        </Drawer.Root>
      )}
    </>
  );
}
