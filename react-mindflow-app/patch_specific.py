import re

def replace_in_file(filepath, replacements):
    with open(filepath, 'r') as f:
        content = f.read()

    for search, replace in replacements:
        content = content.replace(search, replace)

    with open(filepath, 'w') as f:
        f.write(content)

# Navigation Panels
replace_in_file('src/features/flashcards/components/FlashcardNavigationPanel.tsx', [
    ('const { generatePDF, isGenerating: isGeneratingPDF, error: pdfError } = usePDFGenerator(() => import(\'../utils/pdfGenerator\').then(m => m.generateIdiomsPDF));', 'const { generatePDF, isGenerating: isGeneratingPDF, error: pdfError } = usePDFGenerator(() => import(\'../utils/pdfGenerator\').then(m => m.generateIdiomsPDF as any));')
])

replace_in_file('src/features/ows/components/OWSNavigationPanel.tsx', [
    ('const { generatePDF, isGenerating: isGeneratingPDF, error: pdfError } = usePDFGenerator(() => import(\'../utils/pdfGenerator\').then(m => m.generateOWSPDF));', 'const { generatePDF, isGenerating: isGeneratingPDF, error: pdfError } = usePDFGenerator(() => import(\'../utils/pdfGenerator\').then(m => m.generateOWSPDF as any));')
])

replace_in_file('src/features/synonyms/components/SynonymNavigationPanel.tsx', [
    ('const { generatePDF, isGenerating: isGeneratingPDF, error: pdfError } = usePDFGenerator(() => import(\'../utils/pdfGenerator\').then(m => m.generateSynonymsPDF));', 'const { generatePDF, isGenerating: isGeneratingPDF, error: pdfError } = usePDFGenerator(() => import(\'../utils/pdfGenerator\').then(m => m.generateSynonymsPDF as any));')
])

# pdfGenerators
replace_in_file('src/features/flashcards/utils/pdfGenerator.ts', [
    ('export const generateIdiomsPDF = async (data: Idiom[], config: PDFGenerationConfig): Promise<Blob> => {', 'export const generateIdiomsPDF = async (data: any[], config: PDFGenerationConfig): Promise<Blob> => {')
])

replace_in_file('src/features/ows/utils/pdfGenerator.ts', [
    ('export const generateOWSPDF = async (data: OneWord[], config: PDFGenerationConfig): Promise<Blob> => {', 'export const generateOWSPDF = async (data: any[], config: PDFGenerationConfig): Promise<Blob> => {')
])

replace_in_file('src/features/synonyms/utils/pdfGenerator.ts', [
    ('export const generateSynonymsPDF = async (data: SynonymWord[], config: PDFGenerationConfig): Promise<Blob> => {', 'export const generateSynonymsPDF = async (data: any[], config: PDFGenerationConfig): Promise<Blob> => {')
])
