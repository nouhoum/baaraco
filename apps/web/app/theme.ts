import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    tokens: {
      fonts: {
        body: {
          value:
            "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        },
        heading: {
          value:
            "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        },
        mono: {
          value:
            "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        },
      },
      colors: {
        // Baara brand teal palette
        brand: {
          50: { value: "#F0FDFA" },
          100: { value: "#CCFBF1" },
          200: { value: "#99F6E4" },
          300: { value: "#5EEAD4" },
          400: { value: "#2DD4BF" },
          500: { value: "#14B8A6" }, // Accent color
          600: { value: "#0D9488" },
          700: { value: "#0F766E" }, // Primary color
          800: { value: "#115E59" },
          900: { value: "#134E4A" },
          950: { value: "#042F2E" },
        },
      },
      radii: {
        sm: { value: "6px" },
        md: { value: "8px" },
        lg: { value: "12px" },
        xl: { value: "16px" },
        "2xl": { value: "24px" },
      },
      shadows: {
        xs: { value: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" },
        card: { value: "0 1px 3px rgba(16, 24, 40, 0.06), 0 1px 2px rgba(16, 24, 40, 0.04)" },
        cardHover: { value: "0 4px 12px rgba(16, 24, 40, 0.08), 0 2px 4px rgba(16, 24, 40, 0.04)" },
        elevated: { value: "0 10px 25px rgba(16, 24, 40, 0.1), 0 4px 10px rgba(16, 24, 40, 0.05)" },
      },
    },
    semanticTokens: {
      colors: {
        // Background colors
        bg: {
          value: { base: "{colors.gray.50}", _dark: "{colors.gray.950}" },
        },
        "bg.subtle": {
          value: { base: "{colors.gray.100}", _dark: "{colors.gray.900}" },
        },
        "bg.muted": {
          value: { base: "{colors.gray.200}", _dark: "{colors.gray.800}" },
        },
        surface: {
          value: { base: "{colors.white}", _dark: "{colors.gray.900}" },
        },

        // Border colors
        border: {
          value: { base: "{colors.gray.200}", _dark: "{colors.gray.800}" },
        },
        "border.subtle": {
          value: { base: "{colors.gray.100}", _dark: "{colors.gray.800}" },
        },

        // Text colors
        text: {
          value: { base: "{colors.gray.900}", _dark: "{colors.gray.50}" },
        },
        "text.muted": {
          value: { base: "{colors.gray.700}", _dark: "{colors.gray.300}" },
        },
        "text.subtle": {
          value: { base: "{colors.gray.500}", _dark: "{colors.gray.500}" },
        },

        // Brand / Primary colors (Teal)
        primary: {
          value: { base: "{colors.brand.700}", _dark: "{colors.brand.500}" },
        },
        "primary.hover": {
          value: { base: "{colors.brand.800}", _dark: "{colors.brand.400}" },
        },
        "primary.subtle": {
          value: { base: "{colors.brand.50}", _dark: "{colors.brand.950}" },
        },
        "primary.muted": {
          value: { base: "{colors.brand.100}", _dark: "{colors.brand.900}" },
        },
        "primary.fg": {
          value: { base: "{colors.white}", _dark: "{colors.brand.950}" },
        },

        // Accent colors
        accent: {
          value: { base: "{colors.brand.500}", _dark: "{colors.brand.400}" },
        },
        "accent.hover": {
          value: { base: "{colors.brand.600}", _dark: "{colors.brand.300}" },
        },
        "accent.subtle": {
          value: { base: "{colors.brand.100}", _dark: "{colors.brand.900}" },
        },

        // Success colors (using brand teal for consistency)
        success: {
          value: { base: "{colors.brand.600}", _dark: "{colors.brand.400}" },
        },
        "success.subtle": {
          value: { base: "{colors.brand.50}", _dark: "{colors.brand.950}" },
        },

        // Error colors
        error: {
          value: { base: "{colors.red.600}", _dark: "{colors.red.400}" },
        },
        "error.subtle": {
          value: { base: "{colors.red.50}", _dark: "{colors.red.950}" },
        },

        // Warning colors
        warning: {
          value: { base: "{colors.amber.500}", _dark: "{colors.amber.400}" },
        },
        "warning.subtle": {
          value: { base: "{colors.amber.50}", _dark: "{colors.amber.950}" },
        },

        // Info colors
        info: {
          value: { base: "{colors.blue.600}", _dark: "{colors.blue.400}" },
        },
        "info.subtle": {
          value: { base: "{colors.blue.50}", _dark: "{colors.blue.950}" },
        },
      },
    },
  },
  globalCss: {
    "html, body": {
      bg: "bg",
      color: "text",
      minHeight: "100vh",
    },
    "::selection": {
      bg: "primary.muted",
      color: "primary",
    },
  },
});

export const system = createSystem(defaultConfig, config);

// Export brand colors for direct use in components
export const brandColors = {
  primary: "#0F766E",
  accent: "#14B8A6",
  accentLight: "#5EEAD4",
} as const;
