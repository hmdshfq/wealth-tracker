import { jsPDF } from 'jspdf';

export function addTitlePage(doc: jsPDF, title: string) {
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
  doc.text('Financial Portfolio Summary', doc.internal.pageSize.getWidth() / 2, startY + 10, {
    align: 'center',
  });

  // Add date
  doc.setFontSize(12);
  doc.text(
    `Generated: ${new Date().toLocaleDateString()}`,
    doc.internal.pageSize.getWidth() / 2,
    startY + 20,
    { align: 'center' }
  );

  // Add page break
  doc.addPage();
}
