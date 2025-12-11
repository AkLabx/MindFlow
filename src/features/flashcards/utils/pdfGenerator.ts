import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Idiom } from '../../../types/models';
import { PDFGenerationConfig } from '../../../hooks/usePDFGenerator';

// Constants
const PDF_BG_COLOR = '#FFE9E2D2';
const TEXT_COLOR_DARK = '#000000';
const PAGE_MARGIN_X = 15;
const PAGE_MARGIN_Y = 15;

/**
 * Helper to render Hindi text to an image.
 * Duplicated from OWS generator for now to avoid circular deps or complex shared utils,
 * but in a larger refactor could be moved to a shared PDF utils file.
 */
const renderHindiToImage = async (text: string): Promise<string> => {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '500px';
  container.style.backgroundColor = PDF_BG_COLOR;
  container.style.padding = '4px';
  container.style.fontFamily = 'serif';
  container.style.fontSize = '12pt';
  container.style.color = TEXT_COLOR_DARK;
  container.style.lineHeight = '1.5';
  container.innerText = text;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      backgroundColor: PDF_BG_COLOR,
      scale: 2,
      logging: false,
    });
    return canvas.toDataURL('image/jpeg', 0.8);
  } finally {
    document.body.removeChild(container);
  }
};

/**
 * Generates the Idioms PDF.
 */
export const generateIdiomsPDF = async (data: Idiom[], config: PDFGenerationConfig) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - (PAGE_MARGIN_X * 2);
  const halfPageHeight = pageHeight / 2;

  // Set background for the first page
  doc.setFillColor(PDF_BG_COLOR);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const isTop = i % 2 === 0;

    // Add new page if we are starting an odd index (which goes to top) and it's not the first item
    if (i > 0 && isTop) {
      doc.addPage();
      doc.setFillColor(PDF_BG_COLOR);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
    }

    const startY = isTop ? PAGE_MARGIN_Y : halfPageHeight + PAGE_MARGIN_Y;
    let currentY = startY;

    // --- PHRASE (Topic) ---
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(TEXT_COLOR_DARK);

    const phraseText = doc.splitTextToSize(item.content.phrase, contentWidth);
    doc.text(phraseText, PAGE_MARGIN_X, currentY);
    currentY += (doc.getTextDimensions(phraseText).h + 6);

    // Helper to add labeled fields
    const addField = (label: string, content: string | string[], isHindiImage: boolean = false) => {
      // Label
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text(label.toUpperCase(), PAGE_MARGIN_X, currentY);

      currentY += 4;

      if (isHindiImage) {
        return;
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(TEXT_COLOR_DARK);

      const textStr = Array.isArray(content) ? content.join('; ') : content;
      const lines = doc.splitTextToSize(textStr, contentWidth);
      doc.text(lines, PAGE_MARGIN_X, currentY);
      currentY += (doc.getTextDimensions(lines).h + 5);
    };

    // Meaning (English)
    addField('Meaning', item.content.meanings.english);

    // Meaning (Hindi) - IMAGE
    if (item.content.meanings.hindi) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 100);
        doc.text('HINDI MEANING', PAGE_MARGIN_X, currentY);
        currentY += 4;

        const hindiImgData = await renderHindiToImage(item.content.meanings.hindi);

        const imgProps = doc.getImageProperties(hindiImgData);
        // Scale to fit width nicely, similar to OWS
        const finalImgWidth = 100; // 100mm wide
        const finalImgHeight = (imgProps.height * finalImgWidth) / imgProps.width;

        doc.addImage(hindiImgData, 'JPEG', PAGE_MARGIN_X, currentY, finalImgWidth, finalImgHeight);
        currentY += (finalImgHeight + 5);
    }

    // Usage
    if (item.content.usage) {
      addField('Usage', item.content.usage);
    }

    // Origin
    if (item.content.extras.origin) {
      addField('Origin', item.content.extras.origin);
    }

    // Mnemonic
    if (item.content.extras.mnemonic) {
      addField('Mnemonic', item.content.extras.mnemonic);
    }

    // Draw a separator line if it's the top item
    if (isTop) {
       doc.setDrawColor(200, 200, 200);
       // Cast to any because setLineDash is missing from @types/jspdf but exists in the library
       (doc as any).setLineDash([2, 2], 0);
       doc.line(10, halfPageHeight, pageWidth - 10, halfPageHeight);
       (doc as any).setLineDash([], 0);
    }
  }

  doc.save(config.fileName || 'idioms-flashcards.pdf');
};
