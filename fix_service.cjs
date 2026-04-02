const fs = require('fs');
const file = 'src/features/quiz/services/questionService.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /\.select\(columnsToSelect\)\s*\n\s*\.range\(from, from \+ limit - 1\);/g,
  `.select(columnsToSelect)\n        .order('id')\n        .range(from, from + limit - 1);`
);

code = code.replace(
  /return allRows\.map\(\(row\) => \(\{/g,
  `  // Deduplicate by v1_id to ensure no duplicate questions in the UI
  const uniqueRows = Array.from(new Map(allRows.map(item => [item.v1_id || item.id, item])).values());

  return uniqueRows.map((row) => ({`
);

code = code.replace(
  /return \(allData as QuestionDBRow\[\]\)\.map\(\(row\) => \(\{/g,
  `// Deduplicate full questions by v1_id in case there are still DB duplicates
  const uniqueFullQuestions = Array.from(new Map((allData as QuestionDBRow[]).map(item => [item.v1_id || item.id, item])).values());

  return uniqueFullQuestions.map((row) => ({`
);

fs.writeFileSync(file, code);
