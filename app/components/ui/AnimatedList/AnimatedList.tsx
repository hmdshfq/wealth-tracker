'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useReducedMotion } from '@/app/lib/hooks';
import { fadeVariants, slideFromTopVariants, transitions } from '@/app/lib/animations';

interface AnimatedListProps<T> {
  items: T[];
  keyExtractor: (item: T) => string | number;
  renderItem: (item: T) => React.ReactNode;
  className?: string;
}

export function AnimatedList<T>({
  items,
  keyExtractor,
  renderItem,
  className,
}: AnimatedListProps<T>) {
  const prefersReducedMotion = useReducedMotion();
  // Disable animations for very large lists (performance)
  const shouldAnimate = items.length < 100 && !prefersReducedMotion;
  const variant = prefersReducedMotion ? fadeVariants : slideFromTopVariants;

  if (!shouldAnimate) {
    return (
      <div className={className}>
        {items.map((item) => (
          <div key={keyExtractor(item)}>{renderItem(item)}</div>
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.div
            key={keyExtractor(item)}
            variants={variant}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transitions.slow}
            layout
          >
            {renderItem(item)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default AnimatedList;
