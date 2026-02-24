import { jsPDF } from 'jspdf';

export interface PDFExportOptions {
  title?: string;
  filename?: string;
  includeCharts?: boolean;
  includeSummary?: boolean;
  includeDetailedData?: boolean;
}

export interface AutoTableMetadata {
  finalY?: number;
}

export interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: AutoTableMetadata;
}
