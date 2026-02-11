'use client';
import React from 'react';
import { AnimatedModal, Button } from '@/app/components/ui';
import styles from './Modals.module.css';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportJSON: () => void;
  onExportCSV: (type: 'holdings' | 'investments' | 'cash' | 'cashTransactions') => void;
  onExportPDF: (type: 'full' | 'summary' | 'goal-chart') => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExportJSON,
  onExportCSV,
  onExportPDF,
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

      <div className={styles.dividerText}>— or export as PDF —</div>

      <div className={styles.pdfGrid}>
        <button
          onClick={() => onExportPDF('full')}
          className={styles.pdfExportButton}
        >
          <div>
            <div className={styles.exportTitle}>Full Report (PDF)</div>
            <div className={styles.exportSubtitle}>
              Complete portfolio • Charts • All data
            </div>
          </div>
          <span className={styles.arrow}>→</span>
        </button>

        <button
          onClick={() => onExportPDF('summary')}
          className={styles.pdfExportButton}
        >
          <div>
            <div className={styles.exportTitle}>Summary Report (PDF)</div>
            <div className={styles.exportSubtitle}>
              Quick overview • Key metrics
            </div>
          </div>
          <span className={styles.arrow}>→</span>
        </button>

        <button
          onClick={() => onExportPDF('goal-chart')}
          className={styles.pdfExportButton}
        >
          <div>
            <div className={styles.exportTitle}>Goal Progress Chart (PDF)</div>
            <div className={styles.exportSubtitle}>
              Visual projection • Progress tracking
            </div>
          </div>
          <span className={styles.arrow}>→</span>
        </button>
      </div>

      <div className={styles.tipBox}>
        <p>
          💡 <strong>Tip:</strong> Use JSON for full backups. CSV files are
          useful for spreadsheet analysis but can&apos;t be imported back.
          PDF reports are great for sharing and printing.
        </p>
      </div>
    </AnimatedModal>
  );
};

export default ExportModal;
