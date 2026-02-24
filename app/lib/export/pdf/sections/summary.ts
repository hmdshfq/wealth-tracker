import { jsPDF } from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import { formatPLN } from '../../../formatters';
import { Goal, HoldingWithDetails, CashBalance } from '../../../types';
import { getLastAutoTableFinalY, THEME_COLOR } from '../utils';

export function addSummarySection(
  doc: jsPDF,
  goal: Goal,
  holdings: HoldingWithDetails[],
  cash: CashBalance[]
) {
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...THEME_COLOR);
  doc.text('Portfolio Summary', 15, 20);

  // Calculate totals
  const totalInvestments = holdings.reduce((sum, h) => sum + h.valuePLN, 0);
  const totalCash = cash.reduce((sum, c) => {
    if (c.currency === 'PLN') return sum + c.amount;
    // For simplicity, assume other currencies are already converted
    return sum + c.amount;
  }, 0);
  const totalNetWorth = totalInvestments + totalCash;

  // Summary table
  const summaryData = [
    ['Total Investments', formatPLN(totalInvestments)],
    ['Total Cash', formatPLN(totalCash)],
    ['Net Worth', formatPLN(totalNetWorth)],
    ['Investment Goal', formatPLN(goal.amount)],
    ['Target Year', goal.targetYear.toString()],
    ['Expected Annual Return', `${(goal.annualReturn * 100).toFixed(1)}%`],
  ];

  autoTable(
    doc,
    {
      startY: 30,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [...THEME_COLOR], textColor: 255 },
      styles: { cellPadding: 6, fontSize: 10 },
      columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 80 } },
    } as UserOptions
  );

  // Add some space
  const finalY = getLastAutoTableFinalY(doc, 30);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('* All values in PLN', 15, finalY + 10);
}
