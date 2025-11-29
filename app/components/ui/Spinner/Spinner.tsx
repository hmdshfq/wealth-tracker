'use client';
import React from 'react';
import { motion } from 'motion/react';
import { fadeVariants, transitions } from '@/app/lib/animations';
import styles from './Spinner.module.css';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'white';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'medium',
  color = 'primary',
  className,
}) => {
  const classes = [styles.spinner, styles[size], styles[color], className]
    .filter(Boolean)
    .join(' ');

  return (
    <motion.div
      className={classes}
      variants={fadeVariants}
      initial="initial"
      animate="animate"
      transition={{ ...transitions.normal, delay: 0.2 }}
    >
      <div className={styles.ring} />
    </motion.div>
  );
};

export default Spinner;
