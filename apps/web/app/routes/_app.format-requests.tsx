import { useState } from "react";
import { useSearchParams } from "react-router";
import { X, Check, Clock, User } from "lucide-react";
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
  Circle,
} from "@chakra-ui/react";
import {
  respondToFormatRequest,
  type FormatRequestDetail,
  type FormatRequestStatus,
} from "~/components/lib/api";
import { requireRole } from "~/components/lib/auth.server";
import { authenticatedFetch } from "~/components/lib/api.server";
import type { Route } from "./+types/_app.format-requests";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Demandes de format alternatif - Baara" }];
};

export async function loader({ request }: Route.LoaderArgs) {
  await requireRole(request, ["recruiter", "admin"]);
  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "pending";
  const apiStatus = status === "all" ? "" : status;
  const res = await authenticatedFetch(
    request,
    `/api/v1/format-requests${apiStatus ? `?status=${apiStatus}` : ""}`,
  );
  if (!res.ok) {
    return { format_requests: [] as FormatRequestDetail[], error: "Erreur lors du chargement" };
  }
  const data = await res.json();
  return {
    format_requests: (data.format_requests || []) as FormatRequestDetail[],
    error: null as string | null,
  };
}

// Helper functions
function getReasonLabel(reason: string): string {
  const labels: Record<string, string> = {
    oral: "Préfère l'oral",
    more_time: "Besoin de plus de temps",
    accessibility: "Accessibilité",
    other: "Autre",
  };
  return labels[reason] || reason;
}

function getFormatLabel(format: string): string {
  const labels: Record<string, string> = {
    video_call: "Appel vidéo",
    google_docs: "Google Docs",
    multi_step: "Questions multi-étapes",
    other: "Autre",
  };
  return labels[format] || format;
}

