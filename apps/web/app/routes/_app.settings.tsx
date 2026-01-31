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

  const [name, setName] = useState(user?.name || "");
  const [linkedinUrl, setLinkedinUrl] = useState(user?.linkedin_url || "");
  const [githubUsername, setGithubUsername] = useState(
    user?.github_username || "",
  );
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

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("idle");

    try {
      await updateProfile({
        name: name || undefined,
        linkedin_url: linkedinUrl || undefined,
        github_username: githubUsername || undefined,
        locale: selectedLang,
      });

      // Apply language change immediately
      changeLanguage(selectedLang);

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  const isCandidate = user?.role === "candidate";

  const roleTypeOptions: Record<RoleType, string> = {
    backend_go: t("onboarding.roles.backend_go.label"),
    infra_platform: t("onboarding.roles.infra_platform.label"),
    sre: t("onboarding.roles.sre.label"),
    other: t("onboarding.roles.other.label"),
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

        {/* Profile Section */}
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
            {/* Name */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text" mb={1.5}>
                {t("settings.profile.name")}
              </Text>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("settings.profile.namePlaceholder")}
                bg="bg"
                border="1px solid"
                borderColor="border"
                borderRadius="lg"
                h="40px"
                fontSize="sm"
                _hover={{ borderColor: "border.emphasis" }}
                _focus={{
                  borderColor: "primary",
                  boxShadow: "0 0 0 1px var(--chakra-colors-primary)",
                }}
              />
            </Box>

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

            {/* LinkedIn */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text" mb={1.5}>
                {t("settings.profile.linkedin")}
              </Text>
              <Input
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder={t("settings.profile.linkedinPlaceholder")}
                bg="bg"
                border="1px solid"
                borderColor="border"
                borderRadius="lg"
                h="40px"
                fontSize="sm"
                _hover={{ borderColor: "border.emphasis" }}
                _focus={{
                  borderColor: "primary",
                  boxShadow: "0 0 0 1px var(--chakra-colors-primary)",
                }}
              />
            </Box>

            {/* GitHub */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text" mb={1.5}>
                {t("settings.profile.github")}
              </Text>
              <Input
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                placeholder={t("settings.profile.githubPlaceholder")}
                bg="bg"
                border="1px solid"
                borderColor="border"
                borderRadius="lg"
                h="40px"
                fontSize="sm"
                _hover={{ borderColor: "border.emphasis" }}
                _focus={{
                  borderColor: "primary",
                  boxShadow: "0 0 0 1px var(--chakra-colors-primary)",
                }}
              />
            </Box>
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
              <Flex
                key={lang}
                as="button"
                onClick={() => setSelectedLang(lang)}
                align="center"
                gap={2}
                px={4}
                py={2.5}
                borderRadius="lg"
                border="1px solid"
                borderColor={selectedLang === lang ? "primary" : "border"}
                bg={selectedLang === lang ? "primary.subtle" : "bg"}
                color={selectedLang === lang ? "primary" : "text.secondary"}
                cursor="pointer"
                transition="all 0.2s"
                _hover={{
                  borderColor:
                    selectedLang === lang ? "primary" : "border.emphasis",
                }}
                fontWeight={selectedLang === lang ? "semibold" : "medium"}
                fontSize="sm"
                flex={1}
                justify="center"
              >
                <Text>{lang === "fr" ? "🇫🇷" : "🇬🇧"}</Text>
                <Text>{t(`settings.language.${lang}`)}</Text>
                {selectedLang === lang && <Check size={14} strokeWidth={3} />}
              </Flex>
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
