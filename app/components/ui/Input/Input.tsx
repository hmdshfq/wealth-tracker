import React from 'react';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  wrapperStyle?: React.CSSProperties;
}

export const Input: React.FC<InputProps> = ({
  label,
  wrapperStyle,
  className,
  style,
  ...props
}) => {
  return (
    <div className={styles.wrapper} style={wrapperStyle}>
      {label && <label className={styles.label}>{label}</label>}
      <input
        className={`${styles.input} ${className || ''}`}
        style={style}
        {...props}
      />
    </div>
  );
};

export default Input;
