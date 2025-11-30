'use client';
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Card, Input, Select, Button, SectionTitle, IconButton, Badge, Modal } from '@/app/components/ui';
import { formatPLN, formatCurrency } from '@/app/lib/formatters';
import { CashBalance, CashTransaction, NewCash } from '@/app/lib/types';
import { staggerContainerVariants, slideFromBottomVariants, transitions } from '@/app/lib/animations';
import styles from './Cash.module.css';

interface ExchangeRates {
  EUR_PLN: number;
  USD_PLN: number;
  EUR_USD: number;
}

interface CashTabProps {
  cash: CashBalance[];
  cashTransactions: CashTransaction[];
  totalCashPLN: number;
  newCash: NewCash;
  exchangeRates: ExchangeRates;
  onCashChange: (updates: Partial<NewCash>) => void;
  onAddCash: () => void;
  onEditCashTransaction: (transaction: CashTransaction) => void;
  onDeleteCashTransaction: (id: number) => void;
}

const currencyOptions = [
  { value: 'PLN', label: 'PLN' },
  { value: 'EUR', label: 'EUR' },
  { value: 'USD', label: 'USD' },
];

const typeOptions = [
  { value: 'deposit', label: 'Deposit' },
  { value: 'withdrawal', label: 'Withdrawal' },
];

const PAGE_SIZE_OPTIONS = [
  { value: '50', label: '50' },
  { value: '100', label: '100' },
  { value: '200', label: '200' },
  { value: '500', label: '500' },
  { value: 'all', label: 'All' },
];

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

