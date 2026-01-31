import { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Box,
  Heading,
  Text,
  Stack,
  Flex,
  Button,
  Input,
  Badge,
  Spinner,
  Textarea,
} from "@chakra-ui/react";
import { ArrowLeft, Mail, Plus, X, Check } from "lucide-react";
import { createInvite } from "~/components/lib/api";
import { requireRole } from "~/components/lib/auth.server";
import type { Route } from "./+types/_app.jobs.invite";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Inviter des candidats - Baara" }];
};

export async function loader({ request }: Route.LoaderArgs) {
  await requireRole(request, ["recruiter", "admin"]);
  return {};
}

// Email validation
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Parse emails from input (comma, semicolon, newline, or space separated)
function parseEmails(input: string): string[] {
  return input
    .split(/[,;\n\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);
}

interface InviteResult {
  email: string;
  success: boolean;
  error?: string;
}

export default function JobInvite({ params }: Route.ComponentProps) {
  const navigate = useNavigate();
  const { t } = useTranslation("app");
  const jobId = params.id;

  // State
  const [emailInput, setEmailInput] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [results, setResults] = useState<InviteResult[]>([]);
  const [error, setError] = useState("");

  // Add emails from input
  const handleAddEmails = () => {
    const parsed = parseEmails(emailInput);
    const valid: string[] = [];
    const invalid: string[] = [];

    for (const email of parsed) {
      if (isValidEmail(email)) {
        if (!emails.includes(email)) {
          valid.push(email);
        }
      } else {
        invalid.push(email);
      }
    }

    if (invalid.length > 0) {
      setError(t("jobInvite.invalidEmails", { emails: invalid.join(", ") }));
    } else {
      setError("");
    }

    if (valid.length > 0) {
      setEmails((prev) => [...prev, ...valid]);
      setEmailInput("");
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddEmails();
    }
  };

  // Remove email
  const removeEmail = (email: string) => {
    setEmails((prev) => prev.filter((e) => e !== email));
  };

  // Send invitations
  const handleSend = async () => {
    if (!jobId || emails.length === 0) return;

    setIsSending(true);
    setError("");

    const settled = await Promise.allSettled(
      emails.map((email) =>
        createInvite({ email, role: "candidate", job_id: jobId }).then(
          () => ({ email, success: true as const }),
          (err) => ({ email, success: false as const, error: err instanceof Error ? err.message : t("jobInvite.error") })
        )
      )
    );

    const inviteResults: InviteResult[] = settled.map((s) =>
      s.status === "fulfilled" ? s.value : { email: "", success: false, error: t("jobInvite.error") }
    );

    setResults(inviteResults);
    setIsSending(false);

    // Clear sent emails
    const failedEmails = inviteResults
      .filter((r) => !r.success)
      .map((r) => r.email);
    setEmails(failedEmails);
  };

  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.filter((r) => !r.success).length;

  return (
    <Box py={8} px={8} maxW="700px" mx="auto">
      <Stack gap={6}>
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          color="text.secondary"
          alignSelf="flex-start"
          onClick={() => navigate(`/app/jobs/${jobId}/candidates`)}
          _hover={{ color: "text", bg: "bg.subtle" }}
        >
          <Flex align="center" gap={1.5}>
            <ArrowLeft size={18} />
            <Text>{t("jobInvite.backToCandidates")}</Text>
          </Flex>
        </Button>

        {/* Header */}
        <Box>
          <Flex align="center" gap={3} mb={1}>
            <Box color="primary">
              <Mail size={20} strokeWidth={1.5} />
            </Box>
            <Heading as="h1" fontSize="xl" color="text" fontWeight="semibold">
              {t("jobInvite.heading")}
            </Heading>
          </Flex>
          <Text fontSize="sm" color="text.secondary">
            {t("jobInvite.subtitle")}
          </Text>
        </Box>

        {/* Email input */}
        <Box
          bg="surface"
          border="1px solid"
          borderColor="border"
          borderRadius="xl"
          p={6}
        >
          <Stack gap={4}>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                {t("jobInvite.emailLabel")}
              </Text>
              <Flex gap={2}>
                <Input
                  placeholder={t("jobInvite.emailPlaceholder")}
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  border="1px solid"
                  borderColor="border"
                  borderRadius="lg"
                  bg="bg"
                  _focus={{
                    borderColor: "primary",
                    boxShadow: "0 0 0 1px var(--chakra-colors-primary)",
                  }}
                  flex={1}
                />
                <Button
                  bg="primary"
                  color="white"
                  onClick={handleAddEmails}
                  _hover={{ bg: "primary.hover" }}
                  disabled={!emailInput.trim()}
                >
                  <Flex align="center" gap={1.5}>
                    <Plus size={16} />
                    <Text>{t("jobInvite.add")}</Text>
                  </Flex>
                </Button>
              </Flex>
              <Text fontSize="xs" color="text.muted" mt={1.5}>
                {t("jobInvite.emailHelper")}
              </Text>
            </Box>

            {/* Email chips */}
            {emails.length > 0 && (
              <Box>
                <Text fontSize="xs" color="text.muted" mb={2}>
                  {t("jobInvite.candidateCount", { count: emails.length })}
                </Text>
                <Flex gap={2} flexWrap="wrap">
                  {emails.map((email) => (
                    <Badge
                      key={email}
                      bg="primary.subtle"
                      color="primary"
                      fontSize="sm"
                      px={3}
                      py={1}
                      borderRadius="full"
                      display="flex"
                      alignItems="center"
                      gap={1.5}
                    >
                      {email}
                      <Box
                        cursor="pointer"
                        onClick={() => removeEmail(email)}
                        _hover={{ opacity: 0.7 }}
                        ml={1}
                      >
                        <X size={14} />
                      </Box>
                    </Badge>
                  ))}
                </Flex>
              </Box>
            )}
          </Stack>
        </Box>

        {/* Error */}
        {error && (
          <Box
            bg="error.subtle"
            borderRadius="lg"
            border="1px solid"
            borderColor="error.muted"
            px={4}
            py={3}
          >
            <Text fontSize="sm" color="error">
              {error}
            </Text>
          </Box>
        )}

        {/* Results */}
        {results.length > 0 && (
          <Box
            bg="surface"
            border="1px solid"
            borderColor="border"
            borderRadius="xl"
            p={5}
          >
            <Stack gap={3}>
              <Heading as="h3" fontSize="md" fontWeight="semibold" color="text">
                {t("jobInvite.results")}
              </Heading>

              {successCount > 0 && (
                <Flex
                  align="center"
                  gap={2}
                  bg="success.subtle"
                  px={3}
                  py={2}
                  borderRadius="lg"
                >
                  <Box color="success">
                    <Check size={16} />
                  </Box>
                  <Text fontSize="sm" color="success" fontWeight="medium">
                    {t("jobInvite.invitationsSent", { count: successCount })}
                  </Text>
                </Flex>
              )}

              {failureCount > 0 && (
                <Box>
                  <Text fontSize="sm" color="error" fontWeight="medium" mb={2}>
                    {t("jobInvite.failureCount", { count: failureCount })}
                  </Text>
                  <Stack gap={1.5}>
                    {results
                      .filter((r) => !r.success)
                      .map((r) => (
                        <Flex
                          key={r.email}
                          align="center"
                          gap={2}
                          bg="error.subtle"
                          px={3}
                          py={2}
                          borderRadius="lg"
                          fontSize="sm"
                        >
                          <Text color="text" fontWeight="medium">
                            {r.email}
                          </Text>
                          <Text color="error">{r.error}</Text>
                        </Flex>
                      ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          </Box>
        )}

        {/* Send button */}
        <Flex justify="flex-end" gap={3}>
          <Button
            variant="outline"
            borderColor="border"
            color="text.secondary"
            onClick={() => navigate(`/app/jobs/${jobId}/candidates`)}
            _hover={{ bg: "bg.subtle" }}
          >
            {t("jobInvite.cancel")}
          </Button>
          <Button
            bg="primary"
            color="white"
            onClick={handleSend}
            disabled={emails.length === 0 || isSending}
            shadow="button"
            _hover={{ bg: "primary.hover" }}
          >
            {isSending ? (
              <Flex align="center" gap={2}>
                <Spinner size="sm" />
                <Text>{t("jobInvite.sending")}</Text>
              </Flex>
            ) : (
              <Flex align="center" gap={2}>
                <Mail size={20} strokeWidth={1.5} />
                <Text>
                  {emails.length > 0
                    ? t("jobInvite.sendButton", { count: emails.length })
                    : t("jobInvite.sendButtonEmpty")}
                </Text>
              </Flex>
            )}
          </Button>
        </Flex>
      </Stack>
    </Box>
  );
}
