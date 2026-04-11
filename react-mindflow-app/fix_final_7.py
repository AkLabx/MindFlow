import re

def rewrite_regex(filepath, regex_search, regex_replace):
    try:
        with open(filepath, 'r') as f:
            content = f.read()

        content = re.sub(regex_search, regex_replace, content)

        with open(filepath, 'w') as f:
            f.write(content)
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

# QuizConfig
rewrite_regex('src/features/quiz/components/QuizConfig.tsx', r'counts=\{filterCounts\.([a-zA-Z0-9]+)\}', r'counts={filterCounts.\1 || {}}')

# ActiveFiltersBar
rewrite_regex('src/features/quiz/components/ui/ActiveFiltersBar.tsx', r'const count = filterCounts\[key as keyof FilterCounts\]\?\.\[val\] \|\| 0;', r'const count = filterCounts?.[key as keyof FilterCounts]?.[val] || 0;')

# useOptimizedFilterCounts
rewrite_regex('src/features/quiz/hooks/useOptimizedFilterCounts.ts', r'selected\.includes', r'(selected || []).includes')

# useQuestionIndex
rewrite_regex('src/features/quiz/hooks/useQuestionIndex.ts', r'selectedValues\.length', r'(selectedValues || []).length')
rewrite_regex('src/features/quiz/hooks/useQuestionIndex.ts', r'selectedValues\.includes', r'(selectedValues || []).includes')

# Synonym PdfGenerator
rewrite_regex('src/features/synonyms/utils/pdfGenerator.ts', r'\.map\(s => `• \$\{s\}`\)', r'.map((s: string) => `• ${s}`)')

# QuizPdfPptGenerator
rewrite_regex('src/features/tools/quiz-pdf-ppt-generator/QuizPdfPptGenerator.tsx', r'counts=\{filterCounts\.([a-zA-Z0-9]+)\}', r'counts={filterCounts.\1 || {}}')
