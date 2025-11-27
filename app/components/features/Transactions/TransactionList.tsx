'use client';
import React, { useState } from 'react';
import { Card, Badge, SectionTitle, IconButton, Modal, Button, Input, Select } from '@/app/components/ui';
import { ETF_DATA } from '@/app/lib/constants';
import { Transaction } from '@/app/lib/types';
import styles from './Transactions.module.css';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: number) => void;
}

// Simple SVG icons
const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const tickerOptions = Object.keys(ETF_DATA).map((t) => ({
  value: t,
  label: t,
}));

const actionOptions = [
  { value: 'Buy', label: 'Buy' },
  { value: 'Sell', label: 'Sell' },
];

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onEdit,
  onDelete,
}) => {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const handleEditSave = () => {
    if (editingTransaction) {
      onEdit(editingTransaction);
      setEditingTransaction(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmId !== null) {
      onDelete(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <>
      <Card>
        <SectionTitle>Transaction History ({transactions.length})</SectionTitle>
        {transactions.length === 0 ? (
          <p className={styles.emptyState}>No transactions yet</p>
        ) : (
          <div className={styles.transactionList}>
            <div className={styles.transactionHeader}>
              <span>Date</span>
              <span>Ticker</span>
              <span>Action</span>
              <span style={{ textAlign: 'right' }}>Shares</span>
              <span style={{ textAlign: 'right' }}>Price</span>
              <span style={{ textAlign: 'right' }}>Total</span>
              <span style={{ textAlign: 'center' }}>Actions</span>
            </div>
            {transactions.map((tx) => (
              <div key={tx.id} className={styles.transactionRow}>
                <span className={styles.txDate}>{tx.date}</span>
                <span className={styles.ticker}>{tx.ticker}</span>
                <span>
                  <Badge variant={tx.action === 'Buy' ? 'success' : 'danger'}>
                    {tx.action}
                  </Badge>
                </span>
                <span className={styles.txShares}>{tx.shares}</span>
                <span className={styles.txPrice}>€{tx.price.toFixed(2)}</span>
                <span className={styles.total}>€{(tx.shares * tx.price).toFixed(2)}</span>
                <span className={styles.txActions}>
                  <IconButton
                    icon={<EditIcon />}
                    variant="ghost"
                    size="small"
                    onClick={() => setEditingTransaction({ ...tx })}
                    title="Edit"
                  />
                  <IconButton
                    icon={<DeleteIcon />}
                    variant="danger"
                    size="small"
                    onClick={() => setDeleteConfirmId(tx.id)}
                    title="Delete"
                  />
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Edit Modal */}
      <Modal
        isOpen={editingTransaction !== null}
        onClose={() => setEditingTransaction(null)}
        title="Edit Transaction"
      >
        {editingTransaction && (
          <div className={styles.editForm}>
            <Input
              type="date"
              label="Date"
              value={editingTransaction.date}
              onChange={(e) => setEditingTransaction({ ...editingTransaction, date: e.target.value })}
            />
            <Select
              label="Ticker"
              options={tickerOptions}
              value={editingTransaction.ticker}
              onChange={(e) => setEditingTransaction({ ...editingTransaction, ticker: e.target.value })}
            />
            <Select
              label="Action"
              options={actionOptions}
              value={editingTransaction.action}
              onChange={(e) => setEditingTransaction({ ...editingTransaction, action: e.target.value as 'Buy' | 'Sell' })}
            />
            <Input
              type="number"
              step="0.01"
              label="Shares"
              value={editingTransaction.shares.toString()}
              onChange={(e) => setEditingTransaction({ ...editingTransaction, shares: parseFloat(e.target.value) || 0 })}
            />
            <Input
              type="number"
              step="0.01"
              label="Price (EUR)"
              value={editingTransaction.price.toString()}
              onChange={(e) => setEditingTransaction({ ...editingTransaction, price: parseFloat(e.target.value) || 0 })}
            />
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={() => setEditingTransaction(null)}>
                Cancel
              </Button>
              <Button variant="blue" onClick={handleEditSave}>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Transaction"
      >
        <p style={{ marginBottom: '24px', color: '#94a3b8' }}>
          Are you sure you want to delete this transaction? This will also update your holdings.
        </p>
        <div className={styles.modalActions}>
          <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>
            Cancel
          </Button>
          <Button variant="red" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default TransactionList;
