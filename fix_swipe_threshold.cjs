const fs = require('fs');

const path = 'src/features/synonyms/components/SynonymFlashcardSession.tsx';
let content = fs.readFileSync(path, 'utf8');

// I notice minSwipeDistance is 50, let's just make sure it's doing the swipe logic by printing console logs.
content = content.replace(
  /const distance = touchStart - end;/g,
  `const distance = touchStart - end;
    console.log("Swipe distance:", distance);`
);

fs.writeFileSync(path, content, 'utf8');
console.log("Added debug logging for swipes!");
