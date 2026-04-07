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
rewrite_regex('src/features/quiz/components/ui/ActiveFiltersBar.tsx', r'const count = \(filterCounts\[key as keyof FilterCounts\] \|\| \{\}\)\[val\] \|\| 0;', r'const count = (filterCounts && filterCounts[key as keyof FilterCounts] ? filterCounts[key as keyof FilterCounts][val] : 0) || 0;')

# useOptimizedFilterCounts
rewrite_regex('src/features/quiz/hooks/useOptimizedFilterCounts.ts', r'if \(selected\?\.includes\(item\[key\] as never\)\)', r'if ((selected as string[] || []).includes(item[key] as never))')
rewrite_regex('src/features/quiz/hooks/useOptimizedFilterCounts.ts', r'if \(selected\?\.includes\(val as never\)\)', r'if ((selected as string[] || []).includes(val as never))')

# useQuestionIndex
rewrite_regex('src/features/quiz/hooks/useQuestionIndex.ts', r'!selectedValues\.includes', r'!(selectedValues || []).includes')

# AppRoutes
rewrite_regex('src/routes/AppRoutes.tsx', r'initialFilters=\{\(savedFilters \? JSON\.parse\(savedFilters\) : defaultOwsFilters\) as any\}', r'initialFilters={(savedFilters ? JSON.parse(savedFilters) : defaultOwsFilters) as InitialFilters}')
rewrite_regex('src/routes/AppRoutes.tsx', r'isOws=\{!!\(\(location\.state as any\)\?\.isOws\)\}', r'isOws={Boolean((location.state as any)?.isOws)}')

# Synonym PdfGenerator
rewrite_regex('src/features/synonyms/utils/pdfGenerator.ts', r'\.map\(\(s: any\) => `• \$\{s\}`\)', r'.map((s: string) => `• ${s}`)')
