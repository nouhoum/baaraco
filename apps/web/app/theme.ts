import {
  createSystem,
  defaultConfig,
  defineConfig,
  defineRecipe,
  defineSlotRecipe,
} from "@chakra-ui/react";

// ============================================================================
// RECIPES - Reusable component styles
// ============================================================================

const headingRecipe = defineRecipe({
  base: {
    fontWeight: "600",
    letterSpacing: "-0.025em",
    color: "text",
  },
  variants: {
    size: {
      xs: { fontSize: "xs", lineHeight: "1.4" },
      sm: { fontSize: "sm", lineHeight: "1.4" },
      md: { fontSize: "md", lineHeight: "1.3" },
      lg: { fontSize: "lg", lineHeight: "1.3" },
      xl: { fontSize: "xl", lineHeight: "1.2" },
      "2xl": { fontSize: "2xl", lineHeight: "1.2" },
      "3xl": { fontSize: "3xl", lineHeight: "1.1" },
      "4xl": { fontSize: "4xl", lineHeight: "1.1" },
    },
  },
  defaultVariants: {
    size: "xl",
  },
});

const buttonRecipe = defineRecipe({
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "2",
    fontWeight: "500",
    borderRadius: "lg",
    cursor: "pointer",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    outline: "none",
    _focusVisible: {
      ring: "2px",
      ringColor: "primary",
      ringOffset: "2px",
    },
    _disabled: {
      opacity: 0.5,
      cursor: "not-allowed",
      pointerEvents: "none",
    },
  },
  variants: {
    variant: {
      solid: {
        bg: "primary",
        color: "white",
        shadow: "button",
        _hover: {
          bg: "primary.hover",
          transform: "translateY(-1px)",
          shadow: "buttonHover",
        },
        _active: {
          transform: "translateY(0)",
          shadow: "button",
        },
      },
      outline: {
        bg: "transparent",
        color: "text.secondary",
        border: "1px solid",
        borderColor: "border",
        _hover: {
          bg: "bg.subtle",
          borderColor: "border.emphasis",
          color: "text",
        },
      },
      ghost: {
        bg: "transparent",
        color: "text.muted",
        border: "none",
        _hover: {
          bg: "bg.subtle",
          color: "text",
        },
      },
      danger: {
        bg: "error",
        color: "white",
        _hover: {
          opacity: 0.9,
        },
      },
    },
    size: {
      xs: { h: "7", px: "2.5", fontSize: "xs" },
      sm: { h: "8", px: "3", fontSize: "sm" },
      md: { h: "10", px: "4", fontSize: "sm" },
      lg: { h: "12", px: "6", fontSize: "md" },
      xl: { h: "14", px: "8", fontSize: "md" },
    },
  },
  defaultVariants: {
    variant: "solid",
    size: "md",
  },
});

const inputRecipe = defineRecipe({
  base: {
    width: "full",
    bg: "surface",
    color: "text",
    border: "1px solid",
    borderColor: "border",
    borderRadius: "lg",
    fontSize: "sm",
    transition: "all 0.2s",
    _placeholder: {
      color: "text.placeholder",
    },
    _hover: {
      borderColor: "border.emphasis",
    },
    _focus: {
      borderColor: "primary",
      ring: "3px",
      ringColor: "primary.subtle",
      outline: "none",
    },
    _disabled: {
      opacity: 0.5,
      cursor: "not-allowed",
    },
  },
  variants: {
    size: {
      sm: { h: "8", px: "3", fontSize: "xs" },
      md: { h: "10", px: "4", fontSize: "sm" },
      lg: { h: "12", px: "4", fontSize: "md" },
    },
    variant: {
      outline: {},
      ghost: {
        border: "none",
        bg: "transparent",
        _hover: { bg: "bg.subtle" },
        _focus: { bg: "bg.subtle", ring: "none" },
      },
    },
  },
  defaultVariants: {
    size: "md",
    variant: "outline",
  },
});

