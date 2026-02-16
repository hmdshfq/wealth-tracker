'use client';

import React from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, rounded = 'md' }) => {
  const classes = [styles.skeleton, styles[rounded], className].filter(Boolean).join(' ');

  return <div aria-hidden="true" className={classes} />;
};

export default Skeleton;
