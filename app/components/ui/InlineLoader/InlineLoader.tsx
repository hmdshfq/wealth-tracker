'use client';

import React from 'react';
import { motion } from 'motion/react';
import { useReducedMotion } from '@/app/lib/hooks';
import styles from './InlineLoader.module.css';

interface InlineLoaderProps {
  label?: string;
  className?: string;
  size?: 'small' | 'medium';
}

export const InlineLoader: React.FC<InlineLoaderProps> = ({
  label = 'Loading...',
  className,
  size = 'small',
}) => {
  const prefersReducedMotion = useReducedMotion();

  const classes = [styles.inlineLoader, styles[size], className].filter(Boolean).join(' ');

  return (
    <span className={classes} role="status" aria-live="polite">
      <motion.span
        aria-hidden="true"
        className={styles.dot}
        animate={prefersReducedMotion ? undefined : { rotate: 360 }}
        transition={prefersReducedMotion ? undefined : { repeat: Infinity, ease: 'linear', duration: 0.8 }}
      />
      <span>{label}</span>
    </span>
  );
};

export default InlineLoader;
