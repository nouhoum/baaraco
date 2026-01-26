"use client";

import { useState } from "react";
import type { MetaFunction } from "react-router";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Box,
  Container,
  Heading,
  Text,
  Stack,
  Button,
  Alert,
  Grid,
  Flex,
  Circle,
  Accordion,
  Checkbox,
  Textarea,
  Input,
} from "@chakra-ui/react";
import { Layout } from "~/components/layout";
import { FormInput } from "~/components/ui/input";
import { createPilotRequest, completePilotRequest } from "~/components/lib/api";
import { Glow, AnimatedSection, fadeInUp, StaggeredContainer, StaggeredItem } from "~/components/ui/motion";

export const meta: MetaFunction = () => {
  return [
    { title: "Programme Pilote - Baara" },
    {
      name: "description",
      content:
        "Testez Baara pendant 4 semaines sur un poste réel. Work sample, évaluation structurée, feedback candidat.",
    },
  ];
};

// Types
type FormStep = 1 | 2 | "confirmation";

interface Step1Data {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  roleToHire: string;
}

interface Step2Data {
  role: string;
  teamSize: string;
  hiringTimeline: string;
  website: string;
  productionContext: string[];
  baselineTimeToHire: string;
  baselineInterviews: string;
  baselinePainPoint: string;
  jobLink: string;
  message: string;
  consent: boolean;
}

// Icons
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function FileTextIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function ListChecksIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 6h11" />
      <path d="M10 12h11" />
      <path d="M10 18h11" />
      <path d="M3 6l1 1 2-2" />
      <path d="M3 12l1 1 2-2" />
      <path d="M3 18l1 1 2-2" />
    </svg>
  );
}

function BotIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8V4H8" />
      <rect x="4" y="8" width="16" height="12" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  );
}

function UserCheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  );
}

function ClipboardCheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  );
}

function MessageSquareIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function HeartHandshakeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      <path d="M12 5L9.04 7.96a2.17 2.17 0 0 0 0 3.08v0c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66" />
      <path d="m18 15-2-2" />
      <path d="m15 18-2-2" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

// Benefit item
function BenefitItem({ children }: { children: React.ReactNode }) {
  return (
    <Flex gap={3} alignItems="flex-start">
      <Circle size="22px" bg="rgba(20, 184, 166, 0.15)" color="brand.400" flexShrink={0} mt={0.5}>
        <CheckIcon />
      </Circle>
      <Text color="gray.300" fontSize="md" lineHeight="1.7">
        {children}
      </Text>
    </Flex>
  );
}

// Include card
function IncludeCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Box
      h="full"
      p={6}
      bg="rgba(255, 255, 255, 0.02)"
      borderRadius="2xl"
      border="1px solid"
      borderColor="rgba(255, 255, 255, 0.06)"
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={{
        borderColor: "rgba(20, 184, 166, 0.3)",
        transform: "translateY(-4px)",
        bg: "rgba(255, 255, 255, 0.03)",
      }}
    >
      <Stack gap={4} h="full">
        <Circle size="48px" bg="rgba(20, 184, 166, 0.1)" color="brand.400" flexShrink={0}>
          {icon}
        </Circle>
        <Box flex={1}>
          <Text fontWeight="semibold" color="white" mb={1} fontSize="md">
            {title}
          </Text>
          <Text color="gray.400" fontSize="sm" lineHeight="1.7">
            {description}
          </Text>
        </Box>
      </Stack>
    </Box>
  );
}

// Timeline step
function TimelineStep({ number, title, description, isLast = false }: { number: number; title: string; description: string; isLast?: boolean }) {
  return (
    <Flex gap={4} alignItems="flex-start" position="relative">
      {!isLast && (
        <Box position="absolute" left="19px" top="44px" w="2px" h="calc(100% + 8px)" bg="rgba(20, 184, 166, 0.2)" />
      )}
      <Circle
        size="40px"
        bg={isLast ? "linear-gradient(135deg, #14B8A6 0%, #2DD4BF 100%)" : "linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)"}
        color="white"
        fontWeight="bold"
        fontSize="sm"
        flexShrink={0}
        boxShadow="0 4px 16px rgba(20, 184, 166, 0.3)"
        zIndex={1}
      >
        {number}
      </Circle>
      <Box pb={6}>
        <Text fontWeight="semibold" color="white" mb={1}>
          {title}
        </Text>
        <Text color="gray.400" fontSize="sm" lineHeight="1.7">
          {description}
        </Text>
      </Box>
    </Flex>
  );
}

// Requirement card
function RequirementCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Box h="full" p={6} bg="rgba(255, 255, 255, 0.02)" borderRadius="2xl" border="1px solid" borderColor="rgba(255, 255, 255, 0.06)">
      <Stack gap={4} h="full">
        <Circle size="44px" bg="rgba(59, 130, 246, 0.1)" color="blue.400" flexShrink={0}>
          {icon}
        </Circle>
        <Box flex={1}>
          <Text fontWeight="semibold" color="white" mb={1} fontSize="md">
            {title}
          </Text>
          <Text color="gray.400" fontSize="sm" lineHeight="1.7">
            {description}
          </Text>
        </Box>
      </Stack>
    </Box>
  );
}

// KPI card
function KpiCard({ value, label }: { value: string; label: string }) {
  return (
    <Box p={5} bg="rgba(255, 255, 255, 0.02)" borderRadius="xl" border="1px solid" borderColor="rgba(255, 255, 255, 0.06)" textAlign="center">
      <Text fontSize="2xl" fontWeight="bold" color="brand.400" fontFamily="heading" mb={1}>
        {value}
      </Text>
      <Text color="gray.400" fontSize="sm">
        {label}
      </Text>
    </Box>
  );
}

