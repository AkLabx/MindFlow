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

# ActiveFiltersBar
rewrite_regex('src/features/quiz/components/ui/ActiveFiltersBar.tsx', r'return filters\[key as keyof InitialFilters\]\.map\(val => \(', r'return (filters[key as keyof InitialFilters] || []).map(val => (')

# useOptimizedFilterCounts
rewrite_regex('src/features/quiz/hooks/useOptimizedFilterCounts.ts', r'if \(selected\.length === 0\) continue;', r'if ((selected || []).length === 0) continue;')
rewrite_regex('src/features/quiz/hooks/useOptimizedFilterCounts.ts', r'selected\.forEach\(val => \{', r'(selected || []).forEach(val => {')

# useQuestionIndex
rewrite_regex('src/features/quiz/hooks/useQuestionIndex.ts', r'selectedValues\.forEach\(val => \{', r'(selectedValues || []).forEach(val => {')

# Synonym PdfGenerator
rewrite_regex('src/features/synonyms/utils/pdfGenerator.ts', r'\.map\(s => `• \$\{s\}`\)', r'.map((s: string) => `• ${s}`)')

# AppRoutes
rewrite_regex('src/routes/AppRoutes.tsx', r'isOws=\{Boolean\(\(location\.state as any\)\?\.isOws\)\}', r'isOws={Boolean((location.state as any)?.isOws) || false}')
