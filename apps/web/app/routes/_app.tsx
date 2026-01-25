import { Outlet, useLocation, useNavigate } from "react-router";
import { Box, Flex, Stack, Text, Circle, Button, Avatar } from "@chakra-ui/react";
import { Logo } from "~/components/ui/logo";

// Icons
function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
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

interface NavItem {
  id: string;
  label: string;
  path: string;
  step: number;
}

const navItems: NavItem[] = [
  { id: "outcome-brief", label: "Outcome Brief", path: "/app/outcome-brief", step: 1 },
  { id: "scorecard", label: "Scorecard", path: "/app/scorecard", step: 2 },
  { id: "work-sample", label: "Work Sample", path: "/app/work-sample", step: 3 },
  { id: "interview-kit", label: "Interview Kit", path: "/app/interview-kit", step: 4 },
  { id: "decision-memo", label: "Decision Memo", path: "/app/decision-memo", step: 5 },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = location.pathname;
  const currentIndex = navItems.findIndex(item => currentPath.includes(item.id));

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

        {/* Job Context Card */}
        <Box px={5} py={5}>
          <Box
            bg="bg.subtle"
            borderRadius="xl"
            p={4}
            cursor="pointer"
            transition="all 0.2s"
            border="1px solid"
            borderColor="border.subtle"
            shadow="xs"
            _hover={{ bg: "bg.muted", borderColor: "border", shadow: "sm" }}
          >
            <Flex align="center" gap={3}>
              <Circle size="40px" bg="primary.subtle" border="1px solid" borderColor="primary.muted">
                <Text fontSize="sm" fontWeight="semibold" color="primary">
                  SB
                </Text>
              </Circle>
              <Box flex={1} minW={0}>
                <Text fontSize="sm" fontWeight="semibold" color="text" truncate>
                  Senior Backend Engineer
                </Text>
                <Text fontSize="xs" color="text.muted">
                  Go · Infrastructure
                </Text>
              </Box>
            </Flex>
          </Box>
        </Box>

        {/* Navigation */}
        <Box flex={1} py={2} px={4} overflowY="auto">
          <Text
            textStyle="label-sm"
            color="text.subtle"
            px={3}
            mb={4}
          >
            Workflow
          </Text>
          <Stack gap={1}>
            {navItems.map((item, index) => {
              const isActive = currentPath.includes(item.id);
              const isCompleted = index < currentIndex;

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
                  color={isActive ? "primary" : isCompleted ? "text.secondary" : "text.muted"}
                  border="1px solid"
                  borderColor={isActive ? "primary.muted" : "transparent"}
                  _hover={{
                    bg: isActive ? "primary.subtle" : "bg.subtle",
                    color: isActive ? "primary" : "text",
                  }}
                  onClick={() => navigate(item.path)}
                  position="relative"
                >
                  {/* Connector line */}
                  {index < navItems.length - 1 && (
                    <Box
                      position="absolute"
                      left="21px"
                      top="100%"
                      w="2px"
                      h="8px"
                      bg={isCompleted ? "primary.muted" : "border"}
                      borderRadius="full"
                    />
                  )}

                  {/* Step indicator */}
                  <Circle
                    size="28px"
                    bg={isActive ? "primary" : isCompleted ? "success.muted" : "bg.muted"}
                    color={isActive ? "white" : isCompleted ? "success" : "text.subtle"}
                    fontSize="xs"
                    fontWeight="semibold"
                    flexShrink={0}
                    border={!isActive && !isCompleted ? "2px solid" : "none"}
                    borderColor="border.emphasis"
                  >
                    {isCompleted ? <CheckIcon /> : item.step}
                  </Circle>

                  <Text fontSize="sm" fontWeight={isActive ? "semibold" : "medium"} flex={1}>
                    {item.label}
                  </Text>

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

        {/* Bottom section */}
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
              <Text fontSize="sm" fontWeight="medium">Help & Support</Text>
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
              <Text fontSize="sm" fontWeight="medium">Settings</Text>
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
              Senior Backend Engineer
            </Text>
            <Text color="text.placeholder" fontSize="sm">/</Text>
            <Text fontSize="sm" fontWeight="semibold" color="text">
              {navItems.find(item => currentPath.includes(item.id))?.label || "Dashboard"}
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
            <Avatar.Root size="sm">
              <Avatar.Fallback
                bg="primary"
                color="white"
                fontSize="xs"
                fontWeight="semibold"
              >
                JD
              </Avatar.Fallback>
            </Avatar.Root>
          </Flex>
        </Flex>

        {/* Page content */}
        <Box bg="bg">
          <Outlet />
        </Box>
      </Box>
    </Flex>
  );
}
