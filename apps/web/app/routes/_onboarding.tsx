import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import { Box, Flex, Spinner } from "@chakra-ui/react";
import { Logo } from "~/components/ui/logo";
import { authMe } from "~/components/lib/api";

/**
 * Minimal layout for onboarding - no sidebar, no navigation
 * Just the logo and centered content for a focused experience
 */
export default function OnboardingLayout() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authMe();
        if (response?.user) {
          // If user has already completed onboarding, redirect to app
          if (response.user.onboarding_completed_at) {
            navigate("/app/work-sample");
            return;
          }
          // User needs onboarding, show the page
          setIsLoading(false);
        } else {
          // Not authenticated
          navigate("/fr/login");
        }
      } catch {
        navigate("/fr/login");
      }
    };
    checkAuth();
  }, [navigate]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <Flex minH="100vh" bg="bg" align="center" justify="center">
        <Spinner size="xl" color="primary" />
      </Flex>
    );
  }

  return (
    <Flex minH="100vh" bg="bg" direction="column">
      {/* Minimal header with logo only */}
      <Flex
        h="64px"
        px={6}
        align="center"
        justify="center"
        borderBottom="1px solid"
        borderBottomColor="border.subtle"
        bg="surface"
      >
        <Logo size="small" variant="light" />
      </Flex>

      {/* Centered content area */}
      <Flex flex={1} align="center" justify="center" py={8} px={4}>
        <Box w="100%" maxW="560px">
          <Outlet />
        </Box>
      </Flex>
    </Flex>
  );
}
