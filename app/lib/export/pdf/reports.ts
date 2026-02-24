import { jsPDF, type jsPDFOptions } from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import { formatPLN } from '../../formatters';
import {
  Goal,
  HoldingWithDetails,
  Transaction,
  CashBalance,
  CashTransaction,
  ProjectionDataPoint,
} from '../../types';
import { PDFExportOptions } from './types';
import { getLastAutoTableFinalY, addFooter, THEME_COLOR } from './utils';
import { addTitlePage } from './sections/title';
import { addSummarySection } from './sections/summary';
import { addHoldingsSection } from './sections/holdings';
import { addTransactionsSection } from './sections/transactions';
import { addCashSection } from './sections/cash';
import { addProjectionChart } from './sections/projection';

export async function generateInvestmentReportPDF(
  goal: Goal,
  holdings: HoldingWithDetails[],
  transactions: Transaction[],
  cash: CashBalance[],
  cashTransactions: CashTransaction[],
  projectionData: ProjectionDataPoint[],
  options: PDFExportOptions = {}
): Promise<Blob> {
  const {
    title = 'Investment Portfolio Report',
    includeCharts = true,
    includeSummary = true,
    includeDetailedData = true,
  } = options;

  // Create PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Add title page
  addTitlePage(doc, title);

  // Add summary section
  if (includeSummary) {
    addSummarySection(doc, goal, holdings, cash);
  }

  // Add holdings section
  if (includeDetailedData) {
    addHoldingsSection(doc, holdings);
  }

  // Add transactions section
  if (includeDetailedData) {
    addTransactionsSection(doc, transactions);
  }

  // Add cash section
  if (includeDetailedData) {
    addCashSection(doc, cash, cashTransactions);
  }

  // Add projection chart
  if (includeCharts && projectionData.length > 0) {
    addProjectionChart(doc, projectionData, goal);
  }

  // Add footer
  addFooter(doc);

  return Promise.resolve(doc.output('blob'));
}

/**
 * Export goal progress chart as PDF.
 */
export async function exportGoalProgressChartPDF(
  goal: Goal,
  projectionData: ProjectionDataPoint[],
  currentNetWorth: number,
  totalActualContributions: number,
  options: { filename?: string } = {}
): Promise<Blob> {
  const pdfOptions: jsPDFOptions = {
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  };

  const doc = new jsPDF(pdfOptions);

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...THEME_COLOR);
  doc.text('Investment Goal Progress', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

  // Goal info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);

  const goalInfo = [
    [`Goal Amount: ${formatPLN(goal.amount)}`],
    [`Current Value: ${formatPLN(currentNetWorth)}`],
    [`Contributions: ${formatPLN(totalActualContributions)}`],
    [`Target Year: ${goal.targetYear}`],
    [`Expected Return: ${(goal.annualReturn * 100).toFixed(1)}%`],
  ];

  autoTable(
    doc,
    {
      startY: 30,
      body: goalInfo,
      theme: 'plain',
      styles: { cellPadding: 4, fontSize: 10, halign: 'left' },
      columnStyles: { 0: { cellWidth: 'wrap' } },
    } as UserOptions
  );

  // Chart placeholder
  const tableY = getLastAutoTableFinalY(doc, 30);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(
    'Chart visualization would appear here in full implementation',
    doc.internal.pageSize.getWidth() / 2,
    tableY + 20,
    { align: 'center' }
  );

  // Data table
  const dataTable = projectionData
    .filter((_, i) => i % 12 === 0) // Sample every 12 months for PDF
    .map((p) => [
      p.date,
      formatPLN(p.value),
      formatPLN(p.cumulativeContributions),
      `${((p.value / goal.amount) * 100).toFixed(1)}%`,
    ]);

  autoTable(
    doc,
    {
      startY: tableY + 40,
      head: [['Date', 'Projected Value', 'Cumulative Contributions', 'Progress %']],
      body: dataTable,
      theme: 'grid',
      headStyles: { fillColor: [...THEME_COLOR], textColor: 255 },
      styles: { cellPadding: 4, fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 40 },
        2: { cellWidth: 40 },
        3: { cellWidth: 20 },
      },
    } as UserOptions
  );

  // Footer
  addFooter(doc);

  return Promise.resolve(doc.output('blob'));
}

/**
 * Export comprehensive financial report.
 */
export async function exportComprehensiveFinancialReport(
  goal: Goal,
  holdings: HoldingWithDetails[],
  transactions: Transaction[],
  cash: CashBalance[],
  cashTransactions: CashTransaction[],
  projectionData: ProjectionDataPoint[],
  options: PDFExportOptions = {}
): Promise<Blob> {
  return generateInvestmentReportPDF(
    goal,
    holdings,
    transactions,
    cash,
    cashTransactions,
    projectionData,
    { ...options, includeCharts: true, includeSummary: true, includeDetailedData: true }
  );
}

/**
 * Export summary report (quick overview).
 */
export async function exportSummaryReport(
  goal: Goal,
  holdings: HoldingWithDetails[],
  cash: CashBalance[],
  options: PDFExportOptions = {}
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...THEME_COLOR);
  doc.text('Financial Summary', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

  // Summary section
  addSummarySection(doc, goal, holdings, cash);

  // Holdings summary
  const holdingsSummary = holdings.map((h) => [
    h.ticker,
    h.name,
    formatPLN(h.valuePLN),
    `${h.gainPercent.toFixed(1)}%`,
  ]);

  const holdingsStartY = getLastAutoTableFinalY(doc, 0) + 10;

  autoTable(doc, {
    startY: holdingsStartY,
    head: [['Ticker', 'Name', 'Value', 'Gain %']],
    body: holdingsSummary,
    theme: 'striped',
    headStyles: { fillColor: [...THEME_COLOR], textColor: 255 },
    styles: { cellPadding: 4, fontSize: 10 },
  });

  // Footer
  addFooter(doc);

  return Promise.resolve(doc.output('blob'));
}
