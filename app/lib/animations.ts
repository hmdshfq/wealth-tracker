import { Variants } from 'motion/react';



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
  initial: { x: "-50%", y: "-50%",scale: 0.95, opacity: 0 },
  animate: { x: "-50%", y: "-50%",scale: 1, opacity: 1 },
  exit: { x: "-50%", y: "-50%",scale: 0.95, opacity: 0 },
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
// TRANSITION PRESETS (Spring Physics)
// ============================================================================

export const transitions = {
  fast: { type: 'spring', stiffness: 300, damping: 25, mass: 1 },
  normal: { type: 'spring', stiffness: 100, damping: 12, mass: 1 },
  slow: { type: 'spring', stiffness: 50, damping: 10, mass: 1 },
} as const;