const cardRecipe = defineSlotRecipe({
  slots: ["root", "header", "body", "footer"],
  base: {
    root: {
      bg: "surface",
      border: "1px solid",
      borderColor: "border",
      borderRadius: "2xl",
      overflow: "hidden",
      transition: "all 0.2s",
    },
    header: {
      px: "6",
      py: "4",
      borderBottom: "1px solid",
      borderColor: "border.subtle",
    },
    body: {
      px: "6",
      py: "5",
    },
    footer: {
      px: "6",
      py: "4",
      borderTop: "1px solid",
      borderColor: "border.subtle",
    },
  },
  variants: {
    variant: {
      elevated: {
        root: {
          shadow: "card",
          border: "none",
          _hover: { shadow: "cardHover" },
        },
      },
      outline: {
        root: {
          _hover: { borderColor: "border.emphasis", shadow: "sm" },
        },
      },
      ghost: {
        root: {
          bg: "transparent",
          border: "none",
        },
      },
    },
    size: {
      sm: {
        header: { px: "4", py: "3" },
        body: { px: "4", py: "4" },
        footer: { px: "4", py: "3" },
      },
      md: {},
      lg: {
        header: { px: "8", py: "5" },
        body: { px: "8", py: "6" },
        footer: { px: "8", py: "5" },
      },
    },
  },
  defaultVariants: {
    variant: "outline",
    size: "md",
  },
});

const badgeRecipe = defineRecipe({
  base: {
    display: "inline-flex",
    alignItems: "center",
    gap: "1",
    fontWeight: "500",
    fontSize: "xs",
    lineHeight: "1",
    whiteSpace: "nowrap",
    borderRadius: "md",
    transition: "all 0.15s",
  },
  variants: {
    visual: {
      solid: {
        bg: "primary",
        color: "white",
      },
      subtle: {
        bg: "primary.subtle",
        color: "primary",
      },
      outline: {
        border: "1px solid",
        borderColor: "primary",
        color: "primary",
      },
      surface: {
        bg: "bg.subtle",
        color: "text.muted",
      },
    },
    size: {
      sm: { px: "1.5", py: "0.5", fontSize: "2xs" },
      md: { px: "2", py: "1", fontSize: "xs" },
      lg: { px: "2.5", py: "1.5", fontSize: "sm" },
    },
  },
  defaultVariants: {
    visual: "subtle",
    size: "md",
  },
});

// ============================================================================
// THEME CONFIGURATION
// ============================================================================

