const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'src', 'lib', 'db.ts');
let content = fs.readFileSync(dbPath, 'utf8');

if (!content.includes("const ACTIVE_SESSION_STORE = 'active_test_session';")) {
  content = content.replace(
      "const SYNONYM_STORE_NAME = 'synonym_progress';",
      "const SYNONYM_STORE_NAME = 'synonym_progress';\nconst ACTIVE_SESSION_STORE = 'active_test_session';"
  );
  fs.writeFileSync(dbPath, content, 'utf8');
}
