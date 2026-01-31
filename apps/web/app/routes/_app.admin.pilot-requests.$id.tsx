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
  Badge,
  Spinner,
  Textarea,
  Input,
  chakra,
} from "@chakra-ui/react";
import { ArrowLeft, User, Building2, Clipboard, MessageSquare } from "lucide-react";
import {
  getPilotRequest,
  updatePilotRequestStatus,
  addPilotRequestNote,
  convertPilotRequest,
  type PilotRequest,
  type AdminStatus,
} from "~/components/lib/api";
import { requireRole } from "~/components/lib/auth.server";
import { authenticatedFetch } from "~/components/lib/api.server";
import type { Route } from "./+types/_app.admin.pilot-requests.$id";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Request Detail - Admin - Baara" }];
};

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireRole(request, ["admin"]);
  const res = await authenticatedFetch(
    request,
    `/api/v1/admin/pilot-requests/${params.id}`,
  );
  if (!res.ok) {
    throw new Response("Not Found", { status: 404 });
  }
  const data = await res.json();
  return { request: data.request as PilotRequest };
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

// Info row component
function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <Flex justify="space-between" py={2} borderBottom="1px solid" borderColor="border">
      <Text fontSize="sm" color="text.muted">{label}</Text>
      <Text fontSize="sm" color="text" fontWeight="medium">{value || "-"}</Text>
    </Flex>
  );
}

// Section card
function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" overflow="hidden">
      <Flex align="center" gap={2} px={5} py={4} borderBottom="1px solid" borderColor="border" bg="bg.subtle">
        <Box color="text.muted">{icon}</Box>
        <Heading as="h3" fontSize="sm" fontWeight="semibold" color="text">{title}</Heading>
      </Flex>
      <Box p={5}>
        {children}
      </Box>
    </Box>
  );
}

