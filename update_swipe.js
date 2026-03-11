const fs = require('fs');

const path = 'src/features/synonyms/components/SynonymFlashcardSession.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add touch state variables
const stateHookPos = content.indexOf('const { progress, markMastered, getStatus }');
content = content.slice(0, stateHookPos) +
`  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && !isLast) {
      handleNext();
    } else if (isRightSwipe && !isFirst) {
      onPrev();
    }
  };

` + content.slice(stateHookPos);

// 2. Attach touch handlers to the main content container
const mainContentPos = content.indexOf('<div className="flex-1 overflow-hidden relative p-4 flex flex-col items-center justify-center">');

if (mainContentPos !== -1) {
    const endOfMainContentClass = content.indexOf('>', mainContentPos);
    content = content.slice(0, endOfMainContentClass) +
        ` onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}` +
        content.slice(endOfMainContentClass);
} else {
    console.error("Main content div not found.");
}

fs.writeFileSync(path, content, 'utf8');
console.log("Updated swipe functionality successfully!");
