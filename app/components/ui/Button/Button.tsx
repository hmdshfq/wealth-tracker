'use client';
import React from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { useReducedMotion } from '@/app/lib/hooks';
import { InlineLoader } from '@/app/components/ui/InlineLoader';
import styles from './Button.module.css';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: 'primary' | 'secondary' | 'blue' | 'red';
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
  isLoading?: boolean;
  loadingLabel?: string;
  loadingIconAriaLabel?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'medium',
      children,
      className,
      disabled,
      isLoading = false,
      loadingLabel = 'Loading...',
      loadingIconAriaLabel = 'Loading',
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();
    const isDisabled = disabled || isLoading;

    const classes = [
      styles.button,
      styles[variant],
      size !== 'medium' && styles[size],
      isLoading && styles.loading,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <motion.button
        ref={ref}
        className={classes}
        disabled={isDisabled}
        aria-busy={isLoading}
        whileTap={!isDisabled && !prefersReducedMotion ? { scale: 0.97 } : undefined}
        {...props}
      >
        {isLoading ? (
          <span className={styles.loadingContent}>
            <InlineLoader label={loadingLabel} className={styles.loader} />
            <span className={styles.srOnly}>{loadingIconAriaLabel}</span>
          </span>
        ) : (
          children
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
