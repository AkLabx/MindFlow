const fs = require('fs');

const path = 'src/features/synonyms/components/SynonymFlashcardSession.tsx';
let content = fs.readFileSync(path, 'utf8');

// Use changedTouches for touchEnd, as targetTouches might be empty.
content = content.replace(
  /const onTouchEndEvent = \(\) => \{/g,
  `const onTouchEndEvent = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const end = e.changedTouches[0].clientX;
    setTouchEnd(end);

    const distance = touchStart - end;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && !isLast) {
      handleNext();
    } else if (isRightSwipe && !isFirst) {
      onPrev();
    }

    // reset
    setTouchStart(null);
    setTouchEnd(null);`
);

// We need to remove the old logic inside onTouchEndEvent.
// The old logic was:
//   const onTouchEndEvent = () => {
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

content = content.replace(
  /const onTouchEndEvent = \(\) => \{\s*if \(!touchStart \|\| !touchEnd\) return;\s*const distance = touchStart - touchEnd;\s*const isLeftSwipe = distance > minSwipeDistance;\s*const isRightSwipe = distance < -minSwipeDistance;\s*if \(isLeftSwipe && !isLast\) \{\s*handleNext\(\);\s*\} else if \(isRightSwipe && !isFirst\) \{\s*onPrev\(\);\s*\}\s*\};/g,
  `const onTouchEndEvent = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const end = e.changedTouches[0].clientX;
    setTouchEnd(end);

    const distance = touchStart - end;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && !isLast) {
      handleNext();
    } else if (isRightSwipe && !isFirst) {
      onPrev();
    }

    // reset
    setTouchStart(null);
    setTouchEnd(null);
  };`
);

fs.writeFileSync(path, content, 'utf8');
console.log("Updated touch end handler!");
