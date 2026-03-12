const fs = require('fs');
const path = require('path');

const flashcardNav = path.join(__dirname, 'src/features/flashcards/components/FlashcardNavigationPanel.tsx');
let flashcardContent = fs.readFileSync(flashcardNav, 'utf8');
flashcardContent = flashcardContent.replace(
  `import { generateIdiomsPDF } from '../utils/pdfGenerator';\n`,
  ``
);
flashcardContent = flashcardContent.replace(
  `usePDFGenerator(generateIdiomsPDF);`,
  `usePDFGenerator(() => import('../utils/pdfGenerator').then(m => m.generateIdiomsPDF));`
);
fs.writeFileSync(flashcardNav, flashcardContent, 'utf8');
console.log('patched FlashcardNavigationPanel');

const synonymNav = path.join(__dirname, 'src/features/synonyms/components/SynonymNavigationPanel.tsx');
let synonymContent = fs.readFileSync(synonymNav, 'utf8');
synonymContent = synonymContent.replace(
  `import { generateSynonymPDF } from '../utils/pdfGenerator';\n`,
  ``
);
synonymContent = synonymContent.replace(
  `usePDFGenerator(generateSynonymPDF);`,
  `usePDFGenerator(() => import('../utils/pdfGenerator').then(m => m.generateSynonymPDF));`
);
fs.writeFileSync(synonymNav, synonymContent, 'utf8');
console.log('patched SynonymNavigationPanel');

const owsNav = path.join(__dirname, 'src/features/ows/components/OWSNavigationPanel.tsx');
let owsContent = fs.readFileSync(owsNav, 'utf8');
owsContent = owsContent.replace(
  `import { generateOWSPDF } from '../utils/pdfGenerator';\n`,
  ``
);
owsContent = owsContent.replace(
  `usePDFGenerator(generateOWSPDF);`,
  `usePDFGenerator(() => import('../utils/pdfGenerator').then(m => m.generateOWSPDF));`
);
fs.writeFileSync(owsNav, owsContent, 'utf8');
console.log('patched OWSNavigationPanel');
