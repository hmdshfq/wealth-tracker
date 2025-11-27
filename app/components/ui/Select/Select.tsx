import React from 'react';
import styles from './Select.module.css';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  wrapperStyle?: React.CSSProperties;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  wrapperStyle,
  className,
  style,
  ...props
}) => {
  return (
    <div className={styles.wrapper} style={wrapperStyle}>
      {label && <label className={styles.label}>{label}</label>}
      <select
        className={`${styles.select} ${className || ''}`}
        style={style}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Select;
