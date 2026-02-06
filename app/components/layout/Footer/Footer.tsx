import React from 'react';
import styles from './Footer.module.css';

interface FooterProps {
  lastCloudSave?: Date | null;
  showCloudStatus?: boolean;
  isLocalOnly?: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  lastCloudSave = null,
  showCloudStatus = false,
  isLocalOnly = false,
}) => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerRow}>
        Wealth Tracker by <a href="https://hammadshafiq.com">Hammad Shafiq</a>
      </div>
      {showCloudStatus && (
        <div className={styles.footerRow}>
          {isLocalOnly
            ? 'Local-only mode enabled'
            : lastCloudSave
            ? `Last cloud save: ${lastCloudSave.toLocaleTimeString()}`
            : 'No cloud saves yet'}
        </div>
      )}
    </footer>
  );
};

export default Footer;