// Helper to format name safely
function formatName(firstName?: string | null, lastName?: string | null): string {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "-";
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

export default function AdminPilotRequestDetail({
  loaderData,
  params,
}: Route.ComponentProps) {
  const { t, i18n } = useTranslation("admin");
  const id = params.id;
  const navigate = useNavigate();

  const [request, setRequest] = useState<PilotRequest>(loaderData.request);
  const [error, setError] = useState("");
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [sendInvite, setSendInvite] = useState(true);

  // Format date with locale
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language === "fr" ? "fr-FR" : "en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleStatusChange = async (newStatus: AdminStatus) => {
    if (!request || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await updatePilotRequestStatus(request.id, newStatus);
      setRequest(updated.request);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("pilotRequests.errors.updateError"));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddNote = async () => {
    if (!request || !newNote.trim() || isAddingNote) return;
    setIsAddingNote(true);
    try {
      const updated = await addPilotRequestNote(request.id, newNote.trim());
      setRequest(updated.request);
      setNewNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("pilotRequests.errors.addNoteError"));
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleConvert = async () => {
    if (!request || !id || isConverting) return;
    setIsConverting(true);
    try {
      await convertPilotRequest(request.id, { send_invitation: sendInvite });
      // Reload the request to get updated data
      const refreshed = await getPilotRequest(id);
      setRequest(refreshed.request);
      setShowConvertModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("pilotRequests.errors.convertError"));
    } finally {
      setIsConverting(false);
    }
  };

  // Status options config
  const statusOptions: { value: AdminStatus; labelKey: string }[] = [
    { value: "new", labelKey: "pilotRequests.status.new" },
    { value: "contacted", labelKey: "pilotRequests.status.contacted" },
    { value: "in_discussion", labelKey: "pilotRequests.status.inDiscussion" },
    { value: "converted", labelKey: "pilotRequests.status.converted" },
    { value: "rejected", labelKey: "pilotRequests.status.rejected" },
    { value: "archived", labelKey: "pilotRequests.status.archived" },
  ];

  return (
    <Box py={8} px={8} maxW="1000px" mx="auto">
      <Stack gap={8}>
        {/* Header */}
        <Box>
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            mb={4}
            onClick={() => navigate("/app/admin/pilot-requests")}
            color="text.secondary"
            _hover={{ bg: "bg.subtle" }}
            pl={0}
          >
            <Flex align="center" gap={2}>
              <ArrowLeft size={16} />
              {t("pilotRequests.backToList")}
            </Flex>
          </Button>

          {/* Title row */}
          <Flex justify="space-between" align="flex-start" flexWrap="wrap" gap={4}>
            <Box>
              <Flex align="center" gap={3} mb={1}>
                <Heading as="h1" fontSize="2xl" color="text" fontWeight="bold">
                  {formatName(request.first_name, request.last_name)}
                </Heading>
                <StatusBadge status={request.admin_status} t={t} />
              </Flex>
              <Text fontSize="md" color="text.muted">{request.company || "-"}</Text>
            </Box>

            {/* Actions */}
            <Flex gap={2} flexWrap="wrap">
              {request.admin_status !== "converted" && (
                <Button
                  size="sm"
                  bg="success"
                  color="white"
                  fontWeight="semibold"
                  _hover={{ bg: "success.hover" }}
                  onClick={() => setShowConvertModal(true)}
                >
                  {t("pilotRequests.detail.convertToRecruiter")}
                </Button>
              )}
              {request.email && (
                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  color="text.secondary"
                  _hover={{ bg: "bg.subtle" }}
                >
                  <a href={`mailto:${request.email}`}>
                    {t("pilotRequests.detail.sendEmail")}
                  </a>
                </Button>
              )}
            </Flex>
          </Flex>
        </Box>

        {/* Error */}
        {error && (
          <Box bg="error.subtle" borderRadius="lg" border="1px solid" borderColor="error.muted" px={4} py={3}>
            <Text fontSize="sm" color="error">{error}</Text>
          </Box>
        )}

        {/* Status change */}
        <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" p={5}>
          <Stack gap={3}>
            <Text fontSize="sm" fontWeight="medium" color="text">{t("pilotRequests.detail.changeStatus")}</Text>
            <Flex gap={1} flexWrap="wrap" bg="bg.subtle" p={1} borderRadius="lg">
              {statusOptions.map((option) => {
                const isActive = request.admin_status === option.value;
                return (
                  <Button
                    key={option.value}
                    size="sm"
                    variant="ghost"
                    bg={isActive ? "surface" : "transparent"}
                    color={isActive ? "text" : "text.muted"}
                    fontWeight={isActive ? "semibold" : "normal"}
                    borderRadius="md"
                    boxShadow={isActive ? "sm" : "none"}
                    onClick={() => handleStatusChange(option.value)}
                    disabled={isUpdatingStatus || isActive}
                    _hover={{
                      bg: isActive ? "surface" : "bg.muted",
                    }}
                    _disabled={{
                      opacity: isActive ? 1 : 0.5,
                      cursor: isActive ? "default" : "not-allowed",
                    }}
                  >
                    {t(option.labelKey)}
                  </Button>
                );
              })}
            </Flex>
          </Stack>
        </Box>

        {/* Grid layout */}
        <Flex gap={8} flexDir={{ base: "column", lg: "row" }}>
          {/* Left column */}
          <Stack flex={1} gap={6}>
            {/* Contact info */}
            <SectionCard title={t("pilotRequests.detail.contactInfo")} icon={<User size={20} strokeWidth={1.5} />}>
              <Stack gap={0}>
                <InfoRow label={t("pilotRequests.detail.fields.fullName")} value={formatName(request.first_name, request.last_name)} />
                <InfoRow label={t("pilotRequests.detail.fields.email")} value={request.email} />
                <InfoRow label={t("pilotRequests.detail.fields.company")} value={request.company} />
                <InfoRow label={t("pilotRequests.detail.fields.website")} value={request.website} />
                <InfoRow label={t("pilotRequests.detail.fields.createdAt")} value={formatDate(request.created_at)} />
                <InfoRow label={t("pilotRequests.detail.fields.completedAt")} value={formatDate(request.completed_at)} />
              </Stack>
            </SectionCard>

            {/* Hiring context */}
            <SectionCard title={t("pilotRequests.detail.hiringContext")} icon={<Building2 size={20} strokeWidth={1.5} />}>
              <Stack gap={0}>
                <InfoRow label={t("pilotRequests.detail.fields.roleToHire")} value={getTranslatedValue(t, "roleToHire", request.role_to_hire)} />
                <InfoRow label={t("pilotRequests.detail.fields.requesterRole")} value={getTranslatedValue(t, "requesterRole", request.role)} />
                <InfoRow label={t("pilotRequests.detail.fields.teamSize")} value={getTranslatedValue(t, "teamSize", request.team_size)} />
                <InfoRow label={t("pilotRequests.detail.fields.timeline")} value={getTranslatedValue(t, "timeline", request.hiring_timeline)} />
                <InfoRow label={t("pilotRequests.detail.fields.avgTimeToHire")} value={request.baseline_time_to_hire ? `${request.baseline_time_to_hire} ${t("pilotRequests.detail.fields.days")}` : undefined} />
                <InfoRow label={t("pilotRequests.detail.fields.avgInterviews")} value={request.baseline_interviews?.toString()} />
                {request.production_context && request.production_context.length > 0 && (
                  <Flex justify="space-between" py={2} borderBottom="1px solid" borderColor="border">
                    <Text fontSize="sm" color="text.muted">{t("pilotRequests.detail.fields.productionContext")}</Text>
                    <Flex gap={1.5} flexWrap="wrap" justify="flex-end" maxW="60%">
                      {request.production_context.map((ctx, i) => (
                        <Badge
                          key={i}
                          fontSize="xs"
                          bg="primary.subtle"
                          color="primary"
                          px={2}
                          py={0.5}
                          borderRadius="md"
                        >
                          {getTranslatedValue(t, "productionContext", ctx)}
                        </Badge>
                      ))}
                    </Flex>
                  </Flex>
                )}
                {request.job_link && (
                  <Flex justify="space-between" py={2} borderBottom="1px solid" borderColor="border">
                    <Text fontSize="sm" color="text.muted">{t("pilotRequests.detail.fields.jobLink")}</Text>
                    <chakra.a
                      href={request.job_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      fontSize="sm"
                      color="primary"
                      _hover={{ textDecoration: "underline" }}
                    >
                      {t("pilotRequests.detail.fields.viewJob")}
                    </chakra.a>
                  </Flex>
                )}
              </Stack>
            </SectionCard>

            {/* Message */}
            {request.message && (
              <SectionCard title={t("pilotRequests.detail.requesterMessage")} icon={<Clipboard size={20} strokeWidth={1.5} />}>
                <Text fontSize="sm" color="text" whiteSpace="pre-wrap">
                  {request.message}
                </Text>
              </SectionCard>
            )}

            {/* Pain point */}
            {request.baseline_pain_point && (
              <SectionCard title={t("pilotRequests.detail.mainPainPoint")} icon={<Clipboard size={20} strokeWidth={1.5} />}>
                <Text fontSize="sm" color="text" whiteSpace="pre-wrap">
                  {request.baseline_pain_point}
                </Text>
              </SectionCard>
            )}
          </Stack>

          {/* Right column - Notes */}
          <Box w={{ base: "100%", lg: "350px" }}>
            <SectionCard title={t("pilotRequests.detail.internalNotes")} icon={<MessageSquare size={16} strokeWidth={1.5} />}>
              <Stack gap={4}>
                {/* Add note form */}
                <Box>
                  <Textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder={t("pilotRequests.detail.notes.addPlaceholder")}
                    fontSize="sm"
                    borderColor="border"
                    _hover={{ borderColor: "border.emphasis" }}
                    _focus={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
                    rows={3}
                  />
                  <Button
                    size="sm"
                    mt={2}
                    w="full"
                    bg="primary"
                    color="white"
                    _hover={{ bg: "primary.hover" }}
                    onClick={handleAddNote}
                    disabled={!newNote.trim() || isAddingNote}
                  >
                    {isAddingNote ? <Spinner size="sm" /> : t("pilotRequests.detail.notes.add")}
                  </Button>
                </Box>

                {/* Notes list */}
                {request.notes && request.notes.length > 0 ? (
                  <Stack gap={3}>
                    {[...request.notes].reverse().map((note, index) => (
                      <Box
                        key={index}
                        bg="bg.subtle"
                        borderRadius="lg"
                        p={3}
                        border="1px solid"
                        borderColor="border"
                      >
                        <Text fontSize="sm" color="text" mb={2}>
                          {note.content}
                        </Text>
                        <Flex justify="space-between" align="center">
                          <Text fontSize="xs" color="text.muted">
                            {note.author_name || t("pilotRequests.detail.notes.admin")}
                          </Text>
                          <Text fontSize="xs" color="text.muted">
                            {formatDate(note.created_at)}
                          </Text>
                        </Flex>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Text fontSize="sm" color="text.muted" textAlign="center" py={4}>
                    {t("pilotRequests.detail.notes.noNotes")}
                  </Text>
                )}
              </Stack>
            </SectionCard>

            {/* Conversion info */}
            {request.admin_status === "converted" && request.converted_at && (
              <Box mt={6} bg="success.subtle" borderRadius="xl" border="1px solid" borderColor="success.muted" p={5}>
                <Heading as="h4" fontSize="sm" fontWeight="semibold" color="success" mb={2}>
                  {t("pilotRequests.detail.convertedToRecruiter")}
                </Heading>
                <Text fontSize="sm" color="text.secondary">
                  {t("pilotRequests.detail.onDate")} {formatDate(request.converted_at)}
                </Text>
              </Box>
            )}
          </Box>
        </Flex>
      </Stack>

      {/* Convert Modal */}
      {showConvertModal && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.600"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={1000}
          onClick={() => setShowConvertModal(false)}
        >
          <Box
            bg="surface"
            borderRadius="xl"
            border="1px solid"
            borderColor="border"
            p={6}
            maxW="450px"
            w="90%"
            onClick={(e) => e.stopPropagation()}
          >
            <Heading as="h3" fontSize="lg" fontWeight="semibold" color="text" mb={2}>
              {t("pilotRequests.detail.convert.title")}
            </Heading>
            <Text fontSize="sm" color="text.secondary" mb={6}>
              {t("pilotRequests.detail.convert.description", {
                name: formatName(request.first_name, request.last_name),
                email: request.email || "-"
              })}
            </Text>

            <Stack gap={4} mb={6}>
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="text" mb={1}>
                  {t("pilotRequests.detail.convert.organization")}
                </Text>
                <Input
                  value={request.company || "-"}
                  disabled
                  fontSize="sm"
                  bg="bg.subtle"
                  borderColor="border"
                />
              </Box>

              <Flex
                align="center"
                gap={3}
                p={3}
                bg="bg.subtle"
                borderRadius="lg"
                cursor="pointer"
                onClick={() => setSendInvite(!sendInvite)}
              >
                <Box
                  w="18px"
                  h="18px"
                  borderRadius="md"
                  border="2px solid"
                  borderColor={sendInvite ? "primary" : "border"}
                  bg={sendInvite ? "primary" : "transparent"}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  transition="all 0.2s"
                >
                  {sendInvite && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </Box>
                <Box flex={1}>
                  <Text fontSize="sm" fontWeight="medium" color="text">
                    {t("pilotRequests.detail.convert.sendInvite")}
                  </Text>
                  <Text fontSize="xs" color="text.muted">
                    {t("pilotRequests.detail.convert.sendInviteDescription")}
                  </Text>
                </Box>
              </Flex>
            </Stack>

            <Flex gap={3}>
              <Button
                flex={1}
                variant="outline"
                borderColor="border"
                color="text.secondary"
                onClick={() => setShowConvertModal(false)}
                _hover={{ bg: "bg.subtle" }}
              >
                {t("pilotRequests.detail.convert.cancel")}
              </Button>
              <Button
                flex={1}
                bg="success"
                color="white"
                _hover={{ bg: "success.hover" }}
                onClick={handleConvert}
                disabled={isConverting}
              >
                {isConverting ? <Spinner size="sm" /> : t("pilotRequests.detail.convert.confirm")}
              </Button>
            </Flex>
          </Box>
        </Box>
      )}
    </Box>
  );
}
