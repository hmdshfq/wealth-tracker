'use client';
import React from 'react';
import { AnimatedModal, Button } from '@/app/components/ui';
import styles from './DrivePicker.module.css';

interface DriveFile {
  id: string;
  name: string;
  mimeType?: string;
  createdTime?: string;
}

interface DrivePickerProps {
  isOpen: boolean;
  onClose: () => void;
  files: DriveFile[];
  loading?: boolean;
  onSelect: (fileId: string) => void;
}

export const DrivePicker: React.FC<DrivePickerProps> = ({ isOpen, onClose, files, loading, onSelect }) => {
  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose} title="Choose a file from Google Drive" description="Select a JSON backup to import from your Drive." wide>
      <div className={styles.container}>
        {loading && <div className={styles.loading}>Loading files...</div>}
        {!loading && files.length === 0 && <div className={styles.empty}>No files found.</div>}

        <ul className={styles.list}>
          {files.map((f) => (
            <li key={f.id} className={styles.item} onClick={() => onSelect(f.id)}>
              <div className={styles.name}>{f.name}</div>
              <div className={styles.sub}>{f.createdTime ? new Date(f.createdTime).toLocaleString() : ''}</div>
              <div className={styles.action}>Select</div>
            </li>
          ))}
        </ul>

        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </AnimatedModal>
  );
};

export default DrivePicker;
