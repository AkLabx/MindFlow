const fs = require('fs');

const path = 'src/features/synonyms/components/SynonymFlashcardSession.tsx';
let content = fs.readFileSync(path, 'utf8');

// Use changedTouches for touchend, and targetTouches/touches for start/move.

content = content.replace(
  /const onTouchEndEvent = \(e: React\.TouchEvent\) => \{[\s\S]*?setTouchEnd\(null\);\n  \};/g,
  `const onTouchEndEvent = (e: React.TouchEvent) => {
    if (!touchStart) return;

    // Use changedTouches for the end position as touches might be empty.
    const end = e.changedTouches[0].clientX;
    console.log("Swipe end:", end, "start:", touchStart);
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
