'use client';

import React from 'react';
import styles from './GuestModeBanner.module.css';

export const GuestModeBanner: React.FC = () => {
  return (
    <div className={styles.banner} role="status" aria-live="polite">
      <span className={styles.icon} aria-hidden="true">ℹ</span>
      <span className={styles.text}>Guest mode — data is stored locally in this browser.</span>
    </div>
  );
};

export default GuestModeBanner;
