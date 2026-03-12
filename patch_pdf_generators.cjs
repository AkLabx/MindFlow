const fs = require('fs');
const path = require('path');

function patchGenerator(filepath, targetFuncLine, replaceFuncLine) {
  let content = fs.readFileSync(filepath, 'utf8');

  // Replace static imports with type-only imports
  content = content.replace(/import jsPDF from 'jspdf';\n/, "import type { jsPDF } from 'jspdf';\n");
  content = content.replace(/import html2canvas from 'html2canvas';\n/, ""); // Remove static import

  // Update renderHindiToImage to dynamically import html2canvas
  content = content.replace(
    /const canvas = await html2canvas\(container, {/,
    `const html2canvasModule = await import('html2canvas');
    const html2canvas = html2canvasModule.default;
    const canvas = await html2canvas(container, {`
  );

  // Update the generator function to dynamically import jsPDF
  content = content.replace(
    targetFuncLine,
    replaceFuncLine + `\n  const { jsPDF } = await import('jspdf');\n`
  );

  fs.writeFileSync(filepath, content, 'utf8');
}

patchGenerator(
  path.join(__dirname, 'src/features/flashcards/utils/pdfGenerator.ts'),
  /export const generateIdiomsPDF = async \(data: Idiom\[\], config: PDFGenerationConfig\): Promise<Blob> => {/,
  `export const generateIdiomsPDF = async (data: Idiom[], config: PDFGenerationConfig): Promise<Blob> => {`
);
console.log('patched flashcards pdfGenerator');

patchGenerator(
  path.join(__dirname, 'src/features/synonyms/utils/pdfGenerator.ts'),
  /export const generateSynonymPDF = async \(data: SynonymWord\[\], config: PDFGenerationConfig\): Promise<Blob> => {/,
  `export const generateSynonymPDF = async (data: SynonymWord[], config: PDFGenerationConfig): Promise<Blob> => {`
);
console.log('patched synonyms pdfGenerator');

patchGenerator(
  path.join(__dirname, 'src/features/ows/utils/pdfGenerator.ts'),
  /export const generateOWSPDF = async \(data: OneWord\[\], config: PDFGenerationConfig\): Promise<Blob> => {/,
  `export const generateOWSPDF = async (data: OneWord[], config: PDFGenerationConfig): Promise<Blob> => {`
);
console.log('patched ows pdfGenerator');
