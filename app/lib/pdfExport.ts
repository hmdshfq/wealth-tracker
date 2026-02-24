/**
 * PDF Export Utilities
 * Generate PDF reports with charts and financial data.
 */

export type { PDFExportOptions } from './export/pdf/types';

export {
  generateInvestmentReportPDF,
  exportGoalProgressChartPDF,
  exportComprehensiveFinancialReport,
  exportSummaryReport,
} from './export/pdf/reports';

/**
 * Helper function to download PDF blob.
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
