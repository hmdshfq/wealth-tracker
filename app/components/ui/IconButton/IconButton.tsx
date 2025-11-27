import React from 'react';
import styles from './IconButton.module.css';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  iconPosition?: 'left' | 'right';
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  label,
  variant = 'secondary',
  size = 'medium',
  iconPosition = 'left',
  className,
  ...props
}) => {
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
    <button className={classes} {...props}>
      {iconPosition === 'left' && <span className={styles.icon}>{icon}</span>}
      {label && <span className={styles.label}>{label}</span>}
      {iconPosition === 'right' && <span className={styles.icon}>{icon}</span>}
    </button>
  );
};

export default IconButton;
