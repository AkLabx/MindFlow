const fs = require('fs');

let content = fs.readFileSync('src/features/flashcards/components/Flashcard.tsx', 'utf8');

// 1. Add imports
content = content.replace(`import { BookOpen, Lightbulb, Quote, RotateCw } from 'lucide-react';`, `import { BookOpen, Lightbulb, Quote, RotateCw, CheckCircle2, Circle } from 'lucide-react';\nimport { useIdiomProgress } from '../../idioms/hooks/useIdiomProgress';\nimport { cn } from '../../../utils/cn';`);

// 2. Add hook usage
content = content.replace(`export const Flashcard: React.FC<FlashcardProps> = ({ idiom, serialNumber, isFlipped }) => {`, `export const Flashcard: React.FC<FlashcardProps> = ({ idiom, serialNumber, isFlipped }) => {
  const { getReadStatus, toggleReadStatus } = useIdiomProgress();
  const isRead = getReadStatus(idiom);
`);

// 3. Add front face badge
const frontBadge = `
            <div className="absolute top-4 left-4">
              {isRead && (
                <div className="flex items-center gap-1 text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-md text-xs shadow-sm">
                  <CheckCircle2 className="w-3 h-3" /> Read
                </div>
              )}
            </div>
`;
content = content.replace(`<div className="absolute top-4 right-4 text-amber-100">`, frontBadge + `\n          <div className="absolute top-4 right-4 text-amber-100">`);


// 4. Add action button to the back face header
const backActionButton = `
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleReadStatus(idiom);
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95",
                  isRead
                    ? "bg-amber-600 text-white hover:bg-amber-700 ring-2 ring-amber-200"
                    : "bg-white text-gray-500 hover:text-amber-600 hover:bg-amber-50 border border-gray-200"
                )}
              >
                {isRead ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                {isRead ? 'Marked as Read' : 'Mark as Read'}
              </button>
              <div className="text-amber-400">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>`;

content = content.replace(`<div className="text-amber-400">\n              <BookOpen className="w-5 h-5" />\n            </div>`, backActionButton);


fs.writeFileSync('src/features/flashcards/components/Flashcard.tsx', content, 'utf8');
