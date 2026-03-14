const fs = require('fs');

const files = [
  'src/features/ai/chat/useAIChat.ts',
  'src/layouts/MainLayout.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Basic merge conflict resolver that keeps HEAD (since our UI updates from HEAD are more correct and recent)
  content = content.replace(/<<<<<<< HEAD\n([\s\S]*?)=======\n[\s\S]*?>>>>>>> [^\n]+\n/g, '$1');
  // Handle layered conflicts
  content = content.replace(/<<<<<<< HEAD\n([\s\S]*?)=======\n[\s\S]*?>>>>>>> [^\n]+\n/g, '$1');
  content = content.replace(/<<<<<<< HEAD\n/g, '');
  content = content.replace(/=======\n/g, '');
  content = content.replace(/>>>>>>> [^\n]+\n/g, '');

  fs.writeFileSync(file, content);
  console.log('Fixed conflicts in', file);
}
