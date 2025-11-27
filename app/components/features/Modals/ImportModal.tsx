'use client';
import React from 'react';
import { Modal, Button } from '@/app/components/ui';
import styles from './Modals.module.css';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  importData: string;
  importError: string;
  onImportDataChange: (data: string) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImport: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  importData,
  importError,
  onImportDataChange,
  onFileUpload,
  onImport,
}) => {
  const handleClose = () => {
    onImportDataChange('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Data"
      description="Import portfolio data from a previously exported JSON file. This will replace all current data."
      wide
    >
      {/* File Upload */}
      <div className={styles.dropZone}>
        <input
          type="file"
          accept=".json"
          onChange={onFileUpload}
          className={styles.fileInput}
          id="file-upload"
        />
        <label htmlFor="file-upload" className={styles.dropZoneLabel}>
          <div className={styles.dropZoneIcon}>📁</div>
          <div className={styles.dropZoneTitle}>Click to upload JSON file</div>
          <div className={styles.dropZoneSubtitle}>or paste JSON below</div>
        </label>
      </div>

      {/* Text Area */}
      <textarea
        value={importData}
        onChange={(e) => onImportDataChange(e.target.value)}
        placeholder="Paste your JSON data here..."
        className={styles.textarea}
      />

      {/* Error Message */}
      {importError && (
        <div className={styles.errorBox}>⚠️ {importError}</div>
      )}

      {/* Warning */}
      <div className={styles.warningBox}>
        <p>
          ⚠️ <strong>Warning:</strong> Importing will replace all your current
          holdings, transactions, cash, and goal settings.
        </p>
      </div>

      {/* Buttons */}
      <div className={styles.buttonRow}>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button onClick={onImport} disabled={!importData.trim()}>
          Import Data
        </Button>
      </div>
    </Modal>
  );
};

export default ImportModal;
