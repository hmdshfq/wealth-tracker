import { jsPDF } from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import { formatPLN } from '../../../formatters';
import { Transaction } from '../../../types';
import { getLastAutoTableFinalY, THEME_COLOR } from '../utils';

export function addTransactionsSection(doc: jsPDF, transactions: Transaction[]) {
  if (transactions.length === 0) return;

  // Add section header
  const currentY = getLastAutoTableFinalY(doc, 20);
  const startY = currentY + 15;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...THEME_COLOR);
  doc.text('Transaction History', 15, startY);

  // Prepare data for table (limit to last 20 transactions for PDF)
  const recentTransactions = [...transactions].reverse().slice(0, 20);
  const tableData = recentTransactions.map((t) => [
    t.date,
    t.ticker,
    t.action,
    t.shares.toFixed(4),
    `${t.price.toFixed(2)} ${t.currency}`,
    formatPLN(t.shares * t.price * (t.currency === 'PLN' ? 1 : t.currency === 'EUR' ? 4.5 : 4.0)),
  ]);

  autoTable(
    doc,
    {
      startY: startY + 10,
      head: [['Date', 'Ticker', 'Action', 'Shares', 'Price', 'Value (PLN)']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [...THEME_COLOR], textColor: 255 },
      styles: { cellPadding: 4, fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 20 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 30 },
        5: { cellWidth: 30 },
      },
    } as UserOptions
  );

  if (transactions.length > 20) {
    const finalY = getLastAutoTableFinalY(doc, startY + 10);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`* Showing 20 of ${transactions.length} transactions`, 15, finalY + 8);
  }
}
