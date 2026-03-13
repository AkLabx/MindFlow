const fs = require('fs');

const targetFile = 'src/features/ai/components/SamvadChat.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

// Replace `session.send({ parts: [{ text: "Hello" }] } as any);` with `session.sendClientContent({ turns: "Hello" } as any);`
content = content.replace(
  /session\.send\(\{ parts: \[\{ text: "Hello" \}\] \} as any\);/,
  'session.sendClientContent({ turns: "Hello" } as any);'
);

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Patched " + targetFile);
