import { useParams, useLocation, useNavigate } from "react-router";
import { Button, Flex } from "@chakra-ui/react";
import { supportedLanguages, type SupportedLanguage } from "~/i18n";

const languageLabels: Record<SupportedLanguage, string> = {
  fr: "FR",
  en: "EN",
};

export function LanguageSwitcher() {
  const { lang } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const currentLang = (lang as SupportedLanguage) || "fr";

  const switchLanguage = (newLang: SupportedLanguage) => {
    if (newLang === currentLang) return;

    // Replace the language prefix in the current path
    const newPath = location.pathname.replace(`/${currentLang}`, `/${newLang}`);
    navigate(newPath + location.search);
  };

  return (
    <Flex
      gap={0.5}
      alignItems="center"
      bg="rgba(255, 255, 255, 0.06)"
      p={1}
      borderRadius="full"
      border="1px solid"
      borderColor="rgba(255, 255, 255, 0.08)"
    >
      {supportedLanguages.map((langCode) => (
        <Button
          key={langCode}
          variant="ghost"
          size="xs"
          px={3}
          minW="36px"
          fontWeight={currentLang === langCode ? "600" : "medium"}
          color={currentLang === langCode ? "white" : "gray.400"}
          bg={currentLang === langCode ? "rgba(255, 255, 255, 0.12)" : "transparent"}
          borderRadius="full"
          _hover={{
            color: "white",
            bg: currentLang === langCode ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.08)",
          }}
          transition="all 0.2s"
          onClick={() => switchLanguage(langCode)}
        >
          {languageLabels[langCode]}
        </Button>
      ))}
    </Flex>
  );
}
