import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Heading,
  Text,
  Stack,
  Flex,
  Button,
  Input,
  Circle,
  Grid,
} from "@chakra-ui/react";
import type { MetaFunction } from "react-router";
import { useTranslation } from "react-i18next";
import { completeOnboarding, parseResume, type RoleType, type Experience } from "~/components/lib/api";
import { Textarea } from "@chakra-ui/react";
import { User, Code, Server, Activity, MoreHorizontal, Linkedin, Github, ArrowRight, FileText, Briefcase, MapPin, Upload } from "lucide-react";

export const meta: MetaFunction = () => {
  return [{ title: "Welcome - Baara" }];
};

interface RoleOption {
  id: RoleType;
  labelKey: string;
  descriptionKey: string;
  icon: React.ReactNode;
}

const roleOptions: RoleOption[] = [
  { id: "backend_go", labelKey: "backend_go", descriptionKey: "backend_go", icon: <Code size={20} /> },
  { id: "infra_platform", labelKey: "infra_platform", descriptionKey: "infra_platform", icon: <Server size={20} /> },
  { id: "sre", labelKey: "sre", descriptionKey: "sre", icon: <Activity size={20} /> },
  { id: "other", labelKey: "other", descriptionKey: "other", icon: <MoreHorizontal size={20} /> },
];

