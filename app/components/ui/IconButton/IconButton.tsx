'use client';
import React from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { useReducedMotion } from '@/lib/hooks';
import styles from './IconButton.module.css';

interface IconButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  icon: React.ReactNode;
  label?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  iconPosition?: 'left' | 'right';
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, variant = 'secondary', size = 'medium', iconPosition = 'left', className, disabled, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion();

    const classes = [
      styles.button,
      styles[variant],
      styles[size],
      !label && styles.iconOnly,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <motion.button
        ref={ref}
        className={classes}
        disabled={disabled}
        whileTap={!disabled && !prefersReducedMotion ? { scale: 0.97 } : undefined}
        {...props}
      >
        {iconPosition === 'left' && <span className={styles.icon}>{icon}</span>}
        {label && <span className={styles.label}>{label}</span>}
        {iconPosition === 'right' && <span className={styles.icon}>{icon}</span>}
      </motion.button>
    );
  }
);

IconButton.displayName = 'IconButton';

export default IconButton;