const config = defineConfig({
  theme: {
    recipes: {
      heading: headingRecipe,
      button: buttonRecipe,
      input: inputRecipe,
      badge: badgeRecipe,
    },
    slotRecipes: {
      card: cardRecipe,
    },
    keyframes: {
      fadeIn: {
        from: { opacity: "0", transform: "translateY(8px)" },
        to: { opacity: "1", transform: "translateY(0)" },
      },
      fadeInUp: {
        from: { opacity: "0", transform: "translateY(16px)" },
        to: { opacity: "1", transform: "translateY(0)" },
      },
      slideInLeft: {
        from: { opacity: "0", transform: "translateX(-16px)" },
        to: { opacity: "1", transform: "translateX(0)" },
      },
      ping: {
        "75%, 100%": { transform: "scale(1.3)", opacity: "0" },
      },
      pulse: {
        "0%, 100%": { opacity: "1" },
        "50%": { opacity: "0.7" },
      },
      shimmer: {
        from: { backgroundPosition: "-200% 0" },
        to: { backgroundPosition: "200% 0" },
      },
      spin: {
        from: { transform: "rotate(0deg)" },
        to: { transform: "rotate(360deg)" },
      },
    },
    tokens: {
      fonts: {
        heading: {
          value:
            "'Cabinet Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        },
        body: {
          value:
            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        },
        mono: {
          value: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
        },
      },
      fontSizes: {
        "2xs": { value: "0.625rem" }, // 10px
        xs: { value: "0.75rem" }, // 12px
        sm: { value: "0.875rem" }, // 14px (was 13px — improves body readability)
        md: { value: "0.9375rem" }, // 15px (was 14px — clear step above sm)
        lg: { value: "1rem" }, // 16px
        xl: { value: "1.125rem" }, // 18px
        "2xl": { value: "1.375rem" }, // 22px
        "3xl": { value: "1.75rem" }, // 28px
        "4xl": { value: "2.25rem" }, // 36px
        "5xl": { value: "3rem" }, // 48px
      },
      fontWeights: {
        light: { value: "300" },
        normal: { value: "400" },
        medium: { value: "500" },
        semibold: { value: "600" },
        bold: { value: "700" },
        extrabold: { value: "800" },
      },
      letterSpacings: {
        tighter: { value: "-0.03em" },
        tight: { value: "-0.02em" },
        normal: { value: "-0.01em" },
        wide: { value: "0.02em" },
        wider: { value: "0.04em" },
      },
      lineHeights: {
        none: { value: "1" },
        tight: { value: "1.2" },
        snug: { value: "1.35" },
        normal: { value: "1.5" },
        relaxed: { value: "1.65" },
      },
      colors: {
        // Sophisticated slate-based neutral palette
        slate: {
          25: { value: "#FCFCFD" },
          50: { value: "#F8FAFC" },
          100: { value: "#F1F5F9" },
          200: { value: "#E2E8F0" },
          300: { value: "#CBD5E1" },
          400: { value: "#94A3B8" },
          500: { value: "#64748B" },
          600: { value: "#475569" },
          700: { value: "#334155" },
          800: { value: "#1E293B" },
          900: { value: "#0F172A" },
          950: { value: "#020617" },
        },
        // Brand teal - refined and professional
        brand: {
          50: { value: "#F0FDFA" },
          100: { value: "#CCFBF1" },
          200: { value: "#99F6E4" },
          300: { value: "#5EEAD4" },
          400: { value: "#2DD4BF" },
          500: { value: "#14B8A6" },
          600: { value: "#0D9488" },
          700: { value: "#0F766E" },
          800: { value: "#115E59" },
          900: { value: "#134E4A" },
          950: { value: "#042F2E" },
        },
        // Accent blue for info states
        blue: {
          50: { value: "#EFF6FF" },
          100: { value: "#DBEAFE" },
          200: { value: "#BFDBFE" },
          500: { value: "#3B82F6" },
          600: { value: "#2563EB" },
          700: { value: "#1D4ED8" },
        },
        // Success green
        green: {
          50: { value: "#F0FDF4" },
          100: { value: "#DCFCE7" },
          500: { value: "#22C55E" },
          600: { value: "#16A34A" },
          700: { value: "#15803D" },
        },
        // Warning amber
        amber: {
          50: { value: "#FFFBEB" },
          100: { value: "#FEF3C7" },
          500: { value: "#F59E0B" },
          600: { value: "#D97706" },
          700: { value: "#B45309" },
        },
        // Error red
        red: {
          50: { value: "#FEF2F2" },
          100: { value: "#FEE2E2" },
          500: { value: "#EF4444" },
          600: { value: "#DC2626" },
          700: { value: "#B91C1C" },
        },
        // Purple for special states
        purple: {
          50: { value: "#FAF5FF" },
          100: { value: "#F3E8FF" },
          500: { value: "#A855F7" },
          600: { value: "#9333EA" },
          700: { value: "#7C3AED" },
        },
      },
      spacing: {
        px: { value: "1px" },
        0: { value: "0" },
        0.5: { value: "0.125rem" }, // 2px
        1: { value: "0.25rem" }, // 4px
        1.5: { value: "0.375rem" }, // 6px
        2: { value: "0.5rem" }, // 8px
        2.5: { value: "0.625rem" }, // 10px
        3: { value: "0.75rem" }, // 12px
        3.5: { value: "0.875rem" }, // 14px
        4: { value: "1rem" }, // 16px
        5: { value: "1.25rem" }, // 20px
        6: { value: "1.5rem" }, // 24px
        7: { value: "1.75rem" }, // 28px
        8: { value: "2rem" }, // 32px
        9: { value: "2.25rem" }, // 36px
        10: { value: "2.5rem" }, // 40px
        12: { value: "3rem" }, // 48px
        14: { value: "3.5rem" }, // 56px
        16: { value: "4rem" }, // 64px
        20: { value: "5rem" }, // 80px
        24: { value: "6rem" }, // 96px
      },
      radii: {
        none: { value: "0" },
        sm: { value: "0.25rem" }, // 4px
        md: { value: "0.375rem" }, // 6px
        lg: { value: "0.5rem" }, // 8px
        xl: { value: "0.75rem" }, // 12px
        "2xl": { value: "1rem" }, // 16px
        "3xl": { value: "1.5rem" }, // 24px
        full: { value: "9999px" },
      },
      shadows: {
        xs: { value: "0 1px 2px 0 rgba(0, 0, 0, 0.03)" },
        sm: {
          value:
            "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)",
        },
        md: {
          value:
            "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.03)",
        },
        lg: {
          value:
            "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.03)",
        },
        xl: {
          value:
            "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)",
        },
        // Card shadows
        card: {
          value: "0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)",
        },
        cardHover: {
          value:
            "0 8px 24px rgba(0, 0, 0, 0.06), 0 4px 8px rgba(0, 0, 0, 0.03)",
        },
        // Button shadows
        button: {
          value:
            "0 1px 3px rgba(15, 118, 110, 0.15), 0 1px 2px rgba(15, 118, 110, 0.1)",
        },
        buttonHover: {
          value:
            "0 4px 12px rgba(15, 118, 110, 0.2), 0 2px 4px rgba(15, 118, 110, 0.1)",
        },
        // Input focus
        inputFocus: { value: "0 0 0 3px rgba(15, 118, 110, 0.1)" },
        // Elevated surfaces
        elevated: {
          value:
            "0 12px 40px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04)",
        },
        // Overlay
        overlay: { value: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" },
        // Inner shadow
        inner: { value: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.03)" },
        // Navbar
        navbar: { value: "0 1px 0 0 rgba(0, 0, 0, 0.05)" },
        navbarScrolled: {
          value: "0 4px 12px rgba(0, 0, 0, 0.04), 0 1px 0 rgba(0, 0, 0, 0.03)",
        },
      },
      durations: {
        fastest: { value: "50ms" },
        fast: { value: "100ms" },
        normal: { value: "200ms" },
        slow: { value: "300ms" },
        slower: { value: "400ms" },
      },
      easings: {
        default: { value: "cubic-bezier(0.4, 0, 0.2, 1)" },
        linear: { value: "linear" },
        in: { value: "cubic-bezier(0.4, 0, 1, 1)" },
        out: { value: "cubic-bezier(0, 0, 0.2, 1)" },
        inOut: { value: "cubic-bezier(0.4, 0, 0.2, 1)" },
        bounce: { value: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
      },
      animations: {
        fadeIn: { value: "fadeIn 0.3s ease-out forwards" },
        fadeInUp: { value: "fadeInUp 0.4s ease-out forwards" },
        slideInLeft: { value: "slideInLeft 0.3s ease-out forwards" },
        ping: { value: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite" },
        pulse: { value: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" },
        shimmer: { value: "shimmer 2s ease-in-out infinite" },
        spin: { value: "spin 1s linear infinite" },
      },
    },
    semanticTokens: {
      colors: {
        // ========== BACKGROUNDS ==========
        bg: {
          value: { base: "{colors.slate.25}", _dark: "{colors.slate.950}" },
        },
        "bg.subtle": {
          value: { base: "{colors.slate.50}", _dark: "{colors.slate.900}" },
        },
        "bg.muted": {
          value: { base: "{colors.slate.100}", _dark: "{colors.slate.800}" },
        },
        "bg.emphasis": {
          value: { base: "{colors.slate.200}", _dark: "{colors.slate.700}" },
        },
        surface: {
          value: { base: "{colors.white}", _dark: "{colors.slate.900}" },
        },
        "surface.raised": {
          value: { base: "{colors.white}", _dark: "{colors.slate.800}" },
        },

        // ========== BORDERS ==========
        border: {
          value: { base: "{colors.slate.200}", _dark: "{colors.slate.800}" },
        },
        "border.subtle": {
          value: { base: "{colors.slate.100}", _dark: "{colors.slate.800}" },
        },
        "border.emphasis": {
          value: { base: "{colors.slate.300}", _dark: "{colors.slate.700}" },
        },

        // ========== TEXT ==========
        text: {
          value: { base: "{colors.slate.900}", _dark: "{colors.slate.50}" },
        },
        "text.secondary": {
          value: { base: "{colors.slate.700}", _dark: "{colors.slate.300}" },
        },
        "text.muted": {
          value: { base: "{colors.slate.600}", _dark: "{colors.slate.400}" },
        },
        "text.subtle": {
          value: { base: "{colors.slate.500}", _dark: "{colors.slate.500}" },
        },
        "text.placeholder": {
          value: { base: "{colors.slate.500}", _dark: "{colors.slate.500}" },
        },

        // ========== PRIMARY (Brand Teal) ==========
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
        "primary.emphasis": {
          value: { base: "{colors.brand.600}", _dark: "{colors.brand.500}" },
        },
        "primary.fg": {
          value: { base: "{colors.white}", _dark: "{colors.brand.950}" },
        },

        // ========== ACCENT ==========
        accent: {
          value: { base: "{colors.brand.500}", _dark: "{colors.brand.400}" },
        },
        "accent.subtle": {
          value: { base: "{colors.brand.100}", _dark: "{colors.brand.900}" },
        },

        // ========== SUCCESS ==========
        success: {
          value: { base: "{colors.green.600}", _dark: "{colors.green.500}" },
        },
        "success.subtle": {
          value: { base: "{colors.green.50}", _dark: "{colors.green.950}" },
        },
        "success.muted": {
          value: { base: "{colors.green.100}", _dark: "{colors.green.900}" },
        },

        // ========== ERROR ==========
        error: {
          value: { base: "{colors.red.600}", _dark: "{colors.red.500}" },
        },
        "error.subtle": {
          value: { base: "{colors.red.50}", _dark: "{colors.red.950}" },
        },
        "error.muted": {
          value: { base: "{colors.red.100}", _dark: "{colors.red.900}" },
        },

        // ========== WARNING ==========
        warning: {
          value: { base: "{colors.amber.600}", _dark: "{colors.amber.500}" },
        },
        "warning.subtle": {
          value: { base: "{colors.amber.50}", _dark: "{colors.amber.950}" },
        },
        "warning.muted": {
          value: { base: "{colors.amber.100}", _dark: "{colors.amber.900}" },
        },

        // ========== INFO ==========
        info: {
          value: { base: "{colors.blue.600}", _dark: "{colors.blue.500}" },
        },
        "info.subtle": {
          value: { base: "{colors.blue.50}", _dark: "{colors.blue.950}" },
        },
        "info.muted": {
          value: { base: "{colors.blue.100}", _dark: "{colors.blue.900}" },
        },

        // ========== SPECIAL STATES ==========
        "ai.bg": {
          value: { base: "{colors.purple.50}", _dark: "{colors.purple.950}" },
        },
        "ai.border": {
          value: { base: "{colors.purple.200}", _dark: "{colors.purple.800}" },
        },
        "ai.text": {
          value: { base: "{colors.purple.700}", _dark: "{colors.purple.300}" },
        },
      },
    },
    textStyles: {
      // Premium Display headings (for hero sections)
      "display-xl": {
        value: {
          fontFamily: "heading",
          fontSize: { base: "3rem", md: "4rem", lg: "4.5rem" },
          fontWeight: "800",
          lineHeight: "1.1",
          letterSpacing: "-0.02em",
        },
      },
      "display-lg": {
        value: {
          fontFamily: "heading",
          fontSize: { base: "2.25rem", md: "3rem", lg: "3.5rem" },
          fontWeight: "700",
          lineHeight: "1.15",
          letterSpacing: "-0.02em",
        },
      },
      "display-md": {
        value: {
          fontFamily: "heading",
          fontSize: { base: "1.875rem", md: "2.25rem" },
          fontWeight: "700",
          lineHeight: "1.2",
          letterSpacing: "-0.01em",
        },
      },
      "display-sm": {
        value: {
          fontFamily: "heading",
          fontSize: { base: "1.5rem", md: "1.875rem" },
          fontWeight: "600",
          lineHeight: "1.25",
          letterSpacing: "-0.01em",
        },
      },
      // Headings
      "heading-xl": {
        value: {
          fontFamily: "heading",
          fontSize: { base: "1.5rem", md: "1.75rem" },
          fontWeight: "700",
          lineHeight: "1.2",
          letterSpacing: "-0.01em",
        },
      },
      "heading-lg": {
        value: {
          fontFamily: "heading",
          fontSize: { base: "1.25rem", md: "1.5rem" },
          fontWeight: "600",
          lineHeight: "1.3",
          letterSpacing: "-0.01em",
        },
      },
      "heading-md": {
        value: {
          fontFamily: "heading",
          fontSize: { base: "1.125rem", md: "1.25rem" },
          fontWeight: "600",
          lineHeight: "1.35",
        },
      },
      "heading-sm": {
        value: {
          fontFamily: "heading",
          fontSize: "1rem",
          fontWeight: "600",
          lineHeight: "1.4",
        },
      },
      // Body text
      "body-lg": {
        value: {
          fontFamily: "body",
          fontSize: "1.125rem",
          fontWeight: "400",
          lineHeight: "1.6",
        },
      },
      "body-md": {
        value: {
          fontFamily: "body",
          fontSize: "1rem",
          fontWeight: "400",
          lineHeight: "1.6",
        },
      },
      "body-sm": {
        value: {
          fontFamily: "body",
          fontSize: "0.875rem",
          fontWeight: "400",
          lineHeight: "1.5",
        },
      },
      // Labels
      "label-lg": {
        value: {
          fontFamily: "body",
          fontSize: "sm",
          fontWeight: "500",
          lineHeight: "1.4",
        },
      },
      "label-md": {
        value: {
          fontFamily: "body",
          fontSize: "xs",
          fontWeight: "500",
          lineHeight: "1.4",
        },
      },
      "label-sm": {
        value: {
          fontFamily: "body",
          fontSize: "0.75rem",
          fontWeight: "500",
          lineHeight: "1.4",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        },
      },
      // Caption
      caption: {
        value: {
          fontFamily: "body",
          fontSize: "0.75rem",
          fontWeight: "400",
          lineHeight: "1.4",
        },
      },
    },
  },
  globalCss: {
    "*, *::before, *::after": {
      boxSizing: "border-box",
    },
    "html, body": {
      bg: "bg",
      color: "text",
      minHeight: "100vh",
      fontFamily: "body",
      fontSize: "md",
      lineHeight: "normal",
    },
    html: {
      scrollBehavior: "smooth",
    },
    body: {
      letterSpacing: "-0.01em",
    },
    "h1, h2, h3, h4, h5, h6": {
      fontFamily: "heading",
      letterSpacing: "-0.025em",
      fontWeight: "600",
    },
    "::selection": {
      bg: "primary.muted",
      color: "primary",
    },
    ":focus-visible": {
      outline: "2px solid",
      outlineColor: "primary",
      outlineOffset: "2px",
    },
    ":focus:not(:focus-visible)": {
      outline: "none",
    },
    // Scrollbar styling
    "::-webkit-scrollbar": {
      width: "8px",
      height: "8px",
    },
    "::-webkit-scrollbar-track": {
      bg: "transparent",
    },
    "::-webkit-scrollbar-thumb": {
      bg: "border.emphasis",
      borderRadius: "full",
      "&:hover": {
        bg: "text.subtle",
      },
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
