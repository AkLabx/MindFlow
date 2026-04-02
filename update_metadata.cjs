const fs = require('fs');
const file = 'src/features/quiz/services/questionService.ts';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes("uniqueRows")) {
  code = code.replace(
    /return allRows\.map\(\(row\) => \(\{/g,
    `// Deduplicate by v1_id to ensure no duplicate questions in the UI
  const uniqueRows = Array.from(new Map(allRows.map(item => [item.v1_id || item.id, item])).values());

  return uniqueRows.map((row) => ({`
  );
}

if (!code.includes(".order('id')")) {
  code = code.replace(
    /\.select\(columnsToSelect\)\r?\n\s*\.range\(from, from \+ limit - 1\);/g,
    `.select(columnsToSelect)
        .order('id')
        .range(from, from + limit - 1);`
  );
  if (!code.includes(".order('id')")) {
      code = code.replace(
          /range\(from, from \+ limit - 1\)/g,
          `order('id').range(from, from + limit - 1)`
      )
  }
}

fs.writeFileSync(file, code);