export const CashTab: React.FC<CashTabProps> = ({
  cash,
  cashTransactions,
  totalCashPLN,
  newCash,
  exchangeRates,
  onCashChange,
  onAddCash,
  onEditCashTransaction,
  onDeleteCashTransaction,
}) => {
  const [editingTransaction, setEditingTransaction] = useState<CashTransaction | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [pageSize, setPageSize] = useState<string>('50');
  const [currentPage, setCurrentPage] = useState(1);

  // Pagination logic
  const itemsPerPage = pageSize === 'all' ? cashTransactions.length : parseInt(pageSize, 10);
  const totalPages = Math.ceil(cashTransactions.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = pageSize === 'all' ? cashTransactions.length : startIndex + itemsPerPage;
  const paginatedTransactions = cashTransactions.slice(startIndex, endIndex);

  // Reset to page 1 when page size changes
  const handlePageSizeChange = (newSize: string) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  // Ensure current page is valid when transactions change
  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [cashTransactions.length, totalPages, currentPage]);

  const getCashInPLN = (c: CashBalance): number => {
    if (c.currency === 'PLN') return c.amount;
    if (c.currency === 'EUR') return c.amount * exchangeRates.EUR_PLN;
    if (c.currency === 'USD') return c.amount * exchangeRates.USD_PLN;
    return c.amount;
  };

  const handleEditSave = () => {
    if (editingTransaction) {
      onEditCashTransaction(editingTransaction);
      setEditingTransaction(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmId !== null) {
      onDeleteCashTransaction(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <motion.div 
      style={{ display: 'grid', gap: '24px' }}
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Add Cash Transaction */}
      <motion.div
        variants={slideFromBottomVariants}
        transition={transitions.fast}
      >
      <Card>
        <SectionTitle>Add Cash Transaction</SectionTitle>
        <div className={styles.formGrid}>
          <Select
            label="Type"
            options={typeOptions}
            value={newCash.type}
            onChange={(e) => onCashChange({ type: e.target.value as 'deposit' | 'withdrawal' })}
          />
          <Select
            label="Currency"
            options={currencyOptions}
            value={newCash.currency}
            onChange={(e) => onCashChange({ currency: e.target.value })}
          />
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            label="Amount"
            value={newCash.amount}
            onChange={(e) => onCashChange({ amount: e.target.value })}
          />
          <Input
            type="text"
            placeholder="Optional note..."
            label="Note"
            value={newCash.note}
            onChange={(e) => onCashChange({ note: e.target.value })}
          />
        </div>
        <div style={{ marginTop: '16px' }}>
          <Button variant="blue" onClick={onAddCash}>
            + Add Transaction
          </Button>
        </div>
      </Card>
      </motion.div>

      {/* Cash Balances */}
      <motion.div
        variants={slideFromBottomVariants}
        transition={transitions.fast}
      >
      <Card>
        <SectionTitle>Cash Balances</SectionTitle>
        <div className={styles.balancesGrid}>
          {cash.map((c) => {
            const inPLN = getCashInPLN(c);
            return (
              <div key={c.currency} className={styles.balanceCard}>
                <p className={styles.currencyLabel}>{c.currency}</p>
                <p className={styles.amount}>
                  {formatCurrency(c.amount, c.currency)}
                </p>
                {c.currency !== 'PLN' && (
                  <p className={styles.conversion}>≈ {formatPLN(inPLN)}</p>
                )}
              </div>
            );
          })}
        </div>
        <div className={styles.totalCard}>
          <p className={styles.totalLabel}>Total Cash (in PLN)</p>
          <p className={styles.totalValue}>{formatPLN(totalCashPLN)}</p>
        </div>
      </Card>
      </motion.div>

      {/* Transaction History */}
      <motion.div
        variants={slideFromBottomVariants}
        transition={transitions.fast}
      >
      <Card>
        <SectionTitle>Transaction History ({cashTransactions.length})</SectionTitle>
        {cashTransactions.length === 0 ? (
          <p className={styles.emptyState}>No cash transactions yet</p>
        ) : (
          <>
            <div className={styles.paginationControls}>
              <div className={styles.pageSizeSelector}>
                <span className={styles.paginationLabel}>Show:</span>
                <Select
                  options={PAGE_SIZE_OPTIONS}
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(e.target.value)}
                />
                <span className={styles.paginationLabel}>entries</span>
              </div>
              <div className={styles.paginationInfo}>
                Showing {startIndex + 1}-{Math.min(endIndex, cashTransactions.length)} of {cashTransactions.length}
              </div>
            </div>
            <div className={styles.transactionList}>
              <div className={styles.transactionHeader}>
                <span>Date</span>
                <span>Type</span>
                <span>Currency</span>
                <span style={{ textAlign: 'right' }}>Amount</span>
                <span>Note</span>
                <span style={{ textAlign: 'center' }}>Actions</span>
              </div>
              {paginatedTransactions.map((tx) => (
                <div key={tx.id} className={styles.transactionRow}>
                  <span className={styles.txDate}>{tx.date}</span>
                  <span>
                    <Badge variant={tx.type === 'deposit' ? 'success' : 'danger'}>
                      {tx.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                    </Badge>
                  </span>
                  <span className={styles.txCurrency}>{tx.currency}</span>
                  <span className={`${styles.txAmount} ${tx.type === 'withdrawal' ? styles.negative : ''}`} style={{ textAlign: 'right' }}>
                    {tx.type === 'withdrawal' ? '-' : '+'}{formatCurrency(tx.amount, tx.currency)}
                  </span>
                  <span className={styles.txNote}>{tx.note || '-'}</span>
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
            {totalPages > 1 && (
              <div className={styles.paginationNav}>
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  First
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className={styles.pageIndicator}>
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Last
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
      </motion.div>

      {/* Exchange Rates */}
      <motion.div
        variants={slideFromBottomVariants}
        transition={transitions.fast}
      >
      <Card>
        <SectionTitle>Exchange Rates</SectionTitle>
        <div className={styles.rates}>
          <div>
            <span className={styles.rateLabel}>EUR/PLN: </span>
            <span className={styles.rateValue}>{exchangeRates.EUR_PLN.toFixed(4)}</span>
          </div>
          <div>
            <span className={styles.rateLabel}>USD/PLN: </span>
            <span className={styles.rateValue}>{exchangeRates.USD_PLN.toFixed(4)}</span>
          </div>
          <div>
            <span className={styles.rateLabel}>EUR/USD: </span>
            <span className={styles.rateValue}>{exchangeRates.EUR_USD.toFixed(4)}</span>
          </div>
        </div>
      </Card>
      </motion.div>

      {/* Edit Modal */}
      <Modal
        isOpen={editingTransaction !== null}
        onClose={() => setEditingTransaction(null)}
        title="Edit Cash Transaction"
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
              label="Type"
              options={typeOptions}
              value={editingTransaction.type}
              onChange={(e) => setEditingTransaction({ ...editingTransaction, type: e.target.value as 'deposit' | 'withdrawal' })}
            />
            <Select
              label="Currency"
              options={currencyOptions}
              value={editingTransaction.currency}
              onChange={(e) => setEditingTransaction({ ...editingTransaction, currency: e.target.value as 'PLN' | 'EUR' | 'USD' })}
            />
            <Input
              type="number"
              step="0.01"
              label="Amount"
              value={editingTransaction.amount.toString()}
              onChange={(e) => setEditingTransaction({ ...editingTransaction, amount: parseFloat(e.target.value) || 0 })}
            />
            <Input
              type="text"
              label="Note"
              value={editingTransaction.note || ''}
              onChange={(e) => setEditingTransaction({ ...editingTransaction, note: e.target.value })}
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
          Are you sure you want to delete this transaction? This will also update your cash balances.
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
    </motion.div>
  );
};

export default CashTab;
