import { Variants } from 'motion/react';

// ============================================================================
// TIMING CONSTANTS
// ============================================================================

export const DURATION = {
  fast: 0.1, // 100ms - button presses
  normal: 0.15, // 150ms - most transitions
  slow: 0.2, // 200ms - modals, complex transitions
} as const;

export const EASING = {
  easeOut: [0.16, 1, 0.3, 1], // Smooth deceleration
  easeInOut: [0.45, 0, 0.55, 1], // Balanced
} as const;

// ============================================================================
// REUSABLE ANIMATION VARIANTS
// ============================================================================

/** Fade in/out */
export const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/** Slide from top */
export const slideFromTopVariants: Variants = {
  initial: { y: -20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: -20, opacity: 0 },
};

/** Slide from bottom */
export const slideFromBottomVariants: Variants = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: 20, opacity: 0 },
};

/** Scale from center (modals) */
export const scaleVariants: Variants = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.95, opacity: 0 },
};

/** List item height collapse */
export const collapseVariants: Variants = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0 },
};

/** Button press scale */
export const buttonPressVariants = {
  whileTap: { scale: 0.97 },
};

/** Stagger children animation */
export const staggerContainerVariants: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.05, // 50ms between each child
    },
  },
};

// ============================================================================
// TRANSITION PRESETS
// ============================================================================

export const transitions = {
  fast: { duration: DURATION.fast, ease: EASING.easeOut },
  normal: { duration: DURATION.normal, ease: EASING.easeOut },
  slow: { duration: DURATION.slow, ease: EASING.easeInOut },
} as const;
