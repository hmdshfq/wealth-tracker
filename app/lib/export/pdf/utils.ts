import { jsPDF } from 'jspdf';
import { JsPDFWithAutoTable } from './types';

export const THEME_COLOR = [30, 57, 59] as const;

export const getLastAutoTableFinalY = (doc: jsPDF, fallback: number): number =>
  (doc as JsPDFWithAutoTable).lastAutoTable?.finalY ?? fallback;

export function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();

  // Add footer to each page
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);

    // Left side - generated info
    doc.text(`Generated: ${new Date().toLocaleString()}`, 15, doc.internal.pageSize.getHeight() - 10);

    // Right side - page number
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() - 15,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'right' }
    );

    // Center - disclaimer
    doc.text(
      'This report is for informational purposes only. Not financial advice.',
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Go back to last page
  doc.setPage(pageCount);
}
