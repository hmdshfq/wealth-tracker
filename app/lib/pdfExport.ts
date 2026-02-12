/**
 * PDF Export Utilities
 * Generate PDF reports with charts and financial data
 */

import { jsPDF, type jsPDFOptions } from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import { formatPLN } from './formatters';
import { Goal, HoldingWithDetails, Transaction, CashBalance, CashTransaction, ProjectionDataPoint } from './types';

interface PDFExportOptions {
  title?: string;
  filename?: string;
  includeCharts?: boolean;
  includeSummary?: boolean;
  includeDetailedData?: boolean;
}

interface AutoTableMetadata {
  finalY?: number;
}

interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: AutoTableMetadata;
}

const getLastAutoTableFinalY = (doc: jsPDF, fallback: number): number =>
  (doc as JsPDFWithAutoTable).lastAutoTable?.finalY ?? fallback;

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
    filename = `investment-report-${new Date().toISOString().split('T')[0]}`,
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

  // Add projection chart (placeholder - in real implementation would use chart library)
  if (includeCharts && projectionData.length > 0) {
    addProjectionChart(doc, projectionData, goal);
  }

  // Add footer
  addFooter(doc);

  // Return PDF as blob
  return new Promise((resolve) => {
    const pdfBlob = doc.output('blob');
    resolve(pdfBlob);
  });
}

function addTitlePage(doc: jsPDF, title: string) {
  // Save current position
  const startY = doc.internal.pageSize.getHeight() / 2 - 20;

  // Add title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 57, 59); // Dark teal color
  doc.text(title, doc.internal.pageSize.getWidth() / 2, startY, { align: 'center' });

  // Add subtitle
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Financial Portfolio Summary', doc.internal.pageSize.getWidth() / 2, startY + 10, { align: 'center' });

  // Add date
  doc.setFontSize(12);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, doc.internal.pageSize.getWidth() / 2, startY + 20, { align: 'center' });

  // Add page break
  doc.addPage();
}

function addSummarySection(doc: jsPDF, goal: Goal, holdings: HoldingWithDetails[], cash: CashBalance[]) {
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 57, 59);
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

  autoTable(doc, {
    startY: 30,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [30, 57, 59], textColor: 255 },
    styles: { cellPadding: 6, fontSize: 10 },
    columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 80 } },
  } as UserOptions);

  // Add some space
  const finalY = getLastAutoTableFinalY(doc, 30);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('* All values in PLN', 15, finalY + 10);
}

function addHoldingsSection(doc: jsPDF, holdings: HoldingWithDetails[]) {
  if (holdings.length === 0) return;

  // Add section header
  const currentY = getLastAutoTableFinalY(doc, 20);
  const startY = currentY + 15;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 57, 59);
  doc.text('Investment Holdings', 15, startY);

  // Prepare data for table
  const tableData = holdings.map(h => [
    h.ticker,
    h.name,
    h.shares.toFixed(4),
    h.avgCost.toFixed(2),
    h.price.toFixed(2),
    formatPLN(h.valuePLN),
    `${h.gainPercent.toFixed(1)}%`,
  ]);

  autoTable(doc, {
    startY: startY + 10,
    head: [['Ticker', 'Name', 'Shares', 'Avg Cost', 'Price', 'Value', 'Gain %']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [30, 57, 59], textColor: 255 },
    styles: { cellPadding: 4, fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 40 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 20 },
      5: { cellWidth: 30 },
      6: { cellWidth: 20 },
    },
  } as UserOptions);
}

function addTransactionsSection(doc: jsPDF, transactions: Transaction[]) {
  if (transactions.length === 0) return;

  // Add section header
  const currentY = getLastAutoTableFinalY(doc, 20);
  const startY = currentY + 15;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 57, 59);
  doc.text('Transaction History', 15, startY);

  // Prepare data for table (limit to last 20 transactions for PDF)
  const recentTransactions = [...transactions].reverse().slice(0, 20);
  const tableData = recentTransactions.map(t => [
    t.date,
    t.ticker,
    t.action,
    t.shares.toFixed(4),
    `${t.price.toFixed(2)} ${t.currency}`,
    formatPLN(t.shares * t.price * (t.currency === 'PLN' ? 1 : (t.currency === 'EUR' ? 4.5 : 4.0))),
  ]);

  autoTable(doc, {
    startY: startY + 10,
    head: [['Date', 'Ticker', 'Action', 'Shares', 'Price', 'Value (PLN)']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [30, 57, 59], textColor: 255 },
    styles: { cellPadding: 4, fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 20 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 30 },
      5: { cellWidth: 30 },
    },
  } as UserOptions);

  if (transactions.length > 20) {
    const finalY = getLastAutoTableFinalY(doc, startY + 10);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`* Showing ${20} of ${transactions.length} transactions`, 15, finalY + 8);
  }
}

