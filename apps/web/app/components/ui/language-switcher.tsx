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
    <Flex gap={1} alignItems="center">
      {supportedLanguages.map((langCode, index) => (
        <Flex key={langCode} alignItems="center">
          {index > 0 && (
            <Flex
              w="1px"
              h={4}
              bg="gray.300"
              mx={1}
            />
          )}
          <Button
            variant="ghost"
            size="xs"
            px={2}
            fontWeight={currentLang === langCode ? "bold" : "medium"}
            color={currentLang === langCode ? "brand.700" : "gray.500"}
            _hover={{
              color: "brand.700",
              bg: "transparent",
            }}
            onClick={() => switchLanguage(langCode)}
          >
            {languageLabels[langCode]}
          </Button>
        </Flex>
      ))}
    </Flex>
  );
}
