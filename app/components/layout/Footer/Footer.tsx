import React from 'react';
import styles from './Footer.module.css';

interface FooterProps {
  lastUpdate?: Date | null;
}

export const Footer: React.FC<FooterProps> = ({ lastUpdate = null }) => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerRow}>
        Wealth Tracker by <a href="https://hammadshafiq.com">Hammad Shafiq</a>
      </div>
      <div className={styles.footerRow}>
        Updated: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
      </div>
    </footer>
  );
};

export default Footer;
