'use client';
import React from 'react';
import { AnimatedModal, Button } from '@/app/components/ui';
import styles from './Modals.module.css';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportJSON: () => void;
  onExportCSV: (type: 'holdings' | 'investments' | 'cash' | 'cashTransactions') => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExportJSON,
  onExportCSV,
}) => {
  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Data"
      description="Export your portfolio data for backup or transfer to another device."
    >
      <div className={styles.exportButtons}>
        <button onClick={onExportJSON} className={styles.primaryExport}>
          <div>
            <div className={styles.exportTitle}>Full Backup (JSON)</div>
            <div className={styles.exportSubtitle}>
              All data • Can be imported back
            </div>
          </div>
          <span className={styles.arrow}>→</span>
        </button>

        <div className={styles.dividerText}>— or export as CSV —</div>

        <div className={styles.csvGrid}>
          <Button
            variant="secondary"
            size="small"
            onClick={() => onExportCSV('holdings')}
          >
            Holdings
          </Button>
          <Button
            variant="secondary"
            size="small"
            onClick={() => onExportCSV('investments')}
          >
            Investments
          </Button>
          <Button
            variant="secondary"
            size="small"
            onClick={() => onExportCSV('cash')}
          >
            Cash Balances
          </Button>
          <Button
            variant="secondary"
            size="small"
            onClick={() => onExportCSV('cashTransactions')}
          >
            Cash History
          </Button>
        </div>
      </div>

      <div className={styles.tipBox}>
        <p>
          💡 <strong>Tip:</strong> Use JSON for full backups. CSV files are
          useful for spreadsheet analysis but can't be imported back.
        </p>
      </div>
    </AnimatedModal>
  );
};

export default ExportModal;
