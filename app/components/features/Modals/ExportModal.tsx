'use client';
import React from 'react';
import { Modal, Button } from '@/app/components/ui';
import styles from './Modals.module.css';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportJSON: () => void;
  onExportCSV: (type: 'holdings' | 'transactions' | 'cash') => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExportJSON,
  onExportCSV,
}) => {
  return (
    <Modal
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
            onClick={() => onExportCSV('transactions')}
          >
            Transactions
          </Button>
          <Button
            variant="secondary"
            size="small"
            onClick={() => onExportCSV('cash')}
          >
            Cash
          </Button>
        </div>
      </div>

      <div className={styles.tipBox}>
        <p>
          💡 <strong>Tip:</strong> Use JSON for full backups. CSV files are
          useful for spreadsheet analysis but can't be imported back.
        </p>
      </div>
    </Modal>
  );
};

export default ExportModal;
