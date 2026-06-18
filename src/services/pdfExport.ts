import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Exports a target DOM element to a multi-page PDF.
 * @param element The DOM element to capture.
 * @param filename The name of the saved PDF file.
 */
export async function exportToPDF(element: HTMLElement, filename: string = 'llm-chat.pdf'): Promise<void> {
  if (!element) {
    throw new Error('No element provided for PDF export');
  }

  // Store original style adjustments to restore them later
  const originalWidth = element.style.width;
  const originalMaxWidth = element.style.maxWidth;
  const originalOverflow = element.style.overflow;

  // Temporarily optimize layout for PDF capture
  element.style.width = '800px';
  element.style.maxWidth = '800px';
  element.style.overflow = 'visible';

  try {
    // Generate canvas from elements
    const canvas = await html2canvas(element, {
      scale: 2, // High DPI rendering
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff', // Neutral print background
      windowWidth: 800,
    });

    // Restore original CSS layout styles
    element.style.width = originalWidth;
    element.style.maxWidth = originalMaxWidth;
    element.style.overflow = originalOverflow;

    // PDF configuration (A4 paper dimensions: 210mm x 297mm)
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = 210;
    const pdfHeight = 297;
    const margin = 15; // 15mm margins
    const contentWidth = pdfWidth - margin * 2;
    const contentHeight = pdfHeight - margin * 2;

    // Map canvas height to A4 scale
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * contentWidth) / canvas.width;

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    let heightLeft = imgHeight;
    let position = margin;

    // Add first page
    pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
    heightLeft -= contentHeight;

    // Add subsequent pages if content overflows the height limit
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
      heightLeft -= contentHeight;
    }

    pdf.save(filename);
  } catch (error) {
    // Make sure styles are restored even if generation crashes
    element.style.width = originalWidth;
    element.style.maxWidth = originalMaxWidth;
    element.style.overflow = originalOverflow;
    console.error('PDF export failed:', error);
    throw error;
  }
}
export default exportToPDF;
