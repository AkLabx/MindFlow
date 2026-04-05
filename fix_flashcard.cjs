const fs = require('fs');
let content = fs.readFileSync('src/features/flashcards/components/Flashcard.tsx', 'utf8');
content = content.replace("import { cn } from '../../../utils/cn';\n", "");
fs.writeFileSync('src/features/flashcards/components/Flashcard.tsx', content, 'utf8');
