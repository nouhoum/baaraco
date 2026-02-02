import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, User, Globe } from "lucide-react";
import {
  Box,
  Heading,
  Text,
  Stack,
  Flex,
  Button,
  Input,
  Circle,
} from "@chakra-ui/react";
import { useOutletContext } from "react-router";
import {
  updateProfile,
  type User as UserType,
  type RoleType,
} from "~/components/lib/api";
import {
  changeLanguage,
  supportedLanguages,
  type SupportedLanguage,
} from "~/i18n";
import type { Route } from "./+types/_app.settings";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Settings - Baara" }];
};

export default function Settings() {
  const { t } = useTranslation("app");
  const { user } = useOutletContext<{ user: UserType }>();

  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("i18nextLng");
      if (saved && supportedLanguages.includes(saved as SupportedLanguage)) {
        return saved as SupportedLanguage;
      }
    }
    return "fr";
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">(
    "idle",
  );

  const isCandidate = user?.role === "candidate";

  const roleTypeOptions: Record<RoleType, string> = {
    backend_go: t("onboarding.roles.backend_go.label"),
    infra_platform: t("onboarding.roles.infra_platform.label"),
    sre: t("onboarding.roles.sre.label"),
    other: t("onboarding.roles.other.label"),
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("idle");

    try {
      await updateProfile({ locale: selectedLang });
      changeLanguage(selectedLang);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box py={8} px={8} maxW="700px" mx="auto">
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
            {t("settings.heading")}
          </Heading>
          <Text fontSize="sm" color="text.secondary">
            {t("settings.subtitle")}
          </Text>
        </Box>

        {/* Account Section */}
        <Box
          bg="surface"
          borderRadius="xl"
          border="1px solid"
          borderColor="border"
          p={6}
          shadow="card"
        >
          <Flex align="center" gap={2} mb={5}>
            <Circle size="28px" bg="primary.subtle" color="primary">
              <User size={14} />
            </Circle>
            <Text fontSize="sm" fontWeight="semibold" color="text">
              {t("settings.profile.title")}
            </Text>
          </Flex>

          <Stack gap={4}>
            {/* Email (read-only) */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text" mb={1.5}>
                {t("settings.profile.email")}
              </Text>
              <Input
                value={user?.email || ""}
                readOnly
                bg="bg.subtle"
                border="1px solid"
                borderColor="border.subtle"
                borderRadius="lg"
                h="40px"
                fontSize="sm"
                color="text.muted"
                cursor="not-allowed"
              />
            </Box>

            {/* Role type (read-only for candidates) */}
            {isCandidate && user?.role_type && (
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="text" mb={1.5}>
                  {t("settings.profile.roleType")}
                </Text>
                <Input
                  value={roleTypeOptions[user.role_type] || user.role_type}
                  readOnly
                  bg="bg.subtle"
                  border="1px solid"
                  borderColor="border.subtle"
                  borderRadius="lg"
                  h="40px"
                  fontSize="sm"
                  color="text.muted"
                  cursor="not-allowed"
                />
              </Box>
            )}
          </Stack>
        </Box>

        {/* Language Section */}
        <Box
          bg="surface"
          borderRadius="xl"
          border="1px solid"
          borderColor="border"
          p={6}
          shadow="card"
        >
          <Flex align="center" gap={2} mb={1}>
            <Circle size="28px" bg="primary.subtle" color="primary">
              <Globe size={14} />
            </Circle>
            <Text fontSize="sm" fontWeight="semibold" color="text">
              {t("settings.language.title")}
            </Text>
          </Flex>
          <Text fontSize="xs" color="text.muted" mb={4} ml={10}>
            {t("settings.language.subtitle")}
          </Text>

          <Flex gap={3}>
            {supportedLanguages.map((lang) => (
              <Button
                key={lang}
                onClick={() => setSelectedLang(lang)}
                variant="outline"
                size="sm"
                px={4}
                py={2.5}
                h="auto"
                borderRadius="lg"
                borderColor={selectedLang === lang ? "primary" : "border"}
                bg={selectedLang === lang ? "primary.subtle" : "bg"}
                color={selectedLang === lang ? "primary" : "text.secondary"}
                _hover={{
                  borderColor:
                    selectedLang === lang ? "primary" : "border.emphasis",
                }}
                fontWeight={selectedLang === lang ? "semibold" : "medium"}
                fontSize="sm"
                flex={1}
              >
                <Flex align="center" gap={2} justify="center">
                  <Text>{lang === "fr" ? "🇫🇷" : "🇬🇧"}</Text>
                  <Text>{t(`settings.language.${lang}`)}</Text>
                  {selectedLang === lang && <Check size={14} strokeWidth={3} />}
                </Flex>
              </Button>
            ))}
          </Flex>
        </Box>

        {/* Save Button */}
        <Flex justify="space-between" align="center">
          {saveStatus === "saved" && (
            <Flex align="center" gap={2} color="success">
              <Check size={14} strokeWidth={3} />
              <Text fontSize="sm" fontWeight="medium">
                {t("settings.saved")}
              </Text>
            </Flex>
          )}
          {saveStatus === "error" && (
            <Text fontSize="sm" color="error" fontWeight="medium">
              {t("settings.error")}
            </Text>
          )}
          {saveStatus === "idle" && <Box />}

          <Button
            onClick={handleSave}
            disabled={isSaving}
            bg="primary"
            color="white"
            size="sm"
            px={6}
            fontWeight="semibold"
            borderRadius="lg"
            _hover={{ bg: "primary.hover" }}
          >
            {isSaving ? t("settings.saving") : t("settings.save")}
          </Button>
        </Flex>
      </Stack>
    </Box>
  );
}
