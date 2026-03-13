const fs = require('fs');

const targetFile = 'src/features/ai/components/SamvadChat.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

// I notice the error log might contain info why the session closed.
// Let's modify SamvadChat to log `e.code` and `e.reason` in `onclose`.
content = content.replace(
  /console\.log\("Session closed:", e\);/,
  'console.log("Session closed:", e.code, e.reason);'
);

// Also try the standard 2.5-flash
content = content.replace(
  /model: 'gemini-2.5-flash-lite'/,
  "model: 'gemini-2.0-flash-exp'"
);

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Patched model to gemini-2.0-flash-exp and updated logging in " + targetFile);
