import { jsPDF } from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import { formatPLN } from '../../../formatters';
import { CashBalance, CashTransaction } from '../../../types';
import { getLastAutoTableFinalY, THEME_COLOR } from '../utils';

export function addCashSection(doc: jsPDF, cash: CashBalance[], cashTransactions: CashTransaction[]) {
  // Add section header
  const currentY = getLastAutoTableFinalY(doc, 20);
  const startY = currentY + 15;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...THEME_COLOR);
  doc.text('Cash Balances', 15, startY);

  // Cash balances table
  const cashData = cash.map((c) => [
    c.currency,
    c.amount.toFixed(2),
    formatPLN(c.currency === 'PLN' ? c.amount : c.amount * (c.currency === 'EUR' ? 4.5 : 4.0)),
  ]);

  autoTable(
    doc,
    {
      startY: startY + 10,
      head: [['Currency', 'Amount', 'Value (PLN)']],
      body: cashData,
      theme: 'grid',
      headStyles: { fillColor: [...THEME_COLOR], textColor: 255 },
      styles: { cellPadding: 6, fontSize: 10 },
      columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 80 }, 2: { cellWidth: 80 } },
    } as UserOptions
  );

  // Add cash transactions if any
  if (cashTransactions.length > 0) {
    const finalY = getLastAutoTableFinalY(doc, startY + 10);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...THEME_COLOR);
    doc.text('Recent Cash Transactions', 15, finalY + 15);

    const recentCashTx = [...cashTransactions].reverse().slice(0, 10);
    const cashTxData = recentCashTx.map((t) => [
      t.date,
      t.type,
      t.currency,
      t.amount.toFixed(2),
      t.note || '-',
    ]);

    autoTable(
      doc,
      {
        startY: finalY + 25,
        head: [['Date', 'Type', 'Currency', 'Amount', 'Note']],
        body: cashTxData,
        theme: 'striped',
        headStyles: { fillColor: [...THEME_COLOR], textColor: 255 },
        styles: { cellPadding: 4, fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 30 },
          2: { cellWidth: 25 },
          3: { cellWidth: 30 },
          4: { cellWidth: 45 },
        },
      } as UserOptions
    );
  }
}
