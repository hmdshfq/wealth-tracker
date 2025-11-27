import React from 'react';
import styles from './Footer.module.css';

export const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      Investment Tracker • Data is simulated • Not financial advice
    </footer>
  );
};

export default Footer;
