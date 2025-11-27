import React from 'react';
import styles from './SectionTitle.module.css';

interface SectionTitleProps {
  children: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
  children,
  subtitle,
  action,
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.textGroup}>
        <h3 className={styles.title}>{children}</h3>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
};

export default SectionTitle;