function getStatusBadge(status: FormatRequestStatus) {
  const configs: Record<FormatRequestStatus, { bg: string; color: string; label: string }> = {
    pending: { bg: "warning.subtle", color: "warning", label: "En attente" },
    approved: { bg: "success.subtle", color: "success", label: "Approuvé" },
    denied: { bg: "error.subtle", color: "error", label: "Refusé" },
  };
  const config = configs[status] || configs.pending;

  return (
    <Badge bg={config.bg} color={config.color} fontSize="xs" fontWeight="semibold" px={2} py={0.5} borderRadius="full">
      {config.label}
    </Badge>
  );
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "à l'instant";
  if (diffMins === 1) return "il y a 1 min";
  if (diffMins < 60) return `il y a ${diffMins} min`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return "il y a 1h";
  if (diffHours < 24) return `il y a ${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "hier";
  if (diffDays < 7) return `il y a ${diffDays}j`;

  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function getInitials(name?: string, email?: string): string {
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
}

// Pre-filled response messages
const APPROVED_MESSAGE = `Votre demande a été acceptée. Nous vous envoyons le Work Sample dans le format souhaité. Vous recevrez les instructions par email dans les prochaines 24h.`;
const DENIED_MESSAGE = `Nous ne sommes malheureusement pas en mesure de proposer ce format alternatif pour ce poste. Vous pouvez continuer avec le format standard. Si vous avez des questions, n'hésitez pas à nous contacter.`;

export default function FormatRequests({ loaderData }: Route.ComponentProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Data from loader
  const requests = loaderData.format_requests;
  const [error, setError] = useState(loaderData.error || "");
  const statusFilter = searchParams.get("status") || "pending";

  // Modal state
  const [selectedRequest, setSelectedRequest] = useState<FormatRequestDetail | null>(null);
  const [responseStatus, setResponseStatus] = useState<"approved" | "denied" | "">("");
  const [responseMessage, setResponseMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle response
  const handleRespond = async () => {
    if (!selectedRequest || !responseStatus) return;

    setIsSubmitting(true);
    setError("");

    try {
      await respondToFormatRequest(selectedRequest.id, {
        status: responseStatus,
        response_message: responseMessage,
      });

      // Close modal and trigger revalidation by navigating to same URL
      setSelectedRequest(null);
      setResponseStatus("");
      setResponseMessage("");
      // Force revalidation
      setSearchParams(searchParams, { preventScrollReset: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la réponse");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open modal
  const openModal = (request: FormatRequestDetail) => {
    setSelectedRequest(request);
    setResponseStatus("");
    setResponseMessage("");
  };

  // Update message when status changes
  const handleStatusChange = (status: "approved" | "denied") => {
    setResponseStatus(status);
    setResponseMessage(status === "approved" ? APPROVED_MESSAGE : DENIED_MESSAGE);
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <Box py={8} px={8} maxW="1200px" mx="auto">
      <Stack gap={6}>
        {/* Header */}
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
          <Box>
            <Heading as="h1" fontSize="xl" color="text" fontWeight="semibold" mb={1}>
              Demandes de format alternatif
            </Heading>
            <Text fontSize="sm" color="text.secondary">
              Gérez les demandes des candidats pour un format de Work Sample différent
            </Text>
          </Box>

          {pendingCount > 0 && (
            <Badge bg="warning.subtle" color="warning" fontSize="sm" fontWeight="semibold" px={3} py={1} borderRadius="full">
              {pendingCount} en attente
            </Badge>
          )}
        </Flex>

        {/* Filters */}
        <Flex gap={2}>
          {[
            { value: "pending", label: "En attente" },
            { value: "approved", label: "Approuvées" },
            { value: "denied", label: "Refusées" },
            { value: "all", label: "Toutes" },
          ].map((filter) => (
            <Button
              key={filter.value}
              size="sm"
              variant={statusFilter === filter.value ? "solid" : "outline"}
              bg={statusFilter === filter.value ? "primary" : "transparent"}
              color={statusFilter === filter.value ? "white" : "text.secondary"}
              borderColor="border"
              fontWeight="medium"
              _hover={{
                bg: statusFilter === filter.value ? "primary.hover" : "bg.subtle",
              }}
              onClick={() => setSearchParams({ status: filter.value }, { preventScrollReset: true })}
            >
              {filter.label}
            </Button>
          ))}
        </Flex>

        {/* Error */}
        {error && (
          <Box bg="error.subtle" borderRadius="lg" border="1px solid" borderColor="error.muted" px={4} py={3}>
            <Text fontSize="sm" color="error">{error}</Text>
          </Box>
        )}

        {/* Empty state */}
        {requests.length === 0 && (
          <Box bg="surface" borderRadius="xl" border="1px solid" borderColor="border" p={12} textAlign="center">
            <Circle size="64px" bg="bg.muted" mx="auto" mb={4}>
              <Box color="text.muted">
                <User size={18} />
              </Box>
            </Circle>
            <Text color="text.secondary" fontSize="sm">
              Aucune demande {statusFilter !== "all" ? getStatusBadge(statusFilter as FormatRequestStatus) : ""} pour le moment.
            </Text>
          </Box>
        )}

        {/* Request list */}
        {requests.length > 0 && (
          <Stack gap={3}>
            {requests.map((request) => (
              <Box
                key={request.id}
                bg="surface"
                borderRadius="xl"
                border="1px solid"
                borderColor="border"
                p={5}
                shadow="card"
                transition="all 0.2s"
                _hover={{ borderColor: "border.emphasis", shadow: "lg" }}
              >
                <Flex justify="space-between" align="start" gap={4}>
                  <Flex gap={4} align="start" flex={1}>
                    {/* Avatar */}
                    <Circle size="44px" bg="primary.subtle" color="primary" fontSize="sm" fontWeight="semibold" flexShrink={0}>
                      {getInitials(request.candidate?.name, request.candidate?.email)}
                    </Circle>

                    {/* Content */}
                    <Box flex={1}>
                      <Flex align="center" gap={2} mb={1}>
                        <Text fontSize="sm" fontWeight="semibold" color="text">
                          {request.candidate?.name || request.candidate?.email || "Candidat"}
                        </Text>
                        {getStatusBadge(request.status)}
                      </Flex>

                      <Flex gap={4} flexWrap="wrap" mb={2}>
                        <Text fontSize="xs" color="text.secondary">
                          <Text as="span" fontWeight="medium">Raison :</Text> {getReasonLabel(request.reason)}
                        </Text>
                        <Text fontSize="xs" color="text.secondary">
                          <Text as="span" fontWeight="medium">Format :</Text> {getFormatLabel(request.preferred_format)}
                        </Text>
                      </Flex>

                      {request.comment && (
                        <Box bg="bg.subtle" borderRadius="lg" p={3} mb={2}>
                          <Text fontSize="xs" color="text.secondary" lineHeight="1.5">
                            "{request.comment}"
                          </Text>
                        </Box>
                      )}

                      <Flex align="center" gap={2}>
                        <Clock size={16} />
                        <Text fontSize="xs" color="text.muted">
                          {formatRelativeTime(request.created_at)}
                        </Text>
                      </Flex>
                    </Box>
                  </Flex>

                  {/* Actions */}
                  {request.status === "pending" && (
                    <Button
                      size="sm"
                      bg="primary"
                      color="white"
                      fontWeight="medium"
                      _hover={{ bg: "primary.hover" }}
                      onClick={() => openModal(request)}
                    >
                      Répondre
                    </Button>
                  )}

                  {request.status !== "pending" && request.response_message && (
                    <Button
                      size="sm"
                      variant="outline"
                      borderColor="border"
                      color="text.secondary"
                      fontWeight="medium"
                      _hover={{ bg: "bg.subtle" }}
                      onClick={() => openModal(request)}
                    >
                      Voir
                    </Button>
                  )}
                </Flex>
              </Box>
            ))}
          </Stack>
        )}
      </Stack>

      {/* Response Modal */}
      {selectedRequest && (
        <Box
          position="fixed"
          inset={0}
          bg="blackAlpha.600"
          zIndex={100}
          display="flex"
          alignItems="center"
          justifyContent="center"
          onClick={() => setSelectedRequest(null)}
        >
          <Box
            bg="surface"
            borderRadius="2xl"
            shadow="2xl"
            maxW="550px"
            w="90%"
            maxH="90vh"
            overflow="auto"
            p={8}
            onClick={(e) => e.stopPropagation()}
          >
            <Flex justify="space-between" align="start" mb={6}>
              <Box>
                <Heading as="h3" fontSize="lg" fontWeight="semibold" color="text" mb={1}>
                  Demande de {selectedRequest.candidate?.name || "Candidat"}
                </Heading>
                <Text fontSize="sm" color="text.secondary">
                  Reçue {formatRelativeTime(selectedRequest.created_at)}
                </Text>
              </Box>
              <Button
                variant="ghost"
                size="sm"
                p={1}
                onClick={() => setSelectedRequest(null)}
                color="text.muted"
                _hover={{ bg: "bg.subtle" }}
              >
                <X size={18} />
              </Button>
            </Flex>

            <Stack gap={5}>
              {/* Request details */}
              <Box bg="bg.subtle" borderRadius="xl" p={5} border="1px solid" borderColor="border.subtle">
                <Stack gap={3}>
                  <Flex justify="space-between">
                    <Text fontSize="sm" color="text.muted">Raison</Text>
                    <Text fontSize="sm" fontWeight="medium" color="text">{getReasonLabel(selectedRequest.reason)}</Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text fontSize="sm" color="text.muted">Format souhaité</Text>
                    <Text fontSize="sm" fontWeight="medium" color="text">{getFormatLabel(selectedRequest.preferred_format)}</Text>
                  </Flex>
                  {selectedRequest.comment && (
                    <Box>
                      <Text fontSize="sm" color="text.muted" mb={1}>Commentaire</Text>
                      <Text fontSize="sm" color="text" lineHeight="1.6">
                        "{selectedRequest.comment}"
                      </Text>
                    </Box>
                  )}
                </Stack>
              </Box>

              {/* If already responded, show the response */}
              {selectedRequest.status !== "pending" && (
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                    Réponse envoyée
                  </Text>
                  <Box bg={selectedRequest.status === "approved" ? "success.subtle" : "error.subtle"} borderRadius="lg" p={4}>
                    <Flex align="center" gap={2} mb={2}>
                      {selectedRequest.status === "approved" ? (
                        <Circle size="20px" bg="success" color="white"><Check size={16} strokeWidth={2.5} /></Circle>
                      ) : (
                        <Circle size="20px" bg="error" color="white"><X size={16} strokeWidth={2.5} /></Circle>
                      )}
                      <Text fontSize="sm" fontWeight="semibold" color={selectedRequest.status === "approved" ? "success" : "error"}>
                        {selectedRequest.status === "approved" ? "Approuvée" : "Refusée"}
                      </Text>
                    </Flex>
                    {selectedRequest.response_message && (
                      <Text fontSize="sm" color="text.secondary" lineHeight="1.6">
                        {selectedRequest.response_message}
                      </Text>
                    )}
                  </Box>
                </Box>
              )}

              {/* Response form (only if pending) */}
              {selectedRequest.status === "pending" && (
                <>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="text" mb={3}>
                      Votre décision
                    </Text>
                    <Flex gap={3}>
                      <Button
                        flex={1}
                        size="md"
                        variant={responseStatus === "approved" ? "solid" : "outline"}
                        bg={responseStatus === "approved" ? "success" : "transparent"}
                        color={responseStatus === "approved" ? "white" : "text.secondary"}
                        borderColor={responseStatus === "approved" ? "success" : "border"}
                        fontWeight="medium"
                        _hover={{
                          bg: responseStatus === "approved" ? "success" : "success.subtle",
                          borderColor: "success",
                        }}
                        onClick={() => handleStatusChange("approved")}
                      >
                        <Flex align="center" gap={2}>
                          <Check size={16} strokeWidth={2.5} />
                          <Text>Approuver</Text>
                        </Flex>
                      </Button>
                      <Button
                        flex={1}
                        size="md"
                        variant={responseStatus === "denied" ? "solid" : "outline"}
                        bg={responseStatus === "denied" ? "error" : "transparent"}
                        color={responseStatus === "denied" ? "white" : "text.secondary"}
                        borderColor={responseStatus === "denied" ? "error" : "border"}
                        fontWeight="medium"
                        _hover={{
                          bg: responseStatus === "denied" ? "error" : "error.subtle",
                          borderColor: "error",
                        }}
                        onClick={() => handleStatusChange("denied")}
                      >
                        <Flex align="center" gap={2}>
                          <X size={16} strokeWidth={2.5} />
                          <Text>Refuser</Text>
                        </Flex>
                      </Button>
                    </Flex>
                  </Box>

                  {responseStatus && (
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                        Message au candidat
                      </Text>
                      <Textarea
                        value={responseMessage}
                        onChange={(e) => setResponseMessage(e.target.value)}
                        rows={4}
                        fontSize="sm"
                        borderColor="border"
                        _hover={{ borderColor: "border.emphasis" }}
                        _focus={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
                      />
                    </Box>
                  )}

                  <Flex gap={3} justify="flex-end" pt={2}>
                    <Button
                      variant="outline"
                      borderColor="border"
                      color="text.secondary"
                      onClick={() => setSelectedRequest(null)}
                      fontWeight="medium"
                    >
                      Annuler
                    </Button>
                    <Button
                      bg="primary"
                      color="white"
                      onClick={handleRespond}
                      disabled={isSubmitting || !responseStatus}
                      fontWeight="medium"
                      _hover={{ bg: "primary.hover" }}
                    >
                      {isSubmitting ? (
                        <Flex align="center" gap={2}>
                          <Spinner size="xs" />
                          <Text>Envoi...</Text>
                        </Flex>
                      ) : (
                        "Envoyer la réponse"
                      )}
                    </Button>
                  </Flex>
                </>
              )}
            </Stack>
          </Box>
        </Box>
      )}
    </Box>
  );
}
