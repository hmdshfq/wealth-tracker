'use client';
import React from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { useReducedMotion } from '@/app/lib/hooks';
import styles from './Button.module.css';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: 'primary' | 'secondary' | 'blue' | 'red';
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'medium', children, className, disabled, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion();

    const classes = [
      styles.button,
      styles[variant],
      size !== 'medium' && styles[size],
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
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
