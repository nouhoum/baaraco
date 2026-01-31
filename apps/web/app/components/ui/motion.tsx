"use client";

import { motion, useInView, useAnimation, type Variants, type MotionProps } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Box, type BoxProps } from "@chakra-ui/react";

// Several BoxProps (transition, onDrag, onAnimationStart, etc.) conflict with
// framer-motion's MotionProps. We let MotionProps take precedence for all overlapping keys.
type SafeBoxProps = Omit<BoxProps, keyof MotionProps>;
type MotionBoxProps = SafeBoxProps &
  MotionProps & {
    children?: React.ReactNode;
    ref?: React.Ref<HTMLDivElement>;
  };

// ============================================================================
// MOTION VARIANTS
// ============================================================================

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// ============================================================================
// MOTION COMPONENTS
// ============================================================================

export const MotionBox = motion.create(Box) as React.FC<MotionBoxProps>;

interface AnimatedSectionProps extends SafeBoxProps {
  children: React.ReactNode;
  variants?: Variants;
  delay?: number;
  threshold?: number;
  once?: boolean;
}

export function AnimatedSection({
  children,
  variants = fadeInUp,
  delay = 0,
  threshold = 0.2,
  once = true,
  ...props
}: AnimatedSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount: threshold });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  return (
    <MotionBox
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={variants}
      transition={{ delay }}
      {...props}
    >
      {children}
    </MotionBox>
  );
}

interface StaggeredContainerProps extends SafeBoxProps {
  children: React.ReactNode;
  threshold?: number;
  once?: boolean;
  staggerDelay?: number;
}

export function StaggeredContainer({
  children,
  threshold = 0.2,
  once = true,
  staggerDelay = 0.1,
  ...props
}: StaggeredContainerProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount: threshold });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  return (
    <MotionBox
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: 0.1,
          },
        },
      }}
      {...props}
    >
      {children}
    </MotionBox>
  );
}

export function StaggeredItem({
  children,
  ...props
}: SafeBoxProps & { children: React.ReactNode }) {
  return (
    <MotionBox variants={staggerItem} {...props}>
      {children}
    </MotionBox>
  );
}

// ============================================================================
// COUNTER ANIMATION
// ============================================================================

interface CounterProps {
  from?: number;
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export function AnimatedCounter({
  from = 0,
  to,
  duration = 2,
  prefix = "",
  suffix = "",
  decimals = 0,
}: CounterProps) {
  const [count, setCount] = useState(from);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);

      // Easing function (ease-out-cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;

      setCount(Number(current.toFixed(decimals)));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isInView, from, to, duration, decimals]);

  return (
    <span ref={ref}>
      {prefix}
      {count}
      {suffix}
    </span>
  );
}

// ============================================================================
// GLOW EFFECT
// ============================================================================

interface GlowProps extends BoxProps {
  color?: string;
  intensity?: number;
  size?: string;
}

export function Glow({
  color = "rgba(20, 184, 166, 0.4)",
  intensity = 1,
  size = "300px",
  ...props
}: GlowProps) {
  return (
    <Box
      position="absolute"
      width={size}
      height={size}
      borderRadius="full"
      background={`radial-gradient(circle, ${color} 0%, transparent 70%)`}
      filter={`blur(${60 * intensity}px)`}
      pointerEvents="none"
      {...props}
    />
  );
}

// ============================================================================
// GRADIENT TEXT
// ============================================================================

interface GradientTextProps {
  children: React.ReactNode;
  gradient?: string;
}

export function GradientText({
  children,
  gradient = "linear-gradient(135deg, #14B8A6 0%, #5EEAD4 50%, #14B8A6 100%)",
}: GradientTextProps) {
  return (
    <Box
      as="span"
      bg={gradient}
      bgClip="text"
      color="transparent"
      display="inline"
    >
      {children}
    </Box>
  );
}

// ============================================================================
// SHIMMER TEXT (Animated gradient)
// ============================================================================

export function ShimmerText({ children }: { children: React.ReactNode }) {
  return (
    <Box
      as="span"
      position="relative"
      display="inline-block"
      bg="linear-gradient(90deg, #94A3B8 0%, #E2E8F0 50%, #94A3B8 100%)"
      bgSize="200% 100%"
      bgClip="text"
      color="transparent"
      animation="shimmer 3s linear infinite"
    />
  );
}

// ============================================================================
// HOVER CARD
// ============================================================================

interface HoverCardProps extends SafeBoxProps {
  children: React.ReactNode;
}

export function HoverCard({ children, ...props }: HoverCardProps) {
  return (
    <MotionBox
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      {...props}
    >
      {children}
    </MotionBox>
  );
}
