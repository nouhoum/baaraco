import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  User,
  Briefcase,
  MapPin,
  FileText,
  Upload,
  X,
  Linkedin,
  Github,
  Check,
  Code,
  Server,
  Activity,
  MoreHorizontal,
  GraduationCap,
  Award,
  Globe,
  Settings,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Box,
  Heading,
  Text,
  Stack,
  Flex,
  Button,
  Input,
  Circle,
  Badge,
  Grid,
} from "@chakra-ui/react";
import { Textarea } from "@chakra-ui/react";
import { useOutletContext } from "react-router";
import {
  updateProfile,
  parseResume,
  type User as UserType,
  type RoleType,
  type Education,
  type Experience,
  type Certification,
  type Language,
  type Availability,
  type RemotePreference,
} from "~/components/lib/api";
import type { Route } from "./+types/_app.profile";

export const meta: Route.MetaFunction = () => {
  return [{ title: "My Profile - Baara" }];
};

// Reusable input style props
const inputProps = {
  bg: "bg" as const,
  border: "1px solid" as const,
  borderColor: "border" as const,
  borderRadius: "lg" as const,
  h: "40px",
  fontSize: "sm" as const,
  _hover: { borderColor: "border.emphasis" },
  _focus: {
    borderColor: "primary",
    boxShadow: "0 0 0 1px var(--chakra-colors-primary)",
  },
};

