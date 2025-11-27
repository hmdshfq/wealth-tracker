import React from 'react';
import styles from './Footer.module.css';

export const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      Wealth Tracker by <a href="https://hammadshafiq.com">Hammad Shafiq</a>
    </footer>
  );
};

export default Footer;
