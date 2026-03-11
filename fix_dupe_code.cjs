const fs = require('fs');

const path = 'src/features/synonyms/components/SynonymFlashcardSession.tsx';
let content = fs.readFileSync(path, 'utf8');

// There's a duplicate block of code inside the component:
//     if (!touchStart || !touchEnd) return;
//
//     const distance = touchStart - touchEnd;
//     const isLeftSwipe = distance > minSwipeDistance;
//     const isRightSwipe = distance < -minSwipeDistance;
//
//     if (isLeftSwipe && !isLast) {
//       handleNext();
//     } else if (isRightSwipe && !isFirst) {
//       onPrev();
//     }
//   };

const duplicate = `    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && !isLast) {
      handleNext();
    } else if (isRightSwipe && !isFirst) {
      onPrev();
    }
  };`;

content = content.replace(duplicate, "");

fs.writeFileSync(path, content, 'utf8');
console.log("Removed duplicate code block!");
