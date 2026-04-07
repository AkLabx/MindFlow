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
rewrite_regex('src/features/quiz/components/QuizConfig.tsx', r'prev\[key\]\.filter\(item => item !== value\)', r'(prev[key] || []).filter((item: string) => item !== value)')
rewrite_regex('src/features/quiz/components/QuizConfig.tsx', r'const current = prev\[key\];', r'const current = prev[key] || [];')
rewrite_regex('src/features/quiz/components/QuizConfig.tsx', r'current\.filter\(i => i !== option\)', r'[...(current as string[])].filter(i => i !== option)')
rewrite_regex('src/features/quiz/components/QuizConfig.tsx', r'\[\.\.\.current, option as any\]', r'[...(current as string[]), option as any]')


# QuizPdfPptGenerator
rewrite_regex('src/features/tools/quiz-pdf-ppt-generator/QuizPdfPptGenerator.tsx', r'prev\[key\]\.filter\(item => item !== value\)', r'(prev[key] || []).filter((item: string) => item !== value)')
rewrite_regex('src/features/tools/quiz-pdf-ppt-generator/QuizPdfPptGenerator.tsx', r'const current = prev\[key\];', r'const current = prev[key] || [];')
rewrite_regex('src/features/tools/quiz-pdf-ppt-generator/QuizPdfPptGenerator.tsx', r'current\.filter\(i => i !== option\)', r'[...(current as string[])].filter(i => i !== option)')
rewrite_regex('src/features/tools/quiz-pdf-ppt-generator/QuizPdfPptGenerator.tsx', r'\[\.\.\.current, option as any\]', r'[...(current as string[]), option as any]')


# ActiveFiltersBar
rewrite_regex('src/features/quiz/components/ui/ActiveFiltersBar.tsx', r'filterCounts\?\.\[key as keyof FilterCounts\]\?\.\[val\]', r'(filterCounts[key as keyof FilterCounts] || {})[val]')


# useOptimizedFilterCounts
rewrite_regex('src/features/quiz/hooks/useOptimizedFilterCounts.ts', r'\(selected \|\| \[\]\)\.includes', r'((selected as string[]) || []).includes')

# useQuestionIndex
rewrite_regex('src/features/quiz/hooks/useQuestionIndex.ts', r'\(selectedValues \|\| \[\]\)\.includes', r'((selectedValues as string[]) || []).includes')


# AppRoutes
rewrite_regex('src/routes/AppRoutes.tsx', r'initialFilters=\{\(savedFilters \? JSON\.parse\(savedFilters\) : defaultOwsFilters\) as InitialFilters\}', r'initialFilters={(savedFilters ? JSON.parse(savedFilters) : defaultOwsFilters) as any}')
rewrite_regex('src/routes/AppRoutes.tsx', r'isOws=\{!!\(location\.state as any\)\?\.isOws\}', r'isOws={!!((location.state as any)?.isOws)}')

# Synonym PdfGenerator
rewrite_regex('src/features/synonyms/utils/pdfGenerator.ts', r'\.map\(\(s: any\) => `• \$\{s\}`\)', r'.map((s: string) => `• ${s}`)')
rewrite_regex('src/features/synonyms/utils/pdfGenerator.ts', r'\.map\(s => `• \$\{s\}`\)', r'.map((s: string) => `• ${s}`)')
