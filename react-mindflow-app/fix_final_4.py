import re

def rewrite_exact(filepath, replacements):
    try:
        with open(filepath, 'r') as f:
            content = f.read()

        for search, replace in replacements:
            content = content.replace(search, replace)

        with open(filepath, 'w') as f:
            f.write(content)
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

rewrite_exact('src/features/synonyms/components/SynonymNavigationPanel.tsx', [
    ('import(\'../utils/pdfGenerator\').then(m => m.generateSynonymPDF)', 'import(\'../utils/pdfGenerator\').then(m => m.generateSynonymPDF as any)')
])

rewrite_exact('src/features/synonyms/utils/pdfGenerator.ts', [
    ('export const generateSynonymPDF = async (data: SynonymWord[], config: PDFGenerationConfig): Promise<Blob> => {', 'export const generateSynonymPDF = async (data: any[], config: PDFGenerationConfig): Promise<Blob> => {')
])

rewrite_exact('src/features/quiz/components/QuizConfig.tsx', [
    ('counts={filterCounts.deckMode}', 'counts={filterCounts.deckMode || {}}')
])
