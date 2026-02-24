import { jsPDF } from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import { formatPLN } from '../../../formatters';
import { HoldingWithDetails } from '../../../types';
import { getLastAutoTableFinalY, THEME_COLOR } from '../utils';

export function addHoldingsSection(doc: jsPDF, holdings: HoldingWithDetails[]) {
  if (holdings.length === 0) return;

  // Add section header
  const currentY = getLastAutoTableFinalY(doc, 20);
  const startY = currentY + 15;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...THEME_COLOR);
  doc.text('Investment Holdings', 15, startY);

  // Prepare data for table
  const tableData = holdings.map((h) => [
    h.ticker,
    h.name,
    h.shares.toFixed(4),
    h.avgCost.toFixed(2),
    h.price.toFixed(2),
    formatPLN(h.valuePLN),
    `${h.gainPercent.toFixed(1)}%`,
  ]);

  autoTable(
    doc,
    {
      startY: startY + 10,
      head: [['Ticker', 'Name', 'Shares', 'Avg Cost', 'Price', 'Value', 'Gain %']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [...THEME_COLOR], textColor: 255 },
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
    } as UserOptions
  );
}
