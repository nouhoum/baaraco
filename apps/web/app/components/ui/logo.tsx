"use client";

import { Flex, Text } from "@chakra-ui/react";

export interface LogoProps {
  size?: "tiny" | "small" | "medium" | "large" | "hero";
  variant?: "light" | "dark";
  animated?: boolean;
  iconOnly?: boolean;
}

const sizeConfig = {
  tiny: {
    icon: 16,
    fontSize: "sm",
    fontWeight: { light: 300, bold: 500 },
    gap: 1,
  },
  small: {
    icon: 22,
    fontSize: "md",
    fontWeight: { light: 300, bold: 600 },
    gap: 1.5,
  },
  medium: {
    icon: 28,
    fontSize: "xl",
    fontWeight: { light: 300, bold: 600 },
    gap: 2,
  },
  large: {
    icon: 40,
    fontSize: "3xl",
    fontWeight: { light: 300, bold: 600 },
    gap: 2.5,
  },
  hero: {
    icon: 56,
    fontSize: "5xl",
    fontWeight: { light: 300, bold: 700 },
    gap: 3,
  },
};

// Brand colors
const brandColors = {
  primary: "#0F766E", // teal-700
  accent: "#14B8A6", // teal-500
  accentLight: "#5EEAD4", // teal-300
};

interface BadgeIconProps {
  size: number;
  variant: "light" | "dark";
  animated: boolean;
}

function BadgeIcon({ size, variant, animated }: BadgeIconProps) {
  const isDark = variant === "dark";
  const fillColor = isDark ? brandColors.accent : brandColors.primary;

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      style={{ flexShrink: 0 }}
    >
      {animated && (
        <style>{`
          @keyframes pulse-subtle {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.85; }
          }
          @keyframes draw-check {
            0% { stroke-dashoffset: 50; }
            100% { stroke-dashoffset: 0; }
          }
          @keyframes shimmer {
            0%, 100% { opacity: 0.25; }
            50% { opacity: 0.5; }
          }
        `}</style>
      )}

      {/* Shield/Badge Background */}
      <path
        d="M50 6L16 20V48C16 70 32 86 50 96C68 86 84 70 84 48V20L50 6Z"
        fill={fillColor}
        style={animated ? { animation: "pulse-subtle 2.5s ease-in-out infinite" } : undefined}
      />

      {/* Inner shield highlight for depth */}
      <path
        d="M50 12L22 24V46C22 65 36 79 50 88C64 79 78 65 78 46V24L50 12Z"
        fill="transparent"
        stroke="white"
        strokeWidth="1"
        strokeOpacity="0.15"
      />

      {/* Checkmark */}
      <path
        d="M32 50L44 62L68 38"
        stroke="white"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray={animated ? "50" : undefined}
        style={animated ? { animation: "draw-check 2s ease-in-out infinite" } : undefined}
      />

      {/* Subtle top accent line */}
      <path
        d="M30 28L70 28"
        stroke="white"
        strokeWidth="2"
        strokeOpacity="0.25"
        strokeLinecap="round"
        style={animated ? { animation: "shimmer 3s ease-in-out infinite" } : undefined}
      />
    </svg>
  );
}

export function Logo({
  size = "medium",
  variant = "light",
  animated = false,
  iconOnly = false,
}: LogoProps) {
  const config = sizeConfig[size];
  const isDark = variant === "dark";

  const textColor = isDark ? "white" : "gray.800";
  const accentTextColor = isDark ? brandColors.accentLight : brandColors.primary;

  return (
    <Flex alignItems="center" gap={iconOnly ? 0 : config.gap}>
      <BadgeIcon size={config.icon} variant={variant} animated={animated} />

      {!iconOnly && (
        <Flex alignItems="baseline">
          <Text
            as="span"
            fontSize={config.fontSize}
            fontWeight={config.fontWeight.light}
            color={textColor}
            letterSpacing="-0.02em"
            lineHeight="1"
          >
            baa
          </Text>
          <Text
            as="span"
            fontSize={config.fontSize}
            fontWeight={config.fontWeight.bold}
            color={accentTextColor}
            letterSpacing="-0.02em"
            lineHeight="1"
          >
            ra
          </Text>
        </Flex>
      )}
    </Flex>
  );
}

// Export standalone icon for favicon use
export function LogoIcon({
  size = 32,
  variant = "light",
}: {
  size?: number;
  variant?: "light" | "dark";
}) {
  return <BadgeIcon size={size} variant={variant} animated={false} />;
}

export default Logo;