export default function Profile() {
  const { t } = useTranslation("app");
  const { user } = useOutletContext<{ user: UserType }>();

  // Identity
  const [name, setName] = useState(user?.name || "");
  const [roleType, setRoleType] = useState<RoleType | null>(
    user?.role_type || null,
  );
  const [bio, setBio] = useState(user?.bio || "");

  // Profile
  const [location, setLocation] = useState(user?.location || "");
  const [skills, setSkills] = useState<string[]>(user?.skills || []);
  const [skillInput, setSkillInput] = useState("");

  // Links & CV
  const [linkedinUrl, setLinkedinUrl] = useState(user?.linkedin_url || "");
  const [githubUsername, setGithubUsername] = useState(
    user?.github_username || "",
  );
  const [resumeUrl, setResumeUrl] = useState(user?.resume_url || "");
  const [resumeOriginalName, setResumeOriginalName] = useState(
    user?.resume_original_name || "",
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseStatus, setParseStatus] = useState<"idle" | "parsed" | "error">(
    "idle",
  );

  // Experiences
  const [experiences, setExperiences] = useState<Experience[]>(
    user?.experiences || [],
  );

  // Education
  const [education, setEducation] = useState<Education[]>(
    user?.education || [],
  );

  // Certifications
  const [certifications, setCertifications] = useState<Certification[]>(
    user?.certifications || [],
  );

  // Languages
  const [languages, setLanguages] = useState<Language[]>(
    user?.languages || [],
  );

  // Preferences
  const [websiteUrl, setWebsiteUrl] = useState(user?.website_url || "");
  const [availability, setAvailability] = useState<Availability | "">(
    user?.availability || "",
  );
  const [remotePreference, setRemotePreference] = useState<
    RemotePreference | ""
  >(user?.remote_preference || "");
  const [openToRelocation, setOpenToRelocation] = useState(
    user?.open_to_relocation || false,
  );

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">(
    "idle",
  );

  const roleTypeOptions: Record<RoleType, string> = {
    backend_go: t("onboarding.roles.backend_go.label"),
    infra_platform: t("onboarding.roles.infra_platform.label"),
    sre: t("onboarding.roles.sre.label"),
    other: t("onboarding.roles.other.label"),
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:8080";
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

      const objectUrl = upload_url.split("?")[0];
      setResumeUrl(objectUrl);
      setResumeOriginalName(file.name);

      // Auto-parse the CV
      setIsUploading(false);
      setIsParsing(true);
      setParseStatus("idle");
      try {
        const parsed = await parseResume(object_key);
        // Pre-fill empty fields only
        if (parsed.name && !name) setName(parsed.name);
        if (parsed.bio && !bio) setBio(parsed.bio);
        if (parsed.location && !location) setLocation(parsed.location);
        if (parsed.skills && parsed.skills.length > 0 && skills.length === 0)
          setSkills(parsed.skills);
        if (parsed.linkedin_url && !linkedinUrl)
          setLinkedinUrl(parsed.linkedin_url);
        if (parsed.github_username && !githubUsername)
          setGithubUsername(parsed.github_username);
        if (parsed.website_url && !websiteUrl)
          setWebsiteUrl(parsed.website_url);
        if (parsed.experiences && parsed.experiences.length > 0 && experiences.length === 0)
          setExperiences(parsed.experiences);
        if (parsed.education && parsed.education.length > 0 && education.length === 0)
          setEducation(parsed.education);
        if (parsed.certifications && parsed.certifications.length > 0 && certifications.length === 0)
          setCertifications(parsed.certifications);
        if (parsed.languages && parsed.languages.length > 0 && languages.length === 0)
          setLanguages(parsed.languages);
        setParseStatus("parsed");
        setTimeout(() => setParseStatus("idle"), 5000);
      } catch {
        setParseStatus("error");
      } finally {
        setIsParsing(false);
      }
    } catch {
      setSaveStatus("error");
      setIsUploading(false);
    }
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  // Experience helpers
  const addExperience = () => {
    setExperiences([
      ...experiences,
      { title: "", company: "" },
    ]);
  };
  const updateExperience = (index: number, field: keyof Experience, value: string | number) => {
    const updated = [...experiences];
    updated[index] = { ...updated[index], [field]: value };
    setExperiences(updated);
  };
  const removeExperience = (index: number) => {
    setExperiences(experiences.filter((_, i) => i !== index));
  };

  // Education helpers
  const addEducation = () => {
    setEducation([
      ...education,
      { institution: "", degree: "", field: "" },
    ]);
  };
  const updateEducation = (index: number, field: keyof Education, value: string | number) => {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: value };
    setEducation(updated);
  };
  const removeEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  // Certification helpers
  const addCertification = () => {
    setCertifications([...certifications, { name: "", issuer: "" }]);
  };
  const updateCertification = (index: number, field: keyof Certification, value: string | number) => {
    const updated = [...certifications];
    updated[index] = { ...updated[index], [field]: value };
    setCertifications(updated);
  };
  const removeCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  // Language helpers
  const addLanguage = () => {
    setLanguages([...languages, { language: "", level: "professional" }]);
  };
  const updateLanguage = (index: number, field: keyof Language, value: string) => {
    const updated = [...languages];
    updated[index] = { ...updated[index], [field]: value } as Language;
    setLanguages(updated);
  };
  const removeLanguage = (index: number) => {
    setLanguages(languages.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("idle");

    try {
      await updateProfile({
        name: name || undefined,
        role_type: roleType || undefined,
        linkedin_url: linkedinUrl || undefined,
        github_username: githubUsername || undefined,
        bio: bio || undefined,
        location: location || undefined,
        skills: skills.length > 0 ? skills : undefined,
        resume_url: resumeUrl || undefined,
        resume_original_name: resumeOriginalName || undefined,
        experiences: experiences.length > 0 ? experiences : undefined,
        education: education.length > 0 ? education : undefined,
        certifications: certifications.length > 0 ? certifications : undefined,
        languages: languages.length > 0 ? languages : undefined,
        website_url: websiteUrl || undefined,
        availability: availability || undefined,
        remote_preference: remotePreference || undefined,
        open_to_relocation: openToRelocation,
      });

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  const availabilityOptions: { value: Availability; label: string }[] = [
    { value: "immediate", label: t("profile.preferences.availabilityOptions.immediate") },
    { value: "1_month", label: t("profile.preferences.availabilityOptions.1_month") },
    { value: "3_months", label: t("profile.preferences.availabilityOptions.3_months") },
    { value: "6_months", label: t("profile.preferences.availabilityOptions.6_months") },
    { value: "not_looking", label: t("profile.preferences.availabilityOptions.not_looking") },
  ];

  const remoteOptions: { value: RemotePreference; label: string }[] = [
    { value: "remote", label: t("profile.preferences.remoteOptions.remote") },
    { value: "hybrid", label: t("profile.preferences.remoteOptions.hybrid") },
    { value: "onsite", label: t("profile.preferences.remoteOptions.onsite") },
  ];

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
            {t("profile.heading")}
          </Heading>
          <Text fontSize="sm" color="text.secondary">
            {t("profile.subtitle")}
          </Text>
        </Box>

        {/* Identity */}
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
              {t("profile.identity.title")}
            </Text>
          </Flex>

          <Stack gap={4}>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text" mb={1.5}>
                {t("profile.identity.name")}
              </Text>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("profile.identity.namePlaceholder")}
                {...inputProps}
              />
            </Box>

            {/* Role type */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text" mb={1.5}>
                {t("profile.identity.roleType")}
              </Text>
              <Grid templateColumns="1fr 1fr" gap={2}>
                {(
                  [
                    { id: "backend_go" as RoleType, icon: <Code size={16} /> },
                    { id: "infra_platform" as RoleType, icon: <Server size={16} /> },
                    { id: "sre" as RoleType, icon: <Activity size={16} /> },
                    { id: "other" as RoleType, icon: <MoreHorizontal size={16} /> },
                  ] as const
                ).map((option) => (
                  <Flex
                    key={option.id}
                    as="button"
                    {...{ type: "button" }}
                    onClick={() => setRoleType(option.id)}
                    align="center"
                    gap={2}
                    px={3}
                    py={2}
                    borderRadius="lg"
                    border="2px solid"
                    borderColor={roleType === option.id ? "primary" : "border"}
                    bg={roleType === option.id ? "primary.subtle" : "bg"}
                    cursor="pointer"
                    transition="all 0.2s"
                    _hover={{
                      borderColor:
                        roleType === option.id ? "primary" : "border.emphasis",
                    }}
                  >
                    <Circle
                      size="28px"
                      bg={roleType === option.id ? "primary" : "bg.emphasis"}
                      color={
                        roleType === option.id ? "white" : "text.secondary"
                      }
                    >
                      {option.icon}
                    </Circle>
                    <Text
                      fontSize="xs"
                      fontWeight="semibold"
                      color={roleType === option.id ? "primary" : "text"}
                    >
                      {roleTypeOptions[option.id]}
                    </Text>
                  </Flex>
                ))}
              </Grid>
            </Box>

            {/* Bio */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text" mb={1.5}>
                {t("profile.identity.bio")}
              </Text>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={t("profile.identity.bioPlaceholder")}
                bg="bg"
                border="1px solid"
                borderColor="border"
                borderRadius="lg"
                fontSize="sm"
                rows={3}
                resize="none"
                _hover={{ borderColor: "border.emphasis" }}
                _focus={{
                  borderColor: "primary",
                  boxShadow: "0 0 0 1px var(--chakra-colors-primary)",
                }}
              />
            </Box>

            {/* Location */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text" mb={1.5}>
                {t("profile.professional.location")}
              </Text>
              <Flex
                align="center"
                gap={2}
                bg="bg"
                border="1px solid"
                borderColor="border"
                borderRadius="lg"
                h="40px"
                px={3}
                _focusWithin={{
                  borderColor: "primary",
                  boxShadow: "0 0 0 1px var(--chakra-colors-primary)",
                }}
                _hover={{ borderColor: "border.emphasis" }}
              >
                <MapPin size={14} color="var(--chakra-colors-text-muted)" />
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t("profile.professional.locationPlaceholder")}
                  border="none"
                  h="full"
                  fontSize="sm"
                  px={0}
                  _focus={{ outline: "none", boxShadow: "none" }}
                />
              </Flex>
            </Box>

            {/* Skills */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text" mb={1.5}>
                {t("profile.professional.skills")}
              </Text>
              <Flex
                align="center"
                gap={2}
                bg="bg"
                border="1px solid"
                borderColor="border"
                borderRadius="lg"
                h="40px"
                px={3}
                _focusWithin={{
                  borderColor: "primary",
                  boxShadow: "0 0 0 1px var(--chakra-colors-primary)",
                }}
                _hover={{ borderColor: "border.emphasis" }}
              >
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  placeholder={t("profile.professional.skillsPlaceholder")}
                  border="none"
                  h="full"
                  fontSize="sm"
                  px={0}
                  _focus={{ outline: "none", boxShadow: "none" }}
                />
              </Flex>
              {skills.length > 0 && (
                <Flex gap={1.5} flexWrap="wrap" mt={2}>
                  {skills.map((skill) => (
                    <Badge
                      key={skill}
                      bg="primary.subtle"
                      color="primary"
                      fontSize="xs"
                      px={2}
                      py={0.5}
                      borderRadius="full"
                      display="flex"
                      alignItems="center"
                      gap={1}
                    >
                      {skill}
                      <Box
                        as="button"
                        onClick={() => removeSkill(skill)}
                        cursor="pointer"
                        lineHeight={1}
                        _hover={{ opacity: 0.7 }}
                      >
                        <X size={12} />
                      </Box>
                    </Badge>
                  ))}
                </Flex>
              )}
            </Box>
          </Stack>
        </Box>

        {/* Professional Experience */}
        <Box
          bg="surface"
          borderRadius="xl"
          border="1px solid"
          borderColor="border"
          p={6}
          shadow="card"
        >
          <Flex align="center" justify="space-between" mb={5}>
            <Flex align="center" gap={2}>
              <Circle size="28px" bg="info.subtle" color="info">
                <Briefcase size={14} />
              </Circle>
              <Text fontSize="sm" fontWeight="semibold" color="text">
                {t("profile.experiences.title")}
              </Text>
            </Flex>
            <Button
              size="xs"
              variant="ghost"
              color="primary"
              onClick={addExperience}
              fontSize="xs"
            >
              <Plus size={14} />
              {t("profile.experiences.add")}
            </Button>
          </Flex>

          <Stack gap={4}>
            {experiences.map((exp, index) => (
              <Box
                key={index}
                bg="bg"
                borderRadius="lg"
                border="1px solid"
                borderColor="border"
                p={4}
              >
                <Flex justify="flex-end" mb={2}>
                  <Box
                    as="button"
                    onClick={() => removeExperience(index)}
                    color="text.muted"
                    cursor="pointer"
                    _hover={{ color: "error" }}
                  >
                    <Trash2 size={14} />
                  </Box>
                </Flex>
                <Stack gap={3}>
                  <Flex gap={3}>
                    <Box flex={1}>
                      <Text fontSize="sm" fontWeight="medium" color="text" mb={1.5}>
                        {t("profile.experiences.titleLabel")}
                      </Text>
                      <Input
                        value={exp.title}
                        onChange={(e) =>
                          updateExperience(index, "title", e.target.value)
                        }
                        placeholder={t("profile.experiences.titlePlaceholder")}
                        {...inputProps}
                      />
                    </Box>
                    <Box flex={1}>
                      <Text fontSize="sm" fontWeight="medium" color="text" mb={1.5}>
                        {t("profile.experiences.company")}
                      </Text>
                      <Input
                        value={exp.company}
                        onChange={(e) =>
                          updateExperience(index, "company", e.target.value)
                        }
                        placeholder={t("profile.experiences.companyPlaceholder")}
                        {...inputProps}
                      />
                    </Box>
                  </Flex>
                  <Flex gap={3}>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="text" mb={1.5}>
                        {t("profile.experiences.startYear")}
                      </Text>
                      <Input
                        w="100px"
                        value={exp.start_year || ""}
                        onChange={(e) =>
                          updateExperience(
                            index,
                            "start_year",
                            parseInt(e.target.value.replace(/\D/g, "")) || 0,
                          )
                        }
                        placeholder={t("profile.experiences.startYear")}
                        inputMode="numeric"
                        {...inputProps}
                      />
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="text" mb={1.5}>
                        {t("profile.experiences.endYear")}
                      </Text>
                      <Input
                        w="100px"
                        value={exp.end_year || ""}
                        onChange={(e) =>
                          updateExperience(
                            index,
                            "end_year",
                            parseInt(e.target.value.replace(/\D/g, "")) || 0,
                          )
                        }
                        placeholder={t("profile.experiences.endYear")}
                        inputMode="numeric"
                        {...inputProps}
                      />
                    </Box>
                  </Flex>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="text" mb={1.5}>
                      {t("profile.experiences.description")}
                    </Text>
                    <Textarea
                      value={exp.description || ""}
                      onChange={(e) =>
                        updateExperience(index, "description", e.target.value)
                      }
                      placeholder={t("profile.experiences.descriptionPlaceholder")}
                      bg="bg"
                      border="1px solid"
                      borderColor="border"
                      borderRadius="lg"
                      fontSize="sm"
                      rows={2}
                      resize="none"
                      _hover={{ borderColor: "border.emphasis" }}
                      _focus={{
                        borderColor: "primary",
                        boxShadow: "0 0 0 1px var(--chakra-colors-primary)",
                      }}
                    />
                  </Box>
                </Stack>
              </Box>
            ))}
            {experiences.length === 0 && (
              <Text fontSize="sm" color="text.muted" textAlign="center" py={2}>
                {t("profile.experiences.add")}
              </Text>
            )}
          </Stack>
        </Box>

        {/* Education */}
        <Box
          bg="surface"
          borderRadius="xl"
          border="1px solid"
          borderColor="border"
          p={6}
          shadow="card"
        >
          <Flex align="center" justify="space-between" mb={5}>
            <Flex align="center" gap={2}>
              <Circle size="28px" bg="warning.subtle" color="warning">
                <GraduationCap size={14} />
              </Circle>
              <Text fontSize="sm" fontWeight="semibold" color="text">
                {t("profile.education.title")}
              </Text>
            </Flex>
            <Button
              size="xs"
              variant="ghost"
              color="primary"
              onClick={addEducation}
              fontSize="xs"
            >
              <Plus size={14} />
              {t("profile.education.add")}
            </Button>
          </Flex>

          <Stack gap={4}>
            {education.map((edu, index) => (
              <Box
                key={index}
                bg="bg"
                borderRadius="lg"
                border="1px solid"
                borderColor="border"
                p={4}
              >
                <Flex justify="flex-end" mb={2}>
                  <Box
                    as="button"
                    onClick={() => removeEducation(index)}
                    color="text.muted"
                    cursor="pointer"
                    _hover={{ color: "error" }}
                  >
                    <Trash2 size={14} />
                  </Box>
                </Flex>
                <Stack gap={3}>
                  <Input
                    value={edu.institution}
                    onChange={(e) =>
                      updateEducation(index, "institution", e.target.value)
                    }
                    placeholder={t("profile.education.institutionPlaceholder")}
                    {...inputProps}
                  />
                  <Flex gap={3}>
                    <Input
                      flex={1}
                      value={edu.degree}
                      onChange={(e) =>
                        updateEducation(index, "degree", e.target.value)
                      }
                      placeholder={t("profile.education.degreePlaceholder")}
                      {...inputProps}
                    />
                    <Input
                      flex={1}
                      value={edu.field}
                      onChange={(e) =>
                        updateEducation(index, "field", e.target.value)
                      }
                      placeholder={t("profile.education.fieldPlaceholder")}
                      {...inputProps}
                    />
                  </Flex>
                  <Flex gap={3}>
                    <Input
                      flex={1}
                      value={edu.start_year || ""}
                      onChange={(e) =>
                        updateEducation(
                          index,
                          "start_year",
                          parseInt(e.target.value.replace(/\D/g, "")) || 0,
                        )
                      }
                      placeholder={t("profile.education.startYear")}
                      inputMode="numeric"
                      {...inputProps}
                    />
                    <Input
                      flex={1}
                      value={edu.end_year || ""}
                      onChange={(e) =>
                        updateEducation(
                          index,
                          "end_year",
                          parseInt(e.target.value.replace(/\D/g, "")) || 0,
                        )
                      }
                      placeholder={t("profile.education.endYear")}
                      inputMode="numeric"
                      {...inputProps}
                    />
                  </Flex>
                </Stack>
              </Box>
            ))}
            {education.length === 0 && (
              <Text fontSize="sm" color="text.muted" textAlign="center" py={2}>
                {t("profile.education.add")}
              </Text>
            )}
          </Stack>
        </Box>

        {/* Certifications */}
        <Box
          bg="surface"
          borderRadius="xl"
          border="1px solid"
          borderColor="border"
          p={6}
          shadow="card"
        >
          <Flex align="center" justify="space-between" mb={5}>
            <Flex align="center" gap={2}>
              <Circle size="28px" bg="success.subtle" color="success">
                <Award size={14} />
              </Circle>
              <Text fontSize="sm" fontWeight="semibold" color="text">
                {t("profile.certifications.title")}
              </Text>
            </Flex>
            <Button
              size="xs"
              variant="ghost"
              color="primary"
              onClick={addCertification}
              fontSize="xs"
            >
              <Plus size={14} />
              {t("profile.certifications.add")}
            </Button>
          </Flex>

          <Stack gap={3}>
            {certifications.map((cert, index) => (
              <Flex
                key={index}
                gap={2}
                align="center"
                bg="bg"
                borderRadius="lg"
                border="1px solid"
                borderColor="border"
                p={3}
              >
                <Input
                  flex={2}
                  value={cert.name}
                  onChange={(e) =>
                    updateCertification(index, "name", e.target.value)
                  }
                  placeholder={t("profile.certifications.namePlaceholder")}
                  {...inputProps}
                />
                <Input
                  flex={2}
                  value={cert.issuer}
                  onChange={(e) =>
                    updateCertification(index, "issuer", e.target.value)
                  }
                  placeholder={t("profile.certifications.issuerPlaceholder")}
                  {...inputProps}
                />
                <Input
                  flex={1}
                  value={cert.year || ""}
                  onChange={(e) =>
                    updateCertification(
                      index,
                      "year",
                      parseInt(e.target.value.replace(/\D/g, "")) || 0,
                    )
                  }
                  placeholder={t("profile.certifications.year")}
                  inputMode="numeric"
                  {...inputProps}
                />
                <Box
                  as="button"
                  onClick={() => removeCertification(index)}
                  color="text.muted"
                  cursor="pointer"
                  _hover={{ color: "error" }}
                  flexShrink={0}
                >
                  <Trash2 size={14} />
                </Box>
              </Flex>
            ))}
            {certifications.length === 0 && (
              <Text fontSize="sm" color="text.muted" textAlign="center" py={2}>
                {t("profile.certifications.add")}
              </Text>
            )}
          </Stack>
        </Box>

        {/* Languages */}
        <Box
          bg="surface"
          borderRadius="xl"
          border="1px solid"
          borderColor="border"
          p={6}
          shadow="card"
        >
          <Flex align="center" justify="space-between" mb={5}>
            <Flex align="center" gap={2}>
              <Circle size="28px" bg="primary.subtle" color="primary">
                <Globe size={14} />
              </Circle>
              <Text fontSize="sm" fontWeight="semibold" color="text">
                {t("profile.languages.title")}
              </Text>
            </Flex>
            <Button
              size="xs"
              variant="ghost"
              color="primary"
              onClick={addLanguage}
              fontSize="xs"
            >
              <Plus size={14} />
              {t("profile.languages.add")}
            </Button>
          </Flex>

          <Stack gap={3}>
            {languages.map((lang, index) => (
              <Flex
                key={index}
                gap={2}
                align="center"
                bg="bg"
                borderRadius="lg"
                border="1px solid"
                borderColor="border"
                p={3}
              >
                <Input
                  flex={2}
                  value={lang.language}
                  onChange={(e) =>
                    updateLanguage(index, "language", e.target.value)
                  }
                  placeholder={t("profile.languages.languagePlaceholder")}
                  {...inputProps}
                />
                <Box flex={2}>
                  <Flex gap={1}>
                    {(
                      ["native", "fluent", "professional", "basic"] as const
                    ).map((level) => (
                      <Flex
                        key={level}
                        as="button"
                        {...{ type: "button" }}
                        onClick={() => updateLanguage(index, "level", level)}
                        px={2}
                        py={1}
                        borderRadius="md"
                        border="1px solid"
                        borderColor={
                          lang.level === level ? "primary" : "border"
                        }
                        bg={lang.level === level ? "primary.subtle" : "bg"}
                        color={
                          lang.level === level ? "primary" : "text.secondary"
                        }
                        fontSize="xs"
                        fontWeight={lang.level === level ? "semibold" : "medium"}
                        cursor="pointer"
                        transition="all 0.2s"
                        _hover={{
                          borderColor:
                            lang.level === level ? "primary" : "border.emphasis",
                        }}
                      >
                        {t(`profile.languages.levels.${level}`)}
                      </Flex>
                    ))}
                  </Flex>
                </Box>
                <Box
                  as="button"
                  onClick={() => removeLanguage(index)}
                  color="text.muted"
                  cursor="pointer"
                  _hover={{ color: "error" }}
                  flexShrink={0}
                >
                  <Trash2 size={14} />
                </Box>
              </Flex>
            ))}
            {languages.length === 0 && (
              <Text fontSize="sm" color="text.muted" textAlign="center" py={2}>
                {t("profile.languages.add")}
              </Text>
            )}
          </Stack>
        </Box>

        {/* Links & CV */}
        <Box
          bg="surface"
          borderRadius="xl"
          border="1px solid"
          borderColor="border"
          p={6}
          shadow="card"
        >
          <Flex align="center" gap={2} mb={5}>
            <Circle size="28px" bg="success.subtle" color="success">
              <FileText size={14} />
            </Circle>
            <Text fontSize="sm" fontWeight="semibold" color="text">
              {t("profile.links.title")}
            </Text>
          </Flex>

          <Stack gap={4}>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text" mb={1.5}>
                LinkedIn
              </Text>
              <Flex
                align="center"
                gap={2}
                bg="bg"
                border="1px solid"
                borderColor="border"
                borderRadius="lg"
                h="40px"
                px={3}
                _focusWithin={{
                  borderColor: "primary",
                  boxShadow: "0 0 0 1px var(--chakra-colors-primary)",
                }}
                _hover={{ borderColor: "border.emphasis" }}
              >
                <Linkedin size={14} color="var(--chakra-colors-text-muted)" />
                <Input
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder={t("profile.links.linkedinPlaceholder")}
                  border="none"
                  h="full"
                  fontSize="sm"
                  px={0}
                  _focus={{ outline: "none", boxShadow: "none" }}
                />
              </Flex>
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text" mb={1.5}>
                GitHub
              </Text>
              <Flex
                align="center"
                gap={2}
                bg="bg"
                border="1px solid"
                borderColor="border"
                borderRadius="lg"
                h="40px"
                px={3}
                _focusWithin={{
                  borderColor: "primary",
                  boxShadow: "0 0 0 1px var(--chakra-colors-primary)",
                }}
                _hover={{ borderColor: "border.emphasis" }}
              >
                <Github size={14} color="var(--chakra-colors-text-muted)" />
                <Input
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  placeholder={t("profile.links.githubPlaceholder")}
                  border="none"
                  h="full"
                  fontSize="sm"
                  px={0}
                  _focus={{ outline: "none", boxShadow: "none" }}
                />
              </Flex>
            </Box>

            {/* CV Upload */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text" mb={1.5}>
                {t("profile.links.cv")}
              </Text>
              <Flex
                align="center"
                gap={3}
                bg="bg"
                border="1px solid"
                borderColor={resumeOriginalName ? "success" : "border"}
                borderRadius="lg"
                px={4}
                py={2.5}
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
                  {resumeOriginalName ? (
                    <FileText size={16} />
                  ) : (
                    <Upload size={16} />
                  )}
                </Box>
                <Text
                  fontSize="sm"
                  color={resumeOriginalName ? "text" : "text.placeholder"}
                  flex={1}
                >
                  {isUploading
                    ? t("profile.links.cvUploading")
                    : isParsing
                      ? t("profile.links.cvParsing")
                      : resumeOriginalName
                        ? resumeOriginalName
                        : t("profile.links.cvUpload")}
                </Text>
              </Flex>
              <Flex justify="space-between" mt={1}>
                <Text fontSize="xs" color="text.muted">
                  {t("profile.links.cvHelper")}
                </Text>
                {parseStatus === "parsed" && (
                  <Flex align="center" gap={1} color="success">
                    <Check size={12} />
                    <Text fontSize="xs" fontWeight="medium">
                      {t("profile.links.cvParsed")}
                    </Text>
                  </Flex>
                )}
              </Flex>
            </Box>
          </Stack>
        </Box>

        {/* Preferences */}
        <Box
          bg="surface"
          borderRadius="xl"
          border="1px solid"
          borderColor="border"
          p={6}
          shadow="card"
        >
          <Flex align="center" gap={2} mb={5}>
            <Circle size="28px" bg="bg.emphasis" color="text.secondary">
              <Settings size={14} />
            </Circle>
            <Text fontSize="sm" fontWeight="semibold" color="text">
              {t("profile.preferences.title")}
            </Text>
          </Flex>

          <Stack gap={4}>
            {/* Website */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text" mb={1.5}>
                {t("profile.preferences.website")}
              </Text>
              <Input
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder={t("profile.preferences.websitePlaceholder")}
                {...inputProps}
              />
            </Box>

            {/* Availability */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text" mb={1.5}>
                {t("profile.preferences.availability")}
              </Text>
              <Flex gap={2} flexWrap="wrap">
                {availabilityOptions.map((opt) => (
                  <Flex
                    key={opt.value}
                    as="button"
                    {...{ type: "button" }}
                    onClick={() =>
                      setAvailability(
                        availability === opt.value ? "" : opt.value,
                      )
                    }
                    px={3}
                    py={1.5}
                    borderRadius="full"
                    border="1px solid"
                    borderColor={
                      availability === opt.value ? "primary" : "border"
                    }
                    bg={availability === opt.value ? "primary.subtle" : "bg"}
                    color={
                      availability === opt.value ? "primary" : "text.secondary"
                    }
                    fontSize="xs"
                    fontWeight={
                      availability === opt.value ? "semibold" : "medium"
                    }
                    cursor="pointer"
                    transition="all 0.2s"
                    _hover={{
                      borderColor:
                        availability === opt.value
                          ? "primary"
                          : "border.emphasis",
                    }}
                  >
                    {opt.label}
                  </Flex>
                ))}
              </Flex>
            </Box>

            {/* Remote preference */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text" mb={1.5}>
                {t("profile.preferences.remote")}
              </Text>
              <Flex gap={2}>
                {remoteOptions.map((opt) => (
                  <Flex
                    key={opt.value}
                    as="button"
                    {...{ type: "button" }}
                    onClick={() =>
                      setRemotePreference(
                        remotePreference === opt.value ? "" : opt.value,
                      )
                    }
                    px={4}
                    py={2}
                    borderRadius="lg"
                    border="1px solid"
                    borderColor={
                      remotePreference === opt.value ? "primary" : "border"
                    }
                    bg={
                      remotePreference === opt.value ? "primary.subtle" : "bg"
                    }
                    color={
                      remotePreference === opt.value
                        ? "primary"
                        : "text.secondary"
                    }
                    fontSize="sm"
                    fontWeight={
                      remotePreference === opt.value ? "semibold" : "medium"
                    }
                    cursor="pointer"
                    transition="all 0.2s"
                    flex={1}
                    justify="center"
                    _hover={{
                      borderColor:
                        remotePreference === opt.value
                          ? "primary"
                          : "border.emphasis",
                    }}
                  >
                    {opt.label}
                  </Flex>
                ))}
              </Flex>
            </Box>

            {/* Relocation */}
            <Flex
              as="button"
              {...{ type: "button" }}
              onClick={() => setOpenToRelocation(!openToRelocation)}
              align="center"
              gap={3}
              cursor="pointer"
              py={1}
            >
              <Box
                w="36px"
                h="20px"
                borderRadius="full"
                bg={openToRelocation ? "primary" : "bg.emphasis"}
                position="relative"
                transition="all 0.2s"
              >
                <Box
                  w="16px"
                  h="16px"
                  borderRadius="full"
                  bg="white"
                  position="absolute"
                  top="2px"
                  left={openToRelocation ? "18px" : "2px"}
                  transition="all 0.2s"
                  shadow="sm"
                />
              </Box>
              <Text fontSize="sm" color="text">
                {t("profile.preferences.relocation")}
              </Text>
            </Flex>
          </Stack>
        </Box>

        {/* Save Button */}
        <Flex justify="space-between" align="center">
          {saveStatus === "saved" && (
            <Flex align="center" gap={2} color="success">
              <Check size={14} strokeWidth={3} />
              <Text fontSize="sm" fontWeight="medium">
                {t("profile.saved")}
              </Text>
            </Flex>
          )}
          {saveStatus === "error" && (
            <Text fontSize="sm" color="error" fontWeight="medium">
              {t("profile.error")}
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
            {isSaving ? t("profile.saving") : t("profile.save")}
          </Button>
        </Flex>
      </Stack>
    </Box>
  );
}
