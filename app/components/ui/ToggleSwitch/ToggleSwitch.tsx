'use client';
import React from 'react';
import styles from './ToggleSwitch.module.css';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  id?: string;
  disabled?: boolean;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  id,
  disabled = false,
}) => {
  const toggleId = id || `toggle-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={styles.container}>
      <label htmlFor={toggleId} className={styles.label}>
        <span className={styles.labelText}>{label}</span>
        {description && <span className={styles.description}>{description}</span>}
      </label>
      <div className={styles.toggleWrapper}>
        <input
          type="checkbox"
          id={toggleId}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className={styles.checkbox}
        />
        <span className={styles.switch} aria-hidden="true">
          <span className={styles.thumb} />
        </span>
      </div>
    </div>
  );
};

export default ToggleSwitch;
