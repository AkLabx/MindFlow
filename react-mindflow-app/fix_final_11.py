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

# Synonym PdfGenerator
rewrite_regex('src/features/synonyms/utils/pdfGenerator.ts', r'item\.synonyms\.map\(s => s\.text\)', r'item.synonyms.map((s: any) => s.text)')

# AppRoutes
rewrite_regex('src/routes/AppRoutes.tsx', r'initialFilters=\{\(savedFilters \? JSON\.parse\(savedFilters\) : defaultOwsFilters\) as InitialFilters\}', r'initialFilters={savedFilters ? (JSON.parse(savedFilters) as InitialFilters) : defaultOwsFilters}')
rewrite_regex('src/routes/AppRoutes.tsx', r'isOws=\{Boolean\(\(location\.state as any\)\?\.isOws\) \|\| false\}', r'isOws={Boolean((location.state as any)?.isOws)}')
rewrite_regex('src/routes/AppRoutes.tsx', r'isOws=\{!!\(location\.state as any\)\?\.isOws\}', r'isOws={Boolean((location.state as any)?.isOws)}')
