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
rewrite_regex('src/features/quiz/components/QuizConfig.tsx', r'counts=\{filterCounts\.readStatus\s*\|\|\s*\{\}\}', r'counts={filterCounts?.readStatus || {}}')
rewrite_regex('src/features/quiz/components/QuizConfig.tsx', r'const current = prev\.readStatus\s*\|\|\s*\[\];', r'const current = prev.readStatus || [];')
rewrite_regex('src/features/quiz/components/QuizConfig.tsx', r'counts=\{filterCounts\.deckMode\s*\|\|\s*\{\}\}', r'counts={filterCounts?.deckMode || {}}')
rewrite_regex('src/features/quiz/components/QuizConfig.tsx', r'counts=\{filterCounts\?\.readStatus\}', r'counts={filterCounts?.readStatus || {}}')
rewrite_regex('src/features/quiz/components/QuizConfig.tsx', r'counts=\{filterCounts\?\.deckMode\}', r'counts={filterCounts?.deckMode || {}}')

# ActiveFiltersBar
rewrite_regex('src/features/quiz/components/ui/ActiveFiltersBar.tsx', r'const count = filterCounts\?\.\[key as keyof FilterCounts\]\?\.\[val\] \|\| 0;', r'const count = filterCounts?.[key as keyof FilterCounts]?.[val] || 0;')

# useOptimizedFilterCounts
rewrite_regex('src/features/quiz/hooks/useOptimizedFilterCounts.ts', r'if \(selected\?\.includes\(item\[key\] as never\)\)', r'if (selected?.includes(item[key] as never))')
rewrite_regex('src/features/quiz/hooks/useOptimizedFilterCounts.ts', r'if \(selected\?\.includes\(val as never\)\)', r'if (selected?.includes(val as never))')

# useQuestionIndex
rewrite_regex('src/features/quiz/hooks/useQuestionIndex.ts', r'if \(selectedValues && selectedValues\.length > 0 && !selectedValues\.includes\(', r'if (selectedValues && selectedValues.length > 0 && !selectedValues.includes(')
rewrite_regex('src/features/quiz/hooks/useQuestionIndex.ts', r'if \(selectedValues && selectedValues\.length > 0', r'if (selectedValues && selectedValues.length > 0')
rewrite_regex('src/features/quiz/hooks/useQuestionIndex.ts', r'!selectedValues\.includes\(', r'!selectedValues.includes(')

# QuizPdfPptGenerator
rewrite_regex('src/features/tools/quiz-pdf-ppt-generator/QuizPdfPptGenerator.tsx', r'counts=\{filterCounts\?\.readStatus\s*\|\|\s*\{\}\}', r'counts={filterCounts?.readStatus || {}}')
rewrite_regex('src/features/tools/quiz-pdf-ppt-generator/QuizPdfPptGenerator.tsx', r'counts=\{filterCounts\?\.readStatus\}', r'counts={filterCounts?.readStatus || {}}')
rewrite_regex('src/features/tools/quiz-pdf-ppt-generator/QuizPdfPptGenerator.tsx', r'const current = prev\.readStatus\s*\|\|\s*\[\];', r'const current = prev.readStatus || [];')

# AppRoutes
rewrite_regex('src/routes/AppRoutes.tsx', r'initialFilters=\{\(savedFilters \? JSON\.parse\(savedFilters\) : defaultOwsFilters\) as InitialFilters\}', r'initialFilters={(savedFilters ? JSON.parse(savedFilters) : defaultOwsFilters) as InitialFilters}')
rewrite_regex('src/routes/AppRoutes.tsx', r'isOws=\{!!\(location\.state as any\)\?\.isOws\}', r'isOws={!!(location.state as any)?.isOws}')

# Synonym PdfGenerator
rewrite_regex('src/features/synonyms/utils/pdfGenerator.ts', r'\.map\(\(s: string\) => `• \$\{s\}`\)\.join\(\'\\n\'\)', r'.map((s: any) => `• ${s}`).join(\'\\n\')')
