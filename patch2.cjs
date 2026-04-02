const fs = require('fs');
const file = 'src/features/quiz/services/questionService.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /\.select\(columnsToSelect\)\n\s*\.range\(from, from \+ limit - 1\);/g,
  ".select(columnsToSelect)\n        .order('id')\n        .range(from, from + limit - 1);"
);

// Add deduplication logic at the end of fetchQuestionMetadata
code = code.replace(
  /return allRows\.map\(\(row\) => \(\{/,
  `  // Deduplicate by v1_id to ensure no duplicate questions in the UI
  const uniqueRows = Array.from(new Map(allRows.map(item => [item.v1_id || item.id, item])).values());

  return uniqueRows.map((row) => ({`
);

fs.writeFileSync(file, code);
