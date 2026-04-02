const fs = require('fs');
const file = 'src/features/quiz/services/questionService.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /\.order\('id'\)\s*\n\s*\.order\('id'\)/g,
  `.order('id')`
);

fs.writeFileSync(file, code);
