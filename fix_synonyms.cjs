const fs = require('fs');
let code = fs.readFileSync('src/routes/AppRoutes.tsx', 'utf8');

// Replace the line with enterSynonymsConfig()
code = code.replace(/onSynonymsClick=\{\(\) => navTo\('\/synonyms\/config'\)\}/g, "onSynonymsClick={() => { enterSynonymsConfig(); navTo('/synonyms/config'); }}");

fs.writeFileSync('src/routes/AppRoutes.tsx', code, 'utf8');