function addCashSection(doc: jsPDF, cash: CashBalance[], cashTransactions: CashTransaction[]) {
  // Add section header
  const currentY = getLastAutoTableFinalY(doc, 20);
  const startY = currentY + 15;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 57, 59);
  doc.text('Cash Balances', 15, startY);

  // Cash balances table
  const cashData = cash.map(c => [
    c.currency,
    c.amount.toFixed(2),
    formatPLN(c.currency === 'PLN' ? c.amount : c.amount * (c.currency === 'EUR' ? 4.5 : 4.0)),
  ]);

  autoTable(doc, {
    startY: startY + 10,
    head: [['Currency', 'Amount', 'Value (PLN)']],
    body: cashData,
    theme: 'grid',
    headStyles: { fillColor: [30, 57, 59], textColor: 255 },
    styles: { cellPadding: 6, fontSize: 10 },
    columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 80 }, 2: { cellWidth: 80 } },
  } as UserOptions);

  // Add cash transactions if any
  if (cashTransactions.length > 0) {
    const finalY = getLastAutoTableFinalY(doc, startY + 10);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 57, 59);
    doc.text('Recent Cash Transactions', 15, finalY + 15);

    const recentCashTx = [...cashTransactions].reverse().slice(0, 10);
    const cashTxData = recentCashTx.map(t => [
      t.date,
      t.type,
      t.currency,
      t.amount.toFixed(2),
      t.note || '-',
    ]);

    autoTable(doc, {
      startY: finalY + 25,
      head: [['Date', 'Type', 'Currency', 'Amount', 'Note']],
      body: cashTxData,
      theme: 'striped',
      headStyles: { fillColor: [30, 57, 59], textColor: 255 },
      styles: { cellPadding: 4, fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 30 },
        2: { cellWidth: 25 },
        3: { cellWidth: 30 },
        4: { cellWidth: 45 },
      },
    } as UserOptions);
  }
}

function addProjectionChart(doc: jsPDF, projectionData: ProjectionDataPoint[], goal: Goal) {
  // Add section header
  const currentY = getLastAutoTableFinalY(doc, 20);
  const startY = currentY + 15;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 57, 59);
  doc.text('Investment Projection', 15, startY);

  // Simple text-based chart representation
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Projection chart would be rendered here in a full implementation', 15, startY + 10);
  doc.text('using a chart library that supports PDF rendering.', 15, startY + 15);

  // Add key metrics
  const currentValue = projectionData[0]?.value || 0;
  const finalValue = projectionData[projectionData.length - 1]?.value || 0;
  const growth = finalValue - currentValue;
  const growthPercent = currentValue > 0 ? (growth / currentValue) * 100 : 0;

  const metrics = [
    ['Start Value', formatPLN(currentValue)],
    ['Projected Final Value', formatPLN(finalValue)],
    ['Projected Growth', formatPLN(growth)],
    ['Growth Percentage', `${growthPercent.toFixed(1)}%`],
    ['Projection Period', `${projectionData.length} months`],
  ];

  autoTable(doc, {
    startY: startY + 30,
    head: [['Metric', 'Value']],
    body: metrics,
    theme: 'grid',
    headStyles: { fillColor: [30, 57, 59], textColor: 255 },
    styles: { cellPadding: 6, fontSize: 10 },
    columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 80 } },
  } as UserOptions);
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();

  // Add footer to each page
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);

    // Left side - generated info
    doc.text(`Generated: ${new Date().toLocaleString()}`, 15, doc.internal.pageSize.getHeight() - 10);

    // Right side - page number
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 15, doc.internal.pageSize.getHeight() - 10, { align: 'right' });

    // Center - disclaimer
    doc.text('This report is for informational purposes only. Not financial advice.', doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  }

  // Go back to last page
  doc.setPage(pageCount);
}

/**
 * Export goal progress chart as PDF
 */
export async function exportGoalProgressChartPDF(
  goal: Goal,
  projectionData: ProjectionDataPoint[],
  currentNetWorth: number,
  totalActualContributions: number,
  options: { filename?: string } = {}
): Promise<Blob> {
  const { filename = `goal-progress-${new Date().toISOString().split('T')[0]}` } = options;

  const pdfOptions: jsPDFOptions = {
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  };

  const doc = new jsPDF(pdfOptions);

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 57, 59);
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

  autoTable(doc, {
    startY: 30,
    body: goalInfo,
    theme: 'plain',
    styles: { cellPadding: 4, fontSize: 10, halign: 'left' },
    columnStyles: { 0: { cellWidth: 'wrap' } },
  } as UserOptions);

  // Chart placeholder
  const tableY = getLastAutoTableFinalY(doc, 30);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Chart visualization would appear here in full implementation', doc.internal.pageSize.getWidth() / 2, tableY + 20, { align: 'center' });

  // Data table
  const dataTable = projectionData
    .filter((_, i) => i % 12 === 0) // Sample every 12 months for PDF
    .map(p => [
      p.date,
      formatPLN(p.value),
      formatPLN(p.cumulativeContributions),
      `${(p.value / goal.amount * 100).toFixed(1)}%`,
    ]);

  autoTable(doc, {
    startY: tableY + 40,
    head: [['Date', 'Projected Value', 'Cumulative Contributions', 'Progress %']],
    body: dataTable,
    theme: 'grid',
    headStyles: { fillColor: [30, 57, 59], textColor: 255 },
    styles: { cellPadding: 4, fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 40 },
      2: { cellWidth: 40 },
      3: { cellWidth: 20 },
    },
  } as UserOptions);

  // Footer
  addFooter(doc);

  return new Promise((resolve) => {
    const pdfBlob = doc.output('blob');
    resolve(pdfBlob);
  });
}

/**
 * Export comprehensive financial report
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
 * Export summary report (quick overview)
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
  doc.setTextColor(30, 57, 59);
  doc.text('Financial Summary', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

  // Summary section
  addSummarySection(doc, goal, holdings, cash);

  // Holdings summary
  const totalInvestments = holdings.reduce((sum, h) => sum + h.valuePLN, 0);
  const holdingsSummary = holdings.map(h => [
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
    headStyles: { fillColor: [30, 57, 59], textColor: 255 },
    styles: { cellPadding: 4, fontSize: 10 },
  });

  // Footer
  addFooter(doc);

  return new Promise((resolve) => {
    const pdfBlob = doc.output('blob');
    resolve(pdfBlob);
  });
}

/**
 * Helper function to download PDF blob
 */
export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