export default function Onboarding() {
  const { t } = useTranslation("app");
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [roleType, setRoleType] = useState<RoleType | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [bio, setBio] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [currentCompany, setCurrentCompany] = useState("");
  const [currentTitle, setCurrentTitle] = useState("");
  const [location, setLocation] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [resumeOriginalName, setResumeOriginalName] = useState("");
  const [parsedExperiences, setParsedExperiences] = useState<Experience[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseStatus, setParseStatus] = useState<"" | "parsing" | "parsed">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
      const presignRes = await fetch(`${API_URL}/api/v1/uploads/presign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          content_type: file.type,
          size: file.size,
          folder: "resumes",
        }),
      });
      if (!presignRes.ok) throw new Error("Upload failed");
      const { upload_url, object_key } = await presignRes.json();

      await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      // Extract the object URL (without query params)
      const objectUrl = upload_url.split("?")[0];
      setResumeUrl(objectUrl);
      setResumeOriginalName(file.name);
      setIsUploading(false);

      // Auto-parse CV
      if (object_key) {
        setIsParsing(true);
        setParseStatus("parsing");
        try {
          const parsed = await parseResume(object_key);
          // Pre-fill only empty fields
          if (parsed.name && !name) setName(parsed.name);
          if (parsed.bio && !bio) setBio(parsed.bio);
          if (parsed.current_title && !currentTitle) setCurrentTitle(parsed.current_title);
          if (parsed.current_company && !currentCompany) setCurrentCompany(parsed.current_company);
          if (parsed.years_of_experience != null && !yearsOfExperience) setYearsOfExperience(String(parsed.years_of_experience));
          if (parsed.location && !location) setLocation(parsed.location);
          if (parsed.linkedin_url && !linkedinUrl) setLinkedinUrl(parsed.linkedin_url);
          if (parsed.github_username && !githubUsername) setGithubUsername(parsed.github_username);
          if (parsed.experiences?.length) setParsedExperiences(parsed.experiences);
          setParseStatus("parsed");
        } catch {
          // Parsing failure is non-blocking
          setParseStatus("");
        } finally {
          setIsParsing(false);
        }
      }
    } catch {
      setError(t("onboarding.error"));
      setIsUploading(false);
      setIsParsing(false);
      setParseStatus("");
    }
  };

  const isValid = name.trim().length >= 2 && roleType !== null;

  const handleSubmit = async () => {
    if (!isValid || !roleType) return;

    setIsSubmitting(true);
    setError("");

    try {
      await completeOnboarding({
        name: name.trim(),
        role_type: roleType,
        linkedin_url: linkedinUrl.trim() || undefined,
        github_username: githubUsername.trim() || undefined,
        resume_url: resumeUrl || undefined,
        resume_original_name: resumeOriginalName || undefined,
        bio: bio.trim() || undefined,
        years_of_experience: yearsOfExperience ? parseInt(yearsOfExperience, 10) : undefined,
        current_company: currentCompany.trim() || undefined,
        current_title: currentTitle.trim() || undefined,
        location: location.trim() || undefined,
        experiences: parsedExperiences.length > 0 ? parsedExperiences : undefined,
      });

      navigate("/app/proof-profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("onboarding.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack gap={8}>
      {/* Header */}
      <Box textAlign="center">
        <Heading as="h1" fontSize="2xl" fontWeight="semibold" color="text" mb={3}>
          {t("onboarding.heading")}
        </Heading>
        <Text fontSize="md" color="text.secondary" maxW="400px" mx="auto">
          {t("onboarding.subtitle")}
        </Text>
      </Box>

      {/* Name field */}
      <Box>
        <Flex align="center" gap={2} mb={3}>
          <Circle size="32px" bg="primary.subtle">
            <Box color="primary">
              <User size={20} />
            </Box>
          </Circle>
          <Text fontSize="sm" fontWeight="semibold" color="text">
            {t("onboarding.nameLabel")}
          </Text>
        </Flex>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("onboarding.namePlaceholder")}
          size="lg"
          bg="surface"
          border="1px solid"
          borderColor="border"
          borderRadius="lg"
          _hover={{ borderColor: "border.emphasis" }}
          _focus={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
          _placeholder={{ color: "text.placeholder" }}
        />
      </Box>

      {/* Role type selection */}
      <Box>
        <Flex align="center" gap={2} mb={3}>
          <Circle size="32px" bg="info.subtle">
            <Box color="info">
              <Code size={20} />
            </Box>
          </Circle>
          <Text fontSize="sm" fontWeight="semibold" color="text">
            {t("onboarding.roleLabel")}
          </Text>
        </Flex>
        <Grid templateColumns={{ base: "1fr", sm: "1fr 1fr" }} gap={3}>
          {roleOptions.map((option) => (
            <Box
              key={option.id}
              as="button"
              {...{ type: "button" }}
              onClick={() => setRoleType(option.id)}
              bg={roleType === option.id ? "primary.subtle" : "surface"}
              border="2px solid"
              borderColor={roleType === option.id ? "primary" : "border"}
              borderRadius="xl"
              p={4}
              textAlign="left"
              cursor="pointer"
              transition="all 0.2s"
              _hover={{
                borderColor: roleType === option.id ? "primary" : "border.emphasis",
                bg: roleType === option.id ? "primary.subtle" : "bg.subtle",
              }}
            >
              <Flex align="start" gap={3}>
                <Circle
                  size="36px"
                  bg={roleType === option.id ? "primary" : "bg.emphasis"}
                  color={roleType === option.id ? "white" : "text.secondary"}
                  flexShrink={0}
                >
                  {option.icon}
                </Circle>
                <Box>
                  <Text
                    fontSize="sm"
                    fontWeight="semibold"
                    color={roleType === option.id ? "primary" : "text"}
                    mb={0.5}
                  >
                    {t(`onboarding.roles.${option.labelKey}.label`)}
                  </Text>
                  <Text fontSize="xs" color="text.secondary" lineHeight="1.4">
                    {t(`onboarding.roles.${option.descriptionKey}.description`)}
                  </Text>
                </Box>
              </Flex>
            </Box>
          ))}
        </Grid>
      </Box>

      {/* Optional fields */}
      <Box>
        <Text fontSize="xs" fontWeight="semibold" color="text.muted" textTransform="uppercase" letterSpacing="wider" mb={3}>
          {t("onboarding.optional")}
        </Text>
        <Stack gap={3}>
          <Flex
            align="center"
            gap={3}
            bg="surface"
            border="1px solid"
            borderColor="border"
            borderRadius="lg"
            px={4}
            py={2}
            _focusWithin={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
          >
            <Box color="text.secondary">
              <Linkedin size={18} />
            </Box>
            <Input
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder={t("onboarding.linkedinPlaceholder")}
              variant={"unstyled" as "outline"}
              size="md"
              _placeholder={{ color: "text.placeholder" }}
            />
          </Flex>
          <Flex
            align="center"
            gap={3}
            bg="surface"
            border="1px solid"
            borderColor="border"
            borderRadius="lg"
            px={4}
            py={2}
            _focusWithin={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
          >
            <Box color="text.secondary">
              <Github size={18} />
            </Box>
            <Input
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
              placeholder={t("onboarding.githubPlaceholder")}
              variant={"unstyled" as "outline"}
              size="md"
              _placeholder={{ color: "text.placeholder" }}
            />
          </Flex>

          {/* CV Upload */}
          <Box>
            <Flex
              align="center"
              gap={3}
              bg="surface"
              border="1px solid"
              borderColor={resumeOriginalName ? "success" : "border"}
              borderRadius="lg"
              px={4}
              py={2}
              cursor="pointer"
              transition="all 0.2s"
              _hover={{ borderColor: "border.emphasis" }}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".pdf";
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handleFileUpload(file);
                };
                input.click();
              }}
            >
              <Box color={resumeOriginalName ? "success" : "text.secondary"}>
                {resumeOriginalName ? <FileText size={18} /> : <Upload size={18} />}
              </Box>
              <Text
                fontSize="sm"
                color={resumeOriginalName ? "text" : "text.placeholder"}
                flex={1}
              >
                {isUploading
                  ? t("onboarding.cvUploading")
                  : isParsing
                    ? t("onboarding.cvParsing")
                    : resumeOriginalName
                      ? resumeOriginalName
                      : t("onboarding.cvUpload")}
              </Text>
            </Flex>
            <Text fontSize="xs" color="text.muted" mt={1} ml={1}>
              {t("onboarding.cvUploadHelper")}
            </Text>
            {parseStatus === "parsing" && (
              <Text fontSize="xs" color="info" mt={1} ml={1}>
                {t("onboarding.cvParsing")}
              </Text>
            )}
            {parseStatus === "parsed" && (
              <Text fontSize="xs" color="success" mt={1} ml={1}>
                {t("onboarding.cvParsed")}
              </Text>
            )}
          </Box>

          {/* Bio */}
          <Flex
            direction="column"
            gap={1}
            bg="surface"
            border="1px solid"
            borderColor="border"
            borderRadius="lg"
            px={4}
            py={2}
            _focusWithin={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
          >
            <Flex align="center" gap={2}>
              <Box color="text.secondary">
                <User size={18} />
              </Box>
              <Text fontSize="xs" color="text.muted">{t("onboarding.bioLabel")}</Text>
            </Flex>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t("onboarding.bioPlaceholder")}
              variant={"unstyled" as "outline"}
              size="sm"
              rows={2}
              resize="none"
              _placeholder={{ color: "text.placeholder" }}
            />
          </Flex>

          {/* Current title + company */}
          <Flex gap={3}>
            <Flex
              align="center"
              gap={3}
              bg="surface"
              border="1px solid"
              borderColor="border"
              borderRadius="lg"
              px={4}
              py={2}
              flex={1}
              _focusWithin={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
            >
              <Box color="text.secondary">
                <Briefcase size={18} />
              </Box>
              <Input
                value={currentTitle}
                onChange={(e) => setCurrentTitle(e.target.value)}
                placeholder={t("onboarding.titlePlaceholder")}
                variant={"unstyled" as "outline"}
                size="md"
                _placeholder={{ color: "text.placeholder" }}
              />
            </Flex>
            <Flex
              align="center"
              gap={3}
              bg="surface"
              border="1px solid"
              borderColor="border"
              borderRadius="lg"
              px={4}
              py={2}
              flex={1}
              _focusWithin={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
            >
              <Input
                value={currentCompany}
                onChange={(e) => setCurrentCompany(e.target.value)}
                placeholder={t("onboarding.companyPlaceholder")}
                variant={"unstyled" as "outline"}
                size="md"
                _placeholder={{ color: "text.placeholder" }}
              />
            </Flex>
          </Flex>

          {/* Experience + Location */}
          <Flex gap={3}>
            <Flex
              align="center"
              gap={3}
              bg="surface"
              border="1px solid"
              borderColor="border"
              borderRadius="lg"
              px={4}
              py={2}
              flex={1}
              _focusWithin={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
            >
              <Input
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(e.target.value.replace(/\D/g, ""))}
                placeholder={t("onboarding.experienceLabel")}
                variant={"unstyled" as "outline"}
                size="md"
                type="text"
                inputMode="numeric"
                _placeholder={{ color: "text.placeholder" }}
              />
            </Flex>
            <Flex
              align="center"
              gap={3}
              bg="surface"
              border="1px solid"
              borderColor="border"
              borderRadius="lg"
              px={4}
              py={2}
              flex={1}
              _focusWithin={{ borderColor: "primary", boxShadow: "0 0 0 1px var(--chakra-colors-primary)" }}
            >
              <Box color="text.secondary">
                <MapPin size={18} />
              </Box>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t("onboarding.locationPlaceholder")}
                variant={"unstyled" as "outline"}
                size="md"
                _placeholder={{ color: "text.placeholder" }}
              />
            </Flex>
          </Flex>
        </Stack>
      </Box>

      {/* Error message */}
      {error && (
        <Box bg="error.subtle" border="1px solid" borderColor="error.muted" borderRadius="lg" px={4} py={3}>
          <Text fontSize="sm" color="error">
            {error}
          </Text>
        </Box>
      )}

      {/* Submit button */}
      <Button
        onClick={handleSubmit}
        disabled={!isValid || isSubmitting}
        size="lg"
        bg="primary"
        color="white"
        shadow="button"
        _hover={{ bg: "primary.hover", transform: "translateY(-1px)", shadow: "buttonHover" }}
        _active={{ transform: "translateY(0)" }}
        _disabled={{ opacity: 0.5, cursor: "not-allowed", transform: "none" }}
        transition="all 0.2s"
        fontWeight="medium"
        h="52px"
        borderRadius="xl"
        w="100%"
      >
        <Flex align="center" gap={2}>
          <Text>{isSubmitting ? t("onboarding.submitting") : t("onboarding.submit")}</Text>
          {!isSubmitting && <ArrowRight size={18} />}
        </Flex>
      </Button>

      {/* Footer note */}
      <Text fontSize="xs" color="text.secondary" textAlign="center">
        {t("onboarding.footer")}
      </Text>
    </Stack>
  );
}
