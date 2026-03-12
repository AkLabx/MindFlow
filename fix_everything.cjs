const fs = require('fs');
const path = require('path');

// 1. Fix DB constants
const dbPath = path.join(__dirname, 'src', 'lib', 'db.ts');
let content = fs.readFileSync(dbPath, 'utf8');
if (!content.includes("const ACTIVE_SESSION_STORE = 'active_test_session';")) {
  content = content.replace(
      "const SYNONYM_STORE_NAME = 'synonym_interactions';",
      "const SYNONYM_STORE_NAME = 'synonym_interactions';\nconst ACTIVE_SESSION_STORE = 'active_test_session';"
  );
  fs.writeFileSync(dbPath, content, 'utf8');
}

// 2. Fix MockSession
const mockPath = path.join(__dirname, 'src', 'features', 'quiz', 'mock', 'MockSession.tsx');
let mockContent = fs.readFileSync(mockPath, 'utf8');

if (!mockContent.includes("const { timeLeft, formatTime } = useMockTimer({")) {
    const injectStr = `
    const { timeLeft, formatTime } = useMockTimer({
        totalTime: totalExamTime,
        onTimeUp: () => finishSession()
    });
    `;
    // Find the totalExamTime definition and inject right after it
    mockContent = mockContent.replace(/(const totalExamTime =.*?;\n)/s, `$1${injectStr}\n`);
    fs.writeFileSync(mockPath, mockContent, 'utf8');
}
