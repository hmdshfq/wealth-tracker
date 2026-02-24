import { jsPDF } from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import { formatPLN } from '../../../formatters';
import { Goal, ProjectionDataPoint } from '../../../types';
import { getLastAutoTableFinalY, THEME_COLOR } from '../utils';

export function addProjectionChart(doc: jsPDF, projectionData: ProjectionDataPoint[], goal: Goal) {
  // Add section header
  const currentY = getLastAutoTableFinalY(doc, 20);
  const startY = currentY + 15;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...THEME_COLOR);
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

  autoTable(
    doc,
    {
      startY: startY + 30,
      head: [['Metric', 'Value']],
      body: metrics,
      theme: 'grid',
      headStyles: { fillColor: [...THEME_COLOR], textColor: 255 },
      styles: { cellPadding: 6, fontSize: 10 },
      columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 80 } },
    } as UserOptions
  );
}
