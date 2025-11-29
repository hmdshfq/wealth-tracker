'use client';
import React, { useState } from 'react';
import { Card, Badge, SectionTitle, IconButton, AnimatedModal, Button, Input, Select } from '@/app/components/ui';
import { ETF_DATA } from '@/app/lib/constants';
import { Transaction } from '@/app/lib/types';
import styles from './Transactions.module.css';

interface TransactionListProps {
  transactions: Transaction[];
  prices: Record<string, {
    price: number;
    change: number;
    changePercent: number;
    currency: string;
  }>;
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

const PAGE_SIZE_OPTIONS = [
  { value: '50', label: '50' },
  { value: '100', label: '100' },
  { value: '200', label: '200' },
  { value: '500', label: '500' },
  { value: 'all', label: 'All' },
];

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  prices,
  onEdit,
  onDelete,
}) => {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [pageSize, setPageSize] = useState<string>('50');
  const [currentPage, setCurrentPage] = useState(1);

  // Pagination logic
  const itemsPerPage = pageSize === 'all' ? transactions.length : parseInt(pageSize, 10);
  const totalPages = Math.ceil(transactions.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = pageSize === 'all' ? transactions.length : startIndex + itemsPerPage;
  const paginatedTransactions = transactions.slice(startIndex, endIndex);

  // Reset to page 1 when page size changes or transactions change significantly
  const handlePageSizeChange = (newSize: string) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  // Ensure current page is valid when transactions change
  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [transactions.length, totalPages, currentPage]);

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

  const getTransactionGainLoss = (tx: Transaction) => {
    const currentPrice = prices[tx.ticker]?.price || ETF_DATA[tx.ticker]?.basePrice || tx.price;
    const purchaseValue = tx.shares * tx.price;
    const currentValue = tx.shares * currentPrice;
    const gainLoss = currentValue - purchaseValue;
    const gainLossPercent = purchaseValue > 0 ? (gainLoss / purchaseValue) * 100 : 0;
    
    return {
      currentPrice,
      currentValue,
      gainLoss,
      gainLossPercent,
    };
  };

  return (
    <>
      <Card>
        <SectionTitle>Transaction History ({transactions.length})</SectionTitle>
        {transactions.length === 0 ? (
          <p className={styles.emptyState}>No transactions yet</p>
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
                Showing {startIndex + 1}-{Math.min(endIndex, transactions.length)} of {transactions.length}
              </div>
            </div>
            <div className={styles.transactionList}>
              <div className={styles.transactionHeader}>
                <span>Date</span>
                <span>Ticker</span>
                <span>Action</span>
                <span style={{ textAlign: 'right' }}>Shares</span>
                <span style={{ textAlign: 'right' }}>Buy Price</span>
                <span style={{ textAlign: 'right' }}>Current</span>
                <span style={{ textAlign: 'right' }}>Gain/Loss</span>
                <span style={{ textAlign: 'right' }}>%</span>
                <span style={{ textAlign: 'center' }}>Actions</span>
              </div>
              {paginatedTransactions.map((tx) => {
              const { currentPrice, gainLoss, gainLossPercent } = getTransactionGainLoss(tx);
              const isPositive = gainLoss >= 0;
              
              return (
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
                  <span className={styles.txPrice}>€{currentPrice.toFixed(2)}</span>
                  <span className={`${styles.txGain} ${isPositive ? styles.positive : styles.negative}`}>
                    {isPositive ? '+' : ''}€{gainLoss.toFixed(2)}
                  </span>
                  <span className={`${styles.txPercent} ${isPositive ? styles.positive : styles.negative}`}>
                    {isPositive ? '+' : ''}{gainLossPercent.toFixed(2)}%
                  </span>
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
              );
            })}
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

      {/* Edit Modal */}
      <AnimatedModal
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
      </AnimatedModal>

      {/* Delete Confirmation Modal */}
      <AnimatedModal
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
      </AnimatedModal>
    </>
  );
};

export default TransactionList;