// FAQ item
function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <Accordion.Item
      value={question}
      bg="rgba(255, 255, 255, 0.02)"
      borderRadius="xl"
      border="1px solid"
      borderColor="rgba(255, 255, 255, 0.06)"
      overflow="hidden"
      mb={3}
    >
      <Accordion.ItemTrigger px={6} py={5} _hover={{ bg: "rgba(255, 255, 255, 0.03)" }} cursor="pointer">
        <Flex justify="space-between" align="center" w="full">
          <Text fontWeight="medium" color="white" fontSize="md" textAlign="left">
            {question}
          </Text>
          <Accordion.ItemIndicator color="gray.400">
            <ChevronDownIcon />
          </Accordion.ItemIndicator>
        </Flex>
      </Accordion.ItemTrigger>
      <Accordion.ItemContent>
        <Box px={6} pb={5}>
          <Text color="gray.400" fontSize="sm" lineHeight="1.8">
            {answer}
          </Text>
        </Box>
      </Accordion.ItemContent>
    </Accordion.Item>
  );
}

// Progress indicator component
function ProgressIndicator({ currentStep, t }: { currentStep: FormStep; t: (key: string) => string }) {
  const step1Complete = currentStep === 2 || currentStep === "confirmation";
  const step2Complete = currentStep === "confirmation";

  return (
    <Flex gap={4} mb={6}>
      <Flex align="center" gap={2}>
        <Circle
          size="28px"
          bg={step1Complete ? "brand.500" : currentStep === 1 ? "brand.500" : "rgba(255, 255, 255, 0.1)"}
          color="white"
          fontSize="xs"
          fontWeight="bold"
        >
          {step1Complete ? <CheckIcon /> : "1"}
        </Circle>
        <Text fontSize="sm" color={currentStep === 1 ? "white" : "gray.400"} fontWeight={currentStep === 1 ? "medium" : "normal"}>
          {t("form.step1.indicator").split(" — ")[1]}
        </Text>
      </Flex>
      <Box flex={1} h="2px" bg="rgba(255, 255, 255, 0.1)" alignSelf="center" borderRadius="full">
        <Box h="full" bg={step1Complete ? "brand.500" : "transparent"} borderRadius="full" transition="all 0.3s" />
      </Box>
      <Flex align="center" gap={2}>
        <Circle
          size="28px"
          bg={step2Complete ? "brand.500" : currentStep === 2 ? "brand.500" : "rgba(255, 255, 255, 0.1)"}
          color="white"
          fontSize="xs"
          fontWeight="bold"
        >
          {step2Complete ? <CheckIcon /> : "2"}
        </Circle>
        <Text fontSize="sm" color={currentStep === 2 ? "white" : "gray.400"} fontWeight={currentStep === 2 ? "medium" : "normal"}>
          {t("form.step2.indicator").split(" — ")[1]}
        </Text>
      </Flex>
    </Flex>
  );
}

// Select component styled for dark mode
function FormSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Record<string, string>;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <Box>
      <Text fontSize="sm" fontWeight="medium" color="gray.300" mb={2}>
        {label}
        {required && <Text as="span" color="brand.400"> *</Text>}
      </Text>
      <Box
        as="select"
        value={value}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
        w="full"
        h="48px"
        px={4}
        bg="rgba(255, 255, 255, 0.05)"
        border="1px solid"
        borderColor="rgba(255, 255, 255, 0.1)"
        borderRadius="xl"
        color={value ? "white" : "gray.500"}
        fontSize="sm"
        _hover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
        _focus={{ borderColor: "brand.400", outline: "none", boxShadow: "0 0 0 1px var(--chakra-colors-brand-400)" }}
        cursor="pointer"
        sx={{
          "& option": {
            bg: "#1a1a1b",
            color: "white",
          },
        }}
      >
        <option value="">{placeholder}</option>
        {Object.entries(options).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </Box>
    </Box>
  );
}

// Multi-step form component
function PilotRequestForm() {
  const { t } = useTranslation("pilot");
  const { t: tCommon } = useTranslation("common");
  const { lang } = useParams();

  const [currentStep, setCurrentStep] = useState<FormStep>(1);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 data
  const [step1Data, setStep1Data] = useState<Step1Data>({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    roleToHire: "",
  });

  // Step 2 data
  const [step2Data, setStep2Data] = useState<Step2Data>({
    role: "",
    teamSize: "",
    hiringTimeline: "",
    website: "",
    productionContext: [],
    baselineTimeToHire: "",
    baselineInterviews: "",
    baselinePainPoint: "",
    jobLink: "",
    message: "",
    consent: false,
  });

  const handleStep1Change = (field: keyof Step1Data, value: string) => {
    setStep1Data((prev) => ({ ...prev, [field]: value }));
  };

  const handleStep2Change = (field: keyof Step2Data, value: string | string[] | boolean) => {
    setStep2Data((prev) => ({ ...prev, [field]: value }));
  };

  const toggleProductionContext = (context: string) => {
    setStep2Data((prev) => ({
      ...prev,
      productionContext: prev.productionContext.includes(context)
        ? prev.productionContext.filter((c) => c !== context)
        : [...prev.productionContext, context],
    }));
  };

  const validateStep1 = () => {
    if (!step1Data.firstName || !step1Data.lastName || !step1Data.email || !step1Data.company || !step1Data.roleToHire) {
      setError(t("form.errors.required"));
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(step1Data.email)) {
      setError(t("form.errors.invalidEmail"));
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!step2Data.role || !step2Data.teamSize || !step2Data.hiringTimeline) {
      setError(t("form.errors.required"));
      return false;
    }
    if (!step2Data.consent) {
      setError(t("form.errors.consentRequired"));
      return false;
    }
    return true;
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateStep1()) return;

    setIsSubmitting(true);
    try {
      const response = await createPilotRequest({
        first_name: step1Data.firstName,
        last_name: step1Data.lastName,
        email: step1Data.email,
        company: step1Data.company,
        role_to_hire: step1Data.roleToHire,
        locale: lang,
      });
      setRequestId(response.id);
      setCurrentStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon("errors.genericError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateStep2()) return;
    if (!requestId) {
      setError(tCommon("errors.genericError"));
      return;
    }

    setIsSubmitting(true);
    try {
      await completePilotRequest(requestId, {
        role: step2Data.role,
        team_size: step2Data.teamSize,
        hiring_timeline: step2Data.hiringTimeline,
        website: step2Data.website || undefined,
        production_context: step2Data.productionContext.length > 0 ? step2Data.productionContext : undefined,
        baseline_time_to_hire: step2Data.baselineTimeToHire ? parseInt(step2Data.baselineTimeToHire) : undefined,
        baseline_interviews: step2Data.baselineInterviews ? parseInt(step2Data.baselineInterviews) : undefined,
        baseline_pain_point: step2Data.baselinePainPoint || undefined,
        job_link: step2Data.jobLink || undefined,
        message: step2Data.message || undefined,
        consent_given: step2Data.consent,
      });
      setCurrentStep("confirmation");
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon("errors.genericError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleToHireOptions = t("form.step1.roleToHireOptions", { returnObjects: true }) as Record<string, string>;
  const roleOptions = t("form.step2.roleOptions", { returnObjects: true }) as Record<string, string>;
  const teamSizeOptions = t("form.step2.teamSizeOptions", { returnObjects: true }) as Record<string, string>;
  const hiringTimelineOptions = t("form.step2.hiringTimelineOptions", { returnObjects: true }) as Record<string, string>;
  const productionContextOptions = t("form.step2.productionContextOptions", { returnObjects: true }) as Record<string, string>;

  // Confirmation screen
  if (currentStep === "confirmation") {
    return (
      <Box
        bg="rgba(255, 255, 255, 0.02)"
        borderRadius="2xl"
        border="1px solid"
        borderColor="rgba(255, 255, 255, 0.08)"
        overflow="hidden"
        boxShadow="0 0 60px rgba(20, 184, 166, 0.08)"
        p={{ base: 8, md: 10 }}
        textAlign="center"
      >
        <Stack gap={6} alignItems="center">
          <Circle size="80px" bg="rgba(20, 184, 166, 0.1)" color="brand.400">
            <CheckCircleIcon />
          </Circle>
          <Heading as="h2" fontSize="xl" color="white" fontWeight="semibold">
            {t("form.confirmation.title")}
          </Heading>
          <Text color="gray.400" fontSize="sm">
            {t("form.confirmation.description")}
          </Text>
          <Stack gap={2} alignItems="start" bg="rgba(255, 255, 255, 0.03)" p={4} borderRadius="xl" w="full" maxW="sm">
            <Flex gap={2} alignItems="center">
              <Circle size="18px" bg="rgba(20, 184, 166, 0.15)" color="brand.400">
                <CheckIcon />
              </Circle>
              <Text color="gray.300" fontSize="sm">
                {t("form.confirmation.item1")}
              </Text>
            </Flex>
            <Flex gap={2} alignItems="center">
              <Circle size="18px" bg="rgba(20, 184, 166, 0.15)" color="brand.400">
                <CheckIcon />
              </Circle>
              <Text color="gray.300" fontSize="sm">
                {t("form.confirmation.item2")}
              </Text>
            </Flex>
            <Flex gap={2} alignItems="center">
              <Circle size="18px" bg="rgba(20, 184, 166, 0.15)" color="brand.400">
                <CheckIcon />
              </Circle>
              <Text color="gray.300" fontSize="sm">
                {t("form.confirmation.item3")}
              </Text>
            </Flex>
          </Stack>
          <Text color="gray.500" fontSize="sm" mt={2}>
            {t("form.confirmation.demoCta")}
          </Text>
          <Button
            variant="outline"
            borderColor="rgba(255, 255, 255, 0.2)"
            color="white"
            _hover={{ bg: "rgba(255, 255, 255, 0.05)" }}
            borderRadius="xl"
          >
            {t("form.confirmation.demoButton")}
          </Button>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      bg="rgba(255, 255, 255, 0.02)"
      borderRadius="2xl"
      border="1px solid"
      borderColor="rgba(255, 255, 255, 0.08)"
      overflow="hidden"
      boxShadow="0 0 60px rgba(20, 184, 166, 0.08)"
      position="relative"
      _before={{
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "3px",
        background: "linear-gradient(90deg, #0F766E 0%, #14B8A6 50%, #2DD4BF 100%)",
      }}
    >
      <Box p={{ base: 6, md: 8 }}>
        <Stack gap={6}>
          <Stack gap={2}>
            <Heading as="h2" size="lg" color="white" fontWeight="semibold">
              {t("form.title")}
            </Heading>
            <Text color="gray.400" fontSize="sm" lineHeight="1.7">
              {t("form.subtitle")}
            </Text>
          </Stack>

          <ProgressIndicator currentStep={currentStep} t={t} />

          {error && (
            <Alert.Root status="error" borderRadius="lg" bg="rgba(239, 68, 68, 0.1)" border="1px solid" borderColor="rgba(239, 68, 68, 0.3)">
              <Alert.Indicator color="red.400" />
              <Alert.Title fontSize="sm" color="red.400">
                {error}
              </Alert.Title>
            </Alert.Root>
          )}

          {/* Step 1 */}
          {currentStep === 1 && (
            <form onSubmit={handleStep1Submit}>
              <Stack gap={5}>
                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                  <FormInput
                    label={t("form.step1.firstName")}
                    name="firstName"
                    value={step1Data.firstName}
                    onChange={(e) => handleStep1Change("firstName", e.target.value)}
                    placeholder={t("form.step1.firstNamePlaceholder")}
                    required
                    colorMode="dark"
                  />
                  <FormInput
                    label={t("form.step1.lastName")}
                    name="lastName"
                    value={step1Data.lastName}
                    onChange={(e) => handleStep1Change("lastName", e.target.value)}
                    placeholder={t("form.step1.lastNamePlaceholder")}
                    required
                    colorMode="dark"
                  />
                </Grid>

                <Box>
                  <FormInput
                    label={t("form.step1.email")}
                    name="email"
                    type="email"
                    value={step1Data.email}
                    onChange={(e) => handleStep1Change("email", e.target.value)}
                    placeholder={t("form.step1.emailPlaceholder")}
                    required
                    colorMode="dark"
                  />
                  <Text fontSize="xs" color="gray.500" mt={1.5}>
                    {t("form.step1.emailHelper")}
                  </Text>
                </Box>

                <FormInput
                  label={t("form.step1.company")}
                  name="company"
                  value={step1Data.company}
                  onChange={(e) => handleStep1Change("company", e.target.value)}
                  placeholder={t("form.step1.companyPlaceholder")}
                  required
                  colorMode="dark"
                />

                <FormSelect
                  label={t("form.step1.roleToHire")}
                  value={step1Data.roleToHire}
                  onChange={(value) => handleStep1Change("roleToHire", value)}
                  options={roleToHireOptions}
                  placeholder={t("form.step1.roleToHirePlaceholder")}
                  required
                />

                <Button
                  type="submit"
                  w="full"
                  h={14}
                  mt={2}
                  bg="linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)"
                  color="white"
                  fontWeight="600"
                  borderRadius="xl"
                  fontSize="md"
                  boxShadow="0 4px 20px rgba(20, 184, 166, 0.3)"
                  _hover={{ transform: "translateY(-2px)", boxShadow: "0 8px 30px rgba(20, 184, 166, 0.4)" }}
                  _active={{ transform: "translateY(0)" }}
                  transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                  loading={isSubmitting}
                >
                  {t("form.step1.submit")}
                </Button>
              </Stack>
            </form>
          )}

          {/* Step 2 */}
          {currentStep === 2 && (
            <form onSubmit={handleStep2Submit}>
              <Stack gap={5}>
                <Button
                  variant="ghost"
                  color="gray.400"
                  size="sm"
                  alignSelf="flex-start"
                  px={0}
                  _hover={{ color: "white", bg: "transparent" }}
                  onClick={() => setCurrentStep(1)}
                >
                  {t("form.step2.back")}
                </Button>

                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                  <FormSelect
                    label={t("form.step2.role")}
                    value={step2Data.role}
                    onChange={(value) => handleStep2Change("role", value)}
                    options={roleOptions}
                    placeholder={t("form.step2.rolePlaceholder")}
                    required
                  />
                  <FormSelect
                    label={t("form.step2.teamSize")}
                    value={step2Data.teamSize}
                    onChange={(value) => handleStep2Change("teamSize", value)}
                    options={teamSizeOptions}
                    placeholder={t("form.step2.teamSizePlaceholder")}
                    required
                  />
                </Grid>

                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                  <FormSelect
                    label={t("form.step2.hiringTimeline")}
                    value={step2Data.hiringTimeline}
                    onChange={(value) => handleStep2Change("hiringTimeline", value)}
                    options={hiringTimelineOptions}
                    placeholder={t("form.step2.hiringTimelinePlaceholder")}
                    required
                  />
                  <FormInput
                    label={t("form.step2.website")}
                    name="website"
                    value={step2Data.website}
                    onChange={(e) => handleStep2Change("website", e.target.value)}
                    placeholder={t("form.step2.websitePlaceholder")}
                    colorMode="dark"
                  />
                </Grid>

                {/* Production context checkboxes */}
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.300" mb={3}>
                    {t("form.step2.productionContext")}
                  </Text>
                  <Grid templateColumns={{ base: "1fr", sm: "1fr 1fr" }} gap={2}>
                    {Object.entries(productionContextOptions).map(([key, label]) => (
                      <Checkbox.Root
                        key={key}
                        checked={step2Data.productionContext.includes(key)}
                        onCheckedChange={() => toggleProductionContext(key)}
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control
                          borderColor="rgba(255, 255, 255, 0.2)"
                          bg="rgba(255, 255, 255, 0.05)"
                          _checked={{ bg: "brand.500", borderColor: "brand.500" }}
                        >
                          <Checkbox.Indicator>
                            <CheckIcon />
                          </Checkbox.Indicator>
                        </Checkbox.Control>
                        <Checkbox.Label fontSize="sm" color="gray.300">
                          {label}
                        </Checkbox.Label>
                      </Checkbox.Root>
                    ))}
                  </Grid>
                </Box>

                {/* Baseline section */}
                <Box bg="rgba(255, 255, 255, 0.03)" p={5} borderRadius="xl">
                  <Text fontSize="sm" fontWeight="medium" color="gray.300" mb={4}>
                    {t("form.step2.baselineSection")}
                  </Text>
                  <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="gray.400" mb={2}>
                        {t("form.step2.baselineTimeToHire")}
                      </Text>
                      <Flex gap={2} align="center">
                        <Input
                          type="number"
                          value={step2Data.baselineTimeToHire}
                          onChange={(e) => handleStep2Change("baselineTimeToHire", e.target.value)}
                          bg="rgba(255, 255, 255, 0.05)"
                          border="1px solid"
                          borderColor="rgba(255, 255, 255, 0.1)"
                          borderRadius="xl"
                          color="white"
                          h="48px"
                          _hover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
                          _focus={{ borderColor: "brand.400", boxShadow: "0 0 0 1px var(--chakra-colors-brand-400)" }}
                        />
                        <Text color="gray.500" fontSize="sm" whiteSpace="nowrap">
                          {t("form.step2.baselineTimeToHireSuffix")}
                        </Text>
                      </Flex>
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="gray.400" mb={2}>
                        {t("form.step2.baselineInterviews")}
                      </Text>
                      <Input
                        type="number"
                        value={step2Data.baselineInterviews}
                        onChange={(e) => handleStep2Change("baselineInterviews", e.target.value)}
                        bg="rgba(255, 255, 255, 0.05)"
                        border="1px solid"
                        borderColor="rgba(255, 255, 255, 0.1)"
                        borderRadius="xl"
                        color="white"
                        h="48px"
                        _hover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
                        _focus={{ borderColor: "brand.400", boxShadow: "0 0 0 1px var(--chakra-colors-brand-400)" }}
                      />
                    </Box>
                  </Grid>
                  <Box mt={4}>
                    <Text fontSize="sm" fontWeight="medium" color="gray.400" mb={2}>
                      {t("form.step2.baselinePainPoint")}
                    </Text>
                    <Input
                      value={step2Data.baselinePainPoint}
                      onChange={(e) => handleStep2Change("baselinePainPoint", e.target.value)}
                      placeholder={t("form.step2.baselinePainPointPlaceholder")}
                      bg="rgba(255, 255, 255, 0.05)"
                      border="1px solid"
                      borderColor="rgba(255, 255, 255, 0.1)"
                      borderRadius="xl"
                      color="white"
                      h="48px"
                      _hover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
                      _focus={{ borderColor: "brand.400", boxShadow: "0 0 0 1px var(--chakra-colors-brand-400)" }}
                      _placeholder={{ color: "gray.500" }}
                    />
                  </Box>
                </Box>

                <FormInput
                  label={t("form.step2.jobLink")}
                  name="jobLink"
                  value={step2Data.jobLink}
                  onChange={(e) => handleStep2Change("jobLink", e.target.value)}
                  placeholder={t("form.step2.jobLinkPlaceholder")}
                  colorMode="dark"
                />

                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.300" mb={2}>
                    {t("form.step2.message")}
                  </Text>
                  <Textarea
                    value={step2Data.message}
                    onChange={(e) => handleStep2Change("message", e.target.value)}
                    placeholder={t("form.step2.messagePlaceholder")}
                    bg="rgba(255, 255, 255, 0.05)"
                    border="1px solid"
                    borderColor="rgba(255, 255, 255, 0.1)"
                    borderRadius="xl"
                    color="white"
                    rows={3}
                    _hover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
                    _focus={{ borderColor: "brand.400", boxShadow: "0 0 0 1px var(--chakra-colors-brand-400)" }}
                    _placeholder={{ color: "gray.500" }}
                  />
                </Box>

                {/* Consent checkbox */}
                <Checkbox.Root checked={step2Data.consent} onCheckedChange={(details) => handleStep2Change("consent", !!details.checked)}>
                  <Checkbox.HiddenInput />
                  <Checkbox.Control
                    borderColor="rgba(255, 255, 255, 0.2)"
                    bg="rgba(255, 255, 255, 0.05)"
                    _checked={{ bg: "brand.500", borderColor: "brand.500" }}
                  >
                    <Checkbox.Indicator>
                      <CheckIcon />
                    </Checkbox.Indicator>
                  </Checkbox.Control>
                  <Checkbox.Label fontSize="sm" color="gray.300">
                    {t("form.step2.consent")} <Text as="span" color="brand.400">*</Text>
                  </Checkbox.Label>
                </Checkbox.Root>

                <Button
                  type="submit"
                  w="full"
                  h={14}
                  mt={2}
                  bg="linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)"
                  color="white"
                  fontWeight="600"
                  borderRadius="xl"
                  fontSize="md"
                  boxShadow="0 4px 20px rgba(20, 184, 166, 0.3)"
                  _hover={{ transform: "translateY(-2px)", boxShadow: "0 8px 30px rgba(20, 184, 166, 0.4)" }}
                  _active={{ transform: "translateY(0)" }}
                  transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                  loading={isSubmitting}
                >
                  {t("form.step2.submit")}
                </Button>
              </Stack>
            </form>
          )}
        </Stack>
      </Box>
    </Box>
  );
}

export default function Pilot() {
  const { t } = useTranslation("pilot");

  return (
    <Layout>
      {/* Hero Section */}
      <Box as="section" bg="#0A0A0B" position="relative" overflow="hidden" pt={{ base: 8, md: 12 }} pb={{ base: 16, md: 24 }}>
        <Box position="absolute" inset={0} overflow="hidden" pointerEvents="none">
          <Glow color="rgba(20, 184, 166, 0.2)" size="600px" top="-20%" left="30%" intensity={1.2} />
          <Glow color="rgba(59, 130, 246, 0.1)" size="400px" bottom="10%" right="5%" intensity={0.8} />
          <Box
            position="absolute"
            inset={0}
            opacity={0.03}
            backgroundImage="linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)"
            backgroundSize="60px 60px"
          />
        </Box>

        <Container maxW="container.xl" px={{ base: 4, md: 8 }} position="relative">
          <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={{ base: 10, lg: 16 }} alignItems="start">
            {/* Left Column - Content */}
            <AnimatedSection variants={fadeInUp}>
              <Stack gap={8}>
                <Box>
                  <Box
                    as="span"
                    display="inline-flex"
                    alignItems="center"
                    gap={2}
                    bg="rgba(20, 184, 166, 0.1)"
                    border="1px solid"
                    borderColor="rgba(20, 184, 166, 0.3)"
                    px={4}
                    py={2}
                    borderRadius="full"
                    fontSize="sm"
                    fontWeight="medium"
                    color="brand.400"
                  >
                    <StarIcon />
                    {t("hero.badge")}
                  </Box>
                </Box>

                <Stack gap={4}>
                  <Heading
                    as="h1"
                    fontSize={{ base: "2.5rem", md: "3.5rem", lg: "4rem" }}
                    lineHeight="1.1"
                    color="white"
                    fontWeight="800"
                    letterSpacing="-0.02em"
                  >
                    {t("hero.title")}{" "}
                    <Text as="span" color="brand.400">
                      {t("hero.titleHighlight")}
                    </Text>
                  </Heading>
                  <Text fontSize={{ base: "lg", md: "xl" }} color="gray.400" lineHeight="1.7" maxW="500px">
                    {t("hero.subtitle")}
                  </Text>
                </Stack>

                <Stack gap={3}>
                  <BenefitItem>{t("benefits.item1")}</BenefitItem>
                  <BenefitItem>{t("benefits.item2")}</BenefitItem>
                  <BenefitItem>{t("benefits.item3")}</BenefitItem>
                  <BenefitItem>{t("benefits.item4")}</BenefitItem>
                </Stack>

                <Flex gap={10} pt={4} display={{ base: "none", md: "flex" }}>
                  <Stack gap={1}>
                    <Text fontWeight="bold" fontSize="2xl" color="white" fontFamily="heading">
                      {t("stats.duration")}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      {t("stats.durationLabel")}
                    </Text>
                  </Stack>
                  <Box w="1px" bg="rgba(255, 255, 255, 0.1)" />
                  <Stack gap={1}>
                    <Text fontWeight="bold" fontSize="2xl" color="white" fontFamily="heading">
                      {t("stats.candidates")}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      {t("stats.candidatesLabel")}
                    </Text>
                  </Stack>
                  <Box w="1px" bg="rgba(255, 255, 255, 0.1)" />
                  <Stack gap={1}>
                    <Text fontWeight="bold" fontSize="2xl" color="white" fontFamily="heading">
                      {t("stats.time")}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      {t("stats.timeLabel")}
                    </Text>
                  </Stack>
                </Flex>
              </Stack>
            </AnimatedSection>

            {/* Right Column - Form */}
            <AnimatedSection variants={fadeInUp} delay={0.2}>
              <PilotRequestForm />
            </AnimatedSection>
          </Grid>
        </Container>
      </Box>

      {/* What's Included Section */}
      <Box py={{ base: 16, md: 24 }} bg="#08080A">
        <Container maxW="container.xl" px={{ base: 4, md: 8 }}>
          <Stack gap={14}>
            <AnimatedSection variants={fadeInUp}>
              <Stack gap={4} textAlign="center" maxW="2xl" mx="auto">
                <Text fontSize="xs" fontWeight="semibold" color="brand.400" textTransform="uppercase" letterSpacing="0.15em">
                  {t("includes.label")}
                </Text>
                <Heading as="h2" fontSize={{ base: "2xl", md: "3xl", lg: "3.5rem" }} color="white" fontWeight="700" letterSpacing="-0.02em">
                  {t("includes.title")}
                </Heading>
              </Stack>
            </AnimatedSection>

            <StaggeredContainer>
              <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={6} alignItems="stretch">
                <StaggeredItem h="full">
                  <IncludeCard icon={<FileTextIcon />} title={t("includes.items.workSample.title")} description={t("includes.items.workSample.description")} />
                </StaggeredItem>
                <StaggeredItem h="full">
                  <IncludeCard icon={<ListChecksIcon />} title={t("includes.items.rubric.title")} description={t("includes.items.rubric.description")} />
                </StaggeredItem>
                <StaggeredItem h="full">
                  <IncludeCard icon={<BotIcon />} title={t("includes.items.aiEval.title")} description={t("includes.items.aiEval.description")} />
                </StaggeredItem>
                <StaggeredItem h="full">
                  <IncludeCard icon={<UserCheckIcon />} title={t("includes.items.humanReview.title")} description={t("includes.items.humanReview.description")} />
                </StaggeredItem>
                <StaggeredItem h="full">
                  <IncludeCard icon={<ClipboardCheckIcon />} title={t("includes.items.decisionMemo.title")} description={t("includes.items.decisionMemo.description")} />
                </StaggeredItem>
                <StaggeredItem h="full">
                  <IncludeCard icon={<MessageSquareIcon />} title={t("includes.items.feedback.title")} description={t("includes.items.feedback.description")} />
                </StaggeredItem>
              </Grid>
            </StaggeredContainer>
          </Stack>
        </Container>
      </Box>

      {/* Timeline + Requirements Section */}
      <Box py={{ base: 16, md: 24 }} bg="#0A0A0B" position="relative" overflow="hidden">
        <Box position="absolute" inset={0} overflow="hidden" pointerEvents="none">
          <Glow color="rgba(20, 184, 166, 0.1)" size="500px" top="20%" right="-10%" intensity={0.8} />
        </Box>

        <Container maxW="container.xl" px={{ base: 4, md: 8 }} position="relative">
          <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={{ base: 14, lg: 20 }}>
            <AnimatedSection variants={fadeInUp}>
              <Stack gap={8}>
                <Stack gap={4}>
                  <Text fontSize="xs" fontWeight="semibold" color="brand.400" textTransform="uppercase" letterSpacing="0.15em">
                    {t("timeline.label")}
                  </Text>
                  <Heading as="h2" fontSize={{ base: "2xl", md: "3xl" }} color="white" fontWeight="700" letterSpacing="-0.02em">
                    {t("timeline.title")}
                  </Heading>
                </Stack>

                <Stack gap={0}>
                  <TimelineStep number={1} title={t("timeline.weeks.week1.title")} description={t("timeline.weeks.week1.description")} />
                  <TimelineStep number={2} title={t("timeline.weeks.week2.title")} description={t("timeline.weeks.week2.description")} />
                  <TimelineStep number={3} title={t("timeline.weeks.week3.title")} description={t("timeline.weeks.week3.description")} />
                  <TimelineStep number={4} title={t("timeline.weeks.week4.title")} description={t("timeline.weeks.week4.description")} isLast />
                </Stack>
              </Stack>
            </AnimatedSection>

            <AnimatedSection variants={fadeInUp} delay={0.2}>
              <Stack gap={8}>
                <Stack gap={4}>
                  <Text fontSize="xs" fontWeight="semibold" color="brand.400" textTransform="uppercase" letterSpacing="0.15em">
                    {t("requirements.label")}
                  </Text>
                  <Heading as="h2" fontSize={{ base: "2xl", md: "3xl" }} color="white" fontWeight="700" letterSpacing="-0.02em">
                    {t("requirements.title")}
                  </Heading>
                </Stack>

                <Stack gap={4}>
                  <RequirementCard icon={<BriefcaseIcon />} title={t("requirements.items.job.title")} description={t("requirements.items.job.description")} />
                  <RequirementCard icon={<ClockIcon />} title={t("requirements.items.time.title")} description={t("requirements.items.time.description")} />
                  <RequirementCard icon={<HeartHandshakeIcon />} title={t("requirements.items.feedback.title")} description={t("requirements.items.feedback.description")} />
                </Stack>
              </Stack>
            </AnimatedSection>
          </Grid>
        </Container>
      </Box>

      {/* KPIs Section */}
      <Box py={{ base: 16, md: 24 }} bg="#08080A">
        <Container maxW="container.xl" px={{ base: 4, md: 8 }}>
          <Stack gap={12}>
            <AnimatedSection variants={fadeInUp}>
              <Stack gap={4} textAlign="center" maxW="2xl" mx="auto">
                <Text fontSize="xs" fontWeight="semibold" color="brand.400" textTransform="uppercase" letterSpacing="0.15em">
                  {t("kpis.label")}
                </Text>
                <Heading as="h2" fontSize={{ base: "2xl", md: "3xl", lg: "3.5rem" }} color="white" fontWeight="700" letterSpacing="-0.02em">
                  {t("kpis.title")}
                </Heading>
              </Stack>
            </AnimatedSection>

            <StaggeredContainer>
              <Grid templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(6, 1fr)" }} gap={4}>
                <StaggeredItem>
                  <KpiCard value={t("kpis.items.candidateTime.value")} label={t("kpis.items.candidateTime.label")} />
                </StaggeredItem>
                <StaggeredItem>
                  <KpiCard value={t("kpis.items.completionRate.value")} label={t("kpis.items.completionRate.label")} />
                </StaggeredItem>
                <StaggeredItem>
                  <KpiCard value={t("kpis.items.criteriaAccuracy.value")} label={t("kpis.items.criteriaAccuracy.label")} />
                </StaggeredItem>
                <StaggeredItem>
                  <KpiCard value={t("kpis.items.candidateSat.value")} label={t("kpis.items.candidateSat.label")} />
                </StaggeredItem>
                <StaggeredItem>
                  <KpiCard value={t("kpis.items.hmSat.value")} label={t("kpis.items.hmSat.label")} />
                </StaggeredItem>
                <StaggeredItem>
                  <KpiCard value={t("kpis.items.timeToFeedback.value")} label={t("kpis.items.timeToFeedback.label")} />
                </StaggeredItem>
              </Grid>
            </StaggeredContainer>
          </Stack>
        </Container>
      </Box>

      {/* Pricing Section */}
      <Box py={{ base: 16, md: 24 }} bg="#0A0A0B" position="relative" overflow="hidden">
        <Box position="absolute" inset={0} overflow="hidden" pointerEvents="none">
          <Glow color="rgba(20, 184, 166, 0.1)" size="500px" top="50%" left="50%" style={{ transform: "translate(-50%, -50%)" }} />
        </Box>

        <Container maxW="container.xl" px={{ base: 4, md: 8 }} position="relative">
          <AnimatedSection variants={fadeInUp}>
            <Box
              bg="rgba(255, 255, 255, 0.02)"
              p={{ base: 8, md: 10 }}
              borderRadius="2xl"
              border="1px solid"
              borderColor="rgba(255, 255, 255, 0.08)"
              boxShadow="0 0 60px rgba(20, 184, 166, 0.08)"
              maxW="xl"
              mx="auto"
            >
              <Stack gap={6}>
                <Stack gap={2}>
                  <Flex gap={2} alignItems="center">
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      color="white"
                      bg="linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)"
                      px={3}
                      py={1}
                      borderRadius="full"
                      textTransform="uppercase"
                    >
                      {t("pricing.badge")}
                    </Text>
                  </Flex>
                  <Heading as="h3" fontSize="2xl" color="white" fontWeight="bold">
                    {t("pricing.title")}
                  </Heading>
                  <Text color="gray.400" fontSize="sm">
                    {t("pricing.description")}
                  </Text>
                </Stack>

                <Box w="full" h="1px" bg="rgba(255, 255, 255, 0.08)" />

                <Stack gap={3}>
                  {Object.values(t("pricing.features", { returnObjects: true }) as Record<string, string>).map((item, i) => (
                    <Flex key={i} gap={3} alignItems="center">
                      <Circle size="20px" bg="rgba(20, 184, 166, 0.15)" color="brand.400">
                        <CheckIcon />
                      </Circle>
                      <Text color="gray.300" fontSize="sm">
                        {item}
                      </Text>
                    </Flex>
                  ))}
                </Stack>

                <Button
                  size="lg"
                  w="full"
                  bg="linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)"
                  color="white"
                  fontWeight="600"
                  borderRadius="xl"
                  boxShadow="0 4px 20px rgba(20, 184, 166, 0.3)"
                  _hover={{ transform: "translateY(-2px)", boxShadow: "0 8px 30px rgba(20, 184, 166, 0.4)" }}
                  _active={{ transform: "translateY(0)" }}
                  transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                >
                  {t("pricing.button")}
                </Button>
              </Stack>
            </Box>
          </AnimatedSection>
        </Container>
      </Box>

      {/* FAQ Section */}
      <Box py={{ base: 16, md: 24 }} bg="#08080A">
        <Container maxW="container.lg" px={{ base: 4, md: 8 }}>
          <Stack gap={12}>
            <AnimatedSection variants={fadeInUp}>
              <Stack gap={4} textAlign="center" maxW="2xl" mx="auto">
                <Text fontSize="xs" fontWeight="semibold" color="brand.400" textTransform="uppercase" letterSpacing="0.15em">
                  {t("faq.label")}
                </Text>
                <Heading as="h2" fontSize={{ base: "2xl", md: "3xl", lg: "3.5rem" }} color="white" fontWeight="700" letterSpacing="-0.02em">
                  {t("faq.title")}
                </Heading>
              </Stack>
            </AnimatedSection>

            <AnimatedSection variants={fadeInUp} delay={0.1}>
              <Accordion.Root collapsible>
                <FaqItem question={t("faq.items.realJob.question")} answer={t("faq.items.realJob.answer")} />
                <FaqItem question={t("faq.items.cost.question")} answer={t("faq.items.cost.answer")} />
                <FaqItem question={t("faq.items.time.question")} answer={t("faq.items.time.answer")} />
                <FaqItem question={t("faq.items.candidates.question")} answer={t("faq.items.candidates.answer")} />
                <FaqItem question={t("faq.items.after.question")} answer={t("faq.items.after.answer")} />
                <FaqItem question={t("faq.items.techStack.question")} answer={t("faq.items.techStack.answer")} />
              </Accordion.Root>
            </AnimatedSection>
          </Stack>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box py={{ base: 16, md: 24 }} bg="#0A0A0B" position="relative" overflow="hidden">
        <Box position="absolute" inset={0} overflow="hidden" pointerEvents="none">
          <Glow color="rgba(20, 184, 166, 0.15)" size="500px" top="50%" left="50%" style={{ transform: "translate(-50%, -50%)" }} />
        </Box>

        <Container maxW="container.md" px={{ base: 4, md: 8 }} position="relative">
          <AnimatedSection variants={fadeInUp}>
            <Stack gap={8} textAlign="center" alignItems="center">
              <Heading as="h2" fontSize={{ base: "2xl", md: "3xl", lg: "3.5rem" }} color="white" fontWeight="700" letterSpacing="-0.02em">
                {t("cta.title")}
              </Heading>
              <Text color="gray.400" fontSize="lg" maxW="xl" lineHeight="1.8">
                {t("cta.description")}
              </Text>
              <Button
                h={14}
                px={8}
                bg="linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)"
                color="white"
                fontWeight="600"
                borderRadius="xl"
                fontSize="md"
                boxShadow="0 4px 20px rgba(20, 184, 166, 0.3)"
                _hover={{ transform: "translateY(-2px)", boxShadow: "0 8px 30px rgba(20, 184, 166, 0.4)" }}
                _active={{ transform: "translateY(0)" }}
                transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                {t("cta.button")}
              </Button>
            </Stack>
          </AnimatedSection>
        </Container>
      </Box>
    </Layout>
  );
}
